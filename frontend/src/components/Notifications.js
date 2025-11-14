import React, { useState, useEffect } from 'react';
import '../Notifications.css';

function Notifications({ user, token }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Simulated notifications - in production, these would come from backend/websocket
    const mockNotifications = [
      {
        id: 1,
        type: 'session_starting',
        title: 'Session Starting Soon',
        message: 'Your Calculus session starts in 15 minutes at Central Library',
        timestamp: new Date(Date.now() - 10 * 60000),
        read: false
      },
      {
        id: 2,
        type: 'new_participant',
        title: 'New Participant Joined',
        message: 'John Doe joined your Physics study session',
        timestamp: new Date(Date.now() - 30 * 60000),
        read: false
      },
      {
        id: 3,
        type: 'session_cancelled',
        title: 'Session Cancelled',
        message: 'The Chemistry session has been cancelled by the host',
        timestamp: new Date(Date.now() - 120 * 60000),
        read: true
      }
    ];

    setNotifications(mockNotifications);

    // Check for nearby sessions every 5 minutes
    const interval = setInterval(() => {
      checkForNearbySessionsNotification();
    }, 5 * 60000);

    return () => clearInterval(interval);
  }, [user]);

  const checkForNearbySessionsNotification = () => {
    // This would make an API call to check for new sessions matching user preferences
    // For now, we'll just simulate it
    const hasNewSessions = Math.random() > 0.7;
    
    if (hasNewSessions) {
      const newNotification = {
        id: Date.now(),
        type: 'nearby_session',
        title: 'New Session Nearby',
        message: 'A new study session matching your interests is starting soon',
        timestamp: new Date(),
        read: false
      };

      setNotifications(prev => [newNotification, ...prev]);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification('FlashMob Learning', {
          body: newNotification.message,
          icon: '/logo192.png'
        });
      }
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = Math.floor((now - timestamp) / 60000); // difference in minutes

    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  const getNotificationIcon = (type) => {
    const icons = {
      session_starting: '⏰',
      new_participant: '👤',
      session_cancelled: '❌',
      nearby_session: '📍',
      reminder: '🔔',
      update: 'ℹ️'
    };
    return icons[type] || '🔔';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notifications-container">
      <button 
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Notifications</h3>
            <div className="header-actions">
              {notifications.length > 0 && (
                <>
                  <button onClick={markAllAsRead} className="mark-all-btn">
                    Mark all read
                  </button>
                  <button onClick={clearAll} className="clear-all-btn">
                    Clear all
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <div className="no-notif-icon">🔕</div>
                <p>No notifications</p>
                <button 
                  onClick={requestNotificationPermission}
                  className="enable-notif-btn"
                >
                  Enable Browser Notifications
                </button>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <span className="notification-time">
                      {formatTime(notification.timestamp)}
                    </span>
                  </div>
                  <button 
                    className="delete-notification"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications;