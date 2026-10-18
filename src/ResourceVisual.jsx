'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const BLOCK = 0.74;
const GAP = 0.78;
const MAIN = [
  { key: 'start', label: 'start here', at: [0.35, 0.05, 0.18], size: 0.88 },
  { key: 'shelter', label: 'shelter', at: [-1.65, 1.3, -0.15], size: 0.77 },
  { key: 'food', label: 'food support', at: [-0.15, 1.65, 0.6], size: 0.77 },
  { key: 'alerts', label: 'weather alerts', at: [-1.55, -1.2, 0.4], size: 0.77 },
  { key: '988', label: '988 · talk to someone', at: [1.15, -1.05, -0.3], size: 0.77 },
];
const MAIN_CELLS = [13, 4, 10, 16, 22];
const MAIN_LINKS = [['start', 'shelter'], ['start', 'food'], ['start', 'alerts'], ['start', '988']];

const clamp01 = (n) => Math.min(1, Math.max(0, n));
const smooth = (x) => x * x * x * (x * (x * 6 - 15) + 10);

function seeded(seed = 417) {
  let state = seed >>> 0;
  return () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function makeWorld() {
  const root = new THREE.Group();
  const disposables = [];
  const keep = (item) => (disposables.push(item), item);
  const geometry = keep(new RoundedBoxGeometry(BLOCK, BLOCK, BLOCK, 3, 0.09));
  const metal = keep(new THREE.MeshPhysicalMaterial({ color: '#111315', metalness: 0.64, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1.35 }));
  const centerMetal = keep(new THREE.MeshPhysicalMaterial({ color: '#c84f32', metalness: 0.3, roughness: 0.24, clearcoat: 1, clearcoatRoughness: 0.1, emissive: '#4a1008', emissiveIntensity: 0.23, envMapIntensity: 1.2 }));
  const linkMaterial = keep(new THREE.MeshStandardMaterial({ color: '#a2aaa7', metalness: 0.7, roughness: 0.36, transparent: true, opacity: 0 }));
  const outerLinkMaterial = keep(new THREE.MeshBasicMaterial({ color: '#b9c2bc', transparent: true, opacity: 0 }));
  const random = seeded();
  const cells = [];
  for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) for (const z of [-1, 0, 1]) {
    cells.push(new THREE.Vector3(x, y, z).multiplyScalar(GAP));
  }

  const mainByKey = Object.fromEntries(MAIN.map((node) => [node.key, node]));
  const roleByCell = new Map(MAIN_CELLS.map((cell, i) => [cell, MAIN[i]]));
  const pieces = [];
  const byKey = {};
  const linksFrom = new Map();

  cells.forEach((from, index) => {
    const node = roleByCell.get(index);
    let to;
    let scaleTo;
    let role;
    if (node) {
      to = new THREE.Vector3(...node.at);
      scaleTo = node.size / BLOCK;
      role = node.key;
      byKey[node.key] = null;
    } else {
      // The surrounding pieces form a loose service network around the four primary routes.
      const ordinal = index - MAIN_CELLS.filter((cell) => cell < index).length;
      const angle = ordinal * 2.399963229728653;
      const y = 1 - 2 * ((ordinal + 0.5) / 22);
      const radius = 3.1 + random() * 0.9;
      const ring = Math.sqrt(1 - y * y);
      to = new THREE.Vector3(Math.cos(angle) * ring * radius, y * radius * 0.78, Math.sin(angle) * ring * radius);
      scaleTo = 0.34 + random() * 0.12;
      role = `route-${index}`;
    }
    const mesh = new THREE.Mesh(geometry, node?.key === 'start' ? centerMetal : metal);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.copy(from);
    root.add(mesh);
    const piece = {
      mesh,
      from: from.clone(),
      to,
      scaleTo,
      role,
      delay: random() * 0.2,
      spin: new THREE.Vector3(random() - 0.5, random() - 0.5, random() - 0.5).multiplyScalar(5.4),
      key: node?.key,
    };
    pieces.push(piece);
    if (node) byKey[node.key] = piece;
    else {
      const nearest = MAIN.slice(1).reduce((closest, target) => {
        const distance = to.distanceTo(new THREE.Vector3(...target.at));
        return distance < closest.distance ? { target, distance } : closest;
      }, { target: MAIN[1], distance: Infinity }).target;
      linksFrom.set(index, nearest.key);
    }
  });

  const at = Object.fromEntries(MAIN.map((node) => [node.key, new THREE.Vector3(...node.at)]));
  const addTube = (a, b, radius, material) => {
    const line = keep(new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 1, radius, 6, false));
    root.add(new THREE.Mesh(line, material));
  };
  MAIN_LINKS.forEach(([a, b]) => addTube(at[a], at[b], 0.014, linkMaterial));
  pieces.forEach((piece, index) => {
    const parentKey = linksFrom.get(index);
    if (parentKey) addTube(piece.to, at[parentKey], 0.005, outerLinkMaterial);
  });

  return {
    root, pieces, byKey, linkMaterial, outerLinkMaterial, amount: 0, hover: 0, clock: 0,
    dispose: () => disposables.forEach((item) => item.dispose()),
  };
}

