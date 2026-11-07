/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        lavender: {
          50: "#faf8ff",
          100: "#f3effe",
          200: "#e9e2fd",
          300: "#d7c8fb",
          400: "#be9ff7",
          500: "#a373f1",
          600: "#8b4be7",
          700: "#7937d3",
          800: "#642db1",
          900: "#532690",
          950: "#341263",
        },
        glucose: {
          low: "#EF4444",      // < 70 mg/dl
          normal: "#10B981",   // 70 - 140 mg/dl
          elevated: "#F59E0B", // 141 - 180 mg/dl
          high: "#DC2626",     // > 180 mg/dl
        },
      },
    },
  },
  plugins: [],
};
