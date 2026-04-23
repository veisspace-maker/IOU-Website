/**
 * Tests for the test configuration utilities
 */

import { describe, it, expect } from 'vitest';
import { PBT_CONFIG, createPropertyTestTag } from './testConfig';

describe('Test Configuration', () => {
  describe('PBT_CONFIG', () => {
    it('should have numRuns set to 100', () => {
      expect(PBT_CONFIG.numRuns).toBe(100);
    });

    it('should be a constant configuration object', () => {
      // TypeScript prevents modification at compile time with 'as const'
      // This test verifies the value is correct
      expect(PBT_CONFIG).toEqual({ numRuns: 100 });
      expect(typeof PBT_CONFIG.numRuns).toBe('number');
    });
  });

  describe('createPropertyTestTag', () => {
    it('should create a properly formatted tag', () => {
      const tag = createPropertyTestTag(
        8,
        'Direct Transaction Debt Calculation (Lev to Danik)',
        '3.1'
      );
      
      expect(tag).toContain('Feature: debt-tracker-v2');
      expect(tag).toContain('Property 8');
      expect(tag).toContain('Direct Transaction Debt Calculation (Lev to Danik)');
      expect(tag).toContain('Validates: Requirements 3.1');
    });

    it('should handle multiple requirements', () => {
      const tag = createPropertyTestTag(
        10,
        'Debt Calculation Additivity',
        '3.3, 4.3, 5.3'
      );
      
      expect(tag).toContain('Requirements 3.3, 4.3, 5.3');
    });
  });
});
