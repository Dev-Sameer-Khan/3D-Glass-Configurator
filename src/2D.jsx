import React, { useState } from "react";

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
    className="p-2 rounded border-2 border-cyan-500 text-white text-xl bg-zinc-900 font-semibold focus:outline-cyan-200 focus:border-cyan-400 shadow"
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
  const [handleHeight, setHandleHeight] = useState(1000);

  const frameThickness = 40;
  const innerFrameThickness = 30;
  const overlap = 20;

  // Viewbox calculations to include dimension lines
  const paddingX = 400;
  const paddingY = 400;

  const handleColor = "#d1d5db";
  const panelWidth = (width + overlap) / 2;

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

  // Dimension lines positions (SVG coords)
  // Horizontal dimension line (top)
  const hDimY = -80;
  // Vertical dimension line (left)
  const vDimX = -90;

  // For panel widths (panel dimension at bottom)
  const panelDimYOffset = height + 60;

  // For dimension line ends
  const dimPad = 60;
  const w = +width,
    h = +height;

  return (
    <div className="w-full h-screen flex flex-col justify-center items-center">
      <div className="flex flex-col md:flex-row shadow-2xl bg-zinc-900 bg-opacity-80 border border-zinc-700 max-w-[1800px] w-full items-stretch">
        {/* Drawing surface */}
        <div className="flex-1 flex flex-col items-center justify-center relative min-w-[600px]">
          <svg
            id="window-svg-preview"
            viewBox={`-${paddingX / 2} -${paddingY / 2} ${w + paddingX} ${h + paddingY}`}
            className="w-full h-screen drop-shadow-2xl rounded-lg bg-gradient-to-bl from-zinc-800 via-zinc-800 to-cyan-950"
            preserveAspectRatio="xMidYMid meet"
            style={{
              background: "linear-gradient(110deg,#334155 93%,#0891b2 119%)",
            }}
          >
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
              x={w - (panelWidth - frameThickness * 10)}
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

              {/* Left Handle */}
              <g
                transform={`translate(${innerFrameThickness / 2}, ${h - frameThickness * 2 - handleHeight + 50})`}
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

              {/* Right Handle */}
              <g
                transform={`translate(${panelWidth - frameThickness - innerFrameThickness / 2}, ${h - frameThickness * 2 - handleHeight + 50})`}
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
              </g>
            </g>
          </svg>
        </div>
        {/* Side panel config */}
        <div className="config flex flex-col bg-gradient-to-t from-cyan-950/80 via-zinc-900/80 to-zinc-800/90 rounded-xl px-5 py-6 my-auto w-full max-w-xs mx-2 shadow-lg items-center border-cyan-900/30 border-2">
          <h2 className="text-2xl font-bold tracking-wide text-cyan-200 mb-2">
            Window Config
          </h2>
          <PrettyLabelUI>Width</PrettyLabelUI>
          <PrettyInput
            type="number"
            min="0"
            step="1"
            value={width}
            onChange={handleWidthChange}
            placeholder="Width (mm)"
          />
          <PrettyLabelUI>Height</PrettyLabelUI>
          <PrettyInput
            type="number"
            min="0"
            step="1"
            value={height}
            onChange={handleHeightChange}
            placeholder="Height (mm)"
          />
          <PrettyLabelUI>Frame Color</PrettyLabelUI>
          <input
            type="color"
            className="w-10 h-10 rounded border-2 border-cyan-500 bg-cyan-50 my-1"
            value={frameColor}
            onChange={(e) => setFrameColor(e.target.value)}
          />
          <PrettyLabelUI>Glass Color</PrettyLabelUI>
          <input
            type="color"
            className="w-10 h-10 rounded border-2 border-cyan-500 bg-cyan-50 my-1"
            value={glassColor.startsWith("rgba") ? "#6ee7db" : glassColor}
            // keeps previous when using color input, updates to picked color
            onChange={(e) => setGlassColor(e.target.value)}
          />
          <PrettyLabelUI>Handle Position (from top)</PrettyLabelUI>
          <PrettyInput
            type="number"
            min="0"
            max={height - 200}
            value={handleHeight}
            onChange={(e) => {
              const v = Number(e.target.value);
              setHandleHeight(Number.isFinite(v) && v >= 0 ? v : 0);
            }}
            placeholder="Handle Position"
          />
        </div>
      </div>
    </div>
  );
};

export default TwoD;
