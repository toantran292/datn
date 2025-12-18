import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'ts-orange': '#FF8800',
        'ts-teal': '#00C4AB',
        'ts-bg-dark': '#0F172A',
        'ts-bg-card': '#1E293B',
        'ts-text-primary': '#F8FAFC',
        'ts-text-secondary': '#94A3B8',
      },
    },
  },
  plugins: [],
};

export default config;
