(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const body = document.body;
  const portal = $('#welcome');
  const portfolio = $('#portfolio');
  const logo = $('#logoEnter');
  const motionToggle = $('#motionToggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let motionPaused = reduced.matches;
  let raf = 0;
  let entered = false;
  let introRevealed = false;

  function setPaused(value) {
    value = Boolean(value || reduced.matches);
    motionPaused = value;
    body.classList.toggle('paused', value);
    motionToggle.setAttribute('aria-pressed', String(value));
    motionToggle.textContent = value ? 'Resume motion' : 'Pause motion';
    $('#hubMotionToggle')?.setAttribute('aria-pressed',String(value));
    if($('#hubMotionToggle')) $('#hubMotionToggle').textContent=value?'Resume motion':'Pause motion';
    [motionToggle,$('#hubMotionToggle')].filter(Boolean).forEach(control=>{
      control.disabled=reduced.matches;
      control.title=reduced.matches?'Motion is reduced by your device preference.':'';
      if(reduced.matches)control.textContent='Reduced motion';
    });
    if (value && body.dataset.reactiveReady) { stopTypeDemo(); resetReactiveText(); }
    if (value) {
      portal.style.setProperty('--mx', '0'); portal.style.setProperty('--my', '0');
      logo.style.setProperty('--rx', '0deg'); logo.style.setProperty('--ry', '0deg');
      if (body.dataset.inkReady) {
        stopInk(introLetter, true); stopInk(scriptPanel, true);
        if (introRevealed && !entered) setIntroFinal(true);
      }
    }
    if (!value && !entered) startCanvas();
    if (body.dataset.hubReady) {
      if (value || !entered) stopHubDust();
      else startHubDust();
    }
    if (body.dataset.featherCursorReady) syncFeatherMode();
  }

  function enterPortfolio() {
    if (entered) return;
    entered = true;
    const letter = $('#introLetter');
    if (!letter.classList.contains('letter-complete')) stopInk(letter, true);
    scrollTo({top: 0, behavior: 'auto'});
    body.classList.add('entered');
    body.classList.remove('before-entry');
    cancelAnimationFrame(raf);
    syncFeatherMode();
    if (body.dataset.hubReady) startHubDust();
    setTimeout(() => portfolio.focus({preventScroll: true}), reduced.matches ? 0 : 260);
  }

  function revealIntroduction() {
    if (introRevealed || entered) return;
    introRevealed = true;
    logo.setAttribute('aria-label', 'Tap the V again to enter Venkat’s creative hub');
    body.classList.add('intro-revealed');
    cancelAnimationFrame(raf);
    syncFeatherMode();
    storyIntro.setAttribute('aria-hidden', 'false');
    storyIntro.classList.add('intro-final');
    letterEntry.setAttribute('aria-hidden', 'false');
    $('#introMotionStatus').textContent = 'Read at your own pace. Enter whenever you feel ready.';
    setTimeout(() => {
      $('#openHub').focus({preventScroll: true});
    }, reduced.matches ? 0 : 220);
  }

  function replayUniverse() {
    entered = false;
    introRevealed = false;
    logo.setAttribute('aria-label', 'Reveal the V EXPLORES introduction');
    body.classList.remove('entered');
    body.classList.remove('intro-revealed');
    body.classList.add('before-entry');
    $('#storyIntro').setAttribute('aria-hidden', 'true');
    stopInk($('#introLetter'), true);
    if(body.dataset.inkReady)setIntroFinal(false);
    if (body.dataset.hubReady) stopHubDust();
    scrollTo({top: 0, behavior: reduced.matches ? 'auto' : 'smooth'});
    setTimeout(() => { logo.focus({preventScroll: true}); startCanvas(); }, reduced.matches ? 0 : 450);
  }

  logo.addEventListener('click', () => {
    if (introRevealed) enterPortfolio();
    else revealIntroduction();
  });
  $('#openHub').addEventListener('click', enterPortfolio);
  $('#skipIntro').addEventListener('click', enterPortfolio);
  $('.skip-link').addEventListener('click', e => { e.preventDefault(); enterPortfolio(); });
  $('#replay').addEventListener('click', replayUniverse);
  $('#footerReplay').addEventListener('click', e => { e.preventDefault(); replayUniverse(); });
  motionToggle.addEventListener('click', () => setPaused(!motionPaused));
  $('#hubMotionToggle')?.addEventListener('click', () => setPaused(!motionPaused));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !entered) enterPortfolio(); });
  reduced.addEventListener('change', e => setPaused(e.matches));

  const canvas = $('#astral');
  const ctx = canvas.getContext('2d', {alpha: true});
  let w = 0, h = 0, dpr = 1, stars = [], last = 0;
  const pointer = {x: .5, y: .5, px: -999, py: -999, active: false};
  function size() {
    const rect = portal.getBoundingClientRect();
    w = Math.max(1, rect.width); h = Math.max(1, rect.height); dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); canvas.style.width = w + 'px'; canvas.style.height = h + 'px'; ctx.setTransform(dpr,0,0,dpr,0,0);
    const n = Math.min(420, Math.max(120, Math.round(w * h / 4200)));
    const hues=[188,204,264,318,42,156];
    stars = Array.from({length:n}, (_, i) => ({x:Math.random()*w,y:Math.random()*h,z:.25+Math.random()*.9,r:i%17===0?2.2:.45+Math.random()*1.2,phase:Math.random()*6.28,hue:hues[i%hues.length]}));
    paint(0);
  }
  function updatePointer(x, y) {
    if (motionPaused || reduced.matches) return;
    pointer.px=x; pointer.py=y; pointer.x=x/w-.5; pointer.y=y/h-.5; pointer.active=true;
    portal.style.setProperty('--mx', String(pointer.x)); portal.style.setProperty('--my', String(pointer.y));
    logo.style.setProperty('--ry', `${pointer.x*10}deg`); logo.style.setProperty('--rx', `${pointer.y*-8}deg`);
  }
  portal.addEventListener('pointermove', e => updatePointer(e.clientX,e.clientY), {passive:true});
  portal.addEventListener('pointerleave', () => {pointer.active=false;portal.style.setProperty('--mx','0');portal.style.setProperty('--my','0');logo.style.setProperty('--ry','0deg');logo.style.setProperty('--rx','0deg')});
  portal.addEventListener('touchmove', e => {const t=e.touches[0];if(t)updatePointer(t.clientX,t.clientY)}, {passive:true});
  function paint(now) {
    ctx.clearRect(0,0,w,h);
    const t = now*.00015;
    const glow=ctx.createRadialGradient(w*.5,h*.53,0,w*.5,h*.53,Math.min(w,h)*.47);
    glow.addColorStop(0,'rgba(63,181,255,.11)');glow.addColorStop(.5,'rgba(42,69,155,.035)');glow.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    if(pointer.active){const halo=ctx.createRadialGradient(pointer.px,pointer.py,0,pointer.px,pointer.py,190);halo.addColorStop(0,'rgba(87,240,228,.16)');halo.addColorStop(.32,'rgba(96,123,255,.09)');halo.addColorStop(.62,'rgba(218,83,189,.045)');halo.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=halo;ctx.fillRect(pointer.px-190,pointer.py-190,380,380)}
    for (const s of stars) {
      let x=s.x + Math.sin(t+s.phase)*8*s.z + pointer.x*22*s.z;
      let y=s.y + Math.cos(t*.7+s.phase)*5*s.z + pointer.y*15*s.z;
      if(pointer.active){const dx=x-pointer.px,dy=y-pointer.py,ds=dx*dx+dy*dy;if(ds<18000&&ds>1){const f=(1-Math.sqrt(ds)/135)*23;const inv=1/Math.sqrt(ds);x+=dx*inv*f;y+=dy*inv*f}}
      const pulse=.45+.55*Math.sin(t*7+s.phase)**2;
      ctx.beginPath();ctx.arc(x,y,s.r*(.7+pulse*.62),0,Math.PI*2);ctx.fillStyle=`hsla(${s.hue},38%,42%,${(.28+s.z*.67)*.3})`;ctx.fill();
      if(s.r>1.5){ctx.beginPath();ctx.moveTo(x-5,y);ctx.lineTo(x+5,y);ctx.moveTo(x,y-5);ctx.lineTo(x,y+5);ctx.strokeStyle=`rgba(190,245,255,${.12+pulse*.2})`;ctx.stroke()}
    }
  }
  function frame(now) { if (entered || introRevealed || motionPaused || document.hidden) return; if(now-last>16){paint(now);last=now} raf=requestAnimationFrame(frame) }
  function startCanvas(){cancelAnimationFrame(raf);if(!entered&&!introRevealed&&!motionPaused&&!document.hidden)raf=requestAnimationFrame(frame);else paint(0)}
  addEventListener('resize', size, {passive:true}); size(); setPaused(motionPaused);

  const hubCanvas = $('#hubDust');
  const hubCtx = hubCanvas.getContext('2d', {alpha:true});
  let hubW=0, hubH=0, hubDpr=1, hubParticles=[], hubRaf=0, hubLast=0;
  const hubPointer={x:innerWidth*.5,y:innerHeight*.5,active:false};
  const hubPalette=['0,157,149','31,112,211','112,76,201','211,66,154','224,156,43','29,160,118'];
  function resizeHub(){
    hubW=Math.max(1,innerWidth);hubH=Math.max(1,innerHeight);hubDpr=Math.min(devicePixelRatio||1,1.25);
    hubCanvas.width=Math.round(hubW*hubDpr);hubCanvas.height=Math.round(hubH*hubDpr);hubCanvas.style.width=hubW+'px';hubCanvas.style.height=hubH+'px';hubCtx.setTransform(hubDpr,0,0,hubDpr,0,0);
    const count=Math.min(280,Math.max(92,Math.round(hubW*hubH/6800)));
    hubParticles=Array.from({length:count},(_,i)=>({x:Math.random()*hubW,y:Math.random()*hubH,r:i%17===0?2.15:.5+Math.random()*1.1,vx:(Math.random()-.5)*.11,vy:-.045-Math.random()*.15,phase:Math.random()*6.283,color:hubPalette[i%hubPalette.length],depth:.35+Math.random()*.75,streak:i%31===0}));
    drawHubDust(0,true);
  }
  function drawHubDust(now,still=false){
    hubCtx.clearRect(0,0,hubW,hubH);
    const t=now*.001;
    if(hubPointer.active&&!still){const halo=hubCtx.createRadialGradient(hubPointer.x,hubPointer.y,0,hubPointer.x,hubPointer.y,220);halo.addColorStop(0,'rgba(21,188,177,.15)');halo.addColorStop(.35,'rgba(92,94,218,.08)');halo.addColorStop(.62,'rgba(218,71,160,.045)');halo.addColorStop(1,'rgba(255,255,255,0)');hubCtx.fillStyle=halo;hubCtx.fillRect(hubPointer.x-220,hubPointer.y-220,440,440)}
    for(const p of hubParticles){
      if(!still){p.x+=p.vx+Math.sin(t*.34+p.phase)*.025;p.y+=p.vy;if(p.y<-10){p.y=hubH+10;p.x=Math.random()*hubW}if(p.x<-10)p.x=hubW+10;if(p.x>hubW+10)p.x=-10}
      let x=p.x,y=p.y;
      if(hubPointer.active&&!still){const dx=x-hubPointer.x,dy=y-hubPointer.y,d=Math.hypot(dx,dy)||1;if(d<190){const force=(1-d/190)*24;x+=dx/d*force;y+=dy/d*force}}
      const pulse=still?.55:.34+.66*Math.sin(t*.72+p.phase)**2;
      hubCtx.beginPath();hubCtx.arc(x,y,p.r*(.78+pulse*.5),0,Math.PI*2);hubCtx.fillStyle=`rgba(${p.color},${(.2+p.depth*.25)*pulse})`;hubCtx.fill();
      if(p.r>1.65){hubCtx.beginPath();hubCtx.moveTo(x-5,y);hubCtx.lineTo(x+5,y);hubCtx.moveTo(x,y-5);hubCtx.lineTo(x,y+5);hubCtx.strokeStyle=`rgba(${p.color},${.12+pulse*.15})`;hubCtx.stroke()}
      if(p.streak&&!still){hubCtx.beginPath();hubCtx.moveTo(x,y);hubCtx.lineTo(x-p.vx*68,y-p.vy*68);hubCtx.strokeStyle=`rgba(${p.color},${.07+pulse*.08})`;hubCtx.stroke()}
    }
  }
  function hubFrame(now){
    if(!entered||motionPaused||reduced.matches||document.hidden||body.classList.contains('cinema-open')){hubRaf=0;drawHubDust(0,true);return}
    if(now-hubLast>20){drawHubDust(now);hubLast=now}
    hubRaf=requestAnimationFrame(hubFrame);
  }
  function startHubDust(){cancelAnimationFrame(hubRaf);hubRaf=0;if(entered&&!motionPaused&&!reduced.matches&&!document.hidden&&!body.classList.contains('cinema-open'))hubRaf=requestAnimationFrame(hubFrame);else drawHubDust(0,true)}
  function stopHubDust(){cancelAnimationFrame(hubRaf);hubRaf=0;drawHubDust(0,true)}
  document.addEventListener('pointermove',e=>{if(!entered||motionPaused||reduced.matches||e.pointerType==='touch')return;hubPointer.x=e.clientX;hubPointer.y=e.clientY;hubPointer.active=true;portfolio.style.setProperty('--hub-x',e.clientX+'px');portfolio.style.setProperty('--hub-y',e.clientY+'px')},{passive:true});
  document.addEventListener('pointerdown',e=>{if(!entered||motionPaused||reduced.matches)return;hubPointer.x=e.clientX;hubPointer.y=e.clientY;hubPointer.active=true;portfolio.style.setProperty('--hub-x',e.clientX+'px');portfolio.style.setProperty('--hub-y',e.clientY+'px');if(e.pointerType==='touch')setTimeout(()=>{hubPointer.active=false},520)},{passive:true});
  document.addEventListener('pointerleave',()=>{hubPointer.active=false},{passive:true});
  addEventListener('resize',resizeHub,{passive:true});resizeHub();body.dataset.hubReady='true';
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); stopHubDust(); }
    else if (entered) startHubDust(); else startCanvas();
  });

  const inkRuns = new Map();
  function prepareInk(container) {
    if (!container || container.dataset.inkReady) return;
    container.dataset.inkReady = 'true';
    container.querySelectorAll('.ink-paragraph').forEach(paragraph => {
      const text = paragraph.textContent.trim();
      paragraph.textContent = '';
      const assistive = document.createElement('span');
      assistive.className = 'sr-only';
      assistive.textContent = text;
      paragraph.append(assistive);
      text.split(/\s+/).forEach((word, index, words) => {
        const span = document.createElement('span');
        span.className = 'ink-word';
        span.setAttribute('aria-hidden', 'true');
        span.dataset.word = word;
        span.dataset.weight = String(Math.max(2, word.replace(/[^A-Za-z]/g, '').length));
        span.style.setProperty('--cut', '0%');
        span.style.setProperty('--edge', '100%');
        const base = document.createElement('span');
        base.className = 'ink-base';
        base.textContent = word;
        const glow = document.createElement('span');
        glow.className = 'ink-glow';
        glow.setAttribute('aria-hidden', 'true');
        glow.textContent = word;
        span.append(base, glow);
        paragraph.append(span);
        if (index < words.length - 1) paragraph.append(' ');
      });
    });
  }
  function setInkProgress(container, progress) {
    const words = [...container.querySelectorAll('.ink-word')];
    const total = words.reduce((sum, word) => sum + Number(word.dataset.weight), 0);
    const cursor = Math.max(0, Math.min(1, progress)) * total;
    let used = 0;
    words.forEach(word => {
      const weight = Number(word.dataset.weight);
      const fill = Math.max(0, Math.min(1, (cursor - used) / weight));
      word.style.setProperty('--cut', `${(100 - fill * 100).toFixed(2)}%`);
      word.style.setProperty('--edge', `${(fill * 100).toFixed(2)}%`);
      word.classList.toggle('painted', fill >= .999);
      word.classList.toggle('painting', fill > 0 && fill < .999);
      used += weight;
    });
    const paragraphs = [...container.querySelectorAll('.ink-paragraph')];
    paragraphs.forEach(paragraph => {
      const childWords = [...paragraph.querySelectorAll('.ink-word')];
      paragraph.classList.toggle('ink-active', childWords.some(word => word.classList.contains('painting')));
      paragraph.classList.toggle('ink-settled', childWords.every(word => word.classList.contains('painted')));
    });
    container.style.setProperty('--letter-progress', String(progress));
  }
  function stopInk(container, settle = false) {
    if (!container) return;
    const run = inkRuns.get(container);
    if (run) cancelAnimationFrame(run.raf);
    inkRuns.delete(container);
    container.classList.remove('inking', 'voice-writing');
    if (settle) { setInkProgress(container, 1); container.classList.add('letter-complete'); }
  }
  function playInk(container, duration = 16000) {
    if (!container) return;
    prepareInk(container);
    stopInk(container, false);
    const status = container === introLetter ? $('#introMotionStatus') : null;
    if (reduced.matches || motionPaused) {
      setInkProgress(container, 1);
      container.classList.add('letter-complete');
      if(container===introLetter)setIntroFinal(true);
      if (status) status.textContent = reduced.matches ? 'Reduced motion · complete letter shown' : 'Motion paused · complete letter shown';
      return;
    }
    container.classList.remove('letter-complete');
    container.classList.add('inking');
    if (container.scrollHeight > container.clientHeight) container.scrollTop = 0;
    if (status) status.textContent = 'Motion Graphics captions are playing';
    setInkProgress(container, 0);
    const run = {raf:0,last:performance.now(),elapsed:0,active:null};
    const tick = now => {
      if (!motionPaused) run.elapsed += Math.min(48, now - run.last);
      run.last = now;
      const progress = Math.min(1, run.elapsed / duration);
      setInkProgress(container, progress);
      const active = container.querySelector('.ink-paragraph.ink-active');
      if (active && active !== run.active && container.scrollHeight > container.clientHeight) {
        run.active = active;
        const top = Math.max(0, active.offsetTop - (container.clientHeight - active.offsetHeight) * .42);
        container.scrollTo({top, behavior:'smooth'});
      }
      if (progress < 1) run.raf = requestAnimationFrame(tick);
      else {
        container.classList.remove('inking');
        container.classList.add('letter-complete');
        if(container===introLetter)setIntroFinal(true);
        inkRuns.delete(container);
        if (status) status.textContent = 'Motion Graphics captions complete · full letter shown';
      }
    };
    run.raf = requestAnimationFrame(tick);
    inkRuns.set(container, run);
  }
  const introLetter = $('#introLetter');
  const scriptPanel = $('#scriptPanel');
  const storyIntro = $('#storyIntro');
  const letterEntry = $('#letterEntry');
  function setIntroFinal(complete){
    storyIntro.classList.toggle('intro-final',complete);
    letterEntry.setAttribute('aria-hidden',String(!complete));
    if(complete){
      if(body.dataset.reactiveReady)resetReactiveText();
      introLetter.scrollTo({top:0,behavior:reduced.matches||motionPaused?'auto':'smooth'});

    }
  }
  prepareInk(introLetter); prepareInk(scriptPanel);
  setInkProgress(introLetter, 1); setInkProgress(scriptPanel, 1);
  introLetter.classList.add('letter-complete');
  scriptPanel.classList.add('letter-complete');
  setIntroFinal(false);
  body.dataset.inkReady='true';

  // Original narration is preserved on disk. Its superseded quote must not play.
  // The updated introduction is silent and immediately readable, never time-gated.
  function showQuickLetter() {
    stopInk(introLetter, true);
    introLetter.scrollTop = 0;
    setIntroFinal(true);
    $('#introMotionStatus').textContent = 'Read at your own pace. Enter whenever you feel ready.';
    if (!motionPaused && !reduced.matches) {
      introLetter.classList.remove('quick-flourish');
      requestAnimationFrame(() => introLetter.classList.add('quick-flourish'));
    }
  }
  $('#introInkReplay').addEventListener('click', showQuickLetter);
  $('#textPreview').addEventListener('click', () => {
    stopInk(scriptPanel, true);
    if (!motionPaused && !reduced.matches) {
      scriptPanel.classList.remove('quick-flourish');
      requestAnimationFrame(() => scriptPanel.classList.add('quick-flourish'));
    }
  });

  document.addEventListener('play',e=>{if(e.target.matches?.('audio,video'))document.querySelectorAll('audio,video').forEach(other=>{if(other!==e.target)other.pause()})},true);

  // Reading copy keeps native shaping and word spaces; only display type reacts.
  document.querySelectorAll('.philosophy blockquote,.living-pair figcaption,.section-label,.eyebrow,.gallery-note').forEach(el=>el.classList.add('reading-copy'));
  const glyphTargetSelector = [
    '.portal-copy>p','.portal-copy>h1','.tap-label','.portal-foot',
    '.intro-prefix','.letter-actions>button','.letter-actions>small','.letter-logo-enter>span','.letter-logo-enter>small','.brand>span','.nav nav>a','.nav>button',
    '.hero .eyebrow','.hero h2','.hero .lead','.hero-links>a','.identity-card>p',
    '.statement>.section-label','.statement>h2','.process-card>span','.process-card>h3','.process-card>p','.process-card>button',
    '.films>.section-label','.films .section-head>h2','.films .section-head>p','.film>div>span','.film>div>h3','.film>div>p',
    '.music>.section-label','.music .section-head>h2','.music .section-head>p','.album>div>span','.album>div>h3','.album>div>p',
    '.craft>.section-label','.craft>h2','.craft article>b','.craft article>h3','.craft article>p',
    'footer>h2','footer>p','footer>a','.platform-kicker','.platforms h3','.platforms>div:first-child>p','.platform-link>span','footer>.creator-credit','.living-heading>h2','.philosophy h2'
  ].join(',');
  const scriptRunSelector = '.intro-name,.venkat-signature';
  const nestedScriptSelector = '.cursor-connected-script';
  const glyphGroups = [];
  let scriptRuns = [];
  const movingGlyphs = new Map(), movingScripts = new Map();
  let textDirty = true, textFrameAt = 0, textDragging = false, textDemoActive = false, demoRaf = 0;
  let textPointer = {x:innerWidth/2,y:innerHeight/2,active:false,raf:0};

  function makeGlyph(char,index) {
    const span=document.createElement('span');
    span.className=char.trim()?'pointer-glyph':'pointer-glyph pointer-space';
    span.textContent=char;
    span.dataset.glyphIndex=String(index);
    return span;
  }
  function buildVisualTree(source,target,counter) {
    [...source.childNodes].forEach(node=>{
      if(node.nodeType===Node.TEXT_NODE){
        node.textContent.split(/(\s+)/).forEach(token=>{
          if(!token)return;
          if(/^\s+$/.test(token)){const gap=document.createElement('span');gap.className='pointer-gap';gap.textContent=token;target.append(gap);return}
          const word=document.createElement('span');word.className='pointer-word';
          [...token].forEach(char=>word.append(makeGlyph(char,counter.value++)));
          target.append(word);
        });
        return;
      }
      if(node.nodeType!==Node.ELEMENT_NODE)return;
      const clone=node.cloneNode(false);
      if(node.matches(nestedScriptSelector)){
        clone.textContent=node.textContent;
        clone.classList.add('cursor-script-run');
      }else buildVisualTree(node,clone,counter);
      target.append(clone);
    });
  }
  function glyphify(element) {
    if(!element||element.dataset.glyphReady)return;
    // Hidden portfolio groups still need their full accessible labels at boot.
    const original=element.cloneNode(true);
    const readable=original.cloneNode(true);readable.querySelectorAll('br').forEach(br=>br.replaceWith(' '));
    readable.querySelectorAll('small').forEach(small=>small.prepend(' '));
    const label=readable.textContent.replace(/\s+/g,' ').trim();
    const assistive=document.createElement('span');assistive.className='sr-only';assistive.textContent=label;
    const visual=document.createElement('span');visual.className='cursor-glyph-visual';visual.setAttribute('aria-hidden','true');
    buildVisualTree(original,visual,{value:0});
    element.replaceChildren(assistive,visual);element.setAttribute('aria-label',label);element.dataset.glyphReady='true';
    glyphGroups.push({element,glyphs:[...visual.querySelectorAll('.pointer-glyph:not(.pointer-space)')],measured:false});
  }
  function glyphifyInkLead(paragraph) {
    if(!paragraph||paragraph.dataset.glyphReady)return;
    let index=0;const pairs=[];
    paragraph.querySelectorAll('.ink-word').forEach(word=>{
      const base=word.querySelector('.ink-base'),glow=word.querySelector('.ink-glow');
      const text=base.textContent;base.textContent='';glow.textContent='';
      [...text].forEach(char=>{
        const a=makeGlyph(char,index),b=makeGlyph(char,index++);b.setAttribute('aria-hidden','true');
        base.append(a);glow.append(b);pairs.push({node:a,twin:b});
      });
    });
    paragraph.dataset.glyphReady='true';
    glyphGroups.push({element:paragraph,glyphs:pairs.map(pair=>pair.node),pairs,twins:new Map(pairs.map(pair=>[pair.node,pair.twin])),measured:false});
  }
  function fontAvailable(family){
    const canvas=document.createElement('canvas'),context=canvas.getContext('2d'),sample='Venkat explores WWWiii 012345';
    context.font='48px monospace';const fallback=context.measureText(sample).width;
    context.font=`48px "${family}",monospace`;return Math.abs(context.measureText(sample).width-fallback)>.5;
  }
  function detectSignatureFace(){
    const candidates=['acroterion-jf','AcroterionJF','Segoe Script','Segoe Print','Bradley Hand'];
    body.dataset.signatureFace=candidates.find(fontAvailable)||'cursive fallback';
    body.dataset.displayFace=fontAvailable('bely-display')?'bely-display':'Georgia';
    body.dataset.bodyFace=fontAvailable('source-sans-3')?'source-sans-3':'Segoe UI';
    body.dataset.musicFace=fontAvailable('adobe-caslon-pro')?'adobe-caslon-pro':'Georgia';
    body.dataset.motionFace=fontAvailable('mono45-headline')?'mono45-headline':'Arial Narrow';
    body.dataset.uiFace=fontAvailable('proxima-nova')?'proxima-nova':'Segoe UI';
  }
  function prepareReactiveType(){
    document.querySelectorAll(glyphTargetSelector).forEach(el=>{if(!el.closest('.reading-copy'))glyphify(el)});
    document.querySelectorAll('#introLetter>.ink-paragraph,#scriptPanel>.ink-paragraph').forEach(el=>{if(!el.matches('blockquote'))glyphifyInkLead(el)});
    scriptRuns=[...document.querySelectorAll(scriptRunSelector),...document.querySelectorAll('.cursor-glyph-visual .cursor-script-run')];
    scriptRuns.forEach(el=>el.classList.add('cursor-letter-reactive'));
    measureGlyphs();detectSignatureFace();
    document.fonts.ready.then(()=>{detectSignatureFace();invalidateTypeLayout()});
  }
  function measureGlyphs(groups=glyphGroups){
    groups.forEach(group=>{
      const host=group.element.getBoundingClientRect();
      if(!host.width||!host.height){group.measured=false;return}
      group.glyphs.forEach(glyph=>{const r=glyph.getBoundingClientRect();glyph.dataset.baseX=String(r.left+r.width/2-host.left);glyph.dataset.baseY=String(r.top+r.height/2-host.top)});
      group.measured=true;
    });
  }
  // A continuous field reaches zero at both the glyph centre and the radius.
  // It cannot flip a full-strength displacement when the pointer crosses a letter.
  function gentleField(dx,dy,radius,amplitude){
    const q=(dx*dx+dy*dy)/(radius*radius);
    if(q>=1)return {x:0,y:0,r:0,s:1};
    const falloff=(1-q)**2;
    return {x:dx/radius*falloff*amplitude*2.2,y:falloff*amplitude*(-.65+Math.sin(dx/radius*Math.PI)*.7),r:dx/radius*falloff*amplitude*.8,s:1+falloff*.05};
  }
  function dampValue(value,target,dt,tau){return target+(value-target)*Math.exp(-dt/tau)}
  function paintGlyph(glyph,twin,x,y,r,s=1){
    for(const node of twin?[glyph,twin]:[glyph]){
      node.style.setProperty('--glyph-x',`${x.toFixed(3)}px`);
      node.style.setProperty('--glyph-y',`${y.toFixed(3)}px`);
      node.style.setProperty('--glyph-r',`${r.toFixed(3)}deg`);
      node.style.setProperty('--glyph-s',s.toFixed(4));
    }
  }
  function clearGlyph(glyph,twin){
    paintGlyph(glyph,twin,0,0,0);
    glyph.classList.remove('cursor-near');twin?.classList.remove('cursor-near');
  }
  function resetReactiveText(){
    cancelAnimationFrame(textPointer.raf);textPointer.raf=0;textFrameAt=0;
    movingGlyphs.forEach((state,glyph)=>clearGlyph(glyph,state.twin));movingGlyphs.clear();
    movingScripts.forEach((state,el)=>{el.style.setProperty('--letter-x','0px');el.style.setProperty('--letter-y','0px');el.classList.remove('cursor-near')});movingScripts.clear();
  }
  function textMotionEnabled(){return !motionPaused&&!reduced.matches&&!textDragging&&!body.classList.contains('cinema-open')&&(textDemoActive||(finePointer.matches&&!cursorKeyboard))&&(!getSelection()||getSelection().isCollapsed)}
  function typeAmplitude(element){
    if(element.closest('.letter-complete'))return 0;
    if(element.closest('a,button,input,textarea,select,video,audio'))return 0;
    return element.matches('h1,h2,h3,.intro-prefix,.kinetic-lead')?2.4:0;
  }
  function updateTypeTargets(){
    movingGlyphs.forEach(s=>{s.tx=0;s.ty=0;s.tr=0;s.ts=1});movingScripts.forEach(s=>{s.tx=0;s.ty=0});
    if(!textPointer.active||!textMotionEnabled())return;
    const radius=155;
    glyphGroups.forEach(group=>{
      const amplitude=typeAmplitude(group.element);if(!amplitude)return;
      const rect=group.element.getBoundingClientRect();
      if(rect.bottom<0||rect.top>innerHeight||rect.right<0||rect.left>innerWidth)return;
      const ex=textPointer.x<rect.left?rect.left-textPointer.x:textPointer.x>rect.right?textPointer.x-rect.right:0;
      const ey=textPointer.y<rect.top?rect.top-textPointer.y:textPointer.y>rect.bottom?textPointer.y-rect.bottom:0;
      if(Math.hypot(ex,ey)>=radius)return;
      if(!group.measured)measureGlyphs([group]);
      group.glyphs.forEach(glyph=>{
        const dx=textPointer.x-rect.left-Number(glyph.dataset.baseX||0),dy=textPointer.y-rect.top-Number(glyph.dataset.baseY||0);
        const target=gentleField(dx,dy,radius,amplitude);
        if(Math.abs(target.x)+Math.abs(target.y)<.005)return;
        let state=movingGlyphs.get(glyph);
        if(!state){state={x:0,y:0,r:0,s:1,tx:0,ty:0,tr:0,ts:1,twin:group.twins?.get(glyph),element:group.element};movingGlyphs.set(glyph,state);glyph.classList.add('cursor-near');state.twin?.classList.add('cursor-near')}
        state.tx=target.x;state.ty=target.y;state.tr=target.r;state.ts=target.s;
      });
    });
    scriptRuns.forEach(el=>{
      if(el.closest('.letter-complete'))return;
      const rect=el.getBoundingClientRect();if(rect.bottom<0||rect.top>innerHeight||rect.right<0||rect.left>innerWidth)return;
      const target=gentleField(textPointer.x-rect.left-rect.width/2,textPointer.y-rect.top-rect.height/2,200,.38);
      if(Math.abs(target.x)+Math.abs(target.y)<.005)return;
      let state=movingScripts.get(el);if(!state){state={x:0,y:0,tx:0,ty:0};movingScripts.set(el,state);el.classList.add('cursor-near')}
      state.tx=target.x;state.ty=target.y;
    });
  }
  function renderReactiveText(now){
    textPointer.raf=0;
    if(motionPaused||reduced.matches||textDragging||(cursorKeyboard&&!textDemoActive)){resetReactiveText();return}
    const dt=Math.min(50,textFrameAt?now-textFrameAt:16.67);textFrameAt=now;
    if(textDirty){updateTypeTargets();textDirty=false}
    let settling=false;
    movingGlyphs.forEach((s,glyph)=>{
      if(s.element.closest('.letter-complete')){clearGlyph(glyph,s.twin);movingGlyphs.delete(glyph);return}
      s.x=dampValue(s.x,s.tx,dt,220);s.y=dampValue(s.y,s.ty,dt,220);s.r=dampValue(s.r,s.tr,dt,220);s.s=dampValue(s.s,s.ts,dt,220);
      const gap=Math.abs(s.x-s.tx)+Math.abs(s.y-s.ty)+Math.abs(s.r-s.tr)+Math.abs(s.s-s.ts)*40;
      if(gap<.004){s.x=s.tx;s.y=s.ty;s.r=s.tr;s.s=s.ts;if(!s.tx&&!s.ty&&!s.tr&&s.ts===1){clearGlyph(glyph,s.twin);movingGlyphs.delete(glyph);return}}
      else settling=true;
      paintGlyph(glyph,s.twin,s.x,s.y,s.r,s.s);
    });
    movingScripts.forEach((s,el)=>{
      if(el.closest('.letter-complete'))s.tx=s.ty=0;
      s.x=dampValue(s.x,s.tx,dt,170);s.y=dampValue(s.y,s.ty,dt,170);
      if(Math.abs(s.x-s.tx)+Math.abs(s.y-s.ty)<.004){s.x=s.tx;s.y=s.ty;if(!s.tx&&!s.ty){el.classList.remove('cursor-near');movingScripts.delete(el)}}else settling=true;
      el.style.setProperty('--letter-x',`${s.x.toFixed(3)}px`);el.style.setProperty('--letter-y',`${s.y.toFixed(3)}px`);
    });
    if(settling)textPointer.raf=requestAnimationFrame(renderReactiveText);else textFrameAt=0;
  }
  function queueReactiveText(){textDirty=true;if(!textPointer.raf)textPointer.raf=requestAnimationFrame(renderReactiveText)}
  function invalidateTypeLayout(){resetReactiveText();glyphGroups.forEach(group=>group.measured=false);queueReactiveText()}
  function stopTypeDemo(){cancelAnimationFrame(demoRaf);textDemoActive=false;textPointer.active=false;$('#typePlay').disabled=false;}
  $('#typePlay').addEventListener('click',()=>{
    if(motionPaused||reduced.matches){$('#typeStatus').textContent='Motion is off. Everything remains available to explore.';return}
    stopTypeDemo();resetReactiveText();textDemoActive=true;textDragging=false;$('#typePlay').disabled=true;
    $('#typeStatus').textContent='A little movement, one letter at a time.';
    const heading=$('.hero h2'),start=performance.now();
    const tick=now=>{if(motionPaused||reduced.matches||document.hidden){stopTypeDemo();resetReactiveText();return}
      const t=Math.min(1,(now-start)/2400),r=heading.getBoundingClientRect();
      textPointer={...textPointer,x:r.left+r.width*t,y:r.top+r.height*.24,active:t<1};queueReactiveText();
      if(t<1)demoRaf=requestAnimationFrame(tick);else{stopTypeDemo();queueReactiveText();$('#typeStatus').textContent='Your turn. Move over a headline, or try again.'}
    };demoRaf=requestAnimationFrame(tick);
  });
  document.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||textDragging||textDemoActive)return;cursorKeyboard=false;textPointer.x=e.clientX;textPointer.y=e.clientY;textPointer.active=true;queueReactiveText()},{passive:true});
  document.addEventListener('pointerout',e=>{if(!e.relatedTarget){textPointer.active=false;queueReactiveText()}},{passive:true});
  document.addEventListener('pointerdown',e=>{
    // Keep text and the native selection caret still while clicking or selecting.
    textDragging=true;textPointer.active=false;resetReactiveText();syncFeatherMode();
  },{passive:true});
  document.addEventListener('pointerup',()=>{textDragging=false},{passive:true});
  document.addEventListener('pointercancel',()=>{textDragging=false;textPointer.active=false;resetReactiveText()},{passive:true});
  document.addEventListener('selectionchange',()=>{if(!getSelection()?.isCollapsed){textPointer.active=false;resetReactiveText()}});
  document.addEventListener('scroll',queueReactiveText,{passive:true,capture:true});
  addEventListener('resize',invalidateTypeLayout,{passive:true});

  const featherCursor=$('#featherCursor'),cursorCanvas=$('#cursorDust');
  const finePointer=matchMedia('(min-width: 821px) and (hover: hover) and (pointer: fine)');
  const cursorCtx=cursorCanvas?.getContext('2d',{alpha:true});
  let cursorW=innerWidth,cursorH=innerHeight,cursorDpr=1,cursorRaf=0,cursorActive=false,cursorKeyboard=false,cursorOver=false,cursorNative=false;
  let cursorTargetX=innerWidth*.5,cursorTargetY=innerHeight*.5,cursorVX=0,cursorVY=0,cursorLastSpawnX=cursorTargetX,cursorLastSpawnY=cursorTargetY;
  let cursorAngle=0,cursorAngleTarget=0,cursorScale=1,cursorFrameAt=0,cursorMoveAt=0,cursorBend=0,cursorBendTarget=0,cursorFlutter=0;
  let cursorBits=[],cursorHoverAt=0,cursorClickAt=-10000;
  const cursorColors=['42,210,193','70,119,226','137,80,216','232,165,57'];
  function resizeCursorCanvas(){
    if(!cursorCanvas||!cursorCtx)return;
    cursorW=Math.max(1,innerWidth);cursorH=Math.max(1,innerHeight);cursorDpr=Math.min(devicePixelRatio||1,1.25);
    cursorCanvas.width=Math.round(cursorW*cursorDpr);cursorCanvas.height=Math.round(cursorH*cursorDpr);cursorCanvas.style.width=cursorW+'px';cursorCanvas.style.height=cursorH+'px';cursorCtx.setTransform(cursorDpr,0,0,cursorDpr,0,0);
  }
  function cursorEnabled(){return Boolean(featherCursor&&cursorCtx&&body.dataset.featherCursorReady&&finePointer.matches&&!reduced.matches&&!motionPaused&&!cursorKeyboard&&!cursorNative&&!textDragging&&!document.hidden&&!body.classList.contains('cinema-open')&&(!introRevealed||entered))}
  function syncFeatherMode(){
    const enabled=cursorEnabled()&&cursorActive;body.classList.toggle('feather-cursor-ready',enabled);
    if(!enabled){featherCursor?.classList.remove('cursor-visible','cursor-over','cursor-click');cursorBits=[];if(cursorCtx)cursorCtx.clearRect(0,0,cursorW,cursorH);cancelAnimationFrame(cursorRaf);cursorRaf=0;cursorFrameAt=0}
    else if(cursorActive){featherCursor.classList.add('cursor-visible');startCursorFrame()}
  }
  function addCursorBit(x,y,burst=false){
    if(cursorBits.length>28)cursorBits.splice(0,cursorBits.length-28);
    const amount=burst?3:1;
    for(let i=0;i<amount;i++){const a=burst?Math.random()*Math.PI*2:Math.atan2(-cursorVY,-cursorVX)+(Math.random()-.5)*1.2,s=burst?1.2+Math.random()*3:.25+Math.random()*.75;cursorBits.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-.15,life:1,decay:burst?.025+Math.random()*.018:.036+Math.random()*.025,r:burst?1+Math.random()*2:.6+Math.random()*1.15,color:cursorColors[(Math.random()*cursorColors.length)|0]})}
  }
  function drawCursorBits(dt){
    cursorCtx.clearRect(0,0,cursorW,cursorH);cursorCtx.save();cursorCtx.globalCompositeOperation='lighter';
    const step=dt/16.67,decay=Math.pow(.97,step);
    cursorBits=cursorBits.filter(p=>{p.life-=p.decay*step;if(p.life<=0)return false;p.x+=p.vx*step;p.y+=p.vy*step;p.vx*=decay;p.vy=p.vy*decay-.003*step;cursorCtx.beginPath();cursorCtx.arc(p.x,p.y,p.r*(.55+p.life*.55),0,Math.PI*2);cursorCtx.fillStyle=`rgba(${p.color},${p.life*.35})`;cursorCtx.fill();return true});cursorCtx.restore();
  }
  function placeFeather(){
    // Position stays at the real pointer; only feather angle has follow-through.
    featherCursor.style.transform=`translate3d(${(cursorTargetX-22).toFixed(2)}px,${(cursorTargetY-66).toFixed(2)}px,0) rotate(${cursorAngle.toFixed(2)}deg) scale(${cursorScale.toFixed(3)})`;
  }
  function cursorFrame(now){
    cursorRaf=0;if(!cursorEnabled())return;
    const dt=Math.min(50,cursorFrameAt?now-cursorFrameAt:16.67);cursorFrameAt=now;
    const time=now/1000,moving=now-cursorMoveAt<110;
    // A companion at the pointer, not an object travelling around the page.
    // Idle motion deforms the mesh around the fixed quill tip.
    const idle=Math.sin(time*1.24)*.055+Math.sin(time*.73+.6)*.024;
    const hoverAge=(now-cursorHoverAt)/1000;
    const invite=cursorOver&&hoverAge>.3?Math.pow(Math.max(0,Math.sin((hoverAge-.3)*1.45)),6):0;
    const clickAge=(now-cursorClickAt)/1000;
    const click=clickAge<.65?Math.sin(Math.min(1,clickAge/.65)*Math.PI)*Math.exp(-clickAge*2):0;
    if(!moving){cursorAngleTarget=0;cursorBendTarget=0}
    cursorAngle=dampValue(cursorAngle,cursorAngleTarget+Math.sin(time*1.24)*1.5-invite*2.8,dt,180);
    cursorScale=dampValue(cursorScale,(cursorOver?1.025:1)-click*.025,dt,140);placeFeather();
    cursorBend=dampValue(cursorBend,cursorBendTarget+idle+invite*.17-click*.24,dt,140);
    cursorFlutter=dampValue(cursorFlutter,moving?Math.min(.18,Math.hypot(cursorVX,cursorVY)*.16):.027+invite*.035,dt,380);
    dispatchEvent(new CustomEvent('vx-feather-frame',{detail:{bend:cursorBend,flutter:cursorFlutter,time,bow:invite*.45+click*.8}}));
    if(cursorActive&&Math.hypot(cursorTargetX-cursorLastSpawnX,cursorTargetY-cursorLastSpawnY)>18){addCursorBit(cursorTargetX-2,cursorTargetY+3);cursorLastSpawnX=cursorTargetX;cursorLastSpawnY=cursorTargetY}
    if(cursorBits.length)drawCursorBits(dt);
    // Keep breathing while visible; eligibility cancels all work on pause,
    // reduced motion, text selection, cinema, hidden tabs, or native-pointer use.
    if(cursorActive)cursorRaf=requestAnimationFrame(cursorFrame);else cursorFrameAt=0;
  }
  function startCursorFrame(){if(!cursorRaf&&cursorEnabled())cursorRaf=requestAnimationFrame(cursorFrame)}
  function moveFeather(e){
    if(e.pointerType==='touch')return;
    const now=performance.now(),elapsed=Math.max(8,now-cursorMoveAt);
    cursorVX=cursorActive?(e.clientX-cursorTargetX)/elapsed:0;cursorVY=cursorActive?(e.clientY-cursorTargetY)/elapsed:0;
    cursorAngleTarget=Math.max(-9,Math.min(9,cursorVX*3.2));cursorBendTarget=Math.max(-.65,Math.min(.65,-cursorVX*.5));cursorMoveAt=now;
    cursorKeyboard=false;cursorActive=true;cursorTargetX=e.clientX;cursorTargetY=e.clientY;
    const over=Boolean(e.target.closest?.('a,button,[role="button"]'));
    if(over&&!cursorOver)cursorHoverAt=now;
    cursorOver=over;
    cursorNative=Boolean(e.target.closest?.('input,textarea,select,video,audio,.ink-letter,p,blockquote'))&&!cursorOver;
    syncFeatherMode();if(!cursorEnabled())return;
    placeFeather();featherCursor.classList.add('cursor-visible');featherCursor.classList.toggle('cursor-over',cursorOver);startCursorFrame();
  }
  document.addEventListener('pointermove',moveFeather,{passive:true});
  document.addEventListener('pointerup',e=>{if(e.pointerType==='touch')return;syncFeatherMode();if(!cursorEnabled()||!getSelection()?.isCollapsed)return;cursorClickAt=performance.now();cursorTargetX=e.clientX;cursorTargetY=e.clientY;featherCursor.classList.add('cursor-visible');if(cursorOver)addCursorBit(e.clientX,e.clientY,true);startCursorFrame()},{passive:true});
  document.addEventListener('pointerout',e=>{if(!e.relatedTarget){cursorActive=false;cursorOver=false;syncFeatherMode()}},{passive:true});
  document.addEventListener('keydown',e=>{if(e.key==='Tab'){cursorKeyboard=true;textPointer.active=false;resetReactiveText();syncFeatherMode()}},{passive:true});
  addEventListener('blur',()=>{cursorActive=false;textPointer.active=false;textDragging=false;resetReactiveText();syncFeatherMode()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cursorActive=false;textPointer.active=false;resetReactiveText()}syncFeatherMode()});
  addEventListener('resize',()=>{resizeCursorCanvas();syncFeatherMode()},{passive:true});finePointer.addEventListener('change',()=>{resetReactiveText();syncFeatherMode()});resizeCursorCanvas();
  addEventListener('vx-feather-ready',syncFeatherMode);

  // The screening room gets the GPU budget; restart scenery only after it closes.
  let cinemaWasOpen=false;
  new MutationObserver(()=>{
    const open=body.classList.contains('cinema-open');if(open===cinemaWasOpen)return;
    cinemaWasOpen=open;
    if(open){stopHubDust();stopTypeDemo();resetReactiveText()}else startHubDust();
    syncFeatherMode();
  }).observe(body,{attributes:true,attributeFilter:['class']});

  prepareReactiveType();
  body.dataset.reactiveReady='true';
  // A review/deep link opens the actual section, not an invisible page behind the intro.
  let cancelSectionLanding = () => {};
  function followSectionLink() {
    cancelSectionLanding();
    const id = location.hash.slice(1);
    if (!['about','films','music','process','dream-title','belief-title'].includes(id)) return;
    enterPortfolio();
    let cancelled = false;
    const userEvents = ['wheel','touchstart','pointerdown','keydown'];
    const cancelLanding = () => {
      cancelled = true;
      userEvents.forEach(name => removeEventListener(name, cancelLanding));
    };
    cancelSectionLanding = cancelLanding;
    userEvents.forEach(name => addEventListener(name, cancelLanding, {passive:true}));
    const land = () => {
      if (cancelled || location.hash.slice(1) !== id || !entered) return;
      const target=document.getElementById(id), section=target?.closest('.section')||target;
      if (!section) return;
      const inset=document.querySelector('.nav').getBoundingClientRect().height+20;
      scrollTo({top:Math.max(0,section.getBoundingClientRect().top+scrollY-inset),behavior:'instant'});
    };
    requestAnimationFrame(() => requestAnimationFrame(land));
    // Fragment restoration, entry focus and web fonts can each finish after layout.
    // Never pull the page back after a user has started interacting with it.
    setTimeout(land, 340);
    document.fonts?.ready.then(() => requestAnimationFrame(() => requestAnimationFrame(land)));
    if (document.readyState !== 'complete') addEventListener('load',() => requestAnimationFrame(() => requestAnimationFrame(land)),{once:true});
    setTimeout(cancelLanding, 3000);
  }
  followSectionLink();
  addEventListener('hashchange', followSectionLink);
})();
