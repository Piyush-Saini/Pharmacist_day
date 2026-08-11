import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Mankind Pharma brand-adjacent palette. Swap these for the official
        // brand hex values once the design team confirms them.
        ink: "#0B1F3A",
        brand: {
          DEFAULT: "#0E4C92",
          dark: "#08325F",
          light: "#3B7DD8",
        },
        accent: {
          DEFAULT: "#F5A524",
          light: "#FFD08A",
        },
        paper: "#F7F9FC",
      },
      fontFamily: {
        sans: ["var(--font-ui)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
