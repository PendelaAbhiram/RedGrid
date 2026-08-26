import { Request, Response, NextFunction } from 'express';
import { Role, AccountStatus, User, DonorProfile, Organization, OrganizationStatus } from '@prisma/client';
import { verifyAuthToken } from '../utils/jwt';
import { prisma } from '../prisma';
import { inMemoryUsers } from '../store/demoAuthStore';

export interface AuthenticatedUserPayload {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: AccountStatus;
  banReason?: string | null;
  phone?: string | null;
  locationAddress?: string | null;
  locationCity?: string | null;
  donorProfile?: DonorProfile | null;
  managedOrganizations?: Organization[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUserPayload;
}

/**
 * Authentication Middleware: Verifies JWT and current active database status.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. Please provide a valid Bearer token.',
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Authentication token missing.',
    });
    return;
  }

  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please log in again.',
    });
    return;
  }

  try {
    let dbUser: any = null;

    try {
      // Lookup user in PostgreSQL database by primary key
      dbUser = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
          donorProfile: true,
          managedOrganizations: true,
        },
      });
    } catch (dbErr) {
      console.warn('[AUTH] Database error during requireAuth lookup:', dbErr);
    }

    if (!dbUser && payload.email) {
      try {
        dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: payload.email.toLowerCase() },
              { email: { equals: payload.email, mode: 'insensitive' } },
            ],
          },
          include: {
            donorProfile: true,
            managedOrganizations: true,
          },
        });
      } catch {
        // ignore
      }
    }

    if (!dbUser) {
      console.warn(`[AUTH] Authenticated session refers to non-existent User ID: "${payload.userId}". Rejecting request.`);
      res.status(401).json({
        success: false,
        message: 'Your session is no longer valid. Please sign in again.',
        code: 'SESSION_INVALID',
      });
      return;
    }

    // Account Status Guard
    if (dbUser.status === AccountStatus.BANNED) {
      res.status(403).json({
        success: false,
        message: dbUser.banReason
          ? `Your REDGRID account has been banned: ${dbUser.banReason}`
          : 'Your REDGRID account has been banned. Please contact support.',
      });
      return;
    }

    if (dbUser.status === AccountStatus.SUSPENDED) {
      res.status(403).json({
        success: false,
        message: 'Your REDGRID account is temporarily suspended. Please contact support.',
      });
      return;
    }

    if (dbUser.status === AccountStatus.REJECTED) {
      res.status(403).json({
        success: false,
        message: 'Your account registration was rejected.',
      });
      return;
    }

    // Organization Status Guard for Hospital / Blood Bank Portals
    if (dbUser.role === Role.HOSPITAL || dbUser.role === Role.BLOOD_BANK) {
      const org = dbUser.managedOrganizations?.[0];
      if (org) {
        if (org.status === OrganizationStatus.PENDING) {
          res.status(403).json({
            success: false,
            message: 'Your organization registration is currently pending verification by REDGRID Admin.',
          });
          return;
        }
        if (org.status === OrganizationStatus.REJECTED) {
          res.status(403).json({
            success: false,
            message: `Your organization registration was rejected. Reason: ${org.rejectionReason || 'Document verification failed'}`,
          });
          return;
        }
        if (org.status === OrganizationStatus.SUSPENDED || org.status === OrganizationStatus.BANNED) {
          res.status(403).json({
            success: false,
            message: 'This organization account has been suspended by REDGRID Admin.',
          });
          return;
        }
      }
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      status: dbUser.status,
      banReason: dbUser.banReason,
      phone: dbUser.phone,
      locationAddress: dbUser.locationAddress || null,
      locationCity: dbUser.locationCity || null,
      donorProfile: dbUser.donorProfile,
      managedOrganizations: dbUser.managedOrganizations,
    };

    next();
  } catch (error) {
    console.error('requireAuth error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify account state.',
    });
  }
}

/**
 * Role Authorization Middleware: Enforces RBAC permissions.
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.',
      });
      return;
    }

    next();
  };
}
