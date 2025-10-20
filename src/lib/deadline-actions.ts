'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Database } from '@/lib/types';

// Define a schema for validation
const DeadlineSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  dueDate: z.date({ required_error: 'Due date is required' }),
  // --- NEW: Add optional dueTime ---
  dueTime: z.string().optional().nullable() // Expecting HH:MM format from time input
    .refine(val => !val || /^[0-2][0-9]:[0-5][0-9]$/.test(val), {
        message: "Invalid time format (use HH:MM)", // Validate if provided
    }),
  // --- End New ---
  type: z.string().optional(),
  description: z.string().optional(),
  courseId: z.string().uuid().optional().nullable(),
  deadlineCategory: z.enum(['Course', 'Other'], {
    required_error: 'Please select if this is a Course deadline or Other.',
  }),
})
.refine(data => { /* ... (keep existing refine logic for courseId) ... */
    if (data.deadlineCategory === 'Course') { return !!data.courseId; } return true;
}, { message: 'Course selection is required for Course deadlines.', path: ['courseId'], });


// Type for the form state
export type DeadlineFormState = {
  message: string;
  errors?: z.ZodIssue[];
};

// --- Helper to combine Date and optional Time string ---
function combineDateTime(date: Date, timeString: string | null | undefined): string {
    if (timeString && /^[0-2][0-9]:[0-5][0-9]$/.test(timeString)) {
        const [hours, minutes] = timeString.split(':');
        // Create a new date object to avoid modifying the original
        const dateTime = new Date(date);
        dateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0); // Set H, M, S, MS
        return dateTime.toISOString(); // Return as full ISO string (timestamp with timezone)
    } else {
        // If no valid time, return just the date part as ISO string (ends in T00:00:00.000Z)
        // Or handle as just date depending on DB column type
         const dateOnly = new Date(date);
         dateOnly.setUTCHours(0, 0, 0, 0); // Standardize to UTC midnight if only date matters
         //return dateOnly.toISOString().split('T')[0]; // Return YYYY-MM-DD if DB is DATE type
         return dateOnly.toISOString(); // Return midnight UTC if DB is TIMESTAMP type
    }
}


export async function addDeadline(
  prevState: DeadlineFormState,
  formData: FormData
): Promise<DeadlineFormState> {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  // Extract raw data from FormData
  const rawData = {
    title: formData.get('title'),
    dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : undefined,
    dueTime: formData.get('dueTime'), // <-- Get time value
    type: formData.get('type'),
    description: formData.get('description'),
    deadlineCategory: formData.get('deadlineCategory'),
    courseId: formData.get('courseId'),
  };

  // Validate form data using the refined schema
  const validatedFields = DeadlineSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.error('Validation Errors:', validatedFields.error.flatten().fieldErrors);
    return { message: 'Validation failed.', errors: validatedFields.error.issues };
  }

  // Destructure the validated data
  const { title, dueDate, dueTime, type, description, courseId, deadlineCategory } = validatedFields.data; // <-- Include dueTime

  // Prepare data for Supabase
  const deadlineData: Omit<Database['public']['Tables']['deadlines']['Insert'], 'id' | 'created_at'> = {
    title,
    // Store date only in due_date (assuming TIMESTAMP type - it will store midnight UTC)
    due_date: combineDateTime(dueDate, null), // Pass null for time to get midnight UTC
    // --- NEW: Store time in due_time ---
    due_time: dueTime || null, // Pass validated time string or null
    // --- End New ---
    type: deadlineCategory === 'Course' ? (type || 'Coursework') : 'Other',
    description,
    course_id: courseId, // Will be null if category was 'Other'
  };

  // Insert data into Supabase
  const { error } = await supabase.from('deadlines').insert(deadlineData);

  if (error) {
    console.error('Supabase Error:', error);
    return { message: `Database Error: ${error.message}` };
  }

  // Revalidate relevant paths (no change needed here)
  revalidatePath('/(app)/calendar', 'page');
  revalidatePath('/(app)/courses', 'page');
  if (courseId) { revalidatePath(`/(app)/courses/${courseId}`, 'page'); }

  return { message: 'Success! Deadline added.' };
}

// --- Update `updateDeadline` Function ---
export async function updateDeadline(
  prevState: DeadlineFormState,
  formData: FormData
): Promise<DeadlineFormState> {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    const id = formData.get('id') as string;

    // Extract raw data
    const rawData = {
        title: formData.get('title'),
        dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : undefined,
        dueTime: formData.get('dueTime'), // <-- Get time value
        type: formData.get('type'),
        description: formData.get('description'),
        deadlineCategory: formData.get('deadlineCategory'),
        courseId: formData.get('courseId'),
    };

    // Use the same schema for validation
    const validatedFields = DeadlineSchema.safeParse(rawData);

    if (!validatedFields.success) {
        console.error('Update Validation Errors:', validatedFields.error.flatten().fieldErrors);
        return { message: 'Validation failed during update.', errors: validatedFields.error.issues };
    }

    const { title, dueDate, dueTime, type, description, courseId, deadlineCategory } = validatedFields.data; // <-- Include dueTime

    // Update data in Supabase
    const { error } = await supabase
        .from('deadlines')
        .update({
            title,
            due_date: combineDateTime(dueDate, null), // Pass null for time to store midnight UTC
            due_time: dueTime || null, // <-- Update time field
            type: deadlineCategory === 'Course' ? (type || 'Coursework') : 'Other',
            description,
            course_id: courseId, // Use validated (potentially null) courseId
        })
        .eq('id', id);

    if (error) {
        console.error('Supabase Update Error:', error);
        return { message: `Database Error during update: ${error.message}` };
    }

    // Revalidate paths (no change needed here)
    revalidatePath('/(app)/calendar', 'page');
    revalidatePath('/(app)/courses', 'page');
    if (courseId) { revalidatePath(`/(app)/courses/${courseId}`, 'page'); }

    return { message: 'Success! Deadline updated.' };
}

// --- `deleteDeadline` Function (No Change Needed) ---
export async function deleteDeadline(formData: FormData): Promise<DeadlineFormState> {
    // ... (no changes needed for delete)
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const id = formData.get('id') as string;
    const courseId = formData.get('courseId') as string | undefined;
    const { error } = await supabase.from('deadlines').delete().eq('id', id);
    if (error) { return { message: `Database Error: ${error.message}` }; }
    revalidatePath('/(app)/calendar', 'page');
    revalidatePath('/(app)/courses', 'page');
    if (courseId) { revalidatePath(`/(app)/courses/${courseId}`, 'page'); }
    return { message: 'Success! Deadline deleted.' };
}