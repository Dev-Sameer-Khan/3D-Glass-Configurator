import { useState, useRef, useEffect, useCallback } from "react";

const GRID = 10;
const snap = v => Math.round(v / GRID) * GRID;
const MIN_PANEL = 60;
const P = {
  bg: "#0f1117", surface: "#181c27", panel: "#1e2334", border: "#2a3050",
  accent: "#3b82f6", accentGlow: "#60a5fa", text: "#e2e8f0", textMuted: "#64748b",
  warning: "#f59e0b",
};
const TOOLS = [
  { id: "select", icon: "⊹", label: "Select/Move" },
  { id: "draw", icon: "▭", label: "Draw Frame" },
  { id: "partition", icon: "⊟", label: "Add Partition" },
  { id: "flap", icon: "↗", label: "Add Flap/Sash" },
  { id: "grill", icon: "⊞", label: "Add Grill" },
  { id: "handle", icon: "⌂", label: "Add Handle" },
  { id: "delete", icon: "✕", label: "Delete" },
];
const SASH_TYPES = [
  { id: "casement-left", label: "Casement Left", icon: "◁" },
  { id: "casement-right", label: "Casement Right", icon: "▷" },
  { id: "sliding", label: "Sliding", icon: "⇄" },
  { id: "fixed", label: "Fixed", icon: "□" },
  { id: "tilt-turn", label: "Tilt & Turn", icon: "↺" },
  { id: "awning", label: "Awning", icon: "△" },
  { id: "door-left", label: "Door Left", icon: "🚪" },
  { id: "door-right", label: "Door Right", icon: "🚪" },
];
const GRILL_PATTERNS = [
  { id: "grid", label: "Grid", cols: 3, rows: 3 },
  { id: "vertical", label: "Vertical", cols: 3, rows: 1 },
  { id: "horizontal", label: "Horizontal", cols: 1, rows: 3 },
  { id: "diamond", label: "Diamond", cols: 2, rows: 2 },
];

let _id = 1;
const uid = () => `id_${_id++}`;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function getCells(frame) {
  const vRatios = frame.partitions.filter(p => p.dir === "v").map(p => p.ratio).sort((a, b) => a - b);
  const hRatios = frame.partitions.filter(p => p.dir === "h").map(p => p.ratio).sort((a, b) => a - b);
  const xs = [0, ...vRatios.map(r => r * frame.w), frame.w];
  const ys = [0, ...hRatios.map(r => r * frame.h), frame.h];
  const cells = [];
  const FT = 8;
  for (let row = 0; row < ys.length - 1; row++) {
    for (let col = 0; col < xs.length - 1; col++) {
      cells.push({ id: `${row}-${col}`, cx: xs[col] + FT, cy: ys[row] + FT, cw: xs[col+1]-xs[col]-FT*2, ch: ys[row+1]-ys[row]-FT*2, row, col });
    }
  }
  return cells;
}

