/**
 * Currency formatting utilities
 */

export type Currency = 'TK' | 'USD' | 'GBP' | 'EUR' | 'BDT';

interface CurrencyConfig {
  symbol: string;
  position: 'before' | 'after';
  decimalPlaces: number;
  thousandSeparator: string;
  decimalSeparator: string;
}

const CURRENCY_CONFIG: Record<Currency, CurrencyConfig> = {
  TK: {
    symbol: 'TK',
    position: 'after',
    decimalPlaces: 0,
    thousandSeparator: ',',
    decimalSeparator: '.',
  },
  BDT: {
    symbol: 'TK',
    position: 'after',
    decimalPlaces: 0,
    thousandSeparator: ',',
    decimalSeparator: '.',
  },
  USD: {
    symbol: '$',
    position: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
  },
  GBP: {
    symbol: '£',
    position: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
  },
  EUR: {
    symbol: '€',
    position: 'before',
    decimalPlaces: 2,
    thousandSeparator: '.',
    decimalSeparator: ',',
  },
};

/**
 * Formats a number as currency
 * 
 * @param amount - The amount to format
 * @param currency - Currency code (default: 'TK')
 * @param options - Formatting options
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(1234.56, 'TK') // "1,235 TK"
 * formatCurrency(1234.56, 'USD') // "$1,234.56"
 * formatCurrency(112315, 'TK') // "1,12,315 TK" (Indian-style grouping)
 */
export function formatCurrency(
  amount: number,
  currency: Currency = 'TK',
  options?: {
    showDecimals?: boolean;
    compact?: boolean;
  }
): string {
  const config = CURRENCY_CONFIG[currency];
  const showDecimals = options?.showDecimals ?? (config.decimalPlaces > 0);
  const compact = options?.compact ?? false;

  if (compact) {
    return formatCompactCurrency(amount, currency);
  }

  // Format number with appropriate decimal places
  let formattedNumber: string;
  if (showDecimals) {
    formattedNumber = amount.toFixed(config.decimalPlaces);
  } else {
    formattedNumber = Math.round(amount).toString();
  }

  // Add thousand separators (Indian-style for TK/BDT, standard for others)
  if (currency === 'TK' || currency === 'BDT') {
    formattedNumber = addIndianStyleSeparators(formattedNumber, config.decimalSeparator);
  } else {
    formattedNumber = addStandardSeparators(formattedNumber, config.thousandSeparator, config.decimalSeparator);
  }

  // Add currency symbol
  if (config.position === 'before') {
    return `${config.symbol}${formattedNumber}`;
  } else {
    return `${formattedNumber} ${config.symbol}`;
  }
}

/**
 * Formats a number in compact notation (1.2K, 12.5M, etc.)
 */
export function formatCompactNumber(amount: number, currency: Currency = 'TK'): string {
  const config = CURRENCY_CONFIG[currency];
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (absAmount >= 1000000) {
    return `${sign}${(absAmount / 1000000).toFixed(1)}M ${config.symbol}`;
  } else if (absAmount >= 1000) {
    return `${sign}${(absAmount / 1000).toFixed(1)}K ${config.symbol}`;
  } else {
    return formatCurrency(amount, currency, { showDecimals: false });
  }
}

/**
 * Formats currency in compact notation
 */
function formatCompactCurrency(amount: number, currency: Currency): string {
  const config = CURRENCY_CONFIG[currency];
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (absAmount >= 1000000) {
    const value = (absAmount / 1000000).toFixed(1);
    return config.position === 'before'
      ? `${sign}${config.symbol}${value}M`
      : `${sign}${value}M ${config.symbol}`;
  } else if (absAmount >= 1000) {
    const value = (absAmount / 1000).toFixed(1);
    return config.position === 'before'
      ? `${sign}${config.symbol}${value}K`
      : `${sign}${value}K ${config.symbol}`;
  } else {
    return formatCurrency(amount, currency);
  }
}

/**
 * Adds Indian-style thousand separators (1,12,315)
 */
function addIndianStyleSeparators(number: string, decimalSeparator: string): string {
  const parts = number.split(decimalSeparator === '.' ? '.' : ',');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian numbering: groups of 2 digits after first 3 digits
  let result = '';
  let remaining = integerPart;

  if (remaining.length > 3) {
    // First 3 digits
    result = remaining.slice(-3);
    remaining = remaining.slice(0, -3);

    // Then groups of 2
    while (remaining.length > 0) {
      if (remaining.length >= 2) {
        result = remaining.slice(-2) + ',' + result;
        remaining = remaining.slice(0, -2);
      } else {
        result = remaining + ',' + result;
        remaining = '';
      }
    }
  } else {
    result = integerPart;
  }

  return decimalPart ? `${result}${decimalSeparator}${decimalPart}` : result;
}

/**
 * Adds standard thousand separators (1,234,567)
 */
function addStandardSeparators(
  number: string,
  thousandSeparator: string,
  decimalSeparator: string
): string {
  const parts = number.split(decimalSeparator === '.' ? '.' : ',');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  const result = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);

  return decimalPart ? `${result}${decimalSeparator}${decimalPart}` : result;
}

/**
 * Parses a currency string back to a number
 * 
 * @param currencyString - Formatted currency string
 * @returns Parsed number or NaN if invalid
 */
export function parseCurrency(currencyString: string): number {
  // Remove currency symbols and spaces
  const cleaned = currencyString
    .replace(/[TK\$£€]/g, '')
    .replace(/\s+/g, '')
    .replace(/,/g, ''); // Remove thousand separators

  return parseFloat(cleaned);
}
