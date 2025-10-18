'use client';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, LabelList } from 'recharts';
import { mockCourses, mockAttendance, mockScheduledSessions } from '@/lib/data';
import { isBefore, parseISO, startOfToday } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const MOCK_TODAY = new Date('2024-10-10T00:00:00.000Z');

export default function AttendancePage() {
  const coursesWithAttendance = mockCourses.map((course) => {
    const conductedSessions = mockScheduledSessions.filter(
      (s) => s.courseId === course.id && isBefore(parseISO(s.date), MOCK_TODAY)
    ).length;
    const attendedSessions = mockAttendance.filter(
      (r) => r.courseId === course.id && r.status === 'Present'
    ).length;

    const attendancePercentage =
      conductedSessions > 0 ? (attendedSessions / conductedSessions) * 100 : 100;

    const chartData = [
      {
        status: 'Attended',
        value: attendedSessions,
        fill: 'hsl(var(--primary))',
        label: `${attendedSessions}`,
      },
      {
        status: 'Missed',
        value: conductedSessions - attendedSessions,
        fill: 'hsl(var(--muted))',
        label: `${conductedSessions - attendedSessions}`,
      },
    ];

    return {
      ...course,
      conductedSessions,
      attendedSessions,
      attendancePercentage,
      chartData,
      isBelowThreshold: attendancePercentage < 75,
    };
  });

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Attendance Overview</h1>
        <p className="text-muted-foreground max-w-2xl text-lg mt-2">
          Review your attendance record for each subject across all sessions.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {coursesWithAttendance.map((course) => (
          <Card key={course.id} className="flex flex-col rounded-xl hover:shadow-lg transition-shadow">
             <Link href={`/attendance/${course.id}`} className="flex flex-col h-full group">
                <CardHeader>
                  <CardTitle className="font-headline text-xl">{course.title}</CardTitle>
                  <CardDescription>{course.code}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-center">
                  <div className="h-40">
                     <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={course.chartData}
                        margin={{ left: 10, right: 30 }}
                        stackOffset="expand"
                      >
                        <XAxis type="number" hide domain={[0, 1]} />
                        <YAxis type="category" dataKey="status" hide />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent hideLabel />}
                        />
                        <Bar dataKey="value" stackId="a" radius={[5, 5, 5, 5]}>
                           <LabelList 
                              dataKey="label" 
                              position="right" 
                              offset={10} 
                              className="fill-foreground font-semibold"
                            />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-around text-sm text-muted-foreground mt-2">
                    <span>Attended: {course.attendedSessions}</span>
                    <span>Conducted: {course.conductedSessions}</span>
                  </div>
                   {course.isBelowThreshold && (
                    <p className="text-sm font-semibold text-destructive text-center mt-4">
                      Attendance is below 75%!
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                   <div className="flex w-full items-center text-sm font-bold text-primary group-hover:underline">
                      View Details <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                    </div>
                </CardFooter>
             </Link>
          </Card>
        ))}
      </div>
    </main>
  );
}
