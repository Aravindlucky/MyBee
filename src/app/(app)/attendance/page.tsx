import { mockCourses, mockAttendance } from '@/lib/data';
import type { AttendanceRecord, Course } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddAttendanceForm } from '@/components/attendance/add-attendance-form';
import { AttendanceChart } from '@/components/attendance/attendance-chart';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BellRing } from 'lucide-react';

type CourseAttendance = {
  course: Course;
  records: AttendanceRecord[];
  stats: {
    total: number;
    present: number;
    absent: number;
    excused: number;
    percentage: number;
  };
};

const ATTENDANCE_THRESHOLD = 75;

export default function AttendancePage() {
  const attendanceByCourse: CourseAttendance[] = mockCourses.map(course => {
    const records = mockAttendance.filter(rec => rec.courseId === course.id);
    const present = records.filter(r => r.status === 'Present').length;
    const absent = records.filter(r => r.status === 'Absent').length;
    const excused = records.filter(r => r.status === 'Excused').length;
    const totalTracked = present + absent;
    const percentage = totalTracked > 0 ? (present / totalTracked) * 100 : 100;

    return {
      course,
      records,
      stats: {
        total: records.length,
        present,
        absent,
        excused,
        percentage,
      },
    };
  });

  const coursesBelowThreshold = attendanceByCourse.filter(
    c => c.stats.total > 0 && c.stats.percentage < ATTENDANCE_THRESHOLD
  );

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Attendance Tracker</h1>
        <p className="text-muted-foreground max-w-2xl text-lg mt-2">
          Monitor your attendance for each course to stay on track.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {coursesBelowThreshold.length > 0 && (
            <Alert variant="destructive">
              <BellRing className="h-4 w-4" />
              <AlertTitle>Attendance Warning</AlertTitle>
              <AlertDescription>
                Your attendance for {coursesBelowThreshold.map(c => `"${c.course.title}"`).join(', ')} is below the 75% threshold.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {attendanceByCourse.map(({ course, stats }) => (
              <Card key={course.id} className="rounded-xl flex flex-col">
                <CardHeader>
                  <CardTitle className="font-headline">{course.title}</CardTitle>
                  <CardDescription>{course.code}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-center items-center gap-4">
                  <AttendanceChart stats={stats} />
                  <div className="text-center">
                    <p className="text-4xl font-bold">{stats.percentage.toFixed(0)}%</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.present} Attended / {stats.present + stats.absent} Total
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div className="lg:col-span-1">
          <Card className="rounded-xl sticky top-24">
            <CardHeader>
              <CardTitle>Add Session</CardTitle>
              <CardDescription>Log a new attendance record.</CardDescription>
            </CardHeader>
            <CardContent>
              <AddAttendanceForm courses={mockCourses} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}