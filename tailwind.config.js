/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Legacy brand colors (kept for backward compatibility)
        'brand-primary': '#9333EA',
        'brand-light': '#F3E8FF',
        'brand-dark': '#6B21A8',
        
        // New design system colors
        background: {
          primary: '#FFFFFF',
          secondary: '#F8F9FA',
          'gradient-start': '#F3F4F6',
          'gradient-end': '#FFFFFF',
        },
        text: {
          primary: '#1F2937',
          secondary: '#6B7280',
          muted: '#9CA3AF',
        },
        brand: {
          primary: '#9333EA',
          light: '#F3E8FF',
          dark: '#6B21A8',
        },
        finance: {
          income: '#00A86B',
          expense: '#FD3C4A',
          warning: '#F59E0B',
          success: '#10B981',
        },
        status: {
          urgent: '#EF4444',
          warning: '#F59E0B',
          success: '#10B981',
          info: '#3B82F6',
        },
        
        // Keep existing for compatibility
        income: '#00A86B',
        expense: '#FD3C4A',
      },
    },
  },
  plugins: [],
};
