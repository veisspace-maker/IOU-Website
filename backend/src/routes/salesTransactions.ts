import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../middleware/auth';
import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { Entity } from '../types/debtTracker';

const router = Router();
const transactionRepository = new TransactionRepository(pool);

// All sales transaction routes require authentication
router.use(isAuthenticated);

// GET /api/sales - List sales transactions with pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 1000);
    const offset = parseInt(req.query.offset as string) || 0;
    
    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) FROM sales_transactions');
    const total = parseInt(countResult.rows[0].count);
    
    // Get paginated results
    const result = await pool.query(
      `SELECT 
        id, 
        item, 
        price,
        quantity,
        TO_CHAR(date, 'YYYY-MM-DD') as date,
        description,
        seller,
        created_by,
        created_at
      FROM sales_transactions 
      ORDER BY created_at DESC, date DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const transactions = result.rows.map((row: any) => ({
      id: row.id,
      item: row.item,
      price: parseFloat(row.price),
      quantity: parseInt(row.quantity),
      date: row.date,
      description: row.description,
      seller: row.seller,
      createdBy: row.created_by,
      createdAt: row.created_at,
    }));

    return res.json({ 
      transactions,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching sales transactions:', error);
    return res.status(500).json({ error: 'Failed to fetch sales transactions' });
  }
});

// POST /api/sales - Create sales transaction
router.post('/', async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { item, price, quantity, date, description, seller } = req.body;
    const userId = (req.user as any)?.id;
    
    // Debug logging
    console.log('POST /api/sales - Received body:', req.body);
    console.log('Quantity value:', quantity, 'Type:', typeof quantity);

    // Validate authentication
    if (!userId) {
      client.release();
      return res.status(401).json({ 
        error: 'User not authenticated' 
      });
    }

    // Validate required fields
    if (!item || price === undefined || !date || !seller) {
      client.release();
      return res.status(400).json({ 
        error: 'Missing required fields: item, price, date, seller' 
      });
    }

    // Validate seller
    const normalizedSeller = seller.toLowerCase();
    if (normalizedSeller !== 'leva' && normalizedSeller !== 'danik') {
      client.release();
      return res.status(400).json({ 
        error: 'Seller must be either "leva" or "danik"' 
      });
    }

    // Trim item name
    const trimmedItem = item.trim();

    // Validate item is not empty after trimming
    if (trimmedItem.length === 0) {
      client.release();
      return res.status(400).json({ 
        error: 'Item name cannot be empty' 
      });
    }

    // Validate price is a valid number
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) {
      client.release();
      return res.status(400).json({ 
        error: 'Price must be a valid number' 
      });
    }

    // Validate price is positive
    if (numericPrice <= 0) {
      client.release();
      return res.status(400).json({ 
        error: 'Price must be greater than zero' 
      });
    }

    // Validate quantity (default to 1 if not provided)
    const numericQuantity = quantity !== undefined ? parseInt(quantity) : 1;
    if (isNaN(numericQuantity) || numericQuantity <= 0) {
      client.release();
      return res.status(400).json({ 
        error: 'Quantity must be a positive integer' 
      });
    }
    
    console.log('Parsed quantity:', numericQuantity, 'from:', quantity);

    // Generate UUID for transaction
    const transactionId = uuidv4();
    
    console.log('About to insert with quantity:', numericQuantity);

    // Start transaction
    await client.query('BEGIN');

    // Insert sales transaction
    const result = await client.query(
      `INSERT INTO sales_transactions (id, item, price, quantity, date, description, seller, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, item, price, quantity, TO_CHAR(date, 'YYYY-MM-DD') as date, description, seller, created_by, created_at`,
      [transactionId, trimmedItem, numericPrice, numericQuantity, date, description || null, normalizedSeller, userId]
    );
    
    console.log('Inserted row quantity:', result.rows[0].quantity);

    // Calculate total sale amount
    const totalAmount = numericPrice * numericQuantity;

    // Create debt transaction: "2masters" gave money to the seller
    // When a seller makes a sale, they receive the money (including the other person's share)
    // This INCREASES their debt because they're holding onto the other person's share
    // Map seller names: 'leva' -> 'lev', 'danik' -> 'danik'
    const debtEntity: Entity = normalizedSeller === 'leva' ? 'lev' : 'danik';
    
    // Build description with all sale details
    let debtDescription = `Sale: ${trimmedItem}`;
    if (numericQuantity > 1) {
      debtDescription += ` (Qty: ${numericQuantity} × $${numericPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} = $${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
    } else {
      debtDescription += ` ($${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
    }
    if (description && description.trim()) {
      debtDescription += ` - ${description.trim()}`;
    }
    
    const debtTransactionData = {
      from: '2masters' as Entity,
      to: debtEntity,
      amount: totalAmount,
      timestamp: new Date(date).getTime(),
      description: debtDescription
    };

    console.log('Creating debt transaction:', debtTransactionData);
    await transactionRepository.create(debtTransactionData);

    // Commit transaction
    await client.query('COMMIT');

    const transaction = {
      id: result.rows[0].id,
      item: result.rows[0].item,
      price: parseFloat(result.rows[0].price),
      quantity: parseInt(result.rows[0].quantity),
      date: result.rows[0].date,
      description: result.rows[0].description,
      seller: result.rows[0].seller,
      createdBy: result.rows[0].created_by,
      createdAt: result.rows[0].created_at,
    };

    return res.status(201).json({ 
      transaction,
      message: 'Sales transaction and debt record created successfully' 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating sales transaction:', error);
    console.error('Error stack:', (error as Error).stack);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return res.status(500).json({ error: 'Failed to create sales transaction' });
  } finally {
    client.release();
  }
});

// PUT /api/sales/:id - Update sales transaction
router.put('/:id', async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { item, price, quantity, date, description, seller } = req.body;
    
    // Debug logging
    console.log('PUT /api/sales/:id - Received body:', req.body);
    console.log('Quantity value:', quantity, 'Type:', typeof quantity);

    // Validate required fields
    if (!item || price === undefined || !date || !seller) {
      client.release();
      return res.status(400).json({ 
        error: 'Missing required fields: item, price, date, seller' 
      });
    }

    // Validate seller
    const normalizedSeller = seller.toLowerCase();
    if (normalizedSeller !== 'leva' && normalizedSeller !== 'danik') {
      client.release();
      return res.status(400).json({ 
        error: 'Seller must be either "leva" or "danik"' 
      });
    }

    // Trim item name
    const trimmedItem = item.trim();

    // Validate item is not empty after trimming
    if (trimmedItem.length === 0) {
      client.release();
      return res.status(400).json({ 
        error: 'Item name cannot be empty' 
      });
    }

    // Validate price is a valid number
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) {
      client.release();
      return res.status(400).json({ 
        error: 'Price must be a valid number' 
      });
    }

    // Validate price is positive
    if (numericPrice <= 0) {
      client.release();
      return res.status(400).json({ 
        error: 'Price must be greater than zero' 
      });
    }

    // Validate quantity (default to 1 if not provided)
    const numericQuantity = quantity !== undefined ? parseInt(quantity) : 1;
    if (isNaN(numericQuantity) || numericQuantity <= 0) {
      client.release();
      return res.status(400).json({ 
        error: 'Quantity must be a positive integer' 
      });
    }

    // Start transaction
    await client.query('BEGIN');

    // Get the existing sales transaction
    const checkResult = await client.query(
      'SELECT id, item, price, quantity, seller, TO_CHAR(date, \'YYYY-MM-DD\') as date, description FROM sales_transactions WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ 
        error: 'Transaction not found' 
      });
    }

    const oldSale = checkResult.rows[0];
    const oldTotalAmount = parseFloat(oldSale.price) * parseInt(oldSale.quantity);
    
    // Build the old description pattern to find the debt transaction
    let oldDebtDescriptionPattern = `Sale: ${oldSale.item}`;
    if (parseInt(oldSale.quantity) > 1) {
      oldDebtDescriptionPattern += ` (Qty: ${oldSale.quantity}`;
    } else {
      oldDebtDescriptionPattern += ` (${oldTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    // Map old seller to debt entity
    const oldNormalizedSeller = oldSale.seller.toLowerCase();
    const oldDebtEntity = oldNormalizedSeller === 'leva' ? 'lev' : 'danik';

    // Update sales transaction
    const result = await client.query(
      `UPDATE sales_transactions 
       SET item = $1, price = $2, quantity = $3, date = $4, description = $5, seller = $6
       WHERE id = $7
       RETURNING id, item, price, quantity, TO_CHAR(date, 'YYYY-MM-DD') as date, description, seller, created_by, created_at`,
      [trimmedItem, numericPrice, numericQuantity, date, description || null, normalizedSeller, id]
    );

    // Calculate new total amount
    const newTotalAmount = numericPrice * numericQuantity;
    
    // Build new description with all sale details
    let newDebtDescription = `Sale: ${trimmedItem}`;
    if (numericQuantity > 1) {
      newDebtDescription += ` (Qty: ${numericQuantity} × ${numericPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} = ${newTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
    } else {
      newDebtDescription += ` (${newTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
    }
    if (description && description.trim()) {
      newDebtDescription += ` - ${description.trim()}`;
    }
    
    // Map new seller to debt entity
    const newDebtEntity: Entity = normalizedSeller === 'leva' ? 'lev' : 'danik';
    
    // Find and update the corresponding debt transaction
    const debtUpdateResult = await client.query(
      `UPDATE debt_transactions_v2 
       SET from_entity = '2masters', 
           to_entity = $1, 
           amount = $2, 
           timestamp = $3,
           description = $4
       WHERE from_entity = '2masters' 
       AND to_entity = $5 
       AND amount = $6 
       AND description LIKE $7
       RETURNING id`,
      [
        newDebtEntity, 
        newTotalAmount, 
        new Date(date).getTime(),
        newDebtDescription,
        oldDebtEntity, 
        oldTotalAmount, 
        `${oldDebtDescriptionPattern}%`
      ]
    );

    if (debtUpdateResult.rowCount === 0) {
      console.warn(`No corresponding debt transaction found for sale ${id}. This may indicate data inconsistency.`);
    } else {
      console.log(`Updated ${debtUpdateResult.rowCount} corresponding debt transaction(s) for sale ${id}`);
    }

    // Commit transaction
    await client.query('COMMIT');

    const transaction = {
      id: result.rows[0].id,
      item: result.rows[0].item,
      price: parseFloat(result.rows[0].price),
      quantity: parseInt(result.rows[0].quantity),
      date: result.rows[0].date,
      description: result.rows[0].description,
      seller: result.rows[0].seller,
      createdBy: result.rows[0].created_by,
      createdAt: result.rows[0].created_at,
    };

    return res.status(200).json({ 
      transaction,
      message: 'Sales transaction and corresponding debt record updated successfully',
      updatedDebtTransactions: debtUpdateResult.rowCount || 0
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating sales transaction:', error);
    return res.status(500).json({ error: 'Failed to update sales transaction' });
  } finally {
    client.release();
  }
});

// DELETE /api/sales/:id - Delete sales transaction
router.delete('/:id', async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;

    // Start transaction
    await client.query('BEGIN');

    // Get the sales transaction details before deleting
    const checkResult = await client.query(
      'SELECT id, item, price, quantity, seller, TO_CHAR(date, \'YYYY-MM-DD\') as date, description FROM sales_transactions WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ 
        error: 'Transaction not found' 
      });
    }

    const sale = checkResult.rows[0];
    const totalAmount = parseFloat(sale.price) * parseInt(sale.quantity);
    
    // Build the description pattern that was used when creating the debt transaction
    let debtDescriptionPattern = `Sale: ${sale.item}`;
    if (parseInt(sale.quantity) > 1) {
      debtDescriptionPattern += ` (Qty: ${sale.quantity}`;
    } else {
      debtDescriptionPattern += ` (${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    // Map seller to debt entity
    const normalizedSeller = sale.seller.toLowerCase();
    const debtEntity = normalizedSeller === 'leva' ? 'lev' : 'danik';
    
    console.log('Delete debug info:');
    console.log('  Sale:', sale);
    console.log('  Total amount:', totalAmount);
    console.log('  Debt entity:', debtEntity);
    console.log('  Description pattern:', `${debtDescriptionPattern}%`);
    
    // Find and delete the corresponding debt transaction
    // Match by: from entity (2masters), to entity (seller), amount, and description pattern
    const debtDeleteResult = await client.query(
      `DELETE FROM debt_transactions_v2 
       WHERE from_entity = '2masters' 
       AND to_entity = $1 
       AND amount = $2 
       AND description LIKE $3
       RETURNING id`,
      [debtEntity, totalAmount, `${debtDescriptionPattern}%`]
    );

    console.log(`Deleted ${debtDeleteResult.rowCount} corresponding debt transaction(s) for sale ${id}`);
    
    if (debtDeleteResult.rowCount === 0) {
      console.warn(`Warning: No debt transaction found for sale ${id}. Proceeding with sale deletion anyway.`);
    }

    // Delete sales transaction
    await client.query(
      'DELETE FROM sales_transactions WHERE id = $1',
      [id]
    );

    // Commit transaction
    await client.query('COMMIT');

    return res.status(200).json({ 
      message: 'Sales transaction deleted successfully',
      deletedDebtTransactions: debtDeleteResult.rowCount || 0,
      warning: debtDeleteResult.rowCount === 0 ? 'No corresponding debt transaction found' : undefined
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting sales transaction:', error);
    return res.status(500).json({ error: 'Failed to delete sales transaction' });
  } finally {
    client.release();
  }
});

export default router;
