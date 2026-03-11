import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brandPurple: "#6C5CE7",
        brandBlue: "#00D2FF",
        brandPink: "#FF2E63",
        bgBlack: "#07070D",
        bgMid: "#170F2F",
        bgBlue: "#0A1730",
      },
      fontFamily: {
        sans: ["Sora", "Space Grotesk", "Segoe UI", "sans-serif"],
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        typing: {
          "0%, 100%": { opacity: "0.25", transform: "translateY(0px)" },
          "50%": { opacity: "1", transform: "translateY(-3px)" },
        },
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        gradientShift: "gradientShift 14s ease infinite",
        typing: "typing 1s infinite",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(108, 92, 231, 0.3), 0 20px 60px rgba(0,0,0,0.45)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
