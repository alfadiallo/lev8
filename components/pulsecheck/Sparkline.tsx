'use client';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  showDots?: boolean;
  showTrendIndicator?: boolean;
  className?: string;
}

/**
 * Lightweight SVG-based sparkline component for showing score trends
 * Color-coded: green for improving, red for declining, purple for stable
 */
export function Sparkline({
  data,
  width = 80,
  height = 24,
  strokeWidth = 2,
  showDots = false,
  showTrendIndicator = true,
  className = '',
}: SparklineProps) {
  if (!data || data.length < 2) {
    return (
      <div className={`text-slate-400 text-xs ${className}`}>
        No data
      </div>
    );
  }

  // Calculate trend
  const firstValue = data[0];
  const lastValue = data[data.length - 1];
  const trend = lastValue - firstValue;
  const percentChange = ((trend / firstValue) * 100).toFixed(0);

  // Determine color based on trend
  const getColor = () => {
    if (trend > 0.05) return '#22C55E'; // green-500
    if (trend < -0.05) return '#EF4444'; // red-500
    return '#A78BFA'; // purple-400 (stable)
  };

  const color = getColor();

  // Calculate SVG path
  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const valueRange = maxValue - minValue || 1; // Prevent division by zero

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + ((maxValue - value) / valueRange) * chartHeight;
    return { x, y };
  });

  // Create smooth bezier curve path
  const createSmoothPath = (pts: { x: number; y: number }[]): string => {
    if (pts.length < 2) return '';
    if (pts.length === 2) {
      return `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)} L ${pts[1].x.toFixed(1)},${pts[1].y.toFixed(1)}`;
    }

    let path = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];

      // Catmull-Rom to Bezier conversion (tension = 0.5)
      const tension = 0.3;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }

    return path;
  };

  const pathD = createSmoothPath(points);

  // Trend indicator
  const TrendArrow = () => {
    if (trend > 0.05) {
      return <span className="text-green-500">↑</span>;
    }
    if (trend < -0.05) {
      return <span className="text-red-500">↓</span>;
    }
    return <span className="text-purple-400">→</span>;
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        {/* Gradient fill under the line */}
        <defs>
          <linearGradient id={`sparkline-gradient-${data.join('-')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        <path
          d={`${pathD} L ${points[points.length - 1].x.toFixed(1)},${height - padding} L ${points[0].x.toFixed(1)},${height - padding} Z`}
          fill={`url(#sparkline-gradient-${data.join('-')})`}
        />
        
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {showDots && points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={3}
            fill="white"
            stroke={color}
            strokeWidth={1.5}
          />
        ))}

        {/* End dot (always show) */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={3}
          fill={color}
        />
      </svg>
      
      {showTrendIndicator && (
        <span className="text-xs font-medium flex items-center gap-0.5">
          <TrendArrow />
          <span style={{ color }}>{Math.abs(Number(percentChange))}%</span>
        </span>
      )}
    </div>
  );
}

/**
 * Mini sparkline for use in table rows
 */
export function MiniSparkline({
  data,
  className = '',
}: {
  data: number[];
  className?: string;
}) {
  return (
    <Sparkline
      data={data}
      width={60}
      height={20}
      strokeWidth={1.5}
      showDots={false}
      showTrendIndicator={false}
      className={className}
    />
  );
}

/**
 * Score sparkline with current value displayed
 */
export function ScoreSparkline({
  data,
  label,
  className = '',
}: {
  data: number[];
  label?: string;
  className?: string;
}) {
  const currentValue = data.length > 0 ? data[data.length - 1].toFixed(1) : '-';
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && <span className="text-xs text-slate-500">{label}</span>}
      <span className="text-sm font-semibold text-slate-900">{currentValue}</span>
      <Sparkline
        data={data}
        width={60}
        height={20}
        strokeWidth={1.5}
        showTrendIndicator={false}
      />
    </div>
  );
}

export default Sparkline;
