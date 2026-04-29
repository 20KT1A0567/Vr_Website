/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f1fbfa",
          100: "#d0f6ef",
          200: "#a3ebdf",
          300: "#71ddcf",
          400: "#40c5bb",
          500: "#229c95",
          600: "#197a75",
          700: "#145f5c",
          800: "#134b49",
          900: "#113e3c"
        },
        ink: {
          950: "#08131a"
        },
        sand: "#f6e8c8",
        ember: "#ff8b5f"
      },
      boxShadow: {
        panel: "0 22px 60px rgba(15, 23, 42, 0.08)"
      },
      borderRadius: {
        "4xl": "2rem"
      }
    }
  },
  plugins: []
};
