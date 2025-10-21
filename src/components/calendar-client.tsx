'use client';

import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, EventInput } from '@fullcalendar/core';
import { Calendar as CalendarIcon, Zap, Clock, List, CheckCircle, XCircle } from 'lucide-react'; // <--- UPDATED ICONS
import { format, parseISO } from 'date-fns';

// Shadcn UI Imports - Make sure you have these installed
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  // SheetFooter, // Footer elements are inside the form
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // <--- NEW IMPORT
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // <--- NEW IMPORT
import { Progress } from '@/components/ui/progress'; // <--- NEW IMPORT
import { Badge } from '@/components/ui/badge'; // <--- NEW IMPORT

// Custom Hooks & Utils
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile'; // Corrected import name

// Server Actions & Types
import {
  addDeadline,
  updateDeadline,
  deleteDeadline,
  toggleDeadlineCompletion, // <--- NEW ACTION IMPORTED
  getDeadlinePrioritySummary, // <--- TYPE REFERENCE
  type DeadlineFormState,
} from '@/lib/deadline-actions';
import { type Course, type Deadline } from '@/lib/types';

// React DOM Hooks
import { useFormState, useFormStatus } from 'react-dom';

// --- NEW TYPE FOR AI SUMMARY PROP ---
type AIReport = Awaited<ReturnType<typeof getDeadlinePrioritySummary>>;

// Props for the main client component
interface CalendarClientProps {
  initialDeadlines: Deadline[];
  courses: Course[];
  aiSummary: AIReport; // <--- NEW PROP
}

// --- Helper Functions ---

// Helper to format deadline title including time if available
const formatEventTitle = (deadline: Deadline): string => {
  const coursePrefix = deadline.courses?.code ? `[${deadline.courses.code}] ` : '';
  let timeSuffix = '';
  // Check if due_time exists and is a valid HH:MM or HH:MM:SS string
  if (deadline.due_time && /^[0-2][0-9]:[0-5][0-9](:[0-5][0-9])?$/.test(deadline.due_time)) {
    try {
        const [hoursStr, minutesStr] = deadline.due_time.split(':');
        const hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr, 10);
        const tempDate = new Date();
        tempDate.setHours(hours, minutes);
        timeSuffix = ` (${format(tempDate, 'h:mm a')})`; // Format time using date-fns
    } catch (e) {
        console.error("Error formatting time string:", deadline.due_time, e);
        // Fallback or ignore suffix if parsing fails
    }
  }
  // Use course title from fetched relation if available, otherwise check type from deadline object
  const title = deadline.courses?.title ?? deadline.title; // Adjust if your Course type uses 'name'
  
  // --- ADD COMPLETED STATUS TO TITLE ---
  const completionPrefix = deadline.is_completed ? '✅ ' : '';
  
  return `${completionPrefix}${coursePrefix}${title}${timeSuffix}`;
};

// --- Main Calendar Client Component ---

