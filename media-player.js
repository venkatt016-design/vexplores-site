export function youtubeId(value){
  if(typeof value!=='string'||!value.trim())return null;
  try{
    const u=new URL(value);
    if(u.protocol!=='https:'||u.username||u.password||u.port)return null;
    let id;
    if(u.hostname==='youtu.be'&&u.pathname.split('/').filter(Boolean).length===1)id=u.pathname.slice(1);
    else if(['youtube.com','www.youtube.com','m.youtube.com'].includes(u.hostname)){
      if(u.pathname==='/watch')id=u.searchParams.get('v');
      else if(/^\/(shorts|embed)\/[^/]+\/?$/.test(u.pathname))id=u.pathname.split('/')[2];
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id||'')?id:null;
  }catch{return null}
}
export function playable(item){return item?.kind==='local'?item.approval==='approved-title-preview'&&item.src==='assets/title-sequence.mp4':item?.kind==='youtube'&&['approved-public','verified-existing-public'].includes(item.approval)&&Boolean(youtubeId(item.url))}
export function embedURL(url){const id=youtubeId(url);return id?`https://www.youtube-nocookie.com/embed/${id}?autoplay=0&rel=0`:null}