function CellSVG({ ax, ay, cell, sash, grill, handle }) {
  const { cx, cy, cw, ch } = cell;
  const x = ax + cx, y = ay + cy;

  const renderSash = () => {
    if (!sash) return null;
    const t = sash.type, pad = 4;
    const sx = x+pad, sy = y+pad, sw = cw-pad*2, sh = ch-pad*2;
    if (t === "fixed") return (
      <g>
        <rect x={sx} y={sy} width={sw} height={sh} fill="rgba(100,180,255,0.22)" stroke="#60a5fa" strokeWidth={1.5} rx={1}/>
        <line x1={sx} y1={sy} x2={sx+sw} y2={sy+sh} stroke="#60a5fa" strokeWidth={0.5} strokeDasharray="5 4"/>
        <line x1={sx+sw} y1={sy} x2={sx} y2={sy+sh} stroke="#60a5fa" strokeWidth={0.5} strokeDasharray="5 4"/>
      </g>
    );
    if (t === "casement-left" || t === "door-left") return (
      <g>
        <rect x={sx} y={sy} width={sw} height={sh} fill="rgba(100,180,255,0.22)" stroke="#60a5fa" strokeWidth={1.5} rx={1}/>
        <path d={`M${sx} ${sy+sh/2} L${sx+sw*0.8} ${sy+8} L${sx+sw*0.8} ${sy+sh-8} Z`} fill="rgba(100,180,255,0.12)" stroke="#3b82f6" strokeWidth={1} strokeDasharray="5 3"/>
      </g>
    );
    if (t === "casement-right" || t === "door-right") return (
      <g>
        <rect x={sx} y={sy} width={sw} height={sh} fill="rgba(100,180,255,0.22)" stroke="#60a5fa" strokeWidth={1.5} rx={1}/>
        <path d={`M${sx+sw} ${sy+sh/2} L${sx+sw*0.2} ${sy+8} L${sx+sw*0.2} ${sy+sh-8} Z`} fill="rgba(100,180,255,0.12)" stroke="#3b82f6" strokeWidth={1} strokeDasharray="5 3"/>
      </g>
    );
    if (t === "sliding") return (
      <g>
        <rect x={sx} y={sy} width={sw/2} height={sh} fill="rgba(100,180,255,0.28)" stroke="#60a5fa" strokeWidth={1.5} rx={1}/>
        <rect x={sx+sw/2} y={sy} width={sw/2} height={sh} fill="rgba(100,180,255,0.14)" stroke="#60a5fa" strokeWidth={1} rx={1}/>
        <text x={sx+sw/2} y={sy+sh/2+5} textAnchor="middle" fill="#93c5fd" fontSize={16}>⇄</text>
      </g>
    );
    if (t === "awning") return (
      <g>
        <rect x={sx} y={sy} width={sw} height={sh} fill="rgba(100,180,255,0.22)" stroke="#60a5fa" strokeWidth={1.5} rx={1}/>
        <path d={`M${sx+8} ${sy+sh*.35} L${sx+sw/2} ${sy+sh} L${sx+sw-8} ${sy+sh*.35}`} fill="rgba(100,180,255,0.12)" stroke="#3b82f6" strokeWidth={1} strokeDasharray="5 3"/>
      </g>
    );
    if (t === "tilt-turn") return (
      <g>
        <rect x={sx} y={sy} width={sw} height={sh} fill="rgba(100,180,255,0.22)" stroke="#60a5fa" strokeWidth={1.5} rx={1}/>
        <path d={`M${sx+8} ${sy+sh} L${sx+sw/2} ${sy+8} L${sx+sw-8} ${sy+sh} Z`} fill="rgba(100,180,255,0.1)" stroke="#3b82f6" strokeWidth={1} strokeDasharray="5 3"/>
        <path d={`M${sx+sw} ${sy+sh/2} L${sx+sw*.22} ${sy+8} L${sx+sw*.22} ${sy+sh-8} Z`} fill="rgba(100,180,255,0.06)" stroke="#60a5fa" strokeWidth={1} strokeDasharray="3 4"/>
      </g>
    );
    return null;
  };

  const renderGrill = () => {
    if (!grill) return null;
    const pat = GRILL_PATTERNS.find(p => p.id === grill.pattern) || GRILL_PATTERNS[0];
    const lines = [];
    for (let c = 1; c < pat.cols; c++) { const lx = x + cw*c/pat.cols; lines.push(<line key={`v${c}`} x1={lx} y1={y} x2={lx} y2={y+ch} stroke="#b45309" strokeWidth={2}/>); }
    for (let r = 1; r < pat.rows; r++) { const ly = y + ch*r/pat.rows; lines.push(<line key={`h${r}`} x1={x} y1={ly} x2={x+cw} y2={ly} stroke="#b45309" strokeWidth={2}/>); }
    if (grill.pattern === "diamond") {
      lines.push(<line key="d1" x1={x} y1={y} x2={x+cw} y2={y+ch} stroke="#b45309" strokeWidth={1.5}/>);
      lines.push(<line key="d2" x1={x+cw} y1={y} x2={x} y2={y+ch} stroke="#b45309" strokeWidth={1.5}/>);
    }
    return <g opacity={0.8}>{lines}</g>;
  };

  return (
    <g>
      <rect x={x} y={y} width={cw} height={ch} fill="rgba(100,180,255,0.10)" stroke="#1d4ed8" strokeWidth={0.5}/>
      {renderSash()}
      {renderGrill()}
      {handle && (
        <g>
          <rect x={x+cw-18} y={y+ch/2-12} width={8} height={24} rx={3} fill="#c0a060" stroke="#8b6914" strokeWidth={1}/>
          <circle cx={x+cw-14} cy={y+ch/2} r={5} fill="#f0d080" stroke="#8b6914" strokeWidth={1}/>
        </g>
      )}
    </g>
  );
}

