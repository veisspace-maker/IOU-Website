import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { isAuthenticated } from '../middleware/auth';
import pool from '../config/database';
import { User } from '../types/models';
import { validatePassword, hashPassword } from '../utils/passwordValidation';

const router = Router();

// All user routes require authentication
router.use(isAuthenticated);

// GET /api/users - List all users
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, username, two_factor_enabled, created_at, updated_at FROM users ORDER BY username'
    );

    const users = result.rows.map((row: any) => ({
      id: row.id,
      username: row.username,
      twoFactorEnabled: row.two_factor_enabled,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/users/:id - Update user (username or password)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { username, password, currentPassword } = req.body;
    const currentUser = req.user as User;

    // Users can only update their own account
    if (currentUser.id !== id) {
      return res.status(403).json({ error: 'You can only update your own account' });
    }

    // Verify current password for any changes
    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required' });
    }

    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(
      currentPassword,
      userResult.rows[0].password_hash
    );

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update username if provided
    if (username) {
      // Check if username is already taken by another user
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, id]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      await pool.query('UPDATE users SET username = $1 WHERE id = $2', [username, id]);
    }

    // Update password if provided
    if (password) {
      // Validate password strength
      const validation = validatePassword(password);

      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Password does not meet requirements',
          details: validation.errors,
        });
      }

      // Hash and update password
      const passwordHash = await hashPassword(password);
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
        passwordHash,
        id,
      ]);
    }

    // Fetch updated user
    const updatedUserResult = await pool.query(
      'SELECT id, username, two_factor_enabled, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );

    const updatedUser = {
      id: updatedUserResult.rows[0].id,
      username: updatedUserResult.rows[0].username,
      twoFactorEnabled: updatedUserResult.rows[0].two_factor_enabled,
      createdAt: updatedUserResult.rows[0].created_at,
      updatedAt: updatedUserResult.rows[0].updated_at,
    };

    return res.json({
      user: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router;
