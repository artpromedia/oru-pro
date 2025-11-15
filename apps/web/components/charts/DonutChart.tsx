export interface DonutSlice {
  id?: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  centerText?: string;
  centerSubtext?: string;
  size?: number;
  strokeWidth?: number;
}

export function DonutChart({
  data,
  centerText,
  centerSubtext,
  size = 160,
  strokeWidth = 14,
}: DonutChartProps) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Donut chart"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        {data.map((slice) => {
          const dash = (slice.value / total) * circumference;
          const circle = (
            <circle
              key={slice.id ?? slice.color + slice.value}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-cumulativeOffset}
              strokeLinecap="round"
            />
          );
          cumulativeOffset += dash;
          return circle;
        })}
      </svg>

      {(centerText || centerSubtext) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerText && (
            <span className="text-2xl font-semibold text-gray-900">
              {centerText}
            </span>
          )}
          {centerSubtext && (
            <span className="text-xs uppercase tracking-wide text-gray-400">
              {centerSubtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
