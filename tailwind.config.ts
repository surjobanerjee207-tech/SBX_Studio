import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{tsx,ts}", "./components/**/*.{tsx,ts}"],
  theme: {
    extend: {
      colors: {
        ink: "#080808",
        canvas: "#0B0B0D",
        panel: "#111111",
        card: "#121216",
        bone: "#F5F5F5",
        mute: "#929292",
        secondary: "#A1A1AA",
        red: "#E50914",
        crimson: "#990011",
        cherry: "#990F19",
        gold: "#FFD166",
      },
      fontFamily: {
        display: ["var(--f-display)", "serif"],
        sans: ["var(--f-sans)", "sans-serif"],
        price: ["var(--font-price)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
} satisfies Config;
