/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb', // Primary
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        nest: {
          primary: '#2563EB',
          secondary: '#3B82F6',
          dark: '#0F172A',
          light: '#F8FAFC',
          accent: '#10B981',
          gold: '#F59E0B'
        }
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        sans: ['Inter', 'Poppins', 'sans-serif']
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(37, 99, 235, 0.08)',
        'glass-hover': '0 12px 40px 0 rgba(37, 99, 235, 0.15)',
        'card-glow': '0 0 25px -5px rgba(37, 99, 235, 0.25)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
