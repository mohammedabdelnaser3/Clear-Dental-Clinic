import React, { useState, useEffect } from 'react';
import { Card } from '../ui';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface AnalyticsWidgetProps {
  title: string;
  type: 'line' | 'bar' | 'pie' | 'metric';
  data: DataPoint[];
  timeframe?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  icon?: React.ReactNode;
  gradient?: string;
  loading?: boolean;
  height?: string;
  showLegend?: boolean;
}

const AnalyticsWidget: React.FC<AnalyticsWidgetProps> = ({
  title,
  type,
  data,
  timeframe = 'Last 7 days',
  trend,
  icon,
  gradient = 'from-blue-500 to-purple-600',
  loading = false,
  height = 'h-64',
  showLegend = true
}) => {
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimationComplete(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const maxValue = Math.max(...data.map(d => d.value));
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-indigo-500',
    'bg-pink-500'
  ];

  const renderBarChart = () => (
    <div className="flex items-end justify-between h-32 px-2">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1 mx-1">
          <div className="relative w-full max-w-8">
            <div
              className={`${colors[index % colors.length]} rounded-t-lg transition-all duration-1000 ease-out`}
              style={{
                height: animationComplete ? `${(item.value / maxValue) * 100}%` : '0%',
                minHeight: '4px'
              }}
            />
          </div>
          <span className="text-xs text-gray-600 mt-2 truncate w-full text-center">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );

  const renderPieChart = () => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercentage = 0;

    return (
      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const strokeDasharray = `${percentage} ${100 - percentage}`;
              const strokeDashoffset = -cumulativePercentage;
              cumulativePercentage += percentage;

              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke={`hsl(${(index * 60) % 360}, 70%, 50%)`}
                  strokeWidth="8"
                  strokeDasharray={animationComplete ? strokeDasharray : '0 100'}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLineChart = () => (
    <div className="relative h-32">
      <svg className="w-full h-full" viewBox="0 0 300 100">
        <defs>
          <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(y => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="300"
            y2={y}
            stroke="#e5e7eb"
            strokeWidth="0.5"
          />
        ))}
        
        {/* Data line */}
        <polyline
          fill="none"
          stroke="rgb(59, 130, 246)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={data.map((item, index) => {
            const x = (index / (data.length - 1)) * 300;
            const y = 100 - (item.value / maxValue) * 80;
            return `${x},${y}`;
          }).join(' ')}
          className={`transition-all duration-1000 ease-out ${
            animationComplete ? 'opacity-100' : 'opacity-0'
          }`}
        />
        
        {/* Area fill */}
        <polygon
          fill={`url(#gradient-${title})`}
          points={`0,100 ${data.map((item, index) => {
            const x = (index / (data.length - 1)) * 300;
            const y = 100 - (item.value / maxValue) * 80;
            return `${x},${y}`;
          }).join(' ')} 300,100`}
          className={`transition-all duration-1000 ease-out ${
            animationComplete ? 'opacity-100' : 'opacity-0'
          }`}
        />
        
        {/* Data points */}
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * 300;
          const y = 100 - (item.value / maxValue) * 80;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="3"
              fill="rgb(59, 130, 246)"
              className={`transition-all duration-1000 ease-out ${
                animationComplete ? 'opacity-100' : 'opacity-0'
              }`}
            />
          );
        })}
      </svg>
    </div>
  );

  const renderMetric = () => {
    const mainValue = data[0]?.value || 0;
    return (
      <div className="text-center py-8">
        <div className={`text-4xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent mb-2`}>
          {loading ? (
            <div className="animate-pulse bg-gray-200 h-10 w-24 rounded mx-auto"></div>
          ) : (
            mainValue.toLocaleString()
          )}
        </div>
        {trend && (
          <div className={`flex items-center justify-center space-x-1 text-sm ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span>{Math.abs(trend.value)}% {trend.period}</span>
          </div>
        )}
      </div>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'pie':
        return renderPieChart();
      case 'line':
        return renderLineChart();
      case 'metric':
        return renderMetric();
      default:
        return renderBarChart();
    }
  };

  return (
    <Card className={`${height} border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 hover:shadow-xl transition-all duration-300`}>
      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {icon && (
              <div className={`p-2 rounded-lg bg-gradient-to-r ${gradient}`}>
                <div className="text-white">{icon}</div>
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{timeframe}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {trend && (
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 flex flex-col justify-center">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            renderChart()
          )}
        </div>

        {/* Legend */}
        {showLegend && type !== 'metric' && data.length > 1 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              {data.slice(0, 4).map((item, index) => (
                <div key={index} className="flex items-center space-x-2 text-xs">
                  <div 
                    className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}
                    style={type === 'pie' ? { backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)` } : {}}
                  />
                  <span className="text-gray-600 truncate max-w-20">{item.label}</span>
                  <span className="font-medium text-gray-900">{item.value}</span>
                </div>
              ))}
              {data.length > 4 && (
                <span className="text-xs text-gray-500">+{data.length - 4} more</span>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AnalyticsWidget;
