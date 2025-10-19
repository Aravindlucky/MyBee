'use client';

import { useState, useTransition, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { addObjective, deleteObjective, toggleKeyResult } from '@/lib/goal-actions';
import { type Objective, type KeyResult } from '@/lib/types';

// UI Components
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// --- Validation Schema for Add Objective Form ---
const objectiveSchema = z.object({
  title: z.string().min(3, "Objective title is required."),
  semester: z.string().optional(),
  keyResults: z.array(
    z.object({
      description: z.string().min(3, "Key result description is required."),
    })
  ).min(1, "At least one key result is required."),
});

type ObjectiveFormData = z.infer<typeof objectiveSchema>;

interface GoalTrackerClientProps {
  initialObjectives: Objective[];
}

// --- Helper: Calculate Progress ---
const calculateProgress = (keyResults: KeyResult[]) => {
  if (!keyResults || keyResults.length === 0) return 0;
  const completedCount = keyResults.filter(kr => kr.is_completed).length;
  return (completedCount / keyResults.length) * 100;
};

export function GoalTrackerClient({ initialObjectives }: GoalTrackerClientProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [objectives, setObjectives] = useState(initialObjectives);

  // State for dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [objectiveToDelete, setObjectiveToDelete] = useState<Objective | null>(null);

  const form = useForm<ObjectiveFormData>({
    resolver: zodResolver(objectiveSchema),
    defaultValues: {
      title: '',
      semester: '',
      keyResults: [{ description: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "keyResults",
  });

  // --- Handlers ---
  const onSubmit = (data: ObjectiveFormData) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('semester', data.semester || '');
      data.keyResults.forEach((kr, index) => {
        formData.append(`kr[${index}]`, kr.description);
      });

      const result = await addObjective(formData);
      if (result.success) {
        toast({ title: "Success!", description: result.message });
        setIsFormOpen(false);
        form.reset({ title: '', semester: '', keyResults: [{ description: '' }] });
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

  const handleDelete = () => {
    if (!objectiveToDelete) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.append('objectiveId', objectiveToDelete.id);
      const result = await deleteObjective(formData);
      if (result.success) {
        toast({ title: "Success!", description: result.message });
        setObjectiveToDelete(null);
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

  const handleToggleKR = (kr: KeyResult) => {
    // Optimistic UI update
    setObjectives(prevObjectives =>
      prevObjectives.map(obj =>
        obj.id === kr.objective_id
          ? {
              ...obj,
              key_results: obj.key_results.map(k =>
                k.id === kr.id ? { ...k, is_completed: !k.is_completed } : k
              ),
            }
          : obj
      )
    );

    // Fire off server action
    startTransition(async () => {
      const result = await toggleKeyResult(kr.id, kr.is_completed);
      if (!result.success) {
        toast({ title: "Sync Error", description: result.message, variant: "destructive" });
        // Revert optimistic update on failure
        setObjectives(prevObjectives =>
          prevObjectives.map(obj =>
            obj.id === kr.objective_id
              ? {
                  ...obj,
                  key_results: obj.key_results.map(k =>
                    k.id === kr.id ? { ...k, is_completed: kr.is_completed } : k
                  ),
                }
              : obj
          )
        );
      }
    });
  };
  
  // Memoize default open accordion item
  const defaultOpenItem = useMemo(() => {
    return objectives.length > 0 ? `item-${objectives[0].id}` : "";
  }, [objectives]);

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold">Goal Setting (OKRs)</h1>
          <p className="text-muted-foreground max-w-2xl text-lg mt-2">
            Set Objectives and Key Results for each semester to stay focused on what matters.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Objective
        </Button>
      </div>

      <AlertDialog onOpenChange={(open) => !open && setObjectiveToDelete(null)}>
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>My Objectives</CardTitle>
            <CardDescription>Your roadmap for personal and professional growth during your MBA.</CardDescription>
          </CardHeader>
          <CardContent>
            {objectives.length > 0 ? (
              <Accordion type="single" collapsible defaultValue={defaultOpenItem} className="w-full">
                {objectives.map((objective) => {
                  const progress = calculateProgress(objective.key_results);
                  return (
                    <AccordionItem key={objective.id} value={`item-${objective.id}`}>
                      <AccordionTrigger className="text-left hover:no-underline">
                        <div className="flex-1 pr-4">
                          <div className="flex justify-between items-center mb-1">
                            <h3 className="font-headline text-lg">{objective.title}</h3>
                            {objective.semester && <Badge variant="outline">{objective.semester}</Badge>}
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <Progress value={progress} className="h-2" />
                            <span className="text-sm font-semibold text-muted-foreground">{Math.round(progress)}%</span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <div className="space-y-4">
                          <h4 className="font-semibold">Key Results</h4>
                          {objective.key_results.map((kr) => (
                            <div key={kr.id} className="flex items-center space-x-3 p-3 bg-secondary/40 rounded-md">
                              <Checkbox
                                id={`kr-${kr.id}`}
                                checked={kr.is_completed}
                                onCheckedChange={() => handleToggleKR(kr)}
                                disabled={isPending}
                              />
                              <label
                                htmlFor={`kr-${kr.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {kr.description}
                              </label>
                            </div>
                          ))}
                           <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="mt-4 text-destructive hover:text-destructive" onClick={() => setObjectiveToDelete(objective)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Objective
                            </Button>
                           </AlertDialogTrigger>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            ) : (
                <div className="text-center py-10 text-muted-foreground">
                    <p>No objectives set yet. Click "Add Objective" to create your first one.</p>
                </div>
            )}
          </CardContent>
        </Card>
        
        {/* Delete Confirmation Dialog */}
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the objective "{objectiveToDelete?.title}" and all its key results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes, delete objective'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- Add Objective Dialog --- */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Objective</DialogTitle>
            <DialogDescription>
              Define your high-level goal and the key results that will measure its success.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Objective Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Master Corporate Finance" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Semester (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Term 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormLabel>Key Results</FormLabel>
                {fields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`keyResults.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input placeholder={`Key result ${index + 1}`} {...field} />
                          </FormControl>
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ description: "" })}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Key Result
                </Button>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Objective
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}