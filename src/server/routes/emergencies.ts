import { Router, Response } from 'express';
import {
  Role,
  EmergencyStatus,
  ResponseStatus,
  ActivityCategory,
  ActivitySeverity,
  UrgencyLevel,
  EmergencyCategory,
  BloodGroup,
  NotificationType,
} from '@prisma/client';
import { prisma } from '../prisma';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import {
  parseBloodGroup,
  formatBloodGroup,
} from '../utils/bloodGroup';
import {
  parseUrgencyLevel,
  formatUrgencyLevel,
  parseEmergencyCategory,
  formatEmergencyCategory,
  parseResponseStatus,
  formatResponseStatus,
  createEmergencySchema,
  updateEmergencySchema,
  respondEmergencySchema,
  emergencyQuerySchema,
} from '../validators/emergency';
import { createAuditLog } from '../utils/audit';
import {
  findPotentialDonorMatches,
  checkDonorMatchStatus,
} from '../services/donorMatching';
import {
  createNotification,
  createBulkNotifications,
} from '../services/notificationService';
import {
  emitEmergencyCreated,
  emitEmergencyDonorResponse,
  emitEmergencyUpdated,
} from '../socket';
import { emergencyCreationLimiter, donorResponseLimiter } from '../middleware/rateLimit';

const router = Router();

// All emergency endpoints require authentication
router.use(requireAuth);

/**
 * Calculates human-readable relative time string.
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 45) return 'Just now';
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

/**
 * Formats a raw EmergencyAlert database record into standard frontend object.
 */
function formatEmergencyAlert(alert: any, currentUserId?: string) {
  const bloodTypeStr = formatBloodGroup(alert.bloodType);
  const urgencyStr = formatUrgencyLevel(alert.urgency);
  const categoryStr = formatEmergencyCategory(alert.category);

  // Count active volunteer responses (accepted / arrived / completed)
  const activeResponses = (alert.responses || []).filter(
    (r: any) => r.status === ResponseStatus.ACCEPTED || r.status === ResponseStatus.ARRIVED || r.status === ResponseStatus.COMPLETED
  );
  const respondingDonorsCount = activeResponses.length;

  // Determine current caller's response status
  let userResponseStatus: 'none' | 'accepted' | 'declined' = 'none';
  if (currentUserId && alert.responses) {
    const userResp = alert.responses.find((r: any) => r.donorUserId === currentUserId);
    if (userResp) {
      if (userResp.status === ResponseStatus.DECLINED) {
        userResponseStatus = 'declined';
      } else if (
        userResp.status === ResponseStatus.ACCEPTED ||
        userResp.status === ResponseStatus.ARRIVED ||
        userResp.status === ResponseStatus.COMPLETED
      ) {
        userResponseStatus = 'accepted';
      }
    }
  }

  return {
    id: alert.id,
    bloodType: bloodTypeStr,
    bloodGroup: bloodTypeStr,
    urgency: urgencyStr,
    category: categoryStr,
    timeAgo: formatTimeAgo(alert.createdAt),
    timestamp: alert.createdAt.getTime(),
    distance: '0.9 km',
    hospitalName: alert.hospitalName,
    department: alert.department || 'Emergency / Trauma Bay',
    address: alert.address || alert.organization?.address || 'Regional Medical Center',
    description: alert.description,
    bagsNeeded: alert.bagsNeeded,
    bagsRequired: alert.bagsNeeded,
    bagsFulfilled: alert.bagsFulfilled || 0,
    patientInitials: alert.patientInitials || 'P. M.',
    patientAge: alert.patientAge ?? 42,
    contactPhone: alert.contactPhone || alert.organization?.phone || '+1 (800) 555-0122',
    criticalNote: alert.criticalNote || (alert.urgency === UrgencyLevel.CODE_RED ? 'Active emergency trauma OR awaiting units' : 'High priority replenishment'),
    status: alert.status,
    organizationId: alert.organizationId,
    createdById: alert.createdById,
    createdAt: alert.createdAt.toISOString(),
    updatedAt: alert.updatedAt.toISOString(),
    respondingDonorsCount,
    userResponseStatus,
  };
}

/**
 * Helper to resolve the authenticated organization for Hospital / Blood Bank users.
 */
async function resolveUserOrganization(user: any): Promise<any | null> {
  if (user.managedOrganizations && user.managedOrganizations.length > 0) {
    return user.managedOrganizations[0];
  }
  // Lookup by manager user ID
  const org = await prisma.organization.findFirst({
    where: { userId: user.id },
  });
  return org;
}

/**
 * POST /api/emergencies
 * Creates a new official emergency requirement.
 * Accessible to verified hospitals, blood banks, super admins, and citizen emergency SOS requests.
 * Organization ID is derived from the authenticated session for institutions.
 */
