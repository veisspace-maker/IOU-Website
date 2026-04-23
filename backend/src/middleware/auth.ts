import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import pool from '../config/database';
import { User } from '../types/models';
import { Request, Response, NextFunction } from 'express';

// Configure Passport Local Strategy
passport.use(
  new LocalStrategy(async (username: string, password: string, done: any) => {
    try {
      // Query user from database
      const result = await pool.query(
        'SELECT id, username, password_hash, pin_hash, two_factor_secret, two_factor_enabled, created_at, updated_at FROM users WHERE username = $1',
        [username]
      );

      if (result.rows.length === 0) {
        return done(null, false, { message: 'Invalid username or password' });
      }

      const user = result.rows[0];

      // Verify password or PIN
      let isValid = await bcrypt.compare(password, user.password_hash);
      
      // If password fails and PIN exists, try PIN
      if (!isValid && user.pin_hash) {
        isValid = await bcrypt.compare(password, user.pin_hash);
      }
      
      if (!isValid) {
        return done(null, false, { message: 'Invalid username or password' });
      }

      // Convert snake_case to camelCase for User interface
      const userObj: User = {
        id: user.id,
        username: user.username,
        passwordHash: user.password_hash,
        twoFactorSecret: user.two_factor_secret,
        twoFactorEnabled: user.two_factor_enabled,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      };

      return done(null, userObj);
    } catch (error) {
      return done(error);
    }
  })
);

// Serialize user for session
passport.serializeUser((user: any, done: any) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done: any) => {
  try {
    const result = await pool.query(
      'SELECT id, username, password_hash, pin_hash, two_factor_secret, two_factor_enabled, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return done(null, false);
    }

    const user = result.rows[0];
    const userObj: User = {
      id: user.id,
      username: user.username,
      passwordHash: user.password_hash,
      twoFactorSecret: user.two_factor_secret,
      twoFactorEnabled: user.two_factor_enabled,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    done(null, userObj);
  } catch (error) {
    done(error);
  }
});

// Middleware to check if user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

export default passport;
