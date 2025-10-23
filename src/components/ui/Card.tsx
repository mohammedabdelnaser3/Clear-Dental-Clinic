import React from 'react';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  noPadding?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  footer,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  noPadding = false,
}) => {
  const hasHeader = title || subtitle;

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {hasHeader && (
        <div className={`px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 ${headerClassName}`}>
          {title && <h3 className="text-base sm:text-lg font-medium text-gray-900">{title}</h3>}
          {subtitle && <p className="mt-1 text-xs sm:text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      <div className={`${noPadding ? '' : 'px-4 py-3 sm:px-6 sm:py-4'} ${bodyClassName}`}>
        {children}
      </div>
      {footer && (
        <div className={`px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-200 ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;