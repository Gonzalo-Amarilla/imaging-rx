import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette from the Imaging Rx design system.
        ink: "#0c1b33", // primary navy
        clinical: "#1a5fe0", // brand blue (buttons, accents)
        accent: "#2c6be0", // slightly lighter blue (eyebrows)
        muted: "#6b7a93", // body / secondary text
        slate: "#3a4a63", // nav links
        faint: "#9aa7bd", // scroll label
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
    },
  },
  plugins: [],
};

export default config;
