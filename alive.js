/* October 21: authored default motion, with one shared visibility policy. */
(() => {
  'use strict';
  const body = document.body;
  const decorate = (element) => {
    if (element.closest('.reading-copy')) return;
    if (!element.querySelector('.pointer-glyph') && !element.children.length) {
      const label = element.textContent;
      const accessible = document.createElement('span');
      accessible.className = 'sr-only'; accessible.textContent = label;
      const visual = document.createElement('span');
      visual.setAttribute('aria-hidden', 'true');
      label.split(/(\s+)/).forEach(word => {
        if (!word.trim()) { visual.append(document.createTextNode(word)); return; }
        const run = document.createElement('span'); run.className = 'pointer-word';
        [...word].forEach(char => {
          const glyph = document.createElement('span');
          glyph.className = 'pointer-glyph'; glyph.textContent = char; run.append(glyph);
        });
        visual.append(run);
      });
      element.replaceChildren(accessible, visual);
    }
    element.classList.add('ambient-type');
    element.querySelectorAll('.pointer-glyph').forEach((glyph, index) => {
      const ink = document.createElement('span'); ink.className = 'dance-letter';
      ink.textContent = glyph.textContent; ink.style.setProperty('--beat', `${-(index % 29) * .145}s`);
      ink.style.setProperty('--arrival', `${Math.min(index, 30) * .012}s`);
      glyph.replaceChildren(ink);
    });
  };
  // Only display typography dances. Paragraphs, form controls and navigation stay stable.
  document.querySelectorAll('.portal-copy h1,.portal-copy>p,.portal-foot,.tap-label,.hero h2,.eyebrow,.section-label,.living-heading h2,.section-head h2,.philosophy h2,.statement>h2,.craft>h2,footer>h2,footer>p').forEach(decorate);
  document.querySelectorAll('img[src^="assets/v-mark-"],img[src="assets/v-original-3d.png"]').forEach(img => img.classList.add('alive-logo'));
  if(body.classList.contains('flow')) document.querySelectorAll('.living-gallery,.philosophy,.craft').forEach((section,index)=>{
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 1000 64');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');svg.classList.add('flow-thread');
    const d=index%2?'M-30 42 C170 42 200 8 390 22 S770 65 1030 14':'M-30 15 C180 63 330 2 520 29 S850 62 1030 16';
    for(const cls of ['thread-base','thread-light']){const path=document.createElementNS(ns,'path');path.setAttribute('d',d);path.classList.add(cls);svg.append(path)}
    section.prepend(svg);
  });
  const observed = [...document.querySelectorAll('.ambient-type,.reading-copy,.alive-logo,.featured-print,.section,.craft article,.film,.album')];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { entry.target.classList.toggle('motion-in-view', entry.isIntersecting); if(entry.isIntersecting) entry.target.classList.add('has-bloomed'); });
  }, {threshold: 0, rootMargin: '25px'});
  observed.forEach(element => observer.observe(element));
  function sync() {
    body.classList.toggle('page-inactive', document.hidden);
    const entered = body.classList.contains('entered');
    document.querySelector('#welcome').inert = entered;
    document.querySelector('#portfolio').inert = !entered;
  }
  new MutationObserver(sync).observe(body, {attributes: true, attributeFilter: ['class']});
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('selectionchange', () => body.classList.toggle('selecting-copy', !getSelection()?.isCollapsed));
  sync();
  body.dataset.livingEdition = '2026-10-21-flow';
})();
