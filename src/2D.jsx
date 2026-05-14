import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";

const MM_MIN = 400;
const MM_MAX = 5000;
const HANDLE_HIT = 44;
/** Empty layout sheet (1 unit = 1 mm) */
const SHEET_W = 3800;
const SHEET_H = 3200;

const COMPONENT_MIME = "application/x-3dcfg-component";
const SNAP_UV = 0.12;
const PARTITION_MERGE_MM = 35;

/** @param {SVGSVGElement} svg @param {number} clientX @param {number} clientY */
function clientToSvgPoint(svg, clientX, clientY) {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  return pt.matrixTransform(ctm.inverse());
}

function clampMm(n) {
  if (!Number.isFinite(n)) return MM_MIN;
  return Math.min(MM_MAX, Math.max(MM_MIN, Math.round(n)));
}

// Fix: Define safeMm to avoid ReferenceError
function safeMm(val, fallback) {
  // fallback must be a number
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return clampMm(n);
}

function snapHandleUV(u, v) {
  const corners = [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ];
  let best = { u, v };
  let bestD = Infinity;
  for (const [cu, cv] of corners) {
    const d = Math.hypot(u - cu, v - cv);
    if (d < bestD) {
      bestD = d;
      best = { u: cu, v: cv };
    }
  }
  if (bestD <= SNAP_UV) return best;
  return {
    u: Math.min(1, Math.max(0, u)),
    v: Math.min(1, Math.max(0, v)),
  };
}

// Helper for drawing arrows for dimension lines
function DimensionArrow({ x1, y1, x2, y2, color = "#3b82f6" }) {
  // Arrowhead is ~10 units long
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const arrowLen = 16;
  const arrowAngle = Math.PI / 7;
  // Arrow 1 endpoint (near x2,y2)
  const ax1 = x2 - arrowLen * Math.cos(angle - arrowAngle);
  const ay1 = y2 - arrowLen * Math.sin(angle - arrowAngle);
  // Arrow 2 endpoint
  const ax2 = x2 - arrowLen * Math.cos(angle + arrowAngle);
  const ay2 = y2 - arrowLen * Math.sin(angle + arrowAngle);
  return (
    <>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth="3"
        markerEnd=""
      />
      <polyline
        points={`${x2},${y2} ${ax1},${ay1}`}
        fill="none"
        stroke={color}
        strokeWidth="3"
      />
      <polyline
        points={`${x2},${y2} ${ax2},${ay2}`}
        fill="none"
        stroke={color}
        strokeWidth="3"
      />
    </>
  );
}

const PrettyLabel = ({ value, x, y, orient = "h" }) => (
  <text
    x={x}
    y={y}
    textAnchor="middle"
    alignmentBaseline="middle"
    fill="#0ea5e9"
    fontWeight="bold"
    fontSize="38"
    fontFamily="sans-serif"
    transform={orient === "v" ? `rotate(-90,${x},${y})` : undefined}
    style={{ filter: "drop-shadow(0 1px 3px #fff8)" }}
  >
    {value}
  </text>
);

const PrettyInput = (props) => (
  <input
    {...props}
    className="p-2 rounded border-2 border-cyan-500 text-white text-xl bg-zinc-900 font-semibold focus:outline-cyan-200 focus:border-cyan-400 shadow disabled:opacity-45 disabled:cursor-not-allowed"
    style={{ width: 130 }}
  />
);

const PrettyLabelUI = (props) => (
  <label className="text-cyan-300 text-lg mt-4 mb-1 font-semibold" {...props} />
);

