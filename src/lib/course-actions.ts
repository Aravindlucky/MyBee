'use server';

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ActionResult = {
  success: boolean;
  message: string;
};

// --- addModule (unchanged) ---
export async function addModule(formData: FormData): Promise<ActionResult> {
  const supabase = createSupabaseServerClient();
  const moduleData = {
    title: formData.get('title') as string,
    semester: formData.get('semester') as string,
  };
  try {
    const { data, error } = await supabase.from('modules').insert(moduleData).select().single();
    if (error) throw new Error(error.message);
    revalidatePath('/courses');
    return { success: true, message: "Module added successfully!" };
  } catch (error) {
    console.error("Catch block error:", error); // Added logging
    return { success: false, message: (error as Error).message };
  }
}

// --- addCourse (unchanged) ---
export async function addCourse(formData: FormData): Promise<ActionResult> {
  const supabase = createSupabaseServerClient();
  const moduleIdValue = formData.get('moduleId') as string;
  const courseData = {
    title: formData.get('title') as string,
    code: formData.get('code') as string,
    professor: formData.get('professor') as string,
    term: formData.get('term') as string,
    total_scheduled_sessions: Number(formData.get('totalSessions') || 0),
    mandatory_attendance_percentage: Number(formData.get('mandatoryAttendance') || 75),
    module_id: (moduleIdValue === "" || moduleIdValue === null || moduleIdValue === "none") ? null : moduleIdValue,
  };
  try {
    const { data, error } = await supabase.from('courses').insert(courseData).select().single();
    if (error) throw new Error(error.message);
    revalidatePath('/courses');
    return { success: true, message: "Course added successfully!" };
  } catch (error) {
     console.error("Catch block error:", error); // Added logging
     return { success: false, message: (error as Error).message };
  }
}

// --- updateCourse (with logging) ---
export async function updateCourse(formData: FormData): Promise<ActionResult> {
  const supabase = createSupabaseServerClient();

  console.log('Server Action Received FormData Keys:', Array.from(formData.keys())); // Logging

  const courseId = formData.get('courseId') as string;
  if (!courseId) return { success: false, message: "Course ID is missing." };

  const moduleIdValue = formData.get('moduleId') as string;

  console.log('Raw mandatoryAttendance from FormData:', formData.get('mandatoryAttendance')); // Logging
  console.log('Raw totalSessions from FormData:', formData.get('totalSessions')); // Logging

  const courseData = {
    title: formData.get('title') as string,
    code: formData.get('code') as string,
    professor: formData.get('professor') as string,
    term: formData.get('term') as string,
    total_scheduled_sessions: Number(formData.get('totalSessions') || 0),
    mandatory_attendance_percentage: Number(formData.get('mandatoryAttendance') || 75), // Correct field name
    module_id: (moduleIdValue === "" || moduleIdValue === null || moduleIdValue === "none") ? null : moduleIdValue,
  };

  console.log('Data Parsed for Supabase Update:', courseData); // Logging

  try {
    const { error } = await supabase.from('courses').update(courseData).eq('id', courseId);
    if (error) {
       console.error("Supabase update error:", error); // Keep this log
       throw new Error(error.message);
    }
    revalidatePath('/courses');
    revalidatePath(`/courses/${courseId}`);
    return { success: true, message: "Course updated successfully!" };
  } catch (error) {
     console.error("Catch block error:", error); // Keep this log
    return { success: false, message: (error as Error).message };
  }
}