'use client';

import { useFormContext } from 'react-hook-form';
import { type CaseStudyData } from '@/lib/schemas/case-study';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

/**
 * Renders dynamic input fields for selected business frameworks.
 */
export function FrameworkInputs() {
  const { watch, control } = useFormContext<CaseStudyData>();
  const frameworks = watch('frameworks') || [];

  if (frameworks.length === 0) {
    return (
      <Card className="rounded-xl border-dashed">
        <CardContent className="py-4 text-center text-sm text-muted-foreground">
          Select one or more frameworks to start analyzing.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl">
      <CardContent className="p-0">
        <Accordion type="multiple" className="w-full">
          {frameworks.map((framework, index) => (
            <AccordionItem key={framework} value={framework} className='px-6'>
              <AccordionTrigger className="font-semibold text-lg">{framework} Analysis</AccordionTrigger>
              <AccordionContent>
                <div className='py-2 space-y-4'>
                  {/*
                    This single Textarea will store the analysis result for the current framework.
                    The key is dynamically generated to store data in the 'frameworkInputs' object.
                    The name is: frameworkInputs[framework]
                  */}
                  <FormField
                    control={control}
                    name={`frameworkInputs.${framework}` as any} // Use 'any' to bypass strict key validation for dynamic field
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key Findings for {framework}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={`Analyze the case using the ${framework} framework and document your key findings here.`}
                            rows={6}
                            {...field}
                            value={field.value || ''} // Ensure it's a controlled component
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Separator />
                  {/* You can add specific custom fields for a framework here if needed */}
                  {/* {framework === 'Porter\'s Five Forces' && (
                    <p className="text-xs text-muted-foreground">
                      *Future update: Add dedicated sub-fields for each force.
                    </p>
                  )} */}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}