function Environment() {
  const get = useThree((state) => state.get);
  useEffect(() => {
    const { gl, scene } = get();
    const pmrem = new THREE.PMREMGenerator(gl);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environment;
    scene.environmentIntensity = 0.9;
    return () => { scene.environment = null; environment.dispose(); pmrem.dispose(); };
  }, [get]);
  return null;
}

function makeSmokeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);
  for (let i = 0; i < 11; i += 1) {
    const x = 38 + ((i * 47) % 56);
    const y = 40 + ((i * 29) % 52);
    const radius = 18 + ((i * 13) % 22);
    const puff = ctx.createRadialGradient(x, y, 1, x, y, radius);
    puff.addColorStop(0, 'rgba(255,255,255,0.17)');
    puff.addColorStop(0.52, 'rgba(255,255,255,0.09)');
    puff.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = puff;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  return new THREE.CanvasTexture(canvas);
}

function SmokeField({ progress, weather, reducedMotion }) {
  const group = useRef(null);
  const texture = useMemo(makeSmokeTexture, []);
  const clouds = useRef([]);
  const particles = useRef(null);
  if (!particles.current) {
    particles.current = Array.from({ length: 26 }, (_, index) => ({
      x: Math.sin(index * 13.7) * 3.9,
      y: Math.cos(index * 4.3) * 2.7,
      z: -2.5 - (index % 5) * 0.16,
      scale: 1.25 + (index % 4) * 0.47,
      phase: index * 0.41,
    }));
  }
  useEffect(() => () => texture.dispose(), [texture]);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const p = progress.current || 0;
    const time = reducedMotion ? 0 : clock.elapsedTime;
    group.current.position.x = Math.sin(time * 0.05) * 0.28 + p * 0.42;
    group.current.position.y = Math.sin(time * 0.035) * 0.12 + p * 0.26;
    group.current.rotation.z = Math.sin(time * 0.025) * 0.018;
    clouds.current.forEach((sprite, index) => {
      if (!sprite) return;
      const item = particles.current[index];
      sprite.position.x = item.x + (reducedMotion ? 0 : Math.sin(time * 0.08 + item.phase) * 0.12);
      sprite.position.y = item.y + (reducedMotion ? 0 : Math.cos(time * 0.045 + item.phase) * 0.1);
      const material = sprite.material;
      material.opacity = (weather === 'day' ? 0.24 : 0.34) * (0.7 + p * 0.3);
    });
  });
  return <group ref={group}>
    {particles.current.map((item, index) => <sprite key={index} ref={(node) => { clouds.current[index] = node; }} position={[item.x, item.y, item.z]} scale={[item.scale * 1.9, item.scale, 1]}>
      <spriteMaterial map={texture} color={weather === 'day' ? '#e7c895' : '#8c9eae'} transparent opacity={weather === 'day' ? 0.24 : 0.34} depthWrite={false} />
    </sprite>)}
  </group>;
}

