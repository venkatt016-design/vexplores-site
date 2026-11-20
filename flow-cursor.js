/* A small procedural feather: the quill anchors to the actual pointer.
   Only the vane flexes and trails. No original artwork or media is altered. */
(() => {
  const canvas=document.querySelector('#featherModel');
  const ctx=canvas?.getContext('2d',{alpha:true});
  if(!ctx)return;
  const ratio=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(36*ratio);canvas.height=Math.round(64*ratio);
  ctx.setTransform(ratio,0,0,ratio,0,0);
  function center(u,bend,flutter,time){
    return {x:14+5*u+bend*17*u*u+Math.sin(time*11-u*5)*flutter*7*u*u,y:58-54*u};
  }
  function width(u){return 8.2*Math.pow(Math.max(0,Math.sin(Math.PI*u)),.78)*Math.min(1,u*3.8)}
  function draw(bend=0,flutter=0,time=0){
    ctx.clearRect(0,0,36,64);
    const g=ctx.createLinearGradient(8,4,26,55);g.addColorStop(0,'#538b72');g.addColorStop(.35,'#3e7970');g.addColorStop(.7,'#92a47c');g.addColorStop(1,'#ac9460');
    ctx.beginPath();
    for(let i=3;i<=48;i++){const u=i/48,p=center(u,bend,flutter,time);const x=p.x-width(u);if(i===3)ctx.moveTo(x,p.y);else ctx.lineTo(x,p.y)}
    for(let i=48;i>=3;i--){const u=i/48,p=center(u,bend,flutter,time);ctx.lineTo(p.x+width(u)*.92,p.y+1.3*Math.sin(Math.PI*u))}
    ctx.closePath();ctx.globalAlpha=.64;ctx.fillStyle=g;ctx.fill();ctx.globalAlpha=1;
    // Fine barbs lead the shaft slightly; the ends follow with delayed flutter.
    for(let i=5;i<48;i++){
      const u=i/48,p=center(u,bend,flutter,time),w=width(u),lag=Math.sin(time*12-u*7)*flutter*4;
      for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(p.x,p.y+2.4);ctx.bezierCurveTo(p.x+side*w*.4,p.y+1.7,p.x+side*w*.85,p.y-1.8+lag,p.x+side*w,p.y-3.1+lag);ctx.strokeStyle=i%3===0?'#a79760':'#39716b';ctx.globalAlpha=.5;ctx.lineWidth=.38;ctx.stroke()}
    }
    ctx.globalAlpha=1;ctx.beginPath();ctx.moveTo(14,58);
    for(let i=1;i<=48;i++){const p=center(i/48,bend,flutter,time);ctx.lineTo(p.x,p.y)}
    ctx.strokeStyle='#a78d5b';ctx.lineWidth=.65;ctx.stroke();
    const eye=center(.76,bend,flutter,time),slope=(5+bend*34*.76)/54;
    ctx.save();ctx.translate(eye.x,eye.y);ctx.rotate(Math.atan(slope));
    for(const [rx,ry,color] of [[5.0,7.1,'#a38d54'],[4.0,5.8,'#358d91'],[2.8,4.1,'#235d72'],[1.6,2.6,'#244151']]){ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()}
    ctx.restore();
    canvas.dataset.bend=bend.toFixed(4);canvas.dataset.flutter=flutter.toFixed(4);
  }
  addEventListener('vx-feather-frame',e=>draw(e.detail.bend,e.detail.flutter,e.detail.time));
  new MutationObserver(()=>{if(document.body.classList.contains('paused')||document.body.classList.contains('cinema-open'))draw()}).observe(document.body,{attributes:true,attributeFilter:['class']});
  draw();canvas.dataset.engine='Canvas2D flowing ink';canvas.dataset.model='small-flexible-peacock-feather';canvas.dataset.orientation='eye-up-tip-down';canvas.dataset.tip='14,58';
  document.body.dataset.featherCursorReady='true';dispatchEvent(new Event('vx-feather-ready'));
})();
