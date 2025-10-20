'use client';

import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, EventInput } from '@fullcalendar/core';
import { Calendar as CalendarIcon } from 'lucide-react';
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

// Custom Hooks & Utils
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile'; // Corrected import name

// Server Actions & Types
import {
  addDeadline,
  updateDeadline,
  deleteDeadline,
  type DeadlineFormState,
} from '@/lib/deadline-actions';
import { type Course, type Deadline } from '@/lib/types';

// React DOM Hooks
import { useFormState, useFormStatus } from 'react-dom';

// Props for the main client component
interface CalendarClientProps {
  initialDeadlines: Deadline[];
  courses: Course[];
}

// --- Helper Functions ---

// Helper to format deadline title including time if available
const formatEventTitle = (deadline: Deadline): string => {
  const coursePrefix = deadline.course?.code ? `[${deadline.courses.code}] ` : '';
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
  const title = deadline.course?.title ?? deadline.title; // Adjust if your Course type uses 'name'
  return `${coursePrefix}${title}${timeSuffix}`;
};

// --- Main Calendar Client Component ---

export default function CalendarClient({ initialDeadlines, courses }: CalendarClientProps) {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Deadline | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState<Date | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile(); // Use corrected hook name

  // Map initialDeadlines to FullCalendar events
  useEffect(() => {
    const mappedEvents = initialDeadlines.map((d) => ({
      id: d.id,
      title: formatEventTitle(d), // Use helper for title
      start: d.due_date, // Base date
      allDay: !d.due_time, // Event is allDay if due_time is NULL
      extendedProps: d,
      // Optional: Add specific start time for non-allDay events
      // start: d.due_time ? combineDateAndTime(parseISO(d.due_date), d.due_time).toISOString() : d.due_date,
       // Example color coding
       color: d.course_id ? '#3788d8' : '#6c757d', // Blue for course, Gray for other
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
      // NOTE: Server action revalidation should automatically refresh data.
      // If not, you might need a manual refresh trigger here.
    } else {
      toast({ variant: 'destructive', title: 'Error', description: message || 'An unknown error occurred.' });
    }
  };

  return (
    <div className="p-4 md:p-6">
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

// --- Deadline Form Component ---
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
  const getFieldError = (fieldName: keyof typeof DeadlineSchema.shape): string | undefined => {
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
            {/* If using AlertDialog */}
            {/* <AlertDialog>
                <AlertDialogTrigger asChild>
                     <Button type="button" variant="destructive" disabled={isPending}>
                        {isPending ? 'Deleting...' : 'Delete'}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                     <AlertDialogHeader>...</AlertDialogHeader>
                     <AlertDialogFooter>
                         <AlertDialogCancel>Cancel</AlertDialogCancel>
                         <AlertDialogAction onClick={handleDelete}>Confirm Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog> */}

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

// Helper (Optional - if you need to combine date/time for FullCalendar start property)
// function combineDateAndTime(date: Date, timeString: string): Date {
//   const [hours, minutes] = timeString.split(':').map(Number);
//   const newDate = new Date(date);
//   newDate.setHours(hours, minutes, 0, 0);
//   return newDate;
// }