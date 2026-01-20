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
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                // Finviz exact colors - Complete Design System
                fv: {
                    // Backgrounds
                    bg: {
                        DEFAULT: "#22262f",    // Main surface
                        dark: "#14161d",       // Darkest (body)
                        panel: "#1a1d24",      // Card/panel
                        secondary: "#1e2128",  // Secondary surface
                        tertiary: "#262931",   // Tertiary surface
                        hover: "#2d3139",      // Hover state
                    },
                    // Text colors
                    text: {
                        DEFAULT: "#f3f3f5",    // Primary text
                        muted: "#707990",      // Muted text
                        "muted-2": "#9ba4b8",  // Secondary muted
                        "muted-3": "#a3a8b9",  // Tertiary muted
                        dim: "#4c5263",        // Dimmed text
                        disabled: "#5a6478",   // Disabled state
                    },
                    // Positive/Success colors
                    positive: {
                        DEFAULT: "#00a449",    // Primary green
                        bright: "#34c062",     // Bright green
                        light: "#00c853",      // Light green
                        dark: "#19803d",       // Dark green
                        bg: "#1e4027",         // Green background
                        subtle: "rgba(0, 164, 73, 0.15)",
                    },
                    // Negative/Danger colors
                    negative: {
                        DEFAULT: "#d91e2b",    // Primary red
                        bright: "#fb5057",     // Bright red
                        light: "#fd8487",      // Light red
                        dark: "#b71c1c",       // Dark red
                        bg: "#45171a",         // Red background
                        subtle: "rgba(217, 30, 43, 0.15)",
                    },
                    // Link/Accent blue
                    blue: {
                        DEFAULT: "#57aefd",    // Link blue (dark mode)
                        primary: "#2f91ef",    // Primary blue
                        dark: "#1976d2",       // Dark blue
                        light: "#7bc0ff",      // Light blue (hover)
                    },
                    // Warning/Amber
                    warning: {
                        DEFAULT: "#f59e0b",
                        dark: "#d97706",
                        light: "#fbbf24",
                    },
                    // Purple/Violet accent
                    purple: {
                        DEFAULT: "#7c51e7",
                        dark: "#6d28d9",
                        light: "#a78bfa",
                    },
                    // Borders
                    border: {
                        DEFAULT: "#2d3139",    // Primary border
                        secondary: "#353945",  // Secondary border
                        accent: "#676f89",     // Accent border
                    },
                    // Gray scale (matching Finviz)
                    gray: {
                        50: "#f3f3f5",
                        100: "#dedfe5",
                        200: "#c3c6d0",
                        300: "#a3a8b9",
                        400: "#707990",
                        500: "#4c5263",
                        600: "#3d4149",
                        700: "#353945",
                        750: "#2d3139",
                        800: "#1e2128",
                        850: "#171a21",
                        900: "#14161d",
                    },
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
