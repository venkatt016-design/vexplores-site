/** Real video loops, alpha composited into white space. No audio and no remote media. */
const body = document.body;
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const savesData = navigator.connection?.saveData === true;
const contextHolders = new Set();
const messages = {
  daybreak: ['A fresh start can be a small one.', 'Carry a little sunshine with you.'],
  wonder: ['A little wonder goes a long way.', 'Your next idea might start with play.'],
  flow: ['Breathe. You can take your time.', 'Enjoy this part of the journey, too.'],
  bike: ['Keep going. Make the journey your own.', 'A little courage can set things in motion.'],
  sky: ['A new perspective can change everything.', 'Carry that feeling into the everyday.'],
  car: ['Take the scenic thought. See where it leads.', 'Make room for a little adventure.'],
  hike:['One good step can open a new view.','Keep a little curiosity in your pocket.'],
  raft:['Find your rhythm, together.','Good company makes a brave journey lighter.'],
  bungee:['A little courage. A whole new perspective.','Take a breath. Trust your preparation.'],
  ski:['Let the rhythm carry you.','Find joy in your own kind of flow.'],
  jetski:['A little spray. A lot of joy.','Make room for a playful moment.'],
  paddle:['Balance. Breathe. Begin again.','There is room to take your time.'],
  f1:['Find your line. Enjoy the drive.','Let curiosity take the next turn.'],
  dance:['Your rhythm belongs to you.','Let a little joy move through you.'],
  sing:['Give your good energy a voice.','A small melody can brighten a day.'],
  campfire:['Good company. Lasting memories.','Leave room for one more song.'],
  starlight:['Look up. There is more to wonder.','A quiet moment can hold a whole universe.'],
  aurora:['Let wonder find you.','Some colours are worth slowing down for.']
};
const vertex = `attribute vec2 a; varying vec2 uv; void main(){uv=(a+1.)*.5;gl_Position=vec4(a,0.,1.);}`;
const fragment = `precision highp float;
 varying vec2 uv; uniform sampler2D picture; uniform vec2 pointer;
 uniform float mode, activity, pulse, age, aspect;
 float sat(float v){return clamp(v,0.,1.);}
 void main(){
   vec2 p=uv; vec2 d=p-pointer; float dist=length(d*vec2(aspect,1.));
   float wave=sin(dist*23.-age*4.)*exp(-dist*5.)*pulse*.006;
   p+=d*(wave+activity*.004*exp(-dist*6.));
   vec3 c=texture2D(picture,clamp(p,.002,.998)).rgb;
   float rim=1.-smoothstep(.52,.98,length((uv-.5)*vec2(1.94,2.15)));
   if(mode>5.5)rim=1.-smoothstep(.90,1.,max(abs(uv.x-.5),abs(uv.y-.5))*2.);
   float lum=dot(c,vec3(.2126,.7152,.0722)); float alpha=rim;
   if(mode>4.5){
     // Continuous white matting: preserve pale water and specular detail at the door.
     // The former smoothstep key erased these values as they crossed a threshold.
     c=clamp(c/(mode>5.5?vec3(.985,.985,.98):vec3(.96,.945,.925)),0.,1.);
     float coverage=1.-min(c.r,min(c.g,c.b));
     alpha*=coverage;
     c=coverage>.0001?clamp((c-vec3(1.-coverage))/coverage,0.,1.):vec3(1.);
   }else if(mode>2.5 && mode<3.5){
     // Actual final-ending colours; isolate the subject from the pale paper ground.
     float ink=1.-min(c.r,min(c.g,c.b));
     float chroma=max(c.r,max(c.g,c.b))-min(c.r,min(c.g,c.b));
     alpha*=max(smoothstep(.17,.36,ink),smoothstep(.11,.32,chroma)*.88);
   }else if(mode>3.5){
     // Lift the generated grey paper; keep its coloured washes and the performer.
     float ink=1.-min(c.r,min(c.g,c.b));
     float chroma=max(c.r,max(c.g,c.b))-min(c.r,min(c.g,c.b));
     alpha*=max(smoothstep(.22,.40,ink),smoothstep(.04,.14,chroma));
     // A light ink-and-wash finish on the moving Artlist source.
     vec2 px=vec2(1./768.,1./432.);
     vec3 dx=texture2D(picture,p+vec2(px.x,0.)).rgb-texture2D(picture,p-vec2(px.x,0.)).rgb;
     vec3 dy=texture2D(picture,p+vec2(0.,px.y)).rgb-texture2D(picture,p-vec2(0.,px.y)).rgb;
     float edge=length(dx)+length(dy);
     c=mix(c,floor(c*9.+.5)/9.,.30);
     c=mix(c,vec3(.09,.25,.28),smoothstep(.12,.48,edge)*.32);
   }else if(mode>.5 && mode<1.5){
     // The end-card's black becomes true transparent pixels, not a dark rectangle.
     float key=max(c.r,max(c.g,c.b)); alpha*=smoothstep(.12,.68,key)*.78;
     c=mix(vec3(.54,.35,.13),vec3(.80,.62,.28),smoothstep(.12,.65,lum));
   }else if(mode<.5){
     // Retain warm cloud depth while letting the blue sky fall into the white ground.
     alpha*=smoothstep(-.12,.09,max(c.r,c.g)-c.b)*smoothstep(.07,.5,lum);
     c=mix(c,vec3(.92,.80,.65),.08);
   }else{
     // The river reflection is the focal point; the corners gently dissolve away.
     float column=1.-smoothstep(.12,.42,abs(uv.x-.5));
     alpha*=column*smoothstep(.08,.6,lum)*.9; c=mix(c,vec3(.94,.85,.67),.14);
   }
   float glow=exp(-dist*dist*22.)*(activity*.12+pulse*.14);
   c=mix(c,vec3(.96,.78,.38),glow);
   gl_FragColor=vec4(c,alpha);
 }`;

