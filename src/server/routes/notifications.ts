import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import {
  notificationQuerySchema,
  notificationParamSchema,
} from '../validators/notification';
import {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../services/notificationService';
import { notificationLimiter } from '../middleware/rateLimit';

const router = Router();

// All notification routes strictly require authentication and rate limiting
router.use(requireAuth);
router.use(notificationLimiter);

/**
 * GET /api/notifications
 * Retrieves paginated notifications for the authenticated user with unread and type filters.
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const parseResult = notificationQuerySchema.safeParse(req.query);

    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid notification query parameters',
        errors: parseResult.error.issues,
      });
      return;
    }

    const { page, limit, unreadOnly, type } = parseResult.data;

    const data = await getUserNotifications(user.id, {
      page,
      limit,
      unreadOnly,
      type,
    });

    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications from database',
    });
  }
});

/**
 * GET /api/notifications/unread-count
 * Returns real-time unread notification count for the authenticated user.
 */
router.get('/unread-count', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const count = await getUnreadCount(user.id);

    res.json({
      success: true,
      count,
      unreadCount: count,
    });
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve unread notification count',
    });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Marks a specific notification as read (strictly verifies user ownership).
 */
router.patch('/:id/read', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const paramResult = notificationParamSchema.safeParse(req.params);

    if (!paramResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid notification ID parameter',
        errors: paramResult.error.issues,
      });
      return;
    }

    const { id } = paramResult.data;
    const updated = await markNotificationAsRead(id, user.id);

    if (!updated) {
      res.status(404).json({
        success: false,
        message: 'Notification not found or access denied',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification: updated,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification state',
    });
  }
});

/**
 * PATCH /api/notifications/read-all
 * Marks all unread notifications for the authenticated user as read.
 */
router.patch('/read-all', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const count = await markAllNotificationsAsRead(user.id);

    res.json({
      success: true,
      message: `Marked ${count} notification(s) as read`,
      count,
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Dismisses/deletes a single notification belonging to the authenticated user.
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const paramResult = notificationParamSchema.safeParse(req.params);

    if (!paramResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid notification ID parameter',
        errors: paramResult.error.issues,
      });
      return;
    }

    const { id } = paramResult.data;
    const deleted = await deleteNotification(id, user.id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Notification not found or access denied',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
    });
  }
});

export default router;
