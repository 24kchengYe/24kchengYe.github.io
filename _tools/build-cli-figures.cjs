const fs = require('node:fs');
const path = require('node:path');

const directory = path.join(__dirname, '../_data/writing/figures');
const graph = JSON.parse(fs.readFileSync(path.join(directory, 'cli-trajectory-flow.json'), 'utf8'));
const scaleX = 1.3;
const scaleY = 1.65;
const escape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const css = '*{box-sizing:border-box}body{margin:0;background:#fff;color:#303c38;font-family:Arial,"PingFang SC","Hiragino Sans",sans-serif}.canvas{position:relative;background:#fff;overflow:hidden}.region{position:absolute;border:1px solid #dce2d5;border-radius:6px}.region-label{position:absolute;font-size:28px;background:#fff;padding:0 12px;color:#687568;z-index:3}.title{position:absolute;font-size:32px;line-height:1.25}.node{position:absolute;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:5px;padding:8px 14px;text-align:center;background:#fff;border:1px solid #a6b1a1;border-radius:5px;font-size:28px;line-height:1.2;z-index:2}.sub{font-size:22px;line-height:1.3;color:#687568}.source{border-radius:20px}.output{background:#eff4e9}.pending{border-radius:20px;background:#f7f8f5;color:#687568}.gate{border-radius:2px;border-color:#87977e}.workspace{position:absolute;border:1px solid #d3dccb;border-radius:6px;background:#fafbf8;z-index:0}.workspace>span{position:absolute;left:20px;top:12px;font-size:24px;color:#687568}.bundle{position:absolute;border:1px solid #b9c6ad;border-radius:6px;padding:24px;background:#fff;font-size:26px;line-height:1.4;z-index:2}.bundle h3{font-size:28px;font-weight:400;margin:0 0 28px}.turns{display:flex;align-items:center;justify-content:space-between;font:italic 26px Georgia,serif;margin-bottom:32px;color:#65755c}.turns span{padding:8px 10px;border-bottom:1px solid #aab89e}.bundle p{margin:20px 0}.bundle .small{font-size:22px;color:#687568}.dependencies{gap:16px}.dependency-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;font-size:22px;line-height:1.35;width:100%;color:#687568}.dependency-row span+span{border-left:1px solid #dce2d5;padding-left:12px}.edge{position:absolute;height:0;border-top:1.6px solid #98a58c;transform-origin:0 0;z-index:1}.edge.feedback,.edge.context{border-top-style:dashed}.edge.failure{border-color:#bcc4b5}.edge.handoff{border-color:#879f70}.edge.arrow:after{content:"";position:absolute;right:-1px;top:-5px;border-left:8px solid #98a58c;border-top:4px solid transparent;border-bottom:4px solid transparent}.edge.failure.arrow:after{border-left-color:#bcc4b5}.edge.handoff.arrow:after{border-left-color:#879f70}.edge-label{position:absolute;transform:translate(-50%,-50%);max-width:220px;padding:3px 5px;background:#fff;color:#687568;font-size:20px;line-height:1.2;text-align:center;z-index:3}.port{position:absolute;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border:1px solid #a6b897;border-radius:50%;background:#fafcf7;color:#65755c;font-size:23px;z-index:3}.note{position:absolute;color:#687568;font-size:22px;line-height:1.45}';
const panels = [
  {name:'cli-harness', prefix:'A', x:0, y:0, width:1760, height:610, title:'a · 长程轨迹合成'},
  {name:'cli-online', prefix:'B', x:0, y:620, width:910, height:1160, title:'b · Online：生成与修复'},
  {name:'cli-offline', prefix:'C', x:930, y:620, width:830, height:1160, title:'c · Offline：编辑与准出'},
];
function position(left, top, width, height, panel) {
  return 'left:'+((left-panel.x)*scaleX)+'px;top:'+((top-panel.y)*scaleY)+'px;width:'+(width*scaleX)+'px;height:'+(height*scaleY)+'px';
}
function label(text, horizontal, vertical, panel, className='edge-label') {
  return '<div class="'+className+'" style="left:'+((horizontal-panel.x)*scaleX)+'px;top:'+((vertical-panel.y)*scaleY)+'px">'+escape(text)+'</div>';
}
function segments(edge, panel) {
  const arrow = !(edge.to==='CR' && ['CV','CJ'].includes(edge.from));
  const output = edge.points.slice(1).map((end, index)=>{
    const start=edge.points[index];
    const horizontal=(end[0]-start[0])*scaleX;
    const vertical=(end[1]-start[1])*scaleY;
    return '<div class="edge '+edge.kind+(arrow && index===edge.points.length-2?' arrow':'')+'" style="left:'+((start[0]-panel.x)*scaleX)+'px;top:'+((start[1]-panel.y)*scaleY)+'px;width:'+Math.hypot(horizontal,vertical)+'px;transform:rotate('+(Math.atan2(vertical,horizontal)*180/Math.PI)+'deg)"></div>';
  }).join('');
  const labelPositions = { 'BN>BG': [255, 1180], 'CJ>CP': [1080, 1430], 'CS>CR': [1590, 925] };
  const labelAt = labelPositions[edge.logicalEdge] || edge.labelAt;
  return '<div class="connection" data-from="'+edge.from+'" data-to="'+edge.to+'" data-logical-edge="'+escape(edge.logicalEdge||'')+'">'+output+'</div>'+(edge.label?label(edge.label,...labelAt,panel):'');
}
function nodeMarkup(node, panel) {
  const box=position(node.x-node.w/2,node.y-node.h/2,node.w,node.h,panel);
  if(node.custom==='workspace') return '<div class="workspace" id="'+node.id+'" style="'+box+'"><span>本地工作区</span></div>';
  if(node.custom==='bundle') return '<div class="bundle" id="'+node.id+'" style="'+box+'"><h3>轨迹包</h3><div class="turns"><span>t₁</span><span>t₂</span><span>…</span><span>tᵢ</span><span>…</span><span>tT</span></div><p>思考 / 正文 → 调用 → 返回</p><p class="small">执行记录 · 回执 · 消耗 · 版本</p><p class="small">产物引用 · Base · 文件</p></div>';
  if(node.custom==='dependencies') return '<div class="node dependencies" id="'+node.id+'" style="'+box+'"><div>Turn 依赖</div><div class="dependency-row">'+graph.dependencies.map(value=>'<span>'+escape(value)+'</span>').join('')+'</div></div>';
  const lines=node.label.split('\n');
  const content='<div>'+escape(lines[0])+'</div>'+lines.slice(1).map(value=>'<div class="sub">'+escape(value)+'</div>').join('')+(node.custom==='tool-runtime'?'<div class="sub">Read · Write · Edit · Bash · present_files</div>':'');
  return '<div class="node '+node.kind+'" id="'+node.id+'" style="'+box+'">'+content+'</div>';
}
function panelDecorations(panel, destination) {
  let output=label(panel.title,panel.x+40,panel.y+14,destination,'title');
  if(panel.prefix==='A') {
    output+='<div class="region" style="'+position(335,75,925,505,destination)+'"></div>';
    output+=label('Harness',355,58,destination,'region-label');
    output+=label('表 · 视图 · 仪表盘',40,315,destination,'note');
    output+=label('工作流 · 权限',40,355,destination,'note');
  } else {
    output+='<div class="region" style="'+position(panel.x+25,660,panel.prefix==='B'?825:790,1090,destination)+'"></div>';
    if(panel.prefix==='B') {
      output+=label('教师覆盖每次执行',80,740,destination,'note supervision-note');
      output+=label('① 回到执行环 · ② 沿用累计预算',75,1710,destination,'note');
    }
  }
  return output;
}
function render(panel, combined=false) {
  const selected=combined?panels:[panel];
  let content=selected.map(item=>panelDecorations(item,panel)).join('');
  for(const edge of graph.displayEdges) {
    const belongs=selected.some(item=>edge.from.startsWith(item.prefix)&&edge.to.startsWith(item.prefix));
    const connector=edge.from.startsWith('connector-')&&selected.some(item=>edge.to.startsWith(item.prefix));
    if(combined||belongs||connector) content+=segments(edge,panel);
  }
  if(!combined&&panel.prefix==='B') content+=segments({from:'BO',to:'C0',kind:'handoff',logicalEdge:'BO>C0',points:[[830,1115],[890,1115]],label:'至 Offline',labelAt:[805,1160]},panel);
  if(!combined&&panel.prefix==='C') content+=segments({from:'BO',to:'C0',kind:'handoff',logicalEdge:'BO>C0',points:[[970,720],[1195,720]],label:'来自 Online',labelAt:[1080,697]},panel);
  content+=graph.nodes.filter(node=>selected.some(item=>node.id.startsWith(item.prefix))).map(node=>nodeMarkup(node,panel)).join('\n');
  for(const port of graph.connectors.filter(port=>selected.some(item=>port.node.startsWith(item.prefix)))) {
    content+='<div class="port" data-target="'+port.node+'" data-port="'+port.label+'" data-role="'+port.role+'" style="left:'+((port.x-panel.x)*scaleX-18)+'px;top:'+((port.y-panel.y)*scaleY-18)+'px">'+port.label+'</div>';
  }
  return '<!doctype html><html lang="zh"><head><meta charset="utf-8"><title>'+panel.name+'</title><style>'+css+'.supervision-note{width:270px}.node>div{flex-shrink:0;max-width:100%}</style></head><body><main class="canvas" data-fixed-type style="width:'+Math.ceil(panel.width*scaleX)+'px;height:'+Math.ceil(panel.height*scaleY)+'px">'+content+'</main></body></html>\n';
}
function buildCliFigures() {
  for(const panel of panels) fs.writeFileSync(path.join(directory,panel.name+'.html'),render(panel));
  const combined={name:'cli-combined',x:0,y:0,width:1760,height:1780};
  fs.writeFileSync(path.join(directory,'cli-combined.html'),render(combined,true));
}
module.exports={buildCliFigures};