router.post('/', emergencyCreationLimiter, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;

  if (user.role === Role.USER) {
    res.status(403).json({
      success: false,
      message: 'Citizen / Donor users cannot broadcast official emergency requirements.',
    });
    return;
  }

  // 1. Validate Request Body
  const parsed = createEmergencySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: 'Validation failed for emergency requirement.',
      errors: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
    return;
  }

  const {
    bloodGroup: rawBloodGroup,
    bloodType: rawBloodType,
    bagsNeeded: rawBagsNeeded,
    bagsRequired: rawBagsRequired,
    urgency: rawUrgency,
    category: rawCategory,
    hospitalName: inputHospitalName,
    department,
    address: inputAddress,
    description,
    patientInitials,
    patientAge,
    contactPhone: inputContactPhone,
    criticalNote,
    organizationId: inputOrgId,
  } = parsed.data;

  // Resolve Blood Group Enum
  const targetBgStr = (rawBloodGroup || rawBloodType || '').trim();
  const bloodGroup = parseBloodGroup(targetBgStr);
  if (!bloodGroup) {
    res.status(400).json({
      success: false,
      message: `Invalid blood group "${targetBgStr}". Expected one of: A+, A-, B+, B-, AB+, AB-, O+, O-.`,
    });
    return;
  }

  // Resolve Urgency Level Enum
  const urgency = parseUrgencyLevel(rawUrgency);
  if (!urgency) {
    res.status(400).json({
      success: false,
      message: `Invalid urgency level "${rawUrgency}". Expected: "Code Red: Urgent", "High", or "Moderate".`,
    });
    return;
  }

  // Resolve Category Enum
  const category = parseEmergencyCategory(rawCategory || 'Trauma') || EmergencyCategory.TRAUMA;

  // Resolve Bags Needed
  const bagsNeeded = rawBagsNeeded || rawBagsRequired || 1;

  try {
    // 1. Verify and resolve authenticated Prisma User record by primary key
    const creatorUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        managedOrganizations: true,
      },
    });

    if (!creatorUser) {
      console.warn(`[EMERGENCY] Creator User record "${user.id}" not found in database.`);
      res.status(401).json({
        success: false,
        message: 'Your session is no longer valid. Please sign in again.',
        code: 'SESSION_INVALID',
      });
      return;
    }

    let targetOrgId: string | null = null;
    let facilityName = inputHospitalName || 'Metro Emergency Trauma Bay';
    let facilityAddress = inputAddress || '600 Health Science Blvd, Sector 2';
    let contactPhone = inputContactPhone || creatorUser.phone || '+1 (800) 555-0122';

    if (creatorUser.role === Role.HOSPITAL || creatorUser.role === Role.BLOOD_BANK) {
      const org = await resolveUserOrganization(creatorUser);
      if (org) {
        targetOrgId = org.id; // STRICTLY LOCKED TO DATABASE RECORD
        facilityName = org.name; // LOCKED: derived strictly from database record
        facilityAddress = org.address ? `${org.address}${org.city ? `, ${org.city}` : ''}` : (inputAddress || facilityAddress);
        contactPhone = org.phone || creatorUser.phone || inputContactPhone || contactPhone;
      } else {
        facilityName = creatorUser.name || inputHospitalName || 'Registered Medical Facility';
        contactPhone = creatorUser.phone || inputContactPhone || contactPhone;
      }
    } else if (creatorUser.role === Role.SUPER_ADMIN) {
      // Super Admin may optionally specify an organizationId or use Central Command
      if (inputOrgId) {
        const org = await prisma.organization.findUnique({ where: { id: inputOrgId } });
        if (org) {
          targetOrgId = org.id;
          facilityName = org.name;
          facilityAddress = org.address ? `${org.address}${org.city ? `, ${org.city}` : ''}` : facilityAddress;
          contactPhone = org.phone || inputContactPhone || creatorUser.phone || contactPhone;
        } else {
          facilityName = inputHospitalName || 'REDGRID Central Command';
        }
      } else {
        facilityName = inputHospitalName || 'REDGRID Central Command';
      }
    } else {
      // Role.USER (Citizen / Patient Emergency SOS Request)
      targetOrgId = null;
      facilityName = inputHospitalName || 'Citizen Emergency SOS Request';
      facilityAddress = inputAddress || creatorUser.locationAddress || '600 Health Science Blvd, Sector 2';
      contactPhone = inputContactPhone || creatorUser.phone || '+1 (800) 555-0122';
    }

    // Persist Emergency Alert in PostgreSQL with validated foreign key
    const createdAlert = await prisma.emergencyAlert.create({
      data: {
        createdById: creatorUser.id,
        organizationId: targetOrgId,
        bloodType: bloodGroup,
        urgency,
        category,
        hospitalName: facilityName,
        department: department || 'Critical Care / Trauma Bay',
        address: facilityAddress,
        description: description.trim(),
        bagsNeeded,
        bagsFulfilled: 0,
        patientInitials: patientInitials || 'P. M.',
        patientAge: patientAge ?? 42,
        contactPhone,
        criticalNote: criticalNote || (urgency === UrgencyLevel.CODE_RED ? 'Active emergency OR awaiting units' : null),
        status: EmergencyStatus.ACTIVE,
      },
      include: {
        organization: true,
        responses: {
          include: {
            donorUser: {
              select: { id: true, name: true, donorProfile: true },
            },
          },
        },
      },
    });

    // Record Activity Log
    await createAuditLog({
      userId: user.id,
      organizationId: targetOrgId,
      category: ActivityCategory.EMERGENCY,
      severity: urgency === UrgencyLevel.CODE_RED ? ActivitySeverity.CRITICAL : ActivitySeverity.INFO,
      eventText: `Emergency requirement broadcasted for ${bagsNeeded} bag(s) of ${formatBloodGroup(bloodGroup)} at ${facilityName}`,
      metadata: {
        alertId: createdAlert.id,
        bloodGroup: formatBloodGroup(bloodGroup),
        urgency: formatUrgencyLevel(urgency),
        category: formatEmergencyCategory(category),
        bagsNeeded,
        organizationId: targetOrgId,
      },
    });

    const formatted = formatEmergencyAlert(createdAlert, user.id);

    // Calculate potential matching donors and emit targeted real-time alert via Socket.IO
    try {
      const matchSummary = await findPotentialDonorMatches(createdAlert.id);
      const matchingUserIds = matchSummary && Array.isArray(matchSummary.matches)
        ? matchSummary.matches.map((m) => m.donorId)
        : [];
      emitEmergencyCreated(formatted, matchingUserIds);

      // Create persistent PostgreSQL notifications for matching donors
      if (matchingUserIds.length > 0) {
        try {
          await createBulkNotifications(
            matchingUserIds.map((donorUserId) => ({
              recipientUserId: donorUserId,
              type: NotificationType.EMERGENCY_ALERT,
              title: `🚨 Emergency Alert: ${formatBloodGroup(bloodGroup)} Needed`,
              message: `Urgent requirement for ${bagsNeeded} bag(s) at ${facilityName}. Check distance & respond now!`,
              relatedEntityId: createdAlert.id,
              relatedEntityType: 'EMERGENCY',
            }))
          );
        } catch (nErr) {
          console.warn('Non-fatal error creating bulk emergency notifications:', nErr);
        }
      }
    } catch (socketErr) {
      console.warn('Non-fatal error broadcasting real-time emergency created event:', socketErr);
    }

    res.status(201).json({
      success: true,
      message: 'Emergency requirement broadcasted successfully.',
      emergency: formatted,
      alert: formatted,
    });
  } catch (error) {
    console.error('Error creating emergency alert:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while broadcasting emergency alert.',
    });
  }
});

