import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '320px',    // Small phones (iPhone 5/SE)
        'sm': '640px',    // Large phones (iPhone 12/13)
        'md': '768px',    // Tablets (iPad)
        'lg': '1024px',   // Small laptops
        'xl': '1280px',   // Large laptops
        '2xl': '1536px',  // Desktops
        '3xl': '1920px',  // Ultrawide monitors
      },
      maxWidth: {
        'xs': '320px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1400px',  // Our main content max-width
        '3xl': '1920px',
      },
    },
  },
};

export default config;
