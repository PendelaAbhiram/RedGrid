import { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import {
  emitNotificationNew,
  emitNotificationUpdated,
  emitNotificationAllRead,
  NotificationSocketPayload,
} from '../socket';

export interface CreateNotificationInput {
  recipientUserId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId?: string | null;
  relatedEntityType?: string | null;
}

export interface GetNotificationsOptions {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: string;
}

export interface FormattedNotification {
  id: string;
  recipientUserId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId: string | null;
  relatedEntityType: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
  timeAgo?: string;
}

/**
 * Helper to compute human-friendly relative time
 */
export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Formats a raw Prisma notification record for API responses & socket emissions.
 */
export function formatNotification(notification: any): FormattedNotification {
  const createdAtDate = new Date(notification.createdAt);
  return {
    id: notification.id,
    recipientUserId: notification.recipientUserId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    relatedEntityId: notification.relatedEntityId ?? null,
    relatedEntityType: notification.relatedEntityType ?? null,
    isRead: Boolean(notification.isRead),
    createdAt: createdAtDate.toISOString(),
    readAt: notification.readAt ? new Date(notification.readAt).toISOString() : null,
    timeAgo: formatTimeAgo(createdAtDate),
  };
}

/**
 * Creates a single notification in PostgreSQL and emits it in real-time via Socket.IO.
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<FormattedNotification> {
  const { recipientUserId, type, title, message, relatedEntityId, relatedEntityType } = input;

  const record = await prisma.notification.create({
    data: {
      recipientUserId,
      type,
      title: title.trim(),
      message: message.trim(),
      relatedEntityId: relatedEntityId || null,
      relatedEntityType: relatedEntityType || null,
      isRead: false,
    },
  });

  const formatted = formatNotification(record);

  // Broadcast real-time event to the specific recipient's room
  try {
    emitNotificationNew({
      id: formatted.id,
      recipientUserId: formatted.recipientUserId,
      type: formatted.type,
      title: formatted.title,
      message: formatted.message,
      relatedEntityId: formatted.relatedEntityId,
      relatedEntityType: formatted.relatedEntityType,
      isRead: formatted.isRead,
      createdAt: formatted.createdAt,
      readAt: formatted.readAt,
    });
  } catch (socketErr) {
    console.warn('Non-fatal error broadcasting notification:new event:', socketErr);
  }

  return formatted;
}

/**
 * Bulk creates notifications in PostgreSQL and emits each to its recipient room.
 */
export async function createBulkNotifications(
  inputs: CreateNotificationInput[]
): Promise<FormattedNotification[]> {
  if (!inputs || inputs.length === 0) return [];

  // Execute database writes
  const createdRecords = await prisma.$transaction(
    inputs.map((item) =>
      prisma.notification.create({
        data: {
          recipientUserId: item.recipientUserId,
          type: item.type,
          title: item.title.trim(),
          message: item.message.trim(),
          relatedEntityId: item.relatedEntityId || null,
          relatedEntityType: item.relatedEntityType || null,
          isRead: false,
        },
      })
    )
  );

  const formattedList = createdRecords.map((r) => formatNotification(r));

  // Real-time broadcasts
  formattedList.forEach((formatted) => {
    try {
      emitNotificationNew({
        id: formatted.id,
        recipientUserId: formatted.recipientUserId,
        type: formatted.type,
        title: formatted.title,
        message: formatted.message,
        relatedEntityId: formatted.relatedEntityId,
        relatedEntityType: formatted.relatedEntityType,
        isRead: formatted.isRead,
        createdAt: formatted.createdAt,
        readAt: formatted.readAt,
      });
    } catch (err) {
      console.warn('Non-fatal error in bulk notification broadcast:', err);
    }
  });

  return formattedList;
}

/**
 * Retrieves paginated notifications for a specific user from PostgreSQL.
 */
export async function getUserNotifications(
  userId: string,
  options: GetNotificationsOptions = {}
): Promise<{
  notifications: FormattedNotification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  const whereClause: Prisma.NotificationWhereInput = {
    recipientUserId: userId,
  };

  if (options.unreadOnly) {
    whereClause.isRead = false;
  }

  if (options.type && options.type !== 'ALL') {
    const searchType = String(options.type).toUpperCase();
    const matchingType = Object.values(NotificationType).find(
      (t) => String(t).toUpperCase() === searchType
    );
    if (matchingType) {
      whereClause.type = matchingType;
    }
  }

  const [total, unreadCount, records] = await Promise.all([
    prisma.notification.count({ where: whereClause }),
    prisma.notification.count({
      where: {
        recipientUserId: userId,
        isRead: false,
      },
    }),
    prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    notifications: records.map((r) => formatNotification(r)),
    total,
    unreadCount,
    page,
    limit,
    totalPages,
  };
}

/**
 * Gets count of unread notifications for a user.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      recipientUserId: userId,
      isRead: false,
    },
  });
}

/**
 * Marks a specific notification as read.
 * Enforces ownership check (must belong to userId).
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<FormattedNotification | null> {
  const existing = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!existing || existing.recipientUserId !== userId) {
    return null;
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  const formatted = formatNotification(updated);

  try {
    emitNotificationUpdated({
      id: formatted.id,
      recipientUserId: formatted.recipientUserId,
      type: formatted.type,
      title: formatted.title,
      message: formatted.message,
      relatedEntityId: formatted.relatedEntityId,
      relatedEntityType: formatted.relatedEntityType,
      isRead: formatted.isRead,
      createdAt: formatted.createdAt,
      readAt: formatted.readAt,
    });
  } catch (socketErr) {
    console.warn('Non-fatal error broadcasting notification:updated event:', socketErr);
  }

  return formatted;
}

/**
 * Marks all unread notifications for a user as read.
 */
export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  const updateResult = await prisma.notification.updateMany({
    where: {
      recipientUserId: userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  try {
    emitNotificationAllRead(userId);
  } catch (socketErr) {
    console.warn('Non-fatal error broadcasting notification:all-read event:', socketErr);
  }

  return updateResult.count;
}

/**
 * Deletes a notification belonging to a user.
 */
export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<boolean> {
  const existing = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!existing || existing.recipientUserId !== userId) {
    return false;
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });

  return true;
}
