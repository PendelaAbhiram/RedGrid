import { Router, Response } from 'express';
import {
  Role,
  AccountStatus,
  OrganizationStatus,
  ActivityCategory,
  ActivitySeverity,
  BloodGroup,
} from '@prisma/client';
import { prisma } from '../prisma';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';
import {
  parseBloodGroup,
  formatBloodGroup,
  ALL_BLOOD_GROUPS,
  ALL_BLOOD_GROUP_STRINGS,
  ensureOrganizationInventories,
} from '../utils/bloodGroup';
import {
  bloodGroupParamSchema,
  updateStockSchema,
  transactionQuerySchema,
} from '../validators/inventory';
import { emitInventoryUpdated } from '../socket';

const router = Router();

// All inventory endpoints require authentication
router.use(requireAuth);

/**
 * Helper to determine stock status
 */
function getStatusForQuantity(qty: number): 'Available' | 'Medium' | 'Low' | 'Critical' {
  if (qty > 20) return 'Available';
  if (qty >= 10) return 'Medium';
  if (qty >= 1) return 'Low';
  return 'Critical';
}

/**
 * GET /api/inventory
 * Network-wide read-only stock access for all authenticated users (USER, HOSPITAL, BLOOD_BANK, SUPER_ADMIN).
 * Calculates network totals strictly from organization inventory records.
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Fetch all approved organizations (or all non-banned organizations)
    const organizations = await prisma.organization.findMany({
      where: {
        status: { in: [OrganizationStatus.APPROVED, OrganizationStatus.PENDING] },
      },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        city: true,
        state: true,
        inventories: {
          select: {
            bloodGroup: true,
            quantity: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Compute network aggregates per blood group
    const networkTotals: Record<string, number> = {};
    ALL_BLOOD_GROUP_STRINGS.forEach((bg) => {
      networkTotals[bg] = 0;
    });

    const orgSummaries = organizations.map((org) => {
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

        // Only approved organizations contribute to public network stock totals
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
        inventory: inventoryMap,
        totalBags: orgTotalBags,
      };
    });

    const totalNetworkBags = Object.values(networkTotals).reduce((sum, q) => sum + q, 0);

    res.json({
      success: true,
      networkTotals,
      totalBags: totalNetworkBags,
      organizations: orgSummaries,
    });
  } catch (error) {
    console.error('Failed to fetch inventory:', error);
    res.status(500).json({ success: false, message: 'Internal server error while fetching inventory' });
  }
});

/**
 * GET /api/inventory/summary
 * Network-wide high-level summary with status classifications.
 */
router.get('/summary', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const approvedInventories = await prisma.bloodInventory.findMany({
      where: {
        organization: {
          status: OrganizationStatus.APPROVED,
        },
      },
      select: {
        bloodGroup: true,
        quantity: true,
      },
    });

    const totalsByGroup: Record<string, number> = {};
    ALL_BLOOD_GROUP_STRINGS.forEach((bg) => {
      totalsByGroup[bg] = 0;
    });

    approvedInventories.forEach((inv) => {
      const label = formatBloodGroup(inv.bloodGroup);
      totalsByGroup[label] = (totalsByGroup[label] || 0) + Math.max(0, inv.quantity);
    });

    const totalBags = Object.values(totalsByGroup).reduce((sum, q) => sum + q, 0);

    const groupDetails = ALL_BLOOD_GROUP_STRINGS.map((bg) => {
      const quantity = totalsByGroup[bg] || 0;
      const status = getStatusForQuantity(quantity);
      return {
        bloodGroup: bg,
        quantity,
        status,
      };
    });

    const availableCount = groupDetails.filter((g) => g.quantity > 20).length;
    const mediumCount = groupDetails.filter((g) => g.quantity >= 10 && g.quantity <= 20).length;
    const lowCount = groupDetails.filter((g) => g.quantity >= 1 && g.quantity <= 9).length;
    const criticalCount = groupDetails.filter((g) => g.quantity === 0).length;

    res.json({
      success: true,
      totalBags,
      byGroup: totalsByGroup,
      groups: groupDetails,
      summary: {
        totalBags,
        availableCount,
        mediumCount,
        lowCount,
        criticalCount,
      },
    });
  } catch (error) {
    console.error('Failed to generate inventory summary:', error);
    res.status(500).json({ success: false, message: 'Internal server error while generating summary' });
  }
});

