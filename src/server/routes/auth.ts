import { Router, Request, Response } from 'express';
import { Role, AccountStatus, OrganizationStatus } from '@prisma/client';
import { prisma } from '../prisma';
import { registerUserSchema, loginSchema, bloodGroupMap } from '../validators/auth';
import { hashPassword, comparePassword } from '../utils/password';
import { signAuthToken } from '../utils/jwt';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { inMemoryUsers, InMemoryUser } from '../store/demoAuthStore';
import { seedAllDemoAccountsIfMissing } from '../utils/seedDemoAccounts';
import { authLoginLimiter, authRegisterLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new normal USER / Donor with password hashing and automated DonorProfile creation.
 */
router.post('/register', authRegisterLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = registerUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'Invalid registration input',
        errors: parseResult.error.issues,
      });
      return;
    }

    const { name, email, password, phone, bloodGroup, locationAddress, locationCity } =
      parseResult.data;
    const cleanEmail = email.toLowerCase();
    const mappedBloodGroup = bloodGroupMap[bloodGroup];

    // Hash password using bcrypt
    const passwordHash = await hashPassword(password);

    try {
      // 1. Attempt PostgreSQL registration via Prisma
      const existingUser = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'An account with this email address already exists.',
        });
        return;
      }

      const newUser = await prisma.user.create({
        data: {
          name,
          email: cleanEmail,
          passwordHash,
          phone: phone || null,
          role: Role.USER,
          status: AccountStatus.ACTIVE,
          locationAddress: locationAddress || null,
          locationCity: locationCity || null,
          donorProfile: {
            create: {
              bloodGroup: mappedBloodGroup,
              isAvailableToDonate: true,
              totalDonations: 0,
              livesImpacted: 0,
            },
          },
        },
        include: {
          donorProfile: true,
        },
      });

      const token = signAuthToken({
        userId: newUser.id,
        role: newUser.role,
        email: newUser.email,
      });

      res.status(201).json({
        success: true,
        message: 'Account registered successfully.',
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
          phone: newUser.phone,
          donorProfile: newUser.donorProfile,
          createdAt: newUser.createdAt,
        },
      });
    } catch (dbErr) {
      // Fallback for demo/in-memory store if PostgreSQL is not yet configured
      const existingInMemory = inMemoryUsers.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existingInMemory) {
        res.status(409).json({
          success: false,
          message: 'An account with this email address already exists.',
        });
        return;
      }

      const inMemoryNewUser: InMemoryUser = {
        id: `usr-${Date.now()}`,
        name,
        email: cleanEmail,
        passwordHash,
        phone: phone || null,
        role: Role.USER,
        status: AccountStatus.ACTIVE,
        donorProfile: {
          id: `donor-${Date.now()}`,
          bloodGroup: mappedBloodGroup,
          isAvailableToDonate: true,
          totalDonations: 0,
          livesImpacted: 0,
        },
      };

      inMemoryUsers.push(inMemoryNewUser);

      const token = signAuthToken({
        userId: inMemoryNewUser.id,
        role: inMemoryNewUser.role,
        email: inMemoryNewUser.email,
      });

      res.status(201).json({
        success: true,
        message: 'Account registered successfully.',
        token,
        user: {
          id: inMemoryNewUser.id,
          name: inMemoryNewUser.name,
          email: inMemoryNewUser.email,
          role: inMemoryNewUser.role,
          status: inMemoryNewUser.status,
          phone: inMemoryNewUser.phone,
          donorProfile: inMemoryNewUser.donorProfile,
        },
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete registration. Please try again later.',
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user, hospital, blood bank, or super admin with bcrypt verification and JWT generation.
 */
router.post('/login', authLoginLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'Invalid login credentials',
      });
      return;
    }

    const { email, password } = parseResult.data;
    const cleanInput = email.trim().toLowerCase();

    let user: any = null;

    try {
      // 1. Try PostgreSQL lookup by user email (case-insensitive)
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: cleanInput },
            { email: { equals: cleanInput, mode: 'insensitive' } },
          ],
        },
        include: {
          donorProfile: true,
          managedOrganizations: true,
        },
      });

      // 2. If not found by user email, check if logging in with Organization email or registration number
      if (!user) {
        const org = await prisma.organization.findFirst({
          where: {
            OR: [
              { email: cleanInput },
              { email: { equals: cleanInput, mode: 'insensitive' } },
              { registrationNumber: cleanInput },
            ],
          },
          include: {
            manager: {
              include: {
                donorProfile: true,
                managedOrganizations: true,
              },
            },
          },
        });
        if (org && org.manager) {
          user = org.manager;
        }
      }

      // 3. If still not found, check if this is a known demo account and seed it to PostgreSQL
      if (!user) {
        const isDemoEmail = inMemoryUsers.some(
          (u) =>
            u.email.toLowerCase() === cleanInput ||
            u.managedOrganizations?.some((o) => o.name.toLowerCase().includes(cleanInput))
        );
        if (isDemoEmail) {
          await seedAllDemoAccountsIfMissing();
          user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: cleanInput },
                { email: { equals: cleanInput, mode: 'insensitive' } },
              ],
            },
            include: {
              donorProfile: true,
              managedOrganizations: true,
            },
          });
        }
      }
    } catch (dbErr) {
      console.warn('[AUTH] Database error during login lookup:', dbErr);
    }

    if (!user || !user.passwordHash) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    // Verify bcrypt password hash
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    // 1. Account Status Enforcement
    if (user.status === AccountStatus.BANNED) {
      res.status(403).json({
        success: false,
        message: user.banReason
          ? `Your REDGRID account has been banned: ${user.banReason}`
          : 'Your REDGRID account has been banned. Please contact support.',
      });
      return;
    }

    if (user.status === AccountStatus.SUSPENDED) {
      res.status(403).json({
        success: false,
        message: 'Your REDGRID account is temporarily suspended. Please contact support.',
      });
      return;
    }

    if (user.status === AccountStatus.REJECTED) {
      res.status(403).json({
        success: false,
        message: 'Your account registration was rejected.',
      });
      return;
    }

    // 2. Organization Status Enforcement for Hospital / Blood Bank Users
    if (user.role === Role.HOSPITAL || user.role === Role.BLOOD_BANK) {
      const org = user.managedOrganizations?.[0];
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

    // Generate JWT
    const token = signAuthToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        locationAddress: user.locationAddress || null,
        locationCity: user.locationCity || null,
        donorProfile: user.donorProfile || null,
        organization: user.managedOrganizations?.[0] || null,
        managedOrganizations: user.managedOrganizations || [],
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again later.',
    });
  }
});

