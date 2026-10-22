const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const directory = path.join(root, '_data/writing/figures');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const readDiagrams = () => JSON.parse(fs.readFileSync(path.join(directory, 'research-workflows.json'), 'utf8'));

function researchTranslations(slug) {
  return Object.fromEntries([['图注与口径', 'Figure notes', '図注と評価条件'], ...readDiagrams().filter(diagram => diagram.id.startsWith(slug + '-')).flatMap(diagram => [diagram.title, diagram.caption, ...(diagram.notes || [])])].map(values => [values[0], values.slice(1)]));
}

function attachResearchDiagrams(document, slug, technical) {
  for (const diagram of readDiagrams().filter(item => item.id.startsWith(slug + '-'))) {
    const anchor = document.getElementById(diagram.anchors[technical ? 1 : 0]);
    if (!anchor) throw new Error(`Missing article anchor: ${diagram.id}`);
    const figure = document.createElement('figure');
    figure.id = diagram.id.endsWith('full-workflow') ? 'full-workflow' : 'recorded-case';
    figure.className = 'figure-block';
    figure.innerHTML = `<img data-figure="${diagram.id}" alt="${escape(diagram.title[0])}" width="${diagram.width}" height="${diagram.height}" loading="lazy" decoding="async"><figcaption>${escape(diagram.caption[0])}</figcaption>`;
    if (diagram.notes?.length) figure.insertAdjacentHTML('beforeend', `<details class="figure-detail"><summary>图注与口径</summary>${diagram.notes.map(note => `<p>${escape(note[0])}</p>`).join('')}</details>`);
    anchor.after(figure);
  }
}

function buildResearchDiagrams() {
  const diagrams = readDiagrams();
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
  const annotations = JSON.parse(fs.readFileSync(path.join(root, '_data/writing/diagram-explorer.json'), 'utf8'));
  let translations = {};
  const label = values => {
    if (!Array.isArray(values) || values.length !== 3 || values.some(value => typeof value !== 'string' || !value.trim())) throw new Error('Every diagram label needs three languages');
    translations[values[0]] = values.slice(1);
    return escape(values[0]);
  };
  for (const diagram of diagrams) {
    translations = {};
    const { id, width, height, nodes, edges, labels } = diagram;
    const lines = edges.flatMap(([from, to, points, dashed]) => {
      if (!nodes[from] || !nodes[to]) throw new Error(`Unknown diagram edge: ${id}/${from}/${to}`);
      return points.slice(1).map(([horizontal, vertical], index) => {
        const [startX, startY] = points[index];
        const length = Math.hypot(horizontal - startX, vertical - startY);
        const angle = Math.atan2(vertical - startY, horizontal - startX) * 180 / Math.PI;
        return `<div class="edge${index === points.length - 2 ? ' arrow' : ''}${dashed ? ' feedback' : ''}" data-from="${from}" data-to="${to}" style="left:${startX}px;top:${startY}px;width:${length}px;transform:rotate(${angle}deg)"></div>`;
      });
    }).join('');
    const blocks = Object.entries(nodes).map(([nodeId, [left, top, boxWidth, boxHeight, title, body, tone]]) => {
      const detail = diagram.nodeDetails?.[nodeId];
      return `<div class="node ${tone || ''}" id="${nodeId}" style="left:${left}px;top:${top}px;width:${boxWidth}px;height:${boxHeight}px"><strong>${label(title)}</strong><span>${label(body)}</span>${detail ? `<span data-node-detail="true" hidden>${label(detail)}</span>` : ''}</div>`;
    }).join('');
    const notes = labels.map(([left, top, boxWidth, text, role]) => `<div class="label ${role || ''}" style="left:${left}px;top:${top}px;width:${boxWidth}px">${label(text)}</div>`).join('');
    const html = `<!doctype html><html lang="zh"><meta charset="utf-8"><title>${label(diagram.title)}</title><style>
body{margin:0;background:#fff;color:#303b36;font-family:Arial,"PingFang SC","Hiragino Sans",sans-serif}
.canvas{position:relative;width:${width}px;height:${height}px;background:#fff;box-sizing:border-box}
.node{position:absolute;box-sizing:border-box;padding:18px 24px;border:1.5px solid #bfcac1;border-radius:8px;background:#fff;display:flex;flex-direction:column;justify-content:center;gap:10px;text-align:left;z-index:2}
.node strong{font-size:27px;line-height:1.23;font-weight:500;overflow-wrap:anywhere}
.node span{font-size:23px;line-height:1.35;color:#626e66;white-space:pre-line;overflow-wrap:anywhere}
.node.soft{background:#f3f6f1}.node.issue{background:#faf4ef;border-color:#d7c6b8}.node.result{background:#eff5ed;border-color:#9eaf96}
.edge{position:absolute;height:0;border-top:1.5px solid #9caa98;transform-origin:0 0;z-index:1}.edge.feedback{border-top-style:dashed}
.edge.arrow:after{content:"";position:absolute;right:-1px;top:-5px;border-left:8px solid #9caa98;border-top:4px solid transparent;border-bottom:4px solid transparent}
.label{position:absolute;font-size:21px;line-height:1.3;color:#687366;background:#fff;z-index:3;white-space:pre-line;box-sizing:border-box;padding:3px 6px}
.label.title{font-size:31px;font-weight:500;color:#303b36}.label.lane{font-size:24px;color:#405142}
</style><div class="canvas" data-fixed-type="true" data-research-diagram="${id}">${lines}${blocks}${notes}</div></html>\n`;
    fs.writeFileSync(path.join(directory, id + '.html'), html);
    fs.writeFileSync(path.join(directory, id + '.i18n.json'), JSON.stringify(translations, null, 2) + '\n');
    manifest[id] = { source:id + '.html', width, height, format:'html-css', translations:id + '.i18n.json' };
    annotations[id] = { kind:'flow', title:diagram.title, links:diagram.links || {} };
  }
  fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  const annotationFile = path.join(root, '_data/writing/diagram-explorer.json');
  let original = fs.readFileSync(annotationFile, 'utf8');
  for (const diagram of diagrams) {
    const entry = `  ${JSON.stringify(diagram.id)}: ${JSON.stringify(annotations[diagram.id])}`;
    if (JSON.parse(original)[diagram.id]) original = original.replace(new RegExp(`^  "${diagram.id}": .*?(,?)$`, 'm'), (_, comma) => entry + comma);
    else original = original.trim().slice(0, -1).trimEnd() + ',\n' + entry + '\n}\n';
  }
  fs.writeFileSync(annotationFile, original);
}

if (require.main === module) buildResearchDiagrams();
module.exports = { buildResearchDiagrams, attachResearchDiagrams, researchTranslations };
