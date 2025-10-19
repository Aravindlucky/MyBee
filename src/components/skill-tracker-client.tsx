'use client';

import { useState, useTransition, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { debounce } from 'lodash';
import { useToast } from '@/hooks/use-toast';
import { addSkill, deleteSkill, updateSkillConfidence, updateSkillDetails } from '@/lib/skill-actions';
import { type Skill } from '@/lib/types';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { SkillCard } from './skill-card'; // --- NEW IMPORT ---


// Validation schema for the add/edit form
const skillSchema = z.object({
  name: z.string().min(2, { message: "Skill name must be at least 2 characters." }),
  type: z.enum(['Hard', 'Soft'], { required_error: "You must select a skill type." }),
  notes: z.string().optional(),
  confidence: z.coerce.number().min(1).max(5),
  skillId: z.string().optional(), // For editing
});

type SkillFormData = z.infer<typeof skillSchema>;

interface SkillTrackerClientProps {
  skills: Skill[];
}

export function SkillTrackerClient({ skills: initialSkills }: SkillTrackerClientProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [skills, setSkills] = useState(initialSkills);

  // State for dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null); // For delete confirmation

  const form = useForm<SkillFormData>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      name: '',
      type: undefined,
      notes: '',
      confidence: 3,
    },
  });

  // --- Handlers ---
  const handleOpenFormDialog = (skill: Skill | null = null) => {
    setEditingSkill(skill);
    if (skill) {
      form.reset({
        name: skill.name,
        type: skill.type,
        notes: skill.notes || '',
        confidence: skill.latest_confidence,
        skillId: skill.id,
      });
    } else {
      form.reset({ name: '', type: undefined, notes: '', confidence: 3, skillId: undefined });
    }
    setIsFormOpen(true);
  };

  const onSubmit = (data: SkillFormData) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('type', data.type);
      formData.append('notes', data.notes || '');
      formData.append('confidence', data.confidence.toString());
      
      let result;
      if (editingSkill) {
        formData.append('skillId', editingSkill.id);
        result = await updateSkillDetails(formData);
      } else {
        result = await addSkill(formData);
      }

      if (result.success) {
        toast({ title: "Success!", description: result.message });
        setIsFormOpen(false);
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

  const handleDelete = () => {
    if (!skillToDelete) return;

    startTransition(async () => {
        const formData = new FormData();
        formData.append('skillId', skillToDelete.id);
        const result = await deleteSkill(formData);
         if (result.success) {
            toast({ title: "Success!", description: result.message });
            setSkillToDelete(null); // Close dialog on success
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    });
  };

  // Debounced function to update confidence
  const debouncedUpdateConfidence = useCallback(
    debounce((skillId: string, newConfidence: number) => {
      startTransition(async () => {
        await updateSkillConfidence(skillId, newConfidence);
      });
    }, 500), // 500ms delay
    []
  );

  const handleConfidenceChange = (skillId: string, newConfidence: number[]) => {
    // Optimistic UI update
    setSkills(prevSkills =>
      prevSkills.map(skill =>
        skill.id === skillId ? { ...skill, latest_confidence: newConfidence[0] } : skill
      )
    );
    debouncedUpdateConfidence(skillId, newConfidence[0]);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold">MBA Skill Tracker</h1>
          <p className="text-muted-foreground max-w-2xl text-lg mt-2">
            Track key hard and soft skills you want to develop during your MBA.
          </p>
        </div>
        <Button onClick={() => handleOpenFormDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Skill
        </Button>
      </div>
      
      {/* --- Card Grid Layout --- */}
      <AlertDialog onOpenChange={(open) => !open && setSkillToDelete(null)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onConfidenceChange={handleConfidenceChange}
              onEdit={handleOpenFormDialog}
              onDeleteTrigger={() => setSkillToDelete(skill)}
            />
          ))}
        </div>

        {skills.length === 0 && (
          <Card className="rounded-xl border-dashed">
            <CardContent className="py-10 text-center text-muted-foreground">
              <p>No skills added yet. Click "Add Skill" to get started.</p>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the skill "{skillToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes, delete skill'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- Add/Edit Skill Dialog (Unchanged) --- */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSkill ? 'Edit Skill' : 'Add a New Skill'}</DialogTitle>
            <DialogDescription>
              {editingSkill ? 'Update the details for this skill.' : 'Fill in the details for the new skill you want to track.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Financial Modeling" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Hard">Hard Skill</SelectItem>
                        <SelectItem value="Soft">Soft Skill</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Improvement Plan / Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Take a LinkedIn Learning course on DCF valuation." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="confidence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Confidence: {field.value}</FormLabel>
                    <FormControl>
                        <Slider
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            max={5} min={1} step={1}
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingSkill ? 'Save Changes' : 'Add Skill'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}