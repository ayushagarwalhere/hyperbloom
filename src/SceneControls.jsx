'use client';

import { OrbitControls } from '@react-three/drei';

export default function SceneControls() {
  return (
    <OrbitControls
      enablePan={false}
      enableZoom={false}
      minPolarAngle={Math.PI / 2.5}
      maxPolarAngle={Math.PI / 1.8}
      rotateSpeed={0.45}
    />
  );
}
