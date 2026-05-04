import { GlassDoor } from './GlassDoor';
import { Frame } from './Frame';
import { GlassPane } from './GlassPane';
import { Hardware } from './Hardware';

import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { lerp } from 'three/src/math/MathUtils.js';


type GlassType = 'clear' | 'frosted' | 'tinted';
type DoorStyle = 'patch' | 'frame';
type ProductType = 'door' | 'window' | 'shower-cubicle' | 'patch-fitting-door';

interface ProductPreview3DProps {
  product: ProductType;
  width: number;
  height: number;
  depth?: number;
  isOpen: boolean;
  style: DoorStyle;
  glassType: GlassType;
}

export function ProductPreview3D({
  product,
  width,
  height,
  depth = 0,
  isOpen,
  style,
  glassType,
}: ProductPreview3DProps) {
  const effectiveStyle: DoorStyle = product === 'patch-fitting-door' ? 'patch' : style;


  if (product === 'window') {
    const panelGap = 0.001;
    const panelWidth = width / 2 - panelGap;
    
    const slidingOffset = isOpen ? panelWidth : 0;

    // Style swap: 'frame' or 'patch'
    if (style === 'patch') {
      // Patch style - minimal frame, just glass panes (maybe thin border)
      return (
        <group> 
          <group position={[-panelWidth / 2, 0, 0.005]}>
            <GlassPane width={panelWidth} height={height - 0.04} type={glassType} />
          </group>
          <group position={[panelWidth / 2 , 0, -0.005]}>
            <GlassPane width={panelWidth} height={height - 0.04} type={glassType} />
          </group>
          <Hardware isWindow width={width} height={height}/>
        </group>
      );
    } else if (style === 'frame') {
      // Frame style - full window with visible frame
      return (
        <group>
          <Frame isWindow={product === "window"} width={width} height={height} thickness={0.03} />
          <group position={[-panelWidth / 2, 0, 0.005]}>
            <GlassPane width={panelWidth} height={height} type={glassType} />
          </group>
          <group position={[panelWidth / 2, 0, -0.005]}>
            <GlassPane width={panelWidth} height={height} type={glassType} />
          </group>
        </group>
      );
    }
  }

  if (product === 'shower-cubicle') {
    const sideWidth = width;
    return (
      <group position={[0,0,0]}>
        {/* Front panel */}
        <group position={[0, 0, 0]}>
        <Hardware width={width} height={height} />
          <GlassPane width={width} height={height} type={glassType} />
        </group>
        {/* Back panel */}
        <group position={[0, 0, -depth - .0005]}>
          <GlassPane width={width} height={height} type={glassType} />
        </group>
        {/* Rigth panel for cubicle look */}
        <group position={[width / 2 + 0.005, 0, -depth / 2 - .005]} rotation={[0, Math.PI / 2, 0]}>
          <GlassPane width={depth} height={height} type={glassType} />
        </group>
        {/* Left panel for cubicle look */}
        <group position={[-width / 2 + 0.005, 0, -depth / 2 - .005]} rotation={[0, Math.PI / 2, 0]}>
          <GlassPane width={depth} height={height} type={glassType} />
        </group>
        {/* <Frame width={width} height={height} thickness={0.02} /> */}
      </group>
    );
  }

  return (
    <GlassDoor
      width={width}
      height={height}
      isOpen={isOpen}
      style={effectiveStyle}
      glassType={glassType}
    />
  );
}
