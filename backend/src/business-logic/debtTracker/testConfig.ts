/**
 * Test configuration for Debt Tracker V2 property-based tests
 * 
 * This file provides shared configuration and utilities for property-based testing
 * using fast-check.
 */

/**
 * Standard configuration for property-based tests
 * 
 * All property-based tests in the Debt Tracker V2 system should use
 * this configuration to ensure consistency and meet the minimum
 * iteration requirement.
 */
export const PBT_CONFIG = {
  /**
   * Minimum number of test iterations for each property test
   * 
   * As specified in the design document, all property-based tests
   * must run at least 100 iterations to ensure comprehensive coverage.
   */
  numRuns: 100
} as const;

/**
 * Helper function to create a property test tag comment
 * 
 * @param propertyNumber - The property number from the design document
 * @param propertyName - The property name/description
 * @param requirements - Comma-separated requirement IDs (e.g., "3.1, 3.2")
 * @returns A formatted comment string for the test
 * 
 * @example
 * ```typescript
 * // Feature: debt-tracker-v2, Property 8: Direct Transaction Debt Calculation (Lev to Danik)
 * // Validates: Requirements 3.1
 * ```
 */
export function createPropertyTestTag(
  propertyNumber: number,
  propertyName: string,
  requirements: string
): string {
  return `Feature: debt-tracker-v2, Property ${propertyNumber}: ${propertyName}\nValidates: Requirements ${requirements}`;
}
