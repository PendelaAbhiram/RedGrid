import { z } from 'zod';
import { BloodGroup, UrgencyLevel, EmergencyCategory, EmergencyStatus, ResponseStatus } from '@prisma/client';
import { parseBloodGroup } from '../utils/bloodGroup';

/**
 * Parses and maps urgency level string / enum to Prisma UrgencyLevel enum.
 */
export function parseUrgencyLevel(input: string): UrgencyLevel | null {
  if (!input) return null;
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();
  
  if (lower.includes('code red') || lower.includes('urgent') || lower === 'code_red') {
    return UrgencyLevel.CODE_RED;
  }
  if (lower === 'high' || lower === 'high priority') {
    return UrgencyLevel.HIGH;
  }
  if (lower === 'moderate' || lower === 'medium' || lower === 'standard') {
    return UrgencyLevel.MODERATE;
  }
  
  // Direct enum key check
  if (trimmed in UrgencyLevel) {
    return UrgencyLevel[trimmed as keyof typeof UrgencyLevel];
  }
  return null;
}

/**
 * Formats Prisma UrgencyLevel enum to UI-friendly string.
 */
export function formatUrgencyLevel(urgency: UrgencyLevel): string {
  switch (urgency) {
    case UrgencyLevel.CODE_RED:
      return 'Code Red: Urgent';
    case UrgencyLevel.HIGH:
      return 'High';
    case UrgencyLevel.MODERATE:
      return 'Moderate';
    default:
      return urgency as string;
  }
}

/**
 * Parses and maps emergency category string / enum to Prisma EmergencyCategory enum.
 */
export function parseEmergencyCategory(input: string): EmergencyCategory | null {
  if (!input) return null;
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  if (lower.includes('pediatric')) {
    return EmergencyCategory.PEDIATRIC_TRAUMA;
  }
  if (lower.includes('trauma')) {
    return EmergencyCategory.TRAUMA;
  }
  if (lower.includes('platelet') || lower.includes('oncology')) {
    return EmergencyCategory.PLATELET_ONCOLOGY;
  }
  if (lower.includes('postpartum') || lower.includes('maternity')) {
    return EmergencyCategory.POSTPARTUM;
  }
  if (lower.includes('surgical') || lower.includes('surgery')) {
    return EmergencyCategory.SURGICAL;
  }

  if (trimmed in EmergencyCategory) {
    return EmergencyCategory[trimmed as keyof typeof EmergencyCategory];
  }
  return null;
}

/**
 * Formats Prisma EmergencyCategory enum to UI-friendly string.
 */
export function formatEmergencyCategory(cat: EmergencyCategory): string {
  switch (cat) {
    case EmergencyCategory.TRAUMA:
      return 'Trauma';
    case EmergencyCategory.PEDIATRIC_TRAUMA:
      return 'Pediatric Trauma';
    case EmergencyCategory.PLATELET_ONCOLOGY:
      return 'Platelet/Oncology';
    case EmergencyCategory.POSTPARTUM:
      return 'Postpartum';
    case EmergencyCategory.SURGICAL:
      return 'Surgical';
    default:
      return cat as string;
  }
}

/**
 * Maps donor response status string to Prisma ResponseStatus enum.
 */
export function parseResponseStatus(input: string): ResponseStatus | null {
  if (!input) return null;
  const lower = input.trim().toLowerCase();

  if (lower === 'going' || lower === 'accepted' || lower === 'yes' || lower === 'on_the_way' || lower === 'en_route') {
    return ResponseStatus.ACCEPTED;
  }
  if (lower === 'not_available' || lower === 'declined' || lower === 'no' || lower === 'unavailable') {
    return ResponseStatus.DECLINED;
  }
  if (lower === 'arrived' || lower === 'at_reception') {
    return ResponseStatus.ARRIVED;
  }
  if (lower === 'completed' || lower === 'donated') {
    return ResponseStatus.COMPLETED;
  }

  const upper = input.trim().toUpperCase();
  if (upper in ResponseStatus) {
    return ResponseStatus[upper as keyof typeof ResponseStatus];
  }
  return null;
}

/**
 * Formats ResponseStatus enum for UI representation.
 */
export function formatResponseStatus(status: ResponseStatus): string {
  switch (status) {
    case ResponseStatus.ACCEPTED:
      return 'En Route';
    case ResponseStatus.DECLINED:
      return 'Unavailable';
    case ResponseStatus.ARRIVED:
      return 'Arrived at Reception';
    case ResponseStatus.COMPLETED:
      return 'Confirmed Donation';
    default:
      return status as string;
  }
}

/**
 * Zod schema for creating a new Emergency Alert.
 */
export const createEmergencySchema = z.object({
  bloodGroup: z.string().optional(),
  bloodType: z.string().optional(),
  bagsNeeded: z.coerce.number().int().min(1, 'At least 1 blood bag must be requested').max(50, 'Cannot request more than 50 bags per emergency requirement').optional(),
  bagsRequired: z.coerce.number().int().min(1, 'At least 1 blood bag must be requested').max(50, 'Cannot request more than 50 bags per emergency requirement').optional(),
  urgency: z.string().min(1, 'Urgency level is required'),
  category: z.string().optional().default('Trauma'),
  hospitalName: z.string().min(1, 'Hospital name is required').optional(),
  department: z.string().optional().default('Critical Care / Emergency Bay'),
  address: z.string().optional(),
  description: z.string().min(3, 'Clinical description must be at least 3 characters'),
  patientInitials: z.string().optional().default('P. M.'),
  patientAge: z.coerce.number().int().min(0).max(130).optional(),
  contactPhone: z.string().optional(),
  criticalNote: z.string().optional(),
  organizationId: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
}).refine(
  (data) => !!(data.bloodGroup || data.bloodType),
  { message: 'bloodGroup or bloodType is required' }
).refine(
  (data) => (data.bagsNeeded !== undefined && data.bagsNeeded > 0) || (data.bagsRequired !== undefined && data.bagsRequired > 0),
  { message: 'bagsNeeded or bagsRequired must be at least 1' }
);

/**
 * Zod schema for updating an existing Emergency Alert.
 */
export const updateEmergencySchema = z.object({
  bagsNeeded: z.coerce.number().int().min(1).max(50).optional(),
  bagsRequired: z.coerce.number().int().min(1).max(50).optional(),
  bagsFulfilled: z.coerce.number().int().min(0).max(50).optional(),
  urgency: z.string().optional(),
  category: z.string().optional(),
  department: z.string().optional(),
  description: z.string().min(3).optional(),
  contactPhone: z.string().optional(),
  criticalNote: z.string().optional(),
  status: z.enum(['ACTIVE', 'FULFILLED', 'CANCELLED', 'active', 'fulfilled', 'cancelled']).optional(),
});

/**
 * Zod schema for donor responding to an emergency.
 */
export const respondEmergencySchema = z.object({
  status: z.string().min(1, 'Response status is required (e.g., GOING or NOT_AVAILABLE)'),
  etaMinutes: z.coerce.number().int().min(1).max(300).optional(),
});

/**
 * Zod schema for filtering emergency alerts.
 */
export const emergencyQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'FULFILLED', 'CANCELLED', 'ALL', 'active', 'fulfilled', 'cancelled', 'all']).optional(),
  bloodGroup: z.string().optional(),
  bloodType: z.string().optional(),
  urgency: z.string().optional(),
  my: z.enum(['true', 'false', '1', '0']).optional(),
  matched: z.enum(['true', 'false', '1', '0']).optional(),
});
