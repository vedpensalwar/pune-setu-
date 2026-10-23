import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: {
          DEFAULT: "var(--surface)",
          elevated: "var(--surface-elevated)",
          muted: "var(--surface-muted)",
          hover: "var(--surface-hover)",
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
          subtle: "var(--border-subtle)",
        },
        content: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          inverse: "var(--text-inverse)",
        },
        brand: {
          DEFAULT: "var(--brand)",
          hover: "var(--brand-hover)",
          surface: "var(--brand-surface)",
          contrast: "var(--brand-contrast)",
          navy: "#173B57",
          dark: "#112B40",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          surface: "var(--accent-surface)",
          contrast: "var(--accent-contrast)",
          saffron: "#D96A24",
          deep: "#BD571A",
        },
        status: {
          success: {
            DEFAULT: "var(--success)",
            surface: "var(--success-surface)",
            border: "var(--success-border)",
            contrast: "var(--success-contrast)",
          },
          warning: {
            DEFAULT: "var(--warning)",
            surface: "var(--warning-surface)",
            border: "var(--warning-border)",
            contrast: "var(--warning-contrast)",
          },
          error: {
            DEFAULT: "var(--error)",
            surface: "var(--error-surface)",
            border: "var(--error-border)",
            contrast: "var(--error-contrast)",
          },
          danger: "var(--error)",
          info: {
            DEFAULT: "var(--info)",
            surface: "var(--info-surface)",
            border: "var(--info-border)",
            contrast: "var(--info-contrast)",
          },
        },
        focus: {
          ring: "var(--focus-ring)",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "'Noto Sans'",
          "'Noto Sans Devanagari'",
          "sans-serif",
        ],
        heading: [
          "var(--font-sans)",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        devanagari: [
          "var(--font-devanagari)",
          "'Noto Sans Devanagari'",
          "sans-serif",
        ],
      },
      boxShadow: {
        subtle: "var(--shadow-sm)",
        card: "var(--shadow-md)",
        elevated: "var(--shadow-lg)",
      },
      borderRadius: {
        subtle: "4px",
        base: "8px",
        md: "10px",
        lg: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
