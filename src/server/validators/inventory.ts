import { z } from 'zod';
import { parseBloodGroup } from '../utils/bloodGroup';

export const bloodGroupParamSchema = z
  .string()
  .min(1, 'Blood group parameter is required')
  .refine((val) => parseBloodGroup(val) !== null, {
    message: 'Invalid blood group. Supported: A+, A-, B+, B-, AB+, AB-, O+, O-',
  });

export const updateStockSchema = z
  .object({
    delta: z
      .number({ message: 'Delta must be an integer' })
      .int('Delta must be an integer')
      .optional(),
    quantity: z
      .number({ message: 'Quantity must be a number' })
      .int('Quantity must be an integer')
      .min(0, 'Quantity cannot be negative')
      .optional(),
    reason: z
      .string()
      .trim()
      .max(250, 'Reason must not exceed 250 characters')
      .optional()
      .default('MANUAL_ADJUSTMENT'),
  })
  .refine(
    (data) => data.delta !== undefined || data.quantity !== undefined,
    {
      message: 'Either delta or quantity must be provided',
      path: ['delta'],
    }
  )
  .refine(
    (data) => data.delta === undefined || data.delta !== 0,
    {
      message: 'Delta must not be zero',
      path: ['delta'],
    }
  );

export const adminUpdateStockSchema = z
  .object({
    organizationId: z.string().uuid('Invalid organization ID format'),
    delta: z
      .number({ message: 'Delta must be an integer' })
      .int('Delta must be an integer')
      .optional(),
    quantity: z
      .number({ message: 'Quantity must be a number' })
      .int('Quantity must be an integer')
      .min(0, 'Quantity cannot be negative')
      .optional(),
    reason: z
      .string()
      .trim()
      .max(250, 'Reason must not exceed 250 characters')
      .optional()
      .default('ADMIN_MANUAL_ADJUSTMENT'),
  })
  .refine(
    (data) => data.delta !== undefined || data.quantity !== undefined,
    {
      message: 'Either delta or quantity must be provided',
      path: ['delta'],
    }
  )
  .refine(
    (data) => data.delta === undefined || data.delta !== 0,
    {
      message: 'Delta must not be zero',
      path: ['delta'],
    }
  );

export const transactionQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10) || 20)) : 20)),
  bloodGroup: z.string().optional(),
  organizationId: z.string().uuid('Invalid organization ID').optional(),
  reason: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
