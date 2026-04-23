// Debt calculation business logic for the Debt Tracker system

export type Entity = 'Lev' | 'Danik' | '2_Masters';

export interface Transaction {
  id: number;
  from: Entity;
  to: Entity;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NetDebt {
  debtor: 'Lev' | 'Danik' | null;
  creditor: 'Lev' | 'Danik' | null;
  amount: number;
}

/**
 * Calculates the net debt between Lev and Danik based on all transactions.
 * 
 * The function processes all transaction types:
 * - Direct transactions: Lev ↔ Danik
 * - Split transactions: Lev ↔ 2_Masters, Danik ↔ 2_Masters
 * 
 * For split transactions involving 2_Masters, the debt contribution is half the transaction amount.
 * 
 * @param transactions - Array of all transactions to process
 * @returns NetDebt object with debtor, creditor, and amount
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */
export function calculateNetDebt(transactions: Transaction[]): NetDebt {
  let levOwes = 0; // Positive means Lev owes Danik, negative means Danik owes Lev
  
  for (const tx of transactions) {
    if (tx.from === 'Lev' && tx.to === 'Danik') {
      // Lev paid Danik directly - reduces Lev's debt
      levOwes -= tx.amount;
    } else if (tx.from === 'Danik' && tx.to === 'Lev') {
      // Danik paid Lev directly - increases Lev's debt
      levOwes += tx.amount;
    } else if (tx.from === 'Lev' && tx.to === '2_Masters') {
      // Lev paid for both - Danik owes Lev half
      levOwes -= tx.amount / 2;
    } else if (tx.from === '2_Masters' && tx.to === 'Lev') {
      // Lev received from shared - Danik paid Lev's half
      levOwes -= tx.amount / 2;
    } else if (tx.from === 'Danik' && tx.to === '2_Masters') {
      // Danik paid for both - Lev owes Danik half
      levOwes += tx.amount / 2;
    } else if (tx.from === '2_Masters' && tx.to === 'Danik') {
      // Danik received from shared - Lev paid Danik's half
      levOwes += tx.amount / 2;
    }
  }
  
  if (levOwes > 0) {
    return { debtor: 'Lev', creditor: 'Danik', amount: levOwes };
  } else if (levOwes < 0) {
    return { debtor: 'Danik', creditor: 'Lev', amount: -levOwes };
  } else {
    return { debtor: null, creditor: null, amount: 0 };
  }
}
