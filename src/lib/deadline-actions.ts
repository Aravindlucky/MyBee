'use server';

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ActionResult = {
  success: boolean;
  message: string;
};

// --- Action to ADD a new Deadline ---
export async function addDeadline(formData: FormData): Promise<ActionResult> {
  const supabase = createSupabaseServerClient();

  const deadlineData = {
    course_id: formData.get('course_id') as string,
    title: formData.get('title') as string,
    due_date: formData.get('due_date') as string, // Should be ISO string
    description: formData.get('description') as string,
    type: formData.get('type') as string,
  };

  if (!deadlineData.course_id || !deadlineData.title || !deadlineData.due_date || !deadlineData.type) {
    return { success: false, message: "Missing required fields (Course, Title, Due Date, Type)." };
  }

  try {
    // Convert due_date to a proper timestamp for Supabase
    const dueDate = new Date(deadlineData.due_date).toISOString();

    const { error } = await supabase
      .from('deadlines')
      .insert({
        course_id: deadlineData.course_id,
        title: deadlineData.title,
        due_date: dueDate,
        description: deadlineData.description || null,
        type: deadlineData.type,
       });

    if (error) throw error;

    revalidatePath('/calendar'); // Revalidate the new calendar page
    revalidatePath('/courses'); // Also revalidate courses if deadlines shown there
    revalidatePath(`/courses/${deadlineData.course_id}`);
    
    return { success: true, message: "Deadline added successfully!" };
  } catch (error) {
    console.error("Add Deadline Error:", error);
    return { success: false, message: (error as Error).message };
  }
}

// --- Action to UPDATE a Deadline ---
export async function updateDeadline(formData: FormData): Promise<ActionResult> {
  const supabase = createSupabaseServerClient();
  const deadlineId = formData.get('deadlineId') as string;

  const deadlineData = {
    course_id: formData.get('course_id') as string,
    title: formData.get('title') as string,
    due_date: formData.get('due_date') as string, // Should be ISO string
    description: formData.get('description') as string,
    type: formData.get('type') as string,
  };

   if (!deadlineId || !deadlineData.course_id || !deadlineData.title || !deadlineData.due_date || !deadlineData.type) {
    return { success: false, message: "Missing required fields." };
  }

  try {
     // Convert due_date to a proper timestamp for Supabase
    const dueDate = new Date(deadlineData.due_date).toISOString();

    const { error } = await supabase
      .from('deadlines')
      .update({
        course_id: deadlineData.course_id,
        title: deadlineData.title,
        due_date: dueDate,
        description: deadlineData.description || null,
        type: deadlineData.type,
      })
      .eq('id', deadlineId);

    if (error) throw error;
    
    revalidatePath('/calendar');
    revalidatePath('/courses');
    revalidatePath(`/courses/${deadlineData.course_id}`);

    return { success: true, message: "Deadline updated." };
  } catch (error) {
     console.error("Update Deadline Error:", error);
     return { success: false, message: (error as Error).message };
  }
}


// --- Action to DELETE a Deadline ---
export async function deleteDeadline(formData: FormData): Promise<ActionResult> {
  const supabase = createSupabaseServerClient();
  const deadlineId = formData.get('deadlineId') as string;
  const courseId = formData.get('courseId') as string; // For revalidation

  if (!deadlineId) {
    return { success: false, message: "Deadline ID is missing." };
  }

  try {
    const { error } = await supabase
      .from('deadlines')
      .delete()
      .eq('id', deadlineId);

    if (error) throw error;

    revalidatePath('/calendar');
    revalidatePath('/courses');
    if (courseId) revalidatePath(`/courses/${courseId}`); // Revalidate course page if ID provided

    return { success: true, message: "Deadline deleted." };
  } catch (error) {
     console.error("Delete Deadline Error:", error);
     return { success: false, message: (error as Error).message };
  }
}