import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CaseStudyForm } from '@/components/case-study/case-study-form';
import { type CaseStudyData } from '@/lib/schemas/case-study';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

// Helper function to map Supabase data to form data
function mapDbToFormData(dbData: any): CaseStudyData {
  return {
    caseTitle: dbData.case_title || '',
    caseSubject: dbData.case_subject || '',
    protagonist: dbData.protagonist || '',
    coreProblem: dbData.core_problem || '',
    caseSourceUrl: dbData.case_source_url || '',
    caseSourceFile: dbData.case_source_file || '',
    strengths: dbData.strengths || '',
    weaknesses: dbData.weaknesses || '',
    opportunities: dbData.opportunities || '',
    threats: dbData.threats || '',
    frameworks: dbData.frameworks || [],
    alternativeSolutions: dbData.alternative_solutions || [{ solution: '', pros: '', cons: '' }],
    recommendation: dbData.recommendation || '',
    justification: dbData.justification || '',
    frameworkInputs: dbData.framework_inputs || {},
    aiReport: dbData.ai_report || '',
  };
}

export default async function EditCaseStudyPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { id } = params;

  // Fetch the specific case study
  const { data: caseStudy, error } = await supabase
    .from('case_studies')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !caseStudy) {
    console.error('Error fetching case study:', error);
    notFound();
  }

  // Map the snake_case data from DB to camelCase for the form
  const defaultData = mapDbToFormData(caseStudy);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="mx-auto w-full max-w-4xl">
        
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" asChild>
            <Link href="/case-studies">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <div className="flex flex-col">
            <h1 className="font-headline text-3xl md:text-4xl font-bold">
              Edit Case Study
            </h1>
            <p className="text-muted-foreground text-lg truncate max-w-lg">
              {defaultData.caseTitle}
            </p>
          </div>
        </div>
        
        <CaseStudyForm defaultData={defaultData} caseId={id} />
      </div>
    </main>
  );
}