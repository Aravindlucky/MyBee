import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { mockJournalEntries } from "@/lib/data";

export default function JournalPage() {
  const today = new Date();

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Reflection Journal</h1>
        <p className="text-muted-foreground max-w-2xl text-lg mt-2">
          A private space to write a short entry every day. Connect the dots and track your growth.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
           <Card className="rounded-xl sticky top-24">
            <CardHeader>
              <CardTitle>Today's Entry</CardTitle>
              <CardDescription>{today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea placeholder="What's on your mind? What did you learn today?" rows={8}/>
            </CardContent>
            <CardFooter>
              <Button>Save Entry</Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
            <h2 className="font-headline text-2xl font-semibold">Past Entries</h2>
            {mockJournalEntries.map((entry, index) => (
                <Card key={entry.id} className="rounded-xl">
                    <CardHeader>
                        <CardTitle className="text-lg">
                           {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                       <p className="text-muted-foreground whitespace-pre-wrap">{entry.content}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
    </main>
  );
}
