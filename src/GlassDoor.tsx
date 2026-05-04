import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GlassPane } from './GlassPane';
import { Hardware } from './Hardware';
import { Frame } from './Frame';

interface GlassDoorProps {
  width: number;
  height: number;
  isOpen: boolean;
  style: 'patch' | 'frame';
  glassType: 'clear' | 'frosted' | 'tinted';
}

export function GlassDoor({ width, height, isOpen, style, glassType }: GlassDoorProps) {
  const pivotRef = useRef<THREE.Group>(null);
  
  // Frame thickness
  const frameT = 0.04;
  
  // Calculate hinge center. 
  // If patch fitting, hinge is on the glass edge.
  // If full frame, hinge is on the outer edge of the frame.
  const hingeOffsetX = style === 'frame' ? -(width / 2 + frameT) : -width / 2;

  useFrame((_, delta) => {
    if (pivotRef.current) {
      // Rotate 90 degrees (Math.PI / 2) when open
      const targetAngle = isOpen ? Math.PI / 2 : 0;
      pivotRef.current.rotation.y = THREE.MathUtils.damp(
        pivotRef.current.rotation.y,
        targetAngle,
        6,
        delta
      );
    }
  });

  return (
    <group position={[hingeOffsetX, 0, 0]} ref={pivotRef}>
      {/* Reverse the offset to center the door exactly in the opening */}
      <group position={[-hingeOffsetX, 0, 0]}>
        <GlassPane width={width} height={height} type={glassType} />
        {style === 'patch' && <Hardware width={width} height={height} />}
        {style === 'frame' && <Frame width={width} height={height} thickness={frameT} />}
      </group>
    </group>
  );
}
