/**
 * @file familyValidation.js
 * @description Zod validation schemas for Kutumbh FMS requests.
 */

const { z } = require('zod');

// Schema for individual member creation payload
const memberSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must have at least 2 characters'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], {
    errorMap: () => ({ message: 'Gender must be MALE, FEMALE, or OTHER' })
  }),
  dob: z.string().optional().nullable(),
  relationshipWithHead: z.string().optional().default('MEMBER'),
  maritalStatus: z.string().optional().nullable(),
  educationalQualification: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
  primaryOccupation: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
});

// Schema for updating member (fields optional hoti hain)
const updateMemberSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must have at least 2 characters').optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dob: z.string().optional().nullable(),
  relationshipWithHead: z.string().optional(),
  maritalStatus: z.string().optional().nullable(),
  educationalQualification: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
  primaryOccupation: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
});

// Schema for family registration payload
const registerFamilySchema = z.object({
  familyData: z.object({
    headName: z.string().trim().min(2, 'Head name must have at least 2 characters'),
    guardianName: z.string().trim().min(2, 'Guardian name is required'),
    contactNumber: z.string().regex(/^[6-9]\d{9}$/, 'Invalid 10-digit Indian mobile number').optional().nullable(),
    habitation: z.object({
      state: z.string().optional().default('Uttar Pradesh'),
      district: z.string().optional().default('Ballia'),
      block: z.string().optional().default('Dubahar'),
      village: z.string().trim().min(1, 'Village name is required'),
      habitationName: z.string().optional().nullable(),
      tolaMohalla: z.string().optional().nullable(),
    }),
    economicProfile: z.object({
      rationCardCategory: z.enum(['AAY', 'BPL', 'APL', 'NONE']).optional().default('NONE'),
      annualIncome: z.number().nonnegative().optional().default(0),
    }).optional().default({}),
  }),
  membersData: z.array(memberSchema).min(1, 'At least 1 member is required'),
});

// Schema for updating verification status
const verifyStatusSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED', 'PENDING'], {
    errorMap: () => ({ message: 'Status must be VERIFIED, REJECTED, or PENDING' })
  }),
  verifiedBy: z.string().optional().default('ADMIN'),
});

// Member deletion & succession schema
const removeMemberSchema = z.object({
  reason: z.string().min(2, 'Deactivation reason is required').optional().default('Administrative removal'),
  lifeEventFlag: z.enum(['निष्क्रिय', 'मृत', 'विवाह/ससुराल', 'प्रवासी', 'हटाया गया']).optional().default('निष्क्रिय'),
  newHeadMemberRefId: z.string().optional().nullable(),
  deactivateEntireFamily: z.boolean().optional().default(false),
});

module.exports = {
  memberSchema,
  updateMemberSchema,
  registerFamilySchema,
  verifyStatusSchema,
  removeMemberSchema,
};