import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../middleware/auth';
import pool from '../config/database';
import { Birthday, BirthdayWithAge } from '../types/models';
import { calculateAge, isBirthdayToday } from '../business-logic/calculations';

const router = Router();

// All birthday routes require authentication
router.use(isAuthenticated);

// GET /api/birthdays - List all birthdays
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT 
        id, 
        name, 
        date_of_birth, 
        created_at, 
        updated_at 
      FROM birthdays 
      ORDER BY date_of_birth ASC`
    );

    const birthdays = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      dateOfBirth: row.date_of_birth,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return res.json({ birthdays });
  } catch (error) {
    console.error('Error fetching birthdays:', error);
    return res.status(500).json({ error: 'Failed to fetch birthdays' });
  }
});

// POST /api/birthdays - Create birthday
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, dateOfBirth } = req.body;

    // Validate required fields
    if (!name || !dateOfBirth) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, dateOfBirth' 
      });
    }

    const dob = new Date(dateOfBirth);

    // Validate date is valid
    if (isNaN(dob.getTime())) {
      return res.status(400).json({ 
        error: 'Invalid date format' 
      });
    }

    // Validate date is in the past
    const currentDate = new Date();
    if (dob > currentDate) {
      return res.status(400).json({ 
        error: 'Date of birth must be in the past' 
      });
    }

    // Insert birthday
    const result = await pool.query(
      `INSERT INTO birthdays (name, date_of_birth)
       VALUES ($1, $2)
       RETURNING id, name, date_of_birth, created_at, updated_at`,
      [name, dob]
    );

    const birthday = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      dateOfBirth: result.rows[0].date_of_birth,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    };

    return res.status(201).json({ 
      birthday,
      message: 'Birthday created successfully' 
    });
  } catch (error) {
    console.error('Error creating birthday:', error);
    return res.status(500).json({ error: 'Failed to create birthday' });
  }
});

// PUT /api/birthdays/:id - Update birthday
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, dateOfBirth } = req.body;

    // Check if birthday exists
    const existingResult = await pool.query(
      'SELECT id FROM birthdays WHERE id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Birthday not found' });
    }

    // Validate required fields
    if (!name || !dateOfBirth) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, dateOfBirth' 
      });
    }

    const dob = new Date(dateOfBirth);

    // Validate date is valid
    if (isNaN(dob.getTime())) {
      return res.status(400).json({ 
        error: 'Invalid date format' 
      });
    }

    // Validate date is in the past
    const currentDate = new Date();
    if (dob > currentDate) {
      return res.status(400).json({ 
        error: 'Date of birth must be in the past' 
      });
    }

    // Update birthday
    const result = await pool.query(
      `UPDATE birthdays 
       SET name = $1, date_of_birth = $2
       WHERE id = $3
       RETURNING id, name, date_of_birth, created_at, updated_at`,
      [name, dob, id]
    );

    const birthday = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      dateOfBirth: result.rows[0].date_of_birth,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    };

    return res.json({ 
      birthday,
      message: 'Birthday updated successfully' 
    });
  } catch (error) {
    console.error('Error updating birthday:', error);
    return res.status(500).json({ error: 'Failed to update birthday' });
  }
});

// DELETE /api/birthdays/:id - Delete birthday
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if birthday exists
    const existingResult = await pool.query(
      'SELECT id FROM birthdays WHERE id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Birthday not found' });
    }

    // Delete birthday
    await pool.query('DELETE FROM birthdays WHERE id = $1', [id]);

    return res.json({ 
      message: 'Birthday deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting birthday:', error);
    return res.status(500).json({ error: 'Failed to delete birthday' });
  }
});

// Helper function to check if birthday is in N days
const isBirthdayInDays = (dateOfBirth: Date, currentDate: Date, daysAhead: number): boolean => {
  const targetDate = new Date(currentDate);
  targetDate.setDate(targetDate.getDate() + daysAhead);
  
  const birthMonth = dateOfBirth.getMonth();
  const birthDay = dateOfBirth.getDate();
  const targetMonth = targetDate.getMonth();
  const targetDay = targetDate.getDate();
  
  return birthMonth === targetMonth && birthDay === targetDay;
};

// GET /api/birthdays/today - Get today's birthdays with calculated ages
router.get('/today', async (req: Request, res: Response) => {
  try {
    const currentDate = new Date();

    // Fetch all birthdays
    const result = await pool.query(
      `SELECT 
        id, 
        name, 
        date_of_birth, 
        created_at, 
        updated_at 
      FROM birthdays`
    );

    const allBirthdays: Birthday[] = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      dateOfBirth: new Date(row.date_of_birth),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));

    // Filter to today's birthdays and calculate ages
    const todaysBirthdays: BirthdayWithAge[] = allBirthdays
      .filter(birthday => isBirthdayToday(birthday.dateOfBirth, currentDate))
      .map(birthday => ({
        id: birthday.id,
        name: birthday.name,
        dateOfBirth: birthday.dateOfBirth,
        turningAge: calculateAge(birthday.dateOfBirth, currentDate),
        isToday: true,
      }));

    return res.json({ 
      birthdays: todaysBirthdays,
      count: todaysBirthdays.length,
      message: todaysBirthdays.length > 0 
        ? `Found ${todaysBirthdays.length} birthday(s) today` 
        : 'No birthdays today'
    });
  } catch (error) {
    console.error('Error fetching today\'s birthdays:', error);
    return res.status(500).json({ error: 'Failed to fetch today\'s birthdays' });
  }
});

// GET /api/birthdays/upcoming - Get upcoming birthdays (7 days, 3 days, today)
router.get('/upcoming', async (req: Request, res: Response) => {
  try {
    const currentDate = new Date();

    // Fetch all birthdays
    const result = await pool.query(
      `SELECT 
        id, 
        name, 
        date_of_birth, 
        created_at, 
        updated_at 
      FROM birthdays`
    );

    const allBirthdays: Birthday[] = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      dateOfBirth: new Date(row.date_of_birth),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));

    // Categorize birthdays
    const upcomingBirthdays = {
      today: [] as BirthdayWithAge[],
      in3Days: [] as BirthdayWithAge[],
      in7Days: [] as BirthdayWithAge[],
    };

    allBirthdays.forEach(birthday => {
      const turningAge = calculateAge(birthday.dateOfBirth, currentDate) + 1; // Next birthday age
      
      if (isBirthdayToday(birthday.dateOfBirth, currentDate)) {
        upcomingBirthdays.today.push({
          id: birthday.id,
          name: birthday.name,
          dateOfBirth: birthday.dateOfBirth,
          turningAge: turningAge - 1, // Current age for today
          isToday: true,
        });
      } else if (isBirthdayInDays(birthday.dateOfBirth, currentDate, 3)) {
        upcomingBirthdays.in3Days.push({
          id: birthday.id,
          name: birthday.name,
          dateOfBirth: birthday.dateOfBirth,
          turningAge,
          isToday: false,
        });
      } else if (isBirthdayInDays(birthday.dateOfBirth, currentDate, 7)) {
        upcomingBirthdays.in7Days.push({
          id: birthday.id,
          name: birthday.name,
          dateOfBirth: birthday.dateOfBirth,
          turningAge,
          isToday: false,
        });
      }
    });

    return res.json(upcomingBirthdays);
  } catch (error) {
    console.error('Error fetching upcoming birthdays:', error);
    return res.status(500).json({ error: 'Failed to fetch upcoming birthdays' });
  }
});

export default router;
