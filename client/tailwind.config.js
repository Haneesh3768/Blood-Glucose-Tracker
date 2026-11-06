/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
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

