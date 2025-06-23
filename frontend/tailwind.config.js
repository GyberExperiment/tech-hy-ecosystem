/** @type {import('tailwindcss').Config} */
import { fontFamily } from "tailwindcss/defaultTheme"

export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "xs": "375px",
        "sm": "640px", 
        "md": "768px",
        "lg": "1024px",
        "xl": "1280px",
        "2xl": "1400px",
      },
    },
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px', 
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1400px',
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
        mono: ["var(--font-mono)", ...fontFamily.mono],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "slide-in-from-top": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-in-from-bottom": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-in-from-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-in-from-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 5px rgba(59, 130, 246, 0.5)" },
          "50%": { boxShadow: "0 0 20px rgba(59, 130, 246, 0.8)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "glass-float": {
          "0%, 100%": { 
            transform: "translateY(0px) rotate(0deg)",
            backdropFilter: "blur(24px) brightness(120%) saturate(140%)",
          },
          "50%": { 
            transform: "translateY(-20px) rotate(1deg)",
            backdropFilter: "blur(32px) brightness(125%) saturate(150%)",
          },
        },
        "glass-pulse": {
          "0%, 100%": { 
            backdropFilter: "blur(24px) brightness(120%) saturate(140%)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          },
          "50%": { 
            backdropFilter: "blur(32px) brightness(130%) saturate(160%)",
            boxShadow: "0 16px 64px rgba(0, 0, 0, 0.4)",
          },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-out",
        "slide-in-from-top": "slide-in-from-top 0.3s ease-out",
        "slide-in-from-bottom": "slide-in-from-bottom 0.3s ease-out",
        "slide-in-from-left": "slide-in-from-left 0.3s ease-out",
        "slide-in-from-right": "slide-in-from-right 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "scale-in": "scale-in 0.2s ease-out",
        "glass-float": "glass-float 6s ease-in-out infinite",
        "glass-pulse": "glass-pulse 4s ease-in-out infinite",
        "gradient-shift": "gradient-shift 4s ease-in-out infinite",
      },
      backdropBlur: {
        xs: "2px",
        '25': '25px',
        '30': '30px',
        '35': '35px',
        '40': '40px',
        '45': '45px',
        '50': '50px',
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.1) 100%)',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'out-back': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
        'in-out-back': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'out-quad': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'in-out-quart': 'cubic-bezier(0.77, 0, 0.175, 1)',
        'in-out-sine': 'cubic-bezier(0.42, 0, 0.58, 1)',
        'premium': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'dramatic': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      transitionDuration: {
        '150': '150ms',
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'glass-hover': '0 16px 64px rgba(0, 0, 0, 0.4), 0 8px 32px rgba(0, 0, 0, 0.3)',
        'glass-primary': '0 8px 32px rgba(99, 102, 241, 0.3), 0 4px 16px rgba(99, 102, 241, 0.2)',
        'glass-secondary': '0 8px 32px rgba(168, 85, 247, 0.3), 0 4px 16px rgba(168, 85, 247, 0.2)',
        'premium': '0 24px 64px rgba(0, 0, 0, 0.5), 0 12px 32px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/aspect-ratio"),
    function({ addUtilities }) {
      const newUtilities = {
        '.glass-base': {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px) brightness(110%) saturate(130%)',
          WebkitBackdropFilter: 'blur(20px) brightness(110%) saturate(130%)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        },
        '.glass-intense': {
          backdropFilter: 'blur(32px) brightness(125%) saturate(150%) contrast(115%)',
          WebkitBackdropFilter: 'blur(32px) brightness(125%) saturate(150%) contrast(115%)',
        },
        '.glass-subtle': {
          backdropFilter: 'blur(12px) brightness(105%) saturate(110%)',
          WebkitBackdropFilter: 'blur(12px) brightness(105%) saturate(110%)',
        },
        '.text-shadow-premium': {
          textShadow: '0 2px 8px rgba(0, 0, 0, 0.7), 0 4px 16px rgba(0, 0, 0, 0.3)',
        },
        '.border-glass': {
          border: '1px solid rgba(255, 255, 255, 0.15)',
        },
        '.ease-premium': {
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '.ease-dramatic': {
          transitionTimingFunction: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}