function FrameSVG({ frame, selected, activeTool, showDimensions, onClick, onDragStart, onResizeStart, onPartDragStart }) {
  const { x, y, w, h } = frame;
  const FT = 8;
  const cells = getCells(frame);
  return (
    <g onClick={onClick} onMouseDown={onDragStart} style={{ cursor: activeTool === "select" ? "move" : "pointer" }}>
      <rect x={x+3} y={y+3} width={w} height={h} rx={2} fill="rgba(0,0,0,0.45)"/>
      <rect x={x} y={y} width={w} height={h} rx={2} fill="#7a5c0e" stroke={selected ? "#3b82f6" : "#5a4510"} strokeWidth={selected ? 2 : 1.5}/>
      <rect x={x+FT} y={y+FT} width={w-FT*2} height={h-FT*2} rx={1} fill="#111827"/>
      {cells.map(cell => (
        <CellSVG key={cell.id} ax={x} ay={y} cell={cell}
          sash={frame.sashes.find(s => s.cellId === cell.id)}
          grill={frame.grills.find(g => g.cellId === cell.id)}
          handle={frame.handles.find(h => h.cellId === cell.id)}
        />
      ))}
      {frame.partitions.filter(p => p.dir === "v").map(p => {
        const px = x + p.ratio * w;
        return (
          <g key={p.id}>
            <rect x={px-4} y={y+FT} width={8} height={h-FT*2} fill="#7a5c0e" stroke="#5a4510" strokeWidth={1}/>
            <rect x={px-7} y={y+h/2-14} width={14} height={28} rx={3} fill="#2a3050" stroke="#3b82f6" strokeWidth={1}
              onMouseDown={e => { e.stopPropagation(); onPartDragStart(e, frame.id, p.id); }} style={{ cursor: "ew-resize" }}/>
          </g>
        );
      })}
      {frame.partitions.filter(p => p.dir === "h").map(p => {
        const py = y + p.ratio * h;
        return (
          <g key={p.id}>
            <rect x={x+FT} y={py-4} width={w-FT*2} height={8} fill="#7a5c0e" stroke="#5a4510" strokeWidth={1}/>
            <rect x={x+w/2-14} y={py-7} width={28} height={14} rx={3} fill="#2a3050" stroke="#3b82f6" strokeWidth={1}
              onMouseDown={e => { e.stopPropagation(); onPartDragStart(e, frame.id, p.id); }} style={{ cursor: "ns-resize" }}/>
          </g>
        );
      })}
      {showDimensions && (
        <g style={{ pointerEvents: "none" }}>
          <line x1={x} y1={y+h+22} x2={x+w} y2={y+h+22} stroke="#475569" strokeWidth={1}/>
          <line x1={x} y1={y+h+18} x2={x} y2={y+h+26} stroke="#475569" strokeWidth={1}/>
          <line x1={x+w} y1={y+h+18} x2={x+w} y2={y+h+26} stroke="#475569" strokeWidth={1}/>
          <text x={x+w/2} y={y+h+36} textAnchor="middle" fill="#94a3b8" fontSize={11} fontFamily="monospace">{w}mm</text>
          <line x1={x-22} y1={y} x2={x-22} y2={y+h} stroke="#475569" strokeWidth={1}/>
          <text x={x-36} y={y+h/2+4} textAnchor="middle" fill="#94a3b8" fontSize={11} fontFamily="monospace"
            transform={`rotate(-90,${x-36},${y+h/2+4})`}>{h}mm</text>
        </g>
      )}
      {selected && (
        <rect x={x+w-8} y={y+h-8} width={16} height={16} rx={3} fill="#3b82f6" stroke="#fff" strokeWidth={1.5}
          onMouseDown={e => { e.stopPropagation(); onResizeStart(e); }} style={{ cursor: "nwse-resize" }}/>
      )}
      <text x={x+w/2} y={y-6} textAnchor="middle" fill="#475569" fontSize={10} fontFamily="monospace">{w}×{h}</text>
    </g>
  );
}

