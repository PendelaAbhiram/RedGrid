import { Router, Request, Response } from 'express';
import {
  Role,
  AccountStatus,
  OrganizationType,
  OrganizationStatus,
  ActivityCategory,
  ActivitySeverity,
  BloodGroup,
} from '@prisma/client';
import { prisma } from '../prisma';
import {
  registerHospitalSchema,
  registerBloodBankSchema,
  updateOrgProfileSchema,
  documentUploadSchema,
} from '../validators/organization';
import { hashPassword } from '../utils/password';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';
import { getScopedOrganizationAnalytics } from '../services/analyticsService';
import { formatBloodGroup } from '../utils/bloodGroup';

const router = Router();

const ALL_BLOOD_GROUPS = [
  BloodGroup.A_POS,
  BloodGroup.A_NEG,
  BloodGroup.B_POS,
  BloodGroup.B_NEG,
  BloodGroup.AB_POS,
  BloodGroup.AB_NEG,
  BloodGroup.O_POS,
  BloodGroup.O_NEG,
];

/**
 * Shared helper to register an organization (Hospital or Blood Bank)
 */
async function handleOrganizationRegistration(
  req: Request,
  res: Response,
  orgType: OrganizationType,
  schema: typeof registerHospitalSchema | typeof registerBloodBankSchema
) {
  try {
    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'Invalid organization registration data',
        errors: parseResult.error.issues,
      });
      return;
    }

    const {
      name,
      registrationNumber,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      website,
      latitude,
      longitude,
      facilityType,
      licenseIssuingAuthority,
      licenseExpiryDate,
      licenseDocumentName,
      licenseDocumentSize,
      licenseDocumentType,
      licenseDocumentUrl,
      licenseDocumentData,
      additionalDocuments,
      adminName,
      contactPerson,
      adminEmail,
      adminPhone,
      contactPersonDesignation,
      password,
    } = parseResult.data;

    const cleanEmail = email.toLowerCase().trim();
    const cleanRegNo = registrationNumber.toUpperCase().trim();
    const adminFullName = (adminName || contactPerson || `${name} Administrator`).trim();
    const cleanAdminEmail = (adminEmail || email).toLowerCase().trim();
    const cleanAdminPhone = (adminPhone || phone).trim();

    // Parse doc size
    let docSizeNum: number | null = null;
    if (typeof licenseDocumentSize === 'number') {
      docSizeNum = licenseDocumentSize;
    } else if (typeof licenseDocumentSize === 'string') {
      const match = licenseDocumentSize.match(/[\d.]+/);
      if (match) {
        docSizeNum = Math.round(parseFloat(match[0]) * 1024 * 1024);
      }
    }
    if (!docSizeNum) {
      docSizeNum = 2621440; // default 2.5 MB
    }

    // Document preparation - use compact, secure relative URL to avoid huge database payload overhead
    const docTypeLabel = orgType === OrganizationType.HOSPITAL ? 'Main Hospital License' : 'Main Blood Bank License';
    const mainDocUrl =
      licenseDocumentData && licenseDocumentData.length < 2048
        ? licenseDocumentData
        : licenseDocumentUrl || `/documents/secure/${encodeURIComponent(cleanRegNo)}/${encodeURIComponent(licenseDocumentName.trim())}`;

    // PRECOMPUTE PASSWORD HASH OUTSIDE OF DATABASE TRANSACTION
    // Hashing with bcrypt is CPU intensive and should never block an active interactive SQL transaction.
    const defaultPassword = password || (orgType === OrganizationType.HOSPITAL ? 'Hospital@2026' : 'BloodBank@2026');
    const precomputedPasswordHash = await hashPassword(defaultPassword);

    // Execute atomic transaction with extended timeout options
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Check duplicate registration number
        const existingOrg = await tx.organization.findUnique({
          where: { registrationNumber: cleanRegNo },
        });

        if (existingOrg) {
          throw new Error(`CONFLICT_REGNO: An organization with registration number "${cleanRegNo}" is already registered.`);
        }

        // 2. Resolve or create managing user account
        let managerUserId: string | null = null;
        const authReq = req as AuthenticatedRequest;

        if (authReq.user && (authReq.user.role === Role.SUPER_ADMIN || authReq.user.role === orgType)) {
          managerUserId = authReq.user.id;
        } else {
          const existingUser = await tx.user.findUnique({
            where: { email: cleanAdminEmail },
          });

          if (existingUser) {
            const alreadyOrg = await tx.organization.findFirst({
              where: { userId: existingUser.id },
            });
            if (alreadyOrg) {
              throw new Error(
                `CONFLICT_EMAIL: A user with email "${cleanAdminEmail}" is already registered as the administrator for "${alreadyOrg.name}". Please log in or use a different official email address.`
              );
            }

            // Upgrade existing account to organization role and update credentials
            const updateData: any = {
              name: adminFullName,
              role: orgType === OrganizationType.HOSPITAL ? Role.HOSPITAL : Role.BLOOD_BANK,
              locationAddress: address.trim(),
              locationCity: city.trim(),
              phone: cleanAdminPhone,
            };
            if (password) {
              updateData.passwordHash = precomputedPasswordHash;
            }
            const updated = await tx.user.update({
              where: { id: existingUser.id },
              data: updateData,
            });
            managerUserId = updated.id;
          } else {
            // Create new administrator user account using precomputed hash
            const newUser = await tx.user.create({
              data: {
                name: adminFullName,
                email: cleanAdminEmail,
                passwordHash: precomputedPasswordHash,
                phone: cleanAdminPhone,
                role: orgType === OrganizationType.HOSPITAL ? Role.HOSPITAL : Role.BLOOD_BANK,
                status: AccountStatus.ACTIVE,
                locationAddress: address.trim(),
                locationCity: city.trim(),
                latitude: latitude || null,
                longitude: longitude || null,
              },
            });
            managerUserId = newUser.id;
          }
        }

        // Prepare documents array for Prisma create
        const documentsToCreate = [
          {
            documentType: docTypeLabel,
            fileName: licenseDocumentName.trim(),
            fileUrl: mainDocUrl,
            fileSize: docSizeNum,
            mimeType: licenseDocumentType || 'application/pdf',
          },
        ];

        if (Array.isArray(additionalDocuments) && additionalDocuments.length > 0) {
          for (const addDoc of additionalDocuments) {
            let addDocSize = 1048576;
            if (typeof addDoc.fileSize === 'number') {
              addDocSize = addDoc.fileSize;
            } else if (typeof addDoc.fileSize === 'string') {
              const m = addDoc.fileSize.match(/[\d.]+/);
              if (m) addDocSize = Math.round(parseFloat(m[0]) * 1024 * 1024);
            }
            const addDocUrl =
              addDoc.fileData && addDoc.fileData.length < 2048
                ? addDoc.fileData
                : addDoc.fileUrl || `/documents/secure/${encodeURIComponent(cleanRegNo)}/${encodeURIComponent(addDoc.fileName.trim())}`;

            documentsToCreate.push({
              documentType: addDoc.documentType || 'Supporting Accreditation Document',
              fileName: addDoc.fileName.trim(),
              fileUrl: addDocUrl,
              fileSize: addDocSize,
              mimeType: addDoc.mimeType || 'application/pdf',
            });
          }
        }

        // 3. Create Organization with strictly PENDING status
        const createdOrg = await tx.organization.create({
          data: {
            userId: managerUserId,
            name: name.trim(),
            type: orgType,
            registrationNumber: cleanRegNo,
            email: cleanEmail,
            phone: phone.trim(),
            address: address.trim(),
            city: city.trim(),
            state: state?.trim() || null,
            pincode: pincode?.trim() || null,
            contactPerson: adminFullName,
            contactPersonDesignation: contactPersonDesignation?.trim() || (licenseIssuingAuthority ? `Auth: ${licenseIssuingAuthority} | Exp: ${licenseExpiryDate}` : 'Medical Director'),
            facilityType: facilityType?.trim() || (orgType === OrganizationType.HOSPITAL ? 'Trauma & Acute Clinical Care' : 'Regional Cold-Chain Storage'),
            latitude: latitude || null,
            longitude: longitude || null,
            status: OrganizationStatus.PENDING, // Strictly PENDING
            documents: {
              create: documentsToCreate,
            },
            inventories: {
              create: ALL_BLOOD_GROUPS.map((bg) => ({
                bloodGroup: bg,
                quantity: 0,
              })),
            },
          },
          include: {
            documents: true,
            manager: {
              select: { id: true, name: true, email: true, role: true, status: true },
            },
            inventories: true,
          },
        });

        return { createdOrg, managerUserId };
      },
      {
        maxWait: 15000,
        timeout: 30000,
      }
    );

    const newOrg = result.createdOrg;

    // 4. Audit Log
    await createAuditLog({
      userId: result.managerUserId,
      organizationId: newOrg.id,
      category: ActivityCategory.SYSTEM,
      severity: ActivitySeverity.INFO,
      eventText: `New ${orgType === OrganizationType.HOSPITAL ? 'Hospital' : 'Blood Bank'} "${newOrg.name}" registered (Registration: ${cleanRegNo}). Status: PENDING verification.`,
      metadata: {
        registrationNumber: cleanRegNo,
        orgType,
        city: newOrg.city,
        licenseIssuingAuthority,
        licenseExpiryDate,
        submittedDocuments: newOrg.documents.map((d) => d.fileName),
      },
    });

    res.status(201).json({
      success: true,
      message: `${orgType === OrganizationType.HOSPITAL ? 'Hospital' : 'Blood Bank'} registered successfully with PENDING verification status.`,
      organization: {
        id: newOrg.id,
        name: newOrg.name,
        type: newOrg.type,
        registrationNumber: newOrg.registrationNumber,
        email: newOrg.email,
        phone: newOrg.phone,
        address: newOrg.address,
        city: newOrg.city,
        state: newOrg.state,
        pincode: newOrg.pincode,
        contactPerson: newOrg.contactPerson,
        contactPersonDesignation: newOrg.contactPersonDesignation,
        facilityType: newOrg.facilityType,
        status: newOrg.status,
        licenseIssuingAuthority,
        licenseExpiryDate,
        submittedDocuments: newOrg.documents,
        documents: newOrg.documents,
        manager: newOrg.manager,
        createdAt: newOrg.createdAt,
      },
    });
  } catch (error: any) {
    console.error(`Error during ${orgType} registration:`, error);
    if (error.message && error.message.startsWith('CONFLICT_REGNO:')) {
      res.status(409).json({
        success: false,
        message: error.message.replace('CONFLICT_REGNO: ', ''),
      });
      return;
    }
    if (error.message && error.message.startsWith('CONFLICT_EMAIL:')) {
      res.status(409).json({
        success: false,
        message: error.message.replace('CONFLICT_EMAIL: ', ''),
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Failed to process organization registration. Please check submitted details and try again.',
    });
  }
}