/**
 * GET /api/inventory/my
 * Returns the inventory belonging only to the authenticated organization (HOSPITAL or BLOOD_BANK).
 */
router.get(
  '/my',
  requireRole(Role.HOSPITAL, Role.BLOOD_BANK, Role.SUPER_ADMIN),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;

      const org = await prisma.organization.findFirst({
        where: { userId },
        include: {
          inventories: true,
        },
      });

      if (!org) {
        res.status(404).json({
          success: false,
          message: 'No organization found linked to your authenticated account',
        });
        return;
      }

      // Ensure all 8 blood groups exist
      await ensureOrganizationInventories(org.id);

      const freshInventories = await prisma.bloodInventory.findMany({
        where: { organizationId: org.id },
      });

      const inventoryMap: Record<string, number> = {};
      ALL_BLOOD_GROUP_STRINGS.forEach((bg) => {
        inventoryMap[bg] = 0;
      });

      let totalBags = 0;
      freshInventories.forEach((inv) => {
        const bgLabel = formatBloodGroup(inv.bloodGroup);
        const qty = Math.max(0, inv.quantity);
        inventoryMap[bgLabel] = qty;
        totalBags += qty;
      });

      const groups = ALL_BLOOD_GROUP_STRINGS.map((bg) => ({
        bloodGroup: bg,
        quantity: inventoryMap[bg] || 0,
        status: getStatusForQuantity(inventoryMap[bg] || 0),
      }));

      res.json({
        success: true,
        organization: {
          id: org.id,
          name: org.name,
          type: org.type,
          status: org.status,
        },
        inventory: inventoryMap,
        groups,
        totalBags,
      });
    } catch (error) {
      console.error('Failed to fetch my inventory:', error);
      res.status(500).json({ success: false, message: 'Internal server error while fetching organization inventory' });
    }
  }
);

/**
 * PATCH /api/inventory/:bloodGroup
 * Updates stock for the authenticated organization.
 * Enforces atomicity, creates BloodStockTransaction and ActivityLog.
 * Rejects negative inventory (400 "Insufficient blood stock").
 */
