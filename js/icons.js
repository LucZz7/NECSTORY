/* NECSTORY — premium stroke SVG icon set (no emojis) */
const ICONS = {
  logo: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 20V6l7 8V6"/><path d="M16 4c-2.5 0-4.5 2-4.5 4.5V15l1.5-1.2L14.5 15l1.5-1.2L17.5 15V8.5C17.5 6 16 4 16 4z" opacity=".85"/></svg>`,

  ghost: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-4.4 0-7.5 3-7.5 7.2V19l2.6-2.1 2.4 2.1 2.5-2.1 2.5 2.1 2.4-2.1L19.5 19v-8.8C19.5 6 16.4 3 12 3z"/><circle cx="9.4" cy="10.4" r="1.1" fill="currentColor" stroke="none"/><circle cx="14.6" cy="10.4" r="1.1" fill="currentColor" stroke="none"/></svg>`,

  crime: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5l1.8 6.2 1 6.3-2.8 6.5-2.8-6.5 1-6.3z"/><path d="M12 2.5V1"/><path d="M9.5 21.5h5"/></svg>`,

  darkweb: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3.5 9.5h17M3.5 14.5h17"/></svg>`,

  mystery: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/><path d="M9.2 9.2c.2-1 1-1.7 2-1.7 1.2 0 2.1.9 2.1 2 0 1.4-2.1 1.6-2.1 3"/><circle cx="11.2" cy="14.8" r=".4" fill="currentColor"/></svg>`,

  seeds: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2.5L4.5 13.5H11l-1 8 8.5-11H12z"/></svg>`,

  classics: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5C6 4.5 9 4.5 12 6.5c3-2 6-2 8-1v13c-2-1-5-1-8 1-3-2-6-2-8-1z"/><path d="M12 6.5v13"/></svg>`,

  book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5z"/><path d="M4 19.5A2.5 2.5 0 006.5 22H20v-5"/></svg>`,

  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/></svg>`,

  random: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h4l10 10h4m0 0l-3-3m3 3l-3 3"/><path d="M3 17h4l2.5-2.5"/><path d="M13.5 9.5L17 7h4m0 0l-3-3m3 3l-3 3"/></svg>`,

  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`,

  external: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M20 4L11 13"/><path d="M19 13.5V19a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1h5.5"/></svg>`,

  instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5.5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" stroke="none"/></svg>`,

  telegram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>`
};

function mountIcons(root) {
  (root || document).querySelectorAll('[data-icon]').forEach(el => {
    const name = el.getAttribute('data-icon');
    if (ICONS[name]) el.innerHTML = ICONS[name];
  });
  const logo = document.getElementById('logoIcon');
  if (logo) logo.innerHTML = ICONS.logo;
}
document.addEventListener('DOMContentLoaded', () => mountIcons());
