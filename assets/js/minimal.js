(() => {
  'use strict';
  if(location.hostname==='yechengzhang.duqi.top'&&!document.querySelector('script[data-academic-analytics]')){
    const script=document.createElement('script');script.src='/assets/js/site-analytics.js';script.async=true;script.dataset.academicAnalytics='';document.head.append(script);
  }
  const languages = ['en', 'zh', 'ja'];
  function setLanguage(language) {
    if (!languages.includes(language)) language = 'en';
    document.documentElement.lang = language;
    document.querySelectorAll('[data-language]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.language === language));
    });
    for (const attribute of ['alt', 'title', 'aria-label']) {
      document.querySelectorAll(`[data-${attribute}-${language}]`).forEach(element => {
        element.setAttribute(attribute, element.getAttribute(`data-${attribute}-${language}`));
      });
    }
    document.querySelectorAll('img[data-src-en]').forEach(image => {
      image.src = image.getAttribute(`data-src-${language}`);
    });
    window.WritingDiagramStyle?.refreshImages();
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    document.querySelectorAll('[data-site-link]').forEach(link => {
      const url = new URL(link.getAttribute('href'), location.href);
      url.searchParams.set('lang', language);
      link.setAttribute('href', (url.origin === location.origin ? '' : url.origin) + url.pathname + url.search + url.hash);
    });
    const title = document.querySelector('[data-page-title]');
    if (title) {
      const translation = title.querySelector(`[lang="${language}"]`);
      if (translation) document.title = `${translation.textContent} · Yecheng Zhang`;
      const openGraphTitle = document.querySelector('meta[property="og:title"]');
      if (translation && openGraphTitle) openGraphTitle.content = translation.textContent;
    }
    try {
      const url = new URL(location.href);
      url.searchParams.set('lang', language);
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    } catch {}
    try { localStorage.setItem('lang', language); } catch { /* Reading works without storage. */ }
  }
  const requested = new URLSearchParams(location.search).get('lang');
  setLanguage(languages.includes(requested) ? requested : 'en');
  document.querySelectorAll('[data-language]').forEach(button => {
    button.addEventListener('click', () => setLanguage(button.dataset.language));
  });

  // Existing links to a section should keep working, including inside closed details.
  const aliases = {
    '-publications': 'research', '-news': 'news', '-internships': 'experience',
    '-internship-projects': 'experience', '-educations': 'education',
    'honors': 'news', 'talks': 'news',
    '-honors-and-awards': 'news', '-invited-talks': 'news',
    '-invited-talks--conferences': 'news', '-academic-service': 'service',
    '-open-source-datasets': 'datasets', '-open-source-systems': 'projects',
    '-research-vision': 'research-vision'
  };
  function revealAnchor() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(aliases[id] || id);
    if (!target) return;
    if (target.id === 'news' && aliases[id] === 'news' && id !== '-news') {
      document.querySelectorAll('#news details.more-items').forEach(detail => { detail.open = true; });
    }
    for (let node = target; node; node = node.parentElement) {
      if (node.tagName === 'DETAILS') node.open = true;
    }
    if (location.hash) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
  }
  window.addEventListener('hashchange', revealAnchor);
  revealAnchor();
})();
