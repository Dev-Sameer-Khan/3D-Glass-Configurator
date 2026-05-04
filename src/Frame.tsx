import React from 'react';

interface FrameProps {
  width: number;
  height: number;
  thickness: number;
}

export function Frame({ width, height, thickness }: FrameProps) {
  const depth = 0.06; // 60mm depth

  // 4 Profiles wrapping the perimeter of the given glass size
  return (
    <group>
      {/* Top Profile */}
      <mesh position={[0, height / 2 + thickness / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + thickness * 2, thickness, depth]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Bottom Profile */}
      <mesh position={[0, -height / 2 - thickness / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + thickness * 2, thickness, depth]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Left Profile */}
      <mesh position={[-width / 2 - thickness / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[thickness, height, depth]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Right Profile */}
      <mesh position={[width / 2 + thickness / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[thickness, height, depth]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}
