/* Original SVG studies for the Writing entries, including the collapsed list. No external assets,
   text animation, scroll interception, or recurring animation loop. */
(() => {
  'use strict';
  const thumbnails = document.querySelectorAll('.writing-section .writing-row .thumbnail');
  if (!thumbnails.length) return;
  const sheet = (x, accent = false) => [
    [`M${x+4} 40H${x+40}Q${x+44} 40 ${x+44} 44V100Q${x+44} 104 ${x+40} 104H${x+4}Q${x} 104 ${x} 100V44Q${x} 40 ${x+4} 40Z`, `study-paper${accent ? ' study-accent' : ''}`],
    [`M${x+8} 53H${x+35}M${x+8} 63H${x+27}M${x+8} 73H${x+35}M${x+8} 83H${x+31}`, accent ? 'study-accent' : '']
  ];
  const wires = [['M64 72H84M80 69L84 72L80 75', ''], ['M140 72H160M156 69L160 72L156 75', '']];
  const circle = 'M134 72A22 22 0 1 1 90 72A22 22 0 1 1 134 72Z';
  // One paper motif develops across the series: gathering, revision, judgment, execution.
  const studies = [
    [
      ['M20 32H65M20 39H48M16 24H72V47H16Z M20 70H58M20 77H49M16 62H72V85H16Z M20 108H63M20 115H46M16 100H72V123H16Z','study-soft'],
      ['M74 36C100 36 92 69 116 69M74 73H116M74 111C100 111 92 77 116 77',''],
      ['M126 26H177L195 44V123H126ZM177 26V44H195','study-paper study-accent'],
      ['M140 57H180M140 70H171M140 83H180M140 96H168M140 109H177','study-accent'],
      ['M109 69L116 73L109 77','']
    ],
    [
      ['M76 22H127L145 40V120H76ZM127 22V40H145','study-paper'],
      ['M89 52H132M89 65H121M89 78H131M89 91H115M89 104H132','study-soft'],
      ['M86 65H126M89 71H119M89 91H129M89 97H124','study-accent'],
      ['M153 47C196 47 199 103 155 107M162 101L155 107L163 112M67 99C26 98 26 41 67 37M60 32L67 37L61 43',''],
      ['M170 70L175 75L184 64M40 68H54M47 61V75','study-accent']
    ],
    [
      ['M25 24H79V123H25ZM36 42H67M36 58H67M36 74H67M36 90H67M36 106H58','study-paper'],
      ['M81 73H99M94 69L99 73L94 77M107 34V111M107 34H118M107 111H118',''],
      ['M126 34H182M126 73H182M126 111H182','study-soft'],
      ['M131 29L136 34L147 23M131 68L136 73L147 62M131 106L136 111L147 100','study-accent'],
      ['M191 26V120M187 26H195M187 120H195','study-soft']
    ],
    [
      ['M14 43H54V106H14ZM23 56H45M23 67H40M23 78H45M23 89H39','study-paper'],
      ['M55 74H73L88 52H116L131 74H154M73 74L88 97H116L131 74',''],
      ['M89 47L99 52L89 57M116 92L126 97L116 102','study-accent'],
      ['M157 38H197L211 52V113H157ZM197 38V52H211','study-paper study-accent'],
      ['M173 65L166 73L173 81M195 65L202 73L195 81M189 61L179 86','study-accent'],
      ['M94 120H119M102 127H126','study-soft']
    ],
    // A retained fact crosses a session boundary into a new model input.
    [
      ['M19 33H54L64 43V108H19ZM54 33V43H64','study-paper'],
      ['M14 42V115H55M28 55H53M28 67H47M28 79H53M28 91H45','study-soft'],
      ['M65 72H82M91 48L112 71L91 96M91 48V96M112 71H148M143 67L148 71L143 75',''],
      ['M96 48A5 5 0 1 1 86 48A5 5 0 1 1 96 48Z M117 71A5 5 0 1 1 107 71A5 5 0 1 1 117 71Z M96 96A5 5 0 1 1 86 96A5 5 0 1 1 96 96Z','study-paper study-accent'],
      ['M135 28V37M135 45V54M135 62V66M135 78V87M135 95V104M135 112V121','study-soft'],
      ['M155 35H204V110H155ZM155 51H204','study-paper'],
      ['M166 65H192M166 77H185M166 89H192M166 101H180','study-accent']
    ],
    // Delivery runs through a gate; a repair loop and a human checkpoint remain visible.
    [
      ['M33 72A7 7 0 1 1 19 72A7 7 0 1 1 33 72Z M35 72H54M94 72H116M148 72H169',''],
      ['M56 56H93V88H56ZM65 66H84M65 77H78','study-paper'],
      ['M116 72L132 56L148 72L132 88ZM124 72L130 78L140 66','study-paper study-accent'],
      ['M174 48H199L210 59V98H174ZM199 48V59H210M182 71H201M182 82H196','study-paper'],
      ['M133 49V29H75V49M71 44L75 49L79 44','study-soft'],
      ['M132 90V104M113 105H151V123H113ZM126 110V118M136 110V118','study-accent'],
      ['M151 114H192V103M188 108L192 103L196 108','study-soft']
    ],
    // One input is routed to a distribution, with three deliberately different weights.
    [
      ['M51 72A18 18 0 1 1 15 72A18 18 0 1 1 51 72Z M26 64H40M26 72H36M26 80H40','study-paper'],
      ['M52 72H70C90 72 88 33 111 33H127M70 72H127M70 72C90 72 88 111 111 111H127',''],
      ['M121 29L127 33L121 37M121 68L127 72L121 76M121 107L127 111L121 115','study-accent'],
      ['M140 25H160V41H140Z M140 103H173V119H140Z','study-paper'],
      ['M140 64H202V80H140Z','study-paper study-accent'],
      ['M147 33H153M147 72H193M147 111H166','study-accent'],
      ['M135 20V124M207 20V124','study-soft']
    ],
    // Shared input on the left; a selected, sparse tile within the attention field.
    [
      ['M17 37H58V107H17ZM26 49H49M26 61H43M26 73H49M26 85H43M26 97H49','study-paper'],
      ['M59 50H70V72H83M59 94H70V72M77 68L83 72L77 76',''],
      ['M91 30H203V114H91ZM119 30V114M147 30V114M175 30V114M91 51H203M91 72H203M91 93H203','study-soft'],
      ['M91 30H119V51H91Z M119 51H147V72H119Z M147 72H175V93H147Z M175 93H203V114H175Z','study-paper study-accent'],
      ['M95 76H115V89H95Z M151 55H171V68H151Z','study-accent'],
      ['M87 24H123M87 24V55M171 119H208V89','study-soft']
    ],
    // A recorded trajectory is evaluated, then its feedback returns to the policy.
    [
      ['M24 30H62L76 44V111H24ZM62 30V44H76','study-paper'],
      ['M34 54L39 58L34 62M45 62H64M34 76L39 80L34 84M45 84H60M34 99H65',''],
      ['M78 72H104M98 68L104 72L98 76',''],
      ['M116 39V103H204M124 47H201M124 92H201','study-soft'],
      ['M127 86C138 86 143 77 152 73S165 62 175 62H201','study-accent'],
      ['M127 79C140 79 147 77 157 77H201',''],
      ['M157 43V98M153 43H161M153 98H161','study-soft'],
      ['M187 112C167 135 72 138 50 120M50 120L51 128M50 120L58 121','study-accent']
    ],
    // Terminal experience becomes a revised demonstration and starts another iteration.
    [
      ['M17 47H94V105H17ZM17 61H94','study-paper'],
      ['M27 54H29M35 54H37M43 54H45','study-soft'],
      ['M30 73L38 80L30 87M45 87H60','study-accent'],
      ['M145 31H183L198 46V111H145ZM183 31V46H198','study-paper'],
      ['M157 60H185M157 72H180M157 84H185M157 96H176','study-soft'],
      ['M154 72H185M157 78H177M172 97L178 103L191 89','study-accent'],
      ['M97 76H135M129 72L135 76L129 80',''],
      ['M52 37C74 12 133 13 157 25M151 20L157 25L149 28','study-soft'],
      ['M174 119C151 138 72 138 52 115M52 115L51 123M52 115L60 117','study-accent']
    ]
  ];
  // Match identity rather than position, so reordering or adding a row keeps the correct drawing.
  const studySlugs = ['spec-generation', 'spec-repair', 'rubric-model', 'coding-agent-trajectories',
    'agent-memory', 'automation-blueprint', 'nimble-kev', 'attention-mechanisms',
    'ppo-long-horizon', 'terminal-rsi'];
  const studiesBySlug = new Map(studySlugs.map((slug, index) => [slug, studies[index]]));
  const ns = 'http://www.w3.org/2000/svg';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Set();
  function cancelAll() { running.forEach(a => a.cancel()); running.clear(); }
  function draw(svg) {
    if (document.querySelector('[data-poetic-scene]') || reduced.matches || document.visibilityState === 'hidden' || !Element.prototype.animate) return;
    [...svg.children].forEach((path, index) => {
      const animation = path.animate([
        { strokeDasharray: '1 1', strokeDashoffset: 1 },
        { strokeDasharray: '1 1', strokeDashoffset: 0 }
      ], { duration: 520, delay: index * 48, easing: 'cubic-bezier(.2,.65,.3,1)', fill: 'backwards' });
      running.add(animation);
      animation.finished.then(() => running.delete(animation), () => running.delete(animation));
    });
  }
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      draw(entry.target.querySelector('svg'));
    });
  }, { threshold: .6 }) : null;
  thumbnails.forEach(thumb => {
    let slug;
    try { slug = new URL(thumb.closest('.writing-row').getAttribute('href'), location.href).pathname.split('/').filter(Boolean).at(-1); }
    catch (_) { return; }
    const study = studiesBySlug.get(slug);
    if (!study) return;
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 224 144');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    study.forEach(([d, className]) => {
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', d); path.setAttribute('pathLength', '1');
      if (className) path.setAttribute('class', className);
      svg.append(path);
    });
    thumb.replaceChildren(svg); thumb.classList.add('line-study'); thumb.dataset.lineStudy = slug;
    if (observer) observer.observe(thumb);
  });
  reduced.addEventListener('change', cancelAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAll(); });
  window.addEventListener('pagehide', () => { cancelAll(); observer?.disconnect(); });
})();

(() => {
 'use strict';
 if(!document.getElementById('about-me'))return;
 document.querySelectorAll('.experience-entry > p:first-child').forEach(p=>{
   const strong=p.querySelector('strong');if(!strong)return;
   const fields=p.textContent.split('|').map(s=>s.trim());if(fields.length<3)return;
   const role=document.createElement('span'),date=document.createElement('span');
   role.className='experience-role';role.textContent=fields.slice(1,-1).join(' · ');
   date.className='experience-date';date.textContent=fields.at(-1);
   p.replaceChildren(strong,role,date);
 });
 document.querySelectorAll('.news-list li').forEach(li=>{
   const date=li.firstElementChild;if(date?.tagName!=='EM')return;
   date.classList.add('news-date');const copy=document.createElement('span');
   while(date.nextSibling)copy.append(date.nextSibling);
   if(copy.firstChild?.nodeType===3)copy.firstChild.textContent=copy.firstChild.textContent.replace(/^\s*[:：]\s*/,'');
   li.append(copy);
 });
})();
