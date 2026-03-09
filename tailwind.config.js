/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:        "rgb(var(--bg) / <alpha-value>)",
        fg:        "rgb(var(--fg) / <alpha-value>)",
        "card-bg": "rgb(var(--card-bg) / <alpha-value>)",
        "card-border": "rgb(var(--card-border) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          fg:      "rgb(var(--primary-fg) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          fg:      "rgb(var(--secondary-fg) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          fg:      "rgb(var(--muted-fg) / <alpha-value>)",
        },
        destructive: "rgb(var(--destructive) / <alpha-value>)",
        success:     "rgb(var(--success) / <alpha-value>)",
        warning:     "rgb(var(--warning) / <alpha-value>)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card:    "0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)",
        "card-hover": "0 4px 16px 0 rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.08)",
        glow:    "0 0 0 3px rgb(var(--primary) / 0.15)",
      },
    },
  },
  plugins: [],
};

