// src/components/case-study/case-study-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CaseStudySchema, type CaseStudyData } from '@/lib/schemas/case-study';
import { createCaseStudyAction, rateCaseStudyAction, updateCaseStudyAction } from '@/lib/actions'; // Import NEW action
import { useToast } from '@/hooks/use-toast';

// UI Components
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FrameworkRecommender } from './framework-recommender';
import { Trash2, PlusCircle, Loader2, Link, Upload, BookOpen, Star, Zap, Save } from 'lucide-react'; // Added Save
import { FrameworkInputs } from './FrameworkInputs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

// Type for Rating Report (must match src/lib/actions.ts mock)
type RatingReport = {
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

// Component to display the rating
function RatingDisplay({ report, onClose }: { report: RatingReport, onClose: () => void }) {
  const categories = [
    { name: "Problem Definition", score: report.ratings.problemDefinition },
    { name: "SWOT Depth", score: report.ratings.swotDepth },
    { name: "Framework Application", score: report.ratings.frameworkApplication },
    { name: "Recommendation Justification", score: report.ratings.recommendationJustification },
  ];
  const maxScore = 5;

  return (
    <DialogContent className="sm:max-w-[550px]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" /> AI Analysis Scorecard
        </DialogTitle>
        <DialogDescription>
          Your case study analysis has been reviewed. Here is the detailed feedback.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        {/* Overall Score */}
        <div className="text-center p-4 rounded-lg bg-primary/10">
          <p className="text-sm text-muted-foreground">Overall Rating</p>
          <p className="text-5xl font-extrabold text-primary">
            {report.overallScore}/5
          </p>
          <p className="text-lg font-medium mt-1">{report.summary}</p>
        </div>

        {/* Detailed Ratings */}
        <Separator className='my-4' />
        <h4 className="font-semibold text-base">Detailed Breakdown</h4>
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.name}>
              <div className="flex justify-between text-sm font-medium mb-1">
                <span>{cat.name}</span>
                <span className="text-primary">{cat.score} / {maxScore}</span>
              </div>
              <Progress value={(cat.score / maxScore) * 100} className="h-2" />
            </div>
          ))}
        </div>

        {/* Actionable Feedback */}
        <Separator className='my-4' />
        <h4 className="font-semibold text-base">Actionable Feedback</h4>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.feedback}</p>
      </div>

      <DialogFooter>
        <Button onClick={onClose}>
          Got It!
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// --- NEW PROPS ---
interface CaseStudyFormProps {
  defaultData?: CaseStudyData;
  caseId?: string;
}

