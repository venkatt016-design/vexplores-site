/* Original, silent, runtime 3D illustrations. No film character or voice is reused. */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createAdventureBuilders} from './adventure-scenes.js';

const body=document.body, reduced=matchMedia('(prefers-reduced-motion: reduce)');
const clamp=THREE.MathUtils.clamp;
const mats=new Map(), geometries=new Map();
function material(color,roughness=.7){const key=color+':'+roughness;if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color,roughness,metalness:roughness<.4?.25:0}));return mats.get(key)}
function geom(key,make){if(!geometries.has(key))geometries.set(key,make());return geometries.get(key)}
function ellipsoid(parent,color,pos,scale){const m=new THREE.Mesh(geom('sphere',()=>new THREE.SphereGeometry(1,20,14)),material(color));m.position.set(...pos);m.scale.set(...scale);parent.add(m);return m}
function rod(parent,color,a,b,r=.04){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av),len=delta.length();const m=new THREE.Mesh(geom('rod',()=>new THREE.CylinderGeometry(1,1,1,12)),material(color));m.position.copy(av.add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());m.scale.set(r,len,r);parent.add(m);return m}
function capsule(parent,color,len,r,pos=[0,0,0]){const key=`capsule:${len}:${r}`;const m=new THREE.Mesh(geom(key,()=>new THREE.CapsuleGeometry(r,len,5,12)),material(color));m.position.set(...pos);parent.add(m);return m}
function path(parent,color,points,r=.025){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const m=new THREE.Mesh(new THREE.TubeGeometry(curve,24,r,8,false),material(color));parent.add(m);return m}
function ring(parent,color,r,tube,pos,rotation=[0,0,0],arc=Math.PI*2){const m=new THREE.Mesh(new THREE.TorusGeometry(r,tube,10,52,arc),material(color));m.position.set(...pos);m.rotation.set(...rotation);parent.add(m);return m}
function group(parent,pos=[0,0,0]){const g=new THREE.Group();g.position.set(...pos);parent.add(g);return g}

// Poseable rounded humans: articulated shoulders, elbows, hips and knees.
function person(parent,{shirt=0x16a89d,pants=0x213951,skin=0xbc784f,hair=0x22202b,helmet=false,vest=false}={}){
 const root=group(parent),hips=group(root,[0,.92,0]),torso=group(hips,[0,.26,0]);
 ellipsoid(torso,shirt,[0,.25,0],[.31,.43,.22]);ellipsoid(hips,pants,[0,0,0],[.29,.22,.2]);
 capsule(torso,skin,.1,.1,[0,.69,0]);const head=group(torso,[0,.97,.015]);
 ellipsoid(head,skin,[0,0,0],[.285,.32,.26]);ellipsoid(head,skin,[-.283,-.02,0],[.065,.1,.055]);ellipsoid(head,skin,[.283,-.02,0],[.065,.1,.055]);
 ellipsoid(head,hair,[0,.17,-.035],[.29,.195,.26]);
 for(let i=0;i<5;i++)ellipsoid(head,hair,[-.2+i*.09,.22+Math.sin(i)*.035,.14],[.09,.1,.1]);
 for(const x of [-.107,.107]){ellipsoid(head,0xfffcf4,[x,.015,.237],[.062,.075,.03]);ellipsoid(head,0x1b2432,[x+.006,.015,.262],[.028,.038,.016]);ellipsoid(head,0xffffff,[x+.015,.031,.274],[.01,.013,.006]);path(head,hair,[[x-.045,.128,.223],[x,.147,.234],[x+.048,.135,.223]],.015)}
 ellipsoid(head,skin,[.005,-.071,.268],[.06,.06,.056]);
 const smile=path(head,0x783b36,[[-.11,-.135,.23],[-.055,-.185,.248],[.025,-.194,.257],[.105,-.148,.237]],.018);
 ellipsoid(head,0xd59173,[-.185,-.098,.211],[.042,.026,.014]);ellipsoid(head,0xd59173,[.185,-.098,.211],[.042,.026,.014]);
 if(helmet){ellipsoid(head,0xf8c649,[0,.19,-.017],[.327,.21,.296]);ring(head,0xedab23,.29,.029,[0,.16,0],[Math.PI/2,0,0]);path(head,0x25424b,[[-.285,.01,.06],[-.22,-.2,.085],[0,-.32,.08],[.22,-.2,.085],[.285,.01,.06]],.017)}
 if(vest){ellipsoid(torso,0xf39336,[0,.27,.17],[.285,.32,.105]);rod(torso,0x273947,[0,-.03,.25],[0,.57,.255],.015);rod(torso,0x273947,[-.25,.17,.25],[.25,.17,.25],.018)}
 else {ellipsoid(torso,0xf6d45e,[-.115,.37,.198],[.057,.057,.018]);rod(torso,0xe4fcf4,[-.12,.34,.22],[-.095,.385,.219],.008)}
 const arms=[],legs=[];
 for(const side of [-1,1]){
  const shoulder=group(torso,[side*.32,.51,0]);capsule(shoulder,shirt,.24,.105,[0,-.17,0]);const elbow=group(shoulder,[0,-.38,0]);capsule(elbow,skin,.26,.074,[0,-.18,0]);const hand=group(elbow,[0,-.4,0]);ellipsoid(hand,skin,[0,0,0],[.091,.115,.065]);ellipsoid(hand,skin,[-side*.07,.02,.035],[.035,.06,.045]);arms.push({shoulder,elbow,hand});
  const hip=group(hips,[side*.16,-.05,0]);capsule(hip,pants,.3,.12,[0,-.2,0]);const knee=group(hip,[0,-.42,0]);capsule(knee,pants,.25,.087,[0,-.16,0]);ellipsoid(knee,0xf8f4e5,[0,-.375,.09],[.128,.09,.23]);ellipsoid(knee,shirt,[0,-.35,.1],[.13,.057,.21]);legs.push({hip,knee});
 }
 return {root,hips,torso,head,arms,legs,smile};
}

