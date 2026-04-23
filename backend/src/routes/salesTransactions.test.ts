/**
 * Unit Tests for Sales Transaction API Endpoints
 * 
 * Tests API endpoint behavior including:
 * - Input validation (missing fields, invalid types)
 * - Error responses (404 for non-existent IDs, 400 for bad input)
 * - Authentication requirements
 * 
 * Requirements: 10.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express, { Express, Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import salesRouter from './salesTransactions';
import { v4 as uuidv4 } from 'uuid';

// Mock authentication middleware
const mockAuthMiddleware = (authenticated: boolean, userId?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (authenticated) {
      req.user = { id: userId || 'test-user-id' };
      (req as any).isAuthenticated = () => true;
      next();
    } else {
      (req as any).isAuthenticated = () => false;
      res.status(401).json({ error: 'Unauthorized' });
    }
  };
};

// Create test app with optional authentication
const createTestApp = (authenticated: boolean = true, userId?: string): Express => {
  const app = express();
  app.use(express.json());
  
  // Mock authentication middleware before the router
  app.use(mockAuthMiddleware(authenticated, userId));
  
  app.use('/api/sales', salesRouter);
  return app;
};

describe('Sales Transaction API Endpoints', () => {
  let app: Express;
  const createdIds: string[] = [];
  let testUserId: string;

  beforeEach(async () => {
    // Get a real user ID from the database
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      throw new Error('No users found in database. Please create at least one user first.');
    }
    testUserId = userResult.rows[0].id;
    
    // Create authenticated app with test user
    app = createTestApp(true, testUserId);
  });

  afterEach(async () => {
    // Clean up created transactions
    for (const id of createdIds) {
      try {
        await pool.query('DELETE FROM sales_transactions WHERE id = $1', [id]);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    createdIds.length = 0;
  });

  describe('Authentication Requirements', () => {
    it('should require authentication for GET /api/sales', async () => {
      const unauthApp = createTestApp(false);
      const response = await request(unauthApp)
        .get('/api/sales');
      
      expect(response.status).toBe(401);
    });

    it('should require authentication for POST /api/sales', async () => {
      const unauthApp = createTestApp(false);
      const response = await request(unauthApp)
        .post('/api/sales')
        .send({
          item: 'Widget',
          price: 100,
          date: '2024-01-01'
        });
      
      expect(response.status).toBe(401);
    });

    it('should require authentication for PUT /api/sales/:id', async () => {
      const unauthApp = createTestApp(false);
      const response = await request(unauthApp)
        .put('/api/sales/test-id')
        .send({
          item: 'Widget',
          price: 100,
          date: '2024-01-01'
        });
      
      expect(response.status).toBe(401);
    });

    it('should require authentication for DELETE /api/sales/:id', async () => {
      const unauthApp = createTestApp(false);
      const response = await request(unauthApp)
        .delete('/api/sales/test-id');
      
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/sales - Input Validation', () => {
    it('should return 400 when item is missing', async () => {
      const response = await request(app)
        .post('/api/sales')
        .send({
          price: 100,
          date: '2024-01-01'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 400 when price is missing', async () => {
      const response = await request(app)
        .post('/api/sales')
        .send({
          item: 'Widget',
          date: '2024-01-01'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 400 when date is missing', async () => {
      const response = await request(app)
        .post('/api/sales')
        .send({
          item: 'Widget',
          price: 100
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 400 when item is empty after trimming', async () => {
      const response = await request(app)
        .post('/api/sales')
        .send({
          item: '   ',
          price: 100,
          date: '2024-01-01'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Item name cannot be empty');
    });

    it('should return 400 when price is not a valid number', async () => {
      const response = await request(app)
        .post('/api/sales')
        .send({
          item: 'Widget',
          price: 'not-a-number',
          date: '2024-01-01'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Price must be a valid number');
    });

    it('should return 400 when price is zero', async () => {
      const response = await request(app)
        .post('/api/sales')
        .send({
          item: 'Widget',
          price: 0,
          date: '2024-01-01'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Price must be greater than zero');
    });

    it('should return 400 when price is negative', async () => {
      const response = await request(app)
        .post('/api/sales')
        .send({
          item: 'Widget',
          price: -50,
          date: '2024-01-01'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Price must be greater than zero');
    });

    it('should return 401 when user is not authenticated', async () => {
      const unauthApp = createTestApp(false);
      const response = await request(unauthApp)
        .post('/api/sales')
        .send({
          item: 'Widget',
          price: 100,
          date: '2024-01-01'
        });
      
      expect(response.status).toBe(401);
    });

    it('should create transaction with valid input', async () => {
      const response = await request(app)
        .post('/api/sales')
        .send({
          item: 'Widget',
          price: 100,
          date: '2024-01-01',
          description: 'Test description'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.transaction).toBeDefined();
      expect(response.body.transaction.item).toBe('Widget');
      expect(response.body.transaction.price).toBe(100);
      expect(response.body.transaction.date).toBe('2024-01-01');
      expect(response.body.transaction.description).toBe('Test description');
      expect(response.body.transaction.createdBy).toBe(testUserId);
      expect(response.body.transaction.id).toBeDefined();
      
      createdIds.push(response.body.transaction.id);
    });

    it('should trim item name before storing', async () => {
      const response = await request(app)
        .post('/api/sales')
        .send({
          item: '  Widget  ',
          price: 100,
          date: '2024-01-01'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.transaction.item).toBe('Widget');
      
      createdIds.push(response.body.transaction.id);
    });

    it('should handle null description', async () => {
      const response = await request(app)
        .post('/api/sales')
        .send({
          item: 'Widget',
          price: 100,
          date: '2024-01-01',
          description: null
        });
      
      expect(response.status).toBe(201);
      expect(response.body.transaction.description).toBeNull();
      
      createdIds.push(response.body.transaction.id);
    });

    it('should handle missing description', async () => {
      const response = await request(app)
        .post('/api/sales')
        .send({
          item: 'Widget',
          price: 100,
          date: '2024-01-01'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.transaction.description).toBeNull();
      
      createdIds.push(response.body.transaction.id);
    });
  });

  describe('PUT /api/sales/:id - Input Validation', () => {
    let existingTransactionId: string;

    beforeEach(async () => {
      // Create a transaction to update
      const id = uuidv4();
      await pool.query(
        `INSERT INTO sales_transactions (id, item, price, date, description, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, 'Original Item', 50, '2024-01-01', 'Original description', testUserId]
      );
      existingTransactionId = id;
      createdIds.push(id);
    });

    it('should return 400 when item is missing', async () => {
      const response = await request(app)
        .put(`/api/sales/${existingTransactionId}`)
        .send({
          price: 100,
          date: '2024-01-01'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 400 when price is missing', async () => {
      const response = await request(app)
        .put(`/api/sales/${existingTransactionId}`)
        .send({
          item: 'Widget',
          date: '2024-01-01'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 400 when date is missing', async () => {
      const response = await request(app)
        .put(`/api/sales/${existingTransactionId}`)
        .send({
          item: 'Widget',
          price: 100
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 400 when item is empty after trimming', async () => {
      const response = await request(app)
        .put(`/api/sales/${existingTransactionId}`)
        .send({
          item: '   ',
          price: 100,
          date: '2024-01-01'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Item name cannot be empty');
    });

    it('should return 400 when price is not a valid number', async () => {
      const response = await request(app)
        .put(`/api/sales/${existingTransactionId}`)
        .send({
          item: 'Widget',
          price: 'invalid',
          date: '2024-01-01'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Price must be a valid number');
    });

    it('should return 400 when price is zero', async () => {
      const response = await request(app)
        .put(`/api/sales/${existingTransactionId}`)
        .send({
          item: 'Widget',
          price: 0,
          date: '2024-01-01'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Price must be greater than zero');
    });

    it('should return 400 when price is negative', async () => {
      const response = await request(app)
        .put(`/api/sales/${existingTransactionId}`)
        .send({
          item: 'Widget',
          price: -50,
          date: '2024-01-01'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Price must be greater than zero');
    });

    it('should return 404 when transaction does not exist', async () => {
      const nonExistentId = uuidv4();
      const response = await request(app)
        .put(`/api/sales/${nonExistentId}`)
        .send({
          item: 'Widget',
          price: 100,
          date: '2024-01-01'
        });
      
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Transaction not found');
    });

    it('should update transaction with valid input', async () => {
      const response = await request(app)
        .put(`/api/sales/${existingTransactionId}`)
        .send({
          item: 'Updated Item',
          price: 150,
          date: '2024-02-01',
          description: 'Updated description'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.transaction.id).toBe(existingTransactionId);
      expect(response.body.transaction.item).toBe('Updated Item');
      expect(response.body.transaction.price).toBe(150);
      expect(response.body.transaction.date).toBe('2024-02-01');
      expect(response.body.transaction.description).toBe('Updated description');
      expect(response.body.transaction.createdBy).toBe(testUserId);
    });

    it('should trim item name before updating', async () => {
      const response = await request(app)
        .put(`/api/sales/${existingTransactionId}`)
        .send({
          item: '  Updated Item  ',
          price: 150,
          date: '2024-02-01'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.transaction.item).toBe('Updated Item');
    });

    it('should preserve id and createdBy when updating', async () => {
      const response = await request(app)
        .put(`/api/sales/${existingTransactionId}`)
        .send({
          item: 'Updated Item',
          price: 150,
          date: '2024-02-01'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.transaction.id).toBe(existingTransactionId);
      expect(response.body.transaction.createdBy).toBe(testUserId);
    });
  });

  describe('DELETE /api/sales/:id - Error Responses', () => {
    let existingTransactionId: string;

    beforeEach(async () => {
      // Create a transaction to delete
      const id = uuidv4();
      await pool.query(
        `INSERT INTO sales_transactions (id, item, price, date, description, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, 'Item to Delete', 50, '2024-01-01', null, testUserId]
      );
      existingTransactionId = id;
      createdIds.push(id);
    });

    it('should return 404 when transaction does not exist', async () => {
      const nonExistentId = uuidv4();
      const response = await request(app)
        .delete(`/api/sales/${nonExistentId}`);
      
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Transaction not found');
    });

    it('should delete existing transaction', async () => {
      const response = await request(app)
        .delete(`/api/sales/${existingTransactionId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted successfully');
      
      // Verify transaction is deleted
      const checkResult = await pool.query(
        'SELECT * FROM sales_transactions WHERE id = $1',
        [existingTransactionId]
      );
      expect(checkResult.rows).toHaveLength(0);
      
      // Remove from cleanup list since it's already deleted
      const index = createdIds.indexOf(existingTransactionId);
      if (index > -1) {
        createdIds.splice(index, 1);
      }
    });

    it('should return 404 when trying to delete already deleted transaction', async () => {
      // Delete once
      await request(app)
        .delete(`/api/sales/${existingTransactionId}`);
      
      // Try to delete again
      const response = await request(app)
        .delete(`/api/sales/${existingTransactionId}`);
      
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Transaction not found');
    });
  });

  describe('GET /api/sales - Response Format', () => {
    it('should return 200 with transactions array', async () => {
      const response = await request(app)
        .get('/api/sales');
      
      expect(response.status).toBe(200);
      expect(response.body.transactions).toBeDefined();
      expect(Array.isArray(response.body.transactions)).toBe(true);
    });

    it('should return transactions with correct structure', async () => {
      // Create a test transaction
      const id = uuidv4();
      await pool.query(
        `INSERT INTO sales_transactions (id, item, price, date, description, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, 'Test Item', 100, '2024-01-01', 'Test description', testUserId]
      );
      createdIds.push(id);
      
      const response = await request(app)
        .get('/api/sales');
      
      expect(response.status).toBe(200);
      const transaction = response.body.transactions.find((t: any) => t.id === id);
      expect(transaction).toBeDefined();
      expect(transaction.id).toBe(id);
      expect(transaction.item).toBe('Test Item');
      expect(transaction.price).toBe(100);
      expect(transaction.date).toBe('2024-01-01');
      expect(transaction.description).toBe('Test description');
      expect(transaction.createdBy).toBe(testUserId);
    });
  });
});
