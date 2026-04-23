import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Pool } from 'pg';
import { TransactionRepository } from './TransactionRepository';
import { Transaction } from '../types/debtTracker';

describe('TransactionRepository', () => {
  let repository: TransactionRepository;
  let mockPool: any;

  beforeEach(() => {
    mockPool = {
      query: vi.fn(),
    };
    repository = new TransactionRepository(mockPool);
  });

  describe('create', () => {
    it('should create a transaction with generated ID', async () => {
      const transactionData = {
        from: 'lev' as const,
        to: 'danik' as const,
        amount: 100,
        timestamp: Date.now(),
        description: 'Test transaction',
      };

      const mockRow = {
        id: 'generated-uuid',
        from_entity: 'lev',
        to_entity: 'danik',
        amount: '100',
        timestamp: transactionData.timestamp.toString(),
        description: 'Test transaction',
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockRow],
        command: 'INSERT',
        oid: 0,
        rowCount: 1,
        fields: [],
      });

      const result = await repository.create(transactionData);

      expect(result).toEqual({
        id: 'generated-uuid',
        from: 'lev',
        to: 'danik',
        amount: 100,
        timestamp: transactionData.timestamp,
        description: 'Test transaction',
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO debt_transactions_v2'),
        expect.arrayContaining([
          expect.any(String), // UUID
          'lev',
          'danik',
          100,
          transactionData.timestamp,
          'Test transaction',
        ])
      );
    });

    it('should create a transaction without description', async () => {
      const transactionData = {
        from: 'danik' as const,
        to: '2masters' as const,
        amount: 50,
        timestamp: Date.now(),
      };

      const mockRow = {
        id: 'generated-uuid',
        from_entity: 'danik',
        to_entity: '2masters',
        amount: '50',
        timestamp: transactionData.timestamp.toString(),
        description: null,
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockRow],
        command: 'INSERT',
        oid: 0,
        rowCount: 1,
        fields: [],
      });

      const result = await repository.create(transactionData);

      expect(result.description).toBeUndefined();
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          expect.any(String),
          'danik',
          '2masters',
          50,
          transactionData.timestamp,
          null,
        ])
      );
    });
  });

  describe('getAll', () => {
    it('should retrieve all transactions ordered by timestamp', async () => {
      const mockRows = [
        {
          id: 'id-1',
          from_entity: 'lev',
          to_entity: 'danik',
          amount: '100',
          timestamp: '1000',
          description: 'Transaction 1',
        },
        {
          id: 'id-2',
          from_entity: 'danik',
          to_entity: '2masters',
          amount: '50',
          timestamp: '500',
          description: null,
        },
      ];

      mockPool.query.mockResolvedValueOnce({
        rows: mockRows,
        command: 'SELECT',
        oid: 0,
        rowCount: 2,
        fields: [],
      });

      const result = await repository.getAll();

      expect(result).toEqual([
        {
          id: 'id-1',
          from: 'lev',
          to: 'danik',
          amount: 100,
          timestamp: 1000,
          description: 'Transaction 1',
        },
        {
          id: 'id-2',
          from: 'danik',
          to: '2masters',
          amount: 50,
          timestamp: 500,
          description: undefined,
        },
      ]);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY timestamp DESC')
      );
    });

    it('should return empty array when no transactions exist', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        oid: 0,
        rowCount: 0,
        fields: [],
      });

      const result = await repository.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a transaction with all fields', async () => {
      const id = 'existing-id';
      const updates = {
        from: 'danik' as const,
        to: 'lev' as const,
        amount: 200,
        timestamp: 2000,
        description: 'Updated description',
      };

      // Mock check query
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id }],
        command: 'SELECT',
        oid: 0,
        rowCount: 1,
        fields: [],
      });

      // Mock update query
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id,
            from_entity: 'danik',
            to_entity: 'lev',
            amount: '200',
            timestamp: '2000',
            description: 'Updated description',
          },
        ],
        command: 'UPDATE',
        oid: 0,
        rowCount: 1,
        fields: [],
      });

      const result = await repository.update(id, updates);

      expect(result).toEqual({
        id,
        from: 'danik',
        to: 'lev',
        amount: 200,
        timestamp: 2000,
        description: 'Updated description',
      });
    });

    it('should update only specified fields', async () => {
      const id = 'existing-id';
      const updates = {
        amount: 150,
      };

      // Mock check query
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id }],
        command: 'SELECT',
        oid: 0,
        rowCount: 1,
        fields: [],
      });

      // Mock update query
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id,
            from_entity: 'lev',
            to_entity: 'danik',
            amount: '150',
            timestamp: '1000',
            description: 'Original description',
          },
        ],
        command: 'UPDATE',
        oid: 0,
        rowCount: 1,
        fields: [],
      });

      const result = await repository.update(id, updates);

      expect(result.amount).toBe(150);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('amount = $1'),
        expect.arrayContaining([150, id])
      );
    });

    it('should throw error when transaction not found', async () => {
      const id = 'non-existent-id';

      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        oid: 0,
        rowCount: 0,
        fields: [],
      });

      await expect(repository.update(id, { amount: 100 })).rejects.toThrow(
        `Transaction with id ${id} not found`
      );
    });

    it('should return existing transaction when no updates provided', async () => {
      const id = 'existing-id';

      // Mock check query
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id }],
        command: 'SELECT',
        oid: 0,
        rowCount: 1,
        fields: [],
      });

      // Mock select query for returning existing transaction
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id,
            from_entity: 'lev',
            to_entity: 'danik',
            amount: '100',
            timestamp: '1000',
            description: 'Original',
          },
        ],
        command: 'SELECT',
        oid: 0,
        rowCount: 1,
        fields: [],
      });

      const result = await repository.update(id, {});

      expect(result).toEqual({
        id,
        from: 'lev',
        to: 'danik',
        amount: 100,
        timestamp: 1000,
        description: 'Original',
      });
    });
  });

  describe('delete', () => {
    it('should delete a transaction', async () => {
      const id = 'existing-id';

      mockPool.query.mockResolvedValueOnce({
        rows: [{ id }],
        command: 'DELETE',
        oid: 0,
        rowCount: 1,
        fields: [],
      });

      await repository.delete(id);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM debt_transactions_v2'),
        [id]
      );
    });

    it('should throw error when transaction not found', async () => {
      const id = 'non-existent-id';

      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'DELETE',
        oid: 0,
        rowCount: 0,
        fields: [],
      });

      await expect(repository.delete(id)).rejects.toThrow(
        `Transaction with id ${id} not found`
      );
    });
  });
});
