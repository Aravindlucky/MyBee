import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CourseDetailClient } from "@/components/course-detail-client"; // Import the new client component
import { notFound } from "next/navigation";

export default async function CourseDetailPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();

  // --- Fetch course and sessions from Supabase in parallel ---
  const coursePromise = supabase
    .from('courses')
    .select('*')
    .eq('id', params.id)
    .single();
    
  const sessionsPromise = supabase
    .from('sessions')
    .select('*')
    .eq('course_id', params.id)
    .order('date', { ascending: true });

  const [courseResult, sessionsResult] = await Promise.all([coursePromise, sessionsPromise]);

  const { data: course, error: courseError } = courseResult;
  const { data: sessions, error: sessionsError } = sessionsResult;

  if (courseError) {
    console.error(courseError);
    notFound(); // Triggers the 404 page
  }
  
  // --- Render the Client Component, passing data as props ---
  return (
    <CourseDetailClient course={course} sessions={sessions || []} />
  );
}