/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./frontend/src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        paper: "#F2EFE6",
        carbon: "#232722",
        coral: {
          DEFAULT: "#E65F42",
          50: "#fef3f0",
          100: "#fde5df",
          200: "#f9ccc1",
          300: "#f4aa99",
          400: "#ee7f67",
          500: "#E65F42",
          600: "#d34628",
          700: "#b0361e",
          800: "#8e2f1d",
          900: "#752b1d",
        },
        "signal-coral": "#E65F42",
        moss: {
          DEFAULT: "#D9E7D5",
          light: "#EBF3E8",
          dark: "#3B5A38",
        },
        "soft-moss": "#D9E7D5",
        periwinkle: {
          DEFAULT: "#D8DDF5",
          light: "#EEF1FA",
          dark: "#364573",
        },
        divider: "#DAD8CE",
        muted: {
          DEFAULT: "#686D64",
          light: "#82877E",
          dark: "#4B4F47",
        },
        "muted-text": "#686D64",
        editor: "#FCFBF7",
        "editor-background": "#FCFBF7",
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
      },
    },
  },
  plugins: [],
};
