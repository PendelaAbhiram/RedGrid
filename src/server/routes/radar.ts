import { Router, Response } from 'express';
import {
  Role,
  OrganizationStatus,
  EmergencyStatus,
  ResponseStatus,
} from '@prisma/client';
import { prisma } from '../prisma';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { config } from '../config';
import {
  projectCoordinatesToRadar,
  calculateHaversineDistanceKm,
  formatDistanceDisplay,
  isValidCoordinatePair,
} from '../utils/geo';
import { formatBloodGroup } from '../utils/bloodGroup';
import { formatUrgencyLevel } from '../validators/emergency';
import { findPotentialDonorMatches } from '../services/donorMatching';

const router = Router();

// All radar endpoints require authentication
router.use(requireAuth);

/**
 * GET /api/radar
 * Safe geographical map / radar state data endpoint.
 * Respects strict RBAC and privacy:
 * - Donors only see hospitals, emergencies, and their own match/status
 * - Hospitals see hospitals, emergencies, and matching donors for their own active emergencies
 * - Super Admins see network-wide overview
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;

  try {
    // 1. Fetch Approved Organizations (Hospitals & Blood Banks)
    const organizations = await prisma.organization.findMany({
      where: {
        status: OrganizationStatus.APPROVED,
      },
      include: {
        inventories: true,
        emergencyAlerts: {
          where: { status: EmergencyStatus.ACTIVE },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    // 2. Fetch Active Emergencies
    const activeEmergencies = await prisma.emergencyAlert.findMany({
      where: { status: EmergencyStatus.ACTIVE },
      include: {
        organization: true,
        createdBy: true,
        responses: {
          include: {
            donorUser: {
              include: { donorProfile: true },
            },
          },
        },
      },
    });

    // Reference center for radar canvas (Default San Francisco / Regional hub)
    const centerLat = 37.7749;
    const centerLng = -122.4194;
    const radiusKm = config.donorMatchRadiusKm;

    // 3. Format Hospitals for Radar
    const radarHospitals = organizations.map((org, index) => {
      const lat = isValidCoordinatePair(org.latitude, org.longitude) ? org.latitude : centerLat + (index % 3 - 1) * 0.015;
      const lng = isValidCoordinatePair(org.latitude, org.longitude) ? org.longitude : centerLng + (Math.floor(index / 3) - 1) * 0.02;

      const coords = projectCoordinatesToRadar(lat, lng, centerLat, centerLng, radiusKm);
      const distanceKm = calculateHaversineDistanceKm(centerLat, centerLng, lat, lng);

      // Build inventory map
      const inventoryMap: Record<string, number> = {
        'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0,
      };
      let totalUnits = 0;
      for (const item of org.inventories) {
        const bg = formatBloodGroup(item.bloodGroup);
        inventoryMap[bg] = item.quantity;
        totalUnits += item.quantity;
      }

      const activeAlert = org.emergencyAlerts && org.emergencyAlerts.length > 0 ? org.emergencyAlerts[0] : null;

      let status: 'Available' | 'Emergency' | 'Low Stock' | 'Critical Shortage' = 'Available';
      if (activeAlert) {
        status = 'Emergency';
      } else if (totalUnits < 20) {
        status = 'Critical Shortage';
      } else if (totalUnits < 50) {
        status = 'Low Stock';
      }

      return {
        id: org.id,
        name: org.name,
        shortName: org.name.replace(/ Hospital| Blood Bank| Medical Center/gi, '').slice(0, 18),
        totalUnits,
        status,
        coordinates: coords,
        lat,
        lng,
        distance: formatDistanceDisplay(distanceKm),
        address: org.address,
        contactPhone: org.phone,
        lastInventoryUpdate: 'Live',
        activeRequests: org.emergencyAlerts.length,
        availableDonorsCount: 4,
        couriersInTransitCount: 1,
        inventory: inventoryMap,
        activeEmergencyDetails: activeAlert ? {
          bloodGroup: formatBloodGroup(activeAlert.bloodType),
          urgency: formatUrgencyLevel(activeAlert.urgency),
          situation: activeAlert.description,
          bagsNeeded: activeAlert.bagsNeeded,
        } : undefined,
      };
    });

    // 4. Format Safe Donor Markers based on User Role
    const radarDonors: any[] = [];

    if (user.role === Role.USER) {
      // Donors only see their own marker if they have coordinates
      const donorUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { donorProfile: true },
      });

      if (donorUser && isValidCoordinatePair(donorUser.latitude, donorUser.longitude)) {
        const coords = projectCoordinatesToRadar(donorUser.latitude, donorUser.longitude, centerLat, centerLng, radiusKm);
        const distKm = calculateHaversineDistanceKm(centerLat, centerLng, donorUser.latitude, donorUser.longitude);
        radarDonors.push({
          id: donorUser.id,
          bloodGroup: donorUser.donorProfile ? formatBloodGroup(donorUser.donorProfile.bloodGroup) : 'O+',
          status: donorUser.donorProfile?.isAvailableToDonate ? 'Available' : 'Resting',
          coordinates: coords,
          distance: formatDistanceDisplay(distKm),
          etaMinutes: 10,
          donorInitial: `${donorUser.name.split(' ').map(n => n[0]).join('. ')} (You)`,
          verified: true,
        });
      }
    } else if (user.role === Role.HOSPITAL || user.role === Role.BLOOD_BANK) {
      // Hospitals see donors matching or responding to their own active emergencies
      const managedOrg = await prisma.organization.findFirst({
        where: { userId: user.id },
      });

      if (managedOrg) {
        const orgEmergencies = activeEmergencies.filter(e => e.organizationId === managedOrg.id);
        for (const em of orgEmergencies) {
          const matchResult = await findPotentialDonorMatches(em.id, radiusKm);
          if (matchResult && matchResult.matches) {
            for (const match of matchResult.matches.slice(0, 8)) {
              // Approximate radar coords based on distance and radial angle
              const hash = match.donorId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
              const angle = (hash % 360) * (Math.PI / 180);
              const distRatio = Math.min(0.9, match.distanceKm / (radiusKm * 1.2));
              const x = Math.round(50 + Math.cos(angle) * distRatio * 40);
              const y = Math.round(50 + Math.sin(angle) * distRatio * 40);

              radarDonors.push({
                id: match.donorId,
                bloodGroup: match.bloodGroup,
                status: match.responseStatus === ResponseStatus.ACCEPTED ? 'En Route' : 'Available',
                coordinates: { x: Math.max(8, Math.min(92, x)), y: Math.max(8, Math.min(92, y)) },
                distance: match.distanceDisplay,
                etaMinutes: match.etaMinutes || Math.round(match.distanceKm * 3.5),
                donorInitial: match.donorName.split(' ').map(n => n[0]).join('. '),
                verified: true,
              });
            }
          }
        }
      }
    } else if (user.role === Role.SUPER_ADMIN) {
      // Super Admin sees active donor overview
      const activeDonors = await prisma.user.findMany({
        where: {
          role: Role.USER,
          status: 'ACTIVE',
          donorProfile: { isAvailableToDonate: true },
        },
        include: { donorProfile: true },
        take: 12,
      });

      for (const d of activeDonors) {
        if (isValidCoordinatePair(d.latitude, d.longitude)) {
          const coords = projectCoordinatesToRadar(d.latitude, d.longitude, centerLat, centerLng, radiusKm);
          const distKm = calculateHaversineDistanceKm(centerLat, centerLng, d.latitude, d.longitude);
          radarDonors.push({
            id: d.id,
            bloodGroup: d.donorProfile ? formatBloodGroup(d.donorProfile.bloodGroup) : 'O+',
            status: 'Available',
            coordinates: coords,
            distance: formatDistanceDisplay(distKm),
            etaMinutes: Math.round(distKm * 3.5),
            donorInitial: d.name.split(' ').map(n => n[0]).join('. '),
            verified: true,
          });
        }
      }
    }

    // 5. Build Emergency Geofence Indicators
    const geofences: any[] = activeEmergencies.map((em) => {
      const coords = em.organization && isValidCoordinatePair(em.organization.latitude, em.organization.longitude)
        ? projectCoordinatesToRadar(em.organization.latitude, em.organization.longitude, centerLat, centerLng, radiusKm)
        : { x: 58, y: 46 };

      return {
        id: `geo-${em.id}`,
        name: `${em.hospitalName} (${formatBloodGroup(em.bloodType)})`,
        type: em.urgency === 'CODE_RED' ? 'emergency_red' : 'standard_coverage',
        center: coords,
        radius: 70,
        label: `Active Zone: ${formatBloodGroup(em.bloodType)} Needed (${em.bagsNeeded} Bags)`,
      };
    });

    res.json({
      success: true,
      hospitals: radarHospitals,
      donors: radarDonors,
      couriers: [],
      geofences,
      center: { lat: centerLat, lng: centerLng },
      radiusKm,
    });
  } catch (error) {
    console.error('Error loading radar data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve radar data.',
    });
  }
});

export default router;
