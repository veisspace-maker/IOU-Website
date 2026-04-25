import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../middleware/auth';
import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// All sales items routes require authentication
router.use(isAuthenticated);

// GET /api/sales-items - List all sales items
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, created_at, updated_at
       FROM sales_items 
       ORDER BY name ASC`
    );

    const items = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return res.json({ items });
  } catch (error) {
    console.error('Error fetching sales items:', error);
    return res.status(500).json({ error: 'Failed to fetch sales items' });
  }
});

// POST /api/sales-items - Create a new sales item
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        error: 'Item name is required' 
      });
    }

    const trimmedName = name.trim();
    const itemId = uuidv4();

    // Insert sales item
    const result = await pool.query(
      `INSERT INTO sales_items (id, name)
       VALUES ($1, $2)
       RETURNING id, name, created_at, updated_at`,
      [itemId, trimmedName]
    );

    const item = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    };

    return res.status(201).json({ 
      item,
      message: 'Sales item created successfully' 
    });
  } catch (error: any) {
    console.error('Error creating sales item:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({ 
        error: 'An item with this name already exists' 
      });
    }
    
    return res.status(500).json({ error: 'Failed to create sales item' });
  }
});

// PUT /api/sales-items/:id - Update a sales item
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        error: 'Item name is required' 
      });
    }

    const trimmedName = name.trim();

    // Update sales item
    const result = await pool.query(
      `UPDATE sales_items 
       SET name = $1
       WHERE id = $2
       RETURNING id, name, created_at, updated_at`,
      [trimmedName, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Item not found' 
      });
    }

    const item = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    };

    return res.status(200).json({ 
      item,
      message: 'Sales item updated successfully' 
    });
  } catch (error: any) {
    console.error('Error updating sales item:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({ 
        error: 'An item with this name already exists' 
      });
    }
    
    return res.status(500).json({ error: 'Failed to update sales item' });
  }
});

// DELETE /api/sales-items/:id - Delete a sales item
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Delete sales item
    const result = await pool.query(
      'DELETE FROM sales_items WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Item not found' 
      });
    }

    return res.status(200).json({ 
      message: 'Sales item deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting sales item:', error);
    return res.status(500).json({ error: 'Failed to delete sales item' });
  }
});

export default router;