/**
 * GET /api/emergencies
 * Lists active or filtered emergency requirements.
 * USER/DONOR: Can view active alerts, see matching info and their own response state.
 * HOSPITAL/BLOOD_BANK: Can view active emergencies or filter to their own.
 * SUPER_ADMIN: Can view all emergencies (including past/fulfilled/cancelled).
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const query = emergencyQuerySchema.safeParse(req.query);

  const statusParam = query.success ? query.data.status?.toUpperCase() : 'ACTIVE';
  const bloodGroupParam = query.success ? (query.data.bloodGroup || query.data.bloodType) : undefined;
  const urgencyParam = query.success ? query.data.urgency : undefined;
  const myParam = query.success ? (query.data.my === 'true' || query.data.my === '1') : false;
  const matchedParam = query.success ? (query.data.matched === 'true' || query.data.matched === '1') : false;

  try {
    const where: any = {};

    // 1. Status Filter
    if (statusParam === 'ALL') {
      // Super Admin or Hospital can view all if explicitly requested
      if (user.role !== Role.SUPER_ADMIN && user.role !== Role.HOSPITAL && user.role !== Role.BLOOD_BANK) {
        where.status = EmergencyStatus.ACTIVE;
      }
    } else if (statusParam === 'FULFILLED') {
      where.status = EmergencyStatus.FULFILLED;
    } else if (statusParam === 'CANCELLED') {
      where.status = EmergencyStatus.CANCELLED;
    } else {
      // Default to ACTIVE
      where.status = EmergencyStatus.ACTIVE;
    }

    // 2. Organization Scoping
    if (myParam && (user.role === Role.HOSPITAL || user.role === Role.BLOOD_BANK)) {
      const org = await resolveUserOrganization(user);
      if (org) {
        where.organizationId = org.id;
      } else {
        where.createdById = user.id;
      }
    }

    // 3. Blood Group Filter
    if (bloodGroupParam) {
      const parsedBg = parseBloodGroup(bloodGroupParam);
      if (parsedBg) {
        where.bloodType = parsedBg;
      }
    } else if (matchedParam && user.donorProfile?.bloodGroup) {
      where.bloodType = user.donorProfile.bloodGroup;
    }

    // 4. Urgency Filter
    if (urgencyParam) {
      const parsedUrgency = parseUrgencyLevel(urgencyParam);
      if (parsedUrgency) {
        where.urgency = parsedUrgency;
      }
    }

    const alerts = await prisma.emergencyAlert.findMany({
      where,
      include: {
        organization: true,
        responses: {
          include: {
            donorUser: {
              select: {
                id: true,
                name: true,
                donorProfile: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = alerts.map((a) => formatEmergencyAlert(a, user.id));

    res.json({
      success: true,
      count: formatted.length,
      emergencies: formatted,
      alerts: formatted,
    });
  } catch (error) {
    console.error('Error fetching emergency alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve emergency alerts.',
    });
  }
});

/**
 * GET /api/emergencies/:id
 * Retrieves details for a specific emergency requirement.
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;

  try {
    const alert = await prisma.emergencyAlert.findUnique({
      where: { id },
      include: {
        organization: true,
        responses: {
          include: {
            donorUser: {
              select: {
                id: true,
                name: true,
                donorProfile: true,
              },
            },
          },
        },
      },
    });

    if (!alert) {
      res.status(404).json({
        success: false,
        message: `Emergency alert with ID "${id}" not found.`,
      });
      return;
    }

    const formatted = formatEmergencyAlert(alert, user.id);

    res.json({
      success: true,
      emergency: formatted,
      alert: formatted,
    });
  } catch (error) {
    console.error('Error retrieving emergency alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve emergency details.',
    });
  }
});

/**
 * POST /api/emergencies/:id/respond
 * Submits or updates a donor's response to an emergency alert.
 * Supports "GOING" / "ACCEPTED" and "NOT_AVAILABLE" / "DECLINED".
 * Enforces duplicate response protection via database upsert.
 * Checks donor availability status.
 */
