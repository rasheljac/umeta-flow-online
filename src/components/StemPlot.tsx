
import React from 'react';
import { ResponsiveContainer } from 'recharts';

interface Peak {
  mz: number;
  intensity: number;
}

interface StemPlotProps {
  peaks: Peak[];
  width?: number;
  height?: number;
  className?: string;
}

const StemPlot = ({ peaks, width = 800, height = 400, className }: StemPlotProps) => {
  if (!peaks || peaks.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <p className="text-slate-500">No peaks to display</p>
      </div>
    );
  }

  // Calculate scales
  const mzMin = Math.min(...peaks.map(p => p.mz));
  const mzMax = Math.max(...peaks.map(p => p.mz));
  const intensityMax = Math.max(...peaks.map(p => p.intensity));

  const margin = { top: 20, right: 30, bottom: 60, left: 80 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Scale functions
  const xScale = (mz: number) => ((mz - mzMin) / (mzMax - mzMin)) * plotWidth;
  const yScale = (intensity: number) => plotHeight - (intensity / intensityMax) * plotHeight;

  // Generate tick marks
  const xTicks = [];
  const tickCount = Math.min(10, Math.floor(plotWidth / 80));
  for (let i = 0; i <= tickCount; i++) {
    const mz = mzMin + (i / tickCount) * (mzMax - mzMin);
    xTicks.push(mz);
  }

  const yTicks = [];
  const yTickCount = 5;
  for (let i = 0; i <= yTickCount; i++) {
    const intensity = (i / yTickCount) * intensityMax;
    yTicks.push(intensity);
  }

  return (
    <div className={className}>
      <svg width={width} height={height} style={{ background: 'white' }}>
        {/* Plot area background */}
        <rect
          x={margin.left}
          y={margin.top}
          width={plotWidth}
          height={plotHeight}
          fill="white"
          stroke="#e2e8f0"
          strokeWidth={1}
        />

        {/* Grid lines */}
        {xTicks.map((mz, i) => (
          <line
            key={`x-grid-${i}`}
            x1={margin.left + xScale(mz)}
            y1={margin.top}
            x2={margin.left + xScale(mz)}
            y2={margin.top + plotHeight}
            stroke="#f1f5f9"
            strokeWidth={1}
          />
        ))}

        {yTicks.map((intensity, i) => (
          <line
            key={`y-grid-${i}`}
            x1={margin.left}
            y1={margin.top + yScale(intensity)}
            x2={margin.left + plotWidth}
            y2={margin.top + yScale(intensity)}
            stroke="#f1f5f9"
            strokeWidth={1}
          />
        ))}

        {/* Peaks as vertical lines (stems) */}
        {peaks.map((peak, index) => {
          const x = margin.left + xScale(peak.mz);
          const y = margin.top + yScale(peak.intensity);
          const baselineY = margin.top + plotHeight;

          return (
            <g key={`peak-${index}`}>
              {/* Stem line */}
              <line
                x1={x}
                y1={baselineY}
                x2={x}
                y2={y}
                stroke="#3B82F6"
                strokeWidth={1.5}
              />
              {/* Peak dot */}
              <circle
                cx={x}
                cy={y}
                r={2}
                fill="#3B82F6"
              />
            </g>
          );
        })}

        {/* X-axis */}
        <line
          x1={margin.left}
          y1={margin.top + plotHeight}
          x2={margin.left + plotWidth}
          y2={margin.top + plotHeight}
          stroke="#374151"
          strokeWidth={2}
        />

        {/* Y-axis */}
        <line
          x1={margin.left}
          y1={margin.top}
          x2={margin.left}
          y2={margin.top + plotHeight}
          stroke="#374151"
          strokeWidth={2}
        />

        {/* X-axis ticks and labels */}
        {xTicks.map((mz, i) => (
          <g key={`x-tick-${i}`}>
            <line
              x1={margin.left + xScale(mz)}
              y1={margin.top + plotHeight}
              x2={margin.left + xScale(mz)}
              y2={margin.top + plotHeight + 5}
              stroke="#374151"
              strokeWidth={1}
            />
            <text
              x={margin.left + xScale(mz)}
              y={margin.top + plotHeight + 20}
              textAnchor="middle"
              fontSize="12"
              fill="#374151"
            >
              {mz.toFixed(1)}
            </text>
          </g>
        ))}

        {/* Y-axis ticks and labels */}
        {yTicks.map((intensity, i) => (
          <g key={`y-tick-${i}`}>
            <line
              x1={margin.left - 5}
              y1={margin.top + yScale(intensity)}
              x2={margin.left}
              y2={margin.top + yScale(intensity)}
              stroke="#374151"
              strokeWidth={1}
            />
            <text
              x={margin.left - 10}
              y={margin.top + yScale(intensity) + 4}
              textAnchor="end"
              fontSize="12"
              fill="#374151"
            >
              {intensity.toExponential(1)}
            </text>
          </g>
        ))}

        {/* Axis labels */}
        <text
          x={margin.left + plotWidth / 2}
          y={height - 10}
          textAnchor="middle"
          fontSize="14"
          fill="#374151"
          fontWeight="500"
        >
          m/z
        </text>

        <text
          x={15}
          y={margin.top + plotHeight / 2}
          textAnchor="middle"
          fontSize="14"
          fill="#374151"
          fontWeight="500"
          transform={`rotate(-90, 15, ${margin.top + plotHeight / 2})`}
        >
          Intensity
        </text>
      </svg>
    </div>
  );
};

export default StemPlot;
