import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F6F7FB",
        surface: "#FFFFFF",
        "surface-alt": "#EEF1FB",
        navy: "#10193A",
        "navy-soft": "#545E7D",
        border: "#E1E4F0",
        blue: "#4C5FF0",
        "blue-dim": "#E8EAFD",
        violet: "#8B5CF6",
        "violet-dim": "#F1EBFE",
        green: "#157F4A",
        "green-dim": "#E4F6ED",
        amber: "#B45309",
        "amber-dim": "#FDF1DF",
      },
      fontFamily: {
        head: ["'Space Grotesk'", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      backgroundImage: {
        "blueprint-grid":
          "linear-gradient(rgba(76,95,240,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(76,95,240,0.07) 1px, transparent 1px)",
      },
      backgroundSize: { "grid-28": "28px 28px" },
    },
  },
  plugins: [],
};
export default config;
