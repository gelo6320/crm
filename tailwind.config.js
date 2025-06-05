// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FF6B00",
          hover: "#FF8C38",
        },
        secondary: "#212121",
        dark: {
          DEFAULT: "#151515",
          accent: "#333333",
        },
        success: "#27ae60",
        warning: "#e67e22",
        danger: "#e74c3c",
        info: "#3498db",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        montserrat: ['Montserrat', 'Inter', 'sans-serif'], // Aggiunto Montserrat
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-in": "slideIn 0.3s ease-in-out",
        "scale-in": "scaleIn 0.3s ease-in-out",
        // Animazioni aggiuntive per la dashboard moderna
        "float": "float 6s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.9)", opacity: 0 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        // Nuove animazioni per la dashboard
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)" },
          "100%": { boxShadow: "0 0 30px rgba(16, 185, 129, 0.6)" },
        },
      },
      // Aggiunto backdrop blur personalizzati
      backdropBlur: {
        xs: '2px',
      },
      // Aggiunto spacing personalizzati per la dashboard
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}