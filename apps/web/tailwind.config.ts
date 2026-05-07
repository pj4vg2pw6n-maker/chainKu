import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#2D5F4E",
        "accent-light": "#4A8C74",
        "gray-ui": "#6B7280",
        "gray-muted": "#9CA3AF",
        "gray-border": "#E5E7EB",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        serif: ["var(--font-newsreader)", "serif"],
      },
      borderRadius: {
        card: "8px",
        input: "4px",
      },
    },
  },
  plugins: [],
};
export default config;
