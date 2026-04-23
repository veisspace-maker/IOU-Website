import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../middleware/auth';
import pool from '../config/database';
import { ClosedDate, LeaveRecord } from '../types/models';
import { checkClosedDateOverlap, checkClosedDateLeaveConflict } from '../business-logic/calculations';

const router = Router();

// All closed date routes require authentication
router.use(isAuthenticated);

// GET /api/closed-dates - List all closed periods
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT 
        id, 
        start_date, 
        end_date, 
        note, 
        created_at, 
        updated_at 
      FROM closed_dates 
      ORDER BY start_date DESC`
    );

    const closedDates = result.rows.map((row: any) => ({
      id: row.id,
      startDate: row.start_date,
      endDate: row.end_date,
      note: row.note,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return res.json({ closedDates });
  } catch (error) {
    console.error('Error fetching closed dates:', error);
    return res.status(500).json({ error: 'Failed to fetch closed dates' });
  }
});

// POST /api/closed-dates - Create closed period
router.post('/', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, note } = req.body;

    // Validate required fields
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required fields: startDate, endDate' 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        error: 'Invalid date format' 
      });
    }

    // Validate date range
    if (start > end) {
      return res.status(400).json({ 
        error: 'Start date must be before or equal to end date' 
      });
    }

    // Insert closed date
    const result = await pool.query(
      `INSERT INTO closed_dates (start_date, end_date, note)
       VALUES ($1, $2, $3)
       RETURNING id, start_date, end_date, note, created_at, updated_at`,
      [start, end, note || null]
    );

    const closedDate = {
      id: result.rows[0].id,
      startDate: result.rows[0].start_date,
      endDate: result.rows[0].end_date,
      note: result.rows[0].note,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    };

    return res.status(201).json({ 
      closedDate,
      message: 'Closed date period created successfully' 
    });
  } catch (error) {
    console.error('Error creating closed date:', error);
    return res.status(500).json({ error: 'Failed to create closed date' });
  }
});

// PUT /api/closed-dates/:id - Update closed period
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, note } = req.body;

    // Check if closed date exists
    const existingResult = await pool.query(
      'SELECT id FROM closed_dates WHERE id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Closed date period not found' });
    }

    // Validate required fields
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required fields: startDate, endDate' 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        error: 'Invalid date format' 
      });
    }

    // Validate date range
    if (start > end) {
      return res.status(400).json({ 
        error: 'Start date must be before or equal to end date' 
      });
    }

    // Update closed date
    const result = await pool.query(
      `UPDATE closed_dates 
       SET start_date = $1, end_date = $2, note = $3
       WHERE id = $4
       RETURNING id, start_date, end_date, note, created_at, updated_at`,
      [start, end, note || null, id]
    );

    const closedDate = {
      id: result.rows[0].id,
      startDate: result.rows[0].start_date,
      endDate: result.rows[0].end_date,
      note: result.rows[0].note,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    };

    return res.json({ 
      closedDate,
      message: 'Closed date period updated successfully' 
    });
  } catch (error) {
    console.error('Error updating closed date:', error);
    return res.status(500).json({ error: 'Failed to update closed date' });
  }
});

// DELETE /api/closed-dates/:id - Delete closed period
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if closed date exists
    const existingResult = await pool.query(
      'SELECT id FROM closed_dates WHERE id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Closed date period not found' });
    }

    // Delete closed date
    await pool.query('DELETE FROM closed_dates WHERE id = $1', [id]);

    return res.json({ 
      message: 'Closed date period deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting closed date:', error);
    return res.status(500).json({ error: 'Failed to delete closed date' });
  }
});

// POST /api/closed-dates/check-overlap - Check for overlaps
router.post('/check-overlap', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, excludeClosedDateId } = req.body;

    // Validate required fields
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required fields: startDate, endDate' 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        error: 'Invalid date format' 
      });
    }

    // Validate date range
    if (start > end) {
      return res.status(400).json({ 
        error: 'Start date must be before or equal to end date' 
      });
    }

    // Fetch all closed dates
    const closedResult = await pool.query(
      `SELECT 
        id, 
        start_date, 
        end_date, 
        note, 
        created_at, 
        updated_at 
      FROM closed_dates`
    );

    let existingClosed: ClosedDate[] = closedResult.rows.map((row: any) => ({
      id: row.id,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      note: row.note,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));

    // Exclude the current closed date if updating
    if (excludeClosedDateId) {
      existingClosed = existingClosed.filter(closed => closed.id !== excludeClosedDateId);
    }

    // Check for overlaps
    const overlaps = checkClosedDateOverlap(start, end, existingClosed);

    return res.json({ 
      hasOverlap: overlaps.length > 0,
      overlappingPeriods: overlaps,
      message: overlaps.length > 0 
        ? `Found ${overlaps.length} overlapping closed date period(s)` 
        : 'No overlapping closed dates found'
    });
  } catch (error) {
    console.error('Error checking closed date overlap:', error);
    return res.status(500).json({ error: 'Failed to check closed date overlap' });
  }
});

// POST /api/closed-dates/check-leave-conflict - Check for leave conflicts
router.post('/check-leave-conflict', async (req: Request, res: Response) => {
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

    // Validate dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        error: 'Invalid date format' 
      });
    }

    // Validate date range
    if (start > end) {
      return res.status(400).json({ 
        error: 'Start date must be before or equal to end date' 
      });
    }

    // Fetch all leave records
    const leaveResult = await pool.query(
      `SELECT 
        id, 
        user_id, 
        start_date, 
        end_date, 
        business_days, 
        created_at, 
        updated_at 
      FROM leave_records`
    );

    const existingLeave: LeaveRecord[] = leaveResult.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      businessDays: row.business_days,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));

    // Check for conflicts
    const conflicts = checkClosedDateLeaveConflict(start, end, existingLeave);

    return res.json({ 
      hasConflict: conflicts.length > 0,
      conflictingLeave: conflicts,
      message: conflicts.length > 0 
        ? `Found ${conflicts.length} conflicting leave record(s)` 
        : 'No conflicting leave found'
    });
  } catch (error) {
    console.error('Error checking leave conflict:', error);
    return res.status(500).json({ error: 'Failed to check leave conflict' });
  }
});

export default router;
