import React from 'react';

interface HardwareProps {
  width: number;
  height: number;
  slidingOffset?: number;
  isWindow?: boolean;
}

export function Hardware({ width, height , isWindow}: HardwareProps) {
  const patchWidth = 0.08;
  const patchHeight = 0.05;
  const patchDepth = 0.04;
  
  // Offset 50mm from the top and bottom edge
  const verticalOffset = 0.05;
  const horizontalOffset = 0.0005;

  return (
    <group>
      {/* Top Patch Fitting (Hinge) */}
      <mesh position={[-width / 2 + patchWidth / 2 - horizontalOffset, height / 2 - verticalOffset - patchHeight / 2, 0]} castShadow>
        <boxGeometry args={[patchWidth, patchHeight, patchDepth]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Bottom Patch Fitting (Hinge) */}
      <mesh position={[-width / 2 + patchWidth / 2 - horizontalOffset, -height / 2 + verticalOffset + patchHeight / 2, 0]} castShadow>
        <boxGeometry args={[patchWidth, patchHeight, patchDepth]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
      </mesh>

      {isWindow && (
        <>
      <mesh position={[width / 2 - patchWidth / 2 - horizontalOffset, height / 2 - verticalOffset - patchHeight / 2, 0]} castShadow>
      <boxGeometry args={[patchWidth, patchHeight, patchDepth]} />
      <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
    </mesh>

    <mesh position={[width / 2 - patchWidth / 2 - horizontalOffset, -height / 2 + verticalOffset + patchHeight / 2, 0]} castShadow>
      <boxGeometry args={[patchWidth, patchHeight, patchDepth]} />
      <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
    </mesh>
        </>
      )}
      
      {/* Minimal Handle on the opposite (right) edge */}
      <mesh position={[isWindow ? width / 20: width / 2 - 0.03, 0, 0]} castShadow>
 
        <cylinderGeometry args={[0.01, 0.01, 0.4, 16]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
      </mesh>

      {isWindow && (
        <mesh position={[-width / 20, 0, 0]} castShadow>
 
        <cylinderGeometry args={[0.01, 0.01, 0.4, 16]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
      </mesh>
      )}
    </group>
  );
}