function Canvas2D({ frames, setFrames, activeTool, selectedId, setSelectedId, sashType, grillPattern, showDimensions }) {
  const svgRef = useRef(null);
  const [drawing, setDrawing] = useState(null);
  const dragging = useRef(null);
  const resizing = useRef(null);
  const partDrag = useRef(null);

  const svgPt = (e) => {
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    return { x: snap((e.clientX - rect.left) * vb.width / rect.width), y: snap((e.clientY - rect.top) * vb.height / rect.height) };
  };

  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    const pt = svgPt(e);
    if (activeTool === "draw") setDrawing({ x: pt.x, y: pt.y, w: 0, h: 0 });
  };

  const onMouseMove = (e) => {
    const pt = svgPt(e);
    if (drawing) { setDrawing(d => ({ ...d, w: pt.x - d.x, h: pt.y - d.y })); return; }
    if (dragging.current) {
      const { id, ox, oy } = dragging.current;
      setFrames(fs => fs.map(f => f.id === id ? { ...f, x: snap(pt.x - ox), y: snap(pt.y - oy) } : f));
      return;
    }
    if (resizing.current) {
      const { id } = resizing.current;
      setFrames(fs => fs.map(f => f.id === id ? { ...f, w: Math.max(MIN_PANEL*2, snap(pt.x - f.x)), h: Math.max(MIN_PANEL*2, snap(pt.y - f.y)) } : f));
      return;
    }
    if (partDrag.current) {
      const { frameId, partId } = partDrag.current;
      setFrames(fs => fs.map(f => {
        if (f.id !== frameId) return f;
        return { ...f, partitions: f.partitions.map(p => {
          if (p.id !== partId) return p;
          return { ...p, ratio: clamp(p.dir === "v" ? (pt.x - f.x) / f.w : (pt.y - f.y) / f.h, 0.1, 0.9) };
        })};
      }));
    }
  };

  const onMouseUp = (e) => {
    if (drawing) {
      const { x, y, w, h } = drawing;
      const rx = w < 0 ? x + w : x, ry = h < 0 ? y + h : y;
      const rw = Math.abs(w), rh = Math.abs(h);
      if (rw > MIN_PANEL && rh > MIN_PANEL) {
        const f = { id: uid(), x: rx, y: ry, w: rw, h: rh, partitions: [], sashes: [], grills: [], handles: [] };
        setFrames(fs => [...fs, f]);
        setSelectedId(f.id);
      }
      setDrawing(null);
    }
    dragging.current = null; resizing.current = null; partDrag.current = null;
  };

  const onFrameClick = (e, frame) => {
    e.stopPropagation();
    const pt = svgPt(e);
    if (activeTool === "delete") { setFrames(fs => fs.filter(f => f.id !== frame.id)); if (selectedId === frame.id) setSelectedId(null); return; }
    if (activeTool === "partition") {
      const relX = pt.x - frame.x, relY = pt.y - frame.y;
      const near_mid_x = Math.abs(relX / frame.w - 0.5) < 0.35;
      const dir = near_mid_x ? "v" : "h";
      const ratio = dir === "v" ? relX / frame.w : relY / frame.h;
      setFrames(fs => fs.map(f => f.id === frame.id ? { ...f, partitions: [...f.partitions, { id: uid(), dir, ratio: clamp(ratio, 0.1, 0.9) }] } : f));
      return;
    }
    if (activeTool === "flap" || activeTool === "grill" || activeTool === "handle") {
      const cells = getCells(frame);
      const cell = cells.find(c => pt.x >= frame.x+c.cx && pt.x <= frame.x+c.cx+c.cw && pt.y >= frame.y+c.cy && pt.y <= frame.y+c.cy+c.ch);
      if (!cell) return;
      if (activeTool === "flap") setFrames(fs => fs.map(f => f.id === frame.id ? { ...f, sashes: [...f.sashes.filter(s => s.cellId !== cell.id), { id: uid(), cellId: cell.id, type: sashType }] } : f));
      else if (activeTool === "grill") setFrames(fs => fs.map(f => f.id === frame.id ? { ...f, grills: [...f.grills.filter(g => g.cellId !== cell.id), { id: uid(), cellId: cell.id, pattern: grillPattern }] } : f));
      else setFrames(fs => fs.map(f => f.id === frame.id ? { ...f, handles: [...f.handles.filter(h => h.cellId !== cell.id), { id: uid(), cellId: cell.id }] } : f));
      return;
    }
    setSelectedId(frame.id);
  };

  return (
    <svg ref={svgRef} viewBox="0 0 1200 900" style={{ width: "100%", height: "100%", cursor: activeTool === "draw" ? "crosshair" : "default", userSelect: "none" }}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onClick={() => activeTool === "select" && setSelectedId(null)}>
      <defs>
        <pattern id="sg" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
          <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} fill="none" stroke="#1a1f2e" strokeWidth={0.5}/>
        </pattern>
        <pattern id="lg" width={100} height={100} patternUnits="userSpaceOnUse">
          <rect width={100} height={100} fill="url(#sg)"/>
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#222840" strokeWidth={1}/>
        </pattern>
      </defs>
      <rect width={1200} height={900} fill="url(#lg)"/>
      {frames.map(frame => (
        <FrameSVG key={frame.id} frame={frame} selected={selectedId === frame.id} activeTool={activeTool} showDimensions={showDimensions}
          onClick={e => onFrameClick(e, frame)}
          onDragStart={e => { if (activeTool !== "select") return; e.stopPropagation(); const pt = svgPt(e); dragging.current = { id: frame.id, ox: pt.x - frame.x, oy: pt.y - frame.y }; setSelectedId(frame.id); }}
          onResizeStart={e => { e.stopPropagation(); resizing.current = { id: frame.id }; }}
          onPartDragStart={(e, frameId, partId) => { partDrag.current = { frameId, partId }; }}
        />
      ))}
      {drawing && (
        <rect x={drawing.w < 0 ? drawing.x + drawing.w : drawing.x} y={drawing.h < 0 ? drawing.y + drawing.h : drawing.y}
          width={Math.abs(drawing.w)} height={Math.abs(drawing.h)} fill="rgba(59,130,246,0.08)" stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 3"/>
      )}
    </svg>
  );
}

