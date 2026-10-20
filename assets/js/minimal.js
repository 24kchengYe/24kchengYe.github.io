(() => {
  'use strict';
  const languages = ['en', 'zh', 'ja'];
  function setLanguage(language) {
    if (!languages.includes(language)) language = 'en';
    document.documentElement.lang = language;
    document.querySelectorAll('[data-language]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.language === language));
    });
    try { localStorage.setItem('lang', language); } catch { /* Reading works without storage. */ }
  }
  let saved = 'en';
  try { saved = localStorage.getItem('lang') || 'en'; } catch { /* Use English. */ }
  setLanguage(saved);
  document.querySelectorAll('[data-language]').forEach(button => {
    button.addEventListener('click', () => setLanguage(button.dataset.language));
  });

  // Existing links to a section should keep working, including inside closed details.
  const aliases = {
    '-publications': 'research', '-news': 'news', '-internships': 'experience',
    '-internship-projects': 'experience', '-educations': 'education',
    '-honors-and-awards': 'honors', '-invited-talks': 'talks',
    '-invited-talks--conferences': 'talks', '-academic-service': 'service',
    '-open-source-datasets': 'datasets', '-open-source-systems': 'projects',
    '-research-vision': 'research-vision'
  };
  function revealAnchor() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(aliases[id] || id);
    if (!target) return;
    for (let node = target; node; node = node.parentElement) {
      if (node.tagName === 'DETAILS') node.open = true;
    }
    if (location.hash) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
  }
  window.addEventListener('hashchange', revealAnchor);
  revealAnchor();
})();