function cloud(parent,pos,s=1){const g=group(parent,pos);[[0,0,0,.6],[-.52,-.11,0,.4],[.48,-.1,0,.38],[.08,.22,-.06,.4]].forEach(([x,y,z,r])=>ellipsoid(g,0xffffff,[x,y,z],[r,r*.68,r*.7]));g.scale.setScalar(s);return g}
function plinth(parent,color,r=1.5){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r*.96,.1,64),material(color));m.position.y=-.03;parent.add(m);return m}
function note(parent,pos,scale=1,color=0xd09a33){const g=group(parent,pos);rod(g,color,[0,0,0],[0,.44,0],.025);rod(g,color,[0,.43,0],[.17,.37,0],.027);ellipsoid(g,color,[-.07,0,0],[.095,.06,.04]);g.scale.setScalar(scale);return g}
function baseScene(){const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xe6faff,0x967d9c,2.4));const key=new THREE.DirectionalLight(0xfff1df,3.5);key.position.set(-3,6,5);scene.add(key);const rim=new THREE.DirectionalLight(0x85c9ff,2);rim.position.set(4,2,-3);scene.add(rim);return scene}

function skyScene(scene){
 const canopy=group(scene,[0,3.05,-.15]);
 // A real inflated canopy, fabric ribs and suspension lines, not a flat icon.
 for(let i=0;i<7;i++){
  const a=(i-3)*.36,top=3.12+.34*Math.cos(a),x=Math.sin(a)*1.2;
  const panel=ellipsoid(canopy,i%2?0xffaf73:0xeb6d53,[x,.34*Math.cos(a),0],[.28,.23,.59]);panel.rotation.z=-a*.4;
  for(const z of [-.4,.4])rod(scene,0xcbd5dc,[x,top,z-.15],[Math.sign(x||1)*.24,1.78,.02],.009);
 }
 const p=person(scene,{shirt:0x21a59e,pants:0x29415d});p.root.position.set(0,.35,0);p.root.scale.setScalar(.73);
 ellipsoid(p.torso,0xed7d54,[0,.27,-.25],[.3,.35,.14]);
 for(const x of [-.19,.19])path(p.torso,0x263c47,[[x,-.08,.15],[x,.17,.235],[x,.53,.205],[x,.6,-.18]],.037);
 p.arms[0].shoulder.rotation.z=-2.6;p.arms[1].shoulder.rotation.z=2.6;p.arms.forEach(a=>a.elbow.rotation.x=-.45);
 p.legs[0].hip.rotation.x=-.2;p.legs[1].hip.rotation.x=-.35;p.legs.forEach(l=>l.knee.rotation.x=.9);
 const clouds=[cloud(scene,[-1.5,1.3,-.5],.8),cloud(scene,[1.4,.65,.2],.6),cloud(scene,[1,2.8,-1],.5)];
 ring(scene,0xbbdae4,1.7,.008,[0,1.6,-1.2],[0,.24,.1],Math.PI*1.6);
 return {target:[0,1.72,0],distance:6.9,update(t,pointer){p.root.rotation.z=.045*Math.sin(t*.9);p.head.rotation.z=.07*Math.sin(t*.75);canopy.rotation.z=.035*Math.sin(t*.9+.25);clouds.forEach((c,i)=>c.position.x+=0);clouds[0].position.y=1.3+.04*Math.sin(t*.65);clouds[1].position.y=.65+.045*Math.sin(t*.8+2);p.root.rotation.y=pointer.x*.11}};
}

function raftScene(scene){
 const water=ellipsoid(scene,0x37bdce,[0,-.11,0],[2.15,.18,1.16]);const boat=group(scene,[0,.3,0]);
 const rim=ring(boat,0xf3b732,1,.22,[0,0,0],[Math.PI/2,0,0]);rim.scale.set(1.38,.83,1);ellipsoid(boat,0x238d9f,[0,-.1,0],[1.25,.09,.68]);
 for(const x of [-.48,.48]){const seat=capsule(boat,0xffd569,.94,.12,[x,-.015,0]);seat.rotation.x=Math.PI/2}
 ring(boat,0x3f4d57,1.02,.018,[0,.07,0],[Math.PI/2,0,0]).scale.set(1.39,.83,1);
 const people=[];
 for(const [i,x] of [-.55,.5].entries()){
  const p=person(boat,{shirt:i?0xbd6d98:0x168d99,helmet:true,vest:true,skin:i?0xd49b6b:0x975c3d});p.root.scale.setScalar(.52);p.root.position.set(x,.0,.0);p.root.rotation.y=i?-.18:.18;
  p.legs.forEach(l=>{l.hip.rotation.x=-1.5;l.knee.rotation.x=1.25});p.arms.forEach(a=>{a.shoulder.rotation.x=-.85;a.elbow.rotation.x=-.65});
  const paddle=group(boat,[x,.66,.65]);paddle.rotation.z=i?-.42:.42;rod(paddle,0xe2e3cd,[0,-.75,0],[0,.55,0],.027);ellipsoid(paddle,0xf89535,[0,-.82,0],[.14,.3,.04]);people.push({p,paddle,i});
 }
 const rapids=[];
 for(let i=0;i<9;i++){const z=-.92+i*.23,x=(i%2?-.6:.4);rapids.push(path(scene,0xf1fcff,[[x-.45,.08,z],[x-.24,.16,z+.04],[x,.11,z],[x+.28,.08,z+.08]],.03));}
 for(const [x,z] of [[-1.8,-.3],[1.7,.5],[-1.4,.7]]){const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.26,0),material(0x739091));rock.position.set(x,.05,z);rock.scale.set(1.5,.85,1);scene.add(rock)}
 return {target:[0,.65,0],distance:6.6,elevation:2.6,update(t,pointer){boat.rotation.z=.045*Math.sin(t*1.7);boat.rotation.x=.032*Math.sin(t*1.3+.5);boat.position.y=.3+.025*Math.sin(t*2);boat.rotation.y=pointer.x*.055;people.forEach(({p,paddle,i})=>{const phase=t*1.7+i*.6;paddle.rotation.x=.35*Math.sin(phase);p.torso.rotation.x=.06*Math.sin(phase);p.head.rotation.z=.08*Math.sin(t+i)});rapids.forEach((r,i)=>{r.position.z=.07*Math.sin(t*1.7+i);r.scale.y=.9+.18*Math.sin(t*2+i)});water.scale.y=.18+.005*Math.sin(t)}};
}

function danceScene(scene){
 plinth(scene,0xf2e2d1,1.45);ring(scene,0xeac179,1.15,.02,[0,.035,0],[Math.PI/2,0,0]);
 const p=person(scene,{shirt:0xe47657,pants:0x294359,skin:0xb67a52});p.root.position.y=.06;p.root.rotation.y=-.13;
 const ribbons=[path(scene,0x5fbea9,[[-1.2,.6,-.3],[-1.4,1.2,-.3],[-.9,2.1,-.5],[-.8,2.5,-.5]],.014),path(scene,0xe2b451,[[1.1,.4,-.4],[1.4,1.1,-.4],[1,2,-.7]],.013)];
 const notes=[note(scene,[-1.08,1.9,0],.8,0x399c95),note(scene,[1.02,2.05,-.2],.65,0xca7f8b)];
 return {target:[0,1.23,0],distance:5.25,update(t,pointer){const b=Math.sin(t*2.3),c=Math.cos(t*2.3);p.root.rotation.z=.1*b;p.root.rotation.y=-.13+pointer.x*.12;p.hips.position.y=.94+.045*Math.cos(t*4.6);p.head.rotation.z=-.12*b;p.torso.rotation.y=.1*b;p.arms[0].shoulder.rotation.z=-1.05-.32*b;p.arms[1].shoulder.rotation.z=1.25-.22*b;p.arms[0].elbow.rotation.x=-1.1-.14*c;p.arms[1].elbow.rotation.x=-1.25+.2*c;p.legs[0].hip.rotation.x=.2*Math.max(0,b);p.legs[1].hip.rotation.x=.2*Math.max(0,-b);p.legs[0].knee.rotation.x=.22*Math.max(0,b);p.legs[1].knee.rotation.x=.22*Math.max(0,-b);notes.forEach((n,i)=>{n.position.y=(i?2.05:1.9)+.07*Math.sin(t+i);n.rotation.z=.12*Math.sin(t+i)});ribbons[0].rotation.y=.03*b}};
}

function singScene(scene){
 plinth(scene,0xd7eae6,1.38);const p=person(scene,{shirt:0x418d94,pants:0x34415a,skin:0xd39870});p.root.position.y=.06;p.root.rotation.y=-.12;
 const band=ring(p.head,0x293d54,.31,.029,[0,.04,-.01],[0,0,0],Math.PI);for(const x of [-.31,.31])ellipsoid(p.head,0xe4b356,[x,.05,0],[.057,.11,.105]);
 rod(scene,0x516576,[.53,.06,.52],[.53,1.78,.52],.021);ellipsoid(scene,0x516576,[.53,.05,.52],[.25,.025,.22]);const mic=capsule(scene,0x243c50,.11,.08,[.53,1.88,.5]);mic.rotation.x=-.6;ellipsoid(scene,0xaabac2,[.53,1.98,.43],[.093,.08,.093]);
 p.arms[1].shoulder.rotation.z=.55;p.arms[1].shoulder.rotation.x=-.6;p.arms[1].elbow.rotation.x=-1.2;p.arms[0].shoulder.rotation.z=-.85;p.arms[0].elbow.rotation.x=-1;
 const notes=[note(scene,[1.12,2,-.2],.8),note(scene,[-1.05,1.6,.05],.65,0x448aa3),note(scene,[.9,2.65,-.5],.45,0x9f78b6)];
 return {target:[0,1.28,0],distance:5.35,update(t,pointer){p.root.rotation.z=.035*Math.sin(t*1.8);p.root.rotation.y=-.12+pointer.x*.12;p.head.rotation.z=.05*Math.sin(t*1.8+.4);p.head.rotation.x=-.055+.025*Math.sin(t*2);p.arms[0].shoulder.rotation.z=-.85-.15*Math.sin(t*1.8);p.arms[0].elbow.rotation.x=-1+.1*Math.sin(t*1.8+.4);p.smile.scale.y=1+.08*Math.sin(t*3.6);notes.forEach((n,i)=>{n.position.y=[2,1.6,2.65][i]+.05*Math.sin(t+i);n.rotation.z=.08*Math.sin(t*.8+i)})}};
}

function initWorlds(){
 const slots=[...document.querySelectorAll('.living-scene')];if(!slots.length)return;
 let renderer;try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'})}catch{return}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.35));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
 const canvas=renderer.domElement;canvas.className='living-webgl';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
 const kit={THREE,material,geom,ellipsoid,rod,capsule,path,ring,group,person,cloud,plinth,note};
 const builders={sky:skyScene,raft:raftScene,dance:danceScene,sing:singScene,...createAdventureBuilders(kit)};
 const views=slots.map(el=>{const scene=baseScene(),motion=builders[el.dataset.scene](scene),camera=new THREE.PerspectiveCamera(35,1,.1,50),target=new THREE.Vector3(...motion.target);camera.position.set(.35,target.y+(motion.elevation||.55),motion.distance);camera.lookAt(target);el.dataset.rendered='true';motion.update(0,{x:0,y:0});return {el,scene,camera,motion,pointer:{x:0,y:0},desired:{x:0,y:0},visible:false,time:0,rect:null}});
 let raf=0,previous=0,dirty=true,active=[],lost=false,clipTop=0;
 function measure(){renderer.setSize(innerWidth,innerHeight);views.forEach(v=>v.rect=v.el.getBoundingClientRect());dirty=true;start()}
 function permitted(){return body.classList.contains('entered')&&!body.classList.contains('cinema-open')&&!document.hidden&&!lost}
 function paused(){return reduced.matches||body.classList.contains('paused')}
 function draw(now){raf=0;if(!permitted()){canvas.style.visibility='hidden';previous=0;return}canvas.style.visibility='visible';const dt=Math.min(.04,previous?(now-previous)/1000:0);previous=now;renderer.setScissorTest(false);renderer.clear();renderer.setScissorTest(true);let draws=0,triangles=0;
  if(dirty){views.forEach(v=>v.rect=v.el.getBoundingClientRect());clipTop=Math.max(0,document.querySelector('.nav').getBoundingClientRect().bottom);dirty=false}
  active=views.filter(v=>v.rect.bottom>clipTop&&v.rect.top<innerHeight&&v.rect.width>0);
  for(const v of active){const r=v.rect;v.camera.aspect=r.width/r.height;v.camera.updateProjectionMatrix();if(!paused()){v.time+=dt;const a=1-Math.exp(-dt*4);v.pointer.x+=(v.desired.x-v.pointer.x)*a;v.pointer.y+=(v.desired.y-v.pointer.y)*a;v.motion.update(v.time,v.pointer)}renderer.setViewport(r.left,innerHeight-r.bottom,r.width,r.height);renderer.setScissor(Math.max(0,r.left),Math.max(0,innerHeight-r.bottom),Math.min(r.width,innerWidth-r.left),Math.max(0,Math.min(innerHeight,r.bottom)-Math.max(clipTop,r.top)));renderer.render(v.scene,v.camera);draws+=renderer.info.render.calls;triangles+=renderer.info.render.triangles;}
  canvas.dataset.drawCalls=String(draws);canvas.dataset.triangles=String(triangles);canvas.dataset.activeViews=String(active.length);canvas.dataset.motion=paused()?'static':'playing';
  if(active.length&&!paused())raf=requestAnimationFrame(draw);else previous=0;
 }
 function start(){if(!raf)raf=requestAnimationFrame(draw)}
 const observer=new IntersectionObserver(()=>{dirty=true;start()});slots.forEach(el=>observer.observe(el));
 addEventListener('scroll',()=>{dirty=true;start()},{passive:true});addEventListener('resize',measure,{passive:true});document.addEventListener('visibilitychange',start);reduced.addEventListener('change',start);
 new MutationObserver(()=>{dirty=true;start()}).observe(body,{attributes:true,attributeFilter:['class']});
 slots.forEach(el=>{el.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||paused())return;const v=views.find(v=>v.el===el),r=v.rect;v.desired.x=clamp((e.clientX-r.left)/r.width*2-1,-1,1);v.desired.y=clamp((e.clientY-r.top)/r.height*2-1,-1,1);start()},{passive:true});el.addEventListener('pointerleave',()=>{views.find(v=>v.el===el).desired={x:0,y:0}})});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(raf);raf=0;previous=0;slots.forEach(el=>delete el.dataset.rendered);canvas.style.visibility='hidden'});
 canvas.addEventListener('webglcontextrestored',()=>{lost=false;slots.forEach(el=>el.dataset.rendered='true');dirty=true;start()});
 document.fonts.ready.then(measure);measure();
}

