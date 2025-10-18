import { CaseStudyForm } from '@/components/case-study/case-study-form';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewCaseStudyPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex flex-col space-y-2 text-center mb-8">
          <h1 className="font-headline text-3xl md:text-4xl font-bold">Case Study Analyzer</h1>
          <p className="text-muted-foreground text-lg">
            Systematically break down any business case from start to finish.
          </p>
        </div>
        <CaseStudyForm />
      </div>
    </main>
  );
}
