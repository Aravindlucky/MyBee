'use server';

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { AttendanceStatus } from "./types";

// --- Action to ADD a new session ---
export async function addSession(formData: FormData) {
  const supabase = createSupabaseServerClient();

  const courseId = formData.get('courseId') as string;
  const date = formData.get('date') as string;
  const status = formData.get('status') as AttendanceStatus;

  if (!courseId || !date || !status) {
    return { success: false, message: "Missing required fields." };
  }

  try {
    const { error } = await supabase.from('sessions').insert({
      course_id: courseId,
      date: new Date(date).toISOString(),
      status: status
    });

    if (error) throw error;

    // Refresh the data on these pages
    revalidatePath('/courses');
    revalidatePath(`/courses/${courseId}`);
    
    return { success: true, message: "Session added!" };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

// --- Action to DELETE a session ---
export async function deleteSession(formData: FormData) {
  const supabase = createSupabaseServerClient();
  
  const sessionId = formData.get('sessionId') as string;
  const courseId = formData.get('courseId') as string; // Get courseId to revalidate

  if (!sessionId) {
    return { success: false, message: "Session ID is missing." };
  }

  try {
    const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
    
    if (error) throw error;

    // Refresh the data on these pages
    revalidatePath('/courses');
    revalidatePath(`/courses/${courseId}`);

    return { success: true, message: "Session deleted." };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}