import {
  Prisma,
  Role,
  OrganizationType,
  OrganizationStatus,
  EmergencyStatus,
  ResponseStatus,
  BloodGroup,
  ActivityCategory,
  ActivitySeverity,
  UrgencyLevel,
} from '@prisma/client';
import { prisma } from '../prisma';
import { formatBloodGroup, parseBloodGroup, ALL_BLOOD_GROUP_STRINGS } from '../utils/bloodGroup';

export interface DateFilterOptions {
  from?: Date;
  to?: Date;
}

export interface InventoryFilterOptions extends DateFilterOptions {
  bloodGroup?: string;
  organizationId?: string;
}

export interface AuditLogFilterOptions extends DateFilterOptions {
  category?: ActivityCategory;
  severity?: ActivitySeverity;
  organizationId?: string;
  userId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Classify blood stock level into standard categories
 */
export function classifyStockLevel(quantity: number): 'CRITICAL' | 'LOW' | 'MEDIUM' | 'AVAILABLE' {
  if (quantity < 10) return 'CRITICAL';
  if (quantity < 25) return 'LOW';
  if (quantity < 50) return 'MEDIUM';
  return 'AVAILABLE';
}

/**
 * 1. Super Admin Overview Metrics
 */
export async function getNetworkOverviewMetrics() {
  const [
    totalUsers,
    totalActiveDonors,
    totalVerifiedHospitals,
    totalVerifiedBloodBanks,
    totalPendingOrganizations,
    inventoryAggregate,
    totalActiveEmergencies,
    totalFulfilledEmergencies,
    totalCancelledEmergencies,
    totalDonorResponses,
    totalAcceptedResponses,
    totalComplaints,
  ] = await Promise.all([
    // Total registered users
    prisma.user.count(),

    // Total active donors (donorProfile available & user active)
    prisma.donorProfile.count({
      where: {
        isAvailableToDonate: true,
        user: { status: 'ACTIVE' },
      },
    }),

    // Total verified hospitals
    prisma.organization.count({
      where: {
        type: OrganizationType.HOSPITAL,
        status: OrganizationStatus.APPROVED,
      },
    }),

    // Total verified blood banks
    prisma.organization.count({
      where: {
        type: OrganizationType.BLOOD_BANK,
        status: OrganizationStatus.APPROVED,
      },
    }),

    // Total pending organizations
    prisma.organization.count({
      where: {
        status: OrganizationStatus.PENDING,
      },
    }),

    // Total blood bags in network
    prisma.bloodInventory.aggregate({
      _sum: { quantity: true },
    }),

    // Total active emergencies
    prisma.emergencyAlert.count({
      where: { status: EmergencyStatus.ACTIVE },
    }),

    // Total fulfilled emergencies
    prisma.emergencyAlert.count({
      where: { status: EmergencyStatus.FULFILLED },
    }),

    // Total cancelled emergencies
    prisma.emergencyAlert.count({
      where: { status: EmergencyStatus.CANCELLED },
    }),

    // Total donor responses
    prisma.emergencyDonorResponse.count(),

    // Total accepted/positive responses
    prisma.emergencyDonorResponse.count({
      where: {
        status: { in: [ResponseStatus.ACCEPTED, ResponseStatus.ARRIVED, ResponseStatus.COMPLETED] },
      },
    }),

    // Total complaints
    prisma.complaint.count(),
  ]);

  const totalBloodBags = inventoryAggregate._sum.quantity || 0;
  const totalEmergencies = totalActiveEmergencies + totalFulfilledEmergencies + totalCancelledEmergencies;
  const fulfillmentRate =
    totalEmergencies > 0 ? Math.round((totalFulfilledEmergencies / totalEmergencies) * 100) : 0;
  const donorAcceptanceRate =
    totalDonorResponses > 0 ? Math.round((totalAcceptedResponses / totalDonorResponses) * 100) : 0;

  return {
    totalUsers,
    totalActiveDonors,
    totalVerifiedHospitals,
    totalVerifiedBloodBanks,
    totalPendingOrganizations,
    totalBloodBags,
    totalActiveEmergencies,
    totalFulfilledEmergencies,
    totalCancelledEmergencies,
    totalEmergencies,
    fulfillmentRate,
    totalDonorResponses,
    totalAcceptedResponses,
    donorAcceptanceRate,
    totalComplaints,
  };
}

/**
 * 2. Blood Inventory Analytics
 */
export async function getInventoryAnalytics(filters: InventoryFilterOptions = {}) {
  const { bloodGroup, organizationId, from, to } = filters;

  const invWhere: Prisma.BloodInventoryWhereInput = {};
  if (organizationId) {
    invWhere.organizationId = organizationId;
  }
  if (bloodGroup) {
    const parsed = parseBloodGroup(bloodGroup);
    if (parsed) {
      invWhere.bloodGroup = parsed;
    }
  }

  // Stock transactions where condition
  const txWhere: Prisma.BloodStockTransactionWhereInput = {};
  if (organizationId) {
    txWhere.organizationId = organizationId;
  }
  if (bloodGroup) {
    const parsed = parseBloodGroup(bloodGroup);
    if (parsed) {
      txWhere.bloodGroup = parsed;
    }
  }
  if (from || to) {
    txWhere.createdAt = {};
    if (from) txWhere.createdAt.gte = from;
    if (to) txWhere.createdAt.lte = to;
  }

  const [inventories, organizations, recentTransactions, additionsAgg, reductionsAgg] =
    await Promise.all([
      prisma.bloodInventory.findMany({
        where: invWhere,
        include: {
          organization: {
            select: { id: true, name: true, type: true, city: true, status: true },
          },
        },
      }),
      prisma.organization.findMany({
        where: organizationId ? { id: organizationId } : { status: OrganizationStatus.APPROVED },
        select: { id: true, name: true, type: true, city: true },
      }),
      prisma.bloodStockTransaction.findMany({
        where: txWhere,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          organization: {
            select: { id: true, name: true, type: true },
          },
          performedBy: {
            select: { id: true, name: true, role: true },
          },
        },
      }),
      prisma.bloodStockTransaction.aggregate({
        where: { ...txWhere, delta: { gt: 0 } },
        _sum: { delta: true },
      }),
      prisma.bloodStockTransaction.aggregate({
        where: { ...txWhere, delta: { lt: 0 } },
        _sum: { delta: true },
      }),
    ]);

