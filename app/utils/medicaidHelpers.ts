/**
 * Utility functions for Medicaid data display
 * Handles conversion from backend "per 1,000 population" format to percentage display
 */

/**
 * Converts Medicaid enrollment rate from "per 1,000 population" to percentage
 * Backend stores rates like 106.8 (meaning 106.8 per 1,000 = 10.68%)
 * @param rate - Rate per 1,000 population
 * @returns Formatted percentage string
 */
export function formatMedicaidRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) return 'N/A';
  
  // Convert from per-1,000 to percentage
  const percentage = rate / 10;
  return `${percentage.toFixed(1)}%`;
}

/**
 * Gets description text for Medicaid enrollment rate
 */
export function getMedicaidRateDescription(): string {
  return 'Percentage of county population enrolled in Medicaid';
}

/**
 * Validates that Medicaid enrollment rate is reasonable (0-100% after conversion)
 * @param rate - Rate per 1,000 population
 * @returns true if rate is valid percentage
 */
export function validateMedicaidRate(rate: number | null | undefined): boolean {
  if (rate === null || rate === undefined) return false;
  
  const percentage = rate / 10;
  return percentage >= 0 && percentage <= 100;
}