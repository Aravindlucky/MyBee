'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Wand2, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { CaseStudyData } from '@/lib/types';
import { recommendFrameworksAction } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function FrameworkRecommender() {
  const { watch, setValue, getValues } = useFormContext<CaseStudyData>();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const currentFrameworks = watch('frameworks') || [];

  const handleSuggestFrameworks = async () => {
    setIsLoading(true);
    setSuggestions([]);
    const caseTitle = getValues('caseTitle');
    const caseSubject = getValues('caseSubject');

    if (!caseTitle || !caseSubject) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide a Case Title and Subject before getting suggestions.',
      });
      setIsLoading(false);
      return;
    }

    const result = await recommendFrameworksAction({ caseTitle, caseSubject });
    
    if (result.success && result.data) {
      setSuggestions(result.data.frameworks.filter(f => !currentFrameworks.includes(f)));
    } else {
      toast({
        variant: 'destructive',
        title: 'AI Suggestion Failed',
        description: result.error || 'Could not fetch framework recommendations at this time.',
      });
    }
    setIsLoading(false);
  };

  const toggleFramework = (framework: string) => {
    const updatedFrameworks = currentFrameworks.includes(framework)
      ? currentFrameworks.filter((f) => f !== framework)
      : [...currentFrameworks, framework];
    setValue('frameworks', updatedFrameworks, { shouldValidate: true });
    
    if (suggestions.includes(framework)) {
        setSuggestions(suggestions.filter(f => f !== framework));
    }
  };

  return (
    <div className="space-y-4">
      <Button type="button" onClick={handleSuggestFrameworks} disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Wand2 className="mr-2 h-4 w-4" />
        )}
        Suggest Frameworks
      </Button>

      {(suggestions.length > 0 || currentFrameworks.length > 0) && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {currentFrameworks.map((framework) => (
              <Badge key={framework} variant="default" className="cursor-pointer text-sm py-1 px-3" onClick={() => toggleFramework(framework)}>
                {framework}
              </Badge>
            ))}
            {suggestions.map((framework) => (
              <Badge key={framework} variant="secondary" className="cursor-pointer text-sm py-1 px-3" onClick={() => toggleFramework(framework)}>
                {framework}
              </Badge>
            ))}
          </div>
           <p className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="flex items-center gap-1"><Badge variant="default" className="h-3 w-3 p-0 shrink-0"/> Selected</span>
            <span className="flex items-center gap-1"><Badge variant="secondary" className="h-3 w-3 p-0 shrink-0"/> AI Suggestion</span>
             (Click to add/remove)
          </p>
        </div>
      )}
    </div>
  );
}