  // Aggregate by blood group
  const bloodGroupMap: Record<string, { quantity: number; organizationsCount: number }> = {};
  for (const bg of ALL_BLOOD_GROUP_STRINGS) {
    bloodGroupMap[bg] = { quantity: 0, organizationsCount: 0 };
  }

  let totalUnits = 0;
  for (const inv of inventories) {
    const formatted = formatBloodGroup(inv.bloodGroup);
    if (!bloodGroupMap[formatted]) {
      bloodGroupMap[formatted] = { quantity: 0, organizationsCount: 0 };
    }
    bloodGroupMap[formatted].quantity += inv.quantity;
    if (inv.quantity > 0) {
      bloodGroupMap[formatted].organizationsCount += 1;
    }
    totalUnits += inv.quantity;
  }

  const byBloodGroup = Object.entries(bloodGroupMap).map(([bg, data]) => ({
    bloodGroup: bg,
    quantity: data.quantity,
    percentage: totalUnits > 0 ? Math.round((data.quantity / totalUnits) * 100) : 0,
    classification: classifyStockLevel(data.quantity),
    activeFacilities: data.organizationsCount,
  }));

  // Sort highest and lowest
  const sortedGroups = [...byBloodGroup].sort((a, b) => b.quantity - a.quantity);
  const highestStockGroups = sortedGroups.slice(0, 3);
  const lowestStockGroups = [...byBloodGroup].sort((a, b) => a.quantity - b.quantity).slice(0, 3);

  // Group by organization
  const orgMap: Record<
    string,
    {
      id: string;
      name: string;
      type: string;
      city: string;
      totalUnits: number;
      stock: Record<string, number>;
    }
  > = {};

  for (const org of organizations) {
    orgMap[org.id] = {
      id: org.id,
      name: org.name,
      type: org.type,
      city: org.city,
      totalUnits: 0,
      stock: {},
    };
    for (const bg of ALL_BLOOD_GROUP_STRINGS) {
      orgMap[org.id].stock[bg] = 0;
    }
  }

  for (const inv of inventories) {
    if (orgMap[inv.organizationId]) {
      const formatted = formatBloodGroup(inv.bloodGroup);
      orgMap[inv.organizationId].totalUnits += inv.quantity;
      orgMap[inv.organizationId].stock[formatted] = inv.quantity;
    }
  }

