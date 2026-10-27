(() => {
  'use strict';
  function addMark(target, kind) {
    if (!target || target.querySelector('.visual-mark')) return;
    target.classList.add('marked-entry');
    const mark = document.createElement('span');
    mark.className = `visual-mark mark-${kind}`;
    mark.setAttribute('aria-hidden', 'true');
    for (let index = 0; index < 4; index += 1) mark.append(document.createElement('i'));
    target.prepend(mark);
  }
  const papers = [
    [/GenAI Models Capture/, 'urban'],
    [/UrbanAlign/, 'alignment'],
    [/Towards Building-Scale/, 'scale'],
    [/CMAB/, 'dataset'],
    [/Ghost Cities/, 'urban'],
    [/Country-level/, 'dataset'],
    [/Urban Spatial Risk/, 'alignment'],
    [/WaveC2R/, 'weather']
  ];
  document.querySelectorAll('#research .paper-box-text > h3').forEach(target => {
    const entry = papers.find(([pattern]) => pattern.test(target.textContent));
    if (entry) addMark(target, entry[1]);
  });
  const projects = [
    ['MemoMind', 'memory'], ['HumanSkillTree', 'tree'], ['Zync', 'agents'],
    ['AI4UrbanScience', 'urban'], ['UrbanAlign', 'alignment'], ['DigitalMe', 'agents'],
    ['SmartBidding', 'document'], ['AI API Gateway', 'gateway'],
    ['GEHI Batch Router', 'layers'], ['DayLife', 'memory']
  ];
  document.querySelectorAll('.project-name').forEach(target => {
    const entry = projects.find(([name]) => target.textContent.includes(name));
    if (entry) addMark(target, entry[1]);
  });
  document.querySelectorAll('.experience-entry > p:first-child').forEach(target => {
    addMark(target, /ByteDance|字节|バイトダンス/.test(target.textContent) ? 'bytedance' : 'weather');
  });
  document.querySelectorAll('.education li').forEach(target => addMark(target, 'university'));
  document.querySelectorAll('#datasets li').forEach(target => addMark(target, 'dataset'));
})();
