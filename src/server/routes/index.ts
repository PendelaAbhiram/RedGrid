import { Router } from 'express';
import healthRoutes from './health';
import authRoutes from './auth';
import organizationRoutes from './organizations';
import adminRoutes from './admin';
import inventoryRoutes from './inventory';
import emergencyRoutes from './emergencies';
import radarRoutes from './radar';
import notificationRoutes from './notifications';
import assistantRoutes from './assistant';

const router = Router();

// Mount Health Check (GET /api/health)
router.use('/', healthRoutes);

// Mount Authentication & Authorization (POST /api/auth/register, POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout)
router.use('/auth', authRoutes);

// Mount Organization Management (POST /api/organizations/register/*, GET/PATCH /api/organizations/me, documents)
router.use('/organizations', organizationRoutes);

// Mount Super Admin Management (GET/POST /api/admin/organizations/*)
router.use('/admin', adminRoutes);

// Mount Blood Inventory Management (GET /api/inventory, GET /api/inventory/my, PATCH /api/inventory/:bloodGroup, GET /api/inventory/summary, GET /api/inventory/transactions)
router.use('/inventory', inventoryRoutes);

// Mount Emergency Requirements & Donor Responses (POST /api/emergencies, GET /api/emergencies, POST /api/emergencies/:id/respond, etc.)
router.use('/emergencies', emergencyRoutes);

// Mount Safe Geographical Radar (GET /api/radar)
router.use('/radar', radarRoutes);

// Mount In-App Notification System (GET /api/notifications, GET /api/notifications/unread-count, PATCH /api/notifications/:id/read, PATCH /api/notifications/read-all)
router.use('/notifications', notificationRoutes);

// Mount Dr. Clara AI Transfusion Assistant (POST /api/assistant/chat)
router.use('/assistant', assistantRoutes);

// Placeholder / Future API Route Mounts (Will be activated in subsequent phases):
// router.use('/users', userRoutes);
// router.use('/donations', donationRoutes);
// router.use('/complaints', complaintRoutes);
// router.use('/ai', aiRoutes);

export default router;