async function initFeather(){
 const canvas=document.getElementById('featherModel');if(!canvas)return;
 // Keep the native pointer until the real, distinct Tripo GLB is decoded and painted.
 let renderer;try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'})}catch{return}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(160,200,false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;
 const scene=baseScene(),camera=new THREE.OrthographicCamera(-.56,.56,1.26,-.14,.1,10);camera.position.set(0,0,4);camera.lookAt(0,0,0);
 const uniforms={uBend:{value:0},uFlutter:{value:0},uTime:{value:0}};
 try{
  const gltf=await new GLTFLoader().loadAsync('./assets/feather_v0.glb');gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(n=>{if(!n.isMesh)return;const geometry=n.geometry.clone();geometry.applyMatrix4(n.matrixWorld);const p=geometry.attributes.position;let bottom=0;for(let i=1;i<p.count;i++)if(p.getY(i)<p.getY(bottom))bottom=i;geometry.translate(-p.getX(bottom),-p.getY(bottom),-p.getZ(bottom));geometry.rotateZ(.58);geometry.scale(.93,.93,.93);
   const mat=n.material.clone();mat.side=THREE.DoubleSide;mat.roughness=.62;mat.onBeforeCompile=shader=>{Object.assign(shader.uniforms,uniforms);shader.vertexShader='uniform float uBend;uniform float uFlutter;uniform float uTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloat heightWeight = max(0.0, position.y);\ntransformed.x += uBend * heightWeight * heightWeight;\ntransformed.z += sin(position.y * 20.0 + uTime * 5.0) * uFlutter * heightWeight * heightWeight;');};scene.add(new THREE.Mesh(geometry,mat));
  });renderer.render(scene,camera);body.dataset.featherCursorReady='true';canvas.dataset.model='tripo-feather-v0';canvas.dataset.orientation='eye-up-tip-down';dispatchEvent(new Event('vx-feather-ready'));
  addEventListener('vx-feather-frame',e=>{uniforms.uBend.value=e.detail.bend;uniforms.uFlutter.value=e.detail.flutter;uniforms.uTime.value=e.detail.time;renderer.render(scene,camera)});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();delete body.dataset.featherCursorReady;dispatchEvent(new Event('vx-feather-ready'))});
  canvas.addEventListener('webglcontextrestored',()=>{renderer.render(scene,camera);body.dataset.featherCursorReady='true';dispatchEvent(new Event('vx-feather-ready'))});
 }catch(e){renderer.dispose();canvas.dataset.status='fallback';console.warn('Feather unavailable; native pointer retained.',e.message)}
}
initWorlds();
// Touch and reduced-motion users do not need a second renderer or a GLB download.
const featherEligible=matchMedia('(min-width:821px) and (hover:hover) and (pointer:fine)');
let featherStarted=false;
function maybeFeather(){if(!featherStarted&&featherEligible.matches&&!reduced.matches){featherStarted=true;initFeather()}}
featherEligible.addEventListener('change',maybeFeather);reduced.addEventListener('change',maybeFeather);maybeFeather();
