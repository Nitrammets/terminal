/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        ibm: ['"IBM Plex Sans"', "sans-serif"],
      },
      colors: {
        background: "#181A20",
        buy: "#2EBD85",
        sell: "#F6465D",
        primaryText: "#EAECEF",
        disabledText: "#5E6673",
      },
    },
  },
  plugins: [],
};