export class LightMoment {
  constructor(el) {
    this.el=el; this.id=el.dataset.light; this.button=el.querySelector('.light-art');
    this.canvas=el.querySelector('canvas');this.poster=el.querySelector('img');
    this.status=el.querySelector('[role="status"]'); this.visible=false; this.frames=0;
    this.raf=0;this.last=0;this.lastDraw=0;this.clock=0;this.pulse=0;this.activity=0;
    this.target={x:.5,y:.5,hot:0};this.pose={x:.5,y:.5,hot:0};this.count=0;
    this.video=document.createElement('video');
    const rate=this.id==='wonder'?.5:1;
    Object.assign(this.video,{muted:true,defaultMuted:true,loop:true,playsInline:true,preload:'none',playbackRate:rate,defaultPlaybackRate:rate});
    this.textureDirty=true;this.videoFrame=0;this.uploadSource=null;
    this.video.setAttribute('playsinline','');this.video.setAttribute('muted','');
    this.video.addEventListener('loadeddata',()=>{this.sync();this.draw();});
    this.video.addEventListener('error',()=>{this.videoFailed=true;this.sync();});
    this.poster.addEventListener('load',()=>this.draw());
    this.bindCanvas();
    this.button.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')this.target.hot=1;});
    this.button.addEventListener('pointermove',e=>{
      if(!this.moving()||e.pointerType==='touch')return;
      const b=this.button.getBoundingClientRect();
      this.target.x=Math.max(.05,Math.min(.95,(e.clientX-b.left)/b.width));
      this.target.y=1-Math.max(.05,Math.min(.95,(e.clientY-b.top)/b.height));
    },{passive:true});
    this.button.addEventListener('pointerleave',()=>{this.target={x:.5,y:.5,hot:0};});
    this.button.addEventListener('focus',()=>{this.target.hot=1;});
    this.button.addEventListener('blur',()=>{this.target.hot=0;});
    this.button.addEventListener('click',()=>{
      this.status.textContent=messages[this.id][this.count++%messages[this.id].length];
      if(this.autoplayBlocked){this.autoplayBlocked=false;this.sync();}
      if(!this.moving())return;
      // A soft local bloom, separate from the bounded quote animation.
      this.pulse=1;this.clock=0;this.sync();
    });
    this.resizeObserver=new ResizeObserver(()=>{if(this.visible){this.resize();this.draw();}});
    this.resizeObserver.observe(this.button);
  }
  available(){return this.visible&&!document.hidden&&body.classList.contains('entered')&&!body.classList.contains('cinema-open');}
  moving(){return this.available()&&!preference.matches&&!body.classList.contains('paused')&&!savesData&&!this.lost&&!this.videoFailed&&!this.autoplayBlocked;}
  bindCanvas(){
    const canvas=this.canvas;
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(canvas!==this.canvas)return;contextHolders.delete(this);this.lost=true;this.stop();this.el.dataset.ready='false';});
    canvas.addEventListener('webglcontextrestored',()=>{if(canvas!==this.canvas)return;this.lost=false;this.gl=null;this.resources=null;this.sync();});
  }
  release(){
    this.stop();const gl=this.gl,resources=this.resources;this.gl=null;this.resources=null;contextHolders.delete(this);
    // A new canvas avoids restoring a deliberately released, offscreen context.
    const next=this.canvas.cloneNode(false);this.canvas.replaceWith(next);this.canvas=next;this.bindCanvas();this.el.dataset.ready='false';
    this.uploadSource=null;this.textureDirty=true;
    if(gl){if(resources){gl.deleteTexture(resources.texture);gl.deleteBuffer(resources.buffer);gl.deleteProgram(resources.program);}gl.getExtension('WEBGL_lose_context')?.loseContext();}
  }
  initialize(){
    if(this.gl||this.failed||this.lost)return;
    if(contextHolders.size>=5)for(const other of [...contextHolders]){if(!other.available())other.release();if(contextHolders.size<5)break;}
    if(contextHolders.size>=5)return;
    const gl=this.canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false,depth:false,stencil:false,powerPreference:'low-power'});
    if(!gl){this.failed=true;return;}
    try {
      const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
      const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
      const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
      gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const attribute=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);
      const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      this.uniforms=Object.fromEntries(['pointer','mode','activity','pulse','age','aspect'].map(n=>[n,gl.getUniformLocation(program,n)]));
      this.gl=gl;this.resources={texture,buffer,program};contextHolders.add(this);this.uploadSource=null;this.textureDirty=true;this.resize();
    } catch(error) {this.failed=true;this.video.pause();console.warn('Light moment static fallback:',this.id,error.message);}
  }
  resize(){
    const box=this.button.getBoundingClientRect();const dpr=Math.min(devicePixelRatio||1,1.35);
    const w=Math.max(1,Math.round(box.width*dpr)),h=Math.max(1,Math.round(box.height*dpr));
    if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
  }
  draw(){
    if(!this.gl||this.lost||!this.available())return;
    const source=this.video.readyState>=2?this.video:this.poster;
    if(source===this.poster&&!this.poster.naturalWidth)return;
    const gl=this.gl,u=this.uniforms;
    try {
      gl.viewport(0,0,this.canvas.width,this.canvas.height);
      if(this.uploadSource!==source||this.textureDirty||!this.video.requestVideoFrameCallback){
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,source);
        this.textureDirty=false;this.uploadSource=source;
      }
      gl.uniform2f(u.pointer,this.pose.x,this.pose.y);
      gl.uniform1f(u.mode,this.el.dataset.matte==='painted'?6:({daybreak:0,wonder:1,flow:2,bike:3,sky:4,car:5})[this.id]??6);
      gl.uniform1f(u.activity,this.pose.hot);gl.uniform1f(u.pulse,this.pulse);gl.uniform1f(u.age,this.clock);
      gl.uniform1f(u.aspect,this.canvas.width/this.canvas.height);
      gl.drawArrays(gl.TRIANGLES,0,6);this.frames++;this.el.dataset.ready='true';
    } catch(error){this.failed=true;this.stop();this.el.dataset.ready='false';console.warn('Light moment fallback:',this.id,error.message);}
  }
  watchFrames(){
    if(this.videoFrame||!this.video.requestVideoFrameCallback||!this.moving())return;
    this.videoFrame=this.video.requestVideoFrameCallback(()=>{
      this.videoFrame=0;this.textureDirty=true;this.watchFrames();
    });
  }
  stop(){cancelAnimationFrame(this.raf);this.raf=0;this.last=0;this.video.pause();if(this.videoFrame)this.video.cancelVideoFrameCallback(this.videoFrame);this.videoFrame=0;}
  sync(){
    if(this.available()){this.initialize();this.draw();}
    const moving=this.moving()&&!this.failed;
    this.el.dataset.motion=moving?'playing':'still';
    if(!moving){this.stop();this.pose={x:.5,y:.5,hot:0};this.pulse=0;this.button.style.setProperty('--light-x','0px');this.button.style.setProperty('--light-y','0px');this.draw();return;}
    if(!this.video.src){this.video.src=`assets/light-loops/${this.id}.mp4?v=hero04`;this.video.load();}
    if(this.video.paused&&!this.playPending){
      this.playPending=true;
      this.video.play().catch(()=>{this.autoplayBlocked=true;this.el.dataset.motion='still';this.stop();}).finally(()=>{this.playPending=false;if(!this.moving())this.video.pause();});
    }
    this.watchFrames();
    if(!this.raf)this.raf=requestAnimationFrame(t=>this.frame(t));
  }
  frame(now){
    this.raf=0;if(!this.moving()||this.failed){this.stop();return;}
    // Pointer physics follow display refresh; upload a texture only on a decoded frame.
    {
      const dt=this.last?Math.min((now-this.last)/1000,.1):1/60;this.last=now;this.clock+=dt;
      const blend=1-Math.exp(-7*dt);
      for(const k of ['x','y','hot'])this.pose[k]+=(this.target[k]-this.pose[k])*blend;
      this.pulse*=Math.exp(-1.65*dt);
      this.button.style.setProperty('--light-x',`${((this.pose.x-.5)*9).toFixed(2)}px`);
      this.button.style.setProperty('--light-y',`${((.5-this.pose.y)*7).toFixed(2)}px`);
      this.draw();
    }
    this.raf=requestAnimationFrame(t=>this.frame(t));
  }
  snapshot(){return {id:this.id,visible:this.visible,ready:this.el.dataset.ready==='true',motion:this.el.dataset.motion,frames:this.frames,scheduled:!!this.raf,videoPaused:this.video.paused,time:this.video.currentTime,duration:this.video.duration,videoError:this.video.error?.code??null,contexts:contextHolders.size,pose:{...this.pose},pulse:this.pulse,bytesSource:this.video.currentSrc};}
}
export const moments=[...document.querySelectorAll('[data-light]')].map(el=>new LightMoment(el));
const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){const m=moments.find(m=>m.el===entry.target);m.visible=entry.isIntersecting;}
  moments.forEach(m=>m.sync());
},{threshold:0.08});
moments.forEach(m=>observer.observe(m.el));
const sync=()=>moments.forEach(m=>m.sync());
if(body)new MutationObserver(sync).observe(body,{attributes:true,attributeFilter:['class']});
preference.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
addEventListener('pagehide',()=>moments.forEach(m=>m.stop()));addEventListener('pageshow',sync);
// document.title is set in index.html (V EXPLORES · Venkat’s Creative Hub).
