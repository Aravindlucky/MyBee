import { z } from "zod";

export type Course = {
  id: string;
  title: string;
  code: string;
  professor: string;
  term: string;
};

export type Skill = {
  id: string;
  name: string;
  type: 'Hard' | 'Soft';
  confidence: number;
  notes: string;
};

export type Objective = {
  id: string;
  title: string;
  semester: string;
  keyResults: KeyResult[];
};

export type KeyResult = {
  id: string;
  description: string;
  isCompleted: boolean;
};

export type JournalEntry = {
  id: string;
  date: string; // ISO string
  content: string;
};

export type CaseStudySummary = {
  id: string;
  title: string;
  subject: string;
  lastUpdated: string;
}

export const CaseStudySchema = z.object({
  caseTitle: z.string().min(1, { message: "Case title is required." }),
  caseSubject: z.string().min(1, { message: "Case subject is required." }),
  protagonist: z.string().optional(),
  coreProblem: z.string().min(1, { message: "Core problem is required." }),
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  opportunities: z.string().optional(),
  threats: z.string().optional(),
  frameworks: z.array(z.string()).optional(),
  alternativeSolutions: z.array(z.object({
    solution: z.string().min(1, { message: "Solution cannot be empty." }),
    pros: z.string().optional(),
    cons: z.string().optional(),
  })).optional(),
  recommendation: z.string().min(1, { message: "Recommendation is required." }),
  justification: z.string().optional(),
});

export type CaseStudyData = z.infer<typeof CaseStudySchema>;
