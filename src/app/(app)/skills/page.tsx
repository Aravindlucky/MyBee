import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SkillTrackerClient } from "@/components/skill-tracker-client";
import { Skill } from "@/lib/types";

export default async function SkillsPage() {
  const supabase = createSupabaseServerClient();

  // Fetch all skills, ordered by creation time
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Error fetching skills:", error);
    // You could return an error message component here
  }

  const skills: Skill[] = data || [];

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <SkillTrackerClient skills={skills} />
    </main>
  );
}