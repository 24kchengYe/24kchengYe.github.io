const fs = require('node:fs');
const path = require('node:path');

function buildAutomationBlueprint() {
  const root = path.join(__dirname, '..');
  const sourceRoot = path.join(root, '_data/writing/automation-blueprint');
  const graph = JSON.parse(fs.readFileSync(path.join(sourceRoot, 'graph.json'), 'utf8'));
  const translations = JSON.parse(fs.readFileSync(path.join(sourceRoot, 'translations.json'), 'utf8'));
  const translate = (text) => {
    if (text && (!translations[text] || translations[text].length !== 2)) throw new Error(`Missing graph translation: ${text}`);
  };
  const allNodes = new Map();
  for (const view of Object.values(graph.views)) {
    translate(view.title);
    for (const node of view.nodes) {
      allNodes.set(node.id, node);
      translate(node.title);
      translate(node.note);
    }
  }
  for (const view of Object.values(graph.views)) {
    const localNodes = new Set(view.nodes.map(node => node.id));
    for (const edge of view.edges) {
      if (!localNodes.has(edge.from) || !localNodes.has(edge.to)) throw new Error(`Broken edge: ${edge.id}`);
      translate(edge.condition);
    }
    for (const label of view.labels) translate(label.text);
    for (const link of view.related) {
      if (!allNodes.has(link.target)) throw new Error(`Broken related flow: ${link.target}`);
      translate(link.direction);
      translate(link.title);
      translate(link.condition);
    }
  }
  fs.writeFileSync(path.join(root, 'assets/js/automation-blueprint-data.js'), `window.AutomationBlueprint = ${JSON.stringify({ ...graph, translations })};\n`);
}

module.exports = { buildAutomationBlueprint };
