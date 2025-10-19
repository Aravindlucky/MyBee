'use client';

import { useState, useTransition, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, dateFnsLocalizer, Views, type Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css'; // Import calendar styles

import { useToast } from '@/hooks/use-toast';
import { addDeadline, updateDeadline, deleteDeadline } from '@/lib/deadline-actions';
// --- CORRECTED IMPORT ---
import { type Deadline, type CourseForCalendar } from '@/lib/types'; // Import CourseForCalendar from types.ts

// UI Components
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'; // Removed DialogTrigger as it's not used directly here
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as ShadcnCalendar } from '@/components/ui/calendar'; // Alias Shadcn calendar
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PlusCircle, CalendarIcon, Edit, Trash2, Loader2 } from 'lucide-react'; // Removed Info as it's not used
import { cn } from '@/lib/utils';

// Setup date-fns localizer for react-big-calendar
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// --- Define Event type for react-big-calendar ---
interface CalendarEvent extends Event {
  resource: Deadline; // Store the original Deadline object
}

// --- Validation Schema for Add/Edit Deadline Form ---
const deadlineSchema = z.object({
  title: z.string().min(2, "Title is required."),
  course_id: z.string({ required_error: "Please select a course." }),
  due_date: z.date({ required_error: "Due date is required." }),
  type: z.string().min(2, "Type is required (e.g., Assignment, Exam)."),
  description: z.string().optional(),
  deadlineId: z.string().optional(), // For editing
});

type DeadlineFormData = z.infer<typeof deadlineSchema>;

// --- CORRECTED PROPS INTERFACE ---
interface CalendarClientProps {
  initialDeadlines: Deadline[];
  courses: CourseForCalendar[];
}

export function CalendarClient({ initialDeadlines, courses }: CalendarClientProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [deadlines, setDeadlines] = useState(initialDeadlines);

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [deadlineToDelete, setDeadlineToDelete] = useState<Deadline | null>(null); // For delete confirmation

  const form = useForm<DeadlineFormData>({
    resolver: zodResolver(deadlineSchema),
    defaultValues: {
      title: '',
      course_id: undefined,
      due_date: undefined,
      type: 'Assignment',
      description: '',
    },
  });

  // --- Map Deadlines to CalendarEvents ---
  const events = useMemo((): CalendarEvent[] => {
    return deadlines.map(deadline => ({
      // Use optional chaining just in case courses is null/undefined during fetch
      title: `${deadline.courses?.code || 'Course'}: ${deadline.title}`,
      start: new Date(deadline.due_date),
      end: new Date(deadline.due_date),
      allDay: true,
      resource: deadline,
    }));
  }, [deadlines]);

  // --- Handlers ---
  const handleOpenFormDialog = (deadline: Deadline | null = null) => {
    setEditingDeadline(deadline);
    if (deadline) {
      form.reset({
        title: deadline.title,
        course_id: deadline.course_id,
        due_date: new Date(deadline.due_date),
        type: deadline.type,
        description: deadline.description || '',
        deadlineId: deadline.id,
      });
    } else {
      form.reset({ title: '', course_id: undefined, due_date: new Date(), type: 'Assignment', description: '', deadlineId: undefined });
    }
    setIsFormOpen(true);
  };

  const onSubmit = (data: DeadlineFormData) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('course_id', data.course_id);
      formData.append('due_date', data.due_date.toISOString());
      formData.append('type', data.type);
      formData.append('description', data.description || '');

      let result;
      if (editingDeadline) {
        formData.append('deadlineId', editingDeadline.id);
        result = await updateDeadline(formData);
      } else {
        result = await addDeadline(formData);
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
    if (!deadlineToDelete) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.append('deadlineId', deadlineToDelete.id);
      formData.append('courseId', deadlineToDelete.course_id);
      const result = await deleteDeadline(formData);
      if (result.success) {
        toast({ title: "Success!", description: result.message });
        setDeadlineToDelete(null);
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    handleOpenFormDialog(event.resource);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold">Deadlines Calendar</h1>
          <p className="text-muted-foreground max-w-2xl text-lg mt-2">
            View all your upcoming assignments, exams, and project due dates.
          </p>
        </div>
        <Button onClick={() => handleOpenFormDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Deadline
        </Button>
      </div>

      <div className="h-[70vh] bg-card p-4 rounded-xl shadow">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
          style={{ height: '100%' }}
          onSelectEvent={handleSelectEvent}
        />
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDeadline ? 'Edit Deadline' : 'Add New Deadline'}</DialogTitle>
            <DialogDescription>
              {editingDeadline ? 'Update the details for this deadline.' : 'Enter the details for the new deadline.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Assignment 1 Submission" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="course_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses.map(course => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.code ? `${course.code} - ` : ''}{course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <ShadcnCalendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Assignment, Exam, Project" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any specific details about the deadline..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 sm:gap-0 pt-4">
                 {editingDeadline && (
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button type="button" variant="destructive" className="mr-auto">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                       </AlertDialogTrigger>
                       <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the deadline "{editingDeadline.title}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            {/* Make sure onClick calls the correct handler */}
                            <AlertDialogAction onClick={() => { setDeadlineToDelete(editingDeadline); handleDelete(); setIsFormOpen(false); }} className="bg-destructive hover:bg-destructive/90">
                              Yes, delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                   </AlertDialog>
                 )}
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingDeadline ? 'Save Changes' : 'Add Deadline'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}