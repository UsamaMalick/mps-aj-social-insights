/**
 * Brand colours for generated images (favicon, Apple touch icon). Those are rendered outside
 * the page, where CSS variables don't exist, so they need literal values. They are the sRGB
 * equivalents of the light-theme `--ink` and `--paper` tokens in `app/globals.css`, so the
 * tab icon matches the masthead logo; update both together.
 */
export const BRAND_COLORS = {
  tile: "#18130E", // --ink:   oklch(0.19 0.012 60)
  bubble: "#F8F3E9", // --paper: oklch(0.965 0.014 85)
} as const;