router.post('/:id/respond', donorResponseLimiter, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;

  // 1. Validate Body
  const parsed = respondEmergencySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: 'Invalid response payload. "status" is required (e.g. GOING or NOT_AVAILABLE).',
      errors: parsed.error.issues.map((i) => i.message),
    });
    return;
  }

  const { status: rawStatus, etaMinutes } = parsed.data;
  const parsedStatus = parseResponseStatus(rawStatus);
  if (!parsedStatus) {
    res.status(400).json({
      success: false,
      message: `Invalid response status "${rawStatus}". Expected "GOING", "ACCEPTED", "NOT_AVAILABLE", or "DECLINED".`,
    });
    return;
  }

  try {
    // 2. Find Target Alert
    const alert = await prisma.emergencyAlert.findUnique({
      where: { id },
      include: { organization: true },
    });

    if (!alert) {
      res.status(404).json({
        success: false,
        message: `Emergency alert with ID "${id}" not found.`,
      });
      return;
    }

    if (alert.status !== EmergencyStatus.ACTIVE) {
      res.status(400).json({
        success: false,
        message: `Cannot respond to this emergency because its status is ${alert.status}.`,
      });
      return;
    }

    // 3. Check Donor Eligibility / Availability
    if (parsedStatus === ResponseStatus.ACCEPTED) {
      // Check if donor is explicitly marked unavailable in donor profile
      if (user.donorProfile && user.donorProfile.isAvailableToDonate === false) {
        res.status(400).json({
          success: false,
          message: 'Donor is currently marked as unavailable for donation. Please update your availability in your profile.',
        });
        return;
      }
    }

    // 4. Duplicate Response Protection: Upsert record
    const existingResponse = await prisma.emergencyDonorResponse.findUnique({
      where: {
        alertId_donorUserId: {
          alertId: id,
          donorUserId: user.id,
        },
      },
    });

    const isUpdate = !!existingResponse;
    const responseRecord = await prisma.emergencyDonorResponse.upsert({
      where: {
        alertId_donorUserId: {
          alertId: id,
          donorUserId: user.id,
        },
      },
      update: {
        status: parsedStatus,
        etaMinutes: etaMinutes || (parsedStatus === ResponseStatus.ACCEPTED ? 15 : null),
        respondedAt: new Date(),
      },
      create: {
        alertId: id,
        donorUserId: user.id,
        status: parsedStatus,
        etaMinutes: etaMinutes || (parsedStatus === ResponseStatus.ACCEPTED ? 15 : null),
        respondedAt: new Date(),
      },
    });

    // 5. Audit Logging
    await createAuditLog({
      userId: user.id,
      organizationId: alert.organizationId,
      category: ActivityCategory.DONOR,
      severity: ActivitySeverity.INFO,
      eventText: `Donor ${user.name} ${isUpdate ? 'updated response to' : 'responded'}: ${formatResponseStatus(parsedStatus)} for ${alert.hospitalName} (${formatBloodGroup(alert.bloodType)})`,
      metadata: {
        alertId: alert.id,
        donorUserId: user.id,
        status: parsedStatus,
        isUpdate,
      },
    });

    // Real-Time Socket.IO emission to hospital and subscribers
    try {
      const bloodGroupStr = user.donorProfile?.bloodGroup
        ? formatBloodGroup(user.donorProfile.bloodGroup)
        : formatBloodGroup(alert.bloodType);

      const socketResponsePayload = {
        id: responseRecord.id,
        emergencyId: alert.id,
        donorUserId: user.id,
        donorName: user.name,
        bloodGroup: bloodGroupStr,
        status: formatResponseStatus(responseRecord.status),
        rawStatus: responseRecord.status,
        distance: '0.8 km away',
        eta: responseRecord.etaMinutes ? `${responseRecord.etaMinutes} mins` : '15 mins',
        etaMinutes: responseRecord.etaMinutes || 15,
        phone: user.phone || user.donorProfile?.emergencyContactPhone || '+1 (555) 234-8901',
        targetAlert: alert.description || `${alert.hospitalName} Emergency`,
        respondedAt: responseRecord.respondedAt.toISOString(),
        time: 'Just now',
      };

      emitEmergencyDonorResponse(alert, socketResponsePayload);

      // Recalculate active donor count and broadcast update
      const activeResponsesCount = await prisma.emergencyDonorResponse.count({
        where: {
          alertId: alert.id,
          status: { in: [ResponseStatus.ACCEPTED, ResponseStatus.ARRIVED, ResponseStatus.COMPLETED] },
        },
      });

      emitEmergencyUpdated({
        id: alert.id,
        status: alert.status,
        bagsNeeded: alert.bagsNeeded,
        bagsFulfilled: alert.bagsFulfilled,
        respondingDonorsCount: activeResponsesCount,
        urgency: formatUrgencyLevel(alert.urgency),
        category: formatEmergencyCategory(alert.category),
        hospitalName: alert.hospitalName,
      }, alert.organizationId);

      // Create persistent PostgreSQL in-app notification for hospital / alert creator
      const recipientId = alert.organization?.userId || alert.createdById;
      if (recipientId && recipientId !== user.id) {
        const donorName = user.name || 'Anonymous Donor';
        const bloodGroupStr = user.donorProfile?.bloodGroup
          ? formatBloodGroup(user.donorProfile.bloodGroup)
          : formatBloodGroup(alert.bloodType);
        const isAccepted = parsedStatus === ResponseStatus.ACCEPTED;

        try {
          await createNotification({
            recipientUserId: recipientId,
            type: NotificationType.DONOR_RESPONSE,
            title: isAccepted ? `💉 Donor Responded: ${donorName}` : `Donor Unavailable: ${donorName}`,
            message: isAccepted
              ? `${donorName} (${bloodGroupStr}) accepted your alert at ${alert.hospitalName} (ETA ~${responseRecord.etaMinutes || 15}m).`
              : `${donorName} was unable to respond to the alert at ${alert.hospitalName}.`,
            relatedEntityId: alert.id,
            relatedEntityType: 'EMERGENCY',
          });
        } catch (nErr) {
          console.warn('Non-fatal error creating donor response notification:', nErr);
        }
      }
    } catch (socketErr) {
      console.warn('Non-fatal error broadcasting real-time donor response:', socketErr);
    }

    res.json({
      success: true,
      message: parsedStatus === ResponseStatus.ACCEPTED
        ? 'Thank you! Hospital notified that you are en route.'
        : 'Response recorded. Marked as unavailable for this request.',
      response: {
        id: responseRecord.id,
        alertId: responseRecord.alertId,
        donorUserId: responseRecord.donorUserId,
        status: formatResponseStatus(responseRecord.status),
        rawStatus: responseRecord.status,
        etaMinutes: responseRecord.etaMinutes,
        respondedAt: responseRecord.respondedAt.toISOString(),
      },
      userResponseStatus: parsedStatus === ResponseStatus.ACCEPTED ? 'accepted' : 'declined',
    });
  } catch (error) {
    console.error('Error recording donor response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit donor response.',
    });
  }
});

