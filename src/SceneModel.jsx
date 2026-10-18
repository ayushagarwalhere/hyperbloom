'use client';

import { useFrame } from '@react-three/fiber';
import { Float, useGLTF } from '@react-three/drei';
import { useRef } from 'react';

export default function SceneModel({ scene }) {
  const group = useRef(null);
  const { scene: asset } = useGLTF(scene.file);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.08;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.35) * 0.025;
  });

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.3}>
      <group ref={group} position={scene.position} scale={scene.scale}>
        <primitive object={asset.clone()} />
      </group>
    </Float>
  );
}
