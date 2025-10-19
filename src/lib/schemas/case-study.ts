// src/lib/schemas/case-study.ts
import { z } from 'zod';


// Define Zod schema for validation
export const CaseStudySchema = z.object({
  caseTitle: z.string().min(3, 'Case title must be at least 3 characters'),
  caseSubject: z.string().optional(),
  protagonist: z.string().optional(),
  coreProblem: z.string().optional(),
  // --- NEW FIELDS ADDED ---
  caseSourceUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  caseSourceFile: z.string().optional(), // Placeholder for file metadata/ID
  // -------------------------
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  opportunities: z.string().optional(),
  threats: z.string().optional(),
  frameworks: z.array(z.string()).optional().default([]),
  alternativeSolutions: z.array(z.object({
    solution: z.string().optional(),
    pros: z.string().optional(),
    cons: z.string().optional(),
  })).optional().default([]),
  recommendation: z.string().optional(),
  justification: z.string().optional(),
  frameworkInputs: z.record(z.string(), z.any()).optional().describe('Data entered for specific selected frameworks'),
  aiReport: z.string().optional(), 
});

export type CaseStudyData = z.infer<typeof CaseStudySchema>;