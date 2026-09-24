// Notification Context for Real-Time In-App Alerts
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Notification } from '../database/schema';
import { StorageEngine, STORAGE_KEYS } from '../database/storageEngine';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  sendNotification: (notif: Omit<Notification, 'id' | 'organizationId' | 'isRead' | 'createdAt'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    StorageEngine.getList<Notification>(STORAGE_KEYS.NOTIFICATIONS)
  );

  const refreshNotifs = () => {
    setNotifications(StorageEngine.getList<Notification>(STORAGE_KEYS.NOTIFICATIONS));
  };

  useEffect(() => {
    const unsub = StorageEngine.subscribe(refreshNotifs);
    return unsub;
  }, []);

  // Filter relevant notifications for current user
  const userNotifications = notifications.filter(
    n => !n.recipientUserId || n.recipientUserId === currentUser.id || currentUser.roleName === 'Super Admin'
  );

  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    StorageEngine.update<Notification>(STORAGE_KEYS.NOTIFICATIONS, id, { isRead: true });
    refreshNotifs();
  };

  const markAllAsRead = () => {
    const all = StorageEngine.getList<Notification>(STORAGE_KEYS.NOTIFICATIONS);
    all.forEach(n => {
      if (!n.recipientUserId || n.recipientUserId === currentUser.id) {
        n.isRead = true;
      }
    });
    StorageEngine.setList(STORAGE_KEYS.NOTIFICATIONS, all);
    refreshNotifs();
  };

  const sendNotification = (notif: Omit<Notification, 'id' | 'organizationId' | 'isRead' | 'createdAt'>) => {
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      organizationId: StorageEngine.getActiveTenantId(),
      ...notif,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    StorageEngine.insert<Notification>(STORAGE_KEYS.NOTIFICATIONS, newNotif);
    refreshNotifs();
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications: userNotifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        sendNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
