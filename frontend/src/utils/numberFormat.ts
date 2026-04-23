/**
 * Formats a number with thousand separators and exactly 2 decimal places
 * @param value - The number to format
 * @returns Formatted string in the format x,xxx.xx or xxx,xxx.xx
 * 
 * @example
 * formatNumber(1234.5) // "1,234.50"
 * formatNumber(123456.789) // "123,456.79"
 * formatNumber(42) // "42.00"
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Formats a number as currency with thousand separators and exactly 2 decimal places
 * @param value - The number to format
 * @returns Formatted string with $ prefix in the format $x,xxx.xx or $xxx,xxx.xx
 * 
 * @example
 * formatCurrency(1234.5) // "$1,234.50"
 * formatCurrency(123456.789) // "$123,456.79"
 * formatCurrency(42) // "$42.00"
 */
export function formatCurrency(value: number): string {
  return `$${formatNumber(value)}`;
}
