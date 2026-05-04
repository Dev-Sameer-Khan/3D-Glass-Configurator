import React from 'react';

interface HardwareProps {
  width: number;
  height: number;
}

export function Hardware({ width, height }: HardwareProps) {
  const patchWidth = 0.08;
  const patchHeight = 0.05;
  const patchDepth = 0.04;
  
  // Offset 50mm from the top and bottom edge
  const verticalOffset = 0.05;

  return (
    <group>
      {/* Top Patch Fitting (Hinge) */}
      <mesh position={[-width / 2 + patchWidth / 2, height / 2 - verticalOffset - patchHeight / 2, 0]} castShadow>
        <boxGeometry args={[patchWidth, patchHeight, patchDepth]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Bottom Patch Fitting (Hinge) */}
      <mesh position={[-width / 2 + patchWidth / 2, -height / 2 + verticalOffset + patchHeight / 2, 0]} castShadow>
        <boxGeometry args={[patchWidth, patchHeight, patchDepth]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
      </mesh>
      
      {/* Minimal Handle on the opposite (right) edge */}
      <mesh position={[width / 2 - 0.03, 0, 0]} castShadow>
        <cylinderGeometry args={[0.01, 0.01, 0.4, 16]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
      </mesh>
    </group>
  );
}
