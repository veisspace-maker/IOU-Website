import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../middleware/auth';
import pool from '../config/database';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { validate } from '../business-logic/debtTracker/TransactionValidator';
import { calculateNetDebt } from '../business-logic/debtTracker/DebtCalculator';
import { Transaction } from '../types/debtTracker';

const router = Router();

// All debt transaction v2 routes require authentication
router.use(isAuthenticated);

// Initialize repository
const transactionRepository = new TransactionRepository(pool);

/**
 * POST /api/debt-transactions-v2
 * Creates a new debt transaction
 * Requirements: 9.1
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { from, to, amount, timestamp, description } = req.body;

    // Validate required fields
    if (!from || !to || amount === undefined) {
      return res.status(400).json({ 
        error: {
          code: 'MISSING_FIELDS',
          message: 'Missing required fields: from, to, amount'
        }
      });
    }

    // Use provided timestamp or default to current time
    const transactionTimestamp = timestamp !== undefined ? parseInt(timestamp) : Date.now();

    // Create transaction object for validation
    const transactionData = {
      from: from.toLowerCase(),
      to: to.toLowerCase(),
      amount: parseFloat(amount),
      timestamp: transactionTimestamp,
      description: description || undefined
    };

    // Validate transaction using TransactionValidator
    const validationResult = validate(transactionData);
    
    if (!validationResult.valid) {
      // Determine error code based on the first error
      let errorCode = 'INVALID_ENTITY';
      const firstError = validationResult.errors[0];
      
      if (firstError.includes('itself')) {
        errorCode = 'SELF_TRANSACTION';
      } else if (firstError.includes('Amount')) {
        errorCode = 'INVALID_AMOUNT';
      } else if (firstError.includes('Timestamp')) {
        errorCode = 'INVALID_TIMESTAMP';
      }
      
      return res.status(400).json({ 
        error: {
          code: errorCode,
          message: validationResult.errors[0],
          details: validationResult.errors
        }
      });
    }

    // Create transaction using repository
    const transaction = await transactionRepository.create(transactionData);

    return res.status(201).json({ 
      transaction,
      message: 'Transaction created successfully' 
    });
  } catch (error) {
    console.error('Error creating debt transaction v2:', error);
    return res.status(500).json({ 
      error: {
        code: 'DB_ERROR',
        message: 'Database operation failed'
      }
    });
  }
});

/**
 * GET /api/debt-transactions-v2
 * Retrieves debt transactions with optional pagination
 * Requirements: 9.2
 * Query params:
 *   - limit: number of transactions to return (default: 100, max: 1000)
 *   - offset: number of transactions to skip (default: 0)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
    const offset = parseInt(req.query.offset as string) || 0;
    
    const transactions = await transactionRepository.getAll();
    
    // Apply pagination
    const paginatedTransactions = transactions.slice(offset, offset + limit);
    
    return res.json({ 
      transactions: paginatedTransactions,
      total: transactions.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching debt transactions v2:', error);
    return res.status(500).json({ 
      error: {
        code: 'DB_ERROR',
        message: 'Database operation failed'
      }
    });
  }
});

/**
 * GET /api/debt-transactions-v2/net-debt
 * Calculates and returns the net debt between Lev and Danik
 * Requirements: 9.1, 9.2
 */
router.get('/net-debt', async (req: Request, res: Response) => {
  try {
    // Get all transactions
    const transactions = await transactionRepository.getAll();
    
    // Calculate net debt using DebtCalculator
    const debtResult = calculateNetDebt(transactions);

    return res.json({ 
      netDebt: debtResult
    });
  } catch (error) {
    console.error('Error calculating net debt:', error);
    return res.status(500).json({ 
      error: {
        code: 'DB_ERROR',
        message: 'Database operation failed'
      }
    });
  }
});

/**
 * PUT /api/debt-transactions-v2/:id
 * Updates an existing debt transaction
 * Requirements: 9.3
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { from, to, amount, timestamp, description } = req.body;

    // Build updates object
    const updates: Partial<Omit<Transaction, 'id'>> = {};
    
    if (from !== undefined) {
      updates.from = from.toLowerCase();
    }
    if (to !== undefined) {
      updates.to = to.toLowerCase();
    }
    if (amount !== undefined) {
      updates.amount = parseFloat(amount);
    }
    if (timestamp !== undefined) {
      updates.timestamp = parseInt(timestamp);
    }
    if (description !== undefined) {
      updates.description = description;
    }

    // If we have updates, validate them
    if (Object.keys(updates).length > 0) {
      // Get existing transaction to merge with updates for validation
      const existingTransactions = await transactionRepository.getAll();
      const existingTransaction = existingTransactions.find(t => t.id === id);
      
      if (!existingTransaction) {
        return res.status(404).json({ 
          error: {
            code: 'NOT_FOUND',
            message: `Transaction with id ${id} not found`
          }
        });
      }

      // Merge existing with updates for validation
      const mergedTransaction = {
        ...existingTransaction,
        ...updates
      };

      // Validate the merged transaction
      const validationResult = validate(mergedTransaction);
      
      if (!validationResult.valid) {
        // Determine error code based on the first error
        let errorCode = 'INVALID_ENTITY';
        const firstError = validationResult.errors[0];
        
        if (firstError.includes('itself')) {
          errorCode = 'SELF_TRANSACTION';
        } else if (firstError.includes('Amount')) {
          errorCode = 'INVALID_AMOUNT';
        } else if (firstError.includes('Timestamp')) {
          errorCode = 'INVALID_TIMESTAMP';
        }
        
        return res.status(400).json({ 
          error: {
            code: errorCode,
            message: validationResult.errors[0],
            details: validationResult.errors
          }
        });
      }
    }

    // Update transaction using repository
    const transaction = await transactionRepository.update(id, updates);

    return res.status(200).json({ 
      transaction,
      message: 'Transaction updated successfully' 
    });
  } catch (error: any) {
    console.error('Error updating debt transaction v2:', error);
    
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ 
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }
    
    return res.status(500).json({ 
      error: {
        code: 'DB_ERROR',
        message: 'Database operation failed'
      }
    });
  }
});

/**
 * DELETE /api/debt-transactions-v2/:id
 * Deletes a debt transaction
 * Requirements: 9.4
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID format (basic check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(404).json({ 
        error: {
          code: 'NOT_FOUND',
          message: `Transaction with id ${id} not found`
        }
      });
    }

    await transactionRepository.delete(id);

    return res.status(200).json({ 
      message: 'Transaction deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting debt transaction v2:', error);
    
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ 
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }
    
    return res.status(500).json({ 
      error: {
        code: 'DB_ERROR',
        message: 'Database operation failed'
      }
    });
  }
});

export default router;
