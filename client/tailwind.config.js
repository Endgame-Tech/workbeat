/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dynamic brand colors using CSS variables
        primary: {
          25: 'var(--primary-25)',
          50: 'var(--primary-50)',
          100: 'var(--primary-100)',
          150: 'var(--primary-150)',
          200: 'var(--primary-200)',
          300: 'var(--primary-300)',
          400: 'var(--primary-400)',
          500: 'var(--primary-500)', // Main brand color
          600: 'var(--primary-600)',
          700: 'var(--primary-700)',
          750: 'var(--primary-750)',
          800: 'var(--primary-800)',
          900: 'var(--primary-900)',
          950: 'var(--primary-950)',
        },
        secondary: {
          25: 'var(--secondary-25)',
          50: 'var(--secondary-50)',
          100: 'var(--secondary-100)',
          150: 'var(--secondary-150)',
          200: 'var(--secondary-200)',
          300: 'var(--secondary-300)',
          400: 'var(--secondary-400)',
          500: 'var(--secondary-500)', // Secondary brand color
          600: 'var(--secondary-600)',
          700: 'var(--secondary-700)',
          750: 'var(--secondary-750)',
          800: 'var(--secondary-800)',
          900: 'var(--secondary-900)',
          950: 'var(--secondary-950)',
        },
        accent: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899', // Accent pink
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
          950: '#500724',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // Success green
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Warning amber
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444', // Danger red
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // UI element colors using CSS variables
        ui: {
          // Navigation 
          navBg: 'var(--color-nav-bg)',
          navBorder: 'var(--color-nav-border)',
          navItemHover: 'var(--color-nav-item-hover)',
          navItemActive: 'var(--color-nav-item-active)',
          navText: 'var(--color-nav-text)',
          navTextActive: 'var(--color-nav-text-active)',
          
          // Sidebar
          sidebarBg: 'var(--color-sidebar-bg)',
          sidebarBorder: 'var(--color-sidebar-border)',
          sidebarItemHover: 'var(--color-sidebar-item-hover)',
          sidebarItemActive: 'var(--color-sidebar-item-active)',
          sidebarText: 'var(--color-sidebar-text)',
          sidebarTextActive: 'var(--color-sidebar-text-active)',
          
          // Card and surface
          cardBg: 'var(--color-card-bg)',
          cardBorder: 'var(--color-card-border)',
          cardHover: 'var(--color-card-hover)',
          surface: 'var(--color-surface)',
          surfaceSecondary: 'var(--color-surface-secondary)',
          
          // Interactive elements
          buttonPrimary: 'var(--color-button-primary)',
          buttonPrimaryHover: 'var(--color-button-primary-hover)',
          buttonPrimaryActive: 'var(--color-button-primary-active)',
          buttonSecondary: 'var(--color-button-secondary)',
          buttonSecondaryHover: 'var(--color-button-secondary-hover)',
          
          // Form elements
          inputBorder: 'var(--color-input-border)',
          inputBorderFocus: 'var(--color-input-border-focus)',
          inputBg: 'var(--color-input-bg)',
          inputText: 'var(--color-input-text)',
          
          // Focus and ring
          focusRing: 'var(--color-focus-ring)',
          focusRingOffset: 'var(--color-focus-ring-offset)',
          
          // Border and divider
          border: 'var(--color-border)',
          borderLight: 'var(--color-border-light)',
          divider: 'var(--color-divider)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'large': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 4px 25px -5px rgba(0, 0, 0, 0.1)',
      },
      // Add gradient background variables
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-secondary': 'var(--gradient-secondary)',
        'gradient-surface': 'var(--gradient-surface)',
      },
    },
  },
  plugins: [],
};
