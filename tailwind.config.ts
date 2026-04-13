import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#9C6644',
          dark: '#7a4f32',
          light: '#b8845f',
          beige: '#EEE0D5',
          'dark-beige': '#dcc8b8',
          'off-white': '#faf7f4',
          text: '#3a2a1e',
        },
        // Material Design 3 colors from Stitch
        surface: {
          DEFAULT: '#fff8f4',
          variant: '#ece0d7',
          container: {
            DEFAULT: '#f8ece2',
            low: '#fef1e8',
            high: '#f2e6dd',
            highest: '#ece0d7',
          },
          dim: '#e4d8cf',
          bright: '#fff8f4',
        },
        primary: {
          DEFAULT: '#6f4627',
          container: '#8b5e3c',
          fixed: '#ffdcc5',
          'fixed-dim': '#f4bb92',
        },
        secondary: {
          DEFAULT: '#675d4f',
          container: '#ecddcc',
          fixed: '#efe0cf',
          'fixed-dim': '#d2c4b4',
        },
        outline: {
          DEFAULT: '#83746b',
          variant: '#d5c3b8',
        },
        background: '#fff8f4',
      },
      fontFamily: {
        cormorant: ['Cormorant Garamond', 'serif'],
        tajawal: ['Tajawal', 'sans-serif'],
        // Stitch fonts
        headline: ['Noto Serif', 'Noto Serif Arabic', 'serif'],
        body: ['Manrope', 'Almarai', 'sans-serif'],
        label: ['Manrope', 'Almarai', 'sans-serif'],
      },
      boxShadow: {
        'editorial': '0 20px 50px -20px rgba(111, 70, 39, 0.08)',
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        marquee: 'marquee 25s linear infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'bounce-cart': 'bounceCart 0.5s ease',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        slideIn: {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        bounceCart: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
