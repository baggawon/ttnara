/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("tailwindcss-preset-email")],
  content: [
    "./components/**/*.html",
    "./emails/**/*.html",
    "./layouts/**/*.html",
  ],
  theme: {
    screens: {
      sm: { max: "600px" },
      xs: { max: "425px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        fail: {
          DEFAULT: "hsl(var(--fail))",
          foreground: "hsl(var(--fail-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        blinker: {
          "0%": { opacity: 1 },
          "50%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        fader: {
          "0%": { opacity: 1 },
          "50%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        blinker: "blinker 1.1s step-end infinite",
        fader: "blinker 1.5s ease-in-out infinite",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
      },
      fontFamily: {
        blackHanSans: ["Black Han Sans"],
        notoSansKR: ["Noto Sans KR", "sans-serif"],
      },
      height: {
        "real-screen": "calc(var(--vh) * 100)",
      },
      minHeight: {
        "real-screen": "calc(var(--vh) * 100)",
      },
      maxHeight: {
        "real-screen": "calc(var(--vh) * 100)",
      },
    },
  },
};