/**
 * POST /api/organizations/register/hospital
 */
router.post('/register/hospital', (req: Request, res: Response) => {
  handleOrganizationRegistration(req, res, OrganizationType.HOSPITAL, registerHospitalSchema);
});

/**
 * POST /api/organizations/register/blood-bank
 */
router.post('/register/blood-bank', (req: Request, res: Response) => {
  handleOrganizationRegistration(req, res, OrganizationType.BLOOD_BANK, registerBloodBankSchema);
});

/**
 * GET /api/organizations
 * Retrieves list of registered organizations for authenticated users.
 */
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const orgs = await prisma.organization.findMany({
      include: {
        documents: true,
        inventories: true,
        manager: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = orgs.map((org) => {
      const inventoryMap: Record<string, number> = {
        'A+': 0,
        'A-': 0,
        'B+': 0,
        'B-': 0,
        'AB+': 0,
        'AB-': 0,
        'O+': 0,
        'O-': 0,
      };
      let totalBags = 0;
      org.inventories.forEach((inv) => {
        const bg = formatBloodGroup(inv.bloodGroup);
        const qty = Math.max(0, inv.quantity);
        inventoryMap[bg] = qty;
        totalBags += qty;
      });

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
        verifiedDate: org.verifiedAt ? new Date(org.verifiedAt).toLocaleDateString() : undefined,
        submittedDate: org.createdAt ? new Date(org.createdAt).toLocaleDateString() : 'Recent',
        latitude: org.latitude,
        longitude: org.longitude,
        totalBags,
        inventory: inventoryMap,
        documents: org.documents.map((d) => ({
          id: d.id,
          documentType: d.documentType,
          fileName: d.fileName,
          fileSize: d.fileSize,
          mimeType: d.mimeType,
          uploadedAt: d.uploadedAt,
        })),
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      organizations: formatted,
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch organizations' });
  }
});

/**
 * GET /api/organizations/me
 * Retrieves the currently authenticated user's organization.
 */
router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    let organization = null;

    if (user.role === Role.SUPER_ADMIN) {
      // Return first organization or all organizations for admin inspection
      organization = await prisma.organization.findFirst({
        include: {
          documents: true,
          manager: { select: { id: true, name: true, email: true, role: true } },
          inventories: true,
        },
      });
    } else {
      // Find organization associated with user
      organization = await prisma.organization.findFirst({
        where: {
          OR: [
            { userId: user.id },
            { email: user.email.toLowerCase() },
          ],
        },
        include: {
          documents: true,
          manager: { select: { id: true, name: true, email: true, role: true } },
          inventories: true,
        },
      });
    }

    if (!organization) {
      res.status(404).json({
        success: false,
        message: 'No organization profile found for the active account.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        type: organization.type,
        registrationNumber: organization.registrationNumber,
        email: organization.email,
        phone: organization.phone,
        address: organization.address,
        city: organization.city,
        state: organization.state,
        pincode: organization.pincode,
        contactPerson: organization.contactPerson,
        contactPersonDesignation: organization.contactPersonDesignation,
        facilityType: organization.facilityType,
        status: organization.status,
        rejectionReason: organization.rejectionReason,
        banReason: organization.banReason,
        verifiedAt: organization.verifiedAt,
        latitude: organization.latitude,
        longitude: organization.longitude,
        documents: organization.documents.map((d) => ({
          id: d.id,
          documentType: d.documentType,
          fileName: d.fileName,
          fileSize: d.fileSize,
          mimeType: d.mimeType,
          uploadedAt: d.uploadedAt,
        })),
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching organization profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve organization profile',
    });
  }
});

