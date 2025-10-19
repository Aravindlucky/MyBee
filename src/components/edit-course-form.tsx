'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Removed unused Label import
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogContent,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { updateCourse } from '@/lib/course-actions';
import { CourseWithStats } from '@/components/course-card';
import { Module } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface EditCourseFormProps {
  course: CourseWithStats;
  modules: Module[];
  setOpen: (open: boolean) => void;
}

type CourseFormData = {
  courseId: string;
  title: string;
  code: string;
  professor: string;
  term: string;
  totalSessions: number;
  mandatoryAttendance: number;
  moduleId: string;
};

export function EditCourseForm({ course, modules, setOpen }: EditCourseFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CourseFormData>({
    defaultValues: {
      courseId: course.id,
      title: course.title,
      code: course.code || '',
      professor: course.professor || '',
      term: course.term || '',
      totalSessions: course.total_scheduled_sessions || 0,
      mandatoryAttendance: course.mandatory_attendance_percentage || 85,
      moduleId: course.module_id || 'none',
    },
  });

  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);
    console.log('Form Data Submitted (React Hook Form):', data);

    const formData = new FormData();
    formData.append('courseId', data.courseId);
    formData.append('title', data.title);
    formData.append('code', data.code);
    formData.append('professor', data.professor);
    formData.append('term', data.term);
    formData.append('totalSessions', data.totalSessions.toString());
    formData.append('mandatoryAttendance', data.mandatoryAttendance.toString());
    formData.append('moduleId', data.moduleId);

    console.log('FormData Contents (Sending to Server):');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    const result = await updateCourse(formData);

    if (result.success) {
      toast({ title: 'Success!', description: 'Course updated successfully.' });
      setOpen(false);
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      });
    }
    setIsSubmitting(false);
  };

  return (
    <DialogContent className="sm:max-w-[600px]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Make changes to {course.title}. Click save when you're done.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-6">
            {/* Title and Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Title</FormLabel>
                    <FormControl>
                      <Input {...field}  />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Code</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Professor */}
            <FormField
              control={form.control}
              name="professor"
              render={({ field }) => (
                 <FormItem>
                    <FormLabel>Professor</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
              )}
            />
             {/* Term and Total Scheduled Sessions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="term"
                render={({ field }) => (
                   <FormItem>
                    <FormLabel>Term</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* --- Refined Number Input --- */}
              <FormField
                control={form.control}
                name="totalSessions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Scheduled Sessions</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        // Use valueAsNumber, handle potential NaN
                        onChange={(e) => field.onChange(isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)}
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             {/* Module and Mandatory Attendance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="moduleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Assign to a module..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">
                          <em>None</em>
                        </SelectItem>
                        {modules.map((module) => (
                          <SelectItem key={module.id} value={module.id}>
                            {module.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* --- Refined Number Input --- */}
              <FormField
                  control={form.control}
                  name="mandatoryAttendance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mandatory Attendance (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                           // Use valueAsNumber, handle potential NaN
                          onChange={(e) => field.onChange(isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)}
                          min="0" max="100" required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}