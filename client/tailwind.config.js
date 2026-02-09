/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Calistoga', 'serif'], // Optional for luxury headers if available
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7', // Fallback
          // Brand gradient stops
          start: 'hsl(224, 60%, 25%)',
          end: 'hsl(250, 60%, 30%)',
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
        // Semantic Status Colors (Refined)
        status: {
          open: { DEFAULT: '#10b981', light: '#ecfdf5', dark: '#064e3b' },
          pending: { DEFAULT: '#f59e0b', light: '#fffbeb', dark: '#78350f' },
          resolved: { DEFAULT: '#3b82f6', light: '#eff6ff', dark: '#1e3a8a' },
          closed: { DEFAULT: '#64748b', light: '#f8fafc', dark: '#334155' },
        },
        role: {
          customer: { DEFAULT: '#3b82f6', light: '#eff6ff', dark: '#1e3a8a' },
          agent: { DEFAULT: '#10b981', light: '#ecfdf5', dark: '#064e3b' },
          manager: { DEFAULT: '#8b5cf6', light: '#f5f3ff', dark: '#4c1d95' },
          admin: { DEFAULT: '#ef4444', light: '#fef2f2', dark: '#7f1d1d' },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'pill': '9999px',
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.03)',
        'medium': '0 4px 20px rgba(0, 0, 0, 0.06)',
        'hard': '0 10px 40px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 20px rgba(var(--primary), 0.3)',
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'enter': 'enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
