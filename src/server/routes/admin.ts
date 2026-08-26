import { Router, Request, Response } from 'express';
import {
  Role,
  AccountStatus,
  OrganizationType,
  OrganizationStatus,
  ActivityCategory,
  ActivitySeverity,
  BloodGroup,
  NotificationType,
} from '@prisma/client';
import { prisma } from '../prisma';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { adminActionReasonSchema, orgFilterQuerySchema } from '../validators/organization';
import {
  parseBloodGroup,
  formatBloodGroup,
  ALL_BLOOD_GROUP_STRINGS,
  ensureOrganizationInventories,
} from '../utils/bloodGroup';
import {
  bloodGroupParamSchema,
  adminUpdateStockSchema,
  transactionQuerySchema,
} from '../validators/inventory';
import { createAuditLog } from '../utils/audit';
import { emitInventoryUpdated } from '../socket';
import { createNotification } from '../services/notificationService';
import {
  getNetworkOverviewMetrics,
  getInventoryAnalytics,
  getEmergencyAnalytics,
  getDonorAnalytics,
  getOrganizationAnalytics,
  getAuditLogs,
  generateSummaryReport,
} from '../services/analyticsService';
import { adminAnalyticsLimiter } from '../middleware/rateLimit';

const router = Router();

// Enforce that ALL admin routes require authentication and SUPER_ADMIN role
router.use(requireAuth);
router.use(requireRole(Role.SUPER_ADMIN));

/**
 * GET /api/admin/organizations
 * Super Admin paginated list with type, status, and search filtering.
 */
router.get('/organizations', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = orgFilterQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid filter parameters',
        errors: parseResult.error.issues,
      });
      return;
    }

    const { type, status, search, page, limit } = parseResult.data;

    const whereClause: any = {};

    // Filter by type
    if (type && type !== 'ALL') {
      whereClause.type = type as OrganizationType;
    }

    // Filter by status
    if (status && status !== 'ALL') {
      whereClause.status = status as OrganizationStatus;
    }

    // Search by name, regNo, email, city, contactPerson
    if (search && search.trim()) {
      const cleanSearch = search.trim();
      whereClause.OR = [
        { name: { contains: cleanSearch, mode: 'insensitive' } },
        { registrationNumber: { contains: cleanSearch, mode: 'insensitive' } },
        { email: { contains: cleanSearch, mode: 'insensitive' } },
        { city: { contains: cleanSearch, mode: 'insensitive' } },
        { contactPerson: { contains: cleanSearch, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, organizations] = await Promise.all([
      prisma.organization.count({ where: whereClause }),
      prisma.organization.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          documents: {
            select: {
              id: true,
              documentType: true,
              fileName: true,
              fileSize: true,
              mimeType: true,
              uploadedAt: true,
            },
          },
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              status: true,
            },
          },
          inventories: {
            select: {
              bloodGroup: true,
              quantity: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      total,
      page,
      limit,
      totalPages,
      organizations: organizations.map((org) => {
        const totalBags = org.inventories.reduce((sum, item) => sum + item.quantity, 0);
        return {
          id: org.id,
          name: org.name,
          type: org.type,
          registrationNumber: org.registrationNumber,
          email: org.email,
          phone: org.phone,
          address: org.address,
          city: org.city,
          state: org.state,
          pincode: org.pincode,
          contactPerson: org.contactPerson,
          contactPersonDesignation: org.contactPersonDesignation,
          facilityType: org.facilityType,
          status: org.status,
          rejectionReason: org.rejectionReason,
          banReason: org.banReason,
          verifiedAt: org.verifiedAt,
          submittedDate: org.createdAt.toISOString(),
          totalBags,
          documents: org.documents,
          manager: org.manager,
          createdAt: org.createdAt,
          updatedAt: org.updatedAt,
        };
      }),
    });
  } catch (error) {
    console.error('Error fetching admin organizations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve organizations list',
    });
  }
});

/**
 * GET /api/admin/organizations/:id
 * Retrieve full single organization details for administrative verification.
 */
