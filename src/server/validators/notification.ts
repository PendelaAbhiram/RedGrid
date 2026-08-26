import { z } from 'zod';
import { NotificationType } from '@prisma/client';

export const notificationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().min(1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().min(1).max(100)),
  unreadOnly: z
    .string()
    .optional()
    .transform((val) => val === 'true' || val === '1'),
  type: z.string().optional(),
});

export const createNotificationSchema = z.object({
  recipientUserId: z.string().uuid('Invalid recipient user ID'),
  type: z.nativeEnum(NotificationType).default(NotificationType.GENERAL),
  title: z.string().min(1, 'Title cannot be empty').max(200, 'Title too long'),
  message: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
  relatedEntityId: z.string().optional().nullable(),
  relatedEntityType: z.string().optional().nullable(),
});

export const notificationParamSchema = z.object({
  id: z.string().uuid('Invalid notification ID'),
});
