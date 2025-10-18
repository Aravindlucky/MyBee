import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockCourses } from "@/lib/data";
import { BookOpen } from "lucide-react";

export default function CoursesPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Course Dashboard</h1>
      </div>
      <p className="text-muted-foreground max-w-2xl text-lg">
        Centralized hub for all your courses. Track syllabi, key deadlines, and grades.
      </p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockCourses.map((course) => (
          <Card key={course.id} className="flex flex-col rounded-xl hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <CardTitle className="font-headline text-xl leading-tight">{course.title}</CardTitle>
                  <CardDescription className="pt-1">{course.code}</CardDescription>
                </div>
                <Badge variant="secondary" className="whitespace-nowrap">{course.term}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">Professor: {course.professor}</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <BookOpen className="mr-2 h-4 w-4" />
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  );
}