function Canvas3D({ frames }) {
  const canvasRef = useRef(null);
  const angleRef = useRef(0.5);
  const drag3d = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const proj = (x, y, z, a) => {
      const cos = Math.cos(a), sin = Math.sin(a);
      const px = x * cos - z * sin;
      const py = -y + x * sin * 0.4 + z * cos * 0.4;
      return { x: W / 2 + px * 0.45, y: H / 2 + py * 0.45 };
    };

    const draw = () => {
      const a = angleRef.current;
      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#0a0e18"); bg.addColorStop(1, "#111827");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Floor grid
      ctx.strokeStyle = "rgba(30,40,65,0.9)"; ctx.lineWidth = 0.5;
      for (let gx = -15; gx <= 15; gx++) {
        const p1 = proj(gx * 40, 240, -100, a), p2 = proj(gx * 40, 240, 600, a);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      }
      for (let gz = -2; gz <= 12; gz++) {
        const p1 = proj(-600, 240, gz * 50, a), p2 = proj(600, 240, gz * 50, a);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      }

      frames.forEach(frame => {
        const sc = 0.4;
        const fx = (frame.x - 600) * sc, fy = (frame.y - 450) * sc;
        const fw = frame.w * sc, fh = frame.h * sc, depth = 22, FT = 8 * sc;

        const front = [[fx,-fy,0],[fx+fw,-fy,0],[fx+fw,-fy-fh,0],[fx,-fy-fh,0]];
        const back = front.map(([x,y,z]) => [x,y,depth]);

        // Back
        ctx.beginPath();
        back.forEach(([x,y,z],i) => { const p = proj(x,y,z,a); if(i===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y); });
        ctx.closePath(); ctx.fillStyle = "#3d2a06"; ctx.fill();

        // Sides
        const sides = [[0,1,"#4e3408"],[1,2,"#6a4a0e"],[2,3,"#5e400b"],[3,0,"#4e3408"]];
        sides.forEach(([a2,b,clr]) => {
          ctx.beginPath();
          [proj(...front[a2],a), proj(...front[b],a), proj(...back[b],a), proj(...back[a2],a)]
            .forEach((p,i) => i===0 ? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y));
          ctx.closePath(); ctx.fillStyle = clr; ctx.fill(); ctx.strokeStyle = "#2a1a04"; ctx.lineWidth = 0.5; ctx.stroke();
        });

        // Front face (glass)
        ctx.beginPath();
        front.forEach(([x,y,z],i) => { const p = proj(x,y,z,a); if(i===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y); });
        ctx.closePath(); ctx.fillStyle = "rgba(100,180,255,0.16)"; ctx.fill();
        ctx.strokeStyle = "#8b6914"; ctx.lineWidth = 2; ctx.stroke();

        // Inner glass area
        const inner = [[fx+FT,-fy-FT,0],[fx+fw-FT,-fy-FT,0],[fx+fw-FT,-fy-fh+FT,0],[fx+FT,-fy-fh+FT,0]];
        ctx.beginPath();
        inner.forEach(([x,y,z],i) => { const p = proj(x,y,z,a); if(i===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y); });
        ctx.closePath(); ctx.fillStyle = "rgba(100,180,255,0.3)"; ctx.fill(); ctx.strokeStyle = "#c0a060"; ctx.lineWidth = 1; ctx.stroke();

        // Partitions
        frame.partitions.forEach(p2 => {
          const pts = p2.dir === "v"
            ? [[fx+p2.ratio*fw,-fy-FT,0],[fx+p2.ratio*fw,-fy-fh+FT,0]]
            : [[fx+FT,-fy-p2.ratio*fh,0],[fx+fw-FT,-fy-p2.ratio*fh,0]];
          const p0 = proj(...pts[0],a), p1 = proj(...pts[1],a);
          ctx.beginPath(); ctx.moveTo(p0.x,p0.y); ctx.lineTo(p1.x,p1.y);
          ctx.strokeStyle = "#8b6914"; ctx.lineWidth = 3; ctx.stroke();
        });

        // Sash diagonals
        frame.sashes.forEach(s => {
          const cells = getCells(frame);
          const cell = cells.find(c => c.id === s.cellId);
          if (!cell) return;
          const cx2 = (frame.x + cell.cx - 600) * sc;
          const cy2 = -(frame.y + cell.cy - 450) * sc;
          const cw = cell.cw * sc, ch = cell.ch * sc;
          const p0 = proj(cx2, cy2, 0, a), p1 = proj(cx2+cw, cy2-ch, 0, a);
          ctx.beginPath(); ctx.moveTo(p0.x,p0.y); ctx.lineTo(p1.x,p1.y);
          ctx.strokeStyle = "rgba(100,180,255,0.5)"; ctx.lineWidth = 1;
          ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
        });
      });

      ctx.fillStyle = "rgba(100,116,139,0.7)"; ctx.font = "11px monospace";
      ctx.fillText("🖱 Drag to rotate", 14, 22);
    };

    draw();

    const md = e => { drag3d.current = { x: e.clientX, a: angleRef.current }; };
    const mm = e => { if (!drag3d.current) return; angleRef.current = drag3d.current.a + (e.clientX - drag3d.current.x) * 0.006; draw(); };
    const mu = () => { drag3d.current = null; };

    canvas.addEventListener("mousedown", md);
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
    return () => { canvas.removeEventListener("mousedown", md); window.removeEventListener("mousemove", mm); window.removeEventListener("mouseup", mu); };
  }, [frames]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", cursor: "grab", display: "block" }}/>;
}