function JourneyWindow({ progress, weather }) {
  const sash = useRef(null);
  const tint = weather === 'day' ? '#ffd99a' : '#c0d0e0';
  useFrame((state, delta) => {
    if (!sash.current) return;
    const p = progress.current || 0;
    const target = -p * 1.08;
    sash.current.rotation.y += (target - sash.current.rotation.y) * (1 - Math.exp(-Math.min(delta, 0.05) * 5));
    sash.current.position.x = -1.65 - p * 0.16;
  });
  const bar = (position, size, opacity = 0.22) => <mesh position={position}>
    <boxGeometry args={size} />
    <meshBasicMaterial color={tint} transparent opacity={opacity} depthWrite={false} />
  </mesh>;
  return <group position={[0, 0, -2.05]}>
    {bar([0, 2.2, 0], [3.65, 0.045, 0.035])}{bar([0, -2.2, 0], [3.65, 0.045, 0.035])}
    {bar([-1.8, 0, 0], [0.045, 4.45, 0.035])}{bar([1.8, 0, 0], [0.045, 4.45, 0.035])}
    <group ref={sash} position={[-1.65, 0, 0]}>
      {bar([0.82, 1.04, 0], [1.64, 0.035, 0.025], 0.16)}{bar([0.82, -1.04, 0], [1.64, 0.035, 0.025], 0.16)}
      {bar([0, 0, 0], [0.035, 2.1, 0.025], 0.16)}{bar([1.64, 0, 0], [0.035, 2.1, 0.025], 0.16)}
      {bar([0.82, 0, 0], [1.64, 0.025, 0.025], 0.12)}{bar([0.82, 0, 0], [0.025, 2.1, 0.025], 0.12)}
    </group>
  </group>;
}

