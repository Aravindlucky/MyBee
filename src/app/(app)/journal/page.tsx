import { createSupabaseServerClient } from "@/lib/supabase/server";
import { JournalClient } from "@/components/journal-client";
import { JournalEntry } from "@/lib/types";

export default async function JournalPage() {
  const supabase = createSupabaseServerClient();

  // Fetch all journal entries, ordered by date descending
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .order('entry_date', { ascending: false });

  if (error) {
    console.error("Error fetching journal entries:", error);
  }

  const entries: JournalEntry[] = data || [];

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Reflection Journal</h1>
        <p className="text-muted-foreground max-w-2xl text-lg mt-2">
          A private space to write a short entry every day. Connect the dots and track your growth.
        </p>
      </div>
      
      <JournalClient initialEntries={entries} />
      
    </main>
  );
}