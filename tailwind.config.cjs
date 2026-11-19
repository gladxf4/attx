/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      screens: {
        xs: "400px",
      },
      colors: {
        ink: {
          950: "#07080c",
          900: "#0b0c11",
          850: "#0f1016",
          800: "#14151c",
          750: "#191a22",
          700: "#20212b",
          600: "#2b2d39",
        },
        brand: {
          300: "#8cc4ff",
          400: "#5aa9ff",
          500: "#2f8cff",
          600: "#1670f0",
          700: "#0d55c4",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 24px 48px -24px rgba(0,0,0,0.7)",
        dock: "0 1px 0 0 rgba(255,255,255,0.08) inset, 0 20px 50px -12px rgba(0,0,0,0.85)",
        glow: "0 0 0 1px rgba(47,140,255,0.35), 0 8px 30px -6px rgba(47,140,255,0.45)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        shimmer: "shimmer 2.2s linear infinite",
      },
    },
  },
  plugins: [],
};
