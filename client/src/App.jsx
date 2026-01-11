import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { useAuthStore } from './store/authStore';
import { useNotificationStore } from './store/notificationStore';
import Toast from './components/common/Toast';

const App = () => {
  const { initialize } = useAuthStore();
  
  // Example global notification display
  const { notifications, removeNotification } = useNotificationStore();

  useEffect(() => {
    // Initialize auth state (check localStorage for existing token)
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      {/* App Content */}
      <AppRoutes />

      {/* Global Toast Container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {notifications
          ?.filter(n => n.showToast)
          .map(notification => (
            <div key={notification.id} className="pointer-events-auto">
              <Toast
                id={notification.id}
                message={notification.message}
                type={notification.type || 'info'}
                onClose={() => removeNotification(notification.id)}
              />
            </div>
          ))}
      </div>
    </BrowserRouter>
  );
};

export default App;
