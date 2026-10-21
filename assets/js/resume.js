(() => {
  'use strict';
  const button = document.querySelector('.resume-print');
  if (button) {
    button.hidden = false;
    button.addEventListener('click', () => window.print());
  }
})();
