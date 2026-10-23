const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const stylesheet = fs.readFileSync(path.join(__dirname,'../assets/css/writing-diagram-themes.css'),'utf8');
function colorRole(color) {
  const normalized = String(color || '').trim().toLowerCase();
  const hex = normalized.match(/^#([\da-f]{3}|[\da-f]{6})$/);
  if (!hex) return null;
  const value = hex[1].length === 3 ? [...hex[1]].map(part => part + part).join('') : hex[1];
  const [red,green,blue] = value.match(/../g).map(part => parseInt(part,16));
  if (Math.max(red,green,blue) - Math.min(red,green,blue) < 24) return 'neutral';
  if (green > red && green > blue) return 'accent';
  return null;
}
function themeFigure(source,kind,theme) {
  const dom = new JSDOM(source,{ contentType:'image/svg+xml' });
  const document = dom.window.document;
  const svg = document.documentElement;
  const wrapper = document.querySelector('.diagram-root') || svg;
  wrapper.setAttribute('data-diagram-style',theme);
  wrapper.setAttribute('data-diagram-kind',kind);
  const style = document.createElementNS(wrapper.namespaceURI,'style');
  style.textContent = stylesheet;
  wrapper.append(style);
  if (wrapper === svg) {
    if (kind === 'flow') {
      const definitions = document.createElementNS(svg.namespaceURI,'defs');
      definitions.setAttribute('data-diagram-textures','');
      for (const [name,background,ink] of [['neutral','#fafaf8','#777770'],['accent','#f5faef','#70a33d']]) {
        const pattern = document.createElementNS(svg.namespaceURI,'pattern');
        for (const [key,value] of Object.entries({ id:`writing-dot-${name}`,patternUnits:'userSpaceOnUse',width:5,height:5 })) pattern.setAttribute(key,value);
        const base = document.createElementNS(svg.namespaceURI,'rect');
        for (const [key,value] of Object.entries({ width:5,height:5,fill:background })) base.setAttribute(key,value);
        const dot = document.createElementNS(svg.namespaceURI,'circle');
        for (const [key,value] of Object.entries({ cx:1.5,cy:1.5,r:0.45,fill:ink,opacity:0.24 })) dot.setAttribute(key,value);
        pattern.append(base,dot);
        definitions.append(pattern);
      }
      svg.append(definitions);
    }
    const nodeBoxes = new Set([...svg.querySelectorAll('[data-node-box]')].map(label => label.getAttribute('data-node-box')));
    for (const shape of svg.querySelectorAll('path,line,polyline,rect,circle,ellipse,polygon')) {
      if (shape.closest('defs')) continue;
      const stroke = shape.style.stroke || shape.getAttribute('stroke');
      const fill = shape.style.fill || shape.getAttribute('fill');
      const role = colorRole(stroke);
      if (role) shape.setAttribute('data-diagram-stroke',role);
      if (fill === '#ffffff' || fill === '#fff' || fill === 'white') shape.setAttribute('data-diagram-fill',role && kind === 'flow' ? 'node' : 'paper');
      if (nodeBoxes.has(shape.parentElement.id)) {
        if (kind === 'flow' && /^url\(/.test(fill || '')) shape.setAttribute('data-diagram-fill','soft');
        if (kind === 'flow' && role === 'accent' && shape.getAttribute('data-diagram-fill') === 'node') shape.setAttribute('data-diagram-fill','accent');
        if (['node','soft','accent'].includes(shape.getAttribute('data-diagram-fill'))) shape.setAttribute('data-diagram-node','');
      }
    }
    for (const text of svg.querySelectorAll('text')) {
      if (text.closest('defs')) continue;
      const role = colorRole(text.style.fill || text.getAttribute('fill'));
      if (role) text.setAttribute('data-diagram-text',role === 'accent' ? 'accent' : text.getAttribute('data-type-role') === 'secondary' ? 'secondary' : 'primary');
    }
  }
  const output = svg.outerHTML.replace(/^[\t ]+$/gm,'');
  dom.window.close();
  return output;
}
module.exports = { themeFigure };
