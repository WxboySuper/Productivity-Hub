import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../auth';

interface Notification {
  id: number;
  task_id?: number;
  message: string;
  created_at: string;
  read: boolean;
  snoozed_until?: string;
  type: string;
}

interface NotificationCenterProps {
  pollingInterval?: number;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ pollingInterval = 10000 }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [show, setShow] = useState(false);
  const [modalNotification, setModalNotification] = useState<Notification | null>(null);
  // Track which notifications have already triggered a browser/in-app notification
  const shownNotificationIds = useRef(new Set<number>());

  // Request browser notification permission
  useEffect(() => {
    if (Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Poll for notifications
  useEffect(() => {
    // Don't fetch notifications if user is not authenticated
    if (!isAuthenticated) {
      // Clear notifications when user logs out
      setNotifications([]);
      return;
    }

    // Always clear shownNotificationIds on mount to avoid stale state
    shownNotificationIds.current = new Set();
    let timer: NodeJS.Timeout;
    const fetchNotifications = async () => {
      // Remove debug: do not add pollCycleId in production
      const now = new Date();
      try {
        const res = await fetch('/api/notifications', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
          // Production: remove all debug logs
          const nextToShow = data.find((n: Notification & { show_at?: string }) => {
            let showAtRaw = n.show_at;
            // Trim to seconds precision for JS Date compatibility
            if (showAtRaw && showAtRaw.length > 19) {
              showAtRaw = showAtRaw.slice(0, 19) + 'Z';
            }
            const showAtDate = showAtRaw ? new Date(showAtRaw) : new Date(n.created_at);
            if (n.read || n.type !== 'reminder' || shownNotificationIds.current.has(n.id)) return false;
            return now >= showAtDate;
          });
          if (nextToShow) {
            if (Notification.permission === 'granted') {
              new Notification('Task Reminder', { body: nextToShow.message });
            }
            setModalNotification(nextToShow);
            shownNotificationIds.current.add(nextToShow.id);
          }
        }
      } catch {}
      timer = setTimeout(fetchNotifications, pollingInterval);
    };
    fetchNotifications();
    return () => clearTimeout(timer);
  }, [pollingInterval, isAuthenticated]);

  // When modalNotification is dismissed or snoozed, clear it
  const handleDismiss = async (id: number) => {
    // Don't make API calls if not authenticated
    if (!isAuthenticated) {
      setModalNotification(null);
      return;
    }
    
    // Get CSRF token from cookie
    const csrfToken = document.cookie.match(/_csrf_token=([^;]+)/)?.[1];
    await fetch(`/api/notifications/${id}/dismiss`, {
      method: 'POST',
      headers: {
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      },
      credentials: 'include',
    });
    setNotifications(notifications => notifications.map(n => n.id === id ? { ...n, read: true } : n));
    setModalNotification(null);
  };

  const handleSnooze = async (id: number, minutes: number = 10) => {
    // Don't make API calls if not authenticated
    if (!isAuthenticated) {
      setModalNotification(null);
      return;
    }
    
    // Get CSRF token from cookie
    const csrfToken = document.cookie.match(/_csrf_token=([^;]+)/)?.[1];
    await fetch(`/api/notifications/${id}/snooze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({ minutes }),
    });
    setNotifications(notifications => notifications.map(n => n.id === id ? { ...n, snoozed_until: new Date(Date.now() + minutes * 60000).toISOString() } : n));
    setModalNotification(null);
  };

  // Remove global test notification injector for production
  // if (typeof window !== 'undefined') {
  //   (window as any).injectTestNotification = (message = 'This is a test in-app reminder notification.') => {
  //     const event = new CustomEvent('injectTestNotification', { detail: { message } });
  //     window.dispatchEvent(event);
  //   };
  // }

  // Remove injected test notification listener for production
  // useEffect(() => {
  //   const handler = (e: any) => {
  //     const msg = e.detail?.message || 'This is a test in-app reminder notification.';
  //     setNotifications((prev) => [
  //       {
  //         id: Date.now(),
  //         message: msg,
  //         created_at: new Date().toISOString(),
  //         read: false,
  //         type: 'reminder',
  //       },
  //       ...prev,
  //     ]);
  //   };
  //   window.addEventListener('injectTestNotification', handler);
  //   return () => window.removeEventListener('injectTestNotification', handler);
  // }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Don't render notification center for unauthenticated users
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Centered modal for latest unread reminder */}
      {modalNotification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 relative flex flex-col items-center border-2 border-yellow-400">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              onClick={() => handleDismiss(modalNotification.id)}
              type="button"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4 text-yellow-700">⏰ Reminder</h2>
            <p className="mb-4 text-gray-800 text-lg text-center">{modalNotification.message}</p>
            <div className="flex gap-4 mt-2">
              <button
                className="phub-action-btn-secondary px-4 py-2"
                onClick={() => handleDismiss(modalNotification.id)}
              >
                Dismiss
              </button>
              <button
                className="px-4 py-2 bg-yellow-400 text-yellow-900 rounded hover:bg-yellow-500 font-semibold transition-colors"
                onClick={() => handleSnooze(modalNotification.id, 10)}
              >
                Snooze 10m
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Notification bell and panel */}
      <div className="fixed top-20 right-4 z-50">
        <button
          className="relative bg-white border border-blue-200 rounded-full p-3 shadow-lg hover:bg-blue-50 transition-all duration-200 hover:scale-105"
          onClick={() => setShow(s => !s)}
          aria-label="Show notifications"
        >
          <span role="img" aria-label="bell">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">{unreadCount}</span>
          )}
        </button>
        {show && (
          <div className="mt-2 w-80 bg-white border border-blue-200 rounded-xl shadow-xl p-4 max-h-96 overflow-y-auto backdrop-blur-sm">
            <h3 className="font-bold text-blue-700 mb-3 text-lg">🔔 Notifications</h3>
            {notifications.length === 0 && <div className="text-gray-500 text-center py-4">No notifications.</div>}
            <div className="space-y-3">
              {notifications.map(n => (
                <div 
                  key={n.id} 
                  className={`p-4 border rounded-lg transition-all duration-200 ${
                    n.read 
                      ? 'border-gray-200 bg-gray-50 text-gray-600' 
                      : 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`${n.read ? 'text-gray-600' : 'text-blue-900 font-medium'} flex-1 mr-3`}>
                      {n.message}
                    </span>
                    {!n.read && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button 
                          className="phub-action-btn-secondary text-xs px-2 py-1" 
                          onClick={() => handleDismiss(n.id)}
                        >
                          Dismiss
                        </button>
                        <button 
                          className="text-xs px-2 py-1 bg-yellow-400 text-yellow-900 rounded hover:bg-yellow-500 font-medium transition-colors" 
                          onClick={() => handleSnooze(n.id, 10)}
                        >
                          Snooze 10m
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationCenter;
