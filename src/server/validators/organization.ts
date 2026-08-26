import { z } from 'zod';
import { OrganizationType, OrganizationStatus } from '@prisma/client';

export const additionalDocumentSchema = z.object({
  documentType: z.string().trim().min(1, 'Document type is required'),
  fileName: z.string().trim().min(1, 'File name is required'),
  fileUrl: z.string().trim().optional(),
  fileData: z.string().trim().optional(),
  fileSize: z.union([z.string(), z.number()]).optional(),
  mimeType: z.string().trim().optional(),
});

export const registerOrganizationBaseSchema = z.object({
  // Organization Information
  name: z.string().trim().min(2, 'Organization name must be at least 2 characters'),
  facilityType: z.string().trim().min(2, 'Facility / Organization type is required'),
  address: z.string().trim().min(3, 'Physical address is required'),
  city: z.string().trim().min(2, 'City is required'),
  state: z.string().trim().min(2, 'State / Province is required'),
  pincode: z.string().trim().min(2, 'PIN / Postal code is required'),
  phone: z.string().trim().min(5, 'Official phone number is required'),
  email: z.string().trim().email('Invalid official email address').toLowerCase(),
  website: z.string().trim().optional().or(z.literal('')),
  latitude: z.number().optional(),
  longitude: z.number().optional(),

  // License / Verification Information
  registrationNumber: z.string().trim().min(2, 'Registration / License number is required'),
  licenseIssuingAuthority: z.string().trim().min(2, 'License issuing authority is required'),
  licenseExpiryDate: z.string().trim().min(4, 'License expiry date is required'),
  licenseDocumentName: z.string().trim().min(1, 'Main License Document is required'),
  licenseDocumentSize: z.union([z.string(), z.number()]).optional(),
  licenseDocumentType: z.string().trim().optional(),
  licenseDocumentUrl: z.string().trim().optional(),
  licenseDocumentData: z.string().trim().optional(),
  additionalDocuments: z.array(additionalDocumentSchema).optional(),

  // Administrator Information
  adminName: z.string().trim().min(2, 'Administrator full name is required').optional(),
  contactPerson: z.string().trim().min(2, 'Administrator / Contact person name is required').optional(),
  adminEmail: z.string().trim().email('Invalid administrator email').toLowerCase().optional(),
  adminPhone: z.string().trim().min(5, 'Administrator phone number is required').optional(),
  contactPersonDesignation: z.string().trim().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password confirmation must be at least 6 characters').optional(),
}).refine(
  (data) => !data.confirmPassword || data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
).refine(
  (data) => !!(data.adminName || data.contactPerson),
  {
    message: 'Administrator full name is required',
    path: ['adminName'],
  }
);

export const registerHospitalSchema = registerOrganizationBaseSchema.extend({
  type: z.literal(OrganizationType.HOSPITAL).optional().default(OrganizationType.HOSPITAL),
});

export const registerBloodBankSchema = registerOrganizationBaseSchema.extend({
  type: z.literal(OrganizationType.BLOOD_BANK).optional().default(OrganizationType.BLOOD_BANK),
});

export const updateOrgProfileSchema = z.object({
  phone: z.string().trim().min(5).optional(),
  email: z.string().trim().email().toLowerCase().optional(),
  address: z.string().trim().min(3).optional(),
  city: z.string().trim().min(2).optional(),
  state: z.string().trim().optional(),
  pincode: z.string().trim().optional(),
  contactPerson: z.string().trim().min(2).optional(),
  contactPersonDesignation: z.string().trim().optional(),
  facilityType: z.string().trim().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const adminActionReasonSchema = z.object({
  reason: z.string().trim().min(2, 'Reason must be at least 2 characters').max(1000, 'Reason cannot exceed 1000 characters'),
});

export const documentUploadSchema = z.object({
  documentType: z.string().trim().min(2, 'Document type is required'),
  fileName: z.string().trim().min(1, 'File name is required'),
  fileUrl: z.string().trim().optional(),
  fileData: z.string().trim().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().trim().optional(),
});

export const orgFilterQuerySchema = z.object({
  type: z.enum(['HOSPITAL', 'BLOOD_BANK', 'ALL']).optional().default('ALL'),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'BANNED', 'ALL']).optional().default('ALL'),
  search: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export type RegisterHospitalInput = z.infer<typeof registerHospitalSchema>;
export type RegisterBloodBankInput = z.infer<typeof registerBloodBankSchema>;
export type UpdateOrgProfileInput = z.infer<typeof updateOrgProfileSchema>;
export type AdminActionReasonInput = z.infer<typeof adminActionReasonSchema>;

