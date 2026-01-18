/**
 * Design System Color Constants
 * 
 * Centralized color definitions matching the new UI design system.
 * These align with the Tailwind config but provide TypeScript types.
 */

export const colors = {
  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    gradient: {
      start: '#F3F4F6',
      end: '#FFFFFF',
    },
  },

  // Text Colors
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    muted: '#9CA3AF',
  },

  // Brand Colors
  brand: {
    primary: '#9333EA',
    light: '#F3E8FF',
    dark: '#6B21A8',
  },

  // Finance Colors
  finance: {
    income: '#00A86B',
    expense: '#FD3C4A',
    warning: '#F59E0B',
    success: '#10B981',
  },

  // Status Colors
  status: {
    urgent: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#3B82F6',
  },
} as const;

/**
 * Helper function to get gradient colors array
 */
export function getGradientColors(): [string, string] {
  return [colors.background.gradient.start, colors.background.gradient.end];
}
