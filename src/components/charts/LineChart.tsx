import React from 'react';

interface LineChartData {
  [key: string]: any;
}

interface LineChartProps {
  data: LineChartData[];
  xKey: string;
  yKey: string;
  xLabel?: string;
  yLabel?: string;
  className?: string;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  xKey,
  yKey,
  xLabel,
  yLabel,
  className = ''
}) => {
  const maxValue = Math.max(...data.map(item => item[yKey]));
  const minValue = Math.min(...data.map(item => item[yKey]));
  const chartHeight = 200;
  const chartWidth = 400;
  const padding = 40;
  
  const getX = (index: number) => {
    return padding + (index / (data.length - 1)) * (chartWidth - 2 * padding);
  };
  
  const getY = (value: number) => {
    const range = maxValue - minValue;
    const normalizedValue = range === 0 ? 0.5 : (value - minValue) / range;
    return chartHeight - padding - normalizedValue * (chartHeight - 2 * padding);
  };
  
  const pathData = data.map((item, index) => {
    const x = getX(index);
    const y = getY(item[yKey]);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      <div className="flex-1 flex items-center justify-center">
        <svg width={chartWidth} height={chartHeight} className="w-full h-full">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" opacity="0.3" />
          
          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            className="drop-shadow-sm"
          />
          
          {/* Data points */}
          {data.map((item, index) => {
            const x = getX(index);
            const y = getY(item[yKey]);
            
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#3B82F6"
                  className="hover:fill-blue-600 transition-colors cursor-pointer"
                />
                <title>{`${item[xKey]}: ${item[yKey]}`}</title>
              </g>
            );
          })}
          
          {/* Y-axis labels */}
          <text x="10" y={getY(maxValue)} className="text-xs fill-gray-600" dominantBaseline="middle">
            {maxValue}
          </text>
          <text x="10" y={getY(minValue)} className="text-xs fill-gray-600" dominantBaseline="middle">
            {minValue}
          </text>
        </svg>
      </div>
      {(xLabel || yLabel) && (
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          {xLabel && <span>{xLabel}</span>}
          {yLabel && <span>{yLabel}</span>}
        </div>
      )}
    </div>
  );
};

export default LineChart;