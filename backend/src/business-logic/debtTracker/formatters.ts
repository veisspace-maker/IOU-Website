import { DebtResult, Entity } from '../../types/debtTrackerV2';

/**
 * Converts a DebtResult to a human-readable display string
 * @param result - The debt calculation result
 * @returns A formatted string like "Danik owes Lev $50.00" or "No debt"
 */
export function formatDebtDisplay(result: DebtResult): string {
  if (result.debtor === 'none' || result.creditor === 'none' || result.amount === 0) {
    return 'No debt';
  }

  const debtorName = formatEntityName(result.debtor);
  const creditorName = formatEntityName(result.creditor);
  const formattedAmount = formatCurrency(result.amount);

  return `${debtorName} owes ${creditorName} ${formattedAmount}`;
}

/**
 * Formats an amount as currency with $ symbol and 2 decimal places
 * @param amount - The numeric amount to format
 * @returns A formatted currency string like "$50.00"
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Converts entity names to display format
 * @param entity - The entity name ('lev', 'danik', or '2masters')
 * @returns The display name with proper capitalization
 */
export function formatEntityName(entity: Entity): string {
  if (entity === '2masters') {
    return '2 Masters';
  }
  return entity.charAt(0).toUpperCase() + entity.slice(1);
}

/**
 * Converts a Unix timestamp to a human-readable format
 * @param timestamp - Unix timestamp in milliseconds
 * @returns A formatted date string like "15 Jan 2024, 3:45 pm"
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Australia/Melbourne',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  
  return date.toLocaleString('en-AU', options);
}
