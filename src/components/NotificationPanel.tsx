import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Radio,
  Heart,
  CheckCircle2,
  XCircle,
  Sparkles,
  AlertTriangle,
  Package,
  Info,
  Clock,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { AppNotification, NotificationType, AppScreen, UserRole } from '../types';

interface NotificationPanelProps {
  notifications: AppNotification[];
  unreadCount: number;
  onMarkAsRead: (notificationId: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  onDeleteNotification: (notificationId: string) => Promise<void>;
  onNavigate: (screen: AppScreen) => void;
  userRole: UserRole;
  theme?: 'dark' | 'light';
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onNavigate,
  userRole,
  theme = 'dark',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | 'EMERGENCY' | 'RESPONSE' | 'SYSTEM'>('ALL');
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleMarkAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (unreadCount === 0 || isProcessingAll) return;
    setIsProcessingAll(true);
    try {
      await onMarkAllAsRead();
    } finally {
      setIsProcessingAll(false);
    }
  };

  const handleItemClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await onMarkAsRead(notif.id);
    }

    // Smart contextual navigation based on type & role
    if (notif.type === 'EMERGENCY_ALERT') {
      if (userRole === 'HOSPITAL') onNavigate('HOSPITAL_ALERTS');
      else if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') onNavigate('ADMIN_ALERTS');
      else onNavigate('EMERGENCY_ALERTS');
      setIsOpen(false);
    } else if (notif.type === 'DONOR_RESPONSE') {
      if (userRole === 'HOSPITAL') onNavigate('HOSPITAL_RESPONSES');
      else if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') onNavigate('ADMIN_DASHBOARD');
      else onNavigate('DASHBOARD');
      setIsOpen(false);
    } else if (notif.type === 'ORGANIZATION_APPROVED' || notif.type === 'ORGANIZATION_REJECTED' || notif.type === 'ORGANIZATION_SUSPENDED') {
      if (userRole === 'HOSPITAL') onNavigate('HOSPITAL_PROFILE');
      else if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') onNavigate('ADMIN_ORGANIZATIONS');
      setIsOpen(false);
    } else if (notif.type === 'INVENTORY_LOW') {
      if (userRole === 'HOSPITAL') onNavigate('HOSPITAL_STOCK');
      else if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') onNavigate('ADMIN_STOCK');
      else onNavigate('BLOOD_STOCK');
      setIsOpen(false);
    }
  };

  // Filter items
  const filteredNotifications = notifications.filter((notif) => {
    if (activeFilter === 'UNREAD') return !notif.isRead;
    if (activeFilter === 'EMERGENCY') {
      return (
        notif.type === 'EMERGENCY_ALERT' ||
        notif.type === 'EMERGENCY_FULFILLED' ||
        notif.type === 'EMERGENCY_CANCELLED'
      );
    }
    if (activeFilter === 'RESPONSE') return notif.type === 'DONOR_RESPONSE';
    if (activeFilter === 'SYSTEM') {
      return (
        notif.type === 'ORGANIZATION_APPROVED' ||
        notif.type === 'ORGANIZATION_REJECTED' ||
        notif.type === 'ORGANIZATION_SUSPENDED' ||
        notif.type === 'INVENTORY_LOW' ||
        notif.type === 'GENERAL'
      );
    }
    return true;
  });

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'EMERGENCY_ALERT':
        return <Radio className="w-4 h-4 text-rose-500 animate-pulse" />;
      case 'DONOR_RESPONSE':
        return <Heart className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />;
      case 'EMERGENCY_FULFILLED':
        return <CheckCircle2 className="w-4 h-4 text-sky-400" />;
      case 'EMERGENCY_CANCELLED':
        return <XCircle className="w-4 h-4 text-slate-400" />;
      case 'ORGANIZATION_APPROVED':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'ORGANIZATION_REJECTED':
      case 'ORGANIZATION_SUSPENDED':
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case 'INVENTORY_LOW':
        return <Package className="w-4 h-4 text-rose-400" />;
      default:
        return <Info className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getIconContainerStyle = (type: NotificationType) => {
    switch (type) {
      case 'EMERGENCY_ALERT':
        return 'bg-rose-500/15 border-rose-500/30 text-rose-400';
      case 'DONOR_RESPONSE':
        return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
      case 'EMERGENCY_FULFILLED':
        return 'bg-sky-500/15 border-sky-500/30 text-sky-400';
      case 'EMERGENCY_CANCELLED':
        return 'bg-slate-500/15 border-slate-500/30 text-slate-400';
      case 'ORGANIZATION_APPROVED':
        return 'bg-amber-500/15 border-amber-500/30 text-amber-400';
      case 'ORGANIZATION_REJECTED':
      case 'ORGANIZATION_SUSPENDED':
        return 'bg-orange-500/15 border-orange-500/30 text-orange-400';
      case 'INVENTORY_LOW':
        return 'bg-rose-500/15 border-rose-500/30 text-rose-400';
      default:
        return 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400';
    }
  };

  const isLight = theme === 'light';

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        id="btn-notification-bell"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open notifications"
        title="In-App Notifications"
        className={`relative p-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center ${
          isOpen
            ? isLight
              ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-sm'
              : 'bg-rose-950/50 border-rose-700/60 text-white shadow-md shadow-rose-950'
            : isLight
            ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
            : 'bg-[#182235] hover:bg-[#22304a] text-zinc-300 hover:text-white border-[#263247]'
        }`}
      >
        <Bell className="w-4 h-4" />

        {/* Pulsing Badge for Unread Notifications */}
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
              <span className="relative inline-flex items-center justify-center h-4 min-w-[16px] px-1 text-[10px] font-extrabold text-white bg-[#F20A46] rounded-full shadow-sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            </span>
          </>
        )}
      </button>

      {/* Dropdown Flyout Panel */}
      {isOpen && (
        <div
          id="notification-flyout-panel"
          className={`absolute right-0 mt-2 w-[340px] sm:w-[400px] max-w-[calc(100vw-24px)] rounded-2xl shadow-2xl z-50 overflow-hidden border transition-all animate-in fade-in zoom-in-95 duration-150 ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 divide-slate-100 shadow-slate-300/50'
              : 'bg-[#0F172A] border-[#263247] text-white shadow-black/80'
          }`}
        >
          {/* Header */}
          <div
            className={`px-4 py-3 border-b flex items-center justify-between gap-2 ${
              isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-[#0B1220] border-[#263247]'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-tight">Notifications</h3>
                <p className="text-[10px] text-slate-400">
                  {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                id="btn-mark-all-read"
                onClick={handleMarkAll}
                disabled={isProcessingAll}
                className={`text-[11px] font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-[#182235] hover:bg-[#22304a] text-zinc-300 hover:text-white border-[#263247]'
                }`}
              >
                <CheckCheck className="w-3 h-3 text-emerald-400" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div
            className={`px-3 py-2 border-b flex items-center gap-1 overflow-x-auto scrollbar-none text-[11px] font-medium ${
              isLight ? 'bg-white border-slate-100' : 'bg-[#0E1626] border-[#1F2B3E]'
            }`}
          >
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === 'ALL'
                  ? 'bg-rose-600 text-white font-bold'
                  : isLight
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-zinc-400 hover:bg-[#182235]'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('UNREAD')}
              className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === 'UNREAD'
                  ? 'bg-rose-600 text-white font-bold'
                  : isLight
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-zinc-400 hover:bg-[#182235]'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setActiveFilter('EMERGENCY')}
              className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === 'EMERGENCY'
                  ? 'bg-rose-600 text-white font-bold'
                  : isLight
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-zinc-400 hover:bg-[#182235]'
              }`}
            >
              Emergencies
            </button>
            <button
              onClick={() => setActiveFilter('RESPONSE')}
              className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === 'RESPONSE'
                  ? 'bg-rose-600 text-white font-bold'
                  : isLight
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-zinc-400 hover:bg-[#182235]'
              }`}
            >
              Responses
            </button>
            <button
              onClick={() => setActiveFilter('SYSTEM')}
              className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === 'SYSTEM'
                  ? 'bg-rose-600 text-white font-bold'
                  : isLight
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-zinc-400 hover:bg-[#182235]'
              }`}
            >
              System
            </button>
          </div>

          {/* Notifications Scroll Area */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#1F2B3E]/50">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-slate-400 mb-2">
                  <Bell className="w-4 h-4 opacity-50" />
                </div>
                <p className="text-xs font-semibold text-slate-300">
                  {activeFilter === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Emergency broadcasts and system alerts will appear here in real-time.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group relative ${
                    !notif.isRead
                      ? isLight
                        ? 'bg-rose-50/50 hover:bg-rose-50'
                        : 'bg-rose-950/20 hover:bg-rose-950/30'
                      : isLight
                      ? 'hover:bg-slate-50'
                      : 'hover:bg-[#131C2E]'
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border ${getIconContainerStyle(
                      notif.type
                    )}`}
                  >
                    {getNotificationIcon(notif.type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className="text-xs font-bold leading-tight truncate pr-4 text-slate-100">
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#F20A46] shrink-0" title="Unread" />
                      )}
                    </div>
                    <p
                      className={`text-[11px] leading-relaxed line-clamp-2 ${
                        isLight ? 'text-slate-600' : 'text-zinc-300'
                      }`}
                    >
                      {notif.message}
                    </p>

                    {/* Metadata & Actions */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                        <Clock className="w-2.5 h-2.5 text-slate-500" />
                        {notif.timeAgo || 'Recent'}
                      </span>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.isRead && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMarkAsRead(notif.id);
                            }}
                            className="text-[10px] font-bold text-rose-400 hover:text-rose-300 px-1.5 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20"
                            title="Mark as read"
                          >
                            Read
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNotification(notif.id);
                          }}
                          className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10"
                          title="Dismiss notification"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              className={`p-2 px-3 border-t text-center ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0B1220] border-[#263247]'
              }`}
            >
              <span className="text-[10px] text-slate-500 font-medium">
                Live synchronization with PostgreSQL database
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
