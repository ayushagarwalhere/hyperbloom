'use client';

import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Cloud, Clouds } from '@react-three/drei/core/Cloud.js';
import { Text } from '@react-three/drei/core/Text.js';
import { Stars } from '@react-three/drei/core/Stars.js';
import { useGLTF } from '@react-three/drei/core/Gltf.js';
import * as THREE from 'three';
import { clamp01, sampleJourney, smoothRange } from './journeyPath';

// Camera path, cloud banks and window choreography adapted from Atmos / Mohit Virli.
const BANKS = [
  { seed: 1, position: [-1, 0, 0], bounds: [10, 10, 10], scale: 1.9, volume: 2, growth: 3, fade: 5, speed: .2, concentrate: 'inside' },
  { seed: 3, position: [2, 0, 2], bounds: [10, 10, 10], scale: 1, volume: 2, growth: 2, fade: 3, speed: .1, concentrate: 'outside' },
  { seed: 4, position: [-10, -10, 4], bounds: [10, 20, 15], scale: 2, volume: 3, growth: 4, fade: 10, speed: .2, concentrate: 'outside' },
  { seed: 5, position: [6, -3, 8], bounds: [5, 5, 5], scale: 2, volume: 2, growth: 2, fade: .1, speed: .1, concentrate: 'outside' },
  { seed: 6, position: [0, -20, 20], bounds: [5, 5, 5], scale: 4, volume: 3, growth: 2, fade: .1, speed: .1, concentrate: 'outside' },
  { seed: 7, position: [10, -15, -5], bounds: [5, 5, 5], scale: 3, volume: 3, growth: 2, fade: .1, speed: .1, concentrate: 'outside' },
];

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="intro-fallback"><p>Through every storm,<br />help is closer.</p><a href="#cube">Explore Harborline ↓</a></div> : this.props.children; }
}

function CameraJourney({ signal, reduced, invalidateRef }) {
  const progress = useRef(0);
  const invalidate = useThree(state => state.invalidate);
  useEffect(() => { invalidateRef.current = invalidate; return () => { invalidateRef.current = null; }; }, [invalidate, invalidateRef]);
  useFrame((state, delta) => {
    progress.current = reduced ? 0 : THREE.MathUtils.damp(progress.current, signal.current, 7, Math.min(delta, .05));
    const path = sampleJourney(progress.current);
    state.camera.position.set(path.x, path.y, path.z);
    state.camera.rotation.set(path.pitch, reduced ? 0 : -state.pointer.x * Math.PI / 110, 0, 'YXZ');
    state.camera.updateMatrixWorld();
  }, -1);
  return null;
}

function FloatingWindow({ signal, reduced }) {
  const { nodes, materials } = useGLTF('/models/window.glb', '/draco/');
  const sash = useRef(null);
  const handle = useRef(null);
  const material = useMemo(() => {
    const result = materials.WIN0003_Textures.clone();
    result.transmission = 0;
    result.roughness = .35;
    return result;
  }, [materials]);
  useEffect(() => () => material.dispose(), [material]);
  useFrame((state, delta) => {
    const path = sampleJourney(reduced ? 0 : signal.current);
    const dt = Math.min(delta, .05);
    if (sash.current) sash.current.rotation.z = THREE.MathUtils.damp(sash.current.rotation.z, path.sash, 7, dt);
    if (handle.current) handle.current.rotation.y = THREE.MathUtils.damp(handle.current.rotation.y, path.handle, 7, dt);
  });
  return <group position={[0, -25, 5.69]} dispose={null}>
    <pointLight position={[1, 1, -2.5]} intensity={35} distance={12} />
    <group rotation={[0, Math.PI, Math.PI]}>
      <mesh geometry={nodes['#WIN0003_Frame_#WIN0003_Textures_0'].geometry} material={material} />
      <group position={[.441, -.039, .082]} ref={sash}>
        <mesh geometry={nodes['#WIN0003_Window_#WIN0003_Textures_0'].geometry} material={material} />
        <mesh ref={handle} geometry={nodes['#WIN0003_Handle_#WIN0003_Textures_0'].geometry} material={material} position={[-.84, -.018, .55]} />
      </group>
    </group>
  </group>;
}

