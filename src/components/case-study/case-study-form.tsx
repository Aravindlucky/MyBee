'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CaseStudySchema, type CaseStudyData } from '@/lib/types';
import { createCaseStudyAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FrameworkRecommender } from './framework-recommender';
import { Trash2, PlusCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';

export function CaseStudyForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CaseStudyData>({
    resolver: zodResolver(CaseStudySchema),
    defaultValues: {
      caseTitle: '',
      caseSubject: '',
      protagonist: '',
      coreProblem: '',
      strengths: '',
      weaknesses: '',
      opportunities: '',
      threats: '',
      frameworks: [],
      alternativeSolutions: [{ solution: '', pros: '', cons: '' }],
      recommendation: '',
      justification: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "alternativeSolutions",
  });

  const onSubmit = async (data: CaseStudyData) => {
    setIsSubmitting(true);
    const result = await createCaseStudyAction(data);
    if (result.success) {
      toast({
        title: 'Success!',
        description: result.message,
      });
      router.push('/case-studies');
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message || 'An unexpected error occurred.',
      });
    }
    setIsSubmitting(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Case Details</CardTitle>
            <CardDescription>Start by defining the context of the case study.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="caseTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Case Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Netflix's International Expansion" {...field} />
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
            <FormField
              control={form.control}
              name="protagonist"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Protagonist & Key Players</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Reed Hastings, Blockbuster, Local cable companies" {...field} />
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
                    <Textarea placeholder="Describe the central challenge or decision the protagonist is facing." {...field} />
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
            <CardDescription>Analyze the internal and external factors.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
              <FormField control={form.control} name="strengths" render={({ field }) => (
                  <FormItem><FormLabel>Strengths</FormLabel><FormControl><Textarea placeholder="Internal, positive attributes..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="weaknesses" render={({ field }) => (
                  <FormItem><FormLabel>Weaknesses</FormLabel><FormControl><Textarea placeholder="Internal, negative attributes..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="opportunities" render={({ field }) => (
                  <FormItem><FormLabel>Opportunities</FormLabel><FormControl><Textarea placeholder="External, positive factors..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="threats" render={({ field }) => (
                  <FormItem><FormLabel>Threats</FormLabel><FormControl><Textarea placeholder="External, negative factors..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Relevant Frameworks</CardTitle>
            <CardDescription>Use AI to suggest frameworks or add them manually.</CardDescription>
          </CardHeader>
          <CardContent>
            <FrameworkRecommender />
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Alternative Solutions</CardTitle>
            <CardDescription>Outline potential paths forward with their pros and cons.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg relative space-y-4">
                 <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" /><span className="sr-only">Remove Solution</span>
                 </Button>
                 <FormField control={form.control} name={`alternativeSolutions.${index}.solution`} render={({ field }) => (
                    <FormItem><FormLabel>Alternative {index + 1}</FormLabel><FormControl><Input placeholder="Describe the alternative solution" {...field} /></FormControl><FormMessage /></FormItem>
                 )}/>
                 <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={form.control} name={`alternativeSolutions.${index}.pros`} render={({ field }) => (
                        <FormItem><FormLabel>Pros</FormLabel><FormControl><Textarea placeholder="List the advantages" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name={`alternativeSolutions.${index}.cons`} render={({ field }) => (
                        <FormItem><FormLabel>Cons</FormLabel><FormControl><Textarea placeholder="List the disadvantages" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                 </div>
              </div>
            ))}
             <Button type="button" variant="outline" size="sm" onClick={() => append({ solution: '', pros: '', cons: '' })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Alternative
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Final Recommendation</CardTitle>
            <CardDescription>State your final, justified recommendation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField control={form.control} name="recommendation" render={({ field }) => (
                <FormItem><FormLabel>Your Recommendation</FormLabel><FormControl><Textarea placeholder="Clearly state your final recommendation." {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="justification" render={({ field }) => (
                <FormItem><FormLabel>Justification</FormLabel><FormControl><Textarea placeholder="Explain why your recommendation is the best course of action, referencing your analysis." {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
          </CardContent>
        </Card>
        
        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/case-studies')}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Analysis
            </Button>
        </div>
      </form>
    </Form>
  );
}
