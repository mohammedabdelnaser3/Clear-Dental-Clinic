import React from 'react';

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  className?: string;
}

const PieChart: React.FC<PieChartProps> = ({ data, className = '' }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 80;
  const centerX = 100;
  const centerY = 100;
  
  let currentAngle = 0;
  
  const createPath = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", centerX, centerY,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  };
  
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  return (
    <div className={`w-full h-full flex items-center justify-center ${className}`}>
      <div className="flex items-center space-x-8">
        <svg width="200" height="200" className="flex-shrink-0">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const angle = (item.value / total) * 360;
            const path = createPath(currentAngle, currentAngle + angle);
            currentAngle += angle;
            
            return (
              <g key={index}>
                <path
                  d={path}
                  fill={item.color}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
                <title>{`${item.name}: ${item.value} (${percentage.toFixed(1)}%)`}</title>
              </g>
            );
          })}
        </svg>
        
        <div className="flex flex-col space-y-2">
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-700">
                  {item.name}: {item.value} ({percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PieChart;