/**
 * GET /api/auth/me
 * Returns currently authenticated user with non-sensitive donor/organization data.
 */
router.get('/me', requireAuth, (req: Request, res: Response): void => {
  const authReq = req as AuthenticatedRequest;
  res.status(200).json({
    success: true,
    user: authReq.user,
  });
});

/**
 * PATCH /api/auth/profile
 * Updates the profile & donor parameters for the authenticated user.
 */
router.patch('/profile', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const currentUser = authReq.user;
    if (!currentUser) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const {
      name,
      phone,
      bloodGroup,
      locationAddress,
      locationCity,
      isAvailableToDonate,
      weightKg,
      hemoglobin,
      emergencyContact,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelationship,
    } = req.body;

    const mappedBg = bloodGroup && (bloodGroupMap as any)[bloodGroup]
      ? (bloodGroupMap as any)[bloodGroup]
      : undefined;

    const resolvedContactName = emergencyContactName || emergencyContact?.name;
    const resolvedContactPhone = emergencyContactPhone || emergencyContact?.phone;

    try {
      const updatedUser = await prisma.user.update({
        where: { id: currentUser.id },
        data: {
          name: name ? String(name).trim() : undefined,
          phone: phone !== undefined ? String(phone).trim() : undefined,
          locationAddress: locationAddress !== undefined ? String(locationAddress).trim() : undefined,
          locationCity: locationCity !== undefined ? String(locationCity).trim() : undefined,
          donorProfile:
            mappedBg || isAvailableToDonate !== undefined || weightKg !== undefined || hemoglobin !== undefined || resolvedContactName !== undefined || resolvedContactPhone !== undefined
              ? {
                  upsert: {
                    create: {
                      bloodGroup: mappedBg || 'O_POSITIVE',
                      isAvailableToDonate: isAvailableToDonate !== false,
                      weightKg: weightKg ? Number(weightKg) : undefined,
                      hemoglobin: hemoglobin ? Number(hemoglobin) : undefined,
                      emergencyContactName: resolvedContactName ? String(resolvedContactName).trim() : undefined,
                      emergencyContactPhone: resolvedContactPhone ? String(resolvedContactPhone).trim() : undefined,
                    },
                    update: {
                      bloodGroup: mappedBg,
                      isAvailableToDonate: isAvailableToDonate !== undefined ? Boolean(isAvailableToDonate) : undefined,
                      weightKg: weightKg !== undefined ? Number(weightKg) : undefined,
                      hemoglobin: hemoglobin !== undefined ? Number(hemoglobin) : undefined,
                      emergencyContactName: resolvedContactName !== undefined ? String(resolvedContactName).trim() : undefined,
                      emergencyContactPhone: resolvedContactPhone !== undefined ? String(resolvedContactPhone).trim() : undefined,
                    },
                  },
                }
              : undefined,
        },
        include: {
          donorProfile: true,
          managedOrganizations: true,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          status: updatedUser.status,
          phone: updatedUser.phone,
          locationAddress: updatedUser.locationAddress,
          locationCity: updatedUser.locationCity,
          donorProfile: updatedUser.donorProfile,
          organization: updatedUser.managedOrganizations?.[0] || null,
          managedOrganizations: updatedUser.managedOrganizations || [],
          createdAt: updatedUser.createdAt,
        },
      });
    } catch (dbErr) {
      console.warn('[AUTH] In-memory update fallback for profile:', dbErr);
      const inMem = inMemoryUsers.find((u) => u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase());
      if (inMem) {
        if (name) inMem.name = String(name).trim();
        if (phone !== undefined) inMem.phone = String(phone).trim();
        if (inMem.donorProfile) {
          if (mappedBg) inMem.donorProfile.bloodGroup = mappedBg;
          if (isAvailableToDonate !== undefined) inMem.donorProfile.isAvailableToDonate = Boolean(isAvailableToDonate);
        }
      }
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        user: {
          id: currentUser.id,
          name: name || currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          status: currentUser.status,
          phone: phone || currentUser.phone,
          donorProfile: {
            ...currentUser.donorProfile,
            ...(mappedBg ? { bloodGroup: mappedBg } : {}),
            ...(isAvailableToDonate !== undefined ? { isAvailableToDonate } : {}),
          },
        },
      });
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

/**
 * POST /api/auth/logout
 * Stateless JWT logout acknowledgment.
 */
router.post('/logout', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Token should be removed from client storage.',
  });
});

export default router;