router.get('/organizations/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = req.params.id;

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        documents: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
          },
        },
        inventories: true,
        activityLogs: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!org) {
      res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
      return;
    }

    const totalBags = org.inventories.reduce((sum, item) => sum + item.quantity, 0);

    res.status(200).json({
      success: true,
      organization: {
        id: org.id,
        name: org.name,
        type: org.type,
        registrationNumber: org.registrationNumber,
        email: org.email,
        phone: org.phone,
        address: org.address,
        city: org.city,
        state: org.state,
        pincode: org.pincode,
        contactPerson: org.contactPerson,
        contactPersonDesignation: org.contactPersonDesignation,
        facilityType: org.facilityType,
        status: org.status,
        rejectionReason: org.rejectionReason,
        banReason: org.banReason,
        verifiedAt: org.verifiedAt,
        totalBags,
        documents: org.documents,
        manager: org.manager,
        activityLogs: org.activityLogs,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching organization details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve organization details',
    });
  }
});

/**
 * POST /api/admin/organizations/:id/approve
 * Approves a pending organization and activates its portal access.
 */
router.post('/organizations/:id/approve', async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const adminUser = authReq.user!;
    const orgId = req.params.id;

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { manager: true },
    });

    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found' });
      return;
    }

    const now = new Date();

    // Update organization status to APPROVED
    const updatedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: {
        status: OrganizationStatus.APPROVED,
        verifiedAt: now,
        rejectionReason: null,
        banReason: null,
      },
    });

    // Ensure linked user account is ACTIVE and ready for portal login
    if (org.userId) {
      await prisma.user.update({
        where: { id: org.userId },
        data: {
          status: AccountStatus.ACTIVE,
          banReason: null,
        },
      });
    }

    // Audit Log
    await createAuditLog({
      userId: adminUser.id,
      organizationId: org.id,
      category: ActivityCategory.SYSTEM,
      severity: ActivitySeverity.SUCCESS,
      eventText: `Organization "${org.name}" (${org.registrationNumber}) APPROVED by Super Admin ${adminUser.email}. Portal access authorized.`,
      metadata: {
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        verifiedAt: now.toISOString(),
        previousStatus: org.status,
        newStatus: OrganizationStatus.APPROVED,
      },
    });

    // Send persistent in-app notification to organization manager
    if (org.userId) {
      try {
        await createNotification({
          recipientUserId: org.userId,
          type: NotificationType.ORGANIZATION_APPROVED,
          title: `🎉 Organization Approved: ${org.name}`,
          message: `Your organization registration has been approved by Super Admin. Full portal access is now active!`,
          relatedEntityId: org.id,
          relatedEntityType: 'ORGANIZATION',
        });
      } catch (nErr) {
        console.warn('Non-fatal error creating org approval notification:', nErr);
      }
    }

    res.status(200).json({
      success: true,
      message: `Organization "${org.name}" has been successfully approved.`,
      organization: updatedOrg,
    });
  } catch (error) {
    console.error('Error approving organization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve organization',
    });
  }
});

/**
 * POST /api/admin/organizations/:id/reject
 * Rejects an organization registration with official reason.
 */
router.post('/organizations/:id/reject', async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const adminUser = authReq.user!;
    const orgId = req.params.id;

    const parseResult = adminActionReasonSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'A rejection reason is required',
      });
      return;
    }

    const { reason } = parseResult.data;

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found' });
      return;
    }

    const updatedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: {
        status: OrganizationStatus.REJECTED,
        rejectionReason: reason,
      },
    });

    // Audit Log
    await createAuditLog({
      userId: adminUser.id,
      organizationId: org.id,
      category: ActivityCategory.SYSTEM,
      severity: ActivitySeverity.WARNING,
      eventText: `Organization "${org.name}" REJECTED by Super Admin ${adminUser.email}. Reason: ${reason}`,
      metadata: {
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        rejectionReason: reason,
        reviewedAt: new Date().toISOString(),
      },
    });

    if (org.userId) {
      try {
        await createNotification({
          recipientUserId: org.userId,
          type: NotificationType.ORGANIZATION_REJECTED,
          title: `⚠️ Registration Update: ${org.name}`,
          message: `Your organization registration was rejected. Reason: ${reason}`,
          relatedEntityId: org.id,
          relatedEntityType: 'ORGANIZATION',
        });
      } catch (nErr) {
        console.warn('Non-fatal error creating org rejection notification:', nErr);
      }
    }

    res.status(200).json({
      success: true,
      message: `Organization "${org.name}" has been rejected.`,
      organization: updatedOrg,
    });
  } catch (error) {
    console.error('Error rejecting organization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject organization',
    });
  }
});

/**
 * POST /api/admin/organizations/:id/suspend
 * Temporarily suspends an organization.
 */
