import {
  Role,
  AccountStatus,
  OrganizationStatus,
  BloodGroup,
  UrgencyLevel,
  EmergencyCategory,
  EmergencyStatus,
  ResponseStatus,
  ActivityCategory,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { config } from '../config';

const JWT_SECRET = config.jwtSecret;
const BASE_URL = 'http://localhost:3000';

interface TestResult {
  testNumber: number;
  name: string;
  expected: string;
  actual: string;
  status: 'PASS' | 'FAIL';
  details?: any;
}

const results: TestResult[] = [];

function recordResult(
  testNumber: number,
  name: string,
  expected: string,
  actual: string,
  passed: boolean,
  details?: any
) {
  results.push({
    testNumber,
    name,
    expected,
    actual,
    status: passed ? 'PASS' : 'FAIL',
    details,
  });
  console.log(
    `[TEST ${testNumber}] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} -> Expected: "${expected}", Actual: "${actual}"`
  );
}

function makeToken(userId: string, role: Role, email: string) {
  return jwt.sign({ userId, role, email }, JWT_SECRET, { expiresIn: '1h' });
}

async function runValidation() {
  console.log('=== STARTING REDGRID PHASE 5 VALIDATION AGAINST LIVE NEON POSTGRESQL ===\n');

  console.log('Preparing test fixtures in PostgreSQL...');
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Regular Donor User
  const donorUser = await prisma.user.upsert({
    where: { email: 'val_phase5_donor@redgrid.com' },
    update: { role: Role.USER, status: AccountStatus.ACTIVE },
    create: {
      email: 'val_phase5_donor@redgrid.com',
      passwordHash,
      name: 'Elena Rostova (Donor)',
      role: Role.USER,
      status: AccountStatus.ACTIVE,
      phone: '+1 (555) 234-8901',
    },
  });

  // Ensure donor profile
  await prisma.donorProfile.upsert({
    where: { userId: donorUser.id },
    update: { isAvailableToDonate: true, bloodGroup: BloodGroup.O_NEG },
    create: {
      userId: donorUser.id,
      bloodGroup: BloodGroup.O_NEG,
      isAvailableToDonate: true,
      emergencyContactPhone: '+1 (555) 234-8901',
    },
  });

  // 2. Unavailable Donor User
  const unavailableDonor = await prisma.user.upsert({
    where: { email: 'val_phase5_unavail_donor@redgrid.com' },
    update: { role: Role.USER, status: AccountStatus.ACTIVE },
    create: {
      email: 'val_phase5_unavail_donor@redgrid.com',
      passwordHash,
      name: 'Unavailable Donor',
      role: Role.USER,
      status: AccountStatus.ACTIVE,
      phone: '+1 (555) 999-0000',
    },
  });

  await prisma.donorProfile.upsert({
    where: { userId: unavailableDonor.id },
    update: { isAvailableToDonate: false, bloodGroup: BloodGroup.A_POS },
    create: {
      userId: unavailableDonor.id,
      bloodGroup: BloodGroup.A_POS,
      isAvailableToDonate: false,
      emergencyContactPhone: '+1 (555) 999-0000',
    },
  });

  // 3. Hospital A User & Org
  const hospAUser = await prisma.user.upsert({
    where: { email: 'val_phase5_hosp_a@redgrid.com' },
    update: { role: Role.HOSPITAL, status: AccountStatus.ACTIVE },
    create: {
      email: 'val_phase5_hosp_a@redgrid.com',
      passwordHash,
      name: 'Dr. Sarah (Apollo Care Hospital)',
      role: Role.HOSPITAL,
      status: AccountStatus.ACTIVE,
      phone: '+1 (555) 111-2222',
    },
  });

  const hospAOrg = await prisma.organization.upsert({
    where: { registrationNumber: 'VAL-HOSP-A-001' },
    update: { status: OrganizationStatus.APPROVED, userId: hospAUser.id },
    create: {
      name: 'Apollo Care Hospital (Phase 5)',
      type: 'HOSPITAL',
      registrationNumber: 'VAL-HOSP-A-001',
      email: 'apollo_phase5@redgrid.com',
      phone: '+1 (555) 111-2222',
      address: '742 Evergreen Terrace',
      city: 'San Francisco',
      contactPerson: 'Dr. Sarah',
      status: OrganizationStatus.APPROVED,
      userId: hospAUser.id,
    },
  });

  // 4. Hospital B User & Org
  const hospBUser = await prisma.user.upsert({
    where: { email: 'val_phase5_hosp_b@redgrid.com' },
    update: { role: Role.HOSPITAL, status: AccountStatus.ACTIVE },
    create: {
      email: 'val_phase5_hosp_b@redgrid.com',
      passwordHash,
      name: 'Dr. John (St. Jude Medical)',
      role: Role.HOSPITAL,
      status: AccountStatus.ACTIVE,
      phone: '+1 (555) 333-4444',
    },
  });

  const hospBOrg = await prisma.organization.upsert({
    where: { registrationNumber: 'VAL-HOSP-B-002' },
    update: { status: OrganizationStatus.APPROVED, userId: hospBUser.id },
    create: {
      name: 'St. Jude Medical (Phase 5)',
      type: 'HOSPITAL',
      registrationNumber: 'VAL-HOSP-B-002',
      email: 'stjude_phase5@redgrid.com',
      phone: '+1 (555) 333-4444',
      address: '100 Medical Plaza',
      city: 'San Francisco',
      contactPerson: 'Dr. John',
      status: OrganizationStatus.APPROVED,
      userId: hospBUser.id,
    },
  });

  // 5. Blood Bank User & Org
  const bloodBankUser = await prisma.user.upsert({
    where: { email: 'val_phase5_bb@redgrid.com' },
    update: { role: Role.BLOOD_BANK, status: AccountStatus.ACTIVE },
    create: {
      email: 'val_phase5_bb@redgrid.com',
      passwordHash,
      name: 'Regional Red Cross Director',
      role: Role.BLOOD_BANK,
      status: AccountStatus.ACTIVE,
      phone: '+1 (555) 555-6666',
    },
  });

  const bbOrg = await prisma.organization.upsert({
    where: { registrationNumber: 'VAL-BB-003' },
    update: { status: OrganizationStatus.APPROVED, userId: bloodBankUser.id },
    create: {
      name: 'Bay Area Central Blood Reserve',
      type: 'BLOOD_BANK',
      registrationNumber: 'VAL-BB-003',
      email: 'bayreserve_phase5@redgrid.com',
      phone: '+1 (555) 555-6666',
      address: '500 Logistics Way',
      city: 'San Francisco',
      contactPerson: 'Regional Director',
      status: OrganizationStatus.APPROVED,
      userId: bloodBankUser.id,
    },
  });

  // 6. Super Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'val_phase5_admin@redgrid.com' },
    update: { role: Role.SUPER_ADMIN, status: AccountStatus.ACTIVE },
    create: {
      email: 'val_phase5_admin@redgrid.com',
      passwordHash,
      name: 'Dr. Jenkins (Super Admin)',
      role: Role.SUPER_ADMIN,
      status: AccountStatus.ACTIVE,
    },
  });

  const donorToken = makeToken(donorUser.id, Role.USER, donorUser.email);
  const unavailDonorToken = makeToken(unavailableDonor.id, Role.USER, unavailableDonor.email);
  const hospAToken = makeToken(hospAUser.id, Role.HOSPITAL, hospAUser.email);
  const hospBToken = makeToken(hospBUser.id, Role.HOSPITAL, hospBUser.email);
  const bbToken = makeToken(bloodBankUser.id, Role.BLOOD_BANK, bloodBankUser.email);
  const adminToken = makeToken(adminUser.id, Role.SUPER_ADMIN, adminUser.email);

  console.log('Fixtures prepared. Running test suite...\n');

  // TEST 1: Unauthenticated Guard
  try {
    const res = await fetch(`${BASE_URL}/api/emergencies`);
    recordResult(
      1,
      'Unauthenticated GET /api/emergencies must return 401 Unauthorized',
      '401 Unauthorized',
      `${res.status} ${res.statusText}`,
      res.status === 401
    );
  } catch (err: any) {
    recordResult(1, 'Unauthenticated GET /api/emergencies', '401', err.message, false);
  }

  // TEST 2: USER Cannot Create Official Emergency
  try {
    const res = await fetch(`${BASE_URL}/api/emergencies`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${donorToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bloodGroup: 'O-',
        bagsNeeded: 2,
        urgency: 'Code Red: Urgent',
        description: 'Donor trying to broadcast hospital emergency',
      }),
    });
    const data = await res.json();
    recordResult(
      2,
      'USER (Donor) creating emergency must return 403 Forbidden',
      '403 Forbidden',
      `${res.status} ${data.message || ''}`,
      res.status === 403
    );
  } catch (err: any) {
    recordResult(2, 'USER creating emergency', '403', err.message, false);
  }

  // TEST 3: Hospital A Can Create Emergency Requirement
  let createdAlertAId = '';
  try {
    const res = await fetch(`${BASE_URL}/api/emergencies`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hospAToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bloodGroup: 'O-',
        bagsNeeded: 4,
        urgency: 'Code Red: Urgent',
        category: 'Trauma',
        department: 'Trauma Bay 1',
        description: 'Critical multitrauma transfusion unit required immediately.',
        patientInitials: 'M. T.',
        patientAge: 35,
      }),
    });
    const data = await res.json();
    const isSuccess = res.status === 201 && data.success && data.emergency?.status === 'ACTIVE';
    if (data.emergency?.id) {
      createdAlertAId = data.emergency.id;
    }
    recordResult(
      3,
      'HOSPITAL A creates emergency requirement (O-, 4 Bags, Code Red)',
      '201 Created with ACTIVE status',
      `${res.status} id=${createdAlertAId}, status=${data.emergency?.status}, org=${data.emergency?.organizationId}`,
      isSuccess && data.emergency?.organizationId === hospAOrg.id
    );
  } catch (err: any) {
    recordResult(3, 'Hospital A creates emergency', '201', err.message, false);
  }

  // TEST 4: Blood Bank Can Create Emergency Requirement
  let createdAlertBBId = '';
  try {
    const res = await fetch(`${BASE_URL}/api/emergencies`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bbToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bloodGroup: 'B+',
        bagsNeeded: 10,
        urgency: 'High',
        category: 'Platelet/Oncology',
        department: 'Regional Cold Storage',
        description: 'Critical reserve deficit for pediatric oncology ward.',
      }),
    });
    const data = await res.json();
    if (data.emergency?.id) createdAlertBBId = data.emergency.id;
    recordResult(
      4,
      'BLOOD_BANK creates emergency requirement (B+, 10 Bags, High)',
      '201 Created with ACTIVE status',
      `${res.status} id=${createdAlertBBId}, status=${data.emergency?.status}`,
      res.status === 201 && data.success
    );
  } catch (err: any) {
    recordResult(4, 'Blood Bank creates emergency', '201', err.message, false);
  }

  // TEST 5: Zod Validation Rejection (Invalid Blood Group & Negative Bags)
  try {
    const res = await fetch(`${BASE_URL}/api/emergencies`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hospAToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bloodGroup: 'INVALID_GROUP',
        bagsNeeded: -5,
        urgency: 'High',
        description: 'Invalid data',
      }),
    });
    recordResult(
      5,
      'Zod Schema Rejection on invalid blood group / negative bags',
      '400 Bad Request',
      `${res.status} ${res.statusText}`,
      res.status === 400
    );
  } catch (err: any) {
    recordResult(5, 'Zod validation rejection', '400', err.message, false);
  }

  // TEST 6: Hospital B Cannot Modify Hospital A's Emergency (Ownership Isolation)
  try {
    const res = await fetch(`${BASE_URL}/api/emergencies/${createdAlertAId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${hospBToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bagsNeeded: 1,
        description: 'Malicious modification attempt by different hospital',
      }),
    });
    const data = await res.json();
    recordResult(
      6,
      'Hospital B attempting to modify Hospital A emergency returns 403 Forbidden',
      '403 Forbidden',
      `${res.status} ${data.message || ''}`,
      res.status === 403
    );
  } catch (err: any) {
    recordResult(6, 'Cross-org modification guard', '403', err.message, false);
  }

  // TEST 7: Super Admin Can Modify Any Emergency
  try {
    const res = await fetch(`${BASE_URL}/api/emergencies/${createdAlertAId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        criticalNote: 'Super Admin verified priority case.',
      }),
    });
    const data = await res.json();
    recordResult(
      7,
      'Super Admin modifying emergency succeeds',
      '200 OK with updated fields',
      `${res.status} note=${data.emergency?.criticalNote}`,
      res.status === 200 && data.success && data.emergency?.criticalNote?.includes('Super Admin verified')
    );
  } catch (err: any) {
    recordResult(7, 'Super Admin emergency update', '200', err.message, false);
  }

  // TEST 8: USER Can View Active Emergencies Network-Wide
  try {
    const res = await fetch(`${BASE_URL}/api/emergencies`, {
      headers: { Authorization: `Bearer ${donorToken}` },
    });
    const data = await res.json();
    const foundAlert = data.emergencies?.find((e: any) => e.id === createdAlertAId);
    recordResult(
      8,
      'USER (Donor) can read-only view active network emergencies',
      '200 OK with active emergency list',
      `${res.status} count=${data.count || 0}, alertFound=${!!foundAlert}`,
      res.status === 200 && data.success && Array.isArray(data.emergencies) && !!foundAlert
    );
  } catch (err: any) {
    recordResult(8, 'USER viewing emergencies', '200', err.message, false);
  }

  // TEST 9: Donor Response (GOING / ACCEPTED)
  try {
    const res = await fetch(`${BASE_URL}/api/emergencies/${createdAlertAId}/respond`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${donorToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'GOING',
        etaMinutes: 12,
      }),
    });
    const data = await res.json();

    // Verify response count updated on alert
    const alertRes = await fetch(`${BASE_URL}/api/emergencies/${createdAlertAId}`, {
      headers: { Authorization: `Bearer ${donorToken}` },
    });
    const alertData = await alertRes.json();

    recordResult(
      9,
      'Donor responds GOING to emergency -> records response & increments respondingDonorsCount',
      '200 OK with userResponseStatus=accepted, count >= 1',
      `${res.status} userResponseStatus=${data.userResponseStatus}, respondingCount=${alertData.emergency?.respondingDonorsCount}`,
      res.status === 200 && data.userResponseStatus === 'accepted' && (alertData.emergency?.respondingDonorsCount || 0) >= 1
    );
  } catch (err: any) {
    recordResult(9, 'Donor response submission', '200', err.message, false);
  }

  // TEST 10: Duplicate Response Protection via Upsert
  try {
    const res = await fetch(`${BASE_URL}/api/emergencies/${createdAlertAId}/respond`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${donorToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'NOT_AVAILABLE',
      }),
    });
    const data = await res.json();
    recordResult(
      10,
      'Duplicate donor response protection: Upserts record without unique constraint error',
      '200 OK with userResponseStatus=declined',
      `${res.status} userResponseStatus=${data.userResponseStatus}`,
      res.status === 200 && data.userResponseStatus === 'declined'
    );
  } catch (err: any) {
    recordResult(10, 'Duplicate response upsert', '200', err.message, false);
  }

  // Switch donor back to GOING for subsequent tests
  await fetch(`${BASE_URL}/api/emergencies/${createdAlertAId}/respond`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${donorToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'GOING', etaMinutes: 10 }),
  });

  // TEST 11: Unavailable Donor Availability Guard
  try {
    const res = await fetch(`${BASE_URL}/api/emergencies/${createdAlertAId}/respond`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${unavailDonorToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'GOING',
      }),
    });
    const data = await res.json();
    recordResult(
      11,
      'Unavailable donor (isAvailableToDonate=false) responding GOING rejected with 400',
      '400 Bad Request',
      `${res.status} ${data.message}`,
      res.status === 400 && data.message?.includes('unavailable')
    );
  } catch (err: any) {
    recordResult(11, 'Unavailable donor guard', '400', err.message, false);
  }

  // TEST 12: Donor Response List Privacy & RBAC
  try {
    // 12a. USER cannot view responses
    const userRes = await fetch(`${BASE_URL}/api/emergencies/${createdAlertAId}/responses`, {
      headers: { Authorization: `Bearer ${donorToken}` },
    });
    const userPassed = userRes.status === 403;

    // 12b. Hospital B cannot view Hospital A responses
    const hospBRes = await fetch(`${BASE_URL}/api/emergencies/${createdAlertAId}/responses`, {
      headers: { Authorization: `Bearer ${hospBToken}` },
    });
    const hospBPassed = hospBRes.status === 403;

    // 12c. Hospital A (owner) CAN view responses
    const hospARes = await fetch(`${BASE_URL}/api/emergencies/${createdAlertAId}/responses`, {
      headers: { Authorization: `Bearer ${hospAToken}` },
    });
    const hospAData = await hospARes.json();
    const hospAPassed = hospARes.status === 200 && hospAData.success && hospAData.count >= 1;

    // 12d. Super Admin CAN view responses
    const adminRes = await fetch(`${BASE_URL}/api/emergencies/${createdAlertAId}/responses`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminData = await adminRes.json();
    const adminPassed = adminRes.status === 200 && adminData.success;

    const allPassed = userPassed && hospBPassed && hospAPassed && adminPassed;

    recordResult(
      12,
      'Donor response list privacy: USER=403, OtherHospital=403, OwnerHospital=200, SuperAdmin=200',
      'USER 403, HospB 403, HospA 200, Admin 200',
      `USER:${userRes.status}, HospB:${hospBRes.status}, HospA:${hospARes.status}, Admin:${adminRes.status}`,
      allPassed
    );
  } catch (err: any) {
    recordResult(12, 'Response list RBAC & privacy', '200', err.message, false);
  }

  // TEST 13: Emergency Fulfillment & Inventory Isolation
  try {
    // Check initial inventory of Hosp A
    const initialInv = await prisma.bloodInventory.findFirst({
      where: { organizationId: hospAOrg.id, bloodGroup: BloodGroup.O_NEG },
    });
    const initialQty = initialInv?.quantity || 0;

    const res = await fetch(`${BASE_URL}/api/emergencies/${createdAlertAId}/fulfill`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hospAToken}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();

    // Verify inventory was NOT automatically deducted
    const postInv = await prisma.bloodInventory.findFirst({
      where: { organizationId: hospAOrg.id, bloodGroup: BloodGroup.O_NEG },
    });
    const postQty = postInv?.quantity || 0;
    const inventoryIsolated = initialQty === postQty;

    recordResult(
      13,
      'Fulfill emergency requirement -> marks FULFILLED and isolates inventory (no auto-deduction)',
      '200 OK status=FULFILLED & inventory unchanged',
      `${res.status} status=${data.emergency?.status}, invBefore=${initialQty}, invAfter=${postQty}`,
      res.status === 200 && data.emergency?.status === 'FULFILLED' && inventoryIsolated
    );
  } catch (err: any) {
    recordResult(13, 'Emergency fulfillment and inventory isolation', '200', err.message, false);
  }

  // TEST 14: Activity Logs Persisted in PostgreSQL
  try {
    const logs = await prisma.activityLog.findMany({
      where: {
        category: { in: [ActivityCategory.EMERGENCY, ActivityCategory.DONOR] },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const hasEmergencyLog = logs.some((l) => l.category === ActivityCategory.EMERGENCY);
    const hasDonorLog = logs.some((l) => l.category === ActivityCategory.DONOR);

    recordResult(
      14,
      'ActivityLog records created in PostgreSQL for Emergency creation, Donor response, and Fulfillment',
      'Activity logs with EMERGENCY and DONOR categories',
      `Found ${logs.length} logs (hasEmergencyLog=${hasEmergencyLog}, hasDonorLog=${hasDonorLog})`,
      hasEmergencyLog && hasDonorLog
    );
  } catch (err: any) {
    recordResult(14, 'ActivityLog verification', 'Logs found', err.message, false);
  }

  // Summary Report
  console.log('\n==================================================');
  console.log('       PHASE 5 VALIDATION SUMMARY REPORT          ');
  console.log('==================================================');
  const passedCount = results.filter((r) => r.status === 'PASS').length;
  const failedCount = results.filter((r) => r.status === 'FAIL').length;
  console.log(`TOTAL TESTS : ${results.length}`);
  console.log(`PASSED      : ${passedCount}`);
  console.log(`FAILED      : ${failedCount}`);
  console.log('==================================================\n');

  if (failedCount > 0) {
    console.error('Validation FAILED. Please review the failed tests above.');
    process.exit(1);
  } else {
    console.log('ALL PHASE 5 TESTS PASSED PERFECTLY AGAINST LIVE POSTGRESQL!');
    process.exit(0);
  }
}

runValidation()
  .catch((err) => {
    console.error('Fatal validation runner error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
