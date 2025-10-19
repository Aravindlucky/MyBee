'use client';

import { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addCourse, addModule } from "@/lib/course-actions";
import { Module } from "@/lib/types";
// Removed unused CourseStats and Course imports
import { CourseWithStats } from "@/components/course-card";

const getAttendancePercentage = (attended: number, conducted: number) => {
  if (conducted === 0) return 100;
  return Math.round((attended / conducted) * 100);
};

interface CourseAdminTabsProps {
  courses: CourseWithStats[];
  modules: Module[];
}

export function CourseAdminTabs({ courses, modules }: CourseAdminTabsProps) {
  const { toast } = useToast();
  const addCourseFormRef = useRef<HTMLFormElement>(null);
  const addModuleFormRef = useRef<HTMLFormElement>(null);

  const handleAddModule = async (formData: FormData) => {
    const result = await addModule(formData);
    if (result.success) {
      toast({ title: "Success!", description: result.message });
      addModuleFormRef.current?.reset();
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };

  const handleAddCourse = async (formData: FormData) => {
    const result = await addCourse(formData);
    if (result.success) {
      toast({ title: "Success!", description: result.message });
      addCourseFormRef.current?.reset();
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };

  return (
    <Tabs defaultValue="attendance">
      <TabsList className="grid w-full grid-cols-3 md:w-[600px]">
        <TabsTrigger value="attendance">Attendance Overview</TabsTrigger>
        <TabsTrigger value="add_course">Add Course</TabsTrigger>
        <TabsTrigger value="add_module">Add Module</TabsTrigger>
      </TabsList>

      {/* --- Attendance Tab --- */}
      <TabsContent value="attendance">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription>A summary of attendance for all courses.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Attended (inc. Proxy)</TableHead>
                  <TableHead>Conducted</TableHead>
                  <TableHead>Total %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => {
                  const percentage = getAttendancePercentage(course.attended, course.conducted);
                  const module = modules.find(m => m.id === course.module_id);
                  return (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{course.title}</span>
                          <span className="text-xs text-muted-foreground">{course.code}</span>
                        </div>
                      </TableCell>
                      <TableCell>{module?.title || 'N/A'}</TableCell>
                      <TableCell>{course.attended}</TableCell>
                      <TableCell>{course.conducted}</TableCell>
                      <TableCell>
                        <Badge variant={percentage < (course.mandatory_attendance_percentage || 85) ? "destructive" : "default"}>
                          {percentage}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* --- Add Course Tab --- */}
      <TabsContent value="add_course">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Add New Course</CardTitle>
            <CardDescription>Fill in the details to add a new course.</CardDescription>
          </CardHeader>
          <CardContent>
            <form ref={addCourseFormRef} action={handleAddCourse} className="space-y-6 max-w-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title</Label>
                  <Input id="title" name="title" placeholder="e.g., Operations Management" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Course Code</Label>
                  <Input id="code" name="code" placeholder="e.g., OPNS-600" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="professor">Professor</Label>
                <Input id="professor" name="professor" placeholder="e.g., Dr. Jane Smith" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="term">Term</Label>
                  <Input id="term" name="term" placeholder="e.g., Fall 2024" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalSessions">Total Scheduled Sessions</Label>
                  <Input id="totalSessions" name="totalSessions" type="number" placeholder="e.g., 20" required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="moduleId">Module</Label>
                    <Select name="moduleId" defaultValue="none">
                      <SelectTrigger>
                        <SelectValue placeholder="Assign to a module..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <em>None</em>
                        </SelectItem>
                        {modules.map(module => (
                          <SelectItem key={module.id} value={module.id}>
                            {module.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                 </div>
                 {/* --- THIS FIELD IS UPDATED --- */}
                <div className="space-y-2">
                  <Label htmlFor="mandatoryAttendance">Mandatory Attendance (%)</Label>
                  <Input id="mandatoryAttendance" name="mandatoryAttendance" type="number" placeholder="e.g., 85" defaultValue={85} min="0" max="100" required />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button type="submit">Save Course</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* --- Add Module Tab --- */}
      <TabsContent value="add_module">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Add New Module</CardTitle>
            <CardDescription>Create a new module to group courses.</CardDescription>
          </CardHeader>
          <CardContent>
            <form ref={addModuleFormRef} action={handleAddModule} className="space-y-6 max-w-lg">
              <div className="space-y-2">
                <Label htmlFor="title">Module Title</Label>
                <Input id="title" name="title" placeholder="e.g., Term 1" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Input id="semester" name="semester" placeholder="e.g., Fall 2024" />
              </div>
              <div className="flex justify-end">
                <Button type="submit">Save Module</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}