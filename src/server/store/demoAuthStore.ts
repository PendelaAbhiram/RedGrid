import bcrypt from 'bcryptjs';
import { Role, AccountStatus, OrganizationStatus, BloodGroup } from '@prisma/client';

export interface InMemoryUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone?: string | null;
  role: Role;
  status: AccountStatus;
  banReason?: string | null;
  donorProfile?: {
    id: string;
    bloodGroup: BloodGroup;
    isAvailableToDonate: boolean;
    totalDonations: number;
    livesImpacted: number;
  } | null;
  managedOrganizations?: {
    id: string;
    name: string;
    type: string;
    status: OrganizationStatus;
    rejectionReason?: string | null;
  }[];
}

// Pre-hashed passwords using bcrypt (cost factor 10)
// 'user123' -> $2a$10$wN1GzUfZwFwG...
// 'hospital123' -> $2a$10$...
// 'bloodbank123' -> $2a$10$...
// 'admin123' -> $2a$10$...
const HASH_USER123 = bcrypt.hashSync('user123', 10);
const HASH_HOSPITAL123 = bcrypt.hashSync('hospital123', 10);
const HASH_BLOODBANK123 = bcrypt.hashSync('bloodbank123', 10);
const HASH_ADMIN123 = bcrypt.hashSync('admin123', 10);

export const inMemoryUsers: InMemoryUser[] = [
  {
    id: 'usr-demo-001',
    name: 'Abhiram Pendela',
    email: 'user@redgrid.com',
    passwordHash: HASH_USER123,
    phone: '+1 (555) 019-2834',
    role: Role.USER,
    status: AccountStatus.ACTIVE,
    donorProfile: {
      id: 'donor-001',
      bloodGroup: BloodGroup.O_POS,
      isAvailableToDonate: true,
      totalDonations: 7,
      livesImpacted: 21,
    },
  },
  {
    id: 'usr-demo-002',
    name: 'Apollo Care Hospital Admin',
    email: 'apollo@carehospital.org',
    passwordHash: HASH_HOSPITAL123,
    phone: '+1 (555) 902-1144',
    role: Role.HOSPITAL,
    status: AccountStatus.ACTIVE,
    managedOrganizations: [
      {
        id: 'org-001',
        name: 'Apollo Care Hospital',
        type: 'HOSPITAL',
        status: OrganizationStatus.APPROVED,
      },
    ],
  },
  {
    id: 'usr-demo-003',
    name: 'City Central Blood Bank',
    email: 'city@bloodbank.org',
    passwordHash: HASH_BLOODBANK123,
    phone: '+1 (555) 301-4499',
    role: Role.BLOOD_BANK,
    status: AccountStatus.ACTIVE,
    managedOrganizations: [
      {
        id: 'org-002',
        name: 'City Blood Bank',
        type: 'BLOOD_BANK',
        status: OrganizationStatus.APPROVED,
      },
    ],
  },
  {
    id: 'usr-demo-004',
    name: 'Dr. Sarah Jenkins',
    email: 'admin@redgrid.com',
    passwordHash: HASH_ADMIN123,
    phone: '+1 (555) 888-0000',
    role: Role.SUPER_ADMIN,
    status: AccountStatus.ACTIVE,
  },
  // Security test accounts
  {
    id: 'usr-demo-banned',
    name: 'Banned Test User',
    email: 'banned@redgrid.com',
    passwordHash: HASH_USER123,
    role: Role.USER,
    status: AccountStatus.BANNED,
    banReason: 'Repeated non-attendance and malicious emergency flag triggering.',
  },
  {
    id: 'usr-demo-suspended',
    name: 'Suspended Test User',
    email: 'suspended@redgrid.com',
    passwordHash: HASH_USER123,
    role: Role.USER,
    status: AccountStatus.SUSPENDED,
  },
  {
    id: 'usr-demo-pending-org',
    name: 'Metro Trauma Center',
    email: 'pending@carehospital.org',
    passwordHash: HASH_HOSPITAL123,
    role: Role.HOSPITAL,
    status: AccountStatus.ACTIVE,
    managedOrganizations: [
      {
        id: 'org-pending-01',
        name: 'Metro Trauma Center',
        type: 'HOSPITAL',
        status: OrganizationStatus.PENDING,
      },
    ],
  },
  {
    id: 'usr-demo-rejected-org',
    name: 'Unverified Clinic',
    email: 'rejected@carehospital.org',
    passwordHash: HASH_HOSPITAL123,
    role: Role.HOSPITAL,
    status: AccountStatus.ACTIVE,
    managedOrganizations: [
      {
        id: 'org-rejected-01',
        name: 'Unverified Clinic',
        type: 'HOSPITAL',
        status: OrganizationStatus.REJECTED,
        rejectionReason: 'Invalid medical license number.',
      },
    ],
  },
];
