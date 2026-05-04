import React from 'react';

interface GlassPaneProps {
  width: number;
  height: number;
  type: 'clear' | 'frosted' | 'tinted';
}

export function GlassPane({ width, height, type }: GlassPaneProps) {
  // Architectural glass thickness (e.g. 10mm)
  const thickness = 0.01;

  const getMaterialProps = () => {
    switch (type) {
      case 'frosted':
        return {
          transmission: 0.9,
          roughness: 0.7,
          color: '#ffffff',
          ior: 1.5,
          thickness: 0.05,
        };
      case 'tinted':
        return {
          transmission: 0.85,
          roughness: 0.05,
          color: '#94a3b8', // slate-400
          ior: 1.5,
          thickness: 0.05,
        };
      case 'clear':
      default:
        return {
          transmission: 1,
          roughness: 0.02,
          color: '#ffffff',
          ior: 1.5,
          thickness: 0.05, // Slightly exaggerated for R3F mapping to show volume
        };
    }
  };

  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[width, height, thickness]} />
      <meshPhysicalMaterial transparent {...getMaterialProps()} />
    </mesh>
  );
}
