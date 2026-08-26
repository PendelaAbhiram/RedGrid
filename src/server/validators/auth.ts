import { z } from 'zod';
import { BloodGroup } from '@prisma/client';

export const bloodGroupMap: Record<string, BloodGroup> = {
  'A+': BloodGroup.A_POS,
  'A-': BloodGroup.A_NEG,
  'B+': BloodGroup.B_POS,
  'B-': BloodGroup.B_NEG,
  'AB+': BloodGroup.AB_POS,
  'AB-': BloodGroup.AB_NEG,
  'O+': BloodGroup.O_POS,
  'O-': BloodGroup.O_NEG,
  A_POS: BloodGroup.A_POS,
  A_NEG: BloodGroup.A_NEG,
  B_POS: BloodGroup.B_POS,
  B_NEG: BloodGroup.B_NEG,
  AB_POS: BloodGroup.AB_POS,
  AB_NEG: BloodGroup.AB_NEG,
  O_POS: BloodGroup.O_POS,
  O_NEG: BloodGroup.O_NEG,
};

export const registerUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  phone: z.string().trim().optional(),
  bloodGroup: z.string().refine((val) => val in bloodGroupMap, {
    message: 'Invalid blood group. Must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-',
  }),
  locationAddress: z.string().trim().optional(),
  locationCity: z.string().trim().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['USER', 'HOSPITAL', 'BLOOD_BANK', 'SUPER_ADMIN']).optional(),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
