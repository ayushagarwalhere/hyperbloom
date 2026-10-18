'use client';

import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Suspense, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useHarborlineStore } from './store/useHarborlineStore';
import { crisisScenes } from './lib/sceneData';
import SceneControls from './SceneControls';
import SceneLighting from './SceneLighting';
import SceneModel from './SceneModel';
import SceneOverlay from './SceneOverlay';

function SceneStage({ scene }) {
  const stage = useRef(null);

  useEffect(() => {
    gsap.fromTo(stage.current, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.75, ease: 'power3.out' });
  }, [scene.id]);

  return (
    <group ref={stage}>
      <SceneLighting accent={scene.accent} />
      <Suspense fallback={null}><SceneModel scene={scene} /></Suspense>
      <SceneControls />
    </group>
  );
}

export default function CrisisScene() {
  const activeScene = useHarborlineStore((state) => state.activeScene);
  const scene = crisisScenes[activeScene];

  return (
    <div className="scene-wrap">
      <Canvas camera={{ position: [0, 0.25, 4.2], fov: 35 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <SceneStage scene={scene} />
      </Canvas>
      <SceneOverlay />
    </div>
  );
}

crisisScenes.forEach((scene) => useGLTF.preload(scene.file));
