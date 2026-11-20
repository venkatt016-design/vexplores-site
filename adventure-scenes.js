/*
 * Anonymous, decorative illustrations for the locally reviewed Oct21 hub.
 * Inject the existing living-scenes.js helpers; this module owns no renderer,
 * DOM, clock, input listener, or animation loop. The host owns motion consent.
 * update(0, {x: 0, y: 0}) always restores a complete, readable rest pose.
 */
export function createAdventureBuilders(kit) {
  const {THREE, material, geom, rod, group, person, plinth} = kit;
  const C = {
    ink: 0x284d51, emerald: 0x168d78, leaf: 0x4dab83, mint: 0xbdded0,
    pale: 0xeaf3ea, coral: 0xe98269, gold: 0xe7b451, cream: 0xfff8e9,
    water: 0xc9ebe7, foam: 0xffffff, stone: 0xb0bdb2, boot: 0x72513e,
  };
  const down = new THREE.Vector3(0, -1, 0);
  const up = new THREE.Vector3(0, 1, 0);
  const clamp = THREE.MathUtils.clamp;
  const clock = t => Number.isFinite(t) ? t : 0;
  const gaze = pointer => clamp(Number.isFinite(pointer?.x) ? pointer.x : 0, -1, 1);
  const phase = (t, period) => ((t / period) % 1 + 1) % 1;
  const ease = u => u * u * (3 - 2 * u);

  // Scenery uses a lighter shared sphere than the detailed existing person.
  function pebble(parent, color, pos, scale) {
    const mesh = new THREE.Mesh(geom('adventure:pebble', () =>
      new THREE.SphereGeometry(1, 12, 8)), material(color));
    mesh.position.set(...pos);
    mesh.scale.set(...scale);
    parent.add(mesh);
    return mesh;
  }

  function block(parent, color, pos, scale) {
    const mesh = new THREE.Mesh(geom('adventure:box', () =>
      new THREE.BoxGeometry(1, 1, 1)), material(color));
    mesh.position.set(...pos);
    mesh.scale.set(...scale);
    parent.add(mesh);
    return mesh;
  }

  function curve(parent, color, points, radius = .025) {
    const spline = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(spline, 20, radius, 6, false), material(color));
    parent.add(mesh);
    return mesh;
  }

  function loop(parent, color, radius, thickness, pos, rotation = [0, 0, 0]) {
    const key = `adventure:loop:${radius}:${thickness}`;
    const mesh = new THREE.Mesh(geom(key, () =>
      new THREE.TorusGeometry(radius, thickness, 6, 28)), material(color));
    mesh.position.set(...pos);
    mesh.rotation.set(...rotation);
    parent.add(mesh);
    return mesh;
  }

  // Thick, cupped leaves/feathers: visible in profile as well as from above.
  // All vertices are built once, including the curved central ridge.
  function leafGeometry(length, width, bend) {
    return geom(`adventure:leaf:${length}:${width}:${bend}`, () => {
      const vertices = [], indices = [], steps = 9;
      for (let side = 0; side < 2; side++) {
        for (let i = 0; i <= steps; i++) {
          const u = i / steps, belly = Math.sin(Math.PI * u);
          const x = bend * u * u, y = length * u, z = .11 * belly;
          for (let j = -1; j <= 1; j++) {
            vertices.push(x + j * width * .5 * belly, y,
              z + (j === 0 ? .035 * belly : 0) + (side ? -.015 : .015));
          }
        }
      }
      const layer = (steps + 1) * 3;
      for (let i = 0; i < steps; i++) {
        for (let j = 0; j < 2; j++) {
          const a = i * 3 + j, b = a + 3;
          indices.push(a, a + 1, b, a + 1, b + 1, b);
          indices.push(a + layer, b + layer, a + 1 + layer,
            a + 1 + layer, b + layer, b + 1 + layer);
        }
        for (const edge of [0, 2]) {
          const a = i * 3 + edge, b = a + 3;
          if (edge === 0) indices.push(a, b, a + layer, b, b + layer, a + layer);
          else indices.push(a, a + layer, b, b, a + layer, b + layer);
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      return geometry;
    });
  }

  function leaf(parent, color, pos, length, width, angle, bend = .12) {
    const mesh = new THREE.Mesh(leafGeometry(length, width, bend), material(color));
    mesh.position.set(...pos);
    mesh.rotation.z = angle;
    parent.add(mesh);
    return mesh;
  }

  function sprig(parent, pos, size = 1) {
    const root = group(parent, pos);
    root.scale.setScalar(size);
    curve(root, C.emerald, [[0, 0, 0], [.07, .3, 0], [.01, .62, -.02]], .018);
    leaf(root, C.leaf, [.03, .18, 0], .38, .2, .8);
    leaf(root, C.emerald, [.05, .3, 0], .4, .2, -.85, -.09);
    leaf(root, C.mint, [.02, .48, 0], .29, .16, .2);
    return root;
  }

  // Thin solid board with an upturned nose, not an inflatable boat/capsule.
  function board(parent, color, length, width, thickness, pos, lift = .10) {
    const key = `adventure:board:${length}:${width}:${thickness}:${lift}`;
    const geometry = geom(key, () => {
      const vertices = [], indices = [], segments = 32;
      for (let layer = 0; layer < 2; layer++) {
        vertices.push(0, layer ? -thickness / 2 : thickness / 2, 0);
        for (let i = 0; i < segments; i++) {
          const a = i * Math.PI * 2 / segments, nose = Math.cos(a);
          const x = Math.sin(a) * width * .5 * (1 - .12 * Math.max(0, nose));
          const y = (layer ? -.5 : .5) * thickness + lift * Math.max(0, (nose - .55) / .45) ** 2;
          vertices.push(x, y, nose * length * .5);
        }
      }
      const stride = segments + 1;
      for (let i = 0; i < segments; i++) {
        const a = i + 1, b = (i + 1) % segments + 1;
        indices.push(0, a, b, stride, b + stride, a + stride);
        indices.push(a, a + stride, b, b, a + stride, b + stride);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      return geometry;
    });
    const mesh = new THREE.Mesh(geometry, material(color));
    mesh.position.set(...pos);
    parent.add(mesh);
    return mesh;
  }

  // A two-bone solve preserves the provided rig and its segment lengths.
  // Targets and elbow/knee poles are expressed in the person's root space.
  // Scratch vectors/quaternions live here; update() allocates no geometry.
  function poseRig(p) {
    const target = new THREE.Vector3(), pole = new THREE.Vector3();
    const axis = new THREE.Vector3(), bend = new THREE.Vector3();
    const upper = new THREE.Vector3(), lower = new THREE.Vector3();
    const inverse = new THREE.Quaternion(), rootRotation = new THREE.Quaternion();
    const feet = p.legs.map(leg => {
      const foot = group(leg.knee, [0, -.375, 0]);
      for (const mesh of [...leg.knee.children]) {
        if (mesh.isMesh && mesh.position.y < -.3) {
          mesh.position.y += .375;
          foot.add(mesh);
        }
      }
      return foot;
    });

    function reach(joint, hinge, endpoint, hint, first, second) {
      p.root.updateWorldMatrix(true, false);
      joint.parent.updateWorldMatrix(true, false);
      target.copy(endpoint);
      p.root.localToWorld(target);
      joint.parent.worldToLocal(target);
      target.sub(joint.position);
      pole.copy(hint);
      p.root.localToWorld(pole);
      joint.parent.worldToLocal(pole);
      pole.sub(joint.position);
      const distance = clamp(target.length(), .025, first + second - .0001);
      axis.copy(target).normalize();
      bend.copy(pole).addScaledVector(axis, -pole.dot(axis));
      if (bend.lengthSq() < .00001) bend.set(0, 0, 1).addScaledVector(axis, -axis.z);
      bend.normalize();
      const cosine = clamp((first * first + distance * distance - second * second) /
        (2 * first * distance), -1, 1);
      upper.copy(axis).multiplyScalar(cosine).addScaledVector(bend, Math.sqrt(1 - cosine * cosine));
      lower.copy(axis).multiplyScalar(distance).addScaledVector(upper, -first).normalize();
      joint.quaternion.setFromUnitVectors(down, upper);
      inverse.copy(joint.quaternion).invert();
      hinge.quaternion.setFromUnitVectors(down, lower.applyQuaternion(inverse));
    }

    return {
      feet,
      arm(i, endpoint, hint) {
        reach(p.arms[i].shoulder, p.arms[i].elbow, endpoint, hint, .38, .4);
      },
      leg(i, endpoint, hint) {
        reach(p.legs[i].hip, p.legs[i].knee, endpoint, hint, .42, .375);
        p.root.getWorldQuaternion(rootRotation);
        p.legs[i].knee.getWorldQuaternion(inverse).invert();
        feet[i].quaternion.copy(inverse).multiply(rootRotation);
      },
    };
  }

  function anchors(points) {
    return points.map(p => new THREE.Vector3(...p));
  }

  function water(parent, sx = 1.55, sz = 1.9) {
    pebble(parent, C.water, [0, -.04, 0], [sx, .085, sz]);
    for (const side of [-1, 1]) {
      curve(parent, C.foam, [[side * .62, .056, -.9], [side * 1.04, .06, -1.3],
        [side * 1.32, .045, -1.52]], .018);
    }
  }

  function hike(scene) {
    const world = group(scene);
    world.name = 'adventure-hike';
    pebble(world, C.pale, [0, -.08, 0], [1.95, .18, 1.24]);
    // Faceted mountains stay behind the silhouette; the foreground is a path.
    for (const [x, y, z, r, height, color] of [
      [-1.04, .69, -.67, .86, 1.64, C.mint], [.83, .89, -.83, .93, 2.12, C.leaf],
    ]) {
      const peak = new THREE.Mesh(new THREE.ConeGeometry(r, height, 5), material(color));
      peak.position.set(x, y, z);
      peak.rotation.y = .3;
      world.add(peak);
      const snow = new THREE.Mesh(new THREE.ConeGeometry(r * .27, height * .27, 5), material(C.cream));
      snow.position.set(x, y + height * .365, z);
      snow.rotation.y = .3;
      world.add(snow);
    }
    curve(world, C.cream, [[-1.65, .03, .68], [-1, .06, .78], [-.25, .10, .53],
      [.55, .12, .13], [1.42, .15, -.22]], .105);
    const trail = group(world, [-.1, .195, .38]);
    trail.rotation.y = -.50;
    const p = person(trail, {shirt: C.emerald, pants: C.ink});
    const rig = poseRig(p);
    p.hips.position.set(0, .82, 0);
    p.torso.rotation.x = .13;
    // The raised step is directly under the forward boot, in the same space.
    pebble(trail, C.stone, [-.16, .018, .42], [.27, .11, .31]);
    pebble(trail, C.stone, [.17, -.055, -.23], [.25, .055, .28]);
    const pack = pebble(p.torso, C.coral, [0, .27, -.31], [.345, .39, .18]);
    pack.name = 'hiking-backpack';
    pebble(p.torso, C.gold, [0, .65, -.32], [.37, .105, .115]);
    pebble(p.torso, C.coral, [.31, .15, -.28], [.105, .18, .11]);
    for (const x of [-.22, .22]) {
      curve(p.torso, C.gold, [[x, -.04, .12], [x, .22, .215], [x, .53, .18],
        [x, .61, -.12], [x, .43, -.39]], .026);
    }
    rod(p.torso, C.ink, [-.21, .23, .223], [.21, .23, .223], .02);
    rig.feet.forEach(foot => {
      foot.children[0].material = material(C.boot);
      foot.children[1].material = material(C.gold);
      pebble(foot, C.boot, [0, .075, .005], [.116, .12, .13]);
      for (const z of [.08, .14]) rod(foot, C.cream, [-.07, .073, z], [.07, .073, z], .009);
    });
    const pole = group(trail, [.76, -.04, .52]);
    const stick = rod(pole, C.ink, [0, 0, 0], [-.23, 1.43, -.23], .022);
    stick.name = 'held-trekking-pole';
    rod(pole, C.gold, [-.18, 1.12, -.18], [-.23, 1.43, -.23], .038);
    pebble(pole, C.ink, [0, 0, 0], [.055, .025, .055]);
    sprig(world, [-1.42, .03, .1], .7);
    sprig(world, [1.42, .05, .52], .65);
    const feet = anchors([[-.16, .22, .4], [.17, .09, -.23]]);
    const knees = anchors([[-.18, .58, .69], [.18, .4, .2]]);
    const hands = anchors([[-.39, 1.03, .26], [.565, 1.17, .325]]);
    const elbows = anchors([[-.58, 1.3, .11], [.62, 1.38, .03]]);
    const grip = new THREE.Vector3(-.23 * (1.21 / 1.43), 1.21, -.23 * (1.21 / 1.43));
    function update(t, pointer) {
      t = clock(t);
      const cycle = phase(t, 3.6), stride = Math.sin(cycle * Math.PI * 2);
      // An uphill stepping loop: each boot has a 60% planted interval.
      // During recovery it clears its foothold, arcs, and lands at that foothold.
      // Fixed stance targets avoid skating; torso weight transfers between feet.
      p.hips.position.set(.055 * stride, .82 + .045 * Math.sin(cycle * Math.PI * 2) ** 2, .035 * stride);
      p.hips.rotation.y = .055 * stride;
      p.torso.rotation.x = .13 + .055 * stride;
      p.torso.rotation.y = -.10 * stride;
      p.head.rotation.y = -.12 + .045 * gaze(pointer);
      p.head.rotation.z = -.045 - .035 * stride;
      for (let i = 0; i < 2; i++) {
        const step = (cycle + i * .5) % 1;
        const u = clamp((step - .10) / .40, 0, 1);
        const lift = Math.sin(Math.PI * u);
        feet[i].set(i ? .17 : -.16, (i ? .09 : .22) + .22 * lift * lift,
          (i ? -.23 : .4) - .17 * Math.sin(Math.PI * 2 * u) * lift);
        rig.leg(i, feet[i], knees[i]);
        rig.feet[i].rotation.x += .20 * Math.sin(Math.PI * 2 * u) * lift;
      }
      const recovery = clamp((((cycle + .5) % 1) - .10) / .40, 0, 1);
      const poleLift = Math.sin(Math.PI * recovery) ** 2;
      pole.position.set(.76, -.04 + .16 * poleLift, .52 - .10 * poleLift);
      pole.rotation.x = .10 * stride;
      pole.rotation.z = .035 * stride;
      hands[0].set(-.39, 1.03 + .04 * stride, .26 - .16 * stride);
      hands[1].copy(grip);
      pole.localToWorld(hands[1]);
      p.root.worldToLocal(hands[1]);
      for (let i = 0; i < 2; i++) rig.arm(i, hands[i], elbows[i]);
    }
    update(0);
    return {target: [0, 1.25, 0], distance: 8.0, elevation: 1.4, update};
  }

  function bungee(scene) {
    const world = group(scene);
    world.name = 'adventure-bungee';
    // A complete overhead platform and railings, without a threatening ravine.
    block(world, C.emerald, [0, 3.57, -.23], [3.25, .15, .76]);
    for (let i = 0; i < 7; i++) block(world, i % 2 ? C.cream : C.gold,
      [-1.38 + i * .46, 3.67, -.23], [.42, .07, .70]);
    for (const x of [-1.53, -.52, .52, 1.53]) rod(world, C.ink,
      [x, 3.66, -.55], [x, 4.1, -.55], .026);
    rod(world, C.ink, [-1.56, 4.1, -.55], [1.56, 4.1, -.55], .035);
    for (const x of [-1.53, 1.53]) {
      rod(world, C.ink, [x, 3.66, .1], [x, 4.1, .1], .026);
      rod(world, C.ink, [x, 4.1, -.55], [x, 4.1, .1], .035);
    }
    block(world, C.ink, [1.03, 3.52, .13], [.24, .12, .18]);
    loop(world, C.gold, .10, .025, [1.03, 3.42, .13]);
    pebble(world, C.pale, [0, .08, -.18], [1.65, .10, .75]);
    const p = person(world, {shirt: C.emerald, pants: C.ink, helmet: true});
    p.root.position.set(-.18, .71, .15);
    p.root.rotation.z = -.12;
    p.root.rotation.y = -.12;
    const rig = poseRig(p);
    // Visible shoulder webbing, waist belt, thigh loops and locking D ring.
    for (const x of [-.19, .19]) curve(p.torso, C.ink,
      [[x, -.08, .14], [x, .24, .231], [x, .56, .17], [x, .59, -.16]], .038);
    rod(p.torso, C.gold, [-.2, .28, .245], [.2, .28, .245], .028);
    loop(p.hips, C.ink, .267, .044, [0, .025, 0], [Math.PI / 2, 0, 0]).scale.set(1, .78, 1);
    for (const leg of p.legs) loop(leg.hip, C.gold, .129, .025,
      [0, -.15, 0], [Math.PI / 2, 0, 0]);
    const attachment = group(p.hips, [0, .035, .287]);
    loop(attachment, C.gold, .072, .023, [0, 0, 0]);
    block(attachment, C.cream, [.053, .008, .006], [.035, .074, .037]);
    const hands = anchors([[-.58, 1.88, .08], [.57, 1.85, .13]]);
    const elbows = anchors([[-.67, 1.49, .18], [.72, 1.48, .25]]);
    const feet = anchors([[-.23, .22, -.32], [.24, .10, .10]]);
    const knees = anchors([[-.22, .5, .38], [.3, .49, .38]]);
    // Articulated cord segments remain attached throughout the small settle.
    const cord = [], segments = 12;
    for (let i = 0; i < segments; i++) cord.push(rod(world, C.gold, [0, 0, 0], [0, 1, 0], .027));
    const end = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
    const delta = new THREE.Vector3(), start = new THREE.Vector3(1.03, 3.42, .13);
    function point(out, u) {
      out.lerpVectors(start, end, u);
      out.x += .12 * Math.sin(Math.PI * u);
      out.z += .09 * Math.sin(Math.PI * u);
    }
    function update(t, pointer) {
      t = clock(t);
      p.root.position.y = .71 + .13 * Math.sin(t * .85);
      p.root.rotation.z = -.12 + .035 * Math.sin(t * .85);
      p.head.rotation.z = .065;
      p.head.rotation.y = .05 * gaze(pointer);
      for (let i = 0; i < 2; i++) {
        rig.leg(i, feet[i], knees[i]);
        rig.arm(i, hands[i], elbows[i]);
      }
      attachment.getWorldPosition(end);
      world.worldToLocal(end);
      for (let i = 0; i < segments; i++) {
        point(a, i / segments);
        point(b, (i + 1) / segments);
        delta.subVectors(b, a);
        const length = delta.length();
        cord[i].position.copy(a).add(b).multiplyScalar(.5);
        cord[i].quaternion.setFromUnitVectors(up, delta.normalize());
        cord[i].scale.set(.027, length + .004, .027);
      }
    }
    update(0);
    return {target: [0, 2.13, 0], distance: 9.2, elevation: .85, update};
  }

  function ski(scene) {
    const world = group(scene);
    world.name = 'adventure-water-ski';
    world.rotation.y = -.66;
    water(world, 1.5, 2.15);
    // Two independent narrow skis, including their separate upturned noses.
    for (const [i, x] of [-.25, .25].entries()) {
      const ski = board(world, i ? C.emerald : C.coral, 2.65, .29, .10, [x, .10, .04], .16);
      ski.name = `water-ski-${i + 1}`;
      board(world, C.cream, 2.3, .058, .012, [x, .156, .08], .14);
      block(world, C.ink, [x, .19, .06], [.23, .07, .29]);
      curve(world, C.gold, [[x - .115, .18, .1], [x, .28, .1], [x + .115, .18, .1]], .026);
    }
    const p = person(world, {shirt: C.cream, pants: C.ink, vest: true});
    p.root.position.y = .15;
    p.hips.position.set(0, .74, -.16);
    const rig = poseRig(p);
    const feet = anchors([[-.25, .09, 0], [.25, .09, 0]]);
    const knees = anchors([[-.25, .42, .55], [.25, .42, .55]]);
    const hands = anchors([[-.22, 1.29, .53], [.22, 1.29, .53]]);
    const elbows = anchors([[-.48, 1.12, .35], [.48, 1.12, .35]]);
    rod(world, C.ink, [-.34, 1.44, .53], [.34, 1.44, .53], .04).name = 'held-tow-handle';
    for (const x of [-.34, .34]) rod(world, C.gold, [x, 1.44, .53], [0, 1.33, 1.14], .017);
    rod(world, C.gold, [0, 1.33, 1.14], [0, 1.05, 2.17], .019).name = 'visible-tow-rope';
    const wakes = [], sprayDrops = [];
    for (const side of [-1, 1]) {
      wakes.push(curve(world, C.foam, [[side * .34, .075, .1], [side * .55, .09, -.48],
        [side * .94, .12, -1.18], [side * 1.21, .08, -1.7]], .04));
      curve(world, C.mint, [[side * .54, .07, -.55], [side * .81, .07, -1.2],
        [side * 1.01, .06, -1.65]], .019);
      for (let j = 0; j < 2; j++) {
        const spray = pebble(world, C.foam, [side * (.64 + j * .14), .17 + j * .055, -.7 - j * .3], [.035, .08, .025]);
        spray.rotation.z = -side * .5;
        sprayDrops.push({spray, y: spray.position.y, z: spray.position.z, offset: j + side});
      }
    }
    function update(t, pointer) {
      t = clock(t);
      const lean = Math.sin(t * 1.35);
      p.hips.position.x = .075 * lean;
      p.hips.position.y = .74 + .045 * Math.sin(t * 2.7);
      p.torso.rotation.x = .12 + .065 * lean;
      p.torso.rotation.z = -.11 * lean;
      p.torso.rotation.y = .055 * lean;
      p.head.rotation.x = -.09;
      p.head.rotation.y = .04 * gaze(pointer);
      for (let i = 0; i < 2; i++) {
        rig.leg(i, feet[i], knees[i]);
        rig.arm(i, hands[i], elbows[i]);
        wakes[i].position.y = .025 * Math.sin(t * 1.35 + i * .4);
        wakes[i].position.z = .16 * Math.sin(t * 1.7 + i * .45) * Math.sin(t * .85);
      }
      for (const {spray, y, z, offset} of sprayDrops) {
        spray.position.y = y + .055 * Math.sin(t * 2.2 + offset) * Math.sin(t * 1.1);
        spray.position.z = z + .12 * lean;
      }
    }
    update(0);
    return {target: [0, 1.02, 0], distance: 8.1, elevation: 2.15, update};
  }

  function paddle(scene) {
    const world = group(scene);
    world.name = 'adventure-standing-paddleboard';
    world.rotation.y = -.47;
    water(world, 1.6, 2.02);
    board(world, C.gold, 3.65, .93, .15, [0, .09, 0], .085).name = 'single-long-SUP-board';
    board(world, C.cream, 3.40, .84, .025, [0, .178, 0], .07);
    board(world, C.emerald, 1.45, .66, .014, [0, .2, -.2], 0).name = 'SUP-standing-deck';
    // Deck grooves and nose tie-downs make the broad SUP distinct from skis.
    for (const z of [-.65, -.45, -.25, -.05, .15, .35]) {
      rod(world, C.mint, [-.24, .21, z], [.24, .21, z], .009);
    }
    for (const z of [.92, 1.12]) rod(world, C.coral, [-.27, .207, z], [.27, .207, z + .12], .016);
    const p = person(world, {shirt: C.emerald, pants: C.ink, vest: true});
    p.root.position.set(0, .208, -.18);
    const rig = poseRig(p);
    const feet = anchors([[-.22, .09, .08], [.22, .09, -.10]]);
    const knees = anchors([[-.22, .45, .4], [.22, .45, .25]]);
    // The top hand crosses the chest to the T grip; the lower hand grips shaft.
    const hands = anchors([[.22, 1.65, .22], [.473, 1.03, .278]]);
    const elbows = anchors([[-.15, 1.96, .22], [.72, 1.39, .30]]);
    const tool = group(p.root, [.22, 1.65, .22]);
    tool.name = 'held-paddle-blade-in-water';
    rod(tool, C.ink, [0, 0, 0], [.69, -1.6925, .159], .025);
    rod(tool, C.gold, [-.1, 0, 0], [.1, 0, 0], .033);
    const blade = pebble(tool, C.coral, [.69, -1.6925, .159], [.145, .27, .045]);
    blade.rotation.z = .387;
    blade.rotation.x = -.092;
    rod(tool, C.gold, [.52, -1.275, .12], [.65, -1.595, .15], .031);
    const gripPoints = anchors([[0, 0, 0], [.69 * (.62 / 1.6925), -.62, .159 * (.62 / 1.6925)]]);
    const bladePosition = new THREE.Vector3();
    // Board leash attaches to the rear ankle; neither a seated pose nor a raft.
    curve(p.root, C.ink, [[.24, .14, -.10], [.37, .05, -.38], [.35, -.01, -.76],
      [.15, -.01, -1.14]], .014);
    const ripple = loop(world, C.foam, .23, .018, [.91, .053, .2], [Math.PI / 2, 0, 0]);
    ripple.scale.set(1, .7, 1);
    curve(world, C.foam, [[.98, .052, .58], [1.18, .052, .35], [1.21, .052, .02]], .014);
    function update(t, pointer) {
      t = clock(t);
      const cycle = phase(t, 4.4), pulling = cycle <= .48;
      const recovery = pulling ? 0 : (cycle - .48) / .52;
      const lift = Math.sin(Math.PI * recovery) ** 2;
      tool.rotation.x = pulling ? -.24 + .48 * ease(cycle / .48) : .24 - .48 * ease(recovery);
      tool.rotation.y = .20 * lift;
      tool.position.y = 1.65 + .31 * lift;
      p.hips.position.y = .88 - .025 * Math.sin(cycle * Math.PI * 2);
      p.hips.position.z = -.02;
      p.torso.rotation.x = -.035 * Math.sin(cycle * Math.PI * 2);
      p.torso.rotation.y = .09 * Math.sin(cycle * Math.PI * 2);
      p.torso.rotation.z = -.035 - .045 * Math.sin(cycle * Math.PI * 2);
      p.head.rotation.y = .07 + .04 * gaze(pointer);
      for (let i = 0; i < 2; i++) {
        rig.leg(i, feet[i], knees[i]);
        hands[i].copy(gripPoints[i]);
        tool.localToWorld(hands[i]);
        p.root.worldToLocal(hands[i]);
        rig.arm(i, hands[i], elbows[i]);
      }
      blade.getWorldPosition(bladePosition);
      world.worldToLocal(bladePosition);
      ripple.position.set(bladePosition.x, .053, bladePosition.z);
      ripple.visible = lift < .16;
      const spread = 1 + .16 * Math.sin(cycle * Math.PI * 2);
      ripple.scale.set(spread, .7 * spread, 1);
    }
    update(0);
    return {target: [0, 1.18, 0], distance: 8.15, elevation: 2.0, update};
  }

  function nature(scene) {
    const world = group(scene);
    world.name = 'adventure-nature-bird';
    plinth(world, C.pale, 1.65).scale.z = .62;
    const branch = [[-1.55, .15, -.05], [-1.02, .69, .1], [-.35, .98, .18],
      [.15, 1.04, .24], [.82, 1.08, .16], [1.5, 1.31, -.03]];
    curve(world, C.emerald, branch, .061);
    curve(world, C.emerald, [[.82, 1.08, .16], [1.46, 1.62, -.1], [1.55, 2.25, -.32]], .031);
    curve(world, C.leaf, [[-1.02, .69, .1], [-1.4, 1.14, -.05], [-1.52, 1.6, -.15]], .029);
    const leaves = [];
    for (const [x, y, z, size, angle, color] of [
      [-1.08, .61, .12, .62, 1.2, C.leaf], [-1.35, 1.05, -.06, .55, .85, C.mint],
      [-1.49, 1.35, -.13, .57, -.30, C.emerald], [-1.51, 1.56, -.15, .45, .46, C.gold],
      [1.1, 1.18, .08, .65, -1.6, C.mint], [1.44, 1.58, -.1, .62, -1.1, C.leaf],
      [1.49, 1.87, -.22, .51, .64, C.mint], [1.55, 2.16, -.29, .48, -.32, C.emerald],
    ]) {
      const mesh = leaf(world, color, [x, y, z], size, size * .46, angle);
      leaves.push({mesh, angle});
    }
    const bird = group(world, [.15, 1.45, .20]);
    bird.name = 'bird-with-articulated-wings';
    pebble(bird, C.emerald, [0, -.015, 0], [.29, .35, .37]);
    pebble(bird, C.cream, [0, -.09, .267], [.225, .25, .11]);
    const head = group(bird, [0, .27, .20]);
    pebble(head, C.emerald, [0, 0, 0], [.245, .235, .245]);
    for (const x of [-.13, .13]) {
      pebble(head, C.cream, [x, .035, .196], [.077, .083, .041]);
      pebble(head, C.ink, [x, .036, .231], [.035, .043, .017]);
      pebble(head, C.foam, [x + .01, .052, .246], [.011, .014, .006]);
    }
    const beak = new THREE.Mesh(geom('adventure:beak', () =>
      new THREE.ConeGeometry(.095, .23, 5)), material(C.gold));
    beak.position.set(0, -.052, .30);
    beak.rotation.x = Math.PI / 2;
    head.add(beak);
    const crest = leaf(head, C.gold, [-.045, .19, -.03], .22, .11, .18, -.05);
    crest.rotation.x = -.5;
    for (const side of [-1, 1]) {
      const tail = leaf(bird, side < 0 ? C.coral : C.gold, [side * .07, -.16, -.23], .55, .18, -side * .20, side * .04);
      tail.rotation.x = -2.2;
      rod(bird, C.gold, [side * .105, -.27, .05], [side * .105, -.39, .075], .019);
      for (const spread of [-1, 1]) curve(bird, C.gold,
        [[side * .105, -.37, .075], [side * .105 + spread * .055, -.39, .14],
          [side * .105 + spread * .065, -.44, .16]], .015);
    }
    const wings = [];
    for (const side of [-1, 1]) {
      const wing = group(bird, [side * .22, .04, -.06]);
      leaf(wing, C.emerald, [0, 0, 0], .98, .48, 0, side * .14);
      for (let i = 0; i < 3; i++) {
        leaf(wing, i === 0 ? C.gold : C.coral, [(i - 1) * .13, .30, .07],
          .68 - i * .075, .18, (i - 1) * -.19, side * .10);
      }
      wings.push({wing, side});
    }
    sprig(world, [-.55, .025, .5], .62);
    for (const [x, z, s] of [[.67, .35, .28], [.98, .18, .17], [-1.12, .31, .21]]) {
      pebble(world, C.cream, [x, .07, z], [s, .11, s * .65]);
    }
    function update(t, pointer) {
      t = clock(t);
      // A small takeoff, glide and return arc; the rest frame is on the branch.
      const flight = Math.sin(Math.PI * phase(t, 7.2)) ** 2;
      const travel = Math.sin(Math.PI * 2 * phase(t, 7.2));
      bird.position.set(.15 + .20 * travel * flight, 1.45 + .31 * flight, .20 + .10 * flight);
      bird.rotation.z = -.07 * travel * flight;
      for (const {wing, side} of wings) {
        wing.rotation.z = -side * (1.04 + (.36 + .17 * flight) * Math.sin(t * 3.1));
        wing.rotation.y = side * (.20 + .09 * Math.sin(t * 3.1 - .4) * Math.sin(t * 1.55));
      }
      head.rotation.z = -.10 + .035 * Math.sin(t * .75);
      head.rotation.y = .07 * gaze(pointer);
      for (let i = 0; i < leaves.length; i++) {
        leaves[i].mesh.rotation.z = leaves[i].angle + .085 * Math.sin(t * .9 + i * .35) * Math.sin(t * .45);
      }
    }
    update(0);
    return {target: [0, 1.33, 0], distance: 8.15, elevation: .85, update};
  }

  return {hike, bungee, ski, paddle, nature};
}
