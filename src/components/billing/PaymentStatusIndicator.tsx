import React from 'react';
import { CheckCircle, Clock, AlertTriangle, XCircle, CreditCard } from 'lucide-react';
import Badge from '../ui/Badge';

interface PaymentStatusIndicatorProps {
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'failed' | 'processing';
  amount?: number;
  totalAmount?: number;
  className?: string;
  showIcon?: boolean;
  showText?: boolean;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PaymentStatusIndicator: React.FC<PaymentStatusIndicatorProps> = ({
  status,
  amount,
  totalAmount,
  className = '',
  showIcon = true,
  showText = true,
  showProgress = true,
  size = 'md'
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'paid':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-200',
          label: 'Paid',
          variant: 'success' as const
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-200',
          label: 'Pending',
          variant: 'warning' as const
        };
      case 'partial':
        return {
          icon: CreditCard,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-200',
          label: 'Partial',
          variant: 'info' as const
        };
      case 'overdue':
        return {
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-200',
          label: 'Overdue',
          variant: 'danger' as const
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-200',
          label: 'Failed',
          variant: 'danger' as const
        };
      case 'processing':
        return {
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-200',
          label: 'Processing',
          variant: 'info' as const
        };
      default:
        return {
          icon: Clock,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200',
          label: 'Unknown',
          variant: 'secondary' as const
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          icon: 'w-3 h-3',
          text: 'text-xs',
          padding: 'px-2 py-1'
        };
      case 'lg':
        return {
          icon: 'w-5 h-5',
          text: 'text-base',
          padding: 'px-4 py-2'
        };
      default:
        return {
          icon: 'w-4 h-4',
          text: 'text-sm',
          padding: 'px-3 py-1.5'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  const getProgressPercentage = () => {
    if (amount && totalAmount && totalAmount > 0) {
      return Math.min((amount / totalAmount) * 100, 100);
    }
    return status === 'paid' ? 100 : 0;
  };

  const progressPercentage = getProgressPercentage();

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      {/* Status Badge */}
      <Badge variant={config.variant} className={`${sizeClasses.padding} ${sizeClasses.text}`}>
        <div className="flex items-center space-x-1">
          {showIcon && <Icon className={sizeClasses.icon} />}
          {showText && <span>{config.label}</span>}
        </div>
      </Badge>

      {/* Progress Bar for Partial Payments */}
      {showProgress && status === 'partial' && amount && totalAmount && (
        <div className="flex items-center space-x-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className={`${sizeClasses.text} text-gray-600 font-medium`}>
            {Math.round(progressPercentage)}%
          </span>
        </div>
      )}

      {/* Processing Animation */}
      {status === 'processing' && (
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse"></div>
          <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        </div>
      )}
    </div>
  );
};

export default PaymentStatusIndicator;