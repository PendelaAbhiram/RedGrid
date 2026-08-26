import { BloodGroup } from '@prisma/client';
import { prisma } from '../prisma';

export const STRING_TO_BLOOD_GROUP: Record<string, BloodGroup> = {
  'A+': BloodGroup.A_POS,
  'A-': BloodGroup.A_NEG,
  'B+': BloodGroup.B_POS,
  'B-': BloodGroup.B_NEG,
  'AB+': BloodGroup.AB_POS,
  'AB-': BloodGroup.AB_NEG,
  'O+': BloodGroup.O_POS,
  'O-': BloodGroup.O_NEG,
  'A_POS': BloodGroup.A_POS,
  'A_NEG': BloodGroup.A_NEG,
  'B_POS': BloodGroup.B_POS,
  'B_NEG': BloodGroup.B_NEG,
  'AB_POS': BloodGroup.AB_POS,
  'AB_NEG': BloodGroup.AB_NEG,
  'O_POS': BloodGroup.O_POS,
  'O_NEG': BloodGroup.O_NEG,
};

export const BLOOD_GROUP_TO_STRING: Record<BloodGroup, string> = {
  [BloodGroup.A_POS]: 'A+',
  [BloodGroup.A_NEG]: 'A-',
  [BloodGroup.B_POS]: 'B+',
  [BloodGroup.B_NEG]: 'B-',
  [BloodGroup.AB_POS]: 'AB+',
  [BloodGroup.AB_NEG]: 'AB-',
  [BloodGroup.O_POS]: 'O+',
  [BloodGroup.O_NEG]: 'O-',
};

export const ALL_BLOOD_GROUPS: BloodGroup[] = [
  BloodGroup.A_POS,
  BloodGroup.A_NEG,
  BloodGroup.B_POS,
  BloodGroup.B_NEG,
  BloodGroup.AB_POS,
  BloodGroup.AB_NEG,
  BloodGroup.O_POS,
  BloodGroup.O_NEG,
];

export const ALL_BLOOD_GROUP_STRINGS: string[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/**
 * Normalizes input string to Prisma BloodGroup enum.
 * Supports "A+", "a+", "A_POS", "a_pos", etc.
 */
export function parseBloodGroup(input: string): BloodGroup | null {
  if (!input) return null;
  const trimmed = input.trim().toUpperCase();
  return STRING_TO_BLOOD_GROUP[trimmed] || null;
}

/**
 * Converts a Prisma BloodGroup enum to standard UI string format (e.g. A_POS -> "A+").
 */
export function formatBloodGroup(bg: BloodGroup): string {
  return BLOOD_GROUP_TO_STRING[bg] || (bg as string);
}

/**
 * Ensures all 8 blood groups exist for an organization with default quantity 0.
 * Safely ignores already existing groups.
 */
export async function ensureOrganizationInventories(
  organizationId: string,
  txClient?: any
): Promise<void> {
  const db = txClient || prisma;
  const existing = await db.bloodInventory.findMany({
    where: { organizationId },
    select: { bloodGroup: true },
  });

  const existingGroups = new Set(existing.map((item: { bloodGroup: BloodGroup }) => item.bloodGroup));
  const missingGroups = ALL_BLOOD_GROUPS.filter((bg) => !existingGroups.has(bg));

  if (missingGroups.length > 0) {
    await db.bloodInventory.createMany({
      data: missingGroups.map((bg) => ({
        organizationId,
        bloodGroup: bg,
        quantity: 0,
      })),
      skipDuplicates: true,
    });
  }
}
