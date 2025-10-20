import { createSupabaseServerClient } from "@/lib/supabase/server";
import CalendarClient from '@/components/calendar-client'; // <-- CORRECT default import
import { Deadline, Course } from "@/lib/types"; // Keep Course import for reference

// --- NEW: Define a simpler type for the data needed by CalendarClient ---
type CourseForCalendar = Pick<Course, 'id' | 'title' | 'code'>;

export default async function CalendarPage() {
  const supabase = createSupabaseServerClient();

  // Fetch deadlines and related course info in parallel
  const deadlinesPromise = supabase
    .from('deadlines')
    .select(`
      *,
      courses ( title, code )
    `)
    .order('due_date', { ascending: true });

  // --- Fetch only necessary course fields ---
  const coursesPromise = supabase
    .from('courses')
    .select('id, title, code') // Only select id, title, code
    .order('title');

  const [deadlinesResult, coursesResult] = await Promise.all([deadlinesPromise, coursesPromise]);

  const { data: deadlinesData, error: deadlinesError } = deadlinesResult;
  const { data: coursesData, error: coursesError } = coursesResult;

  if (deadlinesError) console.error("Error fetching deadlines:", deadlinesError);
  if (coursesError) console.error("Error fetching courses:", coursesError);

  const deadlines: Deadline[] = deadlinesData || [];
  // --- Use the simpler type here ---
  const courses: CourseForCalendar[] = coursesData || [];

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      {/* Pass the correctly typed courses data */}
      <CalendarClient initialDeadlines={deadlines} courses={courses} />
    </main>
  );
}