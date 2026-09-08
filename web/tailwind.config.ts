import type { Config } from "tailwindcss";

const config: Config = {
  // Ensures any Tailwind `dark:` utilities follow the data-theme attribute, not the OS setting
  // Note: At this time, we are not using `dark:` utilities, but added this for future-proofing
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;