function ResourceGraph({ control, reducedMotion, labels, scrollProgress, weather }) {
  const group = useRef(null);
  const world = useRef(null);
  const get = useThree((state) => state.get);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    const made = makeWorld();
    const host = group.current;
    host?.add(made.root);
    world.current = made;
    const { gl, scene, camera } = get();
    const ready = gl.compileAsync ? gl.compileAsync(scene, camera) : Promise.resolve();
    ready.catch(() => undefined).then(() => invalidate());
    return () => { host?.remove(made.root); made.dispose(); world.current = null; };
  }, [get, invalidate]);

  useFrame((state, delta) => {
    const current = world.current;
    if (!current) return;
    const dt = Math.min(delta, 0.05);
    current.clock += dt;
    const t = current.clock;
    const scroll = scrollProgress.current || 0;
    if (Math.abs(scroll - control.current.lastScroll) > 0.002) {
      control.current.manual = false;
      control.current.lastScroll = scroll;
    }
    const target = control.current.manual ? (control.current.open ? 1 : 0) : scroll;
    current.amount = reducedMotion ? target : current.amount + (target - current.amount) * (1 - Math.exp(-dt * 2.6));
    if (Math.abs(target - current.amount) < 0.001) current.amount = target;
    current.hover += ((!control.current.open && control.current.hovering && !reducedMotion ? 1 : 0) - current.hover) * (1 - Math.exp(-dt * 8));

    current.pieces.forEach((piece) => {
      const progress = smooth(clamp01((current.amount - piece.delay) / 0.78));
      piece.mesh.position.lerpVectors(piece.from, piece.to, progress);
      const arc = piece.from.clone().normalize().multiplyScalar(Math.sin(Math.PI * progress) * 0.72);
      piece.mesh.position.add(arc);
      if (progress === 0) piece.mesh.position.multiplyScalar(1 + 0.045 * current.hover);
      const tumble = Math.sin(Math.PI * progress);
      piece.mesh.rotation.set(
        piece.spin.x * tumble,
        piece.spin.y * tumble + (progress === 1 && !reducedMotion ? Math.sin(t * 0.58 + piece.delay * 18) * 0.08 : 0),
        piece.spin.z * tumble,
      );
      piece.mesh.scale.setScalar(THREE.MathUtils.lerp(1, piece.scaleTo, progress));
    });

    const open = smooth(current.amount);
    current.root.scale.setScalar(THREE.MathUtils.lerp(1, 0.86, open));
    const desiredY = (reducedMotion ? -0.58 : control.current.open ? Math.sin(t * 0.22) * 0.29 - 0.2 : t * 0.18 - 0.58) + state.pointer.x * 0.16 + control.current.drag.x;
    const desiredX = (reducedMotion ? 0.32 : control.current.open ? Math.sin(t * 0.17) * 0.06 + 0.08 : 0.36) - state.pointer.y * 0.09 + control.current.drag.y;
    if (reducedMotion) current.root.rotation.set(desiredX, desiredY, 0);
    else {
      current.root.rotation.y += (desiredY - current.root.rotation.y) * (1 - Math.exp(-dt * 3.5));
      current.root.rotation.x += (desiredX - current.root.rotation.x) * (1 - Math.exp(-dt * 3.5));
    }
    current.linkMaterial.opacity = 0.74 * open;
    current.outerLinkMaterial.opacity = 0.16 * open;

    const showLabels = current.amount > 0.94;
    MAIN.forEach((node) => {
      const piece = current.byKey[node.key];
      const element = labels.current[node.key];
      if (!piece || !element) return;
      const position = piece.mesh.getWorldPosition(new THREE.Vector3());
      position.y += node.size * 0.7;
      position.project(state.camera);
      const x = (position.x * 0.5 + 0.5) * state.size.width;
      const y = (-position.y * 0.5 + 0.5) * state.size.height;
      element.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`;
      element.style.opacity = showLabels ? '1' : '0';
    });
  });

  return <><SmokeField progress={scrollProgress} weather={weather} reducedMotion={reducedMotion} /><JourneyWindow progress={scrollProgress} weather={weather} /><group ref={group} /></>;
}

function InvalidateOnChange({ open }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => { invalidate(); }, [open, invalidate]);
  return null;
}

export default function ResourceVisual({ scrollProgress = { current: 0 }, weather = 'storm' }) {
  const wrapper = useRef(null);
  const pointer = useRef(null);
  const control = useRef({ open: false, manual: false, lastScroll: 0, hovering: false, drag: { x: 0, y: 0 } });
  const labels = useRef({});
  const [open, setOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener?.('change', update);
    return () => preference.removeEventListener?.('change', update);
  }, []);

  const toggle = () => {
    const next = !control.current.open;
    control.current.open = next;
    control.current.manual = true;
    setOpen(next);
  };

  const label = (key, text) => <div key={key} ref={(element) => { labels.current[key] = element; }} className={`resource-node-label ${key === 'start' ? 'primary' : ''}`} aria-hidden="true">{text}</div>;

  return <div
    ref={wrapper}
    className="resource-visual-3d"
    role="button"
    tabIndex={0}
    aria-pressed={open}
    aria-label={open ? 'Close the resource map and return all 27 blocks to the cube' : 'Open the resource map by separating the 27 blocks into a connected graph'}
    onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); } }}
    onPointerEnter={() => { control.current.hovering = true; }}
    onPointerLeave={() => { control.current.hovering = false; pointer.current = null; }}
    onPointerDown={(event) => {
      if (event.button !== 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      pointer.current = { x: event.clientX, y: event.clientY, dx: control.current.drag.x, dy: control.current.drag.y, moved: false };
    }}
    onPointerMove={(event) => {
      const drag = pointer.current;
      if (!drag) return;
      if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 6) drag.moved = true;
      control.current.drag.x = drag.dx + (event.clientX - drag.x) * 0.006;
      control.current.drag.y = THREE.MathUtils.clamp(drag.dy + (event.clientY - drag.y) * 0.004, -0.5, 0.5);
    }}
    onPointerUp={() => { if (pointer.current && !pointer.current.moved) toggle(); pointer.current = null; }}
    onPointerCancel={() => { pointer.current = null; }}
  >
    <Canvas className="resource-canvas" dpr={[1, 1.4]} camera={{ position: [0, 0.25, 8.2], fov: 36 }} frameloop={reducedMotion ? 'demand' : 'always'} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}>
      <Environment />
      <ambientLight intensity={weather === 'day' ? 0.48 : 0.32} />
      <directionalLight position={[4, 6, 5]} intensity={weather === 'day' ? 2.1 : 1.75} color={weather === 'day' ? '#ffe0ac' : '#ffffff'} />
      <directionalLight position={[-6, 1, -5]} intensity={0.42} color={weather === 'day' ? '#f4b76e' : '#cbd4ff'} />
      <ResourceGraph control={control} reducedMotion={reducedMotion} labels={labels} scrollProgress={scrollProgress} weather={weather} />
      {reducedMotion && <InvalidateOnChange open={open} />}
    </Canvas>
    <div className="resource-map-labels" aria-hidden="true">{MAIN.map((node) => label(node.key, node.label))}</div>
    <div className="resource-visual-hint" aria-hidden="true"><span className={open ? '' : 'pulsing'} />{open ? 'CLICK TO CLOSE' : 'CLICK THE CUBE'}</div>
  </div>;
}
