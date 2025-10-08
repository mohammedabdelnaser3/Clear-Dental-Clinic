import React from 'react';
import { Button } from '../ui';
import { useNotifications } from '../../hooks/useNotifications';
import { Bell, RefreshCw } from 'lucide-react';

const NotificationTest: React.FC = () => {
  const { notifications, unreadCount, loading, refreshNotifications } = useNotifications();

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Status
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={refreshNotifications}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Total Notifications:</span>
          <span className="text-sm font-medium">{notifications.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Unread Count:</span>
          <span className="text-sm font-medium text-red-600">{unreadCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Status:</span>
          <span className={`text-sm font-medium ${loading ? 'text-yellow-600' : 'text-green-600'}`}>
            {loading ? 'Loading...' : 'Ready'}
          </span>
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Notifications:</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {notifications.slice(0, 3).map((notification) => (
              <div key={notification._id} className="text-xs p-2 bg-gray-50 rounded">
                <div className="font-medium">{notification.title}</div>
                <div className="text-gray-600 truncate">{notification.message}</div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-gray-500">{notification.type}</span>
                  <span className={`px-1 rounded ${notification.isRead ? 'bg-gray-200 text-gray-600' : 'bg-blue-200 text-blue-800'}`}>
                    {notification.isRead ? 'Read' : 'Unread'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationTest;