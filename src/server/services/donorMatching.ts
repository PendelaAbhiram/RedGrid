import {
  Role,
  AccountStatus,
  EmergencyStatus,
  ResponseStatus,
} from '@prisma/client';
import { prisma } from '../prisma';
import { config } from '../config';
import {
  calculateHaversineDistanceKm,
  formatDistanceDisplay,
  isValidCoordinatePair,
} from '../utils/geo';
import { formatBloodGroup } from '../utils/bloodGroup';
import { formatUrgencyLevel } from '../validators/emergency';

export interface PotentialDonorMatchResult {
  donorId: string;
  donorName: string;
  bloodGroup: string;
  distanceKm: number;
  distanceDisplay: string;
  approximateLocation: string;
  availabilityStatus: boolean;
  responseStatus: string;
  etaMinutes: number | null;
  totalDonations: number;
  lastDonationDate: string | null;
}

export interface EmergencyMatchSummary {
  emergencyId: string;
  hospitalName: string;
  bloodGroup: string;
  urgency: string;
  emergencyStatus: string;
  radiusKm: number;
  geographicMatchingAvailable: boolean;
  potentialMatchesCount: number;
  matches: PotentialDonorMatchResult[];
  reason?: string;
}

export interface DonorMatchStatusResult {
  emergencyId: string;
  emergencyStatus: string;
  urgency: string;
  bloodGroup: string;
  isPotentialMatch: boolean;
  bloodGroupMatch: boolean;
  withinRadius: boolean;
  donorAvailable: boolean;
  userActive: boolean;
  emergencyActive: boolean;
  geographicMatchingAvailable: boolean;
  distanceKm: number | null;
  distanceDisplay: string;
  responseStatus: string;
  etaMinutes: number | null;
  reason?: string;
}

/**
 * Resolves the geographic coordinates of an emergency alert.
 * Looks in alert -> organization -> creator user in sequence.
 */
export function resolveEmergencyCoordinates(alert: any): { lat: number; lng: number } | null {
  if (isValidCoordinatePair(alert.latitude, alert.longitude)) {
    return { lat: alert.latitude, lng: alert.longitude };
  }
  if (alert.organization && isValidCoordinatePair(alert.organization.latitude, alert.organization.longitude)) {
    return { lat: alert.organization.latitude, lng: alert.organization.longitude };
  }
  if (alert.createdBy && isValidCoordinatePair(alert.createdBy.latitude, alert.createdBy.longitude)) {
    return { lat: alert.createdBy.latitude, lng: alert.createdBy.longitude };
  }
  return null;
}

/**
 * Finds potential donor matches for an emergency requirement.
 * 
 * Rules:
 * 1. Emergency must exist and be ACTIVE
 * 2. Donor User status must be ACTIVE
 * 3. DonorProfile.isAvailableToDonate must be true
 * 4. Blood group must match exactly
 * 5. Both emergency and donor must have valid geographic coordinates
 * 6. Haversine distance must be <= configured radius
 * 
 * Privacy Protection:
 * Exact coordinates, addresses, and full contact details of donors are omitted from result.
 */
export async function findPotentialDonorMatches(
  emergencyId: string,
  customRadiusKm?: number
): Promise<EmergencyMatchSummary | null> {
  const radiusKm = customRadiusKm && customRadiusKm > 0 ? customRadiusKm : config.donorMatchRadiusKm;

  // 1. Fetch Emergency Alert with Organization and Creator
  const alert = await prisma.emergencyAlert.findUnique({
    where: { id: emergencyId },
    include: {
      organization: true,
      createdBy: true,
      responses: {
        include: {
          donorUser: true,
        },
      },
    },
  });

  if (!alert) {
    return null;
  }

  const bloodGroupStr = formatBloodGroup(alert.bloodType);
  const urgencyStr = formatUrgencyLevel(alert.urgency);

  // If emergency is not ACTIVE, no active matching is performed
  if (alert.status !== EmergencyStatus.ACTIVE) {
    return {
      emergencyId: alert.id,
      hospitalName: alert.hospitalName,
      bloodGroup: bloodGroupStr,
      urgency: urgencyStr,
      emergencyStatus: alert.status,
      radiusKm,
      geographicMatchingAvailable: false,
      potentialMatchesCount: 0,
      matches: [],
      reason: `Emergency is currently ${alert.status}. Active potential donor matching is only available for ACTIVE emergencies.`,
    };
  }

  // 2. Resolve Emergency Coordinates
  const emergencyCoords = resolveEmergencyCoordinates(alert);
  if (!emergencyCoords) {
    return {
      emergencyId: alert.id,
      hospitalName: alert.hospitalName,
      bloodGroup: bloodGroupStr,
      urgency: urgencyStr,
      emergencyStatus: alert.status,
      radiusKm,
      geographicMatchingAvailable: false,
      potentialMatchesCount: 0,
      matches: [],
      reason: 'Geographic matching is unavailable because this emergency does not have valid location coordinates.',
    };
  }

  // 3. Query Active, Available Donors with Matching Blood Group
  const candidates = await prisma.user.findMany({
    where: {
      role: Role.USER,
      status: AccountStatus.ACTIVE,
      donorProfile: {
        isAvailableToDonate: true,
        bloodGroup: alert.bloodType,
      },
    },
    include: {
      donorProfile: true,
    },
  });

  // Map of existing donor responses for this emergency
  const responseMap = new Map<string, { status: ResponseStatus; etaMinutes: number | null }>();
  for (const resp of alert.responses || []) {
    responseMap.set(resp.donorUserId, {
      status: resp.status,
      etaMinutes: resp.etaMinutes,
    });
  }

  // 4. Filter Candidates by Valid Coordinates and Haversine Distance
  const matches: PotentialDonorMatchResult[] = [];

  for (const candidate of candidates) {
    // If candidate has no valid coordinates, skip distance-based matching (no fabrication)
    if (!isValidCoordinatePair(candidate.latitude, candidate.longitude)) {
      continue;
    }

    const distanceKm = calculateHaversineDistanceKm(
      emergencyCoords.lat,
      emergencyCoords.lng,
      candidate.latitude,
      candidate.longitude
    );

    if (distanceKm <= radiusKm) {
      const response = responseMap.get(candidate.id);
      let responseStatus = 'NONE';
      if (response) {
        responseStatus = response.status;
      }

      // Sanitize approximate location (city or general area)
      const approxLocation = candidate.locationCity || 'Metro Bay Area';

      matches.push({
        donorId: candidate.id,
        donorName: candidate.name,
        bloodGroup: bloodGroupStr,
        distanceKm,
        distanceDisplay: formatDistanceDisplay(distanceKm),
        approximateLocation: approxLocation,
        availabilityStatus: candidate.donorProfile?.isAvailableToDonate ?? true,
        responseStatus,
        etaMinutes: response?.etaMinutes ?? null,
        totalDonations: candidate.donorProfile?.totalDonations ?? 0,
        lastDonationDate: candidate.donorProfile?.lastDonationDate?.toISOString() ?? null,
      });
    }
  }

  // Sort matches by distance ascending (closest donor first)
  matches.sort((a, b) => a.distanceKm - b.distanceKm);

  return {
    emergencyId: alert.id,
    hospitalName: alert.hospitalName,
    bloodGroup: bloodGroupStr,
    urgency: urgencyStr,
    emergencyStatus: alert.status,
    radiusKm,
    geographicMatchingAvailable: true,
    potentialMatchesCount: matches.length,
    matches,
  };
}

