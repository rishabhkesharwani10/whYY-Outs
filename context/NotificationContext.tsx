import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Notification } from '../types.ts';
import { supabase } from '../supabase.ts';
import { useAuth } from './AuthContext.tsx';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAllAsRead: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const mapSupabaseNotification = (notification: any): Notification => ({
    id: notification.id,
    userId: notification.user_id,
    orderId: notification.order_id,
    message: notification.message,
    isRead: notification.is_read,
    createdAt: notification.created_at,
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, loading: authLoading } = useAuth();

    const fetchNotifications = useCallback(async () => {
        if (user) {
            setLoading(true);
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) {
                console.error("Error fetching notifications:", JSON.stringify(error, null, 2));
            } else if (data) {
                setNotifications(data.map(mapSupabaseNotification));
            }
            setLoading(false);
        } else if (!authLoading) {
            setNotifications([]);
            setLoading(false);
        }
    }, [user, authLoading]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);
    
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`notifications-for-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    const newNotification = mapSupabaseNotification(payload.new);
                    setNotifications(prev => [newNotification, ...prev]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const unreadCount = useMemo(() => {
        return notifications.filter(n => !n.isRead).length;
    }, [notifications]);

    const markAllAsRead = useCallback(async () => {
        if (!user || unreadCount === 0) return;

        // Optimistic update
        const originalNotifications = [...notifications];
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (error) {
            console.error("Error marking notifications as read:", JSON.stringify(error, null, 2));
            // Rollback on error
            setNotifications(originalNotifications);
        }
    }, [user, notifications, unreadCount]);

    const value = useMemo(() => ({
        notifications,
        unreadCount,
        loading,
        markAllAsRead,
    }), [notifications, unreadCount, loading, markAllAsRead]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