export function CaseStudyForm({ defaultData, caseId }: CaseStudyFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRating, setIsRating] = useState(false);
  
  // --- Determine mode ---
  const isEditMode = !!caseId;

  // --- Set default source type based on data ---
  const [sourceType, setSourceType] = useState<'link' | 'file'>(
    defaultData?.caseSourceFile ? 'file' : 'link'
  );
  
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [report, setReport] = useState<RatingReport | null>(null);

  // --- Initialize form ---
  const form = useForm<CaseStudyData>({
    resolver: zodResolver(CaseStudySchema),
    // --- USE DEFAULT DATA ---
    defaultValues: defaultData || {
      caseTitle: '',
      caseSubject: '',
      protagonist: '',
      coreProblem: '',
      caseSourceUrl: '',
      caseSourceFile: '',
      strengths: '',
      weaknesses: '',
      opportunities: '',
      threats: '',
      frameworks: [],
      frameworkInputs: {},
      alternativeSolutions: [{ solution: '', pros: '', cons: '' }],
      recommendation: '',
      justification: '',
      aiReport: '', // Initialize for schema compatibility
    },
  });

  // --- Manage dynamic Alternative Solutions ---
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'alternativeSolutions',
  });
  
  // --- Handler to toggle between link and file input ---
  const toggleSourceType = () => {
    if (sourceType === 'link') {
      form.setValue('caseSourceUrl', '');
      setSourceType('file');
    } else {
      form.setValue('caseSourceFile', '');
      setSourceType('link');
    }
    form.clearErrors('caseSourceUrl');
    form.clearErrors('caseSourceFile');
  };


  // --- Submit handler (UPDATED) ---
  const onSubmit = async (data: CaseStudyData) => {
    setIsSubmitting(true);

    // 1. Prepare data (clear unused source field)
    if (sourceType === 'link') {
      data.caseSourceFile = undefined;
    } else {
      data.caseSourceUrl = undefined;
    }
    
    try {
      if (isEditMode) {
        // --- EDIT MODE ---
        const result = await updateCaseStudyAction(caseId, data);
        if (result.success) {
          toast({
            title: '✅ Success!',
            description: result.message || 'Case study updated successfully.',
          });
          // Optionally, redirect back to the list page after edit
          router.push('/case-studies'); 
        } else {
          throw new Error(result.message || 'Failed to update case study.');
        }

      } else {
        // --- CREATE MODE (Existing Logic) ---
        let newCaseId: string | undefined;
        const creationResult = await createCaseStudyAction(data);

        if (!creationResult.success || !creationResult.id) {
           throw new Error(creationResult.message || 'Failed to create case study.');
        }
        
        newCaseId = creationResult.id;
        
        toast({
            title: '✅ Success!',
            description: creationResult.message || 'Case study created successfully. Generating AI report...',
        });
        
        // 3. Trigger AI Rating
        setIsRating(true);
        const ratingResult = await rateCaseStudyAction(newCaseId, data); // Pass ID and data

        if (ratingResult.success && ratingResult.report) {
           setReport(ratingResult.report);
           setIsRatingDialogOpen(true); // Open dialog to show report
        } else {
            // If rating fails, just redirect, but show error toast
            toast({
                variant: 'destructive',
                title: 'AI Report Failed',
                description: ratingResult.message || 'Case study saved, but failed to generate AI report.',
            });
            router.push('/case-studies');
        }
      }

    } catch (err) {
      console.error('Submission error:', err);
      toast({
        variant: 'destructive',
        title: 'Server Error',
        description: (err as Error).message || 'Something went wrong while saving your case study.',
      });
      setIsSubmitting(false); // Ensure loading state stops on error

    } finally {
      // Only set submitting to false if NOT waiting for AI report
      if (!isRating || isEditMode) {
         setIsSubmitting(false);
      }
      // Rating state is handled separately
    }
  };
  
  const handleRatingDialogClose = () => {
      setIsRatingDialogOpen(false);
      // Once the user closes the dialog, redirect them to the list page
      router.push('/case-studies');
  }


  // --- JSX ---
  return (
    <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
           {/* All existing cards go here */}
           
           <Card className="rounded-xl">
             <CardHeader>
               <CardTitle>Case Details</CardTitle>
               <CardDescription>Define the core context of your case study.</CardDescription>
             </CardHeader>
             <CardContent className="grid md:grid-cols-2 gap-6">
               <FormField
                 control={form.control}
                 name="caseTitle"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Case Title</FormLabel>
                     <FormControl>
                       <Input placeholder="e.g., Netflix’s International Expansion" {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />

               <FormField
                 control={form.control}
                 name="caseSubject"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Case Subject / Industry</FormLabel>
                     <FormControl>
                       <Input placeholder="e.g., Global Strategy" {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />

               {/* Case Source Option (Icon on Left) */}
               <div className="md:col-span-2">
                 {sourceType === 'link' ? (
                   <FormField
                     control={form.control}
                     name="caseSourceUrl"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel className="flex items-center gap-2">
                           Case Source (URL)
                         </FormLabel>
                         <div className="flex items-start gap-2">
                            <Button
                               type="button"
                               variant="secondary"
                               size="icon"
                               onClick={toggleSourceType}
                               title="Switch to File Upload"
                               className="shrink-0"
                           >
                             <Link className="h-4 w-4" />
                           </Button>
                           <FormControl>
                             <Input type="url" placeholder="Paste link to case document..." {...field} />
                           </FormControl>
                         </div>
                         <FormMessage />
                         <FormDescription>
                             A link to the case document online (optional). Click the icon to switch to file upload.
                         </FormDescription>
                       </FormItem>
                     )}
                   />
                 ) : (
                   <FormField
                     control={form.control}
                     name="caseSourceFile"
                     render={({ field }) => (
                       <FormItem>
                          <FormLabel className="flex items-center gap-2">
                           Case Source (File)
                         </FormLabel>
                         <div className="flex items-start gap-2">
                            <Button
                               type="button"
                               variant="secondary"
                               size="icon"
                               onClick={toggleSourceType}
                               title="Switch to URL Link"
                               className="shrink-0"
                           >
                             <Upload className="h-4 w-4" />
                           </Button>
                           <FormControl>
                             <Input type="file" onChange={(e) => field.onChange(e.target.files ? e.target.files[0].name : '')} />
                           </FormControl>
                         </div>
                         <FormMessage>
                         </FormMessage>
                          <FormDescription>
                            Select a PDF or document file (Note: Upload functionality is pending). Click the icon to switch to URL link.
                          </FormDescription>
                       </FormItem>
                     )}
                   />
                 )}
               </div>

               <FormField
                 control={form.control}
                 name="protagonist"
                 render={({ field }) => (
                   <FormItem className="md:col-span-2">
                     <FormLabel>Protagonist & Key Players</FormLabel>
                     <FormControl>
                       <Input
                         placeholder="e.g., Reed Hastings, Blockbuster, Local Cable Companies"
                         {...field}
                       />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />

               <FormField
                 control={form.control}
                 name="coreProblem"
                 render={({ field }) => (
                   <FormItem className="md:col-span-2">
                     <FormLabel>Core Problem / Decision to be Made</FormLabel>
                     <FormControl>
                       <Textarea
                         placeholder="Describe the central challenge or decision the protagonist is facing."
                         {...field}
                       />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
             </CardContent>
           </Card>

           <Card className="rounded-xl">
             <CardHeader>
               <CardTitle>SWOT Analysis</CardTitle>
               <CardDescription>Evaluate internal and external factors.</CardDescription>
             </CardHeader>
             <CardContent className="grid md:grid-cols-2 gap-6">
               {(['strengths', 'weaknesses', 'opportunities', 'threats'] as const).map((name) => (
                 <FormField
                   key={name}
                   control={form.control}
                   name={name}
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel className="capitalize">{name}</FormLabel>
                       <FormControl>
                         <Textarea
                           placeholder={
                             name === 'strengths'
                               ? 'Internal, positive attributes...'
                               : name === 'weaknesses'
                               ? 'Internal, negative attributes...'
                               : name === 'opportunities'
                               ? 'External, positive factors...'
                               : 'External, negative factors...'
                           }
                           {...field}
                         />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
               ))}
             </CardContent>
           </Card>

           <Card className="rounded-xl">
             <CardHeader>
               <CardTitle>Relevant Frameworks</CardTitle>
               <CardDescription>
                 Select frameworks for your analysis. Use AI for suggestions based on title and subject.
               </CardDescription>
             </CardHeader>
             <CardContent>
               <FrameworkRecommender />
               <FormField control={form.control} name="frameworks" render={() => <FormMessage />} />
             </CardContent>
           </Card>
           
           <Card className="rounded-xl">
             <CardHeader>
               <CardTitle>Framework Analysis</CardTitle>
               <CardDescription>
                 Apply each selected framework to the case study and document your findings.
               </CardDescription>
             </CardHeader>
             <CardContent className="p-0">
               <FrameworkInputs />
             </CardContent>
           </Card>


           <Card className="rounded-xl">
             <CardHeader>
               <CardTitle>Alternative Solutions</CardTitle>
               <CardDescription>List potential strategies with their pros and cons.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
               {fields.map((field, index) => (
                 <div
                   key={field.id}
                   className="relative p-4 border rounded-lg space-y-4 bg-secondary/30"
                 >
                   <Button
                     type="button"
                     variant="ghost"
                     size="icon"
                     className="absolute top-2 right-2 text-muted-foreground hover:text-destructive h-7 w-7"
                     onClick={() => remove(index)}
                   >
                     <Trash2 className="h-4 w-4" />
                     <span className="sr-only">Remove Solution</span>
                   </Button>

                   <FormField
                     control={form.control}
                     name={`alternativeSolutions.${index}.solution`}
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Alternative {index + 1}</FormLabel>
                         <FormControl>
                           <Input placeholder="Describe the alternative solution" {...field} />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />

                   <div className="grid md:grid-cols-2 gap-4">
                     <FormField
                       control={form.control}
                       name={`alternativeSolutions.${index}.pros`}
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Pros</FormLabel>
                           <FormControl>
                             <Textarea placeholder="List the advantages" {...field} rows={3} />
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                     <FormField
                       control={form.control}
                       name={`alternativeSolutions.${index}.cons`}
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Cons</FormLabel>
                           <FormControl>
                             <Textarea placeholder="List the disadvantages" {...field} rows={3} />
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                   </div>
                 </div>
               ))}

               <Button
                 type="button"
                 variant="outline"
                 size="sm"
                 onClick={() => append({ solution: '', pros: '', cons: '' })}
               >
                 <PlusCircle className="mr-2 h-4 w-4" /> Add Alternative
               </Button>
             </CardContent>
           </Card>

           <Card className="rounded-xl">
             <CardHeader>
               <CardTitle>Final Recommendation</CardTitle>
               <CardDescription>
                 Provide your final recommendation and justify it based on analysis.
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
               <FormField
                 control={form.control}
                 name="recommendation"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Your Recommendation</FormLabel>
                     <FormControl>
                       <Textarea placeholder="Clearly state your final recommendation." {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
               <FormField
                 control={form.control}
                 name="justification"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Justification</FormLabel>
                     <FormControl>
                       <Textarea
                         placeholder="Explain why your recommendation is best, referencing your analysis."
                         {...field}
                       />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
             </CardContent>
           </Card>

          {/* --- Action Buttons --- */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/case-studies')} disabled={isSubmitting || isRating}>
              Cancel
            </Button>
            
            {/* --- DYNAMIC SUBMIT BUTTON --- */}
            {isEditMode ? (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting || isRating}>
                {(isSubmitting && !isRating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isRating ? (
                   <>
                     <Zap className="mr-2 h-4 w-4 animate-pulse" />
                     Generating AI Report...
                   </>
                ) : (
                  <>
                    <Star className="mr-2 h-4 w-4" />
                    Save & Get AI Scorecard
                  </>
                )}
              </Button>
            )}
            
          </div>
        </form>
      </Form>
      
      {/* --- AI RATING MODAL (Only for create mode) --- */}
      {!isEditMode && report && (
        <Dialog open={isRatingDialogOpen} onOpenChange={handleRatingDialogClose}>
          {/* Using the custom component to display the report */}
          <RatingDisplay report={report} onClose={handleRatingDialogClose} />
        </Dialog>
      )}
    </Dialog>
  );
}