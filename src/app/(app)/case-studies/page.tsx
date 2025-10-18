import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import { mockCaseStudies } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from '@/components/ui/dropdown-menu';

export default function CaseStudiesPage() {
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
              {mockCaseStudies.map((study) => (
                <TableRow key={study.id}>
                  <TableCell className="font-medium">{study.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{study.subject}</Badge>
                  </TableCell>
                  <TableCell>{new Date(study.lastUpdated).toLocaleDateString()}</TableCell>
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
                        <DropdownMenuItem>View/Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
