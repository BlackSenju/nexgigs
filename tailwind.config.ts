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
        brand: {
          orange: "#FF4D00",
          black: "#0a0a0a",
          steel: "#2D2D2D",
          white: "#FFFFFF",
          red: "#FF1A1A",
        },
        background: "#0a0a0a",
        foreground: "#FFFFFF",
        card: "#2D2D2D",
        muted: "#6b7280",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontWeight: {
        black: "900",
      },
    },
  },
  plugins: [],
};
export default config;