/**
 * GET /api/emergencies/:id/responses
 * Retrieves the donor response list for a given emergency alert.
 * Security: Only accessible by the organization that owns the emergency or SUPER_ADMIN.
 * Prevents cross-organization data leakage and donor privacy exposure.
 */
router.get('/:id/responses', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;

  // 1. Role Check: Normal users cannot view responses
  if (user.role === Role.USER) {
    res.status(403).json({
      success: false,
      message: 'You do not have permission to view emergency donor responses.',
    });
    return;
  }

  try {
    const alert = await prisma.emergencyAlert.findUnique({
      where: { id },
      include: { organization: true },
    });

    if (!alert) {
      res.status(404).json({
        success: false,
        message: `Emergency alert with ID "${id}" not found.`,
      });
      return;
    }

    // 2. Ownership Check: Hospital/Blood Bank can only view responses to their OWN emergencies
    if (user.role !== Role.SUPER_ADMIN) {
      const userOrg = await resolveUserOrganization(user);
      const isOwnerOrg = userOrg && alert.organizationId === userOrg.id;
      const isCreator = alert.createdById === user.id;

      if (!isOwnerOrg && !isCreator) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to view responses for another organization\'s emergency.',
        });
        return;
      }
    }

    // 3. Fetch Responses with Safe Donor Information
    const responses = await prisma.emergencyDonorResponse.findMany({
      where: { alertId: id },
      include: {
        donorUser: {
          select: {
            id: true,
            name: true,
            phone: true,
            donorProfile: true,
          },
        },
      },
      orderBy: { respondedAt: 'desc' },
    });

    const formattedResponses = responses.map((r) => {
      const bloodGroupStr = r.donorUser.donorProfile?.bloodGroup
        ? formatBloodGroup(r.donorUser.donorProfile.bloodGroup)
        : formatBloodGroup(alert.bloodType);

      return {
        id: r.id,
        donorUserId: r.donorUserId,
        donorName: r.donorUser.name,
        bloodGroup: bloodGroupStr,
        status: formatResponseStatus(r.status),
        rawStatus: r.status,
        distance: '0.8 km away',
        eta: r.etaMinutes ? `${r.etaMinutes} mins` : '15 mins',
        etaMinutes: r.etaMinutes || 15,
        phone: r.donorUser.phone || r.donorUser.donorProfile?.emergencyContactPhone || '+1 (555) 234-8901',
        targetAlert: alert.description || `${alert.hospitalName} Emergency`,
        respondedAt: r.respondedAt.toISOString(),
        time: formatTimeAgo(r.respondedAt),
      };
    });

    res.json({
      success: true,
      alertId: id,
      count: formattedResponses.length,
      responses: formattedResponses,
    });
  } catch (error) {
    console.error('Error fetching emergency responses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve donor responses.',
    });
  }
});

