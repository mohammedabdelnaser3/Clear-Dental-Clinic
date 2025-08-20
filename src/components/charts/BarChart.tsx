import React from 'react';

interface BarChartData {
  [key: string]: any;
}

interface BarChartProps {
  data: BarChartData[];
  xKey: string;
  yKey: string;
  xLabel?: string;
  yLabel?: string;
  className?: string;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  xKey,
  yKey,
  xLabel,
  yLabel,
  className = ''
}) => {
  const maxValue = Math.max(...data.map(item => item[yKey]));
  const chartHeight = 200;
  const barWidth = 40;
  const spacing = 10;
  const chartWidth = data.length * (barWidth + spacing);

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      <div className="flex-1 flex items-end justify-center overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="min-w-full">
          {data.map((item, index) => {
            const barHeight = (item[yKey] / maxValue) * (chartHeight - 40);
            const x = index * (barWidth + spacing);
            const y = chartHeight - barHeight - 20;
            
            return (
              <g key={index}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="#3B82F6"
                  className="hover:fill-blue-600 transition-colors"
                />
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 5}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {item[xKey]}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  className="text-xs fill-gray-800 font-medium"
                >
                  {item[yKey]}
                </text>
              </g>
            );
          })}
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

export default BarChart;