router.post('/organizations/:id/suspend', async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const adminUser = authReq.user!;
    const orgId = req.params.id;

    const parseResult = adminActionReasonSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'A suspension reason is required',
      });
      return;
    }

    const { reason } = parseResult.data;

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found' });
      return;
    }

    const updatedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: {
        status: OrganizationStatus.SUSPENDED,
        banReason: reason,
      },
    });

    // Audit Log
    await createAuditLog({
      userId: adminUser.id,
      organizationId: org.id,
      category: ActivityCategory.SYSTEM,
      severity: ActivitySeverity.WARNING,
      eventText: `Organization "${org.name}" SUSPENDED by Super Admin ${adminUser.email}. Reason: ${reason}`,
      metadata: {
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        suspensionReason: reason,
        suspendedAt: new Date().toISOString(),
      },
    });

    if (org.userId) {
      try {
        await createNotification({
          recipientUserId: org.userId,
          type: NotificationType.ORGANIZATION_SUSPENDED,
          title: `⚠️ Organization Suspended: ${org.name}`,
          message: `Organization "${org.name}" has been suspended. Reason: ${reason}`,
          relatedEntityId: org.id,
          relatedEntityType: 'ORGANIZATION',
        });
      } catch (nErr) {
        console.warn('Non-fatal error creating org suspension notification:', nErr);
      }
    }

    res.status(200).json({
      success: true,
      message: `Organization "${org.name}" has been suspended.`,
      organization: updatedOrg,
    });
  } catch (error) {
    console.error('Error suspending organization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend organization',
    });
  }
});

/**
 * POST /api/admin/organizations/:id/ban
 * Permanently bans an organization and its associated administrative credentials.
 */
router.post('/organizations/:id/ban', async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const adminUser = authReq.user!;
    const orgId = req.params.id;

    const parseResult = adminActionReasonSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'A ban reason is required',
      });
      return;
    }

    const { reason } = parseResult.data;

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found' });
      return;
    }

    const updatedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: {
        status: OrganizationStatus.BANNED,
        banReason: reason,
      },
    });

    // If there's an associated user, mark user as BANNED
    if (org.userId) {
      await prisma.user.update({
        where: { id: org.userId },
        data: {
          status: AccountStatus.BANNED,
          banReason: reason,
        },
      });
    }

    // Audit Log
    await createAuditLog({
      userId: adminUser.id,
      organizationId: org.id,
      category: ActivityCategory.SYSTEM,
      severity: ActivitySeverity.CRITICAL,
      eventText: `Organization "${org.name}" PERMANENTLY BANNED by Super Admin ${adminUser.email}. Reason: ${reason}`,
      metadata: {
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        banReason: reason,
        bannedAt: new Date().toISOString(),
      },
    });

    res.status(200).json({
      success: true,
      message: `Organization "${org.name}" has been permanently banned.`,
      organization: updatedOrg,
    });
  } catch (error) {
    console.error('Error banning organization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to ban organization',
    });
  }
});

/**
 * GET /api/admin/inventory
 * Super Admin view of all organizations' inventories and network totals.
 */
router.get('/inventory', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const organizations = await prisma.organization.findMany({
      orderBy: { name: 'asc' },
      include: {
        inventories: true,
      },
    });

    const networkTotals: Record<string, number> = {};
    ALL_BLOOD_GROUP_STRINGS.forEach((bg) => {
      networkTotals[bg] = 0;
    });

    const orgList = organizations.map((org) => {
      const inventoryMap: Record<string, number> = {};
      ALL_BLOOD_GROUP_STRINGS.forEach((bg) => {
        inventoryMap[bg] = 0;
      });

      let orgTotalBags = 0;
      org.inventories.forEach((inv) => {
        const bgLabel = formatBloodGroup(inv.bloodGroup);
        const qty = Math.max(0, inv.quantity);
        inventoryMap[bgLabel] = qty;
        orgTotalBags += qty;

        if (org.status === OrganizationStatus.APPROVED) {
          networkTotals[bgLabel] = (networkTotals[bgLabel] || 0) + qty;
        }
      });

      return {
        id: org.id,
        name: org.name,
        type: org.type,
        status: org.status,
        city: org.city,
        state: org.state,
        totalBags: orgTotalBags,
        inventory: inventoryMap,
      };
    });

    const totalNetworkBags = Object.values(networkTotals).reduce((sum, q) => sum + q, 0);

    res.json({
      success: true,
      networkTotals,
      totalBags: totalNetworkBags,
      organizations: orgList,
    });
  } catch (error) {
    console.error('Super Admin inventory fetch error:', error);
    res.status(500).json({ success: false, message: 'Internal server error while fetching admin inventory' });
  }
});