/**
 * PATCH /api/emergencies/:id
 * Updates an emergency requirement.
 * Security: Only the emergency-owning Hospital/Blood Bank or SUPER_ADMIN may update.
 * USER/DONOR is strictly rejected with 403.
 */
router.patch('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;

  if (user.role === Role.USER) {
    res.status(403).json({
      success: false,
      message: 'Donors cannot modify emergency alerts.',
    });
    return;
  }

  const parsed = updateEmergencySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: 'Validation failed for emergency update.',
      errors: parsed.error.issues.map((i) => i.message),
    });
    return;
  }

  try {
    const alert = await prisma.emergencyAlert.findUnique({
      where: { id },
      include: { organization: true },
    });

    if (!alert) {
      res.status(404).json({
        success: false,
        message: `Emergency alert with ID "${id}" not found.`,
      });
      return;
    }

    // Ownership Authorization
    if (user.role !== Role.SUPER_ADMIN) {
      const userOrg = await resolveUserOrganization(user);
      const isOwnerOrg = userOrg && alert.organizationId === userOrg.id;
      const isCreator = alert.createdById === user.id;

      if (!isOwnerOrg && !isCreator) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to modify another organization\'s emergency requirement.',
        });
        return;
      }
    }

    const dataToUpdate: any = {};
    if (parsed.data.bagsNeeded !== undefined || parsed.data.bagsRequired !== undefined) {
      dataToUpdate.bagsNeeded = parsed.data.bagsNeeded || parsed.data.bagsRequired;
    }
    if (parsed.data.bagsFulfilled !== undefined) {
      dataToUpdate.bagsFulfilled = parsed.data.bagsFulfilled;
    }
    if (parsed.data.urgency) {
      const parsedUrgency = parseUrgencyLevel(parsed.data.urgency);
      if (parsedUrgency) dataToUpdate.urgency = parsedUrgency;
    }
    if (parsed.data.category) {
      const parsedCat = parseEmergencyCategory(parsed.data.category);
      if (parsedCat) dataToUpdate.category = parsedCat;
    }
    if (parsed.data.department) dataToUpdate.department = parsed.data.department;
    if (parsed.data.description) dataToUpdate.description = parsed.data.description;
    if (parsed.data.contactPhone) dataToUpdate.contactPhone = parsed.data.contactPhone;
    if (parsed.data.criticalNote !== undefined) dataToUpdate.criticalNote = parsed.data.criticalNote;
    if (parsed.data.status) {
      const upperStatus = parsed.data.status.toUpperCase();
      if (upperStatus in EmergencyStatus) {
        dataToUpdate.status = upperStatus as EmergencyStatus;
      }
    }

    const updatedAlert = await prisma.emergencyAlert.update({
      where: { id },
      data: dataToUpdate,
      include: {
        organization: true,
        responses: {
          include: {
            donorUser: { select: { id: true, name: true, donorProfile: true } },
          },
        },
      },
    });

    // Audit Logging
    await createAuditLog({
      userId: user.id,
      organizationId: alert.organizationId,
      category: ActivityCategory.EMERGENCY,
      severity: ActivitySeverity.INFO,
      eventText: `Emergency requirement updated for ${alert.hospitalName} (${formatBloodGroup(alert.bloodType)})`,
      metadata: { alertId: id, updates: dataToUpdate },
    });

    const formatted = formatEmergencyAlert(updatedAlert, user.id);

    try {
      emitEmergencyUpdated(formatted, alert.organizationId);
    } catch (socketErr) {
      console.warn('Non-fatal error broadcasting emergency update:', socketErr);
    }

    res.json({
      success: true,
      message: 'Emergency alert updated successfully.',
      emergency: formatted,
      alert: formatted,
    });
  } catch (error) {
    console.error('Error updating emergency alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update emergency alert.',
    });
  }
});

