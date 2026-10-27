/* Head-safe theme bootstrap. Only this preference uses the site-theme key. */
(() => {
  'use strict';
  if (window.__siteThemeReady) return;
  window.__siteThemeReady = true;
  const root = document.documentElement;
  const key = 'site-theme';
  let dark = false;
  try { dark = localStorage.getItem(key) === 'dark'; } catch (_) {}
  const moon = '<path d="M16.8 12.2A7 7 0 0 1 7.8 3.2a7 7 0 1 0 9 9Z"/>';
  const sun = '<circle cx="10" cy="10" r="3.4"/><path d="M10 1.6v1.5m0 13.8v1.5M1.6 10h1.5m13.8 0h1.5M4.1 4.1l1.1 1.1m9.6 9.6 1.1 1.1M4.1 15.9l1.1-1.1m9.6-9.6 1.1-1.1"/>';
  let button;
  function label() {
    if (!button) return;
    const lang = root.lang.split('-')[0];
    const labels = { en: ['Switch to night mode', 'Switch to day mode'], zh: ['切换为夜间模式', '切换为日间模式'], ja: ['夜間モードに切り替える', '昼間モードに切り替える'] };
    const text = (labels[lang] || labels.en)[dark ? 1 : 0];
    button.setAttribute('aria-label', text);
    button.title = text;
    button.setAttribute('aria-pressed', String(dark));
    button.innerHTML = '<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (dark ? sun : moon) + '</svg>';
  }
  function apply(value, persist = false) {
    dark = value;
    if (dark) root.dataset.theme = 'dark';
    else root.removeAttribute('data-theme');
    if (persist) { try { localStorage.setItem(key, dark ? 'dark' : 'light'); } catch (_) {} }
    label();
  }
  // Runs synchronously before page CSS / rendering when included in the head.
  apply(dark);
  function mount() {
    if (button?.isConnected || document.querySelector('[data-site-theme-toggle]')) return true;
    const group = document.querySelector('.report-site-nav .languages, .site-nav .languages, .report-interface-languages');
    if (!group) return false;
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'site-theme-toggle';
    button.dataset.siteThemeToggle = '';
    button.addEventListener('click', () => apply(!dark, true));
    // The native report locale helper updates every button inside its own nav.
    // Keep the theme button beside that group so language changes cannot reset it.
    if (group.matches('.report-interface-languages')) group.after(button);
    else group.append(button);
    label();
    return true;
  }
  function ready() {
    new MutationObserver(label).observe(root, { attributes: true, attributeFilter: ['lang'] });
    if (mount()) return;
    // Only watch the small existing navigation containers, and only while a
    // deferred native locale helper may still be inserting its language group.
    const navs = [...document.querySelectorAll('.site-nav, .report-site-nav')];
    if (!navs.length) return;
    const observer = new MutationObserver(() => { if (mount()) observer.disconnect(); });
    navs.forEach(nav => observer.observe(nav, { childList: true, subtree: true }));
    setTimeout(() => observer.disconnect(), 10000);
  }
  window.addEventListener('storage', event => {
    try {
      if (event.storageArea === localStorage && (event.key === key || event.key === null)) apply(event.newValue === 'dark');
    } catch (_) { /* An unavailable preference store keeps the current theme. */ }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
  else ready();
})();
