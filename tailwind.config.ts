import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#0b0d12",
          100: "#141820",
          200: "#1e2430",
          300: "#6f6554",
          400: "#c9a96e",
          500: "#d4af77",
          600: "#e0c58a",
          700: "#f3ead8",
        },
        ink: "#e8e4dc",
        muted: "#9a9388",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-source-serif)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
