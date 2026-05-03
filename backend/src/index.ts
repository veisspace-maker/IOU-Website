import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import pool from './config/database';
import passport from './middleware/auth';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import leaveRoutes from './routes/leave';
import holidaysRoutes from './routes/holidays';
import holidayImportRoutes from './routes/holidayImport';
import closedDatesRoutes from './routes/closedDates';
import birthdaysRoutes from './routes/birthdays';
import salesTransactionsRoutes from './routes/salesTransactions';
import salesItemsRoutes from './routes/salesItems';
import debtTransactionsV2Routes from './routes/debtTransactionsV2';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'company-tracker-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to false for local network access (HTTP)
      httpOnly: true,
      maxAge: undefined, // Will be set dynamically based on "remember me" choice
      // Don't set sameSite at all - let browser decide (most permissive for local dev)
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// API routes will be added here
app.get('/api', (req, res) => {
  res.json({ message: 'UOMe API' });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// User management routes
app.use('/api/users', usersRoutes);

// Leave routes
app.use('/api/leave', leaveRoutes);

// Holiday routes
app.use('/api/holidays', holidaysRoutes);

// Holiday import routes
app.use('/api/holiday-import', holidayImportRoutes);

// Closed date routes
app.use('/api/closed-dates', closedDatesRoutes);

// Birthday routes
app.use('/api/birthdays', birthdaysRoutes);

// Sales transaction routes
app.use('/api/sales', salesTransactionsRoutes);

// Sales items routes
app.use('/api/sales-items', salesItemsRoutes);

// Debt transaction v2 routes
app.use('/api/debt-transactions-v2', debtTransactionsV2Routes);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Access locally: http://localhost:${PORT}`);
  console.log(`Access on network: http://[YOUR_IP]:${PORT}`);
});

export default app;
