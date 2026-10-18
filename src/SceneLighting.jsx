'use client';

import { ContactShadows, Environment } from '@react-three/drei';

export default function SceneLighting({ accent }) {
  return (
    <>
      <ambientLight intensity={1.7} />
      <directionalLight position={[3, 5, 4]} intensity={3.2} color="#e7f6dc" />
      <pointLight position={[-4, 0, 2]} intensity={3} color={accent} />
      <Environment preset="forest" environmentIntensity={0.45} />
      <ContactShadows position={[0, -1.4, 0]} opacity={0.45} scale={5} blur={2.4} far={4} />
    </>
  );
}
