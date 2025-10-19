import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GoalTrackerClient } from "@/components/goal-tracker-client";
import { Objective } from "@/lib/types";

export default async function GoalsPage() {
  const supabase = createSupabaseServerClient();

  // Fetch all objectives and their related key results
  // We use a nested query to get key_results for each objective
  const { data, error } = await supabase
    .from('objectives')
    .select(`
      *,
      key_results (
        id,
        created_at,
        objective_id,
        description,
        is_completed
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching objectives:", error);
  }

  const objectives: Objective[] = data || [];

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <GoalTrackerClient initialObjectives={objectives} />
    </main>
  );
}