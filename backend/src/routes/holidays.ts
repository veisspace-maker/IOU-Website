import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../middleware/auth';
import pool from '../config/database';
import { PublicHoliday } from '../types/models';

const router = Router();

// All holiday routes require authentication
router.use(isAuthenticated);

// GET /api/holidays - List all holidays
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT 
        id, 
        name, 
        date, 
        created_at, 
        updated_at 
      FROM public_holidays 
      ORDER BY date ASC`
    );

    const holidays = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      date: row.date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return res.json({ holidays });
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return res.status(500).json({ error: 'Failed to fetch holidays' });
  }
});

// POST /api/holidays - Create holiday
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, date } = req.body;

    // Validate required fields
    if (!name || !date) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, date' 
      });
    }

    const holidayDate = new Date(date);

    // Validate date is valid
    if (isNaN(holidayDate.getTime())) {
      return res.status(400).json({ 
        error: 'Invalid date format' 
      });
    }

    // Insert holiday
    const result = await pool.query(
      `INSERT INTO public_holidays (name, date)
       VALUES ($1, $2)
       RETURNING id, name, date, created_at, updated_at`,
      [name, holidayDate]
    );

    const holiday = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      date: result.rows[0].date,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    };

    return res.status(201).json({ 
      holiday,
      message: 'Public holiday created successfully' 
    });
  } catch (error) {
    console.error('Error creating holiday:', error);
    return res.status(500).json({ error: 'Failed to create holiday' });
  }
});

// PUT /api/holidays/:id - Update holiday
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, date } = req.body;

    // Check if holiday exists
    const existingResult = await pool.query(
      'SELECT id FROM public_holidays WHERE id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Public holiday not found' });
    }

    // Validate required fields
    if (!name || !date) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, date' 
      });
    }

    const holidayDate = new Date(date);

    // Validate date is valid
    if (isNaN(holidayDate.getTime())) {
      return res.status(400).json({ 
        error: 'Invalid date format' 
      });
    }

    // Update holiday
    const result = await pool.query(
      `UPDATE public_holidays 
       SET name = $1, date = $2
       WHERE id = $3
       RETURNING id, name, date, created_at, updated_at`,
      [name, holidayDate, id]
    );

    const holiday = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      date: result.rows[0].date,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    };

    return res.json({ 
      holiday,
      message: 'Public holiday updated successfully' 
    });
  } catch (error) {
    console.error('Error updating holiday:', error);
    return res.status(500).json({ error: 'Failed to update holiday' });
  }
});

// DELETE /api/holidays/:id - Delete holiday
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if holiday exists
    const existingResult = await pool.query(
      'SELECT id FROM public_holidays WHERE id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Public holiday not found' });
    }

    // Delete holiday
    await pool.query('DELETE FROM public_holidays WHERE id = $1', [id]);

    return res.json({ 
      message: 'Public holiday deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    return res.status(500).json({ error: 'Failed to delete holiday' });
  }
});

// GET /api/holidays/next - Get next upcoming holiday
router.get('/next', async (req: Request, res: Response) => {
  try {
    const currentDate = new Date();

    const result = await pool.query(
      `SELECT 
        id, 
        name, 
        date, 
        created_at, 
        updated_at 
      FROM public_holidays 
      WHERE date > $1
      ORDER BY date ASC
      LIMIT 1`,
      [currentDate]
    );

    if (result.rows.length === 0) {
      return res.json({ 
        holiday: null,
        message: 'No upcoming holidays found' 
      });
    }

    const holiday = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      date: result.rows[0].date,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    };

    return res.json({ holiday });
  } catch (error) {
    console.error('Error fetching next holiday:', error);
    return res.status(500).json({ error: 'Failed to fetch next holiday' });
  }
});

export default router;
