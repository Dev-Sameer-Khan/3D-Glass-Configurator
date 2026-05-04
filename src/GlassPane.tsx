import { MeshTransmissionMaterial } from '@react-three/drei';
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
          transmission: 1,
          roughness: 0.72, // realistic moderate blur
          color: '#d1d5db', // very light gray
          ior: 1,
          thickness: 0.011, // physically accurate glass
          attenuationColor: '#b6bbc7', // a subtle blue-grey
          attenuationDistance: 0.14, // how quickly color fades
          envMapIntensity: 1.2,
          clearcoat: 1,
          clearcoatRoughness: 0.55,
        };
      case 'tinted':
        return {
          transmission: 0.81,
          roughness: 0.11,
          color: '#64748b', // deeper blue/grey tint
          ior: 1.5,
          thickness: 0.011,
          attenuationColor: '#475569', // dark blue-grey
          attenuationDistance: 0.08,
          envMapIntensity: 1.25,
          clearcoat: 1,
          clearcoatRoughness: 0.2,
        };
      case 'clear':
      default:
        return {
          transmission: 1,
          roughness: 0.06, // some micro-roughness avoids 'plastic' look
          color: '#f1f5f9', // off-white for realism
          ior: 1.52,
          thickness: 0.011,
          attenuationColor: '#e2e8f0', // subtle blue cast
          attenuationDistance: 0.22,
          envMapIntensity: 1.35,
          clearcoat: 1,
          clearcoatRoughness: 0.04,
        };
   
    }
  };

  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[width, height, thickness]} />
      <meshPhysicalMaterial transparent {...getMaterialProps()} />
      {/* <MeshTransmissionMaterial 
        transmission={.9}
        thickness={.1}
        color={'#ffffff'}
      /> */}
    </mesh>
  );
}
