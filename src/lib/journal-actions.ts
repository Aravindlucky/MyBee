'use server';

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ActionResult = {
  success: boolean;
  message: string;
};

/**
 * Creates a new journal entry or updates an existing one for a specific date.
 * We use the 'entry_date' as the unique key for the upsert.
 */
export async function saveJournalEntry(formData: FormData): Promise<ActionResult> {
  const supabase = createSupabaseServerClient();

  const entryData = {
    entry_date: formData.get('entry_date') as string, // Should be in YYYY-MM-DD format
    content: formData.get('content') as string,
  };

  if (!entryData.entry_date || !entryData.content) {
    return { success: false, message: "Missing date or content." };
  }

  try {
    const { error } = await supabase
      .from('journal_entries')
      .upsert(
        { 
          entry_date: entryData.entry_date, 
          content: entryData.content 
        },
        { onConflict: 'entry_date' } // This tells Supabase to update if 'entry_date' matches
      );

    if (error) throw error;

    revalidatePath('/journal');
    return { success: true, message: "Entry saved!" };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}