function PropsPanel({ frames, selectedId, setFrames }) {
  const frame = frames.find(f => f.id === selectedId);
  const btnStyle = { background: "rgba(239,68,68,0.15)", border: "1px solid #7f1d1d", color: "#f87171", borderRadius: 4, padding: "2px 7px", cursor: "pointer", fontSize: 11 };
  const sectionStyle = { background: P.bg, borderRadius: 8, padding: 12, marginBottom: 10, border: `1px solid ${P.border}` };
  const labelStyle = { color: P.accent, fontSize: 10, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 };

  if (!frame) return (
    <div style={{ padding: 18, color: P.textMuted, fontSize: 12, fontFamily: "monospace" }}>
      <div style={{ color: P.text, fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Properties</div>
      <div style={sectionStyle}>
        <div style={labelStyle}>Quick Guide</div>
        <div style={{ lineHeight: 2, fontSize: 11 }}>
          ▭ Draw → drag canvas to create<br/>
          ⊟ Partition → click frame to split<br/>
          ↗ Flap → click a cell for sash<br/>
          ⊞ Grill → click a cell for bars<br/>
          ⌂ Handle → click a cell<br/>
          ⊹ Select → move & resize<br/>
          ✕ Delete → remove frame
        </div>
      </div>
      <div style={{ color: P.textMuted, fontSize: 11 }}>Select a frame to view/edit its properties</div>
    </div>
  );

  const upd = (k, v) => setFrames(fs => fs.map(f => f.id === frame.id ? { ...f, [k]: v } : f));
  const inp = (label, key) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ color: P.textMuted, fontSize: 10, marginBottom: 3 }}>{label}</div>
      <input type="number" value={frame[key]} onChange={e => upd(key, Number(e.target.value))}
        style={{ width: "100%", padding: "5px 8px", background: "#0d1017", border: `1px solid ${P.border}`, borderRadius: 5, color: P.text, fontSize: 12, fontFamily: "monospace", boxSizing: "border-box" }}/>
    </div>
  );

  return (
    <div style={{ padding: 14, fontFamily: "monospace", overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      <div style={{ color: P.text, fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Frame Properties</div>
      <div style={sectionStyle}>
        <div style={labelStyle}>Dimensions</div>
        {inp("X (px)", "x")} {inp("Y (px)", "y")} {inp("Width (mm)", "w")} {inp("Height (mm)", "h")}
      </div>
      <div style={sectionStyle}>
        <div style={labelStyle}>Partitions ({frame.partitions.length})</div>
        {frame.partitions.length === 0 ? <div style={{ color: P.textMuted, fontSize: 11 }}>None – use ⊟ tool to add</div> :
          frame.partitions.map(p => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <span style={{ color: P.textMuted, fontSize: 11, flex: 1 }}>{p.dir === "v" ? "│ Vertical" : "─ Horizontal"} {Math.round(p.ratio*100)}%</span>
              <button style={btnStyle} onClick={() => upd("partitions", frame.partitions.filter(pp => pp.id !== p.id))}>✕</button>
            </div>
          ))
        }
      </div>
      <div style={sectionStyle}>
        <div style={labelStyle}>Sashes ({frame.sashes.length})</div>
        {frame.sashes.length === 0 ? <div style={{ color: P.textMuted, fontSize: 11 }}>None – use ↗ tool to add</div> :
          frame.sashes.map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <span style={{ color: P.textMuted, fontSize: 11, flex: 1 }}>{s.type} [{s.cellId}]</span>
              <button style={btnStyle} onClick={() => upd("sashes", frame.sashes.filter(ss => ss.id !== s.id))}>✕</button>
            </div>
          ))
        }
      </div>
      <div style={sectionStyle}>
        <div style={labelStyle}>Grills ({frame.grills.length})</div>
        {frame.grills.length === 0 ? <div style={{ color: P.textMuted, fontSize: 11 }}>None – use ⊞ tool to add</div> :
          frame.grills.map(g => (
            <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <span style={{ color: P.textMuted, fontSize: 11, flex: 1 }}>{g.pattern} [{g.cellId}]</span>
              <button style={btnStyle} onClick={() => upd("grills", frame.grills.filter(gg => gg.id !== g.id))}>✕</button>
            </div>
          ))
        }
      </div>
    </div>
  );
}