/**
 * PATCH /api/admin/inventory/:organizationId/:bloodGroup
 * Super Admin administrative stock adjustment for any organization.
 */
router.patch(
  '/inventory/:organizationId/:bloodGroup',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { organizationId, bloodGroup } = req.params;
      const adminUser = req.user!;

      const bgParamResult = bloodGroupParamSchema.safeParse(bloodGroup);
      if (!bgParamResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid blood group parameter. Supported: A+, A-, B+, B-, AB+, AB-, O+, O-',
          errors: bgParamResult.error.issues,
        });
        return;
      }

      const prismaBloodGroup = parseBloodGroup(bloodGroup)!;
      const bloodGroupLabel = formatBloodGroup(prismaBloodGroup);

      const bodyParseResult = adminUpdateStockSchema.safeParse({
        organizationId,
        ...req.body,
      });

      if (!bodyParseResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid administrative inventory update payload',
          errors: bodyParseResult.error.issues,
        });
        return;
      }

      const { delta, quantity, reason } = bodyParseResult.data;

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!organization) {
        res.status(404).json({ success: false, message: 'Target organization not found' });
        return;
      }

      // Execute atomic transaction
      const result = await prisma.$transaction(async (tx) => {
        let currentRecord = await tx.bloodInventory.findUnique({
          where: {
            organizationId_bloodGroup: {
              organizationId: organization.id,
              bloodGroup: prismaBloodGroup,
            },
          },
        });

        if (!currentRecord) {
          currentRecord = await tx.bloodInventory.create({
            data: {
              organizationId: organization.id,
              bloodGroup: prismaBloodGroup,
              quantity: 0,
            },
          });
        }

        const previousQuantity = currentRecord.quantity;
        let newQuantity: number;
        let effectiveDelta: number;

        if (delta !== undefined) {
          newQuantity = previousQuantity + delta;
          effectiveDelta = delta;
        } else if (quantity !== undefined) {
          newQuantity = quantity;
          effectiveDelta = quantity - previousQuantity;
        } else {
          throw new Error('MISSING_ADJUSTMENT');
        }

        if (newQuantity < 0) {
          const error: any = new Error('Insufficient blood stock');
          error.code = 'INSUFFICIENT_STOCK';
          error.currentQuantity = previousQuantity;
          error.attemptedDelta = effectiveDelta;
          throw error;
        }

        const updatedRecord = await tx.bloodInventory.update({
          where: {
            organizationId_bloodGroup: {
              organizationId: organization.id,
              bloodGroup: prismaBloodGroup,
            },
          },
          data: {
            quantity: newQuantity,
            lastUpdatedById: adminUser.id,
          },
        });

        const stockTransaction = await tx.bloodStockTransaction.create({
          data: {
            organizationId: organization.id,
            bloodGroup: prismaBloodGroup,
            previousQuantity,
            newQuantity,
            delta: effectiveDelta,
            reason: reason || 'ADMIN_MANUAL_ADJUSTMENT',
            performedById: adminUser.id,
          },
        });

        const logText = `Super Admin ${adminUser.email} administratively adjusted ${organization.name}'s ${bloodGroupLabel} blood stock from ${previousQuantity} to ${newQuantity} (${effectiveDelta >= 0 ? '+' : ''}${effectiveDelta} bags). Reason: ${reason || 'ADMIN_MANUAL_ADJUSTMENT'}`;

        await tx.activityLog.create({
          data: {
            userId: adminUser.id,
            organizationId: organization.id,
            category: ActivityCategory.STOCK,
            severity: ActivitySeverity.WARNING,
            eventText: logText,
            metadata: JSON.stringify({
              adminId: adminUser.id,
              adminEmail: adminUser.email,
              bloodGroup: bloodGroupLabel,
              previousQuantity,
              newQuantity,
              delta: effectiveDelta,
              reason: reason || 'ADMIN_MANUAL_ADJUSTMENT',
            }),
          },
        });

        return { updatedRecord, stockTransaction };
      });

      // Calculate fresh inventory map for this organization
      const allOrgInventories = await prisma.bloodInventory.findMany({
        where: { organizationId: organization.id },
      });

      const updatedInventoryMap: Record<string, number> = {};
      ALL_BLOOD_GROUP_STRINGS.forEach((bg) => {
        updatedInventoryMap[bg] = 0;
      });

      let totalOrgBags = 0;
      allOrgInventories.forEach((inv) => {
        const label = formatBloodGroup(inv.bloodGroup);
        const qty = Math.max(0, inv.quantity);
        updatedInventoryMap[label] = qty;
        totalOrgBags += qty;
      });

      // Real-time notification to organization and network
      try {
        emitInventoryUpdated({
          organizationId: organization.id,
          organizationName: organization.name,
          bloodGroup: bloodGroupLabel,
          quantity: result.updatedRecord.quantity,
          delta: result.stockTransaction.delta,
          previousQuantity: result.stockTransaction.previousQuantity,
          newQuantity: result.stockTransaction.newQuantity,
          totalBags: totalOrgBags,
          inventory: updatedInventoryMap,
        });
      } catch (socketErr) {
        console.warn('Non-fatal error broadcasting admin inventory update:', socketErr);
      }

      res.json({
        success: true,
        message: `Administrative stock adjustment complete for ${organization.name} (${bloodGroupLabel}: ${result.updatedRecord.quantity} bags).`,
        organization: {
          id: organization.id,
          name: organization.name,
        },
        bloodGroup: bloodGroupLabel,
        previousQuantity: result.stockTransaction.previousQuantity,
        newQuantity: result.stockTransaction.newQuantity,
        delta: result.stockTransaction.delta,
        inventory: updatedInventoryMap,
        totalBags: totalOrgBags,
        transaction: {
          id: result.stockTransaction.id,
          bloodGroup: bloodGroupLabel,
          delta: result.stockTransaction.delta,
          previousQuantity: result.stockTransaction.previousQuantity,
          newQuantity: result.stockTransaction.newQuantity,
          reason: result.stockTransaction.reason,
          createdAt: result.stockTransaction.createdAt,
        },
      });
    } catch (error: any) {
      if (error.code === 'INSUFFICIENT_STOCK' || error.message === 'Insufficient blood stock') {
        res.status(400).json({
          success: false,
          message: 'Insufficient blood stock',
          details: `Cannot reduce stock below 0. Current stock is ${error.currentQuantity ?? 0} bags.`,
        });
        return;
      }

      console.error('Super Admin inventory update error:', error);
      res.status(500).json({ success: false, message: 'Internal server error during administrative inventory adjustment' });
    }
  }
);

