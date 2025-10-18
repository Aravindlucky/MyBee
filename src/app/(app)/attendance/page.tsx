import { mockCourses, mockAttendance, mockScheduledSessions } from '@/lib/data';
import type { AttendanceRecord, Course, AttendanceStatus } from '@/lib/types';
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
import { format, parseISO, isBefore, startOfToday, getDay } from 'date-fns';

const TODAY = startOfToday();
// Let's use a fixed date for mock data consistency, e.g., Oct 10, 2024
const MOCK_TODAY = new Date('2024-10-10T00:00:00.000Z');

// This function generates the date columns for our table
const getRecentSessionDates = (courseId: string) => {
  return mockScheduledSessions
    .filter(s => s.courseId === courseId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 8); // Displaying up to 8 sessions like in the image
};

const statusMap: Record<AttendanceStatus, { label: string; short: string; className: string }> = {
  'Present': { label: 'Present', short: 'P', className: 'bg-green-100 text-green-800 border-green-300' },
  'Absent': { label: 'Absent', short: 'A', className: 'bg-red-100 text-red-800 border-red-300' },
  'Excused': { label: 'Excused', short: 'E', className: 'bg-blue-100 text-blue-800 border-blue-300' },
  'Not Taken': { label: 'Attendance Not Taken', short: 'NA', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  'Future': { label: 'Future', short: '-', className: 'bg-gray-100 text-gray-500 border-gray-300' },
};

export default function AttendancePage() {

  const coursesWithAttendance = mockCourses.map(course => {
    const scheduledSessions = mockScheduledSessions.filter(s => s.courseId === course.id);
    const conductedSessions = scheduledSessions.filter(s => isBefore(parseISO(s.date), MOCK_TODAY));
    const attendedRecords = mockAttendance.filter(r => r.courseId === course.id && r.status === 'Present');

    const sessionDetails = getRecentSessionDates(course.id).map(session => {
      const record = mockAttendance.find(r => r.courseId === course.id && r.date === session.date);
      let status: AttendanceStatus;
      if (isBefore(parseISO(session.date), MOCK_TODAY)) {
        status = record ? record.status : 'Not Taken';
      } else {
        status = 'Future';
      }
      return {
        date: session.date,
        status,
      };
    });

    return {
      ...course,
      scheduled: scheduledSessions.length,
      conducted: conductedSessions.length,
      attended: attendedRecords.length,
      sessions: sessionDetails,
    };
  });
  
  // We need a consistent set of dates for the header, let's take it from the first course
  const dateColumns = coursesWithAttendance.length > 0 ? coursesWithAttendance[0].sessions : [];

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Attendance Overview</h1>
        <p className="text-muted-foreground max-w-2xl text-lg mt-2">
          Review your attendance record for each subject across all sessions.
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
                {coursesWithAttendance.map(course => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.title}</TableCell>
                    <TableCell className="text-center font-medium">{course.scheduled}</TableCell>
                    <TableCell className="text-center font-medium">{course.conducted}</TableCell>
                    <TableCell className="text-center font-medium">{course.attended}</TableCell>
                    {course.sessions.map((session, idx) => {
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
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

       <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Leaves</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Data Not Found</p>
          </CardContent>
        </Card>
    </main>
  );
}
