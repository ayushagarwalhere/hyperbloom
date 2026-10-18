'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Float, OrbitControls, useGLTF } from '@react-three/drei';
import { Suspense, useRef } from 'react';

const scenes = [
  { label: 'A place to land', file: '/models/window.glb', scale: 2.6, position: [0, -1.15, 0] },
  { label: 'A wider view', file: '/models/wanderer_above_the_sea_of_fog.glb', scale: 1.15, position: [0, -1.25, 0] },
  { label: 'Room to breathe', file: '/models/dalithe_persistence_of_memory.glb', scale: 1.4, position: [0, -1.05, 0] },
];

function Model({ scene }) {
  const group = useRef(null);
  const { scene: model } = useGLTF(scene.file);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.08;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.35) * 0.025;
  });

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.3}>
      <group ref={group} position={scene.position} scale={scene.scale}>
        <primitive object={model.clone()} />
      </group>
    </Float>
  );
}

function SceneContent({ scene }) {
  return (
    <>
      <ambientLight intensity={1.7} />
      <directionalLight position={[3, 5, 4]} intensity={3.2} color="#e7f6dc" />
      <pointLight position={[-4, 0, 2]} intensity={3} color="#96c89e" />
      <Suspense fallback={null}>
        <Model scene={scene} />
        <Environment preset="forest" environmentIntensity={0.45} />
        <ContactShadows position={[0, -1.4, 0]} opacity={0.45} scale={5} blur={2.4} far={4} />
      </Suspense>
      <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 2.5} maxPolarAngle={Math.PI / 1.8} />
    </>
  );
}

export default function CrisisScene({ activeScene = 0 }) {
  const scene = scenes[activeScene] || scenes[0];
  return (
    <div className="scene-wrap">
      <Canvas camera={{ position: [0, 0.25, 4.2], fov: 35 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <SceneContent scene={scene} />
      </Canvas>
      <div className="scene-caption"><span>{String(activeScene + 1).padStart(2, '0')}</span><strong>{scene.label}</strong><small>Drag to explore</small></div>
    </div>
  );
}

scenes.forEach((scene) => useGLTF.preload(scene.file));
