const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './stories/**/*.{js,ts,jsx,tsx,mdx}',
    './cms/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.5rem',
        lg: '3rem',
        '2xl': '5rem'
      }
    },
    extend: {
      colors: {
        brand: {
          turquoise: 'rgb(var(--color-brand-turquoise) / <alpha-value>)',
          orange: 'rgb(var(--color-brand-orange) / <alpha-value>)',
          navy: 'rgb(var(--color-brand-navy) / <alpha-value>)',
          midnight: 'rgb(var(--color-brand-midnight) / <alpha-value>)',
          sand: 'rgb(var(--color-brand-sand) / <alpha-value>)'
        },
        surface: {
          DEFAULT: 'rgb(var(--color-surface-base) / <alpha-value>)',
          subtle: 'rgb(var(--color-surface-subtle) / <alpha-value>)',
          strong: 'rgb(var(--color-surface-strong) / <alpha-value>)'
        },
        stroke: {
          DEFAULT: 'rgb(var(--color-stroke-default) / <alpha-value>)',
          strong: 'rgb(var(--color-stroke-strong) / <alpha-value>)'
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
        display: ['var(--font-display)', ...defaultTheme.fontFamily.sans]
      },
      borderRadius: {
        xl: '1.5rem'
      },
      boxShadow: {
        focus: '0 0 0 4px rgb(var(--color-brand-turquoise) / 0.2)',
        card: '0 30px 60px -40px rgba(5, 27, 53, 0.35)'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.6s ease-out forwards'
      }
    }
  },
  plugins: [require('@tailwindcss/forms')],
  safelist: ['bg-brand-turquoise', 'bg-brand-orange', 'text-brand-navy']
}
