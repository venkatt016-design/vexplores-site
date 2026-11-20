/** Short authored quote reveals; readable text rests between interactions. */
const body=document.body;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const variants={daybreak:'editorial',bike:'signature',flow:'editorial',car:'kinetic',sky:'aerial',hike:'signature',raft:'kinetic',bungee:'editorial',ski:'kinetic',paddle:'signature',dance:'kinetic',sing:'lyrical',jetski:'bold',f1:'kinetic',campfire:'signature',starlight:'lyrical',aurora:'flourish'};
const accentWords={daybreak:/^light[.!]?$/i,flow:/^flow[.!]?$/i,sky:/^beyond$/i,raft:/^together[.!]?$/i,bungee:/^leap[.!]?$/i,dance:/^feeling[.!]?$/i,sing:/^sing[.!]?$/i,starlight:/^wonder[.!]?$/i};
const items=[];
function permitted(){return body.classList.contains('entered')&&!body.classList.contains('paused')&&!body.classList.contains('cinema-open')&&!document.hidden&&!reduce.matches;}
function settle(item){item.animations.forEach(a=>a.cancel());item.animations=[];item.quote.dataset.quoteState='rest';}
function play(item,entrance=false){
 if(!permitted()||!item.visible)return;
 if(!entrance&&performance.now()-item.last<1600)return;
 settle(item);item.last=performance.now();item.quote.dataset.quoteState='revealing';
 item.words.forEach((word,i)=>{
  const frames=entrance?[
   {transform:'translateY(7px) rotate(-1deg)',opacity:1},
   {transform:'translateY(-1px) rotate(.3deg)',opacity:1,offset:.78},
   {transform:'none',opacity:1}
  ]:[
   {transform:'none'},
   {transform:'translateY(-4px) rotate(-1deg)',offset:.42},
   {transform:'none'}
  ];
  // Stagger movement, never the visibility of the words.
  item.animations.push(word.animate(frames,{duration:entrance?760:620,delay:Math.min(i,12)*(entrance?32:25),easing:'cubic-bezier(.22,1,.36,1)',fill:'none'}));
 });
 item.animations.push(item.stroke.animate([
  {transform:'scaleX(.03)',opacity:.1},
  {transform:'scaleX(1)',opacity:.7,offset:.85},
  {transform:'scaleX(1)',opacity:.4}
 ],{duration:1100,easing:'cubic-bezier(.22,1,.36,1)'}));
 const active=item.animations.slice();
 Promise.allSettled(active.map(a=>a.finished)).then(()=>{if(item.animations[0]===active[0])settle(item);});
}
for(const quote of document.querySelectorAll('[data-light] .light-copy h2,.living-pair figcaption>span')){
 const region=quote.closest('[data-light],figure');
 if(!region)continue;
 const id=region.dataset.light||region.querySelector('[data-scene]')?.dataset.scene;
 quote.classList.add('motion-quote');quote.dataset.quoteStyle=variants[id]||'editorial';
 const visual=document.createElement('span');visual.className='quote-visual';visual.setAttribute('aria-hidden','true');
 while(quote.firstChild)visual.append(quote.firstChild);
 const accessible=document.createElement('span');accessible.className='quote-accessible';
 const readable=visual.cloneNode(true);readable.querySelectorAll('br').forEach(br=>br.replaceWith(' '));accessible.textContent=readable.textContent;
 const walk=document.createTreeWalker(visual,NodeFilter.SHOW_TEXT),nodes=[];while(walk.nextNode())nodes.push(walk.currentNode);
 for(const node of nodes){const fragment=document.createDocumentFragment();for(const part of node.textContent.split(/(\s+)/)){if(!part)continue;if(/^\s+$/.test(part))fragment.append(document.createTextNode(part));else{const word=document.createElement('span');word.className='quote-word';word.textContent=part;fragment.append(word);}}node.replaceWith(fragment);}
 const stroke=document.createElement('i');stroke.className='quote-stroke';stroke.setAttribute('aria-hidden','true');
 for(const word of visual.querySelectorAll('.quote-word'))if(accentWords[id]?.test(word.textContent))word.classList.add('quote-accent');
 quote.append(accessible,visual,stroke);
 const item={quote,region,words:[...visual.querySelectorAll('.quote-word')],stroke,animations:[],visible:false,seen:false,last:-Infinity};items.push(item);
 region.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')play(item);});
 region.addEventListener('focusin',()=>play(item));
 region.addEventListener('click',()=>play(item));
}
function sync(){for(const item of items){if(!permitted()||!item.visible)settle(item);else if(!item.seen){item.seen=true;play(item,true);}}}
const observer=new IntersectionObserver(entries=>{for(const entry of entries){const item=items.find(i=>i.quote===entry.target);item.visible=entry.isIntersecting;}sync();},{threshold:.35});
items.forEach(item=>observer.observe(item.quote));
new MutationObserver(sync).observe(body,{attributes:true,attributeFilter:['class']});
reduce.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
addEventListener('pagehide',()=>items.forEach(settle));
