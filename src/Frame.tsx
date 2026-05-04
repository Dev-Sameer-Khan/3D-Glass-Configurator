import React from "react";

interface FrameProps {
  width: number;
  height: number;
  thickness: number;
  isWindow: boolean;

}

export function Frame({ width, height, thickness, isWindow }: FrameProps) {
  const depth = 0.06; // 60mm depth

  // 4 Profiles wrapping the perimeter of the given glass size
  return (
    <group>
      {/* Top Profile */}
      <mesh
        position={[0, height / 2 + thickness / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width + thickness * 2, thickness, depth]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Bottom Profile */}
      <mesh
        position={[0, -height / 2 - thickness / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width + thickness * 2, thickness, depth]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Left Profile */}
      <mesh
        position={[-width / 2 - thickness / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[thickness, height, depth]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Right Profile */}
      <mesh
        position={[width / 2 + thickness / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[thickness, height, depth]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>

      <mesh position={[isWindow ? width / 20 : width / 2 - 0.1, 0, 0]} castShadow>
 
        <cylinderGeometry args={[0.01, 0.01, 0.4, 16]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.85}
          roughness={0.2}
        />
      </mesh>
      {isWindow && (
        <mesh position={[isWindow ? -width / 20 : width / 2 - 0.1, 0, 0.01]} castShadow>
          <cylinderGeometry args={[0.01, 0.01, 0.4, 16]} />
          <meshStandardMaterial
            color="#334155"
            metalness={0.85}
            roughness={0.2}
          />
        </mesh>
      )}
    </group>
  );
}
