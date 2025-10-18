'use client';

import { mockCourses, mockAttendance, mockScheduledSessions } from '@/lib/data';
import type { AttendanceStatus } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, parseISO, isBefore, startOfToday } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { notFound } from 'next/navigation';

const statusMap: Record<AttendanceStatus, { label: string; short: string; className: string }> = {
  'Present': { label: 'Present', short: 'P', className: 'bg-green-100 text-green-800 border-green-300' },
  'Absent': { label: 'Absent', short: 'A', className: 'bg-red-100 text-red-800 border-red-300' },
  'Excused': { label: 'Excused', short: 'E', className: 'bg-blue-100 text-blue-800 border-blue-300' },
  'Not Taken': { label: 'Attendance Not Taken', short: 'NA', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  'Future': { label: 'Future', short: '-', className: 'bg-gray-100 text-gray-500 border-gray-300' },
};

export default function AttendanceDetailPage({ params }: { params: { courseId: string } }) {
  const course = mockCourses.find(c => c.id === params.courseId);

  if (!course) {
    notFound();
  }
  
  const today = startOfToday();

  const scheduledSessions = mockScheduledSessions.filter(s => s.courseId === course.id);
  const conductedSessions = scheduledSessions.filter(s => isBefore(parseISO(s.date), today));
  const attendedRecords = mockAttendance.filter(r => r.courseId === course.id && r.status === 'Present');

  const sessionDetails = mockScheduledSessions
    .filter(s => s.courseId === course.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 8) // Displaying up to 8 sessions
    .map(session => {
    const record = mockAttendance.find(r => r.courseId === course.id && r.date === session.date);
    let status: AttendanceStatus;
    if (isBefore(parseISO(session.date), today)) {
      status = record ? record.status : 'Not Taken';
    } else {
      status = 'Future';
    }
    return {
      date: session.date,
      status,
    };
  });

  const courseWithAttendance = {
    ...course,
    scheduled: scheduledSessions.length,
    conducted: conductedSessions.length,
    attended: attendedRecords.length,
    sessions: sessionDetails,
  };
  
  const dateColumns = courseWithAttendance.sessions;

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div>
         <Button asChild variant="outline" size="sm" className="mb-4">
            <Link href="/attendance">
                <ArrowLeft className="mr-2" />
                Back to Overview
            </Link>
        </Button>
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Attendance Details</h1>
        <p className="text-muted-foreground max-w-2xl text-lg mt-2">
          Showing records for <span className="font-semibold text-foreground">{course.title}</span>.
        </p>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {Object.values(statusMap).filter(s => s.label !== 'Future').map(status => (
              <div key={status.label} className="flex items-center gap-2">
                <Badge variant="outline" className={cn("size-6 p-0 items-center justify-center font-bold", status.className)}>
                  {status.short}
                </Badge>
                <span className="text-sm text-muted-foreground">{status.label}</span>
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="whitespace-nowrap">
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-[200px] text-foreground font-bold bg-primary/20">Subject</TableHead>
                  <TableHead className="text-center text-foreground font-bold bg-yellow-400/30">Scheduled Sessions</TableHead>
                  <TableHead className="text-center text-foreground font-bold bg-blue-400/30">Conducted Sessions</TableHead>
                  <TableHead className="text-center text-foreground font-bold bg-primary/30">Attended Sessions</TableHead>
                  {dateColumns.map(({ date }) => (
                    <TableHead key={date} className="text-center text-foreground font-bold bg-primary/20">
                      {format(parseISO(date), 'd MMM')}
                      <br/>
                      {format(parseISO(date), 'EEE')}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">{courseWithAttendance.title}</TableCell>
                    <TableCell className="text-center font-medium">{courseWithAttendance.scheduled}</TableCell>
                    <TableCell className="text-center font-medium">{courseWithAttendance.conducted}</TableCell>
                    <TableCell className="text-center font-medium">{courseWithAttendance.attended}</TableCell>
                    {courseWithAttendance.sessions.map((session, idx) => {
                      const statusInfo = statusMap[session.status];
                      return (
                        <TableCell key={`${course.id}-${session.date}-${idx}`} className="text-center">
                           <Badge variant="outline" className={cn("size-7 p-0 items-center justify-center font-bold text-xs", statusInfo.className)}>
                            {statusInfo.short}
                          </Badge>
                        </TableCell>
                      )
                    })}
                  </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
