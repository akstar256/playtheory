import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          50: "#FAF7EE", // Warm lab paper light
          100: "#F5EFE0",
          200: "#EADECA",
          300: "#D6C6A5",
          800: "#2B2824",
          900: "#181715", // Deep ink dark
          950: "#0F0E0D",
        },
        arcade: {
          cyan: "#00E5FF",
          amber: "#FFB300",
          crimson: "#FF3366",
          emerald: "#00E676",
          purple: "#7C4DFF",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
