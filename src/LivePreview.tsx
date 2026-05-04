type LivePreviewProps = {
  widthMm: number;
  heightMm: number;
  type: string;
};

export default function LivePreview({ widthMm, heightMm, type }: LivePreviewProps) {
  const viewportWidth = 320;
  const viewportHeight = 220;
  const padding = 24;

  const safeWidth = Math.max(300, widthMm);
  const safeHeight = Math.max(300, heightMm);
  const scale = Math.min(
    (viewportWidth - padding * 2) / safeWidth,
    (viewportHeight - padding * 2) / safeHeight,
  );
  const scaledWidth = safeWidth * scale;
  const scaledHeight = safeHeight * scale;
  const x = (viewportWidth - scaledWidth) / 2;
  const y = (viewportHeight - scaledHeight) / 2;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
        <span>Live Preview</span>
        <span>
          {widthMm}mm x {heightMm}mm
        </span>
      </div>
      <svg
        viewBox={`0 0 ${viewportWidth} ${viewportHeight}`}
        className="h-[220px] w-full rounded-xl border border-slate-200 bg-white"
      >
        <rect x="0" y="0" width={viewportWidth} height={viewportHeight} fill="#ffffff" />
        <rect
          x={x}
          y={y}
          width={scaledWidth}
          height={scaledHeight}
          fill="#eff6ff"
          stroke="#1e3a8a"
          strokeWidth="2"
          rx="4"
        />

        {type === 'Sliding' && (
          <>
            <line
              x1={x + scaledWidth / 2}
              y1={y + 4}
              x2={x + scaledWidth / 2}
              y2={y + scaledHeight - 4}
              stroke="#475569"
              strokeWidth="2"
            />
            <path
              d={`M ${x + scaledWidth * 0.22} ${y + scaledHeight / 2} l 16 0 m -5 -4 l 5 4 l -5 4`}
              stroke="#0f172a"
              strokeWidth="2"
              fill="none"
            />
            <path
              d={`M ${x + scaledWidth * 0.78} ${y + scaledHeight / 2} l -16 0 m 5 -4 l -5 4 l 5 4`}
              stroke="#0f172a"
              strokeWidth="2"
              fill="none"
            />
          </>
        )}

        {type === 'Shower Cubicle' && (
          <>
            <path
              d={`M ${x + 12} ${y + scaledHeight - 12} L ${x + 12} ${y + 12} L ${
                x + scaledWidth - 12
              } ${y + 12} L ${x + scaledWidth - 12} ${y + scaledHeight - 12}`}
              stroke="#334155"
              strokeWidth="3"
              fill="none"
            />
            <path
              d={`M ${x + 12} ${y + scaledHeight - 12} L ${x + scaledWidth * 0.45} ${
                y + scaledHeight - 12
              }`}
              stroke="#334155"
              strokeWidth="3"
              fill="none"
            />
          </>
        )}
      </svg>
    </div>
  );
}
