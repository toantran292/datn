module.exports = {
  content: ["./src/**/*.{astro,md,mdx,html,js,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        uts: {
          primary: "#FF8800",
          secondary: "#00C4AB",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        xl: "16px",
      },
      boxShadow: {
        uts: "0 4px 16px rgba(15,23,42,0.08)",
      },
      animation: {
        float: "float 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
