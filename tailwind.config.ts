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
        brand: {
          prussian: "#001B2E",
          charcoal: "#294C60",
          slate: "#ADB6C4",
          papaya: "#FFEFD3",
          peach: "#FFC49B",
        },
        navy: "#001B2E",
        navyLight: "#294C60",
        gold: "#FFC49B",
        bg: "#FFEFD3",
        ink: "#001B2E",
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
