/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Status colors
        status: {
          open: {
            DEFAULT: '#10b981',
            light: '#d1fae5',
            dark: '#065f46',
          },
          pending: {
            DEFAULT: '#f59e0b',
            light: '#fef3c7',
            dark: '#92400e',
          },
          resolved: {
            DEFAULT: '#3b82f6',
            light: '#dbeafe',
            dark: '#1e40af',
          },
          closed: {
            DEFAULT: '#6b7280',
            light: '#f3f4f6',
            dark: '#374151',
          },
        },
        // Priority colors
        priority: {
          low: {
            DEFAULT: '#6b7280',
            light: '#f3f4f6',
            dark: '#374151',
          },
          medium: {
            DEFAULT: '#3b82f6',
            light: '#dbeafe',
            dark: '#1e40af',
          },
          high: {
            DEFAULT: '#f97316',
            light: '#ffedd5',
            dark: '#9a3412',
          },
          urgent: {
            DEFAULT: '#ef4444',
            light: '#fee2e2',
            dark: '#991b1b',
          },
        },
        // Role colors
        role: {
          customer: {
            DEFAULT: '#3b82f6',
            light: '#dbeafe',
            dark: '#1e40af',
          },
          agent: {
            DEFAULT: '#10b981',
            light: '#d1fae5',
            dark: '#065f46',
          },
          manager: {
            DEFAULT: '#8b5cf6',
            light: '#ede9fe',
            dark: '#5b21b6',
          },
          admin: {
            DEFAULT: '#ef4444',
            light: '#fee2e2',
            dark: '#991b1b',
          },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
