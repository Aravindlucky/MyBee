'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, BookCopy, Percent, UserCheck, UserX, Users } from 'lucide-react';
import { CourseAdminTabs } from '@/components/course-admin-tabs';
import { Module, Course, CourseStats } from '@/lib/types';
import { CourseCard, CourseWithStats } from '@/components/course-card';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CoursePageClientProps {
  courses: CourseWithStats[]; // This prop now contains proxy
  modules: Module[];
}

// --- Quick Stat Card Component ---
function StatCard({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export function CoursePageClient({ courses, modules }: CoursePageClientProps) {
  const [isEditing, setIsEditing] = useState(false);

  // --- 1. Calculate Quick Stats (Updated) ---
  const totalConducted = courses.reduce((acc, course) => acc + course.conducted, 0);
  const totalAttended = courses.reduce((acc, course) => acc + course.attended, 0);
  const totalProxy = courses.reduce((acc, course) => acc + course.proxy, 0);
  const totalAbsent = totalConducted - totalAttended;
  const overallAttendance = totalConducted > 0 ? Math.round((totalAttended / totalConducted) * 100) : 0;

  // --- 2. Grouping Logic ---
  const groupedCourses = modules.map(module => ({
    ...module,
    courses: courses.filter(course => course.module_id === module.id)
  })).filter(module => module.courses.length > 0);

  const unassignedCourses = courses.filter(course => !course.module_id);
  
  const defaultOpenModule = groupedCourses.length > 0 ? `module-${groupedCourses[0].id}` : "";

  return (
    <div className="space-y-8">
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-semibold">Courses</h1>
          <p className="text-muted-foreground text-lg">
            {isEditing ? 'Manage courses and modules.' : 'View attendance overview.'}
          </p>
        </div>
        <Button variant={isEditing ? "default" : "outline"} size="icon" onClick={() => setIsEditing(!isEditing)} className="transition-all duration-200">
          <Edit className="h-4 w-4" />
          <span className="sr-only">Toggle Admin Mode</span>
        </Button>
      </div>

      {/* --- CONDITIONAL CONTENT --- */}
      {isEditing ? (
        // --- EDIT MODE: Show Admin Tabs ---
        <CourseAdminTabs
          courses={courses}
          modules={modules}
        />
      ) : (
        // --- VIEW MODE: Show Dashboard ---
        <div className="space-y-8">

          {/* --- 4. Quick Stats Section (Updated to 4 cards) --- */}
          <section>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Overall Attendance" value={`${overallAttendance}%`} icon={Percent} />
              <StatCard title="Total Attended" value={`${totalAttended} / ${totalConducted}`} icon={UserCheck} />
              <StatCard title="Total Absent" value={totalAbsent} icon={UserX} />
              <StatCard title="Total Proxy" value={totalProxy} icon={Users} />
            </div>
          </section>

          {/* --- 5. Collapsible Modules Section --- */}
          <Accordion type="single" collapsible defaultValue={defaultOpenModule} className="w-full space-y-4">
            {groupedCourses.map(module => (
              <AccordionItem key={module.id} value={`module-${module.id}`} className="border-none">
                <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline rounded-lg bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <BookCopy className="h-5 w-5" />
                    <span>{module.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {module.courses.map(course => (
                      // --- UPDATED: Pass modules prop ---
                      <CourseCard key={course.id} course={course} modules={modules} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* --- 6. Unassigned Courses --- */}
          {unassignedCourses.length > 0 && (
            <section>
              <Separator className="my-6" />
              <h2 className="text-xl font-semibold text-muted-foreground mb-4">Unassigned Courses</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {unassignedCourses.map(course => (
                  // --- UPDATED: Pass modules prop ---
                  <CourseCard key={course.id} course={course} modules={modules} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}