import { ActivityCategory, ActivitySeverity } from '@prisma/client';
import { prisma } from '../prisma';

export interface CreateAuditLogParams {
  userId?: string | null;
  organizationId?: string | null;
  category?: ActivityCategory;
  severity?: ActivitySeverity;
  eventText: string;
  metadata?: Record<string, any> | string | null;
}

/**
 * Persists an administrative / system event in the ActivityLog table safely with FK verification.
 */
export async function createAuditLog({
  userId,
  organizationId,
  category = ActivityCategory.SYSTEM,
  severity = ActivitySeverity.INFO,
  eventText,
  metadata,
}: CreateAuditLogParams): Promise<void> {
  try {
    let validUserId: string | null = null;
    let validOrgId: string | null = null;

    if (userId && typeof userId === 'string') {
      try {
        const u = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true },
        });
        if (u) validUserId = u.id;
      } catch {
        validUserId = null;
      }
    }

    if (organizationId && typeof organizationId === 'string') {
      try {
        const o = await prisma.organization.findUnique({
          where: { id: organizationId },
          select: { id: true },
        });
        if (o) validOrgId = o.id;
      } catch {
        validOrgId = null;
      }
    }

    const metaObj: Record<string, any> =
      metadata && typeof metadata === 'object'
        ? { ...metadata }
        : typeof metadata === 'string'
        ? { raw: metadata }
        : {};

    if (userId && !validUserId) {
      metaObj.unlinkedUserId = userId;
    }
    if (organizationId && !validOrgId) {
      metaObj.unlinkedOrganizationId = organizationId;
    }

    const metaString = Object.keys(metaObj).length > 0 ? JSON.stringify(metaObj) : null;

    await prisma.activityLog.create({
      data: {
        userId: validUserId,
        organizationId: validOrgId,
        category,
        severity,
        eventText,
        metadata: metaString,
      },
    });
  } catch (err) {
    // Fail-safe fallback without relations
    try {
      const fallbackMeta =
        metadata && typeof metadata === 'object'
          ? JSON.stringify(metadata)
          : typeof metadata === 'string'
          ? metadata
          : null;

      await prisma.activityLog.create({
        data: {
          userId: null,
          organizationId: null,
          category,
          severity,
          eventText,
          metadata: fallbackMeta,
        },
      });
    } catch (fallbackErr) {
      console.warn('Non-fatal: ActivityLog persistence skipped:', fallbackErr);
    }
  }
}