/**
 * GET /api/admin/inventory/transactions
 * Super Admin view of all blood stock transactions with pagination and multi-criteria filters.
 */
router.get('/inventory/transactions', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const queryResult = transactionQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid transaction query parameters',
        errors: queryResult.error.issues,
      });
      return;
    }

    const { page, limit, bloodGroup, organizationId, reason } = queryResult.data;
    const whereClause: any = {};

    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    if (bloodGroup) {
      const parsedBg = parseBloodGroup(bloodGroup);
      if (parsedBg) {
        whereClause.bloodGroup = parsedBg;
      }
    }

    if (reason && reason.trim()) {
      whereClause.reason = { contains: reason.trim(), mode: 'insensitive' };
    }

    const skip = (page - 1) * limit;

    const [total, transactions] = await Promise.all([
      prisma.bloodStockTransaction.count({ where: whereClause }),
      prisma.bloodStockTransaction.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
              city: true,
            },
          },
          performedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
    ]);

    const formattedTransactions = transactions.map((t) => ({
      id: t.id,
      organizationId: t.organizationId,
      organizationName: t.organization.name,
      organizationType: t.organization.type,
      bloodGroup: formatBloodGroup(t.bloodGroup),
      delta: t.delta,
      previousQuantity: t.previousQuantity,
      newQuantity: t.newQuantity,
      reason: t.reason || 'MANUAL_ADJUSTMENT',
      performedBy: t.performedBy
        ? {
            id: t.performedBy.id,
            name: t.performedBy.name,
            email: t.performedBy.email,
            role: t.performedBy.role,
          }
        : null,
      createdAt: t.createdAt,
    }));

    res.json({
      success: true,
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Super admin transactions fetch error:', error);
    res.status(500).json({ success: false, message: 'Internal server error while fetching transactions' });
  }
});

/**
 * =========================================================================
 * PHASE 10: ANALYTICS, REPORTING & AUDIT DASHBOARD ENDPOINTS (SUPER_ADMIN)
 * =========================================================================
 */

/**
 * GET /api/admin/analytics/overview
 * Network-wide high-level metrics
 */
