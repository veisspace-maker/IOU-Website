import express from 'express';
import axios from 'axios';
import pool from '../config/database';
import { isAuthenticated } from '../middleware/auth';
import {
  getDefaultHolidayImportConfig,
  importHolidaysFromNager,
} from '../services/holidayImportService';

const router = express.Router();

router.post('/import', isAuthenticated, async (req, res) => {
  try {
    const { year, countryCode, subdivision: bodySubdivision } = req.body;
    const defaults = getDefaultHolidayImportConfig();

    if (!year || !countryCode) {
      return res.status(400).json({ error: 'Year and country code are required' });
    }

    const subdivision =
      bodySubdivision === undefined
        ? defaults.subdivision
        : bodySubdivision === null || bodySubdivision === ''
          ? null
          : String(bodySubdivision);

    const result = await importHolidaysFromNager(pool, {
      year: Number(year),
      countryCode: String(countryCode).toUpperCase(),
      subdivision,
    });

    res.json({
      message: 'Holiday import completed',
      subdivision: subdivision ?? null,
      ...result,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'NO_HOLIDAYS_FOUND') {
      return res.status(404).json({
        error: 'No holidays found for the specified year and country',
      });
    }

    const axiosError = error as { response?: { status?: number }; message?: string };
    console.error('Error importing holidays:', error);

    if (axiosError.response?.status === 404) {
      return res.status(404).json({
        error: 'Invalid country code or year. Please check and try again.',
      });
    }

    res.status(500).json({
      error: 'Failed to import holidays',
      details: axiosError.message,
    });
  }
});

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