function SkyScene({ signal, weather, reduced, invalidateRef }) {
  const width = useThree(state => state.size.width);
  const fontSize = width < 760 ? .95 : 1.85;
  return <>
    <ambientLight intensity={1.6} />
    <hemisphereLight args={['#ffffff', '#8eb1d1', 1.5]} />
    <directionalLight position={[5, 5, 8]} intensity={2} />
    <pointLight position={[0, -28, 6]} intensity={20} color="#a7c7e7" />
    {weather === 'storm' && <Stars radius={200} depth={100} count={3000} factor={10} saturation={0} fade speed={reduced ? 0 : 1} />}
    <Clouds material={THREE.MeshBasicMaterial} texture="/textures/cloud.png" position={[0, -5, 0]} limit={60} frustumCulled={false}>
      {BANKS.map(bank => <Cloud key={bank.seed} {...bank} segments={1} smallestVolume={2} color="#ffffff" speed={reduced ? 0 : bank.speed} />)}
    </Clouds>
    <group position={[0, 2, -10]}>
      <Text font="/fonts/manrope-variable.ttf" fontSize={fontSize} color="#ffffff" position={[0, .6, 0]} anchorX="center" anchorY="middle">Through every storm.</Text>
      <Text font="/fonts/manrope-variable.ttf" fontSize={fontSize} color="#ffffff" position={[0, -.9, 0]} anchorX="center" anchorY="middle">Help is closer.</Text>
    </group>
    <FloatingWindow signal={signal} reduced={reduced} />
    <CameraJourney signal={signal} reduced={reduced} invalidateRef={invalidateRef} />
  </>;
}

export default function OpeningJourney({ weather, onWeatherChange }) {
  const track = useRef(null);
  const stage = useRef(null);
  const signal = useRef(0);
  const invalidateRef = useRef(null);
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [available] = useState(() => {
    try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
  });
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReduced(preference.matches);
    change(); preference.addEventListener('change', change);
    return () => preference.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = track.current.getBoundingClientRect();
      const length = Math.max(1, track.current.offsetHeight - stage.current.offsetHeight);
      const p = reduced ? 0 : clamp01(-rect.top / length);
      signal.current = p;
      stage.current.style.setProperty('--intro-end', smoothRange(p, .78, .15));
      stage.current.style.setProperty('--intro-progress', p);
      stage.current.dataset.phase = p < .22 ? 'sky' : p < .48 ? 'clouds' : p < .68 ? 'window' : 'arrival';
      invalidateRef.current?.();
    };
    const requestUpdate = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new IntersectionObserver(([entry]) => { setVisible(entry.isIntersecting); invalidateRef.current?.(); });
    observer.observe(track.current);
    update(); window.addEventListener('scroll', requestUpdate, { passive: true }); window.addEventListener('resize', requestUpdate);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('scroll', requestUpdate); window.removeEventListener('resize', requestUpdate); };
  }, [reduced]);
  return <section className={`opening-journey${reduced || !available ? ' intro-static' : ''}`} ref={track} aria-label="Scroll through the sky, clouds, and an opening window">
    <div className="opening-stage" ref={stage} data-weather={weather}>
      <div className="opening-canvas" aria-hidden="true"><SceneBoundary>
        {available ? <Canvas dpr={[1, 1.6]} camera={{ position: [0, 0, 5], fov: 75, near: .01, far: 1000 }} gl={{ alpha: true, antialias: true }} frameloop={!visible ? 'never' : reduced ? 'demand' : 'always'}>
          <Suspense fallback={null}><SkyScene signal={signal} weather={weather} reduced={reduced} invalidateRef={invalidateRef} /></Suspense>
        </Canvas> : <div className="intro-fallback"><p>Through every storm.<br />Help is closer.</p></div>}
      </SceneBoundary></div>
      <h1 className="visually-hidden">Through every storm. Help is closer.</h1>
      <div className="intro-weather weather-mode" aria-label="Choose a weather scene">
        <button type="button" className={weather === 'day' ? 'selected' : ''} aria-pressed={weather === 'day'} onClick={() => onWeatherChange('day')}>☼ Sunny day</button>
        <button type="button" className={weather === 'storm' ? 'selected' : ''} aria-pressed={weather === 'storm'} onClick={() => onWeatherChange('storm')}>☾ Stormy night</button>
      </div>
      <a className="intro-skip" href="#cube">Skip intro ↗</a>
      <div className="intro-arrival"><span>HARBORLINE / A PLACE TO START</span><h2>A little clarity.<br />A way forward.</h2><a className="button light" href="#cube">Explore Harborline ↓</a></div>
      <div className="intro-scroll"><span>↓ Scroll to explore</span><i><b /></i></div>
    </div>
  </section>;
}
