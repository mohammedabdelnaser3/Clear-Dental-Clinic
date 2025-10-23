import React, { Fragment, useRef, useEffect } from 'react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnClickOutside?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnClickOutside = true,
  showCloseButton = true,
  className = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnClickOutside && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  const getSizeClasses = (): string => {
    switch (size) {
      case 'sm':
        return 'max-w-full sm:max-w-sm mx-2 sm:mx-auto';
      case 'md':
        return 'max-w-full sm:max-w-md mx-2 sm:mx-auto';
      case 'lg':
        return 'max-w-full sm:max-w-lg mx-2 sm:mx-auto';
      case 'xl':
        return 'max-w-full sm:max-w-xl mx-2 sm:mx-auto';
      case 'full':
        return 'max-w-full m-2 sm:m-4';
      default:
        return 'max-w-full sm:max-w-md mx-2 sm:mx-auto';
    }
  };

  return (
    <Fragment>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-y-auto overflow-x-hidden bg-black bg-opacity-50 p-0 sm:p-4"
        onClick={handleBackdropClick}
        aria-modal="true"
        role="dialog"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        <div
          ref={modalRef}
          className={`relative rounded-t-lg sm:rounded-lg bg-white shadow-xl ${getSizeClasses()} w-full max-h-[90vh] sm:max-h-[85vh] flex flex-col ${className}`}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between rounded-t-lg border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4 flex-shrink-0">
              {title && (
                <h3 className="text-base sm:text-lg font-medium text-gray-900" id="modal-title">
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <span className="sr-only">Close</span>
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="px-4 py-3 sm:px-6 sm:py-4 overflow-y-auto flex-1">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="flex justify-end rounded-b-lg border-t border-gray-200 px-4 py-3 sm:px-6 sm:py-4 flex-shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Fragment>
  );
};

// Predefined footer with cancel and confirm buttons
export const ModalFooter: React.FC<{
  onCancel: () => void;
  onConfirm: () => void;
  cancelText?: string;
  confirmText?: string;
  confirmVariant?: 'primary' | 'danger' | 'success';
  isConfirmLoading?: boolean;
  isConfirmDisabled?: boolean;
}> = ({
  onCancel,
  onConfirm,
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  confirmVariant = 'primary',
  isConfirmLoading = false,
  isConfirmDisabled = false,
}) => {
  return (
    <div className="flex space-x-3">
      <Button variant="light" onClick={onCancel}>
        {cancelText}
      </Button>
      <Button
        variant={confirmVariant}
        onClick={onConfirm}
        isLoading={isConfirmLoading}
        disabled={isConfirmDisabled}
      >
        {confirmText}
      </Button>
    </div>
  );
};

export default Modal;