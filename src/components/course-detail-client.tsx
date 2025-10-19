'use client';

import { useState } from "react";
import Link from "next/link";
import { Course, Session, AttendanceStatus } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { addSession } from "@/lib/session-actions";
// --- UPDATED ICONS ---
import { ArrowLeft, PlusCircle, UserCheck, UserX, Users, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Helper to get badge color based on status ---
function getStatusBadge(status: AttendanceStatus) {
  switch (status) {
    case 'present': return <Badge className="w-10 justify-center" variant="default">P</Badge>; // Adjusted width
    case 'absent': return <Badge className="w-10 justify-center" variant="destructive">A</Badge>; // Adjusted width
    case 'proxy': return <Badge className="w-10 justify-center" variant="secondary">PRX</Badge>; // Adjusted width
    // 'not-taken' removed from display logic if you also want it gone from the log table
    // case 'not-taken': return <Badge className="w-10 justify-center" variant="outline">NA</Badge>;
    default: return <Badge className="w-10 justify-center" variant="outline">-</Badge>; // Default placeholder
  }
}

// --- Helper for full date format ---
function formatFullDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
}

// --- Date formatter for table header ---
function formatLogDate(dateString: string) {
  const date = new Date(dateString);
  const day = date.toLocaleDateString('en-US', { day: '2-digit' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  return { day, month, weekday };
}

// --- Visual Status Picker Button ---
function StatusButton({
  label,
  icon: Icon,
  isSelected,
  onClick,
  variant = 'default'
}: {
  label: string;
  icon: React.ElementType;
  isSelected: boolean;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'secondary' // Added secondary variant
}) {
  let selectedVariant: 'default' | 'destructive' | 'secondary' = 'default';
  if (variant === 'destructive') selectedVariant = 'destructive';
  if (variant === 'secondary') selectedVariant = 'secondary';


  return (
    <Button
      type="button"
      variant={isSelected ? selectedVariant : 'outline'}
      // --- UPDATED STYLING FOR HORIZONTAL LAYOUT ---
      className={cn(
        "h-24 w-full flex flex-col items-center justify-center gap-2 transition-all text-center", // Centered content
        isSelected ? "ring-2 ring-primary ring-offset-2" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
      onClick={onClick}
    >
      <Icon className="h-6 w-6" /> {/* Slightly smaller icon */}
      <span className="text-xs font-semibold">{label}</span> {/* Smaller text */}
    </Button>
  )
}

// --- Main Client Component ---
export function CourseDetailClient({ course, sessions }: { course: Course, sessions: Session[] }) {
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'date' | 'status'>('date');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>('present'); // Default to present

  // --- Stats calculated from props ---
  const scheduledSessions = sessions?.length || 0;
   // Only count conducted if status is not 'not-taken'
  const conductedSessions = sessions?.filter(s => s.status !== 'not-taken').length || 0;
  const attendedSessions = sessions?.filter(s => s.status === 'present' || s.status === 'proxy').length || 0;
  
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedDate) {
       toast({ title: "Error", description: "Please select a date.", variant: "destructive" });
       return;
    }
    // Check if a session already exists for this date
    const existingSession = sessions.find(s =>
      new Date(s.date).toDateString() === selectedDate.toDateString()
    );
    if (existingSession) {
      toast({ title: "Warning", description: `A session already exists for ${selectedDate.toLocaleDateString()}. You might want to edit it instead.`, variant: "destructive" });
      // Optionally prevent submission or ask for confirmation
      // return;
    }


    const formData = new FormData();
    formData.append('courseId', course.id);
    formData.append('date', selectedDate.toISOString()); // Send full ISO string
    formData.append('status', selectedStatus);

    const result = await addSession(formData);
    
    if (result.success) {
      toast({ title: "Success!", description: result.message });
      setOpen(false);
      setStep('date');
      setSelectedDate(new Date());
      setSelectedStatus('present'); // Reset status
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };
  
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setStep('status');
    }
  }

  // Filter out 'not-taken' sessions before mapping if you don't want them in the table
   const displayedSessions = sessions // .filter(s => s.status !== 'not-taken');


  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      {/* --- Header --- */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/courses">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Courses</span>
          </Link>
        </Button>
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground text-lg">{course.code} • {course.professor}</p>
        </div>
      </div>


      {/* --- Attendance Log Card --- */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Attendance Log</CardTitle>
          <CardDescription>
            A detailed log of all sessions for this course.
          </CardDescription>
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <span className="font-medium text-sm mr-2">Legend:</span>
            <div className="flex items-center gap-2">
              <Badge className="w-10 justify-center" variant="default">P</Badge>
              <span className="text-sm text-muted-foreground">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="w-10 justify-center" variant="destructive">A</Badge>
              <span className="text-sm text-muted-foreground">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="w-10 justify-center" variant="secondary">PRX</Badge>
              <span className="text-sm text-muted-foreground">Proxy</span>
            </div>
            {/* Removed 'Not Taken' from Legend */}
          </div>
        </CardHeader>
        <CardContent>
          {displayedSessions.length > 0 ? (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-max">
                <TableHeader>
                  <TableRow className="bg-muted"> {/* Added background to header */}
                    <TableHead className="w-[180px] sticky left-0 bg-muted z-10">Subject</TableHead> {/* Sticky Subject */}
                    <TableHead className="w-[100px] text-center">Scheduled</TableHead>
                    <TableHead className="w-[100px] text-center">Conducted</TableHead>
                    <TableHead className="w-[100px] text-center">Attended</TableHead>
                    {/* --- Dynamic Date Columns --- */}
                    {displayedSessions.map((session) => {
                      const date = formatLogDate(session.date);
                      return (
                        <TableHead key={session.id} className="text-center min-w-[80px]"> {/* Min width for dates */}
                          <div className="flex flex-col items-center">
                            <span>{date.day} {date.month}</span>
                            <span className="text-xs font-normal text-muted-foreground">{date.weekday}</span>
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                     <TableCell className="font-medium sticky left-0 bg-background z-10">{course.title}</TableCell> {/* Sticky Subject cell */}
                    <TableCell className="text-center font-medium">{scheduledSessions}</TableCell>
                    <TableCell className="text-center font-medium">{conductedSessions}</TableCell>
                    <TableCell className="text-center font-medium">{attendedSessions}</TableCell>
                    {/* --- Dynamic Status Badges --- */}
                    {displayedSessions.map((session) => (
                      <TableCell key={session.id} className="text-center">
                        {getStatusBadge(session.status)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No sessions recorded yet.</p>
          )}
        </CardContent>
      </Card>
      
      {/* --- Leaves Card --- */}
      <Card className="rounded-xl">
        <CardHeader><CardTitle>Leaves</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">Data Not Found</p></CardContent>
      </Card>

      {/* --- Floating Action Button (FAB) --- */}
      <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setStep('date');
              // Don't reset selectedDate here, keep it for potential re-open
              // setSelectedDate(new Date());
              setSelectedStatus('present'); // Reset status on close
            }
          }}>
        <DialogTrigger asChild>
          <Button variant="default" size="icon" className="fixed bottom-8 right-8 z-50 rounded-full h-14 w-14 shadow-lg">
            <PlusCircle className="h-6 w-6" />
            <span className="sr-only">Add Session</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                {step === 'status' && (
                  <Button type="button" variant="ghost" size="icon" className="mr-2 h-6 w-6" onClick={() => setStep('date')}> {/* Smaller back button */}
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                {step === 'date' ? '1. Select Date' : '2. Select Status'}
              </DialogTitle>
            </DialogHeader>
            
            {step === 'date' && (
              <div className="flex justify-center py-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className="rounded-md border"
                  // disabled={(date) => sessions.some(s => new Date(s.date).toDateString() === date.toDateString())} // Optionally disable existing dates
                />
              </div>
            )}
            
            {step === 'status' && (
              <div className="space-y-4 py-4">
                <p className="text-center font-medium">
                  {selectedDate ? formatFullDate(selectedDate.toString()) : 'No date selected'}
                </p>
                {/* --- UPDATED HORIZONTAL LAYOUT --- */}
                <div className="grid grid-cols-3 gap-3"> {/* Changed to 3 columns */}
                  <StatusButton
                    label="Present"
                    icon={UserCheck} // New Icon
                    variant="default"
                    isSelected={selectedStatus === 'present'}
                    onClick={() => setSelectedStatus('present')}
                  />
                  <StatusButton
                    label="Absent"
                    icon={UserX} // New Icon
                    variant="destructive"
                    isSelected={selectedStatus === 'absent'}
                    onClick={() => setSelectedStatus('absent')}
                  />
                  <StatusButton
                    label="Proxy"
                    icon={Users} // Keep Users icon
                    variant="secondary"
                    isSelected={selectedStatus === 'proxy'}
                    onClick={() => setSelectedStatus('proxy')}
                  />
                  {/* "Not Taken" button removed */}
                </div>
                <Button type="submit" className="w-full">
                  Save Session
                </Button>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}