router.get('/analytics/overview', adminAnalyticsLimiter, async (_req: Request, res: Response): Promise<void> => {
  try {
    const overview = await getNetworkOverviewMetrics();
    res.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch network overview analytics' });
  }
});

/**
 * GET /api/admin/analytics/inventory
 * Network-wide inventory metrics with optional filters
 */
router.get('/analytics/inventory', adminAnalyticsLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { bloodGroup, organizationId, from, to } = req.query;

    const fromDate = from ? new Date(from as string) : undefined;
    const toDate = to ? new Date(to as string) : undefined;

    const inventoryData = await getInventoryAnalytics({
      bloodGroup: bloodGroup ? String(bloodGroup) : undefined,
      organizationId: organizationId ? String(organizationId) : undefined,
      from: fromDate && !isNaN(fromDate.getTime()) ? fromDate : undefined,
      to: toDate && !isNaN(toDate.getTime()) ? toDate : undefined,
    });

    res.json({
      success: true,
      data: inventoryData,
    });
  } catch (error) {
    console.error('Error fetching inventory analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory analytics' });
  }
});

/**
 * GET /api/admin/analytics/emergencies
 * Emergency requirements and donor response performance
 */
router.get('/analytics/emergencies', adminAnalyticsLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { from, to } = req.query;

    const fromDate = from ? new Date(from as string) : undefined;
    const toDate = to ? new Date(to as string) : undefined;

    const emergencyData = await getEmergencyAnalytics({
      from: fromDate && !isNaN(fromDate.getTime()) ? fromDate : undefined,
      to: toDate && !isNaN(toDate.getTime()) ? toDate : undefined,
    });

    res.json({
      success: true,
      data: emergencyData,
    });
  } catch (error) {
    console.error('Error fetching emergency analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch emergency analytics' });
  }
});

/**
 * GET /api/admin/analytics/donors
 * Donor metrics, availability, response rates, and safe geographic distribution
 */
router.get('/analytics/donors', adminAnalyticsLimiter, async (_req: Request, res: Response): Promise<void> => {
  try {
    const donorData = await getDonorAnalytics();
    res.json({
      success: true,
      data: donorData,
    });
  } catch (error) {
    console.error('Error fetching donor analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch donor analytics' });
  }
});

/**
 * GET /api/admin/analytics/organizations
 * Facility performance, status breakdown, and regional distribution
 */
router.get('/analytics/organizations', adminAnalyticsLimiter, async (_req: Request, res: Response): Promise<void> => {
  try {
    const orgData = await getOrganizationAnalytics();
    res.json({
      success: true,
      data: orgData,
    });
  } catch (error) {
    console.error('Error fetching organization analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch organization analytics' });
  }
});

/**
 * GET /api/admin/audit-logs
 * Network-wide paginated audit log stream with category/severity/search filtering
 */
router.get('/audit-logs', adminAnalyticsLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, severity, organizationId, userId, search, from, to, page, limit } = req.query;

    const fromDate = from ? new Date(from as string) : undefined;
    const toDate = to ? new Date(to as string) : undefined;

    const parsedPage = page ? parseInt(page as string, 10) : 1;
    const parsedLimit = limit ? parseInt(limit as string, 10) : 25;

    const result = await getAuditLogs({
      category: category ? (category as ActivityCategory) : undefined,
      severity: severity ? (severity as ActivitySeverity) : undefined,
      organizationId: organizationId ? String(organizationId) : undefined,
      userId: userId ? String(userId) : undefined,
      search: search ? String(search) : undefined,
      from: fromDate && !isNaN(fromDate.getTime()) ? fromDate : undefined,
      to: toDate && !isNaN(toDate.getTime()) ? toDate : undefined,
      page: isNaN(parsedPage) ? 1 : parsedPage,
      limit: isNaN(parsedLimit) ? 25 : Math.min(100, Math.max(1, parsedLimit)),
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
});

/**
 * GET /api/admin/reports/summary
 * Generates an end-to-end structured executive summary report
 */
router.get('/reports/summary', adminAnalyticsLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { from, to } = req.query;

    const fromDate = from ? new Date(from as string) : undefined;
    const toDate = to ? new Date(to as string) : undefined;

    const report = await generateSummaryReport({
      from: fromDate && !isNaN(fromDate.getTime()) ? fromDate : undefined,
      to: toDate && !isNaN(toDate.getTime()) ? toDate : undefined,
    });

    res.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Error generating summary report:', error);
    res.status(500).json({ success: false, message: 'Failed to generate summary report' });
  }
});

export default router;

