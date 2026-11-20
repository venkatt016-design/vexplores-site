import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// The existing feather artwork is a real mesh. No generated replacement,
// illustration, or background rectangle is used here.
const body = document.body;
const eligible = matchMedia('(min-width:821px) and (hover:hover) and (pointer:fine)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let started = false;

async function init() {
  const canvas = document.getElementById('featherModel');
  if (!canvas) return;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true, powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(44, 72, false);
    renderer.setClearColor(0, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xf2fcff, 0x537160, 2.4));
    const key = new THREE.DirectionalLight(0xfff1d9, 3.3);
    key.position.set(-3, 4, 5); scene.add(key);
    const rim = new THREE.DirectionalLight(0x8ee9ff, 2.0);
    rim.position.set(3, 2, -3); scene.add(rim);
    // The physical quill tip projects to exactly (22,66), the CSS pivot.
    const camera = new THREE.OrthographicCamera(-22/60, 22/60, 66/60, -6/60, .1, 10);
    camera.position.set(0, 0, 4);
    const pivot = new THREE.Group(); scene.add(pivot);
    const uniforms = {uBend:{value:0}, uFlutter:{value:0}, uTime:{value:0}};
    const gltf = await new GLTFLoader().loadAsync('./assets/feather_v0.glb');
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse(node => {
      if (!node.isMesh) return;
      const geometry = node.geometry.clone().applyMatrix4(node.matrixWorld);
      const positions = geometry.attributes.position;
      let tip = 0;
      for (let i = 1; i < positions.count; i++) if (positions.getY(i) < positions.getY(tip)) tip = i;
      geometry.translate(-positions.getX(tip), -positions.getY(tip), -positions.getZ(tip));
      geometry.rotateZ(.58); geometry.computeBoundingBox();
      // Leave room for secondary motion on both sides of the vane.
      const bounds = geometry.boundingBox;
      const scale = Math.min(.86 / bounds.max.y,
        bounds.min.x < 0 ? .30 / -bounds.min.x : Infinity,
        bounds.max.x > 0 ? .29 / bounds.max.x : Infinity);
      geometry.scale(scale, scale, scale);
      const material = node.material.clone();
      material.side = THREE.DoubleSide; material.roughness = .58;
      material.onBeforeCompile = shader => {
        Object.assign(shader.uniforms, uniforms);
        shader.vertexShader = 'uniform float uBend; uniform float uFlutter; uniform float uTime;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
          #include <begin_vertex>
          float h = max(0.0, position.y);
          // The shaft settles first; the tip and barbs follow on a curved arc.
          transformed.x += uBend * h * h * .12;
          transformed.z += sin(h * 14.0 - uTime * 3.7) * uFlutter * h * h * .16;
          transformed.y -= abs(uBend) * h * h * .022;
        `);
      };
      pivot.add(new THREE.Mesh(geometry, material));
    });
    let lost = false;
    function paint(detail = {bend:0, flutter:0, time:0, bow:0}) {
      if (lost) return;
      uniforms.uBend.value = detail.bend;
      uniforms.uFlutter.value = detail.flutter;
      uniforms.uTime.value = detail.time;
      pivot.rotation.y = Math.sin(detail.time * .68) * .08;
      pivot.rotation.x = (detail.bow || 0) * .18;
      renderer.render(scene, camera);
      canvas.dataset.frames = String(Number(canvas.dataset.frames || 0) + 1);
      canvas.dataset.pose = [detail.bend, detail.flutter, detail.bow || 0].map(n=>n.toFixed(4)).join(',');
    }
    function ready() {
      paint(); canvas.dataset.model = 'textured-3d-feather';
      canvas.dataset.orientation = 'eye-up-quill-down';
      body.dataset.featherCursorReady = 'true';
      dispatchEvent(new Event('vx-feather-ready'));
    }
    addEventListener('vx-feather-frame', event => paint(event.detail));
    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault(); lost = true;
      delete body.dataset.featherCursorReady;
      dispatchEvent(new Event('vx-feather-ready'));
    });
    canvas.addEventListener('webglcontextrestored', () => { lost = false; ready(); });
    ready();
  } catch (error) {
    renderer?.dispose();
    delete body.dataset.featherCursorReady;
    canvas.dataset.status = 'native-pointer-fallback';
    dispatchEvent(new Event('vx-feather-ready'));
    console.warn('The feather could not be displayed; the normal pointer remains available.', error.message);
  }
}
function maybeStart() {
  if (started || !eligible.matches || reduced.matches) return;
  started = true; init();
}
eligible.addEventListener('change', maybeStart);
reduced.addEventListener('change', maybeStart);
maybeStart();
