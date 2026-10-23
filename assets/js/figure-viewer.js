(() => {
  'use strict';
  const dialog = document.getElementById('figure-zoom');
  if (!dialog) return;
  const viewport = dialog.querySelector('.figure-viewport');
  const surface = dialog.querySelector('.figure-surface');
  const image = surface.querySelector('img');
  const output = dialog.querySelector('.figure-scale');
  let naturalWidth = 1;
  let naturalHeight = 1;
  let scale = 1;
  let mode = 'fit';
  let drag = null;
  let opener = null;
  if (window.WritingDiagramStyle) {
    dialog.dataset.diagramStyle = window.WritingDiagramStyle.current();
    window.addEventListener('writing-diagram-style-change',() => { if (opener) image.src = opener.src; });
  }

  function fitScale() {
    return Math.min(1, Math.max(1, viewport.clientWidth - 24) / naturalWidth, Math.max(1, viewport.clientHeight - 24) / naturalHeight);
  }

  function render(nextScale, reset = false) {
    const centerHorizontal = (viewport.scrollLeft + viewport.clientWidth / 2 - (surface.clientWidth - naturalWidth * scale) / 2) / scale;
    const centerVertical = (viewport.scrollTop + viewport.clientHeight / 2 - (surface.clientHeight - naturalHeight * scale) / 2) / scale;
    scale = Math.max(Math.min(fitScale(), 0.1), Math.min(3, nextScale));
    const width = naturalWidth * scale;
    const height = naturalHeight * scale;
    image.style.width = `${width}px`;
    image.style.height = `${height}px`;
    surface.style.width = `${Math.max(viewport.clientWidth, width + 24)}px`;
    surface.style.height = `${Math.max(viewport.clientHeight, height + 24)}px`;
    output.textContent = `${Math.round(scale * 100)}%`;
    viewport.classList.toggle('is-zoomed', width + 24 > viewport.clientWidth || height + 24 > viewport.clientHeight);
    viewport.scrollLeft = reset ? 0 : centerHorizontal * scale + (surface.clientWidth - width) / 2 - viewport.clientWidth / 2;
    viewport.scrollTop = reset ? 0 : centerVertical * scale + (surface.clientHeight - height) / 2 - viewport.clientHeight / 2;
  }

  function resize() {
    if (!dialog.open) return;
    const nextScale = mode === 'fit' ? fitScale() : mode === 'width' ? Math.min(1, (viewport.clientWidth - 24) / naturalWidth) : scale;
    render(nextScale, mode !== 'manual');
  }

  for (const figure of document.querySelectorAll('figure img')) {
    figure.tabIndex = 0;
    figure.setAttribute('role', 'button');
    figure.setAttribute('aria-haspopup', 'dialog');
    const show = () => {
      opener = figure;
      naturalWidth = Number(figure.getAttribute('width')) || figure.naturalWidth || 1;
      naturalHeight = Number(figure.getAttribute('height')) || figure.naturalHeight || 1;
      image.src = figure.src;
      image.alt = figure.alt;
      mode = 'fit';
      dialog.showModal();
      resize();
    };
    figure.addEventListener('click', show);
    figure.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      show();
    });
  }

  for (const button of dialog.querySelectorAll('[data-viewer]')) {
    button.addEventListener('click', () => {
      const action = button.dataset.viewer;
      if (action === 'close') { dialog.close(); return; }
      if (action === 'fit' || action === 'width') { mode = action; resize(); return; }
      mode = 'manual';
      render(scale * (action === 'in' ? 1.5 : 1 / 1.5));
    });
  }
  viewport.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || !viewport.classList.contains('is-zoomed')) return;
    drag = { horizontal: event.clientX, vertical: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add('is-dragging');
    event.preventDefault();
  });
  viewport.addEventListener('pointermove', event => {
    if (!drag) return;
    viewport.scrollLeft = drag.left + drag.horizontal - event.clientX;
    viewport.scrollTop = drag.top + drag.vertical - event.clientY;
  });
  const stopDrag = () => { drag = null; viewport.classList.remove('is-dragging'); };
  viewport.addEventListener('pointerup', stopDrag);
  viewport.addEventListener('pointercancel', stopDrag);
  viewport.addEventListener('lostpointercapture', stopDrag);
  dialog.addEventListener('close', () => { stopDrag(); opener?.focus({ preventScroll: true }); });
  new ResizeObserver(resize).observe(viewport);
})();
