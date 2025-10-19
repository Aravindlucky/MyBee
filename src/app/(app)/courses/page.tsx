import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CoursePageClient } from "@/components/course-page-client";
import { Session } from "@/lib/types";

export default async function CoursesPage() {
  const supabase = createSupabaseServerClient();

  const coursesPromise = supabase.from('courses').select('*');
  const sessionsPromise = supabase.from('sessions').select('*');
  const modulesPromise = supabase.from('modules').select('*');

  const [coursesResult, sessionsResult, modulesResult] = await Promise.all([
    coursesPromise,
    sessionsPromise,
    modulesPromise
  ]);

  const { data: coursesData, error: coursesError } = coursesResult;
  const { data: allSessions, error: sessionsError } = sessionsResult as { data: Session[] | null, error: any };
  const { data: modulesData, error: modulesError } = modulesResult;

  if (coursesError || sessionsError || modulesError) {
    console.error("Error fetching admin data:", coursesError || sessionsError || modulesError);
  }

  const sessions = allSessions || [];

  const coursesWithStats = (coursesData || []).map(course => {
    const courseSessions = sessions.filter(s => s.course_id === course.id);
    const scheduled = courseSessions.length;
    const conducted = courseSessions.filter(s => s.status !== 'not-taken').length;
    const present = courseSessions.filter(s => s.status === 'present').length;
    const proxy = courseSessions.filter(s => s.status === 'proxy').length;
    const absent = courseSessions.filter(s => s.status === 'absent').length;
    const attended = present + proxy;

    return {
      ...course,
      scheduled,
      conducted,
      present,
      proxy,
      absent,
      attended,
      // Pass the mandatory_attendance_percentage
      mandatory_attendance_percentage: course.mandatory_attendance_percentage || 75,
    };
  });

  const modules = modulesData || [];

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <CoursePageClient
        courses={coursesWithStats}
        modules={modules}
      />
    </main>
  );
}