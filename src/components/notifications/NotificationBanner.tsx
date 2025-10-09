import React, { useState } from 'react';
import { Info, X } from 'lucide-react';

interface NotificationBannerProps {
  show: boolean;
  onDismiss?: () => void;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({ show, onDismiss }) => {
  const [dismissed, setDismissed] = useState(false);

  if (!show || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Info className="w-5 h-5 text-blue-400 mr-3" />
          <div>
            <p className="text-sm text-blue-700">
              <strong>Development Mode:</strong> Notification system is using demo data. 
              Real notifications will be available when the backend API is connected.
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-blue-400 hover:text-blue-600 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default NotificationBanner;