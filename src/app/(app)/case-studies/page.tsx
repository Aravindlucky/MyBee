import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
// REMOVE mock data import: import { mockCaseStudies } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { createSupabaseServerClient } from '@/lib/supabase/server'; // <-- Import Supabase client
import { cookies } from 'next/headers'; // <-- Needed for server client

// Define type for fetched case study (matching table structure)
type CaseStudy = {
  id: string;
  case_title: string;
  case_subject: string | null;
  updated_at: string; // Assuming updated_at exists
};

export default async function CaseStudiesPage() { // <-- Make function async
  const supabase = createSupabaseServerClient(); // <-- Create client

  // --- FETCH DATA ---
  const { data: caseStudiesData, error } = await supabase
    .from('case_studies')
    .select('id, case_title, case_subject, updated_at') // Select specific columns
    .order('updated_at', { ascending: false }); // Order by most recent

  if (error) {
    console.error("Error fetching case studies:", error);
    // Handle error appropriately, maybe show an error message
  }

  const caseStudies: CaseStudy[] = caseStudiesData || []; // Use fetched data or empty array
  // --- END FETCH DATA ---

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold">Case Study Analyzer</h1>
          <p className="text-muted-foreground max-w-2xl text-lg mt-2">
            Break down business cases using structured templates and AI-powered insights.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/case-studies/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Analysis
          </Link>
        </Button>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>My Case Studies</CardTitle>
          <CardDescription>A list of all your analyzed business cases.</CardDescription>
        </CardHeader>
        <CardContent>
          {caseStudies.length > 0 ? ( // <-- Check if data exists
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {/* --- MAP OVER FETCHED DATA --- */}
                {caseStudies.map((study) => (
                  <TableRow key={study.id}>
                    <TableCell className="font-medium">{study.case_title}</TableCell>
                    <TableCell>
                      {study.case_subject ? (
                        <Badge variant="outline">{study.case_subject}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    {/* Format date nicely */}
                    <TableCell>{new Date(study.updated_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                           {/* --- UPDATED LINK --- */}
                          <DropdownMenuItem asChild>
                            <Link href={`/case-studies/${study.id}`}>View/Edit</Link>
                          </DropdownMenuItem>
                           {/* Add Delete functionality later */}
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             // --- SHOW MESSAGE IF NO DATA ---
            <div className="text-center py-10 text-muted-foreground">
              <p>You haven't analyzed any case studies yet.</p>
              <Button variant="link" asChild className="mt-2">
                <Link href="/case-studies/new">Start your first analysis</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}