import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        // Sona's official secondary typeface (body/sub-heading) — free via
        // Google Fonts, used as the app-wide default. Their primary
        // typeface, GT Super Ds Trial, is a Grilli Type trial font licensed
        // only for mockups (not production use), so it's intentionally not
        // wired in here yet — see README for the two resolution paths.
        sans: ["var(--font-nunito-sans)", "Nunito Sans", "system-ui", "sans-serif"],
        // Free stand-in for GT Super Ds Trial — apply to headings only
        // (h1/h2/section titles), never body text. See README §8.
        display: ["var(--font-playfair-display)", "Playfair Display", "serif"],
      },
      colors: {
        // Sona Gold & Diamonds brand palette (Sona_Guideline.pdf).
        // Primary: Heritage Green — 500 is the guideline's exact primary
        // (#096340); 400/600/900 are the guideline's own given shades,
        // the rest are interpolated to fill out a full Tailwind ramp.
        brand: {
          50: "#EAF5EF",
          100: "#D2E9DD",
          200: "#A6D3BB",
          300: "#79BC99",
          400: "#0B7B4F", // guideline shade
          500: "#096340", // Heritage Green — primary brand color
          600: "#095537", // guideline shade
          700: "#074B30",
          800: "#06442A",
          900: "#054029", // guideline shade
        },
        // Secondary: Eternal Sand — warm neutral background tone, used in
        // place of stark white for page backgrounds (guideline: "balances
        // the richness of gold with everyday ease").
        sand: {
          50: "#FFFAF3", // guideline shade — lightest, near-white
          100: "#F5F1EC", // guideline's named Eternal Sand tone
          200: "#EAE3DC", // guideline shade
          300: "#D7CEC4", // guideline shade
        },
        // Accent: Golden Glow — used sparingly (10-20% per guideline) for
        // highlights, badges, and status accents.
        gold: {
          50: "#FFEFC7", // guideline shade
          100: "#F3E1BE",
          200: "#E5CBA0",
          300: "#D9A870", // guideline shade
          400: "#C39A6B", // Golden Glow — accent brand color
          500: "#B08753",
          600: "#8B6132", // guideline shade
          700: "#6E4C27",
        },
        ink: {
          900: "#101511",
          700: "#374035",
          500: "#5b665a",
          300: "#93a091",
          100: "#e4ece2",
        },
        // Dark-mode surfaces: a deep heritage-green-black rather than a
        // generic neutral gray, so the brand green still reads as the
        // accent even in dark mode.
        surface: {
          DEFAULT: "#0c1712",
          raised: "#122019",
          border: "#22332a",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 21, 17, 0.04), 0 4px 16px rgba(16, 21, 17, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