export default function CalendarClient({ initialDeadlines, courses, aiSummary }: CalendarClientProps) {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Deadline | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState<Date | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isPending, startTransition] = React.useTransition(); // For toggle action

  // --- NEW: Calculate Completion Stats ---
  const totalDeadlines = initialDeadlines.length;
  const completedDeadlines = initialDeadlines.filter(d => d.is_completed).length;
  const completionPercentage = totalDeadlines > 0 ? (completedDeadlines / totalDeadlines) * 100 : 100;
  // --- END NEW STATS ---

  // Map initialDeadlines to FullCalendar events
  useEffect(() => {
    const mappedEvents = initialDeadlines.map((d) => ({
      id: d.id,
      title: formatEventTitle(d), // Use helper for title
      start: d.due_date, // Base date
      allDay: !d.due_time, // Event is allDay if due_time is NULL
      extendedProps: d,
       // Color coding based on completion status
       color: d.is_completed ? '#36B37E' : (d.course_id ? '#3788d8' : '#6c757d'), // Green for completed tasks/deadlines
       textColor: '#ffffff'
    }));
    setEvents(mappedEvents);
  }, [initialDeadlines]);

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedEvent(clickInfo.event.extendedProps as Deadline);
    setIsSheetOpen(true);
  };

  const handleDateClick = (arg: { date: Date; dateStr: string }) => {
    setDialogDate(arg.date);
    setIsDialogOpen(true);
    setSelectedEvent(null);
  };

  const handleFormActionComplete = (message: string) => {
    if (message.startsWith('Success')) {
      toast({ title: 'Success', description: message });
      setIsDialogOpen(false);
      setIsSheetOpen(false);
      setDialogDate(null);
      setSelectedEvent(null);
      // Data refresh is handled by server action revalidation
    } else {
      toast({ variant: 'destructive', title: 'Error', description: message || 'An unknown error occurred.' });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-8">
      
       {/* --- AI DEADLINE DASHBOARD (NEW SECTION) --- */}
      <section className="space-y-4">
        <h2 className="font-headline text-3xl md:text-4xl font-bold flex items-center gap-2">
            <Zap className="h-7 w-7 text-primary" /> Deadline Command Center
        </h2>
        <p className="text-muted-foreground max-w-2xl text-lg mt-2">
           Schedule and prioritize your academic and personal deadlines.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          
          {/* 1. AI Summary Card (Large Card) */}
          <Card className="lg:col-span-2 rounded-xl bg-primary/5">
            <CardHeader className='flex flex-row items-start space-y-0'>
                <Clock className="h-6 w-6 text-primary mr-3 mt-1 shrink-0" />
                <div className='flex-1'>
                    <CardTitle className="text-xl">Your Weekly Focus</CardTitle>
                    <CardDescription className='pt-1'>
                        Intelligent analysis of your upcoming academic load.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <Alert variant="default" className='border-primary/50 bg-primary/10 text-primary-foreground'>
                    <AlertTitle className="text-primary font-bold">Action Plan</AlertTitle>
                    <AlertDescription className='text-sm text-foreground'>
                        {aiSummary.data?.overallSummary || aiSummary.message || "Failed to generate AI summary."}
                    </AlertDescription>
                </Alert>
            </CardContent>
          </Card>

          {/* 2. Burn-Down/Completion Card (Small Card) */}
          <Card className="rounded-xl flex flex-col justify-between">
             <CardHeader className='pb-2'>
                <CardTitle className="text-lg">Deadlines Completed</CardTitle>
             </CardHeader>
             <CardContent>
                <div className='flex items-center gap-4'>
                    <Progress value={completionPercentage} className="h-2 flex-1" />
                    <span className="font-bold text-xl text-primary">{Math.round(completionPercentage)}%</span>
                </div>
                <p className='text-sm text-muted-foreground mt-2'>
                    {completedDeadlines} of {totalDeadlines} items complete.
                </p>
             </CardContent>
          </Card>
        </div>

        {/* 3. Top 3 Prioritized List */}
        {aiSummary.data?.prioritizedList.length > 0 && (
            <Card className="rounded-xl">
                 <CardHeader className='pb-2'>
                    <CardTitle className="text-xl flex items-center gap-2"><List className='h-5 w-5 text-accent'/> Top Priority List</CardTitle>
                    <CardDescription>Focus on these items first.</CardDescription>
                 </CardHeader>
                 <CardContent>
                    <div className="space-y-3">
                    {aiSummary.data.prioritizedList.map(item => {
                        const deadline = initialDeadlines.find(d => d.id === item.id);
                        if (!deadline || deadline.is_completed) return null;
                        
                        const priorityColor = 
                            item.priority === 'High' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/80' : 
                            item.priority === 'Medium' ? 'bg-accent text-accent-foreground hover:bg-accent/80' : 
                            'bg-primary text-primary-foreground hover:bg-primary/80';
                            
                        const date = deadline.due_date ? format(parseISO(deadline.due_date), 'MMM do') : 'TBD';

                        return (
                             <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-secondary/30 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{deadline.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {deadline.courses?.code || deadline.type} • Due {date}
                                    </p>
                                </div>
                                <Badge className={cn("text-xs w-16 justify-center", priorityColor)}>
                                    {item.priority}
                                </Badge>
                             </div>
                        );
                    })}
                    </div>
                 </CardContent>
            </Card>
        )}
      </section>
      {/* --- END AI DEADLINE DASHBOARD --- */}
      
      {/* --- Task Checklist (For is_completed demonstration) --- */}
      {initialDeadlines.filter(d => !d.course_id).length > 0 && (
          <section className="space-y-4">
              <h2 className="font-headline text-2xl font-bold flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-primary" /> General Task Checklist
              </h2>
              <Card className="rounded-xl">
                  <CardContent className="py-4 space-y-2">
                      {initialDeadlines.filter(d => !d.course_id).map((task) => (
                           <div key={task.id} className={cn("flex items-center space-x-3 p-3 rounded-md", task.is_completed ? "bg-secondary/40" : "hover:bg-secondary/30")}>
                               <Checkbox
                                   id={`task-${task.id}`}
                                   checked={task.is_completed}
                                   onCheckedChange={() => startTransition(async () => {
                                       await toggleDeadlineCompletion(task.id, task.is_completed);
                                       // NOTE: The server action revalidates the path, triggering a full refresh.
                                   })}
                                   disabled={isPending}
                               />
                               <label
                                   htmlFor={`task-${task.id}`}
                                   className={cn(
                                       "text-sm font-medium leading-none flex-1",
                                       task.is_completed && "line-through text-muted-foreground"
                                   )}
                               >
                                   {task.title} 
                                   <span className='ml-2 text-xs'> (Due: {task.due_date.split('T')[0]})</span>
                               </label>
                           </div>
                       ))}
                  </CardContent>
              </Card>
          </section>
      )}
      {/* --- END Task Checklist --- */}


      <div className="mb-4 flex justify-end">
        {/* Add Deadline Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Deadline</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Add New Deadline</DialogTitle>
            </DialogHeader>
            <DeadlineForm
              courses={courses}
              onFormActionComplete={handleFormActionComplete}
              initialDate={dialogDate}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* FullCalendar */}
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,dayGridWeek' }}
        events={events}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        editable={false}
        selectable={true}
        dayMaxEvents={true}
        height="auto"
        contentHeight="auto"
        // Format time displayed on non-allday events
        eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
      />

      {/* Edit Deadline Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="overflow-y-auto"> {/* Add scroll for smaller screens */}
          <SheetHeader>
            <SheetTitle>Edit Deadline</SheetTitle>
            <SheetDescription>Modify or delete this deadline.</SheetDescription>
          </SheetHeader>
          {selectedEvent && (
            <DeadlineForm
              courses={courses}
              deadline={selectedEvent}
              onFormActionComplete={handleFormActionComplete}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// --- Deadline Form Component (No functional changes from previous state) ---
interface DeadlineFormProps {
  courses: Course[];
  deadline?: Deadline | null;
  initialDate?: Date | null;
  onFormActionComplete: (message: string) => void;
}

function DeadlineForm({ courses, deadline, initialDate, onFormActionComplete }: DeadlineFormProps) {
  const isEditing = !!deadline;
  const initialState: DeadlineFormState = { message: '', errors: [] };
  const actionToDispatch = isEditing ? updateDeadline : addDeadline;
  const [state, dispatch] = useFormState(actionToDispatch, initialState);

  // Determine initial category and set state
  const initialCategory = deadline?.course_id ? 'Course' : 'Other';
  const [deadlineCategory, setDeadlineCategory] = useState<'Course' | 'Other'>(initialCategory);

  // State for date picker
  const [date, setDate] = useState<Date | undefined>(
    deadline ? parseISO(deadline.due_date) : initialDate ? initialDate : undefined
  );

  // State for optional time
  const initialTime = deadline?.due_time ?? ''; // HH:MM or empty
  const [includeTime, setIncludeTime] = useState<boolean>(!!initialTime); // Checkbox state
  const [timeValue, setTimeValue] = useState<string>(initialTime); // Input value HH:MM

  // Effect to handle form submission result from server action
  useEffect(() => {
    // Check state only after pending is false and message exists
    if (state.message) {
       if (state.message.startsWith('Success')) {
          onFormActionComplete(state.message);
        } else if (state.message.startsWith('Validation failed') || state.message.startsWith('Database Error')) {
          console.error("Form Errors:", state.errors); // Log errors for debugging
          // Optionally show toast via onFormActionComplete even on error
          onFormActionComplete(state.message);
        }
    }
  }, [state, onFormActionComplete]); // Depend only on state

  const handleDateSelect = (selectedDate: Date | undefined) => { setDate(selectedDate); };

  // Helper to find error message for a specific field path
  // NOTE: This helper relies on the Zod schema definition in deadline-actions.ts
  type DeadlineSchemaShape = {
    title: any; dueDate: any; dueTime: any; type: any; description: any; courseId: any; deadlineCategory: any;
  };
  const getFieldError = (fieldName: keyof DeadlineSchemaShape): string | undefined => {
    // Zod issues have a 'path' array. We check if our fieldName is in that path.
    return state.errors?.find(e => e.path.includes(fieldName))?.message;
  };


  return (
    // Use grid layout for better alignment
    <form action={dispatch} className="grid gap-4 py-4">
      {/* Hidden inputs for editing */}
      {isEditing && <input type="hidden" name="id" value={deadline.id} />}
      {isEditing && deadline.course_id && <input type="hidden" name="originalCourseId" value={deadline.course_id} />}

      {/* --- Category Selector --- */}
      <div className="grid grid-cols-4 items-center gap-x-4 gap-y-1"> {/* Reduced y-gap */}
         <Label className="text-right sm:col-span-1">Category *</Label>
         <RadioGroup
            name="deadlineCategory"
            value={deadlineCategory} // Controlled component
            onValueChange={(value: 'Course' | 'Other') => setDeadlineCategory(value)}
            required
            className="col-span-3 flex pt-1 space-x-4"
          >
             <div className="flex items-center space-x-2">
                <RadioGroupItem value="Course" id={`cat-course-${deadline?.id ?? 'new'}`} />
                <Label htmlFor={`cat-course-${deadline?.id ?? 'new'}`} className="font-normal">Course</Label>
             </div>
             <div className="flex items-center space-x-2">
                <RadioGroupItem value="Other" id={`cat-other-${deadline?.id ?? 'new'}`} />
                <Label htmlFor={`cat-other-${deadline?.id ?? 'new'}`} className="font-normal">Other</Label>
             </div>
         </RadioGroup>
         {getFieldError('deadlineCategory') && <p className="col-span-3 col-start-2 mt-1 text-xs text-red-500">{getFieldError('deadlineCategory')}</p>}
      </div>

      {/* --- Conditional Course Dropdown --- */}
      {deadlineCategory === 'Course' && (
        <div className="grid grid-cols-4 items-center gap-x-4 gap-y-1">
            <Label htmlFor={`courseId-${deadline?.id ?? 'new'}`} className="text-right sm:col-span-1">Course *</Label>
            <Select name="courseId" required defaultValue={deadline?.course_id ?? undefined}>
                <SelectTrigger id={`courseId-${deadline?.id ?? 'new'}`} className="col-span-3">
                    <SelectValue placeholder="Select course..." />
                </SelectTrigger>
                <SelectContent>
                    {courses?.length > 0 ? (
                        courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                           {/* Adjust field: use 'title' if that's the name column in your Course type */}
                            {course.code} - {course.title ?? course.name}
                        </SelectItem>
                        ))
                    ) : (
                        <SelectItem value="no-courses" disabled>No courses available</SelectItem>
                    )}
                </SelectContent>
            </Select>
            {getFieldError('courseId') && <p className="col-span-3 col-start-2 mt-1 text-xs text-red-500">{getFieldError('courseId')}</p>}
        </div>
      )}

      {/* --- Title --- */}
      <div className="grid grid-cols-4 items-center gap-x-4 gap-y-1">
         <Label htmlFor={`title-${deadline?.id ?? 'new'}`} className="text-right sm:col-span-1">Title *</Label>
         <Input
            id={`title-${deadline?.id ?? 'new'}`}
            name="title"
            defaultValue={deadline?.title ?? ''}
            className="col-span-3"
            placeholder="Enter deadline title"
            required
         />
         {getFieldError('title') && <p className="col-span-3 col-start-2 mt-1 text-xs text-red-500">{getFieldError('title')}</p>}
      </div>

      {/* --- Due Date --- */}
      <div className="grid grid-cols-4 items-center gap-x-4 gap-y-1">
         <Label className="text-right sm:col-span-1">Due Date *</Label>
         <Popover>
            <PopoverTrigger asChild>
              <Button variant={'outline'} className={cn('col-span-3 justify-start text-left font-normal', !date && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4" />{date ? format(date, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus />
            </PopoverContent>
         </Popover>
         {/* Hidden input for date */}
         {date && <input type="hidden" name="dueDate" value={format(date, 'yyyy-MM-dd')} />}
         {!date && isEditing && deadline?.due_date && <input type="hidden" name="dueDate" value={format(parseISO(deadline.due_date), 'yyyy-MM-dd')} />}
         {!date && !isEditing && initialDate && <input type="hidden" name="dueDate" value={format(initialDate, 'yyyy-MM-dd')} />}
         {getFieldError('dueDate') && <p className="col-span-3 col-start-2 mt-1 text-xs text-red-500">{getFieldError('dueDate')}</p>}
      </div>

      {/* --- Optional Time Checkbox --- */}
      <div className="grid grid-cols-4 items-center gap-x-4 gap-y-1">
        <div className="col-span-1"></div> {/* Spacer */}
        <div className="col-span-3 flex items-center space-x-2">
            <Checkbox
                id={`includeTime-${deadline?.id ?? 'new'}`}
                checked={includeTime}
                onCheckedChange={(checked) => {
                    const isChecked = checked as boolean;
                    setIncludeTime(isChecked);
                    if (!isChecked) { setTimeValue(''); } // Clear time if unchecked
                }}
            />
            <Label htmlFor={`includeTime-${deadline?.id ?? 'new'}`} className="font-normal">Include Specific Time?</Label>
        </div>
      </div>

      {/* --- Conditional Time Input --- */}
      {includeTime && (
            <div className="grid grid-cols-4 items-center gap-x-4 gap-y-1">
                <Label htmlFor={`dueTime-${deadline?.id ?? 'new'}`} className="text-right sm:col-span-1">Due Time *</Label>
                <Input
                    id={`dueTime-${deadline?.id ?? 'new'}`}
                    name="dueTime" // Matches action and Zod schema
                    type="time" // HTML5 time input (HH:MM)
                    value={timeValue} // Controlled state
                    onChange={(e) => setTimeValue(e.target.value)}
                    className="col-span-3"
                    required // Required if checkbox is checked
                />
                {getFieldError('dueTime') && <p className="col-span-3 col-start-2 mt-1 text-xs text-red-500">{getFieldError('dueTime')}</p>}
            </div>
      )}
      {/* --- End Optional Time --- */}

      {/* --- Type (Optional) --- */}
       <div className="grid grid-cols-4 items-center gap-x-4 gap-y-1">
          <Label htmlFor={`type-${deadline?.id ?? 'new'}`} className="text-right sm:col-span-1">Type <span className="text-xs text-muted-foreground">(Optional)</span></Label>
          <Input
             id={`type-${deadline?.id ?? 'new'}`}
             name="type"
             defaultValue={deadline?.type ?? ''}
             className="col-span-3"
             placeholder="e.g., Assignment, Meeting, Personal"
            />
          {getFieldError('type') && <p className="col-span-3 col-start-2 mt-1 text-xs text-red-500">{getFieldError('type')}</p>}
       </div>

      {/* --- Description (Optional) --- */}
      <div className="grid grid-cols-4 items-start gap-x-4 gap-y-1"> {/* Use items-start for textarea */}
         <Label htmlFor={`description-${deadline?.id ?? 'new'}`} className="text-right sm:col-span-1 pt-2">Description <span className="text-xs text-muted-foreground">(Optional)</span></Label>
         <Textarea
            id={`description-${deadline?.id ?? 'new'}`}
            name="description"
            defaultValue={deadline?.description ?? ''}
            className="col-span-3"
            placeholder="Add extra details..."
            rows={3}
          />
      </div>

      {/* --- Submit/Delete Buttons --- */}
       <div className="mt-6 flex justify-between gap-4">
         <div>
            {isEditing && <DeleteDeadlineButton deadlineId={deadline.id} courseId={deadline.course_id} onComplete={onFormActionComplete}/>}
         </div>
         <div className="flex justify-end gap-2">
             {/* Use DialogClose/SheetClose to dismiss */}
             <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
             {/* Submit button now uses useFormStatus */}
             <SubmitButton isEditing={isEditing} />
         </div>
      </div>

      {/* Display general form error message (non-field specific) */}
      {state.message && !state.message.startsWith('Success') && !state.errors?.length && (
           <p className="mt-2 text-sm text-red-500">{state.message}</p>
      )}
    </form>
  );
}

// Separate Submit Button component to use useFormStatus
function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
           {pending ? (isEditing ? 'Saving...' : 'Adding...') : (isEditing ? 'Save Changes' : 'Add Deadline')}
        </Button>
    );
}


// DeleteDeadlineButton component remains mostly the same
function DeleteDeadlineButton({ deadlineId, courseId, onComplete }: { deadlineId: string, courseId?: string | null, onComplete: (msg: string) => void }) {
    const initialState: DeadlineFormState = { message: '' }; // Provide initial state
    const [state, dispatch] = useFormState(deleteDeadline, initialState);
    // Use useFormStatus within the form if needed, or manage pending state separately
    const [isPending, startTransition] = React.useTransition();


     useEffect(() => {
        if (state?.message) {
            onComplete(state.message);
        }
    }, [state, onComplete]);

    const handleDelete = () => {
        // Optional: Add confirmation dialog here
        startTransition(() => {
             const formData = new FormData();
             formData.append('id', deadlineId);
             if (courseId) formData.append('courseId', courseId); // Pass courseId if exists
             dispatch(formData);
        });
    };

    return (
        <>
             {/* Simple button if no confirmation needed */}
             <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
                 {isPending ? 'Deleting...' : 'Delete'}
            </Button>

            {state?.message && !state.message.startsWith('Success') && (
                <p className="mt-1 text-xs text-red-500">{state.message}</p>
            )}
        </>
    );
}