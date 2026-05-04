import React from 'react';
import { Line, Text } from '@react-three/drei';

interface DimensionLinesProps {
  width: number;
  height: number;
}

export function DimensionLines({ width, height }: DimensionLinesProps) {
  const offset = 0.15; // Distance from the glass
  const color = "#3b82f6"; // Blue 500 for technical lines

  // Convert to millimeters for display
  const wMm = Math.round(width * 1000);
  const hMm = Math.round(height * 1000);

  return (
    <group>
      {/* Width Dimension (Bottom) */}
      <group position={[0, -height / 2 - offset, 0]}>
        {/* Main horizontal line */}
        <Line points={[[-width / 2, 0, 0], [width / 2, 0, 0]]} color={color} lineWidth={1} />
        {/* End caps */}
        <Line points={[[-width / 2, 0.03, 0], [-width / 2, -0.03, 0]]} color={color} />
        <Line points={[[width / 2, 0.03, 0], [width / 2, -0.03, 0]]} color={color} />
        
        <Text 
          position={[0, -0.05, 0]} 
          fontSize={0.06} 
          color={color} 
          anchorY="top"
          font="/Gilroy-ExtraBold.otf"
        >
          {wMm} mm
        </Text>
      </group>

      {/* Height Dimension (Right) */}
      <group position={[width / 2 + offset, 0, 0]}>
        {/* Main vertical line */}
        <Line points={[[0, -height / 2, 0], [0, height / 2, 0]]} color={color} lineWidth={1} />
        {/* End caps */}
        <Line points={[[-0.03, -height / 2, 0], [0.03, -height / 2, 0]]} color={color} />
        <Line points={[[-0.03, height / 2, 0], [0.03, height / 2, 0]]} color={color} />
        
        <Text 
          position={[0.05, 0, 0]} 
          fontSize={0.06} 
          color={color} 
          anchorX="left"
          anchorY="middle"
          rotation={[0, 0, -Math.PI / 2]}
          font="/Gilroy-ExtraBold.otf"
        >
          {hMm} mm
        </Text>
      </group>
    </group>
  );
}
