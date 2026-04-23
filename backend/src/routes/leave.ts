import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../middleware/auth';
import pool from '../config/database';
import { LeaveRecord, PublicHoliday, ClosedDate } from '../types/models';
import { calculateBusinessDays, checkLeaveOverlap } from '../business-logic/calculations';

const router = Router();

// All leave routes require authentication
router.use(isAuthenticated);

// GET /api/leave - List leave records with pagination and recalculated business days
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 1000);
    const offset = parseInt(req.query.offset as string) || 0;
    
    // Fetch public holidays
    const holidaysResult = await pool.query(
      'SELECT id, name, date, created_at, updated_at FROM public_holidays'
    );
    const holidays: PublicHoliday[] = holidaysResult.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      date: new Date(row.date),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));

    // Fetch closed dates
    const closedResult = await pool.query(
      'SELECT id, start_date, end_date, note, created_at, updated_at FROM closed_dates'
    );
    const closedDates: ClosedDate[] = closedResult.rows.map((row: any) => ({
      id: row.id,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      note: row.note,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));

    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) FROM leave_records');
    const total = parseInt(countResult.rows[0].count);

    // Fetch leave records with pagination
    const result = await pool.query(
      `SELECT 
        id, 
        user_id, 
        start_date, 
        end_date, 
        business_days, 
        created_at, 
        updated_at 
      FROM leave_records 
      ORDER BY created_at DESC, start_date DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    // Recalculate business days for each leave record
    const leaveRecords = result.rows.map((row: any) => {
      const startDate = new Date(row.start_date);
      const endDate = new Date(row.end_date);
      const recalculatedBusinessDays = calculateBusinessDays(startDate, endDate, holidays, closedDates);
      
      // Update database if business days changed
      if (recalculatedBusinessDays !== row.business_days) {
        pool.query(
          'UPDATE leave_records SET business_days = $1 WHERE id = $2',
          [recalculatedBusinessDays, row.id]
        ).catch(err => console.error('Error updating business days:', err));
      }

      return {
        id: row.id,
        userId: row.user_id,
        startDate: row.start_date,
        endDate: row.end_date,
        businessDays: recalculatedBusinessDays,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    return res.json({ 
      leaveRecords,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching leave records:', error);
    return res.status(500).json({ error: 'Failed to fetch leave records' });
  }
});

// POST /api/leave - Create leave record
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, startDate, endDate } = req.body;

    // Validate required fields
    if (!userId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, startDate, endDate' 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate date range
    if (start > end) {
      return res.status(400).json({ 
        error: 'Start date must be before or equal to end date' 
      });
    }

    // Verify user exists
    const userResult = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ 
        error: 'User does not exist' 
      });
    }

    // Fetch public holidays
    const holidaysResult = await pool.query(
      'SELECT id, name, date, created_at, updated_at FROM public_holidays'
    );
    const holidays: PublicHoliday[] = holidaysResult.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      date: new Date(row.date),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));

    // Fetch closed dates
    const closedResult = await pool.query(
      'SELECT id, start_date, end_date, note, created_at, updated_at FROM closed_dates'
    );
    const closedDates: ClosedDate[] = closedResult.rows.map((row: any) => ({
      id: row.id,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      note: row.note,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));

    // Calculate business days
    const businessDays = calculateBusinessDays(start, end, holidays, closedDates);

    // Validate business days > 0
    if (businessDays <= 0) {
      return res.status(400).json({ 
        error: 'Leave period must contain at least one business day' 
      });
    }

    // Insert leave record
    const result = await pool.query(
      `INSERT INTO leave_records (user_id, start_date, end_date, business_days)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, start_date, end_date, business_days, created_at, updated_at`,
      [userId, start, end, businessDays]
    );

    const leaveRecord = {
      id: result.rows[0].id,
      userId: result.rows[0].user_id,
      startDate: result.rows[0].start_date,
      endDate: result.rows[0].end_date,
      businessDays: result.rows[0].business_days,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    };

    return res.status(201).json({ 
      leaveRecord,
      message: 'Leave record created successfully' 
    });
  } catch (error) {
    console.error('Error creating leave record:', error);
    return res.status(500).json({ error: 'Failed to create leave record' });
  }
});

// PUT /api/leave/:id - Update leave record
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, startDate, endDate } = req.body;

    // Check if leave record exists
    const existingResult = await pool.query(
      'SELECT id FROM leave_records WHERE id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Leave record not found' });
    }

    // Validate required fields
    if (!userId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, startDate, endDate' 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate date range
    if (start > end) {
      return res.status(400).json({ 
        error: 'Start date must be before or equal to end date' 
      });
    }

    // Verify user exists
    const userResult = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ 
        error: 'User does not exist' 
      });
    }

    // Fetch public holidays
    const holidaysResult = await pool.query(
      'SELECT id, name, date, created_at, updated_at FROM public_holidays'
    );
    const holidays: PublicHoliday[] = holidaysResult.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      date: new Date(row.date),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));

    // Fetch closed dates
    const closedResult = await pool.query(
      'SELECT id, start_date, end_date, note, created_at, updated_at FROM closed_dates'
    );
    const closedDates: ClosedDate[] = closedResult.rows.map((row: any) => ({
      id: row.id,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      note: row.note,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));

    // Calculate business days
    const businessDays = calculateBusinessDays(start, end, holidays, closedDates);

    // Validate business days > 0
    if (businessDays <= 0) {
      return res.status(400).json({ 
        error: 'Leave period must contain at least one business day' 
      });
    }

    // Update leave record
    const result = await pool.query(
      `UPDATE leave_records 
       SET user_id = $1, start_date = $2, end_date = $3, business_days = $4
       WHERE id = $5
       RETURNING id, user_id, start_date, end_date, business_days, created_at, updated_at`,
      [userId, start, end, businessDays, id]
    );

    const leaveRecord = {
      id: result.rows[0].id,
      userId: result.rows[0].user_id,
      startDate: result.rows[0].start_date,
      endDate: result.rows[0].end_date,
      businessDays: result.rows[0].business_days,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    };

    return res.json({ 
      leaveRecord,
      message: 'Leave record updated successfully' 
    });
  } catch (error) {
    console.error('Error updating leave record:', error);
    return res.status(500).json({ error: 'Failed to update leave record' });
  }
});

// DELETE /api/leave/:id - Delete leave record
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if leave record exists
    const existingResult = await pool.query(
      'SELECT id FROM leave_records WHERE id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Leave record not found' });
    }

    // Delete leave record
    await pool.query('DELETE FROM leave_records WHERE id = $1', [id]);

    return res.json({ 
      message: 'Leave record deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting leave record:', error);
    return res.status(500).json({ error: 'Failed to delete leave record' });
  }
});

// POST /api/leave/calculate-business-days - Calculate business days for date range
router.post('/calculate-business-days', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.body;

    // Validate required fields
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required fields: startDate, endDate' 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate date range
    if (start > end) {
      return res.status(400).json({ 
        error: 'Start date must be before or equal to end date' 
      });
    }

    // Fetch public holidays
    const holidaysResult = await pool.query(
      'SELECT id, name, date, created_at, updated_at FROM public_holidays'
    );
    const holidays: PublicHoliday[] = holidaysResult.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      date: new Date(row.date),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));

    // Fetch closed dates
    const closedResult = await pool.query(
      'SELECT id, start_date, end_date, note, created_at, updated_at FROM closed_dates'
    );
    const closedDates: ClosedDate[] = closedResult.rows.map((row: any) => ({
      id: row.id,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      note: row.note,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));

    // Calculate business days
    const businessDays = calculateBusinessDays(start, end, holidays, closedDates);

    return res.json({ 
      startDate: start,
      endDate: end,
      businessDays,
      message: 'Business days calculated successfully' 
    });
  } catch (error) {
    console.error('Error calculating business days:', error);
    return res.status(500).json({ error: 'Failed to calculate business days' });
  }
});

// POST /api/leave/check-overlap - Check for overlapping leave
router.post('/check-overlap', async (req: Request, res: Response) => {
  try {
    const { userId, startDate, endDate, excludeLeaveId } = req.body;

    // Validate required fields
    if (!userId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, startDate, endDate' 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate date range
    if (start > end) {
      return res.status(400).json({ 
        error: 'Start date must be before or equal to end date' 
      });
    }

    // Fetch all leave records for the user
    const leaveResult = await pool.query(
      `SELECT 
        id, 
        user_id, 
        start_date, 
        end_date, 
        business_days, 
        created_at, 
        updated_at 
      FROM leave_records 
      WHERE user_id = $1`,
      [userId]
    );

    let existingLeave: LeaveRecord[] = leaveResult.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      businessDays: row.business_days,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));

    // Exclude the current leave record if updating
    if (excludeLeaveId) {
      existingLeave = existingLeave.filter(leave => leave.id !== excludeLeaveId);
    }

    // Check for overlaps
    const overlaps = checkLeaveOverlap(userId, start, end, existingLeave);

    return res.json({ 
      hasOverlap: overlaps.length > 0,
      overlappingLeave: overlaps,
      message: overlaps.length > 0 
        ? `Found ${overlaps.length} overlapping leave record(s)` 
        : 'No overlapping leave found'
    });
  } catch (error) {
    console.error('Error checking leave overlap:', error);
    return res.status(500).json({ error: 'Failed to check leave overlap' });
  }
});

export default router;
