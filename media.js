import {catalog} from './media-catalog.js?v=final05';
import {playable,embedURL} from './media-player.js?v=final04';
const dialog=document.getElementById('cinema'),player=document.getElementById('cinemaPlayer');
let opener;
function clearPlayer(){player.querySelectorAll('video,audio').forEach(m=>{m.pause();m.removeAttribute('src');m.load()});player.replaceChildren()}
function openMedia(id,trigger){
  const item=catalog.find(item=>item.id===id);if(!playable(item))return;
  document.querySelectorAll('video,audio').forEach(m=>m.pause());
  clearPlayer();opener=trigger;
  document.getElementById('cinemaTitle').textContent=item.title;
  document.getElementById('cinemaNote').textContent=item.note;
  if(item.kind==='local'){
    const video=document.createElement('video');video.controls=true;video.playsInline=true;video.preload='metadata';video.src=item.src;video.poster=item.poster;video.setAttribute('aria-label',item.title);player.append(video);
    video.addEventListener('error',()=>{document.getElementById('cinemaNote').textContent='This video could not load. Please close and try again; the direct title-sequence link is also available.'});
  }else{
    const iframe=document.createElement('iframe');iframe.src=embedURL(item.url);iframe.title=item.title;iframe.allow='encrypted-media; fullscreen; picture-in-picture';iframe.allowFullscreen=true;iframe.referrerPolicy='strict-origin-when-cross-origin';player.append(iframe);
    const link=document.createElement('a');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open on YouTube ↗';link.className='text-link';player.append(link);
  }
  document.body.classList.add('cinema-open');dialog.showModal();document.getElementById('closeCinema').focus();
}
document.addEventListener('click',e=>{const trigger=e.target.closest('[data-media]');if(trigger)openMedia(trigger.dataset.media,trigger)});
document.getElementById('closeCinema').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{clearPlayer();document.body.classList.remove('cinema-open');opener?.focus({preventScroll:true})});
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
document.addEventListener('play',e=>{if(dialog.open&&!dialog.contains(e.target))dialog.close()},true);
const grid=document.getElementById('confirmedVideos');
catalog.filter(item=>item.kind==='youtube'&&playable(item)).forEach(item=>{
  const button=document.createElement('button');button.type='button';button.dataset.media=item.id;
  const img=document.createElement('img');img.src=item.poster;img.alt='';img.loading='lazy';
  const text=document.createElement('span');text.textContent=item.title;
  const hint=document.createElement('small');hint.textContent='Watch the final film ↗';text.append(hint);
  button.append(img,text);grid.append(button);
});
grid.hidden=grid.children.length===0;