/**
 * POST /api/emergencies/:id/fulfill
 * Marks an emergency as fulfilled.
 * Note: Does not automatically deduct blood inventory.
 */
router.post('/:id/fulfill', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;

  if (user.role === Role.USER) {
    res.status(403).json({
      success: false,
      message: 'Donors cannot fulfill emergency alerts.',
    });
    return;
  }

  try {
    const alert = await prisma.emergencyAlert.findUnique({
      where: { id },
      include: { organization: true },
    });

    if (!alert) {
      res.status(404).json({
        success: false,
        message: `Emergency alert with ID "${id}" not found.`,
      });
      return;
    }

    if (user.role !== Role.SUPER_ADMIN) {
      const userOrg = await resolveUserOrganization(user);
      const isOwnerOrg = userOrg && alert.organizationId === userOrg.id;
      const isCreator = alert.createdById === user.id;

      if (!isOwnerOrg && !isCreator) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to fulfill another organization\'s emergency.',
        });
        return;
      }
    }

    const updated = await prisma.emergencyAlert.update({
      where: { id },
      data: {
        status: EmergencyStatus.FULFILLED,
        bagsFulfilled: alert.bagsNeeded,
      },
      include: {
        organization: true,
        responses: {
          include: {
            donorUser: { select: { id: true, name: true, donorProfile: true } },
          },
        },
      },
    });

    // Audit Logging
    await createAuditLog({
      userId: user.id,
      organizationId: alert.organizationId,
      category: ActivityCategory.EMERGENCY,
      severity: ActivitySeverity.SUCCESS,
      eventText: `Emergency requirement marked FULFILLED for ${alert.hospitalName} (${formatBloodGroup(alert.bloodType)})`,
      metadata: { alertId: id, bagsNeeded: alert.bagsNeeded, bagsFulfilled: alert.bagsNeeded },
    });

    const formatted = formatEmergencyAlert(updated, user.id);

    try {
      emitEmergencyUpdated(formatted, alert.organizationId);

      // Notify responding donors that emergency was fulfilled
      if (updated.responses && updated.responses.length > 0) {
        const respondedDonorIds = Array.from(new Set(updated.responses.map((r) => r.donorUserId)));
        try {
          await createBulkNotifications(
            respondedDonorIds.map((donorId) => ({
              recipientUserId: donorId,
              type: NotificationType.EMERGENCY_FULFILLED,
              title: `✅ Emergency Fulfilled: ${alert.hospitalName}`,
              message: `The emergency requirement at ${alert.hospitalName} for ${formatBloodGroup(alert.bloodType)} has been fulfilled. Thank you for your lifesaving support!`,
              relatedEntityId: alert.id,
              relatedEntityType: 'EMERGENCY',
            }))
          );
        } catch (nErr) {
          console.warn('Non-fatal error creating fulfillment notifications:', nErr);
        }
      }
    } catch (socketErr) {
      console.warn('Non-fatal error broadcasting emergency fulfillment:', socketErr);
    }

    res.json({
      success: true,
      message: 'Emergency requirement marked as fulfilled.',
      emergency: formatted,
      alert: formatted,
    });
  } catch (error) {
    console.error('Error fulfilling emergency alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fulfill emergency alert.',
    });
  }
});

/**
 * POST /api/emergencies/:id/cancel
 * Marks an emergency as cancelled.
 */
