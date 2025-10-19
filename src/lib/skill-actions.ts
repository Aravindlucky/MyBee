'use server';

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ActionResult = {
  success: boolean;
  message: string;
};

// --- Action to ADD a new skill ---
export async function addSkill(formData: FormData): Promise<ActionResult> {
  const supabase = createSupabaseServerClient();
  
  const skillData = {
    name: formData.get('name') as string,
    type: formData.get('type') as 'Hard' | 'Soft',
    notes: formData.get('notes') as string,
    latest_confidence: Number(formData.get('confidence') || 1),
  };

  if (!skillData.name || !skillData.type) {
    return { success: false, message: "Skill name and type are required." };
  }

  try {
    // Insert the new skill and get its ID
    const { data: newSkill, error } = await supabase
      .from('skills')
      .insert(skillData)
      .select('id')
      .single();

    if (error) throw error;
    if (!newSkill) throw new Error("Failed to create skill and get ID.");

    // Add the initial confidence rating to the log table
    const { error: logError } = await supabase
      .from('skill_confidence_logs')
      .insert({
        skill_id: newSkill.id,
        confidence_level: skillData.latest_confidence,
      });

    if (logError) throw logError;

    revalidatePath('/skills');
    return { success: true, message: "Skill added successfully!" };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}


// --- Action to UPDATE a skill's details (name, notes, type) ---
export async function updateSkillDetails(formData: FormData): Promise<ActionResult> {
  const supabase = createSupabaseServerClient();
  const skillId = formData.get('skillId') as string;

  const skillData = {
    name: formData.get('name') as string,
    type: formData.get('type') as 'Hard' | 'Soft',
    notes: formData.get('notes') as string,
  };

  if (!skillId || !skillData.name || !skillData.type) {
    return { success: false, message: "Missing required fields." };
  }

  try {
    const { error } = await supabase
      .from('skills')
      .update(skillData)
      .eq('id', skillId);

    if (error) throw error;
    revalidatePath('/skills');
    return { success: true, message: "Skill updated." };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}


// --- Action to UPDATE skill confidence and log it ---
export async function updateSkillConfidence(skillId: string, confidence: number): Promise<ActionResult> {
  const supabase = createSupabaseServerClient();

  if (!skillId) return { success: false, message: "Skill ID is missing." };

  try {
    // 1. Update the 'latest_confidence' in the main skills table
    const { error: updateError } = await supabase
      .from('skills')
      .update({ latest_confidence: confidence })
      .eq('id', skillId);
    
    if (updateError) throw updateError;

    // 2. Add a new entry to the log table
    const { error: logError } = await supabase
      .from('skill_confidence_logs')
      .insert({
        skill_id: skillId,
        confidence_level: confidence,
      });

    if (logError) throw logError;
    
    revalidatePath('/skills');
    return { success: true, message: "Confidence updated." };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

// --- Action to DELETE a skill ---
export async function deleteSkill(formData: FormData): Promise<ActionResult> {
  const supabase = createSupabaseServerClient();
  const skillId = formData.get('skillId') as string;

  if (!skillId) {
    return { success: false, message: "Skill ID is missing." };
  }

  try {
    const { error } = await supabase.from('skills').delete().eq('id', skillId);
    if (error) throw error;
    revalidatePath('/skills');
    return { success: true, message: "Skill deleted." };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}