router.patch(
  '/:bloodGroup',
  requireRole(Role.HOSPITAL, Role.BLOOD_BANK, Role.SUPER_ADMIN),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const bgParamResult = bloodGroupParamSchema.safeParse(req.params.bloodGroup);
      if (!bgParamResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid blood group parameter. Supported: A+, A-, B+, B-, AB+, AB-, O+, O-',
          errors: bgParamResult.error.issues,
        });
        return;
      }

      const prismaBloodGroup = parseBloodGroup(req.params.bloodGroup)!;
      const bloodGroupLabel = formatBloodGroup(prismaBloodGroup);

      const bodyParseResult = updateStockSchema.safeParse(req.body);
      if (!bodyParseResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid inventory adjustment payload',
          errors: bodyParseResult.error.issues,
        });
        return;
      }

      const { delta, quantity, reason } = bodyParseResult.data;
      const user = req.user!;

      // Check user account status
      if (user.status === AccountStatus.SUSPENDED || user.status === AccountStatus.BANNED) {
        res.status(403).json({
          success: false,
          message: 'Your account is suspended or banned. Inventory operations are restricted.',
        });
        return;
      }

      // Find user's managed organization
      const organization = await prisma.organization.findFirst({
        where: { userId: user.id },
      });

      if (!organization) {
        res.status(404).json({
          success: false,
          message: 'No organization found associated with your credentials',
        });
        return;
      }

      // Check organization status
      if (
        organization.status === OrganizationStatus.BANNED ||
        organization.status === OrganizationStatus.SUSPENDED ||
        organization.status === OrganizationStatus.REJECTED
      ) {
        res.status(403).json({
          success: false,
          message: `Organization is ${organization.status}. Inventory updates are strictly forbidden.`,
        });
        return;
      }

      // Execute atomic transaction
      const result = await prisma.$transaction(
        async (tx) => {
          // Ensure inventory record exists
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

          // Enforce CHECK constraint: quantity >= 0
          if (newQuantity < 0) {
            const error: any = new Error('Insufficient blood stock');
            error.code = 'INSUFFICIENT_STOCK';
            error.currentQuantity = previousQuantity;
            error.attemptedDelta = effectiveDelta;
            throw error;
          }

          // Update inventory record
          const updatedRecord = await tx.bloodInventory.update({
            where: {
              organizationId_bloodGroup: {
                organizationId: organization.id,
                bloodGroup: prismaBloodGroup,
              },
            },
            data: {
              quantity: newQuantity,
              lastUpdatedById: user.id,
            },
          });

          // Create transaction history record
          const stockTransaction = await tx.bloodStockTransaction.create({
            data: {
              organizationId: organization.id,
              bloodGroup: prismaBloodGroup,
              previousQuantity,
              newQuantity,
              delta: effectiveDelta,
              reason: reason || 'MANUAL_ADJUSTMENT',
              performedById: user.id,
            },
          });

          // Create ActivityLog entry
          const actionVerb = effectiveDelta >= 0 ? 'increased' : 'decreased';
          const logText = `${organization.name} ${actionVerb} ${bloodGroupLabel} blood stock by ${Math.abs(effectiveDelta)} bag(s). Previous: ${previousQuantity}, New: ${newQuantity}. (Reason: ${reason || 'MANUAL_ADJUSTMENT'})`;

          await tx.activityLog.create({
            data: {
              userId: user.id,
              organizationId: organization.id,
              category: ActivityCategory.STOCK,
              severity: effectiveDelta >= 0 ? ActivitySeverity.INFO : ActivitySeverity.WARNING,
              eventText: logText,
              metadata: JSON.stringify({
                bloodGroup: bloodGroupLabel,
                previousQuantity,
                newQuantity,
                delta: effectiveDelta,
                reason: reason || 'MANUAL_ADJUSTMENT',
              }),
            },
          });

          return { updatedRecord, stockTransaction };
        },
        {
          maxWait: 10000,
          timeout: 20000,
        }
      );

      // Return updated inventory for organization
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
        console.warn('Non-fatal error broadcasting inventory update:', socketErr);
      }

      res.json({
        success: true,
        message: `Blood stock for ${bloodGroupLabel} successfully updated to ${result.updatedRecord.quantity} bags.`,
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
          details: `Cannot reduce blood stock below 0. Current available stock is ${error.currentQuantity ?? 0} bags.`,
        });
        return;
      }

      console.error('Inventory modification transaction error:', error);
      res.status(500).json({ success: false, message: 'Failed to update inventory due to a server error' });
    }
  }
);

/**
 * GET /api/inventory/transactions
 * Returns stock transaction history.
 * HOSPITAL & BLOOD_BANK: Only own organization transactions.
 * SUPER_ADMIN: Can view across all organizations.
 * USER: Forbidden (403).
 */
router.get('/transactions', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    // Regular users cannot view private stock transaction audit logs
    if (user.role === Role.USER) {
      res.status(403).json({
        success: false,
        message: 'Access denied: Stock transaction history is restricted to organizations and administrators',
      });
      return;
    }

    const queryResult = transactionQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid transaction query parameters',
        errors: queryResult.error.issues,
      });
      return;
    }

    const { page, limit, bloodGroup, organizationId } = queryResult.data;
    const whereClause: any = {};

    if (user.role === Role.HOSPITAL || user.role === Role.BLOOD_BANK) {
      const org = await prisma.organization.findFirst({
        where: { userId: user.id },
      });

      if (!org) {
        res.status(404).json({
          success: false,
          message: 'Organization not found for your account',
        });
        return;
      }

      whereClause.organizationId = org.id;
    } else if (user.role === Role.SUPER_ADMIN) {
      if (organizationId) {
        whereClause.organizationId = organizationId;
      }
    }

    if (bloodGroup) {
      const parsedBg = parseBloodGroup(bloodGroup);
      if (parsedBg) {
        whereClause.bloodGroup = parsedBg;
      }
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
    console.error('Failed to fetch transactions:', error);
    res.status(500).json({ success: false, message: 'Internal server error while fetching transactions' });
  }
});

export default router;