/**
 * Checks potential match status for a single logged-in donor against a specific emergency.
 * Used by GET /api/emergencies/:id/match-status.
 * 
 * Strict Privacy: Does not expose information about any other donors.
 */
export async function checkDonorMatchStatus(
  emergencyId: string,
  donorUserId: string,
  customRadiusKm?: number
): Promise<DonorMatchStatusResult | null> {
  const radiusKm = customRadiusKm && customRadiusKm > 0 ? customRadiusKm : config.donorMatchRadiusKm;

  // 1. Fetch Emergency
  const alert = await prisma.emergencyAlert.findUnique({
    where: { id: emergencyId },
    include: {
      organization: true,
      createdBy: true,
      responses: {
        where: { donorUserId },
      },
    },
  });

  if (!alert) {
    return null;
  }

  // 2. Fetch Donor User
  const donorUser = await prisma.user.findUnique({
    where: { id: donorUserId },
    include: {
      donorProfile: true,
    },
  });

  if (!donorUser) {
    return null;
  }

  const bloodGroupStr = formatBloodGroup(alert.bloodType);
  const urgencyStr = formatUrgencyLevel(alert.urgency);
  const emergencyActive = alert.status === EmergencyStatus.ACTIVE;
  const userActive = donorUser.status === AccountStatus.ACTIVE;
  const donorAvailable = donorUser.donorProfile?.isAvailableToDonate === true;
  const bloodGroupMatch = donorUser.donorProfile?.bloodGroup === alert.bloodType;

  // Resolve coordinates
  const emergencyCoords = resolveEmergencyCoordinates(alert);
  const donorHasCoords = isValidCoordinatePair(donorUser.latitude, donorUser.longitude);
  const geographicMatchingAvailable = !!emergencyCoords && donorHasCoords;

  let distanceKm: number | null = null;
  let withinRadius = false;

  if (emergencyCoords && donorHasCoords) {
    distanceKm = calculateHaversineDistanceKm(
      emergencyCoords.lat,
      emergencyCoords.lng,
      donorUser.latitude!,
      donorUser.longitude!
    );
    withinRadius = distanceKm <= radiusKm;
  }

  const userResponse = alert.responses && alert.responses.length > 0 ? alert.responses[0] : null;
  const responseStatus = userResponse ? userResponse.status : 'NONE';
  const etaMinutes = userResponse?.etaMinutes ?? null;

  const isPotentialMatch =
    emergencyActive &&
    userActive &&
    donorAvailable &&
    bloodGroupMatch &&
    geographicMatchingAvailable &&
    withinRadius;

  return {
    emergencyId: alert.id,
    emergencyStatus: alert.status,
    urgency: urgencyStr,
    bloodGroup: bloodGroupStr,
    isPotentialMatch,
    bloodGroupMatch,
    withinRadius,
    donorAvailable,
    userActive,
    emergencyActive,
    geographicMatchingAvailable,
    distanceKm,
    distanceDisplay: distanceKm !== null ? formatDistanceDisplay(distanceKm) : 'Location unavailable',
    responseStatus,
    etaMinutes,
    reason: !emergencyActive
      ? `Emergency is ${alert.status}`
      : !userActive
      ? 'Account is not in active standing'
      : !donorAvailable
      ? 'Donor is currently unavailable for donation'
      : !bloodGroupMatch
      ? 'Blood group does not match emergency requirement'
      : !geographicMatchingAvailable
      ? 'Geographic location coordinates unavailable'
      : !withinRadius
      ? `Distance (${distanceKm !== null ? formatDistanceDisplay(distanceKm) : ''}) exceeds matching radius of ${radiusKm} km`
      : undefined,
  };
}
