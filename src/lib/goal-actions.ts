'use server';

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ActionResult = {
  success: boolean;
  message: string;
};

// --- Action to ADD a new Objective with its Key Results ---
export async function addObjective(formData: FormData): Promise<ActionResult> {
  const supabase = createSupabaseServerClient();

  const objectiveData = {
    title: formData.get('title') as string,
    semester: formData.get('semester') as string,
  };

  // Get key results from FormData (they will be named kr[0], kr[1], etc.)
  const keyResults: string[] = [];
  formData.forEach((value, key) => {
    if (key.startsWith('kr[') && typeof value === 'string' && value.trim() !== '') {
      keyResults.push(value.trim());
    }
  });

  if (!objectiveData.title) {
    return { success: false, message: "Objective title is required." };
  }
  if (keyResults.length === 0) {
    return { success: false, message: "At least one key result is required." };
  }

  try {
    // 1. Insert the Objective
    const { data: newObjective, error: objectiveError } = await supabase
      .from('objectives')
      .insert(objectiveData)
      .select('id')
      .single();

    if (objectiveError) throw objectiveError;
    if (!newObjective) throw new Error("Failed to create objective.");

    // 2. Prepare Key Results with the new Objective's ID
    const keyResultsData = keyResults.map(desc => ({
      objective_id: newObjective.id,
      description: desc,
      is_completed: false,
    }));

    // 3. Insert all Key Results
    const { error: krError } = await supabase
      .from('key_results')
      .insert(keyResultsData);

    if (krError) throw krError;

    revalidatePath('/goals');
    return { success: true, message: "Objective added successfully!" };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

// --- Action to TOGGLE a Key Result's completion status ---
export async function toggleKeyResult(keyResultId: string, currentState: boolean): Promise<ActionResult> {
  const supabase = createSupabaseServerClient();

  if (!keyResultId) {
    return { success: false, message: "Key Result ID is missing." };
  }

  try {
    const { error } = await supabase
      .from('key_results')
      .update({ is_completed: !currentState })
      .eq('id', keyResultId);

    if (error) throw error;

    revalidatePath('/goals');
    return { success: true, message: "Key result updated." };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

// --- Action to DELETE an Objective (and its KRs via cascade) ---
export async function deleteObjective(formData: FormData): Promise<ActionResult> {
  const supabase = createSupabaseServerClient();
  const objectiveId = formData.get('objectiveId') as string;

  if (!objectiveId) {
    return { success: false, message: "Objective ID is missing." };
  }

  try {
    const { error } = await supabase
      .from('objectives')
      .delete()
      .eq('id', objectiveId);

    if (error) throw error;

    revalidatePath('/goals');
    return { success: true, message: "Objective deleted." };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}