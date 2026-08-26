export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type UserRole = 'USER' | 'HOSPITAL' | 'BLOOD_BANK' | 'SUPER_ADMIN' | 'ADMIN';

export type AccountStatus =
  | 'ACTIVE'
  | 'PENDING'
  | 'SUSPENDED'
  | 'BANNED'
  | 'REJECTED'
  | 'APPROVED'
  | 'Active'
  | 'Verified'
  | 'Suspended'
  | 'Banned';

export type OrganizationType = 'HOSPITAL' | 'BLOOD_BANK';

export interface OrganizationDocItem {
  id?: string;
  documentType: string;
  fileName: string;
  fileUrl?: string;
  fileData?: string;
  fileSize?: number | string;
  mimeType?: string;
  uploadedAt?: string;
}

export interface RegisteredOrganization {
  id: string;
  name: string;
  type: OrganizationType;
  registrationNumber: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  facilityType?: string;
  licenseIssuingAuthority?: string;
  licenseExpiryDate?: string;
  contactPerson: string;
  contactPersonDesignation: string;
  adminName?: string;
  adminEmail?: string;
  adminPhone?: string;
  licenseDocumentName: string;
  licenseDocumentSize?: string;
  licenseDocumentType?: string;
  licenseDocumentUrl?: string;
  licenseDocumentData?: string;
  documents?: OrganizationDocItem[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'BANNED';
  rejectionReason?: string;
  banReason?: string;
  submittedDate: string;
  verifiedDate?: string;
  verifiedAt?: string;
  totalBags: number;
  inventory: Record<BloodGroup, number>;
  createdAt?: string;
  manager?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    status?: string;
  };
}

export interface Complaint {
  id: string;
  reporterName: string;
  reporterEmail: string;
  reportedAccountName: string;
  reportedAccountId: string;
  reportedType: 'USER' | 'HOSPITAL' | 'BLOOD_BANK';
  reason: string;
  description: string;
  date: string;
  status: 'Open' | 'Under Review' | 'Resolved' | 'Rejected';
  actionTaken?: string;
  evidenceFileName?: string;
}

export type StockStatus = 'Available' | 'Medium' | 'Low' | 'Critical';

export type UrgencyLevel = 'Code Red: Urgent' | 'High' | 'Moderate';

export interface ActivityLog {
  id: string;
  timestamp: string;
  time?: string;
  event: string;
  text?: string;
  category?: string;
  user?: string;
  severity?: 'INFO' | 'CRITICAL' | 'SUCCESS' | 'WARNING' | string;
  type?: string;
}

export type DonorTier = 'Bronze Donor' | 'Silver Lifesaver' | 'Gold Guardian' | 'Platinum Hero';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  bloodGroup: BloodGroup;
  location: string;
  accountType: string;
  registrationDate: string;
  avatarUrl?: string;
  totalDonations: number;
  livesImpacted: number;
  isAvailableToDonate: boolean;
  status?: 'ACTIVE' | 'BANNED' | 'SUSPENDED';
  banReason?: string;
}

// Keep DonorProfile as alias/subtype for compatibility
export interface DonorProfile extends UserProfile {
  tier: DonorTier;
  livesSaved: number;
  completedDonations: number;
  lastDonationDate: string | null;
  readinessStatus: 'Ready' | 'Rest Period' | 'Deferred';
  restDaysLeft: number;
  weightKg: number;
  hemoglobin: number;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  donorId: string;
  alertsBeaconActive: boolean;
  locationCity: string;
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'HOSPITAL' | 'SUPER_ADMIN' | 'ADMIN';
  bloodGroup?: BloodGroup;
  bloodType?: BloodGroup | string;
  phone?: string;
  location: string;
  status: 'Active' | 'Verified' | 'Suspended' | 'Banned' | 'BANNED' | 'SUSPENDED' | string;
  lastActive: string;
  lastDonationDate?: string;
  donationsCount: number;
  registeredDate?: string;
  banReason?: string;
}

export interface EmergencyAlert {
  id: string;
  bloodType: BloodGroup;
  urgency: UrgencyLevel;
  timeAgo: string;
  timestamp: number;
  distance: string;
  hospitalName: string;
  department: string;
  address: string;
  description: string;
  bagsNeeded: number;
  bagsFulfilled: number;
  category: 'Trauma' | 'Pediatric Trauma' | 'Platelet/Oncology' | 'Postpartum' | 'Surgical';
  patientInitials: string;
  patientAge?: number;
  contactPhone: string;
  respondingDonorsCount: number;
  userResponseStatus?: 'none' | 'accepted' | 'declined';
  criticalNote?: string;
}

export interface DonationRecord {
  id: string;
  date: string;
  hospitalName: string;
  bloodGroup: BloodGroup;
  unitsDonated: number;
  donationType: 'Whole Blood' | 'Platelets (Apheresis)' | 'Plasma';
  certificateId: string;
  verificationHash: string;
  livesImpacted: number;
}

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  quickReplies?: string[];
  isClinicalNote?: boolean;
}

