'use server';

import { z } from 'zod';
import { recommendFrameworks } from '@/ai/flows/case-study-framework-recommendation';
import { CaseStudySchema, CaseStudyData } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function recommendFrameworksAction(input: { caseTitle: string; caseSubject: string }) {
  try {
    const result = await recommendFrameworks(input);
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'An error occurred while fetching framework recommendations.' };
  }
}

export async function createCaseStudyAction(data: CaseStudyData) {
  const validatedFields = CaseStudySchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Case Study.',
    };
  }

  // In a real app, you would save this to a database
  console.log('New Case Study Created:', validatedFields.data);

  // Revalidate the case studies page to show the new entry (if it were real)
  revalidatePath('/case-studies');

  return { success: true, message: 'Successfully created case study.' };
}
