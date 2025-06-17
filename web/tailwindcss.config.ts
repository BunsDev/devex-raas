/** @type {import('tailwindcss').Config} */
import type { Config } from "tailwindcss"; // Import the Config type
import type { PluginAPI } from "tailwindcss/plugin"; // Import PluginAPI

const config: Config = {
  // Declare config as type Config
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // App theme colors
        app: {
          bg: "var(--app-bg)",
          surface: "var(--app-surface)",
          border: "var(--app-border)",
          hover: "var(--app-hover)",
          text: "var(--app-text)",
          muted: "var(--app-muted)",
          accent: "var(--app-accent)",
          "accent-hover": "var(--app-accent-hover)",
        },
        // Terminal theme colors
        terminal: {
          bg: "var(--terminal-bg)",
          header: "var(--terminal-header)",
          border: "var(--terminal-border)",
          hover: "var(--terminal-hover)",
          text: "var(--terminal-text)",
          muted: "var(--terminal-muted)",
          accent: "var(--terminal-accent)",
          error: "var(--terminal-error)",
        },
        // Semantic colors
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
        info: "var(--info)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          "Fira Sans",
          "Droid Sans",
          "Helvetica Neue",
          "sans-serif",
        ],
        mono: [
          "SF Mono",
          "Monaco",
          "Inconsolata",
          "Roboto Mono",
          "Source Code Pro",
          "monospace",
        ],
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
        "pulse-slow": "pulse 2s infinite",
        "spin-slow": "spin 2s linear infinite",
        "blink-caret-div": "caretPulse 1s infinite",
      },
      keyframes: {
        caretPulse: {
          "0%": { opacity: "0" },
          "50%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
      boxShadow: {
        "glow-sm": "0 0 10px rgba(16, 185, 129, 0.2)",
        glow: "0 0 20px rgba(16, 185, 129, 0.3)",
        "glow-lg": "0 0 30px rgba(16, 185, 129, 0.4)",
        terminal: "0 4px 12px rgba(0, 0, 0, 0.25)",
        card: "0 2px 8px rgba(0, 0, 0, 0.12)",
        "card-hover": "0 4px 16px rgba(0, 0, 0, 0.16)",
      },
      backdropBlur: {
        xs: "2px",
      },
      borderRadius: {
        terminal: "8px",
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },
      typography: {
        DEFAULT: {
          css: {
            color: "var(--app-text)",
            maxWidth: "none",
            code: {
              color: "var(--terminal-accent)",
              backgroundColor: "var(--app-surface)",
              padding: "0.25rem 0.5rem",
              borderRadius: "0.375rem",
              fontWeight: "500",
            },
            "code::before": {
              content: '""',
            },
            "code::after": {
              content: '""',
            },
            pre: {
              backgroundColor: "var(--terminal-bg)",
              color: "var(--terminal-text)",
              border: "1px solid var(--terminal-border)",
              borderRadius: "0.5rem",
            },
            h1: {
              color: "var(--app-text)",
            },
            h2: {
              color: "var(--app-text)",
            },
            h3: {
              color: "var(--app-text)",
            },
            h4: {
              color: "var(--app-text)",
            },
            strong: {
              color: "var(--app-text)",
            },
            a: {
              color: "var(--app-accent)",
              "&:hover": {
                color: "var(--app-accent-hover)",
              },
            },
            blockquote: {
              color: "var(--app-muted)",
              borderLeftColor: "var(--app-accent)",
            },
          },
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    // Custom plugin for component utilities
    function ({ addUtilities, addComponents, theme }: PluginAPI) {
      const newUtilities = {
        ".text-gradient": {
          background: `linear-gradient(135deg, ${theme("colors.app.accent")}, ${theme("colors.terminal.accent")})`,
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
        },
        ".glass": {
          background: "rgba(255, 255, 255, 0.05)",
          "backdrop-filter": "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
        ".terminal-cursor::after": {
          content: '"▋"',
          color: "var(--terminal-accent)",
          animation: "pulse 1s infinite",
        },
      };

      const newComponents = {
        ".btn": {
          padding: "0.5rem 1rem",
          borderRadius: "0.375rem",
          fontWeight: "500",
          transition: "all 0.2s ease",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          "&:focus": {
            outline: "2px solid var(--app-accent)",
            outlineOffset: "2px",
          },
        },
        ".btn-primary": {
          backgroundColor: "var(--app-accent)",
          color: "white",
          "&:hover": {
            backgroundColor: "var(--app-accent-hover)",
            transform: "translateY(-1px)",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
        },
        ".btn-secondary": {
          backgroundColor: "var(--app-surface)",
          color: "var(--app-text)",
          border: "1px solid var(--app-border)",
          "&:hover": {
            backgroundColor: "var(--app-hover)",
            borderColor: "var(--app-accent)",
          },
        },
        ".btn-ghost": {
          backgroundColor: "transparent",
          color: "var(--app-muted)",
          "&:hover": {
            backgroundColor: "var(--app-hover)",
            color: "var(--app-text)",
          },
        },
        ".card": {
          backgroundColor: "var(--app-surface)",
          border: "1px solid var(--app-border)",
          borderRadius: "0.5rem",
          padding: "1rem",
          transition: "all 0.2s ease",
          "&:hover": {
            borderColor: "var(--app-accent)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          },
        },
        ".terminal-window": {
          backgroundColor: "var(--terminal-bg)",
          border: "1px solid var(--terminal-border)",
          borderRadius: "0.5rem",
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
        },
        ".terminal-header": {
          backgroundColor: "var(--terminal-header)",
          borderBottom: "1px solid var(--terminal-border)",
          padding: "0.5rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        },
        ".status-indicator": {
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.25rem 0.75rem",
          borderRadius: "9999px",
          fontSize: "0.875rem",
          fontWeight: "500",
        },
        ".status-success": {
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          color: "var(--success)",
          border: "1px solid rgba(16, 185, 129, 0.2)",
        },
        ".status-warning": {
          backgroundColor: "rgba(245, 158, 11, 0.1)",
          color: "var(--warning)",
          border: "1px solid rgba(245, 158, 11, 0.2)",
        },
        ".status-error": {
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          color: "var(--error)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
        },
        ".loading-spinner": {
          border: "2px solid var(--app-border)",
          borderTop: "2px solid var(--app-accent)",
          borderRadius: "50%",
          width: "1.25rem",
          height: "1.25rem",
          animation: "spin 1s linear infinite",
        },
      };

      addUtilities(newUtilities);
      addComponents(newComponents);
    },
  ],
  darkMode: "class",
};

export default config;
