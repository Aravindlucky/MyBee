'use client';

import Link from "next/link";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, User, MoreVertical, Edit, AlertTriangle } from "lucide-react";
import { Course, Module } from "@/lib/types";
import { CircularProgress } from "@/components/ui/circular-progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { EditCourseForm } from "./edit-course-form";

export type CourseWithStats = Course & {
  scheduled: number;
  conducted: number;
  present: number;
  proxy: number;
  absent: number;
  attended: number; // present + proxy
};

const PIE_COLORS = {
  present: "hsl(var(--teal))",
  proxy: "hsl(var(--accent))",
  absent: "hsl(var(--destructive))",
};

interface CourseCardProps {
  course: CourseWithStats;
  modules: Module[];
}

// Helper function for attendance percentage based on total scheduled
const getAttendancePercentage = (totalScheduled: number, absent: number) => {
  if (totalScheduled <= 0) return 0;
  const potentialAttended = totalScheduled - absent;
  return Math.round((potentialAttended / totalScheduled) * 100);
};


export function CourseCard({ course, modules }: CourseCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const {
    present,
    proxy,
    absent,
    attended,
    conducted,
    total_scheduled_sessions,
    mandatory_attendance_percentage,
    title,
    professor,
    id,
  } = course;

  const attendancePercentage = getAttendancePercentage(total_scheduled_sessions, absent);

  // --- Bunk Calculation ---
  let total_bunks_allowed = 0;
  const isAttendanceSet = total_scheduled_sessions > 0 && mandatory_attendance_percentage >= 0 && mandatory_attendance_percentage <= 100;

  if (isAttendanceSet) {
      const minAttendanceRequired = Math.ceil((mandatory_attendance_percentage / 100) * total_scheduled_sessions);
      total_bunks_allowed = total_scheduled_sessions - minAttendanceRequired;
  }

  const bunksLeft = total_bunks_allowed - absent;
  const showWarning = isAttendanceSet && bunksLeft === 1;

  // --- CORRECTED Color Coding Logic ---
  let progressColor = "text-muted-foreground";
  let bunksLeftColor = "text-muted-foreground";

  if (isAttendanceSet) {
      if (bunksLeft <= 0) { // No bunks left or over limit
          progressColor = "text-destructive"; // Red
          bunksLeftColor = "text-destructive font-bold";
      } else if (bunksLeft === 1) { // Exactly 1 bunk left
          progressColor = "text-[hsl(var(--accent))]"; // Yellow
          bunksLeftColor = "text-accent-foreground font-semibold";
      } else { // 2+ bunks left (Changed from bunksLeft <= 2)
          progressColor = "text-[hsl(var(--teal))]"; // Green
          bunksLeftColor = "text-[hsl(var(--teal))] font-bold";
      }
  }

  // Breakdown Chart Data
  const pieChartData = [
    { name: 'Present', value: present, fill: PIE_COLORS.present },
    { name: 'Proxy', value: proxy, fill: PIE_COLORS.proxy },
    { name: 'Absent', value: absent, fill: PIE_COLORS.absent },
  ].filter(d => d.value > 0);

  return (
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <Card className="flex flex-col rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden">

        <CardHeader className="bg-secondary">
         <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="font-headline text-xl leading-tight">{title}</CardTitle>
              {professor && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                  <User className="h-4 w-4" />
                  <span>{professor}</span>
                </div>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-1">
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DialogTrigger asChild>
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit Course</span>
                  </DropdownMenuItem>
                </DialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="flex-grow flex flex-col items-center justify-center pt-6 pb-4">
          <div className="flex flex-col items-center gap-2 w-48">
              <div className="relative aspect-square h-48 w-48">
                {!showBreakdown ? (
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative h-full w-full cursor-default">
                          <CircularProgress
                            value={attendancePercentage}
                            strokeWidth={12}
                            color={progressColor} // Color is based on bunks
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={cn("text-3xl font-bold", progressColor)}>
                               {attendancePercentage}%
                            </span>
                            <span className="text-sm text-muted-foreground -mt-1">
                               Attendance
                            </span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                         <p>Based on {total_scheduled_sessions} total sessions</p>
                         <p>{absent} absence{absent !== 1 ? 's' : ''} recorded</p>
                         {isAttendanceSet && <p>Bunks Left: {bunksLeft}</p>}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                 <ChartContainer config={{}} className="w-full h-full">
                    <PieChart>
                      <RechartsTooltip cursor={false} content={<ChartTooltipContent hideIndicator hideLabel />} />
                      <Pie
                        data={pieChartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={2}
                        strokeWidth={1}
                      >
                        {pieChartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                )}
              </div>
               <TooltipProvider delayDuration={100}>
                 <Tooltip>
                      <TooltipTrigger asChild>
                         <div className="flex justify-start w-full pl-1">
                            <Switch
                              id={`breakdown-${id}`}
                              checked={showBreakdown}
                              onCheckedChange={setShowBreakdown}
                              className="h-4 w-7 [&>span]:h-3 [&>span]:w-3 data-[state=checked]:[&>span]:translate-x-3"
                             />
                         </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" align="start">
                        <p>Toggle Breakdown View</p>
                      </TooltipContent>
                    </Tooltip>
               </TooltipProvider>
           </div>
        </CardContent>

        <CardFooter className="flex flex-col items-start bg-secondary pt-3 pb-3">
          <div className="w-full flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              Bunks Left:{" "}
              <span className={cn("text-lg", bunksLeftColor)}>
                 {isAttendanceSet ? bunksLeft : "N/A"}
              </span>
               {showWarning && (
                 <AlertTriangle
                   className={cn(
                     "h-4 w-4 text-[hsl(var(--accent))]",
                     "animate-flash-warning"
                   )}
                 />
               )}
            </span>
            <Button variant="secondary" size="sm" className="transition-all duration-200" asChild>
              <Link href={`/courses/${id}`}>
                <Eye className="mr-1.5 h-4 w-4" />
                Details
              </Link>
            </Button>
          </div>
        </CardFooter>
      </Card>

      <EditCourseForm
        course={course}
        modules={modules}
        setOpen={setIsEditDialogOpen}
      />
    </Dialog>
  );
}