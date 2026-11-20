import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';

// One shared transparent renderer, one model download, only visible scenes tick.
// The performer is a licensed illustration, never a claim to be Venkat's likeness.
const body=document.body, reduced=matchMedia('(prefers-reduced-motion: reduce)');
const slots=[...document.querySelectorAll('.living-scene[data-scene]')];
const words={hike:'ONWARD',raft:'TOGETHER',sky:'FREE',bungee:'LEAP',ski:'FLOW',paddle:'BALANCE',dance:'JOY',sing:'VOICE'};
const views=[];let renderer,canvas,model,loading=false,failed=false,lost=false,raf=0,last=0,frames=0;
let pointer={x:0,y:0};
slots.forEach(el=>{el.setAttribute('aria-hidden','true');el.removeAttribute('role');el.removeAttribute('aria-label');el.dataset.word=words[el.dataset.scene];el.replaceChildren();});
const moving=()=>!reduced.matches&&!body.classList.contains('paused')&&!document.hidden&&!body.classList.contains('before-entry')&&!body.classList.contains('cinema-open');
const available=()=>!document.hidden&&!body.classList.contains('before-entry')&&!body.classList.contains('cinema-open');
const visible=el=>{const b=el.getBoundingClientRect();return b.height>0&&b.bottom>0&&b.top<innerHeight&&b.right>0&&b.left<innerWidth;};
const material=(color,roughness=.65)=>new THREE.MeshStandardMaterial({color,roughness});
const teal=material(0x206f66),gold=material(0xc8a369),dark=material(0x19322f),cream=material(0xf2ece0);
const _a=new THREE.Vector3(),_b=new THREE.Vector3(),_mid=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
function mesh(geometry,mat,parent,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);parent.add(m);return m;}
function segment(m,a,b){m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(up,_mid.copy(b).sub(a).normalize());m.scale.y=a.distanceTo(b);}
function bone(actor,name){let found;actor.traverse(n=>{if(n.isBone&&n.name.replace(/[^a-z0-9]/gi,'').toLowerCase()===name.replace(/[^a-z0-9]/gi,'').toLowerCase())found=n;});return found;}
function board(parent){const b=mesh(new THREE.SphereGeometry(1,32,12),cream,parent,0,.025,0);b.scale.set(.3,.055,1.12);const stripe=mesh(new THREE.BoxGeometry(.06,.012,1.7),teal,parent,0,.08,0);return b;}
function makeView(el){
  const kind=el.dataset.scene,scene=new THREE.Scene(),pivot=new THREE.Group();scene.add(pivot);
  const actor=clone(model.scene);pivot.add(actor);
  actor.traverse(n=>{if(n.isMesh){n.frustumCulled=false;n.castShadow=false;n.receiveShadow=false;}});
  const mix=new THREE.AnimationMixer(actor),clip=model.animations.find(c=>c.name===(kind==='hike'?'walk':kind)||c.name.endsWith('_'+(kind==='hike'?'walk':kind)));
  if(!clip)throw new Error(`Missing authored clip: ${kind}`);
  mix.clipAction(clip).play();mix.setTime(.25);
  scene.add(new THREE.HemisphereLight(0xfff7ee,0x6b8d88,2.3));
  const key=new THREE.DirectionalLight(0xfff0d9,3);key.position.set(-3,4,5);scene.add(key);
  const rim=new THREE.DirectionalLight(0xc2eaff,1.8);rim.position.set(3,2,-2);scene.add(rim);
  const camera=new THREE.PerspectiveCamera(32,1,.1,30);camera.position.set(2.7,1.9,5.6);camera.lookAt(0,.95,0);
  const v={el,kind,scene,pivot,actor,mix,camera,time:.25,rendered:0,props:new THREE.Group(),left:bone(actor,'DEF-Wrist.L'),right:bone(actor,'DEF-Wrist.R'),foot:bone(actor,'DEF-Foot.L'),tilt:0};pivot.add(v.props);
  if(kind==='hike'){
    pivot.rotation.y=-.45;
    const pack=mesh(new THREE.BoxGeometry(.32,.43,.17),teal,v.props,0,1.18,-.19);pack.geometry.computeVertexNormals();
    const strap=mesh(new THREE.TorusGeometry(.19,.018,8,24),dark,v.props,0,1.25,-.18);strap.scale.y=1.2;
    v.pole=mesh(new THREE.CylinderGeometry(.012,.009,1,8),gold,v.props);
  }else if(kind==='paddle'||kind==='raft'){
    if(kind==='paddle')board(v.props);
    else{const ring=mesh(new THREE.TorusGeometry(.65,.14,12,40),teal,v.props,0,.26,0);ring.rotation.x=Math.PI/2;ring.scale.y=1.45;mesh(new THREE.BoxGeometry(.85,.08,.85),cream,v.props,0,.16,0);pivot.position.y=-.18;}
    v.shaft=mesh(new THREE.CylinderGeometry(.015,.015,1,10),dark,v.props);
    v.blade=mesh(new THREE.SphereGeometry(1,16,8),teal,v.props);v.blade.scale.set(.10,.22,.02);
  }else if(kind==='ski'){
    for(const x of [-.16,.16]){const ski=mesh(new THREE.BoxGeometry(.13,.04,1.45),cream,v.props,x,.035,0);ski.rotation.x=-.025;}
    v.handle=mesh(new THREE.CylinderGeometry(.018,.018,.32,10),dark,v.props);v.handle.rotation.z=Math.PI/2;
    v.rope=mesh(new THREE.CylinderGeometry(.007,.007,1,6),gold,v.props);
    pivot.rotation.y=-.55;
  }else if(kind==='sky'){
    // A belly-to-earth freefall pose, not a still image moving across the page.
    pivot.rotation.set(.85,0,-.65);pivot.position.set(-.3,.65,0);
    const pack=mesh(new THREE.BoxGeometry(.33,.42,.15),teal,v.props,0,1.15,-.18);
    camera.position.set(1.5,2.1,5.6);camera.lookAt(.15,1.2,0);
  }else if(kind==='bungee'){
    pivot.rotation.z=Math.PI; pivot.position.y=2.18;camera.lookAt(0,1.05,0);
    const points=[new THREE.Vector3(0,1.65,0),new THREE.Vector3(.15,1.85,0),new THREE.Vector3(.15,2.2,0),new THREE.Vector3(.03,2.6,0)];
    v.tether=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0xb0926d}));scene.add(v.tether);
  }else if(kind==='sing'){
    v.mic=new THREE.Group();v.props.add(v.mic);
    mesh(new THREE.CylinderGeometry(.025,.02,.17,12),dark,v.mic,0,.08,0);mesh(new THREE.SphereGeometry(.045,16,12),material(0x74857c,.4),v.mic,0,.19,0);
  }
  const rings=new THREE.Group();scene.add(rings);v.rings=rings;
  if(['ski','paddle','raft'].includes(kind))for(let i=0;i<3;i++){const ring=mesh(new THREE.TorusGeometry(.75+i*.2,.004,4,48),material(0xa9d1c8),rings);ring.rotation.x=Math.PI/2;ring.scale.set(1,1.8,1);ring.position.y=-.02;}
  return v;
}
function poseProps(v){
  v.actor.updateMatrixWorld(true);
  if(v.left&&v.right){
    v.pivot.worldToLocal(v.left.getWorldPosition(_a));v.pivot.worldToLocal(v.right.getWorldPosition(_b));
    if(v.shaft){const axis=_a.clone().sub(_b).normalize(),top=_b.clone().addScaledVector(axis,-.16),bottom=_a.clone().addScaledVector(axis,.8);segment(v.shaft,top,bottom);v.blade.position.copy(bottom);v.blade.quaternion.copy(v.shaft.quaternion);}
    if(v.mic){v.mic.position.copy(_b);v.mic.rotation.z=-.12;}
    if(v.handle){v.handle.position.copy(_a).add(_b).multiplyScalar(.5);const end=v.handle.position.clone().add(new THREE.Vector3(0,.05,2));segment(v.rope,v.handle.position,end);}
    if(v.pole){const bottom=_b.clone();bottom.y=.025;bottom.z+=.15;segment(v.pole,_b,bottom);}
  }
  if(v.tether&&v.foot){v.foot.getWorldPosition(_a);const p=v.tether.geometry.attributes.position;p.setXYZ(0,_a.x,_a.y,_a.z);p.setXYZ(1,_a.x+.08,_a.y+.25,_a.z);p.needsUpdate=true;}
}
async function init(){
  if(loading||renderer||failed)return;loading=true;
  try{
    model=await new GLTFLoader().loadAsync('./assets/snow-performer.glb');
    canvas=document.createElement('canvas');canvas.id='activitiesCanvas';canvas.setAttribute('aria-hidden','true');document.querySelector('.site-shell').append(canvas);
    renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<700?1:1.25));renderer.setSize(innerWidth,innerHeight,false);renderer.setClearColor(0,0);renderer.autoClear=false;
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
    for(const slot of slots)views.push(makeView(slot));
    body.dataset.activitiesReady='true';canvas.dataset.clips=String(model.animations.length);
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(raf);raf=0;canvas.style.visibility='hidden';body.dataset.activitiesReady='context-lost';});
    canvas.addEventListener('webglcontextrestored',()=>{lost=false;canvas.style.visibility='';body.dataset.activitiesReady='true';requestPaint();});
    requestPaint();
  }catch(e){failed=true;body.dataset.activitiesReady='unavailable';renderer?.dispose();canvas?.remove();console.warn('The optional 3D illustrations are unavailable. All portfolio content remains accessible.',e.message);}
  loading=false;
}
function draw(now){
  raf=0;if(!renderer||lost)return;
  const dt=last?Math.min((now-last)/1000,.05):0;last=now;
  renderer.setScissorTest(false);renderer.clear();
  if(!available())return;
  let count=0;
  const headerBottom=Math.max(0,document.querySelector('.nav').getBoundingClientRect().bottom);
  for(const v of views){
    const b=v.el.getBoundingClientRect();if(b.bottom<=headerBottom||b.top>=innerHeight||b.width<1||b.height<1)continue;count++;
    if(moving()){
      v.time+=dt;v.mix.update(dt);
      // Small parallax stays within its illustration; reading copy never moves.
      const target=pointer.x*.055;v.tilt+=(target-v.tilt)*(1-Math.exp(-dt*5));
      if(v.kind==='dance')v.pivot.rotation.y=.14+v.tilt;
      if(v.kind==='sky'){v.pivot.rotation.z=-.65+Math.sin(v.time*.8)*.08;v.pivot.position.y=.65+Math.sin(v.time*1.1)*.07;}
      if(v.kind==='bungee'){v.pivot.rotation.z=Math.PI+Math.sin(v.time*.75)*.06;v.pivot.position.y=2.18+Math.sin(v.time*.75)*.07;}
    }
    poseProps(v);v.camera.aspect=b.width/b.height;v.camera.updateProjectionMatrix();
    renderer.setViewport(b.left,innerHeight-b.bottom,b.width,b.height);renderer.setScissor(Math.max(0,b.left),Math.max(0,innerHeight-b.bottom),Math.max(0,Math.min(innerWidth,b.right)-Math.max(0,b.left)),Math.max(0,Math.min(innerHeight,b.bottom)-Math.max(headerBottom,b.top)));renderer.setScissorTest(true);renderer.clearDepth();renderer.render(v.scene,v.camera);
    v.rendered++;v.el.dataset.poseTime=v.time.toFixed(3);v.el.dataset.renders=String(v.rendered);
  }
  canvas.dataset.frames=String(++frames);canvas.dataset.visible=String(count);
  if(count&&moving())raf=requestAnimationFrame(draw);
}
function requestPaint(){
  if(!renderer){if(available()&&slots.some(visible))init();return;}
  if(!raf&&!lost){last=0;raf=requestAnimationFrame(draw);}
}
const observer=new IntersectionObserver(()=>requestPaint(),{rootMargin:'120px'});slots.forEach(el=>observer.observe(el));
new MutationObserver(()=>requestPaint()).observe(body,{attributes:true,attributeFilter:['class']});
addEventListener('scroll',requestPaint,{passive:true});addEventListener('resize',()=>{if(renderer){renderer.setSize(innerWidth,innerHeight,false);}requestPaint();},{passive:true});
addEventListener('pointermove',e=>{pointer.x=e.clientX/innerWidth*2-1;pointer.y=e.clientY/innerHeight*2-1;},{passive:true});
document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;last=0;if(!document.hidden)requestPaint();});
reduced.addEventListener('change',requestPaint);requestPaint();
