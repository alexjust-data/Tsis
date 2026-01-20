import type { Config } from "tailwindcss"

const config = {
    darkMode: ["class"],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                // Flash Research exact colors
                fr: {
                    // Backgrounds
                    bg: {
                        DEFAULT: "#131722",    // Main surface (TradingView dark)
                        dark: "#0d1117",       // Darkest (body)
                        panel: "#1e222d",      // Card/panel
                        secondary: "#181c25",  // Secondary surface
                        tertiary: "#252a35",   // Tertiary surface
                        hover: "#2a2e39",      // Hover state
                    },
                    // Text colors
                    text: {
                        DEFAULT: "#d1d4dc",    // Primary text
                        bright: "#f3f3f5",     // Bright text
                        muted: "#787b86",      // Muted text
                        dim: "#4c5263",        // Dimmed text
                    },
                    // Positive/Success colors (green)
                    positive: {
                        DEFAULT: "#26a69a",    // Primary green
                        bright: "#22ab94",     // Bright green
                        text: "#26a69a",       // Green text
                    },
                    // Negative/Danger colors (red)
                    negative: {
                        DEFAULT: "#ef5350",    // Primary red
                        bright: "#f23645",     // Bright red
                        text: "#ef5350",       // Red text
                    },
                    // Link/Accent blue
                    blue: {
                        DEFAULT: "#2962ff",    // Primary blue
                        cyan: "#00bcd4",       // Cyan for tickers
                    },
                    // Borders
                    border: {
                        DEFAULT: "#2a2e39",    // Primary border
                        secondary: "#363a45",  // Secondary border
                    },
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
