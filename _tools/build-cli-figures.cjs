const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const directory = path.join(__dirname, '../_data/writing/figures');
const graph = JSON.parse(fs.readFileSync(path.join(directory, 'cli-trajectory-flow.json'), 'utf8'));
const escape = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const css = '*{box-sizing:border-box}body{margin:0;background:white;color:#303a31;font-family:Arial,"PingFang SC","Hiragino Sans",sans-serif}.canvas{position:relative;overflow:hidden;background:white}.region{position:absolute;border:1px solid #dce2d5;border-radius:5px;background:radial-gradient(#d7dfd3 .65px,transparent .8px);background-size:6px 6px}.title{position:absolute;left:40px;top:18px;font-size:25px;font-weight:500}.node{position:absolute;display:flex;align-items:center;justify-content:center;text-align:center;padding:10px 16px;border:1.2px solid #a4ae9d;border-radius:8px;background:#fff;font-size:20px;line-height:1.35;z-index:2}.node.source{border-radius:24px;background:#fafbf7}.node.gate{border-radius:0;border-color:#89947f}.node.pending{border-radius:24px;background:#f5f6f3;color:#737c6c}.node.output{background:#edf3e3;border-color:#8da668;border-radius:24px}.sub{font-size:.78em;color:#758269}.edge{position:absolute;height:0;border-top:1.3px solid #a0ac93;transform-origin:0 0;z-index:1}.edge.feedback,.edge.context{border-top-style:dashed}.edge.handoff{border-color:#86a45b;border-top-width:1.8px}.edge.failure{border-color:#c0c6b9}.edge.arrow:after{content:"";position:absolute;right:-1px;top:-4px;border-left:6px solid #a0ac93;border-top:3px solid transparent;border-bottom:3px solid transparent}.edge.handoff.arrow:after{border-left-color:#86a45b}.edge.failure.arrow:after{border-left-color:#c0c6b9}.edge-label{position:absolute;transform:translate(-50%,-50%);font-size:15px;color:#758269;line-height:1.2;background:#fff;padding:2px 4px;white-space:nowrap;z-index:3}.bundle{position:absolute;border:1px solid #b7c5a9;background:#fcfdf9;padding:30px;border-radius:6px;font-size:22px}.bundle h3{margin:0 0 28px;font-size:25px;font-weight:500}.turns{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;color:#64765a}.turns b{padding:7px 18px;border:1px solid #c5d1b5;background:#f5f8ee;border-radius:4px;font-weight:400;font-style:italic}.bundle p{margin:22px 0;display:flex;justify-content:space-between;gap:20px}.bundle hr{border:0;border-top:1px solid #e0e6d6}.environment{position:absolute;display:flex;align-items:center;justify-content:space-evenly;border:1px solid #ced8c3;border-radius:10px;background:#fafcf6;font-size:22px}.dependencies{position:absolute;background:white;border:1px solid #b5c1a6;border-radius:10px;padding:20px;text-align:center;font-size:20px;z-index:2}.dependencies header{margin-bottom:20px}.dependency-row{display:grid;grid-template-columns:repeat(4,1fr);font-size:17px}.dependency-row span+span{border-left:1px solid #dae2d1}.query-note{position:absolute;font-size:19px;line-height:1.6;color:#758269}';
function lineSegments(edge, offsetX, offsetY, points = edge.points) {
  return '<div class="connection" data-from="' + edge.from + '" data-to="' + edge.to + '">' + points.slice(1).map((end, index) => {
    const start = points[index];
    const distance = Math.hypot(end[0] - start[0], end[1] - start[1]);
    const angle = Math.atan2(end[1] - start[1], end[0] - start[0]) * 180 / Math.PI;
    return '<div class="edge ' + edge.kind + (index === points.length - 2 ? ' arrow' : '') + '" style="left:' + (start[0] - offsetX) + 'px;top:' + (start[1] - offsetY) + 'px;width:' + distance + 'px;transform:rotate(' + angle + 'deg)"></div>';
  }).join('') + '</div>';
}
function renderNode(node, offsetX, offsetY) {
  const position = 'left:' + (node.x - node.w / 2 - offsetX) + 'px;top:' + (node.y - node.h / 2 - offsetY) + 'px;width:' + node.w + 'px;height:' + node.h + 'px';
  if (node.custom === 'bundle') return '<div class="bundle" id="' + node.id + '" style="' + position + '"><h3>轨迹包</h3><div class="turns"><b>t₁</b><b>t₂</b><span>…</span><b>tᵢ</b><span>…</span><b>t<sub>T</sub></b></div><p><span>思考 / 正文</span><span>调用 → 返回</span></p><hr><p><span>执行记录</span><span>回执 · 消耗 · 版本</span></p><p><span>产物引用</span><span>Base · 文件</span></p></div>';
  if (node.custom === 'environment') return '<div class="environment" id="' + node.id + '" style="' + position + '"><span>Skills · 工作区</span><span>lark-cli → Base</span></div>';
  if (node.custom === 'dependencies') return '<div class="dependencies" id="' + node.id + '" style="' + position + '"><header>Turn 依赖</header><div class="dependency-row">' + graph.dependencies.map(label => '<span>' + label + '</span>').join('') + '</div></div>';
  return '<div class="node ' + node.kind + '" id="' + node.id + '" style="' + position + ';font-size:20px">' + node.label.split('\n').map((line, index) => index ? '<span class="sub">' + escape(line) + '</span>' : escape(line)).join('<br>') + '</div>';
}
const panels = [
  { name: 'cli-harness', prefix: 'A', width: 1760, height: 500, offsetX: 0, offsetY: 0, title: 'a · 长程轨迹合成', region: [375, 80, 750, 395] },
  { name: 'cli-online', prefix: 'B', width: 900, height: 1020, offsetX: 0, offsetY: 520, title: 'b · Online：生成与修复', region: [40, 50, 810, 950] },
  { name: 'cli-offline', prefix: 'C', width: 840, height: 1020, offsetX: 930, offsetY: 520, title: 'c · Offline：编辑与准出', region: [25, 50, 780, 950] },
];
function buildCliFigures() {
  for (const panel of panels) {
    const [left, top, width, height] = panel.region;
    let content = '<div class="region" style="left:' + left + 'px;top:' + top + 'px;width:' + width + 'px;height:' + height + 'px"></div><div class="title">' + panel.title + '</div>';
    for (const edge of graph.edges.filter(item => item.from.startsWith(panel.prefix) && item.to.startsWith(panel.prefix))) {
      content += lineSegments(edge, panel.offsetX, panel.offsetY);
      if (edge.label) content += '<div class="edge-label" style="left:' + (edge.labelAt[0] - panel.offsetX) + 'px;top:' + (edge.labelAt[1] - panel.offsetY) + 'px">' + escape(edge.label) + '</div>';
    }
    if (panel.prefix === 'A') content += '<div class="query-note" style="left:60px;top:330px">表 · 视图 · 仪表盘<br>工作流 · 权限</div><div style="position:absolute;left:395px;top:65px;padding:0 12px;background:white;font-size:24px;color:#53624b">Harness</div>';
    const handoff = graph.edges.find(edge => edge.from === 'BO' && edge.to === 'C0');
    if (panel.prefix === 'B') content += lineSegments(handoff, 0, 520, [[830, 995], [880, 995]]) + '<div class="edge-label" style="left:760px;top:525px">交接至 Offline →</div>';
    if (panel.prefix === 'C') content += lineSegments(handoff, 930, 520, [[980, 600], [1195, 600]]) + '<div class="edge-label" style="left:125px;top:58px">来自 Online</div>';
    content += graph.nodes.filter(node => node.id.startsWith(panel.prefix)).map(node => renderNode(node, panel.offsetX, panel.offsetY)).join('\n');
    const html = '<!doctype html><html lang="zh"><head><meta charset="utf-8"><title>' + panel.name + '</title><style>' + css + '</style></head><body><main class="canvas" style="width:' + panel.width + 'px;height:' + panel.height + 'px">' + content + '</main></body></html>\n';
    fs.writeFileSync(path.join(directory, panel.name + '.html'), html);
  }
  let combined = panels.map(panel => {
    const [left, top, width, height] = panel.region;
    return '<div class="region" style="left:' + (left + panel.offsetX) + 'px;top:' + (top + panel.offsetY) + 'px;width:' + width + 'px;height:' + height + 'px"></div><div class="title" style="left:' + (40 + panel.offsetX) + 'px;top:' + (18 + panel.offsetY) + 'px">' + panel.title + '</div>';
  }).join('');
  for (const edge of graph.edges) {
    combined += lineSegments(edge, 0, 0);
    if (edge.label) combined += '<div class="edge-label" style="left:' + edge.labelAt[0] + 'px;top:' + edge.labelAt[1] + 'px">' + escape(edge.label) + '</div>';
  }
  combined += '<div class="query-note" style="left:60px;top:330px">表 · 视图 · 仪表盘<br>工作流 · 权限</div><div style="position:absolute;left:395px;top:65px;padding:0 12px;background:white;font-size:24px;color:#53624b">Harness</div>';
  combined += graph.nodes.map(node => renderNode(node, 0, 0)).join('\n');
  fs.writeFileSync(path.join(directory, 'cli-combined.html'), '<!doctype html><html lang="zh"><head><meta charset="utf-8"><title>cli-combined</title><style>' + css + '</style></head><body><main class="canvas" style="width:1760px;height:1540px">' + combined + '</main></body></html>\n');
  for (const name of [...panels.map(panel => panel.name), 'cli-combined']) {
    const target = path.join(directory, name + '.html');
    const dom = new JSDOM(fs.readFileSync(target, 'utf8'));
    const document = dom.window.document;
    document.querySelector('.canvas').setAttribute('data-fixed-type', '');
    for (const element of document.querySelectorAll('[style]')) {
      const style = element.style;
      if (element.classList.contains('edge-label')) {
        const offsets = { '需重生成': [0, -8], '不等价': [0, 9], '有限后续': [0, 17], '未准出': [-24, 0] };
        const offset = offsets[element.textContent];
        if (offset) {
          style.left = parseFloat(style.left) + offset[0] + 'px';
          style.top = parseFloat(style.top) + offset[1] + 'px';
        }
      }
      for (const property of ['left', 'width']) if (style[property]) style[property] = parseFloat(style[property]) * 1.05 + 'px';
      for (const property of ['top', 'height']) if (style[property]) style[property] = parseFloat(style[property]) * 1.3 + 'px';
      if (element.classList.contains('edge')) {
        const angle = parseFloat(style.transform.match(/rotate\(([-\d.]+)/)[1]) * Math.PI / 180;
        const length = parseFloat(style.width) / 1.05;
        style.width = Math.hypot(Math.cos(angle) * length * 1.05, Math.sin(angle) * length * 1.3) + 'px';
        style.transform = 'rotate(' + Math.atan2(Math.sin(angle) * 1.3, Math.cos(angle) * 1.05) * 180 / Math.PI + 'deg)';
      }
      if (element.classList.contains('node')) {
        if (['BN', 'BK'].includes(element.id)) {
          style.left = parseFloat(style.left) - 12 + 'px';
          style.width = parseFloat(style.width) + 24 + 'px';
        }
        const height = Math.max(parseFloat(style.height), element.querySelector('.sub') ? 108 : 82);
        style.top = parseFloat(style.top) + (parseFloat(style.height) - height) / 2 + 'px';
        style.height = height + 'px';
        style.removeProperty('font-size');
      }
    }
    for (const connection of document.querySelectorAll('.connection')) {
      const segments = [...connection.querySelectorAll('.edge')];
      for (const [index, segment] of segments.entries()) {
        const style = segment.style;
        const angle = parseFloat(style.transform.match(/rotate\(([-\d.]+)/)[1]) * Math.PI / 180;
        const start = [parseFloat(style.left), parseFloat(style.top)];
        const end = [start[0] + Math.cos(angle) * parseFloat(style.width), start[1] + Math.sin(angle) * parseFloat(style.width)];
        for (const [id, point, active, outgoing] of [[connection.dataset.from, start, index === 0, true], [connection.dataset.to, end, index === segments.length - 1, false]]) {
          const node = document.getElementById(id);
          if (!active || !node) continue;
          const horizontal = Math.abs(Math.cos(angle)) > .5;
          const positive = horizontal ? Math.cos(angle) > 0 : Math.sin(angle) > 0;
          point[horizontal ? 0 : 1] = parseFloat(node.style[horizontal ? 'left' : 'top']) + (positive === outgoing ? parseFloat(node.style[horizontal ? 'width' : 'height']) : 0);
        }
        style.left = start[0] + 'px';
        style.top = start[1] + 'px';
        style.width = Math.hypot(end[0] - start[0], end[1] - start[1]) + 'px';
        style.transform = 'rotate(' + Math.atan2(end[1] - start[1], end[0] - start[0]) * 180 / Math.PI + 'deg)';
      }
    }
    document.querySelector('style').textContent += '\n.title{font-size:30px}.node,.environment,.dependencies,.bundle,.bundle h3{font-size:26px;line-height:1.25}.node{padding:6px 12px}.sub,.dependency-row,.query-note{font-size:20px;line-height:1.25}.edge-label{font-size:19px;line-height:1.25}.bundle h3{font-weight:500}.bundle p{font-size:20px}.dependency-row{gap:10px}.turns b{padding:7px 12px}';
    fs.writeFileSync(target, dom.serialize() + '\n');
    dom.window.close();
  }
}
module.exports = { buildCliFigures };