export interface HospitalProfile {
  id: string;
  name: string;
  shortName?: string;
  registrationId: string;
  email: string;
  facilityType: 'Trauma Center' | 'General Hospital' | 'Maternity Wing' | 'Cancer Institute';
  address: string;
  contactPhone: string;
  totalBags: number;
  status: 'Available' | 'Emergency' | 'Low Stock' | 'Critical Shortage';
  emergencyStatus: 'NORMAL' | 'ELEVATED' | 'CODE RED';
  distance: string;
  activeRequests: number;
  inventory: Record<BloodGroup, number>;
}

export interface RadarHospital {
  id: string;
  name: string;
  shortName: string;
  totalUnits: number;
  status: 'Available' | 'Emergency' | 'Low Stock' | 'Critical Shortage';
  coordinates: { x: number; y: number }; // percentage on radar canvas (0-100)
  lat: number;
  lng: number;
  distance: string;
  address: string;
  contactPhone: string;
  lastInventoryUpdate: string;
  activeRequests: number;
  availableDonorsCount: number;
  couriersInTransitCount: number;
  inventory: Record<BloodGroup, number>;
  activeEmergencyDetails?: {
    bloodGroup: BloodGroup;
    urgency: string;
    situation: string;
    bagsNeeded: number;
  };
}

export interface RadarDonorMarker {
  id: string;
  bloodGroup: BloodGroup;
  status: 'Available' | 'En Route' | 'Resting';
  coordinates: { x: number; y: number };
  distance: string;
  etaMinutes?: number;
  donorInitial: string;
  verified: boolean;
}

export interface RadarCourierMarker {
  id: string;
  vehicleId: string;
  tempCelsius: number;
  status: 'In Transit' | 'Arrived' | 'Loading';
  destinationHospital: string;
  cargoDescription: string;
  bloodUnits: number;
  bloodTypes: BloodGroup[];
  coordinates: { x: number; y: number };
  headingDeg: number;
  etaMinutes: number;
}

export interface RadarGeofence {
  id: string;
  name: string;
  type: 'emergency_red' | 'standard_coverage' | 'donor_cluster';
  center: { x: number; y: number };
  radius: number; // in px or percentage
  label: string;
}

export interface StockForecastItem {
  bloodGroup: BloodGroup;
  currentStock: number;
  expectedDemand72h: number;
  predictedShortage: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'HEALTHY';
  statusDescription: string;
  hoursUntilCritical: number;
  dailyConsumptionTrend: number[];
  recommendation: string;
}

export type AppScreen =
  // User / Donor Screens
  | 'DASHBOARD'
  | 'USER_DASHBOARD'
  | 'BLOOD_STOCK'
  | 'RADAR'
  | 'LIVE_RADAR'
  | 'FIND_DONORS'
  | 'EMERGENCY_ALERTS'
  | 'HOSPITALS'
  | 'FORECAST'
  | 'PROFILE'
  
  // Hospital & Blood Bank Portal Screens
  | 'HOSPITAL_DASHBOARD'
  | 'HOSPITAL_STOCK'
  | 'HOSPITAL_RADAR'
  | 'HOSPITAL_ALERTS'
  | 'HOSPITAL_RESPONSES'
  | 'HOSPITAL_FORECAST'
  | 'HOSPITAL_PROFILE'
  
  // REDGRID Super Admin Portal Screens
  | 'ADMIN_DASHBOARD'
  | 'ADMIN_ORGANIZATIONS'
  | 'ADMIN_USERS'
  | 'ADMIN_BLOOD_STOCK'
  | 'ADMIN_STOCK'
  | 'ADMIN_COMPLAINTS'
  | 'ADMIN_BANS'
  | 'ADMIN_HOSPITALS'
  | 'ADMIN_EMERGENCIES'
  | 'ADMIN_ALERTS'
  | 'ADMIN_RADAR'
  | 'ADMIN_REPORTS'
  | 'ADMIN_ANALYTICS'
  | 'ADMIN_SETTINGS'
  
  // Hospital Portal Screen
  | 'HOSPITAL_ANALYTICS'
  
  // Compatibility Aliases
  | 'DONOR_DASHBOARD';

export function getStockStatus(quantity: number): StockStatus {
  if (quantity > 20) return 'Available';
  if (quantity >= 10) return 'Medium';
  if (quantity >= 1) return 'Low';
  return 'Critical';
}

export type NotificationType =
  | 'EMERGENCY_ALERT'
  | 'DONOR_RESPONSE'
  | 'EMERGENCY_FULFILLED'
  | 'EMERGENCY_CANCELLED'
  | 'DONOR_STATUS_UPDATE'
  | 'ORGANIZATION_APPROVED'
  | 'ORGANIZATION_REJECTED'
  | 'ORGANIZATION_SUSPENDED'
  | 'INVENTORY_LOW'
  | 'GENERAL';

export interface AppNotification {
  id: string;
  recipientUserId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId: string | null;
  relatedEntityType: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
  timeAgo?: string;
}

