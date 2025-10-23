import React from 'react';
import type { ReactNode } from 'react';

interface CardButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  role?: string;
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  'aria-label'?: string;
}

const CardButton: React.FC<CardButtonProps> = ({
  children,
  className = '',
  onClick,
  role,
  tabIndex,
  onKeyDown,
  'aria-label': ariaLabel,
}) => {
  return (
    <div 
      className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}
      onClick={onClick}
      role={role}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
};

export default CardButton;