const TwoD = () => {
  const [width, setWidth] = useState(1500);
  const [height, setHeight] = useState(2000);
  const [frameColor, setFrameColor] = useState("#ffffff");
  const [glassColor, setGlassColor] = useState("rgba(110, 231, 219, 0.6)");
  /** Handle anchor on each sash glass: (0,0)=top-left of glass, (1,1)=bottom-right */
  const [leftHandleUV, setLeftHandleUV] = useState({ u: 0, v: 0.5 });
  const [rightHandleUV, setRightHandleUV] = useState({ u: 1, v: 0.5 });
  const [showDesign, setShowDesign] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [draftRect, setDraftRect] = useState(null);

  const [leftRailTab, setLeftRailTab] = useState("components");
  /** null | 'v' | 'h' — draw on window inner area */
  const [partitionTool, setPartitionTool] = useState(null);
  const [partitions, setPartitions] = useState([]);
  const [partitionDraft, setPartitionDraft] = useState(null);
  const [grillLeft, setGrillLeft] = useState(false);
  const [grillRight, setGrillRight] = useState(false);
  const [grillCols, setGrillCols] = useState(3);
  const [grillRows, setGrillRows] = useState(4);

  const svgRef = useRef(null);
  const resizeEdgeRef = useRef(null);
  const dragStartRef = useRef({
    svgX: 0,
    svgY: 0,
    w: 1500,
    h: 2000,
  });
  const drawActiveRef = useRef(false);
  const drawStartRef = useRef({ x: 0, y: 0 });
  const partitionDrawActiveRef = useRef(false);
  const partitionToolRef = useRef(null);
  const handleDragRef = useRef(null);

  const frameThickness = 40;
  const innerFrameThickness = 30;
  const overlap = 20;

  // Viewbox calculations to include dimension lines
  const paddingX = 400;
  const paddingY = 400;

  const handleColor = "#d1d5db";

  // Handlers for positive numbers only
  const handleHeightChange = (e) => {
    const value = Number(e.target.value);
    if (!isNaN(value) && value >= 0) setHeight(value);
    else if (e.target.value === "") setHeight("");
  };
  const handleWidthChange = (e) => {
    const value = Number(e.target.value);
    if (!isNaN(value) && value >= 0) setWidth(value);
    else if (e.target.value === "") setWidth("");
  };

  const onResizePointerDown = useCallback(
    (edge) => (e) => {
      if (!svgRef.current) return;
      e.stopPropagation();
      e.preventDefault();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      const p = clientToSvgPoint(svgRef.current, e.clientX, e.clientY);
      resizeEdgeRef.current = edge;
      dragStartRef.current = {
        svgX: p.x,
        svgY: p.y,
        w: safeMm(width, 1500),
        h: safeMm(height, 2000),
      };
    },
    [width, height]
  );

  const onResizePointerUp = useCallback((e) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    resizeEdgeRef.current = null;
  }, []);

  const onEmptySheetPointerDown = useCallback(
    (e) => {
      if (showDesign) return;
      if (e.button !== 0) return;
      e.preventDefault();
      if (!svgRef.current) return;
      drawActiveRef.current = true;
      const p = clientToSvgPoint(svgRef.current, e.clientX, e.clientY);
      drawStartRef.current = { x: p.x, y: p.y };
      setDraftRect({ x: p.x, y: p.y, w: 0, h: 0 });
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [showDesign]
  );

  const clearCanvas = useCallback(() => {
    setShowDesign(false);
    setDraftRect(null);
    drawActiveRef.current = false;
    setPartitions([]);
    setPartitionDraft(null);
    setPartitionTool(null);
    partitionDrawActiveRef.current = false;
    setGrillLeft(false);
    setGrillRight(false);
    setLeftHandleUV({ u: 0, v: 0.5 });
    setRightHandleUV({ u: 1, v: 0.5 });
  }, []);

  useEffect(() => {
    partitionToolRef.current = partitionTool;
  }, [partitionTool]);

  const dimsRef = useRef({
    w: 1500,
    h: 2000,
    ox: 0,
    oy: 0,
    panelWidth: 750,
  });

  useEffect(() => {
    const onMove = (e) => {
      if (handleDragRef.current && svgRef.current) {
        const D = dimsRef.current;
        const p = clientToSvgPoint(svgRef.current, e.clientX, e.clientY);
        const lx = p.x - D.ox;
        const ly = p.y - D.oy;
        const { panel, gw, gh, ft, ift, pw } = handleDragRef.current;
        let u;
        let v;
        if (panel === "left") {
          const plx = lx - ft - ift;
          const ply = ly - ft - ift;
          u = plx / gw;
          v = ply / gh;
        } else {
          const plx = lx - (D.w - pw) - ift;
          const ply = ly - ft - ift;
          u = plx / gw;
          v = ply / gh;
        }
        const cu = Math.min(1, Math.max(0, u));
        const cv = Math.min(1, Math.max(0, v));
        if (panel === "left") setLeftHandleUV({ u: cu, v: cv });
        else setRightHandleUV({ u: cu, v: cv });
        return;
      }
      if (partitionDrawActiveRef.current && svgRef.current && partitionToolRef.current) {
        const D = dimsRef.current;
        const p = clientToSvgPoint(svgRef.current, e.clientX, e.clientY);
        const lx = p.x - D.ox;
        const ly = p.y - D.oy;
        const innerL = frameThickness + innerFrameThickness;
        const innerR = D.w - frameThickness - innerFrameThickness;
        const innerT = frameThickness + innerFrameThickness;
        const innerB = D.h - frameThickness - innerFrameThickness;
        if (partitionToolRef.current === "v") {
          setPartitionDraft({
            axis: "v",
            pos: Math.min(innerR, Math.max(innerL, lx)),
          });
        } else {
          setPartitionDraft({
            axis: "h",
            pos: Math.min(innerB, Math.max(innerT, ly)),
          });
        }
        return;
      }
      if (drawActiveRef.current && svgRef.current) {
        const p = clientToSvgPoint(svgRef.current, e.clientX, e.clientY);
        const x0 = drawStartRef.current.x;
        const y0 = drawStartRef.current.y;
        setDraftRect({
          x: Math.min(x0, p.x),
          y: Math.min(y0, p.y),
          w: Math.abs(p.x - x0),
          h: Math.abs(p.y - y0),
        });
        return;
      }
      const edge = resizeEdgeRef.current;
      if (!edge || !svgRef.current) return;
      const p = clientToSvgPoint(svgRef.current, e.clientX, e.clientY);
      const d = dragStartRef.current;
      const dx = p.x - d.svgX;
      const dy = p.y - d.svgY;
      let nw = d.w;
      let nh = d.h;
      if (edge === "e" || edge === "se") nw = d.w + dx;
      if (edge === "s" || edge === "se") nh = d.h + dy;
      setWidth(clampMm(nw));
      setHeight(clampMm(nh));
    };
    const end = (e) => {
      if (handleDragRef.current) {
        const dragged = handleDragRef.current.panel;
        handleDragRef.current = null;
        if (dragged === "left")
          setLeftHandleUV((uv) => snapHandleUV(uv.u, uv.v));
        else setRightHandleUV((uv) => snapHandleUV(uv.u, uv.v));
        return;
      }
      if (partitionDrawActiveRef.current) {
        if (e.type === "pointercancel") {
          partitionDrawActiveRef.current = false;
          setPartitionDraft(null);
          return;
        }
        partitionDrawActiveRef.current = false;
        setPartitionDraft((d) => {
          if (d && d.pos != null) {
            setPartitions((prev) => {
              const exists = prev.some(
                (p) =>
                  p.axis === d.axis &&
                  Math.abs(p.pos - d.pos) < PARTITION_MERGE_MM
              );
              if (exists) return prev;
              return [
                ...prev,
                { id: `p-${Date.now()}`, axis: d.axis, pos: d.pos },
              ];
            });
          }
          return null;
        });
        return;
      }
      if (drawActiveRef.current) {
        if (e.type === "pointercancel" || !svgRef.current) {
          drawActiveRef.current = false;
          setDraftRect(null);
          return;
        }
        const p = clientToSvgPoint(
          svgRef.current,
          e.clientX,
          e.clientY
        );
        const x0 = drawStartRef.current.x;
        const y0 = drawStartRef.current.y;
        const nw = clampMm(Math.abs(p.x - x0));
        const nh = clampMm(Math.abs(p.y - y0));
        drawActiveRef.current = false;
        setDraftRect(null);
        if (nw >= MM_MIN && nh >= MM_MIN) {
          setWidth(nw);
          setHeight(nh);
          setOrigin({ x: Math.min(x0, p.x), y: Math.min(y0, p.y) });
          setShowDesign(true);
        }
        return;
      }
      resizeEdgeRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);

  const windowBuildSpec = useMemo(() => {
    const w = safeMm(width, 1500);
    const h = safeMm(height, 2000);
    const pw = (w + overlap) / 2;
    const panelClearW = pw - frameThickness;
    const panelClearH = h - frameThickness * 2;
    const inset = innerFrameThickness;
    const glassH = panelClearH - inset * 2;
    const leftGlassW = panelClearW - inset;
    const rightGlassW = panelClearW - inset * 2;
    return {
      version: 1,
      unit: "mm",
      type: "sliding_two_panel",
      placement: {
        sheetOriginMm: { x: origin.x, y: origin.y },
        sheetSizeMm: { w: SHEET_W, h: SHEET_H },
      },
      outer: { width: w, height: h },
      frame: {
        outerThicknessMm: frameThickness,
        innerRevealMm: innerFrameThickness,
        overlapMm: overlap,
      },
      panels: [
        {
          id: "A2",
          role: "fixed_back",
          outerMm: { w: panelClearW, h: panelClearH },
          glassMm: { w: leftGlassW, h: glassH },
        },
        {
          id: "A1",
          role: "sliding_front",
          outerMm: { w: panelClearW, h: panelClearH },
          glassMm: { w: rightGlassW, h: glassH },
        },
      ],
      hardware: {
        handles: {
          A2: { glassUV: { ...leftHandleUV } },
          A1: { glassUV: { ...rightHandleUV } },
        },
      },
      partitions: partitions.map((p) => ({
        axis: p.axis,
        positionMm: Math.round(p.pos),
      })),
      grills: {
        left: grillLeft,
        right: grillRight,
        cols: grillCols,
        rows: grillRows,
      },
      materials: { frameColor, glassColor },
    };
  }, [
    width,
    height,
    overlap,
    frameThickness,
    innerFrameThickness,
    leftHandleUV,
    rightHandleUV,
    frameColor,
    glassColor,
    origin.x,
    origin.y,
    partitions,
    grillLeft,
    grillRight,
    grillCols,
    grillRows,
  ]);

  // Dimension lines positions (SVG coords)
  // Horizontal dimension line (top)
  const hDimY = -80;
  // Vertical dimension line (left)
  const vDimX = -90;

  // For dimension line ends
  const dimPad = 60;
  const w = safeMm(width, 1500);
  const h = safeMm(height, 2000);
  const panelWidth = (w + overlap) / 2;
  const rightPanelDimCenterX = w - (panelWidth - frameThickness) / 2;

  // For panel widths (panel dimension at bottom)
  const panelDimYOffset = h + 60;

  const glassGh = h - frameThickness * 2 - innerFrameThickness * 2;
  const gwLeft = panelWidth - frameThickness - innerFrameThickness;
  const gwRight = panelWidth - frameThickness - innerFrameThickness * 2;

  dimsRef.current = {
    w,
    h,
    ox: origin.x,
    oy: origin.y,
    panelWidth,
    ft: frameThickness,
    ift: innerFrameThickness,
  };

  const onHandleGripPointerDown = useCallback((panel) => (e) => {
    if (!svgRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    const D = dimsRef.current;
    const gw =
      panel === "left"
        ? D.panelWidth - frameThickness - innerFrameThickness
        : D.panelWidth - frameThickness - innerFrameThickness * 2;
    const gh = D.h - frameThickness * 2 - innerFrameThickness * 2;
    handleDragRef.current = {
      panel,
      gw,
      gh,
      ft: frameThickness,
      ift: innerFrameThickness,
      pw: D.panelWidth,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  const onPartitionOverlayPointerDown = useCallback(
    (e) => {
      if (!partitionTool || !svgRef.current) return;
      e.stopPropagation();
      e.preventDefault();
      partitionDrawActiveRef.current = true;
      const D = dimsRef.current;
      const p = clientToSvgPoint(svgRef.current, e.clientX, e.clientY);
      const lx = p.x - D.ox;
      const ly = p.y - D.oy;
      const innerL = frameThickness + innerFrameThickness;
      const innerR = D.w - frameThickness - innerFrameThickness;
      const innerT = frameThickness + innerFrameThickness;
      const innerB = D.h - frameThickness - innerFrameThickness;
      if (partitionTool === "v") {
        setPartitionDraft({
          axis: "v",
          pos: Math.min(innerR, Math.max(innerL, lx)),
        });
      } else {
        setPartitionDraft({
          axis: "h",
          pos: Math.min(innerB, Math.max(innerT, ly)),
        });
      }
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [partitionTool]
  );

  const vbEmpty = `0 0 ${SHEET_W} ${SHEET_H}`;
  const vbDesign = `${origin.x - paddingX / 2} ${origin.y - paddingY / 2} ${w + paddingX} ${h + paddingY}`;

  return (
    <div className="w-full h-screen flex flex-col justify-center items-center">
      <div className="flex flex-col md:flex-row shadow-2xl bg-zinc-900 bg-opacity-80 border border-zinc-700 max-w-[1980px] w-full items-stretch min-h-0">
        <aside className="flex w-[240px] shrink-0 flex-col border-b md:border-b-0 md:border-r border-zinc-700 bg-zinc-950 text-zinc-200 max-h-[40vh] md:max-h-none md:min-h-[min(100vh,900px)]">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-cyan-400/90 border-b border-zinc-800">
            Window components
          </div>
          <div className="flex border-b border-zinc-800 shrink-0">
            {[
              ["components", "Components"],
              ["partitions", "Partitions"],
              ["customize", "Customize"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setLeftRailTab(id)}
                className={`flex-1 px-1 py-2.5 text-[11px] font-semibold leading-tight border-b-2 transition-colors ${
                  leftRailTab === id
                    ? "border-cyan-400 text-cyan-100 bg-zinc-900/80"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs min-h-0">
            {leftRailTab === "components" && (
              <>
                <p className="text-zinc-500 leading-snug">
                  Drag items onto the placed window. Grill applies per sash;
                  handle drop snaps to the nearest glass corner zone.
                </p>
                <div
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      COMPONENT_MIME,
                      JSON.stringify({ kind: "grill" })
                    );
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  className="cursor-grab active:cursor-grabbing rounded-lg border border-dashed border-amber-500/60 bg-amber-950/30 px-3 py-3 text-center text-amber-100/95 text-sm font-medium select-none"
                >
                  Grill pattern
                  <span className="block text-[10px] text-amber-200/70 mt-1 font-normal">
                    Drop on left or right sash
                  </span>
                </div>
                <div
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      COMPONENT_MIME,
                      JSON.stringify({ kind: "handle" })
                    );
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  className="cursor-grab active:cursor-grabbing rounded-lg border border-dashed border-slate-400/70 bg-slate-900/50 px-3 py-3 text-center text-slate-100 text-sm font-medium select-none"
                >
                  Handle (position)
                  <span className="block text-[10px] text-slate-400 mt-1 font-normal">
                    Drop on sash to place / use cyan grip to drag
                  </span>
                </div>
              </>
            )}
            {leftRailTab === "partitions" && (
              <>
                <p className="text-zinc-500 leading-snug">
                  Choose a mullion tool, then press and drag on the glass area
                  to set a vertical or horizontal partition.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={!showDesign}
                    onClick={() => setPartitionTool(null)}
                    className="rounded-lg border border-zinc-600 px-3 py-2 text-left text-sm hover:bg-zinc-800 disabled:opacity-40"
                  >
                    None (view only)
                  </button>
                  <button
                    type="button"
                    disabled={!showDesign}
                    onClick={() => setPartitionTool("v")}
                    className={`rounded-lg border px-3 py-2 text-left text-sm disabled:opacity-40 ${
                      partitionTool === "v"
                        ? "border-cyan-500 bg-cyan-950/50 text-cyan-100"
                        : "border-zinc-600 hover:bg-zinc-800"
                    }`}
                  >
                    Vertical mullion
                  </button>
                  <button
                    type="button"
                    disabled={!showDesign}
                    onClick={() => setPartitionTool("h")}
                    className={`rounded-lg border px-3 py-2 text-left text-sm disabled:opacity-40 ${
                      partitionTool === "h"
                        ? "border-cyan-500 bg-cyan-950/50 text-cyan-100"
                        : "border-zinc-600 hover:bg-zinc-800"
                    }`}
                  >
                    Horizontal mullion
                  </button>
                </div>
                {partitionTool && showDesign && (
                  <p className="text-cyan-300/90 text-[11px]">
                    Active: drag on the cyan tint inside the frame to place.
                  </p>
                )}
              </>
            )}
            {leftRailTab === "customize" && (
              <>
                <p className="text-zinc-500 leading-snug">
                  Grid density for grills (after you drop a grill on a sash).
                </p>
                <label className="block text-zinc-400 text-[11px] font-semibold">
                  Grill columns
                </label>
                <input
                  type="number"
                  min={2}
                  max={12}
                  value={grillCols}
                  onChange={(e) =>
                    setGrillCols(
                      Math.min(12, Math.max(2, Number(e.target.value) || 2))
                    )
                  }
                  className="w-full rounded border border-zinc-600 bg-zinc-900 px-2 py-1.5 text-sm text-white"
                />
                <label className="block text-zinc-400 text-[11px] font-semibold mt-2">
                  Grill rows
                </label>
                <input
                  type="number"
                  min={2}
                  max={16}
                  value={grillRows}
                  onChange={(e) =>
                    setGrillRows(
                      Math.min(16, Math.max(2, Number(e.target.value) || 2))
                    )
                  }
                  className="w-full rounded border border-zinc-600 bg-zinc-900 px-2 py-1.5 text-sm text-white"
                />
                <p className="text-zinc-600 text-[10px] pt-2">
                  Partitions can also be chosen here or under Partitions — same
                  tools.
                </p>
                <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
                  <span className="text-zinc-400 text-[11px] font-semibold">
                    Quick partition
                  </span>
                  <button
                    type="button"
                    disabled={!showDesign}
                    onClick={() => setPartitionTool("v")}
                    className="rounded border border-zinc-600 px-2 py-1.5 text-[11px] hover:bg-zinc-800 disabled:opacity-40"
                  >
                    Draw vertical
                  </button>
                  <button
                    type="button"
                    disabled={!showDesign}
                    onClick={() => setPartitionTool("h")}
                    className="rounded border border-zinc-600 px-2 py-1.5 text-[11px] hover:bg-zinc-800 disabled:opacity-40"
                  >
                    Draw horizontal
                  </button>
                  <button
                    type="button"
                    disabled={!showDesign}
                    onClick={() => setPartitionTool(null)}
                    className="rounded border border-zinc-600 px-2 py-1.5 text-[11px] hover:bg-zinc-800 disabled:opacity-40"
                  >
                    Clear partition tool
                  </button>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* Drawing surface */}
        <div className="flex-1 flex flex-col items-center justify-center relative min-w-0 min-h-[50vh] md:min-h-[min(100vh,900px)]">
          <p className="absolute top-3 left-1/2 z-10 -translate-x-1/2 text-center text-sm text-cyan-100/90 px-3 py-1 rounded bg-zinc-950/60 border border-cyan-800/40 pointer-events-none max-w-[90vw]">
            {showDesign
              ? partitionTool
                ? `Partition tool: ${partitionTool === "v" ? "vertical" : "horizontal"} — drag on the frame interior. Clear tool in the left rail when done.`
                : "Drag cyan grip circles to move handles (snap near corners). Blue edges resize the frame."
              : "Empty sheet: draw the opening or drop the sliding panel from the right bar."}
          </p>
          <svg
            ref={svgRef}
            id="window-svg-preview"
            viewBox={showDesign ? vbDesign : vbEmpty}
            className="w-full h-screen drop-shadow-2xl rounded-lg bg-gradient-to-bl from-zinc-800 via-zinc-800 to-cyan-950"
            preserveAspectRatio="xMidYMid meet"
            style={{
              background: "linear-gradient(110deg,#334155 93%,#0891b2 119%)",
              touchAction: "none",
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (!svgRef.current) return;
              const compRaw = e.dataTransfer.getData(COMPONENT_MIME);
              if (compRaw && showDesign) {
                try {
                  const { kind } = JSON.parse(compRaw);
                  const p = clientToSvgPoint(
                    svgRef.current,
                    e.clientX,
                    e.clientY
                  );
                  const lx = p.x - origin.x;
                  const ly = p.y - origin.y;
                  const ww = safeMm(width, 1500);
                  const hh = safeMm(height, 2000);
                  const pW = (ww + overlap) / 2;
                  const gWL = pW - frameThickness - innerFrameThickness;
                  const gWR =
                    pW - frameThickness - innerFrameThickness * 2;
                  const gH =
                    hh - frameThickness * 2 - innerFrameThickness * 2;
                  if (lx >= 0 && ly >= 0 && lx <= ww && ly <= hh) {
                    if (kind === "grill") {
                      if (lx < pW) setGrillLeft(true);
                      else setGrillRight(true);
                      return;
                    }
                    if (kind === "handle") {
                      if (lx < pW) {
                        const plx = lx - frameThickness - innerFrameThickness;
                        const ply = ly - frameThickness - innerFrameThickness;
                        setLeftHandleUV(
                          snapHandleUV(plx / gWL, ply / gH)
                        );
                      } else {
                        const plx =
                          lx - (ww - pW) - innerFrameThickness;
                        const ply = ly - frameThickness - innerFrameThickness;
                        setRightHandleUV(
                          snapHandleUV(plx / gWR, ply / gH)
                        );
                      }
                      return;
                    }
                  }
                } catch {
                  /* ignore */
                }
              }
              const kind = e.dataTransfer.getData("application/x-3dcfg-part");
              if (kind !== "sliding_two_panel") return;
              const dw = 1500;
              const dh = 2000;
              setWidth(dw);
              setHeight(dh);
              setOrigin({
                x: Math.max(0, (SHEET_W - dw) / 2),
                y: Math.max(0, (SHEET_H - dh) / 2),
              });
              setShowDesign(true);
            }}
          >
            {showDesign ? (
              <g transform={`translate(${origin.x},${origin.y})`}>
            {/* BG effect */}
            <rect
              x={-dimPad}
              y={-dimPad}
              width={w + dimPad * 2}
              height={h + dimPad * 2}
              fill="#222"
              opacity="0.09"
              rx={60}
            />

            {/*   Dimension Lines & Labels   */}
            {/* Top width dimension */}
            <DimensionArrow
              x1={0}
              y1={hDimY}
              x2={w}
              y2={hDimY}
              color="#0ea5e9"
            />
            {/* Left guide lines for width ticks */}
            <line
              x1={0}
              y1={hDimY - 18}
              x2={0}
              y2={-dimPad + 12}
              stroke="#0ea5e9"
              strokeWidth={3}
            />
            <line
              x1={w}
              y1={hDimY - 18}
              x2={w}
              y2={-dimPad + 12}
              stroke="#0ea5e9"
              strokeWidth={3}
            />
            {/* Width label */}
            <PrettyLabel value={`${w} mm`} x={w / 2} y={hDimY - 34} />

            {/* Left height dimension */}
            <DimensionArrow
              x1={vDimX}
              y1={0}
              x2={vDimX}
              y2={h}
              color="#0ea5e9"
            />
            {/* Up/down ticks for left height */}
            <line
              x1={vDimX - 18}
              y1={0}
              x2={-dimPad + 8}
              y2={0}
              stroke="#0ea5e9"
              strokeWidth={3}
            />
            <line
              x1={vDimX - 18}
              y1={h}
              x2={-dimPad + 8}
              y2={h}
              stroke="#0ea5e9"
              strokeWidth={3}
            />
            {/* Height label */}
            <PrettyLabel
              value={`${h} mm`}
              x={vDimX - 56}
              y={h / 2}
              orient="v"
            />

            {/* Panel width dims (bottom, to left and right) */}
            {/* Left Panel (A2) */}
            <DimensionArrow
              x1={0}
              y1={panelDimYOffset}
              x2={panelWidth - frameThickness}
              y2={panelDimYOffset}
              color="#0ea5e9"
            />
            <PrettyLabel
              value={`${Math.round(panelWidth - frameThickness)} mm`}
              x={(panelWidth - frameThickness) / 2}
              y={panelDimYOffset + 38}
            />
            {/* Panel ticks */}
            <line
              x1={0}
              y1={panelDimYOffset - 16}
              x2={0}
              y2={panelDimYOffset + 16}
              stroke="#0ea5e9"
              strokeWidth={2.3}
            />
            <line
              x1={panelWidth - frameThickness}
              y1={panelDimYOffset - 16}
              x2={panelWidth - frameThickness}
              y2={panelDimYOffset + 16}
              stroke="#0ea5e9"
              strokeWidth={2.3}
            />

            {/* Right Panel (A1) */}
            <DimensionArrow
              x1={w - (panelWidth - frameThickness)}
              y1={panelDimYOffset}
              x2={w}
              y2={panelDimYOffset}
              color="#0ea5e9"
            />
            <PrettyLabel
              value={`${Math.round(panelWidth - frameThickness)} mm`}
              x={rightPanelDimCenterX}
              y={panelDimYOffset + 38}
            />
            <line
              x1={w - (panelWidth - frameThickness)}
              y1={panelDimYOffset - 16}
              x2={w - (panelWidth - frameThickness)}
              y2={panelDimYOffset + 16}
              stroke="#0ea5e9"
              strokeWidth={2.3}
            />
            <line
              x1={w}
              y1={panelDimYOffset - 16}
              x2={w}
              y2={panelDimYOffset + 16}
              stroke="#0ea5e9"
              strokeWidth={2.3}
            />

            {/*   Window Drawing   */}
            {/* Background shadow for realistic feel */}
            <rect x="0" y="0" width={w} height={h} fill="#000" opacity="0.05" />

            {/* Outer Frame */}
            <rect
              x="0"
              y="0"
              width={w}
              height={h}
              fill={frameColor}
              stroke="#374151"
              strokeWidth="4"
            />
            <rect
              x={frameThickness}
              y={frameThickness}
              width={w - frameThickness * 2}
              height={h - frameThickness * 2}
              fill="transparent"
              stroke="#374151"
              strokeWidth="2"
            />

            {/* Frame diagonal joints */}
            <line
              x1="0"
              y1="0"
              x2={frameThickness}
              y2={frameThickness}
              stroke="#374151"
              strokeWidth="2"
            />
            <line
              x1={w}
              y1="0"
              x2={w - frameThickness}
              y2={frameThickness}
              stroke="#374151"
              strokeWidth="2"
            />
            <line
              x1="0"
              y1={h}
              x2={frameThickness}
              y2={h - frameThickness}
              stroke="#374151"
              strokeWidth="2"
            />
            <line
              x1={w}
              y1={h}
              x2={w - frameThickness}
              y2={h - frameThickness}
              stroke="#374151"
              strokeWidth="2"
            />

            {/* Left Panel (A2 - Back Panel) */}
            <g transform={`translate(${frameThickness}, ${frameThickness})`}>
              {/* Outer edge of left panel */}
              <rect
                x="0"
                y="0"
                width={panelWidth - frameThickness}
                height={h - frameThickness * 2}
                fill={frameColor}
                stroke="#374151"
                strokeWidth="2"
              />
              {/* Left panel glass */}
              <rect
                x={innerFrameThickness}
                y={innerFrameThickness}
                width={panelWidth - frameThickness - innerFrameThickness}
                height={h - frameThickness * 2 - innerFrameThickness * 2}
                fill={glassColor}
                stroke="#a1a1aa"
                strokeWidth="1"
              />
              {grillLeft && (
                <g pointerEvents="none" opacity={0.88}>
                  {Array.from({ length: Math.max(2, grillCols) - 1 }, (_, i) => {
                    const gwLoc =
                      panelWidth - frameThickness - innerFrameThickness;
                    const gx =
                      innerFrameThickness + ((i + 1) * gwLoc) / grillCols;
                    return (
                      <line
                        key={`lgc-${i}`}
                        x1={gx}
                        y1={innerFrameThickness}
                        x2={gx}
                        y2={h - frameThickness * 2 - innerFrameThickness}
                        stroke="#0f172a"
                        strokeWidth={4}
                      />
                    );
                  })}
                  {Array.from({ length: Math.max(2, grillRows) - 1 }, (_, j) => {
                    const gy =
                      innerFrameThickness + ((j + 1) * glassGh) / grillRows;
                    return (
                      <line
                        key={`lgr-${j}`}
                        x1={innerFrameThickness}
                        y1={gy}
                        x2={panelWidth - frameThickness - innerFrameThickness}
                        y2={gy}
                        stroke="#0f172a"
                        strokeWidth={4}
                      />
                    );
                  })}
                </g>
              )}
              {/* Left panel diagonal joints */}
              <line
                x1="0"
                y1="0"
                x2={innerFrameThickness}
                y2={innerFrameThickness}
                stroke="#374151"
                strokeWidth="1"
              />
              <line
                x1={panelWidth - frameThickness}
                y1="0"
                x2={panelWidth - frameThickness - innerFrameThickness}
                y2={innerFrameThickness}
                stroke="#374151"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1={h - frameThickness * 2}
                x2={innerFrameThickness}
                y2={h - frameThickness * 2 - innerFrameThickness}
                stroke="#374151"
                strokeWidth="1"
              />
              <line
                x1={panelWidth - frameThickness}
                y1={h - frameThickness * 2}
                x2={panelWidth - frameThickness - innerFrameThickness}
                y2={h - frameThickness * 2 - innerFrameThickness}
                stroke="#374151"
                strokeWidth="1"
              />

              {/* A2 Arrow */}
              <g
                transform={`translate(${(panelWidth - frameThickness) / 2}, ${(h - frameThickness * 2) / 2})`}
              >
                <line
                  x1="-60"
                  y1="0"
                  x2="60"
                  y2="0"
                  stroke="#111827"
                  strokeWidth="6"
                />
                <polyline
                  points="30,-30 60,0 30,30"
                  fill="none"
                  stroke="#111827"
                  strokeWidth="6"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <text
                  x="0"
                  y="50"
                  textAnchor="middle"
                  fill="#111827"
                  fontSize="40"
                  fontFamily="sans-serif"
                  fontWeight="bold"
                >
                  A2
                </text>
              </g>
            </g>

            {/* Right Panel (A1 - Front Panel) */}
            <g transform={`translate(${w - panelWidth}, ${frameThickness})`}>
              {/* Outer edge of right panel */}
              <rect
                x="0"
                y="0"
                width={panelWidth - frameThickness}
                height={h - frameThickness * 2}
                fill={frameColor}
                stroke="#374151"
                strokeWidth="2"
              />

              {/* Right panel glass */}
              <rect
                x={innerFrameThickness}
                y={innerFrameThickness}
                width={panelWidth - frameThickness - innerFrameThickness * 2}
                height={h - frameThickness * 2 - innerFrameThickness * 2}
                fill={glassColor}
                stroke="#a1a1aa"
                strokeWidth="1"
              />

              {grillRight && (
                <g pointerEvents="none" opacity={0.88}>
                  {Array.from({ length: Math.max(2, grillCols) - 1 }, (_, i) => {
                    const gx =
                      innerFrameThickness + ((i + 1) * gwRight) / grillCols;
                    return (
                      <line
                        key={`rgc-${i}`}
                        x1={gx}
                        y1={innerFrameThickness}
                        x2={gx}
                        y2={h - frameThickness * 2 - innerFrameThickness}
                        stroke="#0f172a"
                        strokeWidth={4}
                      />
                    );
                  })}
                  {Array.from({ length: Math.max(2, grillRows) - 1 }, (_, j) => {
                    const gy =
                      innerFrameThickness + ((j + 1) * glassGh) / grillRows;
                    return (
                      <line
                        key={`rgr-${j}`}
                        x1={innerFrameThickness}
                        y1={gy}
                        x2={innerFrameThickness + gwRight}
                        y2={gy}
                        stroke="#0f172a"
                        strokeWidth={4}
                      />
                    );
                  })}
                </g>
              )}

              {/* Right panel diagonal joints */}
              <line
                x1="0"
                y1="0"
                x2={innerFrameThickness}
                y2={innerFrameThickness}
                stroke="#374151"
                strokeWidth="1"
              />
              <line
                x1={panelWidth - frameThickness}
                y1="0"
                x2={panelWidth - frameThickness - innerFrameThickness}
                y2={innerFrameThickness}
                stroke="#374151"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1={h - frameThickness * 2}
                x2={innerFrameThickness}
                y2={h - frameThickness * 2 - innerFrameThickness}
                stroke="#374151"
                strokeWidth="1"
              />
              <line
                x1={panelWidth - frameThickness}
                y1={h - frameThickness * 2}
                x2={panelWidth - frameThickness - innerFrameThickness}
                y2={h - frameThickness * 2 - innerFrameThickness}
                stroke="#374151"
                strokeWidth="1"
              />

              {/* A1 Arrow */}
              <g
                transform={`translate(${(panelWidth - frameThickness) / 2}, ${(h - frameThickness * 2) / 2})`}
              >
                <line
                  x1="60"
                  y1="0"
                  x2="-60"
                  y2="0"
                  stroke="#111827"
                  strokeWidth="6"
                />
                <polyline
                  points="-30,-30 -60,0 -30,30"
                  fill="none"
                  stroke="#111827"
                  strokeWidth="6"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <text
                  x="0"
                  y="50"
                  textAnchor="middle"
                  fill="#111827"
                  fontSize="40"
                  fontFamily="sans-serif"
                  fontWeight="bold"
                >
                  A1
                </text>
              </g>
            </g>

            <g pointerEvents="none">
              {partitions.map((p) =>
                p.axis === "v" ? (
                  <line
                    key={p.id}
                    x1={p.pos}
                    y1={frameThickness}
                    x2={p.pos}
                    y2={h - frameThickness}
                    stroke="#27272a"
                    strokeWidth={16}
                  />
                ) : (
                  <line
                    key={p.id}
                    x1={frameThickness}
                    y1={p.pos}
                    x2={w - frameThickness}
                    y2={p.pos}
                    stroke="#27272a"
                    strokeWidth={16}
                  />
                )
              )}
              {partitionDraft?.axis === "v" && (
                <line
                  x1={partitionDraft.pos}
                  y1={frameThickness}
                  x2={partitionDraft.pos}
                  y2={h - frameThickness}
                  stroke="#22d3ee"
                  strokeWidth={5}
                  strokeDasharray="12 8"
                />
              )}
              {partitionDraft?.axis === "h" && (
                <line
                  x1={frameThickness}
                  y1={partitionDraft.pos}
                  x2={w - frameThickness}
                  y2={partitionDraft.pos}
                  stroke="#22d3ee"
                  strokeWidth={5}
                  strokeDasharray="12 8"
                />
              )}
            </g>

            {partitionTool && (
              <rect
                x={frameThickness}
                y={frameThickness}
                width={w - frameThickness * 2}
                height={h - frameThickness * 2}
                fill="rgba(34,211,238,0.05)"
                style={{
                  cursor:
                    partitionTool === "v" ? "col-resize" : "row-resize",
                }}
                onPointerDown={onPartitionOverlayPointerDown}
              />
            )}

            <g pointerEvents="all">
              <g
                transform={`translate(${frameThickness + innerFrameThickness + leftHandleUV.u * gwLeft}, ${frameThickness + innerFrameThickness + leftHandleUV.v * glassGh})`}
              >
                <rect
                  x="-15"
                  y="-120"
                  width="30"
                  height="240"
                  rx="15"
                  fill={handleColor}
                  stroke="#4b5563"
                  strokeWidth="3"
                />
                <rect
                  x="-5"
                  y="-80"
                  width="10"
                  height="160"
                  rx="5"
                  fill="#9ca3af"
                />
                <circle
                  r="38"
                  fill="rgba(34,211,238,0.22)"
                  stroke="#22d3ee"
                  strokeWidth="2"
                  style={{ cursor: "grab" }}
                  onPointerDown={onHandleGripPointerDown("left")}
                />
              </g>
              <g
                transform={`translate(${w - panelWidth + innerFrameThickness + rightHandleUV.u * gwRight}, ${frameThickness + innerFrameThickness + rightHandleUV.v * glassGh})`}
              >
                <rect
                  x="-15"
                  y="-120"
                  width="30"
                  height="240"
                  rx="15"
                  fill={handleColor}
                  stroke="#4b5563"
                  strokeWidth="3"
                />
                <rect
                  x="-5"
                  y="-80"
                  width="10"
                  height="160"
                  rx="5"
                  fill="#9ca3af"
                />
                <circle
                  r="38"
                  fill="rgba(34,211,238,0.22)"
                  stroke="#22d3ee"
                  strokeWidth="2"
                  style={{ cursor: "grab" }}
                  onPointerDown={onHandleGripPointerDown("right")}
                />
              </g>
            </g>

            {/* Interactive resize zones (mm space, outer frame) */}
            <g pointerEvents="all">
              <rect
                x={w - HANDLE_HIT}
                y={frameThickness}
                width={HANDLE_HIT}
                height={h - frameThickness * 2}
                fill="rgba(14,165,233,0.1)"
                stroke="#22d3ee"
                strokeWidth={2}
                style={{ cursor: "ew-resize" }}
                onPointerDown={onResizePointerDown("e")}
                onPointerUp={onResizePointerUp}
                onPointerCancel={onResizePointerUp}
              />
              <rect
                x={frameThickness}
                y={h - HANDLE_HIT}
                width={w - frameThickness * 2}
                height={HANDLE_HIT}
                fill="rgba(14,165,233,0.1)"
                stroke="#22d3ee"
                strokeWidth={2}
                style={{ cursor: "ns-resize" }}
                onPointerDown={onResizePointerDown("s")}
                onPointerUp={onResizePointerUp}
                onPointerCancel={onResizePointerUp}
              />
              <rect
                x={w - HANDLE_HIT}
                y={h - HANDLE_HIT}
                width={HANDLE_HIT}
                height={HANDLE_HIT}
                fill="rgba(14,165,233,0.28)"
                stroke="#0ea5e9"
                strokeWidth={2.5}
                style={{ cursor: "nwse-resize" }}
                onPointerDown={onResizePointerDown("se")}
                onPointerUp={onResizePointerUp}
                onPointerCancel={onResizePointerUp}
              />
            </g>
            </g>
            ) : (
              <>
                <defs>
                  <pattern
                    id="empty-grid"
                    width="100"
                    height="100"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 100 0 L 0 0 0 100"
                      fill="none"
                      stroke="#334155"
                      strokeWidth="1.2"
                    />
                  </pattern>
                </defs>
                <rect
                  x={0}
                  y={0}
                  width={SHEET_W}
                  height={SHEET_H}
                  rx={16}
                  fill="#0f172a"
                />
                <rect
                  x={0}
                  y={0}
                  width={SHEET_W}
                  height={SHEET_H}
                  fill="url(#empty-grid)"
                  opacity="0.45"
                />
                <text
                  x={SHEET_W / 2}
                  y={SHEET_H / 2 - 28}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="42"
                  fontFamily="sans-serif"
                >
                  Draw opening (click + drag)
                </text>
                <text
                  x={SHEET_W / 2}
                  y={SHEET_H / 2 + 28}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="26"
                  fontFamily="sans-serif"
                >
                  or drop a panel from the sidebar · mm scale
                </text>
                {draftRect && draftRect.w + draftRect.h > 0 && (
                  <rect
                    x={draftRect.x}
                    y={draftRect.y}
                    width={draftRect.w}
                    height={draftRect.h}
                    fill="rgba(34,211,238,0.12)"
                    stroke="#22d3ee"
                    strokeWidth="4"
                    strokeDasharray="12 8"
                    pointerEvents="none"
                  />
                )}
                <rect
                  x={0}
                  y={0}
                  width={SHEET_W}
                  height={SHEET_H}
                  fill="transparent"
                  style={{ cursor: "crosshair" }}
                  onPointerDown={onEmptySheetPointerDown}
                />
              </>
            )}
          </svg>
        </div>
        {/* Side panel config */}
        <div className="config flex flex-col bg-gradient-to-t from-cyan-950/80 via-zinc-900/80 to-zinc-800/90 rounded-xl px-5 py-6 my-auto w-full max-w-xs mx-2 shadow-lg items-center border-cyan-900/30 border-2 max-h-[calc(100vh-2rem)] overflow-y-auto">
          <h2 className="text-2xl font-bold tracking-wide text-cyan-200 mb-2">
            Window Config
          </h2>
          {showDesign && (
            <button
              type="button"
              onClick={clearCanvas}
              className="mb-3 w-full py-2.5 rounded-lg border border-amber-500/50 text-amber-100 text-sm font-semibold hover:bg-amber-950/35 transition-colors"
            >
              Clear canvas
            </button>
          )}
          <PrettyLabelUI>Part library</PrettyLabelUI>
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(
                "application/x-3dcfg-part",
                "sliding_two_panel"
              );
              e.dataTransfer.effectAllowed = "copy";
            }}
            className="w-full mb-4 cursor-grab active:cursor-grabbing rounded-lg border-2 border-dashed border-cyan-500/70 bg-cyan-950/40 px-3 py-3 text-center text-cyan-100 text-sm font-medium select-none hover:bg-cyan-900/40 transition-colors"
          >
            Sliding 2-panel (A2 + A1)
            <span className="block text-xs text-cyan-300/80 mt-1 font-normal">
              Drag onto the canvas to show the assembly (centered)
            </span>
          </div>
          <PrettyLabelUI>Width</PrettyLabelUI>
          <PrettyInput
            type="number"
            min="0"
            step="1"
            value={width}
            onChange={handleWidthChange}
            placeholder="Width (mm)"
            disabled={!showDesign}
          />
          <PrettyLabelUI>Height</PrettyLabelUI>
          <PrettyInput
            type="number"
            min="0"
            step="1"
            value={height}
            onChange={handleHeightChange}
            placeholder="Height (mm)"
            disabled={!showDesign}
          />
          <PrettyLabelUI>Frame Color</PrettyLabelUI>
          <input
            type="color"
            className="w-10 h-10 rounded border-2 border-cyan-500 bg-cyan-50 my-1 disabled:opacity-40"
            value={frameColor}
            onChange={(e) => setFrameColor(e.target.value)}
            disabled={!showDesign}
          />
          <PrettyLabelUI>Glass Color</PrettyLabelUI>
          <input
            type="color"
            className="w-10 h-10 rounded border-2 border-cyan-500 bg-cyan-50 my-1 disabled:opacity-40"
            value={glassColor.startsWith("rgba") ? "#6ee7db" : glassColor}
            // keeps previous when using color input, updates to picked color
            onChange={(e) => setGlassColor(e.target.value)}
            disabled={!showDesign}
          />
          <p className="text-zinc-500 text-xs text-center mt-2 leading-snug max-w-[14rem]">
            Sash handles: drag the <span className="text-cyan-400">cyan ring</span>{" "}
            on the drawing; release near a corner to snap.
          </p>

          <PrettyLabelUI>Engineer preview</PrettyLabelUI>
          {showDesign ? (
            <>
              <div className="w-full rounded-lg border border-zinc-600 bg-zinc-950/80 p-2 mb-2">
                <svg
                  viewBox={`0 0 ${w} ${h}`}
                  className="w-full h-24 text-zinc-200"
                  preserveAspectRatio="xMidYMid meet"
                  aria-hidden
                >
                  <rect
                    x={frameThickness}
                    y={frameThickness}
                    width={w - frameThickness * 2}
                    height={h - frameThickness * 2}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={w * 0.004}
                  />
                  <line
                    x1={panelWidth}
                    y1={frameThickness}
                    x2={panelWidth}
                    y2={h - frameThickness}
                    stroke="currentColor"
                    strokeWidth={w * 0.003}
                    strokeDasharray="6 4"
                  />
                  <text
                    x={frameThickness + (panelWidth - frameThickness) / 2}
                    y={h / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#67e8f9"
                    fontSize={Math.max(18, w * 0.04)}
                    fontWeight="bold"
                  >
                    A2
                  </text>
                  <text
                    x={panelWidth + (w - panelWidth - frameThickness) / 2}
                    y={h / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#67e8f9"
                    fontSize={Math.max(18, w * 0.04)}
                    fontWeight="bold"
                  >
                    A1
                  </text>
                </svg>
                <p className="text-[10px] text-zinc-400 mt-1 font-mono leading-tight">
                  {w}×{h} mm · stile @{Math.round(panelWidth)} mm
                </p>
              </div>

              <PrettyLabelUI>Build spec (3D / BOM)</PrettyLabelUI>
              <pre className="w-full text-left text-[10px] leading-snug text-emerald-200/90 bg-black/50 border border-zinc-700 rounded p-2 max-h-36 overflow-auto font-mono">
                {JSON.stringify(windowBuildSpec, null, 2)}
              </pre>
            </>
          ) : (
            <p className="w-full text-sm text-zinc-500 text-center py-6 px-2 border border-dashed border-zinc-600 rounded-lg">
              Draw the opening on the sheet or drop a panel here to unlock
              dimensions, preview, and build data.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TwoD;