router.post('/:id/cancel', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;

  if (user.role === Role.USER) {
    res.status(403).json({
      success: false,
      message: 'Donors cannot cancel emergency alerts.',
    });
    return;
  }

  try {
    const alert = await prisma.emergencyAlert.findUnique({
      where: { id },
      include: { organization: true },
    });

    if (!alert) {
      res.status(404).json({
        success: false,
        message: `Emergency alert with ID "${id}" not found.`,
      });
      return;
    }

    if (user.role !== Role.SUPER_ADMIN) {
      const userOrg = await resolveUserOrganization(user);
      const isOwnerOrg = userOrg && alert.organizationId === userOrg.id;
      const isCreator = alert.createdById === user.id;

      if (!isOwnerOrg && !isCreator) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to cancel another organization\'s emergency.',
        });
        return;
      }
    }

    const updated = await prisma.emergencyAlert.update({
      where: { id },
      data: {
        status: EmergencyStatus.CANCELLED,
      },
      include: {
        organization: true,
        responses: {
          include: {
            donorUser: { select: { id: true, name: true, donorProfile: true } },
          },
        },
      },
    });

    // Audit Logging
    await createAuditLog({
      userId: user.id,
      organizationId: alert.organizationId,
      category: ActivityCategory.EMERGENCY,
      severity: ActivitySeverity.INFO,
      eventText: `Emergency requirement CANCELLED for ${alert.hospitalName} (${formatBloodGroup(alert.bloodType)})`,
      metadata: { alertId: id },
    });

    const formatted = formatEmergencyAlert(updated, user.id);

    try {
      emitEmergencyUpdated(formatted, alert.organizationId);

      // Notify responding donors that emergency was cancelled
      if (updated.responses && updated.responses.length > 0) {
        const respondedDonorIds = Array.from(new Set(updated.responses.map((r) => r.donorUserId)));
        try {
          await createBulkNotifications(
            respondedDonorIds.map((donorId) => ({
              recipientUserId: donorId,
              type: NotificationType.EMERGENCY_CANCELLED,
              title: `ℹ️ Emergency Cancelled: ${alert.hospitalName}`,
              message: `The emergency requirement at ${alert.hospitalName} has been cancelled.`,
              relatedEntityId: alert.id,
              relatedEntityType: 'EMERGENCY',
            }))
          );
        } catch (nErr) {
          console.warn('Non-fatal error creating cancellation notifications:', nErr);
        }
      }
    } catch (socketErr) {
      console.warn('Non-fatal error broadcasting emergency cancellation:', socketErr);
    }

    res.json({
      success: true,
      message: 'Emergency requirement cancelled.',
      emergency: formatted,
      alert: formatted,
    });
  } catch (error) {
    console.error('Error cancelling emergency alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel emergency alert.',
    });
  }
});

/**
 * GET /api/emergencies/:id/matches
 * Finds potential donor matches for an emergency alert.
 * 
 * RBAC Rules:
 * - USER (Donor): 403 Forbidden (Privacy restriction: donors cannot see all other donors)
 * - HOSPITAL / BLOOD_BANK: May view potential matches for their own organization's emergency
 * - SUPER_ADMIN: May view potential matches for any emergency
 */
router.get('/:id/matches', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;

  // 1. Role Check - Donors cannot view all potential matching donors
  if (user.role === Role.USER) {
    res.status(403).json({
      success: false,
      message: 'Donors cannot view list of other donors. Use /api/emergencies/:id/match-status to check your own match status.',
    });
    return;
  }

  try {
    const alert = await prisma.emergencyAlert.findUnique({
      where: { id },
      include: { organization: true },
    });

    if (!alert) {
      res.status(404).json({
        success: false,
        message: `Emergency alert with ID "${id}" not found.`,
      });
      return;
    }

    // 2. Organization Ownership Check (unless SUPER_ADMIN)
    if (user.role !== Role.SUPER_ADMIN) {
      const userOrg = await resolveUserOrganization(user);
      const isOwnerOrg = userOrg && alert.organizationId === userOrg.id;
      const isCreator = alert.createdById === user.id;

      if (!isOwnerOrg && !isCreator) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to view matches for another organization\'s emergency.',
        });
        return;
      }
    }

    // 3. Optional custom radius from query
    let radiusKm: number | undefined;
    if (req.query.radius) {
      const parsedRadius = Number(req.query.radius);
      if (Number.isFinite(parsedRadius) && parsedRadius > 0) {
        radiusKm = parsedRadius;
      }
    }

    // 4. Calculate matches
    const matchSummary = await findPotentialDonorMatches(id, radiusKm);

    if (!matchSummary) {
      res.status(404).json({
        success: false,
        message: `Emergency alert with ID "${id}" not found.`,
      });
      return;
    }

    res.json({
      success: true,
      ...matchSummary,
    });
  } catch (error) {
    console.error('Error finding emergency matches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve potential donor matches.',
    });
  }
});

/**
 * GET /api/emergencies/:id/match-status
 * Checks if the currently authenticated user/donor is a potential match for this emergency.
 * Accessible to all authenticated users (including donors).
 * Strictly private: Only returns caller's own matching status.
 */
router.get('/:id/match-status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;

  try {
    let radiusKm: number | undefined;
    if (req.query.radius) {
      const parsedRadius = Number(req.query.radius);
      if (Number.isFinite(parsedRadius) && parsedRadius > 0) {
        radiusKm = parsedRadius;
      }
    }

    const matchStatus = await checkDonorMatchStatus(id, user.id, radiusKm);

    if (!matchStatus) {
      res.status(404).json({
        success: false,
        message: `Emergency alert with ID "${id}" not found.`,
      });
      return;
    }

    res.json({
      success: true,
      ...matchStatus,
    });
  } catch (error) {
    console.error('Error checking donor match status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check potential donor match status.',
    });
  }
});

export default router;
