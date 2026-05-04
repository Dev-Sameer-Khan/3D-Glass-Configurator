import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  ContactShadows,
  OrbitControls,
  Grid,
  Stats,
} from "@react-three/drei";
import { DimensionLines } from "./DimensionLines";
import { ProductPreview3D } from "./ProductPreview3D";
import {
  Camera,
  Download,
  FileText,
  Layers,
  Maximize2,
  MoveVertical,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import type * as THREE from "three";

const GLASS_RATE_PER_SQFT: Record<"clear" | "frosted" | "tinted", number> = {
  clear: 420,
  frosted: 470,
  tinted: 500,
};

const STYLE_MULTIPLIER: Record<"patch" | "frame", number> = {
  patch: 1,
  frame: 1.12,
};

const LABOR_CHARGE = 1400;
const TAX_PERCENT = 18;
const PRODUCT_OPTIONS = [
  { label: "Door", value: "door" },
  { label: "Window", value: "window" },
  { label: "Shower Cubicle", value: "shower-cubicle" },
] as const;

type ProductType = (typeof PRODUCT_OPTIONS)[number]["value"];

const PRODUCT_MULTIPLIER: Record<ProductType, number> = {
  door: 1,
  window: 0.92,
  "shower-cubicle": 1.18,
};

const PRODUCT_LABEL: Record<ProductType, string> = {
  door: "Door",
  window: "Window",
  "shower-cubicle": "Shower Cubicle",
};

export default function Editor() {
  const [product, setProduct] = useState<ProductType>("door");
  const [width, setWidth] = useState(1);
  const [height, setHeight] = useState(2.1);
  const [depth, setDepth] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [style, setStyle] = useState<"patch" | "frame">("patch");
  const [glassType, setGlassType] = useState<"clear" | "frosted" | "tinted">(
    "clear",
  );
  const [quoteOpen, setQuoteOpen] = useState(false);
  const canvasRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (product === "patch-fitting-door") {
      setStyle("patch");
    }
    if (product === "window") {
      setStyle("patch");
    }
  }, [product]);

  const widthMm = Math.round(width * 1000);
  const heightMm = Math.round(height * 1000);
  const depthMm = Math.round(depth * 1000);

  // Checking For 3D Objects For Depth
  const isDepth = useMemo(() => product == "shower-cubicle", [product]);

  // Checking For Multiple Types
  const hasNoMultiSubTypes = useMemo(
    () => product == "shower-cubicle",
    [product],
  );

  const estimate = useMemo(() => {
    const areaSqFt = (widthMm * heightMm) / 92903.04;
    const baseRate = GLASS_RATE_PER_SQFT[glassType];
    const styleMultiplier =
      product === "patch-fitting-door"
        ? STYLE_MULTIPLIER.patch
        : STYLE_MULTIPLIER[style];
    const glassCost =
      areaSqFt * baseRate * styleMultiplier * PRODUCT_MULTIPLIER[product];
    const subTotal = glassCost + LABOR_CHARGE;
    const tax = (subTotal * TAX_PERCENT) / 100;
    const total = subTotal + tax;
    return { areaSqFt, baseRate, glassCost, subTotal, tax, total };
  }, [widthMm, heightMm, glassType, style, product]);

  const downloadSnapshot = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.domElement.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `glass-config-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="w-screen h-screen bg-[#222] text-slate-800 overflow-hidden relative flex flex-col md:flex-row font-sans select-none">
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
          height: "100%",
        }}
      >
        <Canvas
          camera={{ position: [2, 1.5, 3], fov: 50 }}
          // shadows
          gl={{ preserveDrawingBuffer: true }}
          onCreated={({ gl }) => {
            canvasRef.current = gl;
          }}
        >
          {/* <color attach="background" args={['#222']} /> */}
          <Stats />
          <ambientLight intensity={0.6} />
          <directionalLight castShadow position={[5, 10, 5]} intensity={1.8} shadow-mapSize={[1024, 1024]} />
          <Environment preset="apartment" />
          <group position={[0, height / 2, 0]}>
            <ProductPreview3D
              product={product}
              width={width}
              height={height}
              depth={depth}
              isOpen={isOpen}
              style={style}
              glassType={glassType}
            />
            <DimensionLines
              width={width}
              height={height}
              depth={depth}
              isDepth={isDepth}
            />
          </group>
          {/* <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={15} blur={2.5} far={4} /> */}
          <OrbitControls
            target={[0, height / 2, 0]}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2 + 0.1}
          />
          <Grid
            cellSize={0.5}
            cellThickness={0.5}
            cellColor="#3b82f6"
            sectionSize={1}
            sectionThickness={1}
            sectionColor="#3b82f6"
            followCamera={false}
            infiniteGrid
            fadeDistance={100}
            fadeStrength={10}
            fadeFrom={1}
          />
        </Canvas>
        {/* <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(to right, #dbeafe 1px, transparent 1px), linear-gradient(to bottom, #dbeafe 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        ></div> */}
      </div>

      <div
        className="
        absolute max-[599px]:top-2 bottom-4 left-0 right-0
        md:right-80
        text-center pointer-events-none z-10
        px-2 md:px-0
      "
      >
        <span className="bg-white/80 border border-slate-200 text-slate-500 text-[10px] font-mono px-4 py-2 rounded-full tracking-wide">
          Click and drag to rotate • Scroll to zoom
        </span>
      </div>

      <div
        className={`
          w-full h-svh md:w-80 md:absolute md:right-0 md:top-0 md:bottom-0
          border-t md:border-t-0 md:border-l border-slate-200
          bg-white
          flex flex-col p-4 md:p-6 z-20 overflow-y-auto
          min-h-[300px] max-h-[60vh] md:max-h-none
          relative
        `}
        style={{
          maxHeight: "100svh",
        }}
      >
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
          <div className="bg-blue-900 w-8 h-8 rounded flex items-center justify-center text-white">
            <Settings2 size={16} />
          </div>
          <div>
            <h1 className="text-sm font-semibold uppercase tracking-tight text-slate-900">
              3D Glass Configurator
            </h1>
            <p className="text-[10px] uppercase font-mono tracking-widest text-slate-500">
              Modern Industrial
            </p>
          </div>
        </div>
        <div className="space-y-6 flex-1">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-900 mb-2 flex items-center gap-2">
            <span className="w-1 h-3 bg-blue-900"></span> Product Controls
          </div>
          <div>
            <label className="flex items-center gap-2 text-[11px] uppercase text-slate-500 font-semibold mb-3">
              <Layers size={14} className="text-blue-900" /> Product
            </label>
            <select
              value={product}
              onChange={(e) => setProduct(e.target.value as ProductType)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[11px] rounded p-2.5 outline-none appearance-none cursor-pointer"
            >
              {PRODUCT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex justify-between items-center text-[11px] uppercase text-slate-500 font-semibold mb-2">
              <span className="flex items-center gap-2">
                <Maximize2 size={14} className="text-blue-900" /> Width
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={500}
                  max={1500}
                  step={1}
                  value={Math.round(width * 1000)}
                  onChange={(e) => {
                    let v = Number(e.target.value);
                    v = Math.min(1500, Math.max(500, v));
                    setWidth(v / 1000);
                  }}
                  className="bg-slate-50 border border-slate-200 px-2 py-1 rounded text-slate-900 font-mono text-[10px] w-fit text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ outline: "none" }}
                  aria-label="Width in millimeters"
                />
                <span>MM</span>
              </div>
            </label>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.01"
              value={width}
              onChange={(e) => setWidth(parseFloat(e.target.value))}
              className="w-full accent-blue-900 cursor-ew-resize h-1 bg-slate-200 rounded-full appearance-none"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
              <span>500</span>
              <span>1500</span>
            </div>
          </div>

          <div>
            <label className="flex justify-between items-center text-[11px] uppercase text-slate-500 font-semibold mb-2">
              <span className="flex items-center gap-2">
                <MoveVertical size={14} className="text-blue-900" /> Height
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1000}
                  max={2500}
                  step={1}
                  value={Math.round(height * 1000)}
                  onChange={(e) => {
                    let v = Number(e.target.value);
                    v = Math.min(2500, Math.max(1000, v));
                    setHeight(v / 1000);
                  }}
                  className="bg-slate-50 border border-slate-200 px-2 py-1 rounded text-slate-900 font-mono text-[10px] w-fit text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ outline: "none" }}
                  aria-label="Height in millimeters"
                />
                <span>MM</span>
              </div>
            </label>
            <input
              type="range"
              min="1.0"
              max="2.5"
              step="0.01"
              value={height}
              onChange={(e) => setHeight(parseFloat(e.target.value))}
              className="w-full accent-blue-900 cursor-ew-resize h-1 bg-slate-200 rounded-full appearance-none"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
              <span>1000</span>
              <span>2500</span>
            </div>
          </div>

          {isDepth && (
            <div>
              <label className="flex justify-between items-center text-[11px] uppercase text-slate-500 font-semibold mb-2">
                <span className="flex items-center gap-2">
                  <MoveVertical size={14} className="text-blue-900" /> Depth
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1000}
                    max={2500}
                    step={1}
                    value={Math.round(depth * 1000)}
                    onChange={(e) => {
                      let v = Number(e.target.value);
                      v = Math.min(2500, Math.max(1000, v));
                      setDepth(v / 1000);
                    }}
                    className="bg-slate-50 border border-slate-200 px-2 py-1 rounded text-slate-900 font-mono text-[10px] w-fit text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    style={{ outline: "none" }}
                    aria-label="Depth in millimeters"
                  />
                  <span>MM</span>
                </div>
              </label>
              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.01"
                value={depth}
                onChange={(e) => setDepth(parseFloat(e.target.value))}
                className="w-full accent-blue-900 cursor-ew-resize h-1 bg-slate-200 rounded-full appearance-none"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
                <span>1000</span>
                <span>2500</span>
              </div>
            </div>
          )}

          {!hasNoMultiSubTypes && (
            <div>
              <label className="flex items-center gap-2 text-[11px] uppercase text-slate-500 font-semibold mb-3">
                <Sparkles size={14} className="text-blue-900" />{" "}
                {product + " Style"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={product === "patch-fitting-door"}
                  onClick={() => setStyle("patch")}
                  className={`py-2 px-3 rounded text-center text-[10px] font-bold uppercase transition-all ${
                    style === "patch"
                      ? "bg-blue-100 border border-blue-900/40 text-blue-900"
                      : "bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900"
                  } ${product === "patch-fitting-door" ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Patch Fitting
                </button>
                <button
                  disabled={product === "patch-fitting-door"}
                  onClick={() => setStyle("frame")}
                  className={`py-2 px-3 rounded text-center text-[10px] font-bold uppercase transition-all ${
                    style === "frame"
                      ? "bg-blue-100 border border-blue-900/40 text-blue-900"
                      : "bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900"
                  } ${product === "patch-fitting-door" ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Full Frame
                </button>
              </div>
              {product === "patch-fitting-door" ? (
                <p className="mt-2 text-[10px] text-slate-500">
                  Patch fitting product locks style to patch hardware.
                </p>
              ) : null}
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 text-[11px] uppercase text-slate-500 font-semibold mb-3">
              Glass Type
            </label>
            <div className="relative">
              <select
                value={glassType}
                onChange={(e) =>
                  setGlassType(e.target.value as "clear" | "frosted" | "tinted")
                }
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[11px] rounded p-2.5 outline-none appearance-none cursor-pointer"
              >
                <option value="clear">Tempered Clear (10mm)</option>
                <option value="frosted">Tempered Frosted (10mm)</option>
                <option value="tinted">Tempered Tinted (10mm)</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 text-[10px] pointer-events-none">
                ▼
              </span>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 mt-2 space-y-2">
            {product === "door" && (
              <>
              <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold">
                {isOpen ? "OPEN" : "CLOSED"}
              </span>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-10 h-5 rounded-full relative transition-colors ${isOpen ? "bg-blue-900" : "bg-slate-300"}`}
                >
                <div
                  className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isOpen ? "right-1" : "left-1"}`}
                  ></div>
              </button>
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full py-3 bg-blue-900 hover:bg-blue-800 rounded font-bold text-xs uppercase tracking-widest transition-colors text-white"
              >
              Toggle Animation
            </button>
              </>
            )}
            <button
              onClick={downloadSnapshot}
              className="w-full py-3 bg-white border border-slate-300 hover:bg-slate-50 rounded font-bold text-xs uppercase tracking-widest transition-colors inline-flex items-center justify-center gap-2"
            >
              <Camera size={14} /> Export PNG Snapshot
            </button>
            <button
              onClick={() => setQuoteOpen(true)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 rounded font-bold text-xs uppercase tracking-widest transition-colors text-white inline-flex items-center justify-center gap-2"
            >
              <FileText size={14} /> Generate Quote
            </button>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Area</span>
                <span>{estimate.areaSqFt.toFixed(2)} sq.ft</span>
              </div>
              <div className="flex justify-between">
                <span>Rate</span>
                <span>Rs {estimate.baseRate}/sq.ft</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>Rs {estimate.subTotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>Rs {estimate.total.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {quoteOpen ? (
        <div className="absolute inset-0 z-50 bg-black/40 p-3 md:p-8 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto border border-slate-200">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">
                Quotation Preview
              </h3>
              <button
                onClick={() => setQuoteOpen(false)}
                className="p-2 rounded-md border border-slate-200 hover:bg-slate-50"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5 md:p-7 space-y-6">
              <div className="flex flex-col md:flex-row md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-blue-900">
                    Axis Glass & Hardware
                  </h2>
                  <p className="text-sm text-slate-600">
                    Professional 3D Configuration Quote
                  </p>
                </div>
                <div className="text-sm text-slate-600">
                  <p>Quote #: Q-{Date.now().toString().slice(-6)}</p>
                  <p>Date: {new Date().toLocaleDateString("en-IN")}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p>
                  <span className="font-semibold">Product:</span>{" "}
                  {PRODUCT_LABEL[product]}
                </p>
                <p>
                  <span className="font-semibold">Style:</span>{" "}
                  {style === "patch" ? "Patch Fitting" : "Full Frame"}
                </p>
                <p>
                  <span className="font-semibold">Width:</span> {widthMm} mm
                </p>
                <p>
                  <span className="font-semibold">Height:</span> {heightMm} mm
                </p>
                <p>
                  <span className="font-semibold">Depth:</span> {depthMm} mm
                </p>
                <p>
                  <span className="font-semibold">Glass:</span> {glassType}
                </p>
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left px-4 py-2">Item</th>
                      <th className="text-right px-4 py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-slate-200">
                      <td className="px-4 py-2">Glass Cost</td>
                      <td className="px-4 py-2 text-right">
                        Rs {estimate.glassCost.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="border-t border-slate-200">
                      <td className="px-4 py-2">Labor</td>
                      <td className="px-4 py-2 text-right">
                        Rs {LABOR_CHARGE.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="border-t border-slate-200">
                      <td className="px-4 py-2">Tax ({TAX_PERCENT}%)</td>
                      <td className="px-4 py-2 text-right">
                        Rs {estimate.tax.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="border-t border-slate-200 bg-slate-900 text-white font-semibold">
                      <td className="px-4 py-2">Grand Total</td>
                      <td className="px-4 py-2 text-right">
                        Rs {estimate.total.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() =>
                    window.alert("PDF export can be wired next with jsPDF.")
                  }
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 inline-flex items-center gap-2"
                >
                  <Download size={14} /> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
