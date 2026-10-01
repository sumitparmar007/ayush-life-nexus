import type { Config } from "tailwindcss";
import { fontFamilies } from "../../packages/design-tokens/src/typography";
import { spacing } from "../../packages/design-tokens/src/spacing";
import { radius, shadows } from "../../packages/design-tokens/src/radius";
import { primitives } from "../../packages/design-tokens/src/colors";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: fontFamilies.display.split(",").map((f) => f.trim().replace(/"/g, "")),
        body: fontFamilies.body.split(",").map((f) => f.trim().replace(/"/g, "")),
        mono: fontFamilies.mono.split(",").map((f) => f.trim().replace(/"/g, "")),
        sans: fontFamilies.body.split(",").map((f) => f.trim().replace(/"/g, "")),
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
        "7xl": ["4.5rem", { lineHeight: "1" }],
      },
      colors: {
        // Indigo — brand primary
        indigo: {
          50: primitives.indigo50,
          100: primitives.indigo100,
          200: primitives.indigo200,
          300: primitives.indigo300,
          400: primitives.indigo400,
          500: primitives.indigo500,
          600: primitives.indigo600,
          700: primitives.indigo700,
          800: primitives.indigo800,
          900: primitives.indigo900,
          950: primitives.indigo950,
        },
        // Saffron — accent
        saffron: {
          50: primitives.saffron50,
          100: primitives.saffron100,
          200: primitives.saffron200,
          300: primitives.saffron300,
          400: primitives.saffron400,
          500: primitives.saffron500,
          600: primitives.saffron600,
          700: primitives.saffron700,
          800: primitives.saffron800,
          900: primitives.saffron900,
          950: primitives.saffron950,
        },
        // Sage — health/success
        sage: {
          50: primitives.sage50,
          100: primitives.sage100,
          200: primitives.sage200,
          300: primitives.sage300,
          400: primitives.sage400,
          500: primitives.sage500,
          600: primitives.sage600,
          700: primitives.sage700,
          800: primitives.sage800,
          900: primitives.sage900,
          950: primitives.sage950,
        },
        // Neutral — warm not grey
        neutral: {
          0: primitives.neutral0,
          25: primitives.neutral25,
          50: primitives.neutral50,
          100: primitives.neutral100,
          150: primitives.neutral150,
          200: primitives.neutral200,
          300: primitives.neutral300,
          400: primitives.neutral400,
          500: primitives.neutral500,
          600: primitives.neutral600,
          700: primitives.neutral700,
          800: primitives.neutral800,
          900: primitives.neutral900,
          950: primitives.neutral950,
          1000: primitives.neutral1000,
        },
        // CSS variable–based semantic colors (light/dark aware)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Status
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
      },
      spacing: {
        ...spacing,
      },
      borderRadius: {
        none: radius.none,
        xs: radius.xs,
        sm: radius.sm,
        DEFAULT: radius.md,
        md: radius.md,
        lg: radius.lg,
        xl: radius.xl,
        "2xl": radius["2xl"],
        "3xl": radius["3xl"],
        "4xl": radius["4xl"],
        full: radius.full,
      },
      boxShadow: {
        none: shadows.none,
        xs: shadows.xs,
        sm: shadows.sm,
        DEFAULT: shadows.md,
        md: shadows.md,
        lg: shadows.lg,
        xl: shadows.xl,
        "2xl": shadows["2xl"],
        inner: shadows.inner,
        card: shadows.card,
        "card-hover": shadows.cardHover,
        modal: shadows.modal,
        dropdown: shadows.dropdown,
        focus: shadows.focus,
        "focus-danger": shadows.focusDanger,
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-in-from-top": {
          from: { transform: "translateY(-8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-in-from-bottom": {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-in-from-left": {
          from: { transform: "translateX(-8px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "slide-in-from-right": {
          from: { transform: "translateX(8px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "zoom-in": {
          from: { transform: "scale(0.96)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-in": "fade-in 150ms ease-out",
        "fade-out": "fade-out 100ms ease-in",
        "slide-in-top": "slide-in-from-top 200ms cubic-bezier(0, 0, 0.2, 1)",
        "slide-in-bottom": "slide-in-from-bottom 200ms cubic-bezier(0, 0, 0.2, 1)",
        "slide-in-left": "slide-in-from-left 200ms cubic-bezier(0, 0, 0.2, 1)",
        "slide-in-right": "slide-in-from-right 200ms cubic-bezier(0, 0, 0.2, 1)",
        "zoom-in": "zoom-in 150ms cubic-bezier(0, 0, 0.2, 1)",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "spin-slow": "spin-slow 3s linear infinite",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        gentle: "cubic-bezier(0.25, 0.1, 0.25, 1)",
        sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