/**
 * GET /api/organizations/me/analytics
 * Retrieves strictly scoped analytics for the authenticated organization.
 */
router.get('/me/analytics', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // Must be HOSPITAL, BLOOD_BANK, or SUPER_ADMIN
    if (
      user.role !== Role.HOSPITAL &&
      user.role !== Role.BLOOD_BANK &&
      user.role !== Role.SUPER_ADMIN
    ) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Organization analytics are only available to healthcare facilities.',
      });
      return;
    }

    let organization = null;

    if (user.role === Role.SUPER_ADMIN) {
      // Super admin without specific org gets first org or can pass optional org query if testing
      const targetOrgId = req.query.organizationId ? String(req.query.organizationId) : undefined;
      organization = targetOrgId
        ? await prisma.organization.findUnique({ where: { id: targetOrgId } })
        : await prisma.organization.findFirst();
    } else {
      // Strict ownership lookup: NEVER trust arbitrary organizationId from user/hospital
      organization = await prisma.organization.findFirst({
        where: {
          OR: [
            { userId: user.id },
            { email: user.email.toLowerCase() },
          ],
        },
      });
    }

    if (!organization) {
      res.status(404).json({
        success: false,
        message: 'No associated organization found for the authenticated account.',
      });
      return;
    }

    const analyticsData = await getScopedOrganizationAnalytics(organization.id);
    if (!analyticsData) {
      res.status(404).json({
        success: false,
        message: 'Failed to calculate analytics for organization.',
      });
      return;
    }

    res.json({
      success: true,
      data: analyticsData,
    });
  } catch (error) {
    console.error('Error fetching scoped organization analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal error while calculating organization analytics',
    });
  }
});

