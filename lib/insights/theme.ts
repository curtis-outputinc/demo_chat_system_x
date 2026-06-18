/**
 * Theme init script.
 *
 * Runs in <head> before paint to set `theme-dark` or `theme-light` on <html>.
 * Avoids the white-flash-then-dark-mode jump on dashboard pages. Reads
 * localStorage first, falls back to prefers-color-scheme, defaults to dark.
 *
 * Storage key: output-admin-theme
 *
 * Chatbot pages (/, /embed/widget) use hardcoded dark Tailwind classes and are
 * unaffected by the theme class on <html>. The theme system only applies where
 * the admin CSS variables are referenced.
 */

export const THEME_STORAGE_KEY = 'output-admin-theme';

export const themeInitScript = `(() => {
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var theme = (stored === 'light' || stored === 'dark')
      ? stored
      : (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.classList.add('theme-' + theme);
  } catch (e) {
    document.documentElement.classList.add('theme-dark');
  }
})();`;
