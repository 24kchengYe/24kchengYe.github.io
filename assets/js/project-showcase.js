/* Synthetic, browser-only examples. No API requests, storage, timers, or live project access. */
(() => {
  'use strict';
  document.querySelectorAll('[data-project-demo]').forEach(demo => {
    const tabs = Array.from(demo.querySelectorAll('[data-project-tab]'));
    const panels = Array.from(demo.querySelectorAll('[data-project-panel]'));
    if (!tabs.length || !panels.length) return;
    function select(key, focusTab = false, animate = true) {
      const current = tabs.find(tab => tab.dataset.projectTab === key);
      if (!current) return;
      demo.dataset.activeTab = key;
      tabs.forEach(tab => {
        const selected = tab === current;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
      panels.forEach(panel => {
        const selected = panel.dataset.projectPanel === key;
        panel.hidden = !selected;
        panel.setAttribute('role', 'tabpanel');
        panel.tabIndex = 0;
        panel.classList.remove('project-panel-enter');
        if (selected && animate) {
          // One short transition per deliberate selection; never an autoplay loop.
          void panel.offsetWidth;
          panel.classList.add('project-panel-enter');
        }
      });
      if (focusTab) current.focus({preventScroll: true});
    }
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(tab.dataset.projectTab));
      tab.addEventListener('keydown', event => {
        let next;
        if (['ArrowRight', 'ArrowDown'].includes(event.key)) next = (index + 1) % tabs.length;
        if (['ArrowLeft', 'ArrowUp'].includes(event.key)) next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        select(tabs[next].dataset.projectTab, true);
      });
    });
    demo.querySelector('[data-project-tabs]').hidden = false;
    demo.classList.add('is-enhanced');
    select(demo.dataset.initialTab || tabs[0].dataset.projectTab, false, false);

    if (demo.dataset.projectDemo === 'memory') {
      const questions = Array.from(demo.querySelectorAll('[data-memory-question]'));
      const answers = Array.from(demo.querySelectorAll('[data-memory-answer]'));
      function question(key) {
        questions.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.memoryQuestion === key)));
        answers.forEach(answer => { answer.hidden = answer.dataset.memoryAnswer !== key; });
        demo.dataset.memoryQuestion = key;
      }
      demo.querySelector('[data-memory-questions]').hidden = false;
      questions.forEach(button => button.addEventListener('click', () => question(button.dataset.memoryQuestion)));
      question('local');
      demo.querySelectorAll('[data-memory-source]').forEach(button => {
        button.hidden = false;
        button.addEventListener('click', () => {
          select('remember', false, false);
          const fact = demo.querySelector(`[data-memory-fact="${button.dataset.memorySource}"]`);
          if (fact) {
            fact.tabIndex = -1;
            fact.focus({preventScroll: true});
          }
        });
      });
    }
    if (demo.dataset.projectDemo === 'zync') {
      demo.querySelectorAll('[data-zync-review]').forEach(button => {
        button.hidden = false;
        button.addEventListener('click', () => {
          const checked = button.getAttribute('aria-pressed') !== 'true';
          button.setAttribute('aria-pressed', String(checked));
          button.querySelector('[data-review-unchecked]').hidden = checked;
          button.querySelector('[data-review-checked]').hidden = !checked;
          const tab = tabs.find(item => item.dataset.projectTab === button.dataset.zyncReview);
          tab?.classList.toggle('is-reviewed', checked);
        });
      });
    }
  });
})();