/**
 * PATCH /api/organizations/me
 * Update allowed fields for the authenticated user's organization.
 */
router.patch('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const parseResult = updateOrgProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'Invalid update parameters',
        errors: parseResult.error.issues,
      });
      return;
    }

    // Find the user's organization
    const org = await prisma.organization.findFirst({
      where: {
        OR: [
          { userId: user.id },
          { email: user.email.toLowerCase() },
        ],
      },
    });

    if (!org) {
      res.status(404).json({
        success: false,
        message: 'No associated organization found to update.',
      });
      return;
    }

    const updateData = parseResult.data;

    const updatedOrg = await prisma.organization.update({
      where: { id: org.id },
      data: {
        phone: updateData.phone !== undefined ? updateData.phone : org.phone,
        email: updateData.email !== undefined ? updateData.email : org.email,
        address: updateData.address !== undefined ? updateData.address : org.address,
        city: updateData.city !== undefined ? updateData.city : org.city,
        state: updateData.state !== undefined ? updateData.state : org.state,
        pincode: updateData.pincode !== undefined ? updateData.pincode : org.pincode,
        contactPerson: updateData.contactPerson !== undefined ? updateData.contactPerson : org.contactPerson,
        contactPersonDesignation:
          updateData.contactPersonDesignation !== undefined
            ? updateData.contactPersonDesignation
            : org.contactPersonDesignation,
        facilityType: updateData.facilityType !== undefined ? updateData.facilityType : org.facilityType,
        latitude: updateData.latitude !== undefined ? updateData.latitude : org.latitude,
        longitude: updateData.longitude !== undefined ? updateData.longitude : org.longitude,
      },
    });

    await createAuditLog({
      userId: user.id,
      organizationId: org.id,
      category: ActivityCategory.SYSTEM,
      severity: ActivitySeverity.INFO,
      eventText: `Organization profile "${org.name}" updated by ${user.email}.`,
      metadata: updateData,
    });

    res.status(200).json({
      success: true,
      message: 'Organization profile updated successfully.',
      organization: updatedOrg,
    });
  } catch (error) {
    console.error('Error updating organization profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update organization profile',
    });
  }
});