export default function Config() {
  const [frames, setFrames] = useState([]);
  const [activeTool, setActiveTool] = useState("select");
  const [selectedId, setSelectedId] = useState(null);
  const [view3D, setView3D] = useState(false);
  const [sashType, setSashType] = useState("casement-left");
  const [grillPattern, setGrillPattern] = useState("grid");
  const [showDim, setShowDim] = useState(true);
  const [showSashPicker, setShowSashPicker] = useState(false);
  const [showGrillPicker, setShowGrillPicker] = useState(false);

  const addPreset = (type) => {
    const base = () => ({ id: uid(), x: 200 + frames.length*25, y: 180 + frames.length*20, partitions: [], sashes: [], grills: [], handles: [] });
    const presets = {
      "single-door": () => ({ ...base(), w: 120, h: 240, sashes: [{ id: uid(), cellId: "0-0", type: "door-left" }] }),
      "double-door": () => { const f = { ...base(), w: 240, h: 240, partitions: [{ id: uid(), dir: "v", ratio: 0.5 }] }; f.sashes = [{ id: uid(), cellId: "0-0", type: "door-left" }, { id: uid(), cellId: "0-1", type: "door-right" }]; return f; },
      "casement-2l": () => { const f = { ...base(), w: 200, h: 150, partitions: [{ id: uid(), dir: "v", ratio: 0.5 }] }; f.sashes = [{ id: uid(), cellId: "0-0", type: "casement-left" }, { id: uid(), cellId: "0-1", type: "casement-right" }]; return f; },
      "sliding-2p": () => { const f = { ...base(), w: 200, h: 120, partitions: [{ id: uid(), dir: "v", ratio: 0.5 }] }; f.sashes = [{ id: uid(), cellId: "0-0", type: "sliding" }, { id: uid(), cellId: "0-1", type: "sliding" }]; return f; },
      "fixed-grill": () => { const f = { ...base(), w: 160, h: 140 }; f.sashes = [{ id: uid(), cellId: "0-0", type: "fixed" }]; f.grills = [{ id: uid(), cellId: "0-0", pattern: "grid" }]; return f; },
      "awning": () => ({ ...base(), w: 160, h: 120, sashes: [{ id: uid(), cellId: "0-0", type: "awning" }] }),
    };
    const f = presets[type]?.();
    if (f) { setFrames(fs => [...fs, f]); setSelectedId(f.id); }
  };

  const toolBtn = (tool) => {
    const active = activeTool === tool.id;
    return (
      <div key={tool.id} title={tool.label}
        onClick={() => {
          setActiveTool(tool.id);
          setShowSashPicker(tool.id === "flap");
          setShowGrillPicker(tool.id === "grill");
        }}
        style={{
          width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 8, cursor: "pointer", fontSize: 17, margin: "2px 0",
          background: active ? "rgba(59,130,246,0.22)" : "transparent",
          border: active ? `1px solid ${P.accent}` : "1px solid transparent",
          color: active ? P.accentGlow : P.textMuted,
          transition: "all 0.15s",
        }}
      >{tool.icon}</div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: P.bg, color: P.text, fontFamily: "'JetBrains Mono', 'Courier New', monospace", overflow: "hidden" }}>

      {/* Top Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 16px", background: P.surface, borderBottom: `1px solid ${P.border}`, flexShrink: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 8 }}>
          <div style={{ width: 30, height: 30, background: P.accent, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🪟</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Win Quoter</div>
            <div style={{ fontSize: 9, color: P.textMuted }}>Door & Window Designer</div>
          </div>
        </div>
        <div style={{ width: 1, height: 32, background: P.border }}/>
        <span style={{ fontSize: 11, color: P.textMuted, marginRight: 2 }}>Presets:</span>
        {[
          ["single-door","Single Door"],["double-door","Double Door"],["casement-2l","Casement 2L"],
          ["sliding-2p","Sliding 2P"],["fixed-grill","Fixed+Grill"],["awning","Awning"],
        ].map(([k, label]) => (
          <button key={k} onClick={() => addPreset(k)}
            style={{ padding: "4px 10px", background: P.panel, border: `1px solid ${P.border}`, borderRadius: 6, color: P.text, cursor: "pointer", fontSize: 11 }}
            onMouseEnter={e => e.target.style.borderColor = P.accent}
            onMouseLeave={e => e.target.style.borderColor = P.border}
          >{label}</button>
        ))}
        <div style={{ flex: 1 }}/>
        <button onClick={() => setShowDim(d => !d)}
          style={{ padding: "5px 10px", background: showDim ? "rgba(59,130,246,0.18)" : P.panel, border: `1px solid ${showDim ? P.accent : P.border}`, borderRadius: 6, color: showDim ? P.accentGlow : P.textMuted, cursor: "pointer", fontSize: 11 }}>
          📐 Dims
        </button>
        <button onClick={() => setView3D(v => !v)}
          style={{ padding: "5px 14px", background: view3D ? P.accent : P.panel, border: `1px solid ${view3D ? P.accentGlow : P.border}`, borderRadius: 6, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
          {view3D ? "✦ 3D" : "◈ 2D"}
        </button>
        <button onClick={() => { setFrames([]); setSelectedId(null); }}
          style={{ padding: "5px 10px", background: "rgba(239,68,68,0.1)", border: "1px solid #7f1d1d", borderRadius: 6, color: "#f87171", cursor: "pointer", fontSize: 11 }}>
          🗑 Clear
        </button>
      </div>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left toolbar */}
        <div style={{ width: 58, background: P.surface, borderRight: `1px solid ${P.border}`, display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 0", flexShrink: 0 }}>
          {TOOLS.map(t => toolBtn(t))}
        </div>

        {/* Canvas area */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {view3D
            ? <Canvas3D frames={frames}/>
            : <Canvas2D frames={frames} setFrames={setFrames} activeTool={activeTool}
                selectedId={selectedId} setSelectedId={setSelectedId}
                sashType={sashType} grillPattern={grillPattern} showDimensions={showDim}/>
          }
          {/* Status */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(10,14,24,0.92)", borderTop: `1px solid ${P.border}`, padding: "5px 14px", display: "flex", gap: 18, fontSize: 11, color: P.textMuted }}>
            <span>Tool: <b style={{ color: P.accent }}>{TOOLS.find(t => t.id === activeTool)?.label}</b></span>
            <span>Frames: <b style={{ color: P.text }}>{frames.length}</b></span>
            {selectedId && <span>Selected: <b style={{ color: P.text }}>{selectedId}</b></span>}
            {activeTool === "flap" && <span>Sash: <b style={{ color: P.warning }}>{sashType}</b></span>}
            {activeTool === "grill" && <span>Grill: <b style={{ color: P.warning }}>{grillPattern}</b></span>}
            <span style={{ marginLeft: "auto" }}>{view3D ? "Drag to rotate 3D" : "Grid: 10mm · Draw: drag to create frame"}</span>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ width: 230, background: P.surface, borderLeft: `1px solid ${P.border}`, flexShrink: 0, overflowY: "auto" }}>
          <PropsPanel frames={frames} selectedId={selectedId} setFrames={setFrames}/>
        </div>
      </div>

      {/* Sash picker popup */}
      {showSashPicker && activeTool === "flap" && (
        <div style={{ position: "fixed", left: 68, top: 170, background: P.panel, border: `1px solid ${P.border}`, borderRadius: 10, padding: 12, zIndex: 200, minWidth: 175, boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
          <div style={{ color: P.accent, fontSize: 10, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Sash Type</div>
          {SASH_TYPES.map(s => (
            <div key={s.id} onClick={() => setSashType(s.id)}
              style={{ padding: "6px 10px", borderRadius: 6, cursor: "pointer", marginBottom: 3, display: "flex", gap: 10, alignItems: "center", fontSize: 12,
                background: sashType === s.id ? "rgba(59,130,246,0.2)" : "transparent",
                border: sashType === s.id ? `1px solid ${P.accent}` : "1px solid transparent",
                color: sashType === s.id ? P.text : P.textMuted,
              }}>
              <span>{s.icon}</span><span>{s.label}</span>
            </div>
          ))}
          <button onClick={() => setShowSashPicker(false)} style={{ width: "100%", marginTop: 6, padding: "5px", background: "transparent", border: `1px solid ${P.border}`, borderRadius: 5, color: P.textMuted, cursor: "pointer", fontSize: 11 }}>Close</button>
        </div>
      )}

      {/* Grill picker popup */}
      {showGrillPicker && activeTool === "grill" && (
        <div style={{ position: "fixed", left: 68, top: 280, background: P.panel, border: `1px solid ${P.border}`, borderRadius: 10, padding: 12, zIndex: 200, minWidth: 150, boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
          <div style={{ color: P.accent, fontSize: 10, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Grill Pattern</div>
          {GRILL_PATTERNS.map(g => (
            <div key={g.id} onClick={() => setGrillPattern(g.id)}
              style={{ padding: "6px 10px", borderRadius: 6, cursor: "pointer", marginBottom: 3, fontSize: 12,
                background: grillPattern === g.id ? "rgba(59,130,246,0.2)" : "transparent",
                border: grillPattern === g.id ? `1px solid ${P.accent}` : "1px solid transparent",
                color: grillPattern === g.id ? P.text : P.textMuted,
              }}>{g.label}</div>
          ))}
          <button onClick={() => setShowGrillPicker(false)} style={{ width: "100%", marginTop: 6, padding: "5px", background: "transparent", border: `1px solid ${P.border}`, borderRadius: 5, color: P.textMuted, cursor: "pointer", fontSize: 11 }}>Close</button>
        </div>
      )}
    </div>
  );
}