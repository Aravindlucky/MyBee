import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CourseStats } from "@/lib/types";
import { CoursePageClient } from "@/components/course-page-client";

export default async function CoursesPage() {
  const supabase = createSupabaseServerClient();

  const coursesPromise = supabase.from('courses').select('*');
  const statsPromise = supabase.rpc('get_course_attendance_stats');
  const modulesPromise = supabase.from('modules').select('*');

  const [coursesResult, statsResult, modulesResult] = await Promise.all([
    coursesPromise,
    statsPromise,
    modulesPromise
  ]);

  const { data: coursesData, error: coursesError } = coursesResult;
  const { data: statsData, error: statsError } = statsResult as { data: CourseStats[] | null, error: any };
  const { data: modulesData, error: modulesError } = modulesResult;

  if (coursesError || statsError || modulesError) {
    console.error("Error fetching admin data:", coursesError || statsError || modulesError);
  }

  const coursesWithStats = (coursesData || []).map(course => {
    const stats = (statsData || []).find((s: CourseStats) => s.course_id === course.id);
    return {
      ...course,
      scheduled: stats?.scheduled || 0,
      conducted: stats?.conducted || 0,
      attended: stats?.attended || 0,
    };
  });

  const modules = modulesData || [];

  return (
    // --- WRAPPER ADDED ---
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="mx-auto w-full max-w-7xl"> 
        <CoursePageClient
          courses={coursesWithStats}
          modules={modules}
        />
      </div>
    </main>
    // --- WRAPPER ADDED ---
  );
}