/**
 * GET /api/organizations/:id/documents
 * Secure document listing for an organization.
 */
router.get('/:id/documents', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;
    const orgId = req.params.id;

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { documents: true },
    });

    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found' });
      return;
    }

    // Access control:
    // SUPER_ADMIN can view all.
    // HOSPITAL / BLOOD_BANK can view only their own.
    // USER cannot view.
    const isOwner = org.userId === user.id || org.email.toLowerCase() === user.email.toLowerCase();
    const isAdmin = user.role === Role.SUPER_ADMIN;

    if (!isAdmin && !isOwner) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view verification documents for this organization.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      organizationId: org.id,
      organizationName: org.name,
      documents: org.documents.map((doc) => ({
        id: doc.id,
        documentType: doc.documentType,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        uploadedAt: doc.uploadedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching organization documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents',
    });
  }
});

/**
 * GET /api/organizations/:id/documents/:docId
 * Secure single document viewer/retrieval for an organization.
 */
router.get('/:id/documents/:docId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;
    const { id: orgId, docId } = req.params;

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        documents: {
          where: { id: docId },
        },
      },
    });

    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found' });
      return;
    }

    const isOwner = org.userId === user.id || org.email.toLowerCase() === user.email.toLowerCase();
    const isAdmin = user.role === Role.SUPER_ADMIN;

    if (!isAdmin && !isOwner) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view this verification document.',
      });
      return;
    }

    const doc = org.documents[0];
    if (!doc) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    res.status(200).json({
      success: true,
      document: {
        id: doc.id,
        organizationId: org.id,
        organizationName: org.name,
        documentType: doc.documentType,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        uploadedAt: doc.uploadedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching single document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve verification document',
    });
  }
});

/**
 * POST /api/organizations/:id/documents
 * Submit/upload a new verification document for an organization.
 */
router.post('/:id/documents', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;
    const orgId = req.params.id;

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const parseResult = documentUploadSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'Invalid document submission data',
        errors: parseResult.error.issues,
      });
      return;
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found' });
      return;
    }

    const isOwner = org.userId === user.id || org.email.toLowerCase() === user.email.toLowerCase();
    const isAdmin = user.role === Role.SUPER_ADMIN;

    if (!isAdmin && !isOwner) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You cannot upload documents for this organization.',
      });
      return;
    }

    const { documentType, fileName, fileUrl, fileSize, mimeType } = parseResult.data;

    const newDoc = await prisma.organizationDocument.create({
      data: {
        organizationId: org.id,
        documentType,
        fileName,
        fileUrl: fileUrl || `/documents/secure/${encodeURIComponent(fileName)}`,
        fileSize: fileSize || 2097152,
        mimeType: mimeType || 'application/pdf',
      },
    });

    await createAuditLog({
      userId: user.id,
      organizationId: org.id,
      category: ActivityCategory.SYSTEM,
      severity: ActivitySeverity.INFO,
      eventText: `New document "${fileName}" (${documentType}) uploaded for "${org.name}".`,
      metadata: { documentId: newDoc.id, fileName, documentType },
    });

    res.status(201).json({
      success: true,
      message: 'Document submitted successfully.',
      document: newDoc,
    });
  } catch (error) {
    console.error('Error submitting document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
    });
  }
});

export default router;
