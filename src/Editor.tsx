import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, OrbitControls } from '@react-three/drei';
import { GlassDoor } from './GlassDoor';
import { DimensionLines } from './DimensionLines';
import { Settings2, Maximize2, MoveVertical, Droplet, BoxSelect } from 'lucide-react';

export default function Editor() {
  // App State
  // Width in meters (0.5m = 500mm, 1.5m = 1500mm)
  const [width, setWidth] = useState(0.9);
  // Height in meters (1.0m = 1000mm, 2.5m = 2500mm)
  const [height, setHeight] = useState(2.1);
  const [isOpen, setIsOpen] = useState(false);
  const [style, setStyle] = useState<'patch' | 'frame'>('patch');
  const [glassType, setGlassType] = useState<'clear' | 'frosted' | 'tinted'>('clear');

  return (
    <div className="w-screen h-screen bg-[#0F0F11] text-[#E0E0E6] overflow-hidden relative flex flex-col md:flex-row font-sans select-none">
      {/* 3D Canvas */}
      <div
        className="
          relative
          flex-1
          min-h-[350px]
          w-full
          md:w-auto
          md:absolute md:inset-0 md:right-80
        "
        style={{
          height: '100%',
        }}
      >
        <Canvas camera={{ position: [2, 1.5, 3], fov: 50 }} shadows>
          <color attach="background" args={['#09090B']} />
          <ambientLight intensity={0.4} />
          <directionalLight castShadow position={[5, 10, 5]} intensity={1.5} shadow-mapSize={[1024, 1024]} />
          <Environment preset="city" />
          {/* Lift the door up so the bottom sits at y=0 */}
          <group position={[0, height / 2, 0]}>
            <GlassDoor 
              width={width} 
              height={height} 
              isOpen={isOpen} 
              style={style} 
              glassType={glassType} 
            />
            {/* Show dimension lines only when closed to avoid moving text confusingly */}
            <DimensionLines width={width} height={height} />
          </group>
          {/* Floor shadow */}
          <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={15} blur={2.5} far={4} />
          <OrbitControls 
            target={[0, height / 2, 0]} 
            minPolarAngle={Math.PI / 6} 
            maxPolarAngle={Math.PI / 2 + 0.1}
          />
        </Canvas>
        {/* Background grid overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        ></div>
      </div>

      {/* Footer hint */}
      <div className="
        absolute max-[599px]:top-2 bottom-4 left-0 right-0
        md:right-80
        text-center pointer-events-none z-10
        px-2 md:px-0
      ">
        <span className="bg-[#16161A]/80 border border-white/10 text-white/40 text-[10px] font-mono px-4 py-2 rounded-full tracking-wide">
          Click and drag to rotate • Scroll to zoom
        </span>
      </div>

      {/* Floating UI Panel */}
      <div
        className={`
          w-full md:w-80 md:absolute md:right-0 md:top-0 md:bottom-0
          border-t md:border-t-0 md:border-l border-white/10
          bg-[#16161A]
          flex flex-col p-4 md:p-6 z-20 overflow-y-auto
          min-h-[300px] max-h-[60vh] md:max-h-none
          relative
          ${/* Responsive stacking for sm screens */''}
        `}
        style={{
          height: 'fit-content',
          maxHeight: '100vh'
        }}
      >
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
          <div className="bg-blue-600 w-8 h-8 rounded flex items-center justify-center text-white">
            <Settings2 size={16} />
          </div>
          <div>
            <h1 className="text-sm font-semibold uppercase tracking-tight text-blue-400">Parametric Glass</h1>
            <p className="text-[10px] uppercase font-mono tracking-widest text-white/40">Architectural Editor</p>
          </div>
        </div>
        <div className="space-y-6 flex-1">
          {/* Header */}
          <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-6 flex items-center gap-2">
            <span className="w-1 h-3 bg-blue-500"></span> Geometry Properties
          </div>
          {/* Width Control */}
          <div>
            <label className="flex justify-between items-center text-[11px] uppercase opacity-60 font-semibold mb-2">
              <span className="flex items-center gap-2">
                <Maximize2 size={14} className="text-blue-500" /> Width
              </span>
              <div>
                <input
                  type="number"
                  min={500}
                  max={1500}
                  step={1}
                  value={Math.round(width * 1000)}
                  onChange={e => {
                    let v = Number(e.target.value);
                    // Clamp and convert to meters
                    v = Math.min(1500, Math.max(500, v));
                    setWidth(v / 1000);
                  }}
                  className="bg-white/5 border border-white/10 px-2 py-1 rounded text-blue-400 font-mono text-[10px] w-fit text-right"
                  style={{ outline: 'none' }}
                  aria-label="Width in millimeters"
                /> 
                <span>MM</span>
              </div>
            </label>
            <input 
              type="range" 
              min="0.5" max="1.5" step="0.01" 
              value={width} 
              onChange={(e) => setWidth(parseFloat(e.target.value))} 
              className="w-full accent-blue-500 cursor-ew-resize h-1 bg-white/10 rounded-full appearance-none" 
            />
            <div className="flex justify-between text-[10px] text-white/40 font-mono mt-2">
              <span>500</span>
              <span>1500</span>
            </div>
          </div>

          {/* Height Control */}
          <div>
            <label className="flex justify-between items-center text-[11px] uppercase opacity-60 font-semibold mb-2">
              <span className="flex items-center gap-2">
                <MoveVertical size={14} className="text-blue-500" /> Height
              </span>
              <div>
                <input
                  type="number"
                  min={500}
                  max={1500}
                  step={1}
                  value={Math.round(height * 1000)}
                  onChange={e => {
                    let v = Number(e.target.value);
                    // Clamp and convert to meters
                    v = Math.min(1500, Math.max(500, v));
                    setHeight(v / 1000);
                  }}
                  className="bg-white/5 border border-white/10 px-2 py-1 rounded text-blue-400 font-mono text-[10px] w-fit text-right"
                  style={{ outline: 'none' }}
                  aria-label="Width in millimeters"
                /> 
                <span>MM</span>
              </div>
            </label>
            <input 
              type="range" 
              min="1.0" max="2.5" step="0.01" 
              value={height} 
              onChange={(e) => setHeight(parseFloat(e.target.value))} 
              className="w-full accent-blue-500 cursor-ew-resize h-1 bg-white/10 rounded-full appearance-none" 
            />
            <div className="flex justify-between text-[10px] text-white/40 font-mono mt-2">
              <span>1000</span>
              <span>2500</span>
            </div>
          </div>

          {/* Style Control */}
          <div>
            <label className="flex items-center gap-2 text-[11px] uppercase opacity-60 font-semibold mb-3">
              <BoxSelect size={14} className="text-blue-500" /> Hardware Profile
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setStyle('patch')}
                className={`py-2 px-3 rounded text-center text-[10px] font-bold uppercase transition-all ${
                  style === 'patch' ? 'bg-blue-600/20 border border-blue-500/50 text-blue-400' : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
                }`}
              >
                Patch Fitting
              </button>
              <button 
                onClick={() => setStyle('frame')}
                className={`py-2 px-3 rounded text-center text-[10px] font-bold uppercase transition-all ${
                  style === 'frame' ? 'bg-blue-600/20 border border-blue-500/50 text-blue-400' : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
                }`}
              >
                Full Frame
              </button>
            </div>
          </div>

          {/* Glass Type Control */}
          <div>
            <label className="flex items-center gap-2 text-[11px] uppercase opacity-60 font-semibold mb-3">
              <Droplet size={14} className="text-blue-500" /> Glass Type
            </label>
            <div className="relative">
              <select 
                value={glassType}
                onChange={(e) => setGlassType(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 text-[#E0E0E6] text-[11px] rounded p-2.5 outline-none appearance-none cursor-pointer"
              >
                <option value="clear" className="bg-[#16161A]">Tempered Clear (10mm)</option>
                <option value="frosted" className="bg-[#16161A]">Tempered Frosted (10mm)</option>
                <option value="tinted" className="bg-[#16161A]">Tempered Tinted (10mm)</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 text-[10px] pointer-events-none">▼</span>
            </div>
          </div>

          {/* Pivot Animation Toggle */}
          <div className="pt-6 border-t border-white/10 mt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold">{isOpen ? 'DOOR_STATE_OPEN' : 'DOOR_STATE_CLOSED'}</span>
              <button onClick={() => setIsOpen(!isOpen)} className={`w-10 h-5 rounded-full relative transition-colors ${isOpen ? 'bg-blue-600' : 'bg-white/10'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isOpen ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded font-bold text-xs uppercase tracking-widest transition-colors"
            >
              Toggle Animation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
