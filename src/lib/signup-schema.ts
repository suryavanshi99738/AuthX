/**
 * Validation schemas for the sign-up flow — server-side only.
 * Uses zod for robust, typed input validation.
 */

import { z } from 'zod';

/** Phone number: allow +, digits, spaces, dashes, parentheses; 7–20 chars. */
const phoneRegex = /^\+?[0-9][0-9\s\-()]{6,19}$/;

export const signupInitSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(80, 'Full name is too long')
    .refine((v) => v.trim().length > 0, 'Full name is required'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address')
    .max(254, 'Email is too long'),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, 'Please enter a valid phone number')
    .max(20, 'Phone number is too long'),
});

export const signupCheckSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address')
    .max(254, 'Email is too long'),
});

export const signupResendSchema = signupCheckSchema;

export const signupVerifySchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address')
    .max(254, 'Email is too long'),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Code must be exactly 6 digits'),
});

export type SignupInitInput = z.infer<typeof signupInitSchema>;
export type SignupCheckInput = z.infer<typeof signupCheckSchema>;
export type SignupVerifyInput = z.infer<typeof signupVerifySchema>;
export type SignupResendInput = z.infer<typeof signupResendSchema>;