  const byOrganization = Object.values(orgMap).sort((a, b) => b.totalUnits - a.totalUnits);

  return {
    totalBloodUnits: totalUnits,
    byBloodGroup,
    highestStockGroups,
    lowestStockGroups,
    byOrganization,
    totalAdditions: additionsAgg._sum.delta || 0,
    totalReductions: Math.abs(reductionsAgg._sum.delta || 0),
    recentAdjustments: recentTransactions.map((t) => ({
      id: t.id,
      organizationId: t.organizationId,
      organizationName: t.organization.name,
      bloodGroup: formatBloodGroup(t.bloodGroup),
      delta: t.delta,
      previousQuantity: t.previousQuantity,
      newQuantity: t.newQuantity,
      reason: t.reason || 'MANUAL_ADJUSTMENT',
      performedBy: t.performedBy?.name || 'System',
      createdAt: t.createdAt,
    })),
  };
}

/**
 * 3. Emergency Analytics
 */
export async function getEmergencyAnalytics(filters: DateFilterOptions = {}) {
  const { from, to } = filters;

  const whereClause: Prisma.EmergencyAlertWhereInput = {};
  const responseWhereClause: Prisma.EmergencyDonorResponseWhereInput = {};
  if (from || to) {
    whereClause.createdAt = {};
    responseWhereClause.respondedAt = {};
    if (from) {
      whereClause.createdAt.gte = from;
      responseWhereClause.respondedAt.gte = from;
    }
    if (to) {
      whereClause.createdAt.lte = to;
      responseWhereClause.respondedAt.lte = to;
    }
  }

  const [emergencies, totalResponses, acceptedResponses, declinedResponses] = await Promise.all([
    prisma.emergencyAlert.findMany({
      where: whereClause,
      include: {
        organization: {
          select: { id: true, name: true, type: true, city: true },
        },
        responses: {
          select: { id: true, status: true, etaMinutes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.emergencyDonorResponse.count({
      where: responseWhereClause,
    }),
    prisma.emergencyDonorResponse.count({
      where: {
        ...responseWhereClause,
        status: { in: [ResponseStatus.ACCEPTED, ResponseStatus.ARRIVED, ResponseStatus.COMPLETED] },
      },
    }),
    prisma.emergencyDonorResponse.count({
      where: {
        ...responseWhereClause,
        status: ResponseStatus.DECLINED,
      },
    }),
  ]);

  let activeCount = 0;
  let fulfilledCount = 0;
  let cancelledCount = 0;
  let totalBagsRequested = 0;
  let totalBagsFulfilled = 0;

  const byBloodGroupMap: Record<string, { count: number; bagsNeeded: number; bagsFulfilled: number }> = {};
  for (const bg of ALL_BLOOD_GROUP_STRINGS) {
    byBloodGroupMap[bg] = { count: 0, bagsNeeded: 0, bagsFulfilled: 0 };
  }

  const byUrgencyMap: Record<string, number> = {
    'Code Red: Urgent': 0,
    High: 0,
    Moderate: 0,
  };

  const byCategoryMap: Record<string, number> = {
    Trauma: 0,
    'Pediatric Trauma': 0,
    'Platelet/Oncology': 0,
    Postpartum: 0,
    Surgical: 0,
  };

  const byOrgMap: Record<string, { name: string; count: number; fulfilled: number }> = {};

  for (const em of emergencies) {
    if (em.status === EmergencyStatus.ACTIVE) activeCount++;
    else if (em.status === EmergencyStatus.FULFILLED) fulfilledCount++;
    else if (em.status === EmergencyStatus.CANCELLED) cancelledCount++;

    totalBagsRequested += em.bagsNeeded;
    totalBagsFulfilled += em.bagsFulfilled;

    const bgStr = formatBloodGroup(em.bloodType);
    if (!byBloodGroupMap[bgStr]) {
      byBloodGroupMap[bgStr] = { count: 0, bagsNeeded: 0, bagsFulfilled: 0 };
    }
    byBloodGroupMap[bgStr].count += 1;
    byBloodGroupMap[bgStr].bagsNeeded += em.bagsNeeded;
    byBloodGroupMap[bgStr].bagsFulfilled += em.bagsFulfilled;

    // Urgency
    if (em.urgency === UrgencyLevel.CODE_RED) byUrgencyMap['Code Red: Urgent'] += 1;
    else if (em.urgency === UrgencyLevel.HIGH) byUrgencyMap['High'] += 1;
    else if (em.urgency === UrgencyLevel.MODERATE) byUrgencyMap['Moderate'] += 1;

    // Category mapping
    const cat = em.category;
    if (cat === 'TRAUMA') byCategoryMap['Trauma'] += 1;
    else if (cat === 'PEDIATRIC_TRAUMA') byCategoryMap['Pediatric Trauma'] += 1;
    else if (cat === 'PLATELET_ONCOLOGY') byCategoryMap['Platelet/Oncology'] += 1;
    else if (cat === 'POSTPARTUM') byCategoryMap['Postpartum'] += 1;
    else if (cat === 'SURGICAL') byCategoryMap['Surgical'] += 1;

    // Organization
    const orgName = em.organization?.name || em.hospitalName || 'Independent';
    if (!byOrgMap[orgName]) {
      byOrgMap[orgName] = { name: orgName, count: 0, fulfilled: 0 };
    }
    byOrgMap[orgName].count += 1;
    if (em.status === EmergencyStatus.FULFILLED) {
      byOrgMap[orgName].fulfilled += 1;
    }
  }

  const totalEmergencies = emergencies.length;
  const fulfillmentRate =
    totalEmergencies > 0 ? Math.round((fulfilledCount / totalEmergencies) * 100) : 0;
  const averageResponsesPerEmergency =
    totalEmergencies > 0 ? +(totalResponses / totalEmergencies).toFixed(1) : 0;

  // Timeline / Trends (by day over last 14 days or filtered period)
  const dateMap: Record<string, number> = {};
  for (const em of emergencies) {
    const dayKey = em.createdAt.toISOString().split('T')[0];
    dateMap[dayKey] = (dateMap[dayKey] || 0) + 1;
  }
  const trends = Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return {
    totalEmergencies,
    activeEmergencies: activeCount,
    fulfilledEmergencies: fulfilledCount,
    cancelledEmergencies: cancelledCount,
    totalBagsRequested,
    totalBagsFulfilled,
    fulfillmentRate,
    donorResponseCount: totalResponses,
    acceptedResponses,
    declinedResponses,
    averageResponsesPerEmergency,
    byBloodGroup: Object.entries(byBloodGroupMap).map(([bloodGroup, data]) => ({
      bloodGroup,
      count: data.count,
      bagsNeeded: data.bagsNeeded,
      bagsFulfilled: data.bagsFulfilled,
    })),
    byUrgency: Object.entries(byUrgencyMap).map(([urgency, count]) => ({ urgency, count })),
    byCategory: Object.entries(byCategoryMap).map(([category, count]) => ({ category, count })),
    byOrganization: Object.values(byOrgMap).sort((a, b) => b.count - a.count),
    trends,
  };
}

/**
 * 4. Donor Response Analytics (Strict Privacy Preserved)
 */
export async function getDonorAnalytics() {
  const [
    totalDonors,
    availableDonors,
    unavailableDonors,
    donorProfiles,
    totalResponses,
    acceptedResponses,
    declinedResponses,
    donationsAgg,
    cityAgg,
  ] = await Promise.all([
    prisma.donorProfile.count(),
    prisma.donorProfile.count({ where: { isAvailableToDonate: true } }),
    prisma.donorProfile.count({ where: { isAvailableToDonate: false } }),
    prisma.donorProfile.findMany({
      select: { bloodGroup: true },
    }),
    prisma.emergencyDonorResponse.count(),
    prisma.emergencyDonorResponse.count({
      where: {
        status: { in: [ResponseStatus.ACCEPTED, ResponseStatus.ARRIVED, ResponseStatus.COMPLETED] },
      },
    }),
    prisma.emergencyDonorResponse.count({
      where: { status: ResponseStatus.DECLINED },
    }),
    prisma.donationRecord.aggregate({
      _sum: { unitsDonated: true, livesImpacted: true },
      _count: { id: true },
    }),
    prisma.user.groupBy({
      by: ['locationCity'],
      where: {
        role: Role.USER,
        locationCity: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
  ]);

  // Group by blood group
  const bgMap: Record<string, number> = {};
  for (const bg of ALL_BLOOD_GROUP_STRINGS) {
    bgMap[bg] = 0;
  }
  for (const dp of donorProfiles) {
    const formatted = formatBloodGroup(dp.bloodGroup);
    bgMap[formatted] = (bgMap[formatted] || 0) + 1;
  }

  const bloodGroupDistribution = Object.entries(bgMap).map(([bloodGroup, count]) => ({
    bloodGroup,
    count,
    percentage: totalDonors > 0 ? Math.round((count / totalDonors) * 100) : 0,
  }));

  const responseRate =
    totalResponses > 0 ? Math.round((acceptedResponses / totalResponses) * 100) : 0;

  // City-level aggregated counts (zero exact coordinates or addresses)
  const geographicDistribution = cityAgg
    .filter((c) => c.locationCity)
    .map((c) => ({
      city: c.locationCity as string,
      donorCount: c._count.id,
    }));

  return {
    totalDonors,
    availableDonors,
    unavailableDonors,
    totalResponses,
    acceptedResponses,
    declinedResponses,
    responseRate,
    bloodGroupDistribution,
    totalDonationsCompleted: donationsAgg._count.id || 0,
    totalUnitsDonated: donationsAgg._sum.unitsDonated || 0,
    totalLivesImpacted: donationsAgg._sum.livesImpacted || 0,
    geographicDistribution,
  };
}

/**
 * 5. Organization Analytics
 */
export async function getOrganizationAnalytics() {
  const [
    totalOrganizations,
    hospitals,
    bloodBanks,
    pending,
    approved,
    rejected,
    suspended,
    orgsWithDetails,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.organization.count({ where: { type: OrganizationType.HOSPITAL } }),
    prisma.organization.count({ where: { type: OrganizationType.BLOOD_BANK } }),
    prisma.organization.count({ where: { status: OrganizationStatus.PENDING } }),
    prisma.organization.count({ where: { status: OrganizationStatus.APPROVED } }),
    prisma.organization.count({ where: { status: OrganizationStatus.REJECTED } }),
    prisma.organization.count({ where: { status: OrganizationStatus.SUSPENDED } }),
    prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        city: true,
        state: true,
        status: true,
        createdAt: true,
        inventories: {
          select: { quantity: true },
        },
        emergencyAlerts: {
          select: { id: true, status: true },
        },
        receivedDonations: {
          select: { id: true, unitsDonated: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Region breakdown (city/state)
  const regionMap: Record<string, number> = {};
  for (const org of orgsWithDetails) {
    const loc = org.city || 'Unknown';
    regionMap[loc] = (regionMap[loc] || 0) + 1;
  }
  const byRegion = Object.entries(regionMap)
    .sort(([, a], [, b]) => b - a)
    .map(([region, count]) => ({ region, count }));

  // Facility list performance
  const organizationList = orgsWithDetails.map((org) => {
    const totalInventoryUnits = org.inventories.reduce((acc, inv) => acc + inv.quantity, 0);
    const totalEmergencies = org.emergencyAlerts.length;
    const fulfilledEmergencies = org.emergencyAlerts.filter(
      (e) => e.status === EmergencyStatus.FULFILLED
    ).length;
    const totalDonationsReceived = org.receivedDonations.reduce(
      (acc, d) => acc + d.unitsDonated,
      0
    );

    return {
      id: org.id,
      name: org.name,
      type: org.type,
      city: org.city,
      state: org.state,
      status: org.status,
      totalInventoryUnits,
      totalEmergencies,
      fulfilledEmergencies,
      totalDonationsReceived,
      createdAt: org.createdAt,
    };
  });

  return {
    totalOrganizations,
    hospitals,
    bloodBanks,
    pending,
    approved,
    rejected,
    suspended,
    byRegion,
    organizationList,
  };
}

/**
 * 6. Scoped Organization Analytics (For Hospital / Blood Bank user)
 */
export async function getScopedOrganizationAnalytics(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      inventories: true,
      emergencyAlerts: {
        include: {
          responses: {
            select: { id: true, status: true, respondedAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      stockTransactions: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          performedBy: { select: { id: true, name: true } },
        },
      },
      receivedDonations: {
        take: 10,
        orderBy: { donationDate: 'desc' },
      },
      activityLogs: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!org) {
    return null;
  }

  // Stock breakdown
  const stockMap: Record<string, number> = {};
  for (const bg of ALL_BLOOD_GROUP_STRINGS) {
    stockMap[bg] = 0;
  }

  let totalUnits = 0;
  let criticalCount = 0;
  let lowCount = 0;

  for (const inv of org.inventories) {
    const formatted = formatBloodGroup(inv.bloodGroup);
    stockMap[formatted] = inv.quantity;
    totalUnits += inv.quantity;
    if (inv.quantity < 10) criticalCount++;
    else if (inv.quantity < 25) lowCount++;
  }

  const stockByBloodGroup = Object.entries(stockMap).map(([bloodGroup, quantity]) => ({
    bloodGroup,
    quantity,
    classification: classifyStockLevel(quantity),
  }));

  // Emergencies breakdown
  let activeEmergencies = 0;
  let fulfilledEmergencies = 0;
  let cancelledEmergencies = 0;
  let totalBagsRequested = 0;
  let totalBagsFulfilled = 0;
  let totalDonorResponses = 0;
  let acceptedResponses = 0;
  let declinedResponses = 0;

  for (const em of org.emergencyAlerts) {
    if (em.status === EmergencyStatus.ACTIVE) activeEmergencies++;
    else if (em.status === EmergencyStatus.FULFILLED) fulfilledEmergencies++;
    else if (em.status === EmergencyStatus.CANCELLED) cancelledEmergencies++;

    totalBagsRequested += em.bagsNeeded;
    totalBagsFulfilled += em.bagsFulfilled;

    for (const r of em.responses) {
      totalDonorResponses++;
      if (
        r.status === ResponseStatus.ACCEPTED ||
        r.status === ResponseStatus.ARRIVED ||
        r.status === ResponseStatus.COMPLETED
      ) {
        acceptedResponses++;
      } else if (r.status === ResponseStatus.DECLINED) {
        declinedResponses++;
      }
    }
  }

  const totalEmergencies = org.emergencyAlerts.length;
  const fulfillmentRate =
    totalEmergencies > 0 ? Math.round((fulfilledEmergencies / totalEmergencies) * 100) : 0;

  // Additions & Reductions
  const additionsAgg = await prisma.bloodStockTransaction.aggregate({
    where: { organizationId, delta: { gt: 0 } },
    _sum: { delta: true },
  });
  const reductionsAgg = await prisma.bloodStockTransaction.aggregate({
    where: { organizationId, delta: { lt: 0 } },
    _sum: { delta: true },
  });

  return {
    organization: {
      id: org.id,
      name: org.name,
      type: org.type,
      city: org.city,
      status: org.status,
    },
    inventory: {
      totalUnits,
      criticalCount,
      lowCount,
      stockByBloodGroup,
      totalAdditions: additionsAgg._sum.delta || 0,
      totalReductions: Math.abs(reductionsAgg._sum.delta || 0),
    },
    emergencies: {
      total: totalEmergencies,
      active: activeEmergencies,
      fulfilled: fulfilledEmergencies,
      cancelled: cancelledEmergencies,
      totalBagsRequested,
      totalBagsFulfilled,
      fulfillmentRate,
      totalDonorResponses,
      acceptedResponses,
      declinedResponses,
    },
    recentTransactions: org.stockTransactions.map((tx) => ({
      id: tx.id,
      bloodGroup: formatBloodGroup(tx.bloodGroup),
      delta: tx.delta,
      previousQuantity: tx.previousQuantity,
      newQuantity: tx.newQuantity,
      reason: tx.reason || 'MANUAL_ADJUSTMENT',
      performedBy: tx.performedBy?.name || 'Authorized Staff',
      createdAt: tx.createdAt,
    })),
    recentActivity: org.activityLogs.map((log) => ({
      id: log.id,
      category: log.category,
      severity: log.severity,
      eventText: log.eventText,
      createdAt: log.createdAt,
    })),
  };
}

/**
 * 7. Paginated Network Audit Logs
 */
export async function getAuditLogs(filters: AuditLogFilterOptions = {}) {
  const {
    category,
    severity,
    organizationId,
    userId,
    search,
    from,
    to,
    page = 1,
    limit = 25,
  } = filters;

  const whereClause: Prisma.ActivityLogWhereInput = {};

  if (category) whereClause.category = category;
  if (severity) whereClause.severity = severity;
  if (organizationId) whereClause.organizationId = organizationId;
  if (userId) whereClause.userId = userId;

  if (from || to) {
    whereClause.createdAt = {};
    if (from) whereClause.createdAt.gte = from;
    if (to) whereClause.createdAt.lte = to;
  }

  if (search && search.trim()) {
    const clean = search.trim();
    whereClause.OR = [
      { eventText: { contains: clean, mode: 'insensitive' } },
      { metadata: { contains: clean, mode: 'insensitive' } },
      { user: { name: { contains: clean, mode: 'insensitive' } } },
      { organization: { name: { contains: clean, mode: 'insensitive' } } },
    ];
  }

  const offset = (Math.max(1, page) - 1) * limit;

  const [total, logs] = await Promise.all([
    prisma.activityLog.count({ where: whereClause }),
    prisma.activityLog.findMany({
      where: whereClause,
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        organization: {
          select: { id: true, name: true, type: true, city: true },
        },
      },
    }),
  ]);

  const safeLogs = logs.map((log) => ({
    id: log.id,
    category: log.category,
    severity: log.severity,
    eventText: log.eventText,
    metadata: log.metadata,
    createdAt: log.createdAt,
    actor: log.user
      ? {
          id: log.user.id,
          name: log.user.name,
          email: log.user.email,
          role: log.user.role,
        }
      : null,
    organization: log.organization
      ? {
          id: log.organization.id,
          name: log.organization.name,
          type: log.organization.type,
          city: log.organization.city,
        }
      : null,
  }));

  return {
    logs: safeLogs,
    pagination: {
      page: Math.max(1, page),
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * 8. Summary Report Generation
 */
export async function generateSummaryReport(filters: DateFilterOptions = {}) {
  const [overview, inventory, emergencies, donors, organizations] = await Promise.all([
    getNetworkOverviewMetrics(),
    getInventoryAnalytics({ from: filters.from, to: filters.to }),
    getEmergencyAnalytics(filters),
    getDonorAnalytics(),
    getOrganizationAnalytics(),
  ]);

  const criticalStockGroups = inventory.byBloodGroup.filter((b) => b.classification === 'CRITICAL');
  const lowStockGroups = inventory.byBloodGroup.filter((b) => b.classification === 'LOW');

  return {
    reportId: `REP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    generatedAt: new Date().toISOString(),
    period: {
      from: filters.from ? filters.from.toISOString() : 'All-time',
      to: filters.to ? filters.to.toISOString() : 'Present',
    },
    networkInventory: {
      totalBloodUnits: inventory.totalBloodUnits,
      criticalGroups: criticalStockGroups.map((g) => g.bloodGroup),
      lowGroups: lowStockGroups.map((g) => g.bloodGroup),
      highestStock: inventory.highestStockGroups.map((g) => `${g.bloodGroup} (${g.quantity} units)`),
    },
    emergencies: {
      total: emergencies.totalEmergencies,
      active: emergencies.activeEmergencies,
      fulfilled: emergencies.fulfilledEmergencies,
      cancelled: emergencies.cancelledEmergencies,
      fulfillmentRate: `${emergencies.fulfillmentRate}%`,
      totalBagsRequested: emergencies.totalBagsRequested,
      totalBagsFulfilled: emergencies.totalBagsFulfilled,
      donorResponses: emergencies.donorResponseCount,
    },
    donors: {
      totalDonors: donors.totalDonors,
      availableDonors: donors.availableDonors,
      acceptanceRate: `${donors.responseRate}%`,
      totalUnitsDonated: donors.totalUnitsDonated,
      totalLivesImpacted: donors.totalLivesImpacted,
    },
    organizations: {
      total: organizations.totalOrganizations,
      approvedHospitals: organizations.hospitals,
      approvedBloodBanks: organizations.bloodBanks,
      pendingVerifications: organizations.pending,
    },
    stockWarnings: criticalStockGroups.map((g) => ({
      bloodGroup: g.bloodGroup,
      quantity: g.quantity,
      status: 'CRITICAL',
      recommendation: `Initiate targeted donor outreach for ${g.bloodGroup} supply replenishment.`,
    })),
    emergencyHighlights: {
      activeCodeReds: emergencies.byUrgency.find((u) => u.urgency === 'Code Red: Urgent')?.count || 0,
      topEmergencyCategory: emergencies.byCategory.sort((a, b) => b.count - a.count)[0]?.category || 'N/A',
    },
  };
}
