import { Transaction, DebtResult } from '../../types/debtTracker';

/**
 * DebtCalculator module for calculating net debt between Lev and Danik
 * based on transaction history.
 * 
 * The calculation uses a single accumulator (levOwes) where:
 * - Positive values mean Lev owes Danik
 * - Negative values mean Danik owes Lev
 */

/**
 * Calculates the net debt between Lev and Danik from a list of transactions.
 * 
 * Algorithm:
 * 1. Initialize levOwes = 0
 * 2. For each transaction, apply the appropriate rule:
 *    - lev → danik: levOwes -= amount (Danik owes Lev)
 *    - danik → lev: levOwes += amount (Lev owes Danik)
 *    - lev → 2masters: levOwes -= amount / 2 (Danik owes Lev half)
 *    - 2masters → lev: levOwes += amount / 2 (Lev owes Danik half)
 *    - danik → 2masters: levOwes += amount / 2 (Lev owes Danik half)
 *    - 2masters → danik: levOwes -= amount / 2 (Danik owes Lev half)
 * 3. Return DebtResult based on final levOwes value
 * 
 * @param transactions - Array of transactions to process
 * @returns DebtResult indicating who owes whom and how much
 */
export function calculateNetDebt(transactions: Transaction[]): DebtResult {
  let levOwes = 0;

  for (const transaction of transactions) {
    const { from, to, amount } = transaction;

    // Apply calculation rules based on transaction type
    if (from === 'lev' && to === 'danik') {
      // lev → danik: Danik owes Lev
      levOwes -= amount;
    } else if (from === 'danik' && to === 'lev') {
      // danik → lev: Lev owes Danik
      levOwes += amount;
    } else if (from === 'lev' && to === '2masters') {
      // lev → 2masters: Danik owes Lev half
      levOwes -= amount / 2;
    } else if (from === '2masters' && to === 'lev') {
      // 2masters → lev: Lev owes Danik half
      levOwes += amount / 2;
    } else if (from === 'danik' && to === '2masters') {
      // danik → 2masters: Lev owes Danik half
      levOwes += amount / 2;
    } else if (from === '2masters' && to === 'danik') {
      // 2masters → danik: Danik owes Lev half
      levOwes -= amount / 2;
    }
  }

  // Convert levOwes to DebtResult
  if (levOwes > 0) {
    // Lev owes Danik
    return {
      debtor: 'lev',
      creditor: 'danik',
      amount: levOwes
    };
  } else if (levOwes < 0) {
    // Danik owes Lev
    return {
      debtor: 'danik',
      creditor: 'lev',
      amount: Math.abs(levOwes)
    };
  } else {
    // No debt
    return {
      debtor: 'none',
      creditor: 'none',
      amount: 0
    };
  }
}
