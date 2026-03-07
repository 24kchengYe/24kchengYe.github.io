(function () {
  var LANGS = ['en', 'zh', 'ja'];
  var LABELS = { en: 'EN', zh: '中', ja: '日' };

  function switchLang(lang) {
    if (LANGS.indexOf(lang) === -1) lang = 'en';
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;

    var btn = document.getElementById('lang-btn');
    if (btn) btn.textContent = LABELS[lang] || lang;

    // Re-trigger greedy nav width recalculation
    if (window.jQuery) jQuery(window).trigger('resize');
  }

  window.switchLang = switchLang;

  document.addEventListener('DOMContentLoaded', function () {
    switchLang(localStorage.getItem('lang') || 'en');
  });
})();
