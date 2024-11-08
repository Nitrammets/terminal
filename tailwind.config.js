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
        cardBg: "#1E2329",
        tertiaryText: "#848E9C",
        input: "#2B3139",
        line: "#2B3139",
        inputLine: "#474D57",
      },
    },
  },
  safelist: ["right-0", "left-0"],
  plugins: [],
};
