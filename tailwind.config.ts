import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        civic: {
          primary: "#274C77", // Dusk Navy (Main brand actions, app bars, key buttons)
          primaryHover: "#1E3A8A", // Flutter deep navy (Hover states, deep container bases)
          secondary: "#6096BA", // Steel Blue (Interactive elements, borders, active indicators)
          accent: "#A3CEF1", // Soft Icy Tint (Pills, tag backgrounds, chip highlights)
          canvas: "#E7ECEF", // Off-white light background (Scaffold canvas, replaces harsh white)
          surface: "#FFFFFF", // Card and modal container background
          border: "#D1D5DB", // Subtle card borders
          textDark: "#1E293B", // Primary headings & body text (slate-800, never harsh #000)
          textMuted: "#64748B", // Secondary subtitles, metadata, timestamps
        },
        navy: "#274C77",
        navyLight: "#1E3A8A",
        gold: "#6096BA",
        bg: "#E7ECEF",
        ink: "#1E293B",
      },
      fontFamily: {
        serif: ["var(--font-source-serif-4)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
