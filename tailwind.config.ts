import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFF8F3",
        surface: "#FFFFFF",
        "surface-alt": "#FFF0E8",
        border: "#E8D5C4",
        rose: {
          DEFAULT: "#C9727A",
          light: "#F2A8AD",
          dark: "#A85860",
        },
        gold: {
          DEFAULT: "#D4AF37",
          light: "#F0D060",
          dark: "#A8841A",
        },
        charcoal: {
          DEFAULT: "#2D2D2D",
          light: "#6B6B6B",
          lighter: "#9B9B9B",
        },
        cream: "#FFF8F3",
        // Signature UI (gp-signature-ui skill): four tones + gold for details
        // only. Channels live in globals.css so `/opacity` modifiers work.
        gp: {
          cream: "rgb(var(--gp-cream) / <alpha-value>)",
          ink: "rgb(var(--gp-ink) / <alpha-value>)",
          raspberry: "rgb(var(--gp-raspberry) / <alpha-value>)",
          champagne: "rgb(var(--gp-champagne) / <alpha-value>)",
          gold: "rgb(var(--gp-gold) / <alpha-value>)",
          // Admin cards/inputs only (a lighter cream, not a fifth tone).
          paper: "rgb(var(--gp-paper) / <alpha-value>)",
        },
        // Colours of the nearest [data-tone] ancestor (see SectionTone).
        tone: {
          bg: "rgb(var(--tone-bg) / <alpha-value>)",
          fg: "rgb(var(--tone-fg) / <alpha-value>)",
          accent: "rgb(var(--tone-accent) / <alpha-value>)",
          "cta-bg": "rgb(var(--tone-cta-bg) / <alpha-value>)",
          "cta-fg": "rgb(var(--tone-cta-fg) / <alpha-value>)",
          ring: "rgb(var(--tone-ring) / <alpha-value>)",
          // Secondary text: ink/55 on light tones, cream/78 on dark (AA both).
          muted: "rgb(var(--tone-fg) / var(--tone-muted-a))",
        },
      },
      fontFamily: {
        playfair: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        arabic: ["var(--font-cairo)", "Arial", "sans-serif"],
        script: ["var(--font-great-vibes)", "cursive"],
        // Three voices, switched per locale in [locale]/layout.tsx.
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        text: ["var(--font-text)", "system-ui", "sans-serif"],
        note: ["var(--font-note)", "cursive"],
      },
      fontSize: {
        "step-small": "var(--step-small)",
        "step-body": "var(--step-body)",
        "step-lead": "var(--step-lead)",
        "step-head": "var(--step-head)",
        "step-display": "var(--step-display)",
      },
      maxWidth: {
        gp: "1320px",
      },
      transitionTimingFunction: {
        gp: "cubic-bezier(.22,1,.36,1)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-pattern":
          "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9727A' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-in-out",
        "slide-up": "slideUp 0.6s ease-out",
        "float": "float 3s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "scale-in": "scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        // Admin: short UI transitions only (<= 200ms).
        "gpa-fade": "fadeIn 160ms ease-out",
        "gpa-drawer": "gpaDrawer 200ms cubic-bezier(.22,1,.36,1)",
        "gpa-rise": "gpaRise 200ms cubic-bezier(.22,1,.36,1)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        gpaDrawer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        gpaRise: {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.92)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      boxShadow: {
        "cake": "0 8px 32px rgba(201, 114, 122, 0.15)",
        "cake-hover": "0 16px 48px rgba(201, 114, 122, 0.25)",
        "gold": "0 4px 20px rgba(212, 175, 55, 0.3)",
        // Always offset + soft blur, never a zero-offset glow.
        "gp-print": "0 18px 40px -18px rgb(var(--gp-ink) / .35)",
        "gp-lifted": "0 40px 60px -30px rgb(var(--gp-ink) / .45)",
        "gp-chip": "0 10px 24px -12px rgb(var(--gp-ink) / .3)",
      },
      borderRadius: {
        "gp-card": "32px",
        "gp-section": "40px",
      },
    },
  },
  plugins: [],
};

export default config;
