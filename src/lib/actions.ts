'use server';

import { z } from 'zod';
import { recommendFrameworks } from '@/ai/flows/case-study-framework-recommendation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CaseStudySchema, CaseStudyData } from '@/lib/schemas/case-study';
import { createSupabaseServerClient as updateSupabaseClient } from '@/lib/supabase/server'; 

// Type for ActionResult
type ActionResult = {
  success: boolean;
  message?: string;
  errors?: z.ZodIssue[]; 
};

// Type for Rating Report (Mock structure - kept for context)
type Report = {
  overallScore: number;
  ratings: {
    problemDefinition: number;
    swotDepth: number;
    frameworkApplication: number;
    recommendationJustification: number;
  };
  summary: string;
  feedback: string;
};

// --- AI RATING ACTION (FIXED) ---
export async function rateCaseStudyAction(caseStudyId: string, caseData: CaseStudyData): Promise<{ success: boolean; report: Report | null; message?: string }> {
  const supabase = updateSupabaseClient();
  
  // 1. Simulate AI processing (replace with actual Genkit/Gemini call)
  const mockReport: Report = {
    overallScore: 4,
    ratings: {
      problemDefinition: 5,
      swotDepth: 4,
      frameworkApplication: 3,
      recommendationJustification: 4,
    },
    summary: "Your analysis clearly defines the problem, but the framework application could be more detailed.",
    feedback: "Ensure every point in your SWOT directly informs your framework analysis. The justification was strong, but link it back to your weaknesses.",
  };

  // 2. Convert report to string to store in the database (JSON string)
  const aiReportString = JSON.stringify(mockReport);

  // 3. Update the case study record with the AI Report
  try {
    const { error } = await supabase
      .from('case_studies')
      .update({ 
        ai_report: aiReportString 
      })
      .eq('id', caseStudyId);

    if (error) {
      console.error('Supabase update error for AI report:', error);
      throw new Error(error.message);
    }
    
    revalidatePath('/case-studies');
    revalidatePath(`/case-studies/${caseStudyId}`); // <-- ADDED THIS LINE

    return { success: true, report: mockReport };
  } catch (error) {
    console.error('Error rating case study:', error);
    return { success: false, report: null, message: (error as Error).message || 'Failed to save AI report.' };
  }
}
// --- END AI RATING ACTION ---


// Recommend Frameworks action (Kept for completeness)
export async function recommendFrameworksAction(input: { caseTitle: string; caseSubject: string }) {
  try {
    const result = await recommendFrameworks(input);
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'An error occurred while fetching framework recommendations.' };
  }
}

// --- UPDATED Create Case Study Action (FIXED) ---
export async function createCaseStudyAction(data: CaseStudyData): Promise<ActionResult & { id?: string }> {
  const supabase = createSupabaseServerClient();

  const validatedFields = CaseStudySchema.safeParse(data);

  if (!validatedFields.success) {
    console.error("Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      errors: validatedFields.error.issues,
      message: 'Validation failed. Please check the form fields.',
    };
  }
  
  // 2. Prepare data for Supabase (match column names)
  const caseDataForSupabase = {
    // Basic Fields
    case_title: validatedFields.data.caseTitle,
    case_subject: validatedFields.data.caseSubject,
    protagonist: validatedFields.data.protagonist,
    core_problem: validatedFields.data.coreProblem,
    // Source Fields
    case_source_url: validatedFields.data.caseSourceUrl, 
    case_source_file: validatedFields.data.caseSourceFile, 
    // SWOT Fields
    strengths: validatedFields.data.strengths,
    weaknesses: validatedFields.data.weaknesses,
    opportunities: validatedFields.data.opportunities,
    threats: validatedFields.data.threats,
    // Other Fields 
    frameworks: validatedFields.data.frameworks, 
    alternative_solutions: validatedFields.data.alternativeSolutions, 
    recommendation: validatedFields.data.recommendation,
    justification: validatedFields.data.justification,
    framework_inputs: validatedFields.data.frameworkInputs,
    ai_report: validatedFields.data.aiReport, // <-- ADDED THIS LINE
  };

  // 3. Insert data into Supabase
  try {
    const { data: insertedData, error } = await supabase
      .from('case_studies')
      .insert(caseDataForSupabase)
      .select('id') 
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(error.message);
    }
    
    return { success: true, message: 'Successfully created case study.', id: insertedData.id };

  } catch (error) {
    console.error('Error creating case study:', error);
    return {
      success: false,
      message: (error as Error).message || 'Database error: Failed to create case study.',
    };
  }
}

// --- NEW: Update Case Study Action (Added back for you) ---
export async function updateCaseStudyAction(caseId: string, data: CaseStudyData): Promise<ActionResult> {
  const supabase = createSupabaseServerClient();

  // 1. Validate data
  const validatedFields = CaseStudySchema.safeParse(data);

  if (!validatedFields.success) {
    console.error("Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      errors: validatedFields.error.issues,
      message: 'Validation failed. Please check the form fields.',
    };
  }

  // 2. Prepare data for Supabase (match column names)
  const caseDataForSupabase = {
    case_title: validatedFields.data.caseTitle,
    case_subject: validatedFields.data.caseSubject,
    protagonist: validatedFields.data.protagonist,
    core_problem: validatedFields.data.coreProblem,
    case_source_url: validatedFields.data.caseSourceUrl,
    case_source_file: validatedFields.data.caseSourceFile,
    strengths: validatedFields.data.strengths,
    weaknesses: validatedFields.data.weaknesses,
    opportunities: validatedFields.data.opportunities,
    threats: validatedFields.data.threats,
    frameworks: validatedFields.data.frameworks,
    alternative_solutions: validatedFields.data.alternativeSolutions,
    recommendation: validatedFields.data.recommendation,
    justification: validatedFields.data.justification,
    framework_inputs: validatedFields.data.frameworkInputs,
    ai_report: validatedFields.data.aiReport, // Ensure aiReport is passed through
  };

  // 3. Update data in Supabase
  try {
    const { error } = await supabase
      .from('case_studies')
      .update(caseDataForSupabase)
      .eq('id', caseId);

    if (error) {
      console.error('Supabase update error:', error);
      throw new Error(error.message);
    }

    // 4. Revalidate paths
    revalidatePath('/case-studies');
    revalidatePath(`/case-studies/${caseId}`);

    return { success: true, message: 'Case study updated successfully.' };

  } catch (error) {
    console.error('Error updating case study:', error);
    return {
      success: false,
      message: (error as Error).message || 'Database error: Failed to update case study.',
    };
  }
}