import express from 'express';
import axios from 'axios';
import pool from '../config/database.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

interface NagerHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

// Fetch public holidays from Nager.Date API
router.post('/import', isAuthenticated, async (req, res) => {
  try {
    const { year, countryCode } = req.body;

    if (!year || !countryCode) {
      return res.status(400).json({ error: 'Year and country code are required' });
    }

    // Fetch holidays from Nager.Date API
    const response = await axios.get<NagerHoliday[]>(
      `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`
    );

    const holidays = response.data;

    if (!holidays || holidays.length === 0) {
      return res.status(404).json({ error: 'No holidays found for the specified year and country' });
    }

    // Insert holidays into database (skip duplicates)
    const insertedHolidays = [];
    const skippedHolidays = [];

    for (const holiday of holidays) {
      // Only import holidays that are actual public holidays (type "Public")
      // This filters out observances, bank holidays, and other non-business-day-affecting dates
      const isPublicHoliday = holiday.types.includes('Public');
      
      if (!isPublicHoliday) {
        skippedHolidays.push({
          name: holiday.name,
          date: holiday.date,
          reason: 'Not a public holiday (observance only)',
        });
        continue;
      }

      try {
        // Check if holiday already exists
        const existingHoliday = await pool.query(
          'SELECT id FROM public_holidays WHERE date = $1',
          [holiday.date]
        );

        if (existingHoliday.rows.length > 0) {
          skippedHolidays.push({
            name: holiday.name,
            date: holiday.date,
            reason: 'Already exists',
          });
          continue;
        }

        // Insert new holiday
        const result = await pool.query(
          'INSERT INTO public_holidays (name, date) VALUES ($1, $2) RETURNING *',
          [holiday.name, holiday.date]
        );

        insertedHolidays.push(result.rows[0]);
      } catch (error) {
        console.error(`Error inserting holiday ${holiday.name}:`, error);
        skippedHolidays.push({
          name: holiday.name,
          date: holiday.date,
          reason: 'Database error',
        });
      }
    }

    res.json({
      message: 'Holiday import completed',
      inserted: insertedHolidays.length,
      skipped: skippedHolidays.length,
      insertedHolidays,
      skippedHolidays,
    });
  } catch (error: any) {
    console.error('Error importing holidays:', error);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ 
        error: 'Invalid country code or year. Please check and try again.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to import holidays',
      details: error.message 
    });
  }
});

// Get list of available countries
router.get('/countries', isAuthenticated, async (req, res) => {
  try {
    const response = await axios.get('https://date.nager.at/api/v3/AvailableCountries');
    res.json({ countries: response.data });
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ error: 'Failed to fetch available countries' });
  }
});

export default router;
