'use client';

import { useState, useTransition, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { type JournalEntry } from "@/lib/types";
import { saveJournalEntry } from "@/lib/journal-actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

/**
 * Helper to get today's date in YYYY-MM-DD format, adjusted for local timezone.
 */
function getLocalDateString(date: Date): string {
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
  return adjustedDate.toISOString().split('T')[0];
}

/**
 * Helper to format date for display
 */
function formatDisplayDate(dateString: string): string {
    const date = new Date(dateString + 'T00:00:00'); // Treat as local date
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

interface JournalClientProps {
  initialEntries: JournalEntry[];
}

export function JournalClient({ initialEntries }: JournalClientProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [entries, setEntries] = useState(initialEntries);

  // Get today's date in YYYY-MM-DD format
  const todayString = useMemo(() => getLocalDateString(new Date()), []);
  
  // Find today's entry from the initial list
  const todaysEntry = useMemo(() => 
    entries.find(e => e.entry_date === todayString)
  , [entries, todayString]);

  // Separate past entries
  const pastEntries = useMemo(() =>
    entries.filter(e => e.entry_date !== todayString)
  , [entries, todayString]);

  // State for the text area
  const [content, setContent] = useState(todaysEntry?.content || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    startTransition(async () => {
      const formData = new FormData();
      formData.append('entry_date', todayString);
      formData.append('content', content);

      // Optimistic UI Update
      const newEntry: JournalEntry = {
          id: todaysEntry?.id || new Date().toISOString(), // Use existing ID or a temp one
          created_at: todaysEntry?.created_at || new Date().toISOString(),
          entry_date: todayString,
          content: content,
      };

      setEntries(prevEntries => {
          // Remove old version of today's entry if it exists
          const otherEntries = prevEntries.filter(e => e.entry_date !== todayString);
          // Add the new/updated entry
          return [newEntry, ...otherEntries];
      });

      const result = await saveJournalEntry(formData);
      if (result.success) {
        toast({ title: "Success!", description: "Your journal entry has been saved." });
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
        // Rollback optimistic update on failure
        setEntries(initialEntries);
      }
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <form onSubmit={handleSubmit}>
          <Card className="rounded-xl sticky top-24">
            <CardHeader>
              <CardTitle>Today's Entry</CardTitle>
              <CardDescription>
                {formatDisplayDate(todayString)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="What's on your mind? What did you learn today?"
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isPending || content.trim().length === 0}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {todaysEntry ? 'Update Entry' : 'Save Entry'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <h2 className="font-headline text-2xl font-semibold">Past Entries</h2>
        {pastEntries.length > 0 ? (
          pastEntries.map((entry) => (
            <Card key={entry.id} className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg">
                  {formatDisplayDate(entry.entry_date)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Use whitespace-pre-wrap to respect newlines */}
                <p className="text-muted-foreground whitespace-pre-wrap">{entry.content}</p>
              </CardContent>
            </Card>
          ))
        ) : (
            <Card className="rounded-xl border-dashed">
                <CardContent className="py-10 text-center text-muted-foreground">
                    <p>Your past journal entries will appear here.</p>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}