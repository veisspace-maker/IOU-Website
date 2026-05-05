import { describe, it, expect } from 'vitest';
import { calculateLeaveOwed } from './calculations';
import { LeaveRecord } from '../types/models';

describe('calculateLeaveOwed', () => {
  const users = [
    { id: 'user1', username: 'Danik' },
    { id: 'user2', username: 'Leva' }
  ];

  it('should return zero debt when no leave records exist', () => {
    const leaveRecords: LeaveRecord[] = [];
    const result = calculateLeaveOwed(leaveRecords, users);
    
    expect(result.debtor).toBeNull();
    expect(result.creditor).toBeNull();
    expect(result.amount).toBe(0);
  });

  it('should calculate debt when one user takes leave', () => {
    const leaveRecords: LeaveRecord[] = [
      {
        id: '1',
        userId: 'user1',
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-05-05'),
        businessDays: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const result = calculateLeaveOwed(leaveRecords, users);
    
    expect(result.debtor).toBe('user2');
    expect(result.creditor).toBe('user1');
    expect(result.amount).toBe(5);
  });

  it('should calculate net debt when both users take leave', () => {
    const leaveRecords: LeaveRecord[] = [
      {
        id: '1',
        userId: 'user1',
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-05-05'),
        businessDays: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        userId: 'user2',
        startDate: new Date('2026-05-10'),
        endDate: new Date('2026-05-11'),
        businessDays: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const result = calculateLeaveOwed(leaveRecords, users);
    
    expect(result.debtor).toBe('user2');
    expect(result.creditor).toBe('user1');
    expect(result.amount).toBe(3);
  });

  it('should return zero debt when leave is balanced', () => {
    const leaveRecords: LeaveRecord[] = [
      {
        id: '1',
        userId: 'user1',
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-05-05'),
        businessDays: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        userId: 'user2',
        startDate: new Date('2026-05-10'),
        endDate: new Date('2026-05-16'),
        businessDays: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const result = calculateLeaveOwed(leaveRecords, users);
    
    expect(result.debtor).toBeNull();
    expect(result.creditor).toBeNull();
    expect(result.amount).toBe(0);
  });

  it('should handle reverse debt direction', () => {
    const leaveRecords: LeaveRecord[] = [
      {
        id: '1',
        userId: 'user2',
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-05-10'),
        businessDays: 8,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        userId: 'user1',
        startDate: new Date('2026-05-15'),
        endDate: new Date('2026-05-16'),
        businessDays: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const result = calculateLeaveOwed(leaveRecords, users);
    
    expect(result.debtor).toBe('user1');
    expect(result.creditor).toBe('user2');
    expect(result.amount).toBe(6);
  });

  it('should handle multiple leave records per user', () => {
    const leaveRecords: LeaveRecord[] = [
      {
        id: '1',
        userId: 'user1',
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-05-02'),
        businessDays: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        userId: 'user1',
        startDate: new Date('2026-05-10'),
        endDate: new Date('2026-05-12'),
        businessDays: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        userId: 'user2',
        startDate: new Date('2026-05-20'),
        endDate: new Date('2026-05-20'),
        businessDays: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const result = calculateLeaveOwed(leaveRecords, users);
    
    expect(result.debtor).toBe('user2');
    expect(result.creditor).toBe('user1');
    expect(result.amount).toBe(4); // user1: 5 days, user2: 1 day, difference: 4
  });

  it('should return zero for non-2-person systems', () => {
    const threeUsers = [
      { id: 'user1', username: 'Danik' },
      { id: 'user2', username: 'Leva' },
      { id: 'user3', username: 'Josh' }
    ];

    const leaveRecords: LeaveRecord[] = [
      {
        id: '1',
        userId: 'user1',
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-05-05'),
        businessDays: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const result = calculateLeaveOwed(leaveRecords, threeUsers);
    
    expect(result.debtor).toBeNull();
    expect(result.creditor).toBeNull();
    expect(result.amount).toBe(0);
  });
});
