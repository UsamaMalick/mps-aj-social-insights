export const THEME_STORAGE_KEY = "theme";
export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

/** Applies a saved theme before first paint; without one, CSS follows the system setting. */
export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
