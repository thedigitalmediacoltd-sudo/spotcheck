/**
 * Shared utilities for item/category operations
 * Centralized to avoid duplication across components
 */

/**
 * Maps database category to display name
 */
export function mapCategoryToDisplay(category: string): string {
  switch (category) {
    case 'insurance':
      return 'Insurance';
    case 'gov':
      return 'Vehicle';
    case 'sub':
      return 'Subscription';
    case 'warranty':
      return 'Warranty';
    case 'contract':
      return 'Contract';
    default:
      return category;
  }
}

/**
 * Calculates days until expiry date
 * Returns null if no expiry date provided
 */
export function calculateDaysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  
  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Gets category label in uppercase format
 */
export function getCategoryLabel(category: string): string {
  switch (category) {
    case 'gov':
      return 'HOME';
    case 'insurance':
      return 'INSURANCE';
    case 'sub':
      return 'DIGITAL';
    case 'vehicle':
      return 'VEHICLE';
    default:
      return mapCategoryToDisplay(category).toUpperCase();
  }
}
