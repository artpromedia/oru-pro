import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Inter Variable'", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
