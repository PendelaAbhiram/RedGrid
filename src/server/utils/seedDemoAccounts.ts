import { Role, AccountStatus, OrganizationStatus, OrganizationType, BloodGroup } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';

const HASH_USER123 = bcrypt.hashSync('user123', 10);
const HASH_HOSPITAL123 = bcrypt.hashSync('hospital123', 10);
const HASH_BLOODBANK123 = bcrypt.hashSync('bloodbank123', 10);
const HASH_ADMIN123 = bcrypt.hashSync('admin123', 10);

const ALL_BLOOD_GROUPS: BloodGroup[] = [
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
 * Idempotently ensures all default demo accounts exist in PostgreSQL
 * with real UUID primary keys and proper relational associations.
 * Does NOT overwrite or truncate existing production data.
 */
export async function seedAllDemoAccountsIfMissing(): Promise<void> {
  try {
    // 1. Citizen / Donor: user@redgrid.com
    const existingUser = await prisma.user.findUnique({
      where: { email: 'user@redgrid.com' },
      include: { donorProfile: true },
    });

    if (!existingUser) {
      const createdUser = await prisma.user.create({
        data: {
          name: 'Abhiram Pendela',
          email: 'user@redgrid.com',
          passwordHash: HASH_USER123,
          phone: '+1 (555) 019-2834',
          role: Role.USER,
          status: AccountStatus.ACTIVE,
          locationAddress: '550 Mission St, Financial District',
          locationCity: 'San Francisco',
          latitude: 37.7891,
          longitude: -122.3998,
          donorProfile: {
            create: {
              bloodGroup: BloodGroup.O_POS,
              isAvailableToDonate: true,
              totalDonations: 7,
              livesImpacted: 21,
            },
          },
        },
      });
      console.log(`[SEED] Created default Citizen Donor account: ${createdUser.email} (${createdUser.id})`);
    }

    // 2. Hospital Administrator: apollo@carehospital.org
    const existingHospUser = await prisma.user.findUnique({
      where: { email: 'apollo@carehospital.org' },
      include: { managedOrganizations: true },
    });

    let hospitalUserId = existingHospUser?.id;
    if (!existingHospUser) {
      const createdHospUser = await prisma.user.create({
        data: {
          name: 'Apollo Care Hospital Admin',
          email: 'apollo@carehospital.org',
          passwordHash: HASH_HOSPITAL123,
          phone: '+1 (555) 902-1144',
          role: Role.HOSPITAL,
          status: AccountStatus.ACTIVE,
          locationAddress: '742 Evergreen Terrace, Medical Enclave',
          locationCity: 'San Francisco',
          latitude: 37.7749,
          longitude: -122.4194,
        },
      });
      hospitalUserId = createdHospUser.id;
      console.log(`[SEED] Created default Hospital Admin user: ${createdHospUser.email} (${createdHospUser.id})`);
    }

    // Check Hospital Organization
    const existingHospOrg = await prisma.organization.findUnique({
      where: { registrationNumber: 'HOSP-APOLLO-001' },
    });

    if (!existingHospOrg && hospitalUserId) {
      await prisma.organization.create({
        data: {
          userId: hospitalUserId,
          name: 'Apollo Care Hospital',
          type: OrganizationType.HOSPITAL,
          registrationNumber: 'HOSP-APOLLO-001',
          email: 'apollo@carehospital.org',
          phone: '+1 (555) 902-1144',
          address: '742 Evergreen Terrace, Medical Enclave',
          city: 'San Francisco',
          state: 'CA',
          pincode: '94103',
          contactPerson: 'Apollo Care Hospital Admin',
          contactPersonDesignation: 'Medical Director',
          facilityType: 'Trauma & Acute Clinical Care',
          status: OrganizationStatus.APPROVED,
          verifiedAt: new Date(),
          latitude: 37.7749,
          longitude: -122.4194,
          inventories: {
            create: ALL_BLOOD_GROUPS.map((bg) => ({
              bloodGroup: bg,
              quantity: bg === BloodGroup.O_POS ? 20 : bg === BloodGroup.A_POS ? 15 : bg === BloodGroup.B_POS ? 10 : 5,
            })),
          },
        },
      });
      console.log(`[SEED] Created default Hospital Organization: Apollo Care Hospital linked to User ${hospitalUserId}`);
    }

    // 3. Blood Bank Administrator: city@bloodbank.org
    const existingBBUser = await prisma.user.findUnique({
      where: { email: 'city@bloodbank.org' },
      include: { managedOrganizations: true },
    });

    let bbUserId = existingBBUser?.id;
    if (!existingBBUser) {
      const createdBBUser = await prisma.user.create({
        data: {
          name: 'City Central Blood Bank Admin',
          email: 'city@bloodbank.org',
          passwordHash: HASH_BLOODBANK123,
          phone: '+1 (555) 301-4499',
          role: Role.BLOOD_BANK,
          status: AccountStatus.ACTIVE,
          locationAddress: '100 Central Logistics Way',
          locationCity: 'San Francisco',
          latitude: 37.7833,
          longitude: -122.4167,
        },
      });
      bbUserId = createdBBUser.id;
      console.log(`[SEED] Created default Blood Bank Admin user: ${createdBBUser.email} (${createdBBUser.id})`);
    }

    // Check Blood Bank Organization
    const existingBBOrg = await prisma.organization.findUnique({
      where: { registrationNumber: 'BB-CITY-001' },
    });

    if (!existingBBOrg && bbUserId) {
      await prisma.organization.create({
        data: {
          userId: bbUserId,
          name: 'City Blood Bank',
          type: OrganizationType.BLOOD_BANK,
          registrationNumber: 'BB-CITY-001',
          email: 'city@bloodbank.org',
          phone: '+1 (555) 301-4499',
          address: '100 Central Logistics Way',
          city: 'San Francisco',
          state: 'CA',
          pincode: '94107',
          contactPerson: 'City Central Blood Bank Admin',
          contactPersonDesignation: 'Chief Logistics Officer',
          facilityType: 'Regional Cold-Chain Storage',
          status: OrganizationStatus.APPROVED,
          verifiedAt: new Date(),
          latitude: 37.7833,
          longitude: -122.4167,
          inventories: {
            create: ALL_BLOOD_GROUPS.map((bg) => ({
              bloodGroup: bg,
              quantity: bg === BloodGroup.O_POS ? 45 : bg === BloodGroup.A_POS ? 30 : bg === BloodGroup.B_POS ? 25 : 12,
            })),
          },
        },
      });
      console.log(`[SEED] Created default Blood Bank Organization: City Blood Bank linked to User ${bbUserId}`);
    }

    // 4. Super Admin: admin@redgrid.com
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@redgrid.com' },
    });

    if (!existingAdmin) {
      const createdAdmin = await prisma.user.create({
        data: {
          name: 'Dr. Sarah Jenkins',
          email: 'admin@redgrid.com',
          passwordHash: HASH_ADMIN123,
          phone: '+1 (555) 888-0000',
          role: Role.SUPER_ADMIN,
          status: AccountStatus.ACTIVE,
        },
      });
      console.log(`[SEED] Created default Super Admin user: ${createdAdmin.email} (${createdAdmin.id})`);
    }

    // 5. Test Accounts for Security Verification
    // Banned user
    const existingBanned = await prisma.user.findUnique({ where: { email: 'banned@redgrid.com' } });
    if (!existingBanned) {
      await prisma.user.create({
        data: {
          name: 'Banned Test User',
          email: 'banned@redgrid.com',
          passwordHash: HASH_USER123,
          role: Role.USER,
          status: AccountStatus.BANNED,
          banReason: 'Repeated non-attendance and malicious emergency flag triggering.',
        },
      });
    }

    // Suspended user
    const existingSuspended = await prisma.user.findUnique({ where: { email: 'suspended@redgrid.com' } });
    if (!existingSuspended) {
      await prisma.user.create({
        data: {
          name: 'Suspended Test User',
          email: 'suspended@redgrid.com',
          passwordHash: HASH_USER123,
          role: Role.USER,
          status: AccountStatus.SUSPENDED,
        },
      });
    }
  } catch (err) {
    console.warn('[SEED] Non-fatal notice during seed check:', err instanceof Error ? err.message : err);
  }
}
