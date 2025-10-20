// src/app/api/mobile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
// If you use date-fns, uncomment this and install (npm install date-fns):
// import { parse } from 'date-fns';

// --- Environment Variable for API Key ---
const EXPECTED_API_KEY = process.env.MOBILE_API_KEY || "2xftFJ5YwwCAydiwepWqfUDMac4aa4dG"; // Replace placeholder with value from .env.local

// --- Zod Schemas ---
const JournalPayloadSchema = z.object({
  content: z.string().min(1),
});

const DeadlinePayloadSchema = z.object({
  courseCode: z.string().min(1),
  title: z.string().min(1),
  dateStr: z.string().min(1),
});

// --- NEW: Schema for Task Payload ---
const TaskPayloadSchema = z.object({ //
  title: z.string().min(1), //
  dateStr: z.string().min(1), //
}); //
// --- End New ---

const MobileApiRequestSchema = z.object({
  // --- UPDATED: Added 'task' ---
  type: z.enum(['journal', 'deadline', 'task']), //
  payload: z.any(),
});

// --- Supabase Client Helper ---
function createSupabaseRouteHandlerClient() { //
  const cookieStore = cookies(); //
  return createServerClient( //
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { //
        get(name: string): string | undefined { //
          return cookieStore.get(name)?.value; //
        },
        set(name: string, value: string, options: CookieOptions) { //
          try { //
            cookieStore.set({ name, value, ...options }); //
          } catch (error) { //
            // Ignore errors in Route Handlers
          }
        },
        remove(name: string, options: CookieOptions) { //
          try { //
            cookieStore.set({ name, value: '', ...options }); //
          } catch (error) { //
            // Ignore errors in Route Handlers
          }
        },
      },
    }
  );
}

// --- Date Helper ---
function getLocalDateString(date: Date): string { //
    const offset = date.getTimezoneOffset(); //
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000)); //
    return adjustedDate.toISOString().split('T')[0]; //
}

// --- POST Handler ---
export async function POST(req: NextRequest) { //
  const supabase = createSupabaseRouteHandlerClient(); //

  // 1. --- Check API Key ---
  const apiKey = req.headers.get('x-api-key'); //
  if (!apiKey || apiKey !== EXPECTED_API_KEY) { //
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }); //
  }

  // 2. --- Parse Request Body ---
  let requestBody: any;
  try { //
    requestBody = await req.json(); //
  } catch (error) { //
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 }); //
  }

  const validatedRequest = MobileApiRequestSchema.safeParse(requestBody); //

  if (!validatedRequest.success) { //
    return NextResponse.json({ success: false, error: 'Invalid request format', details: validatedRequest.error.flatten() }, { status: 400 }); //
  }

  const { type, payload } = validatedRequest.data; //

  // 3. --- Process Based on Type ---
  try { //
    if (type === 'journal') { //
      // --- Handle Journal Entry ---
      const validatedPayload = JournalPayloadSchema.safeParse(payload); //
       if (!validatedPayload.success) { //
        return NextResponse.json({ success: false, error: 'Invalid journal payload', details: validatedPayload.error.flatten() }, { status: 400 }); //
      }
      const { content } = validatedPayload.data; //
      const todayString = getLocalDateString(new Date()); //
      const { error: journalError } = await supabase //
        .from('journal_entries') //
        .upsert({ entry_date: todayString, content: content }, { onConflict: 'entry_date' }); //
      if (journalError) throw journalError; //
      return NextResponse.json({ success: true, message: 'Journal entry saved.' }); //

    } else if (type === 'deadline') { //
      // --- Handle Course Deadline Entry ---
      const validatedPayload = DeadlinePayloadSchema.safeParse(payload); //
       if (!validatedPayload.success) { //
        return NextResponse.json({ success: false, error: 'Invalid course deadline payload', details: validatedPayload.error.flatten() }, { status: 400 }); //
      }
      const { courseCode, title, dateStr } = validatedPayload.data; //
      // a) Find course_id
      const { data: courseData, error: courseError } = await supabase //
        .from('courses') //
        .select('id') //
        .eq('code', courseCode.toUpperCase()) //
        .maybeSingle(); //
      if (courseError) throw courseError; //
      if (!courseData) { //
        return NextResponse.json({ success: false, error: `Course code '${courseCode}' not found.` }, { status: 400 }); //
      }
      const course_id = courseData.id; //
      // b) Parse dateStr (Adjust parsing as needed!)
      let dueDate: Date;
      try { //
        const currentYear = new Date().getFullYear(); //
        let parsedDate = new Date(`${dateStr} ${currentYear}`); //
        if (isNaN(parsedDate.getTime())) { parsedDate = new Date(dateStr); } //
        if (isNaN(parsedDate.getTime())) { throw new Error('Invalid date format'); } //
        dueDate = parsedDate; //
      } catch (dateError) { //
        console.error("Date Parsing Error (Deadline):", dateError); //
        return NextResponse.json({ success: false, error: `Invalid date format: '${dateStr}'.` }, { status: 400 }); //
      }
      // c) Insert deadline
      const { error: deadlineError } = await supabase //
        .from('deadlines') //
        .insert({ //
          course_id: course_id, // Link to course
          title: title, //
          due_date: dueDate.toISOString(), //
          type: 'Coursework', // Or similar
          description: `Added via mobile on ${new Date().toLocaleDateString()}`, //
        });
      if (deadlineError) throw deadlineError; //
      return NextResponse.json({ success: true, message: 'Course deadline added.' }); //

    // --- NEW: Handle Generic Task Deadline ---
    } else if (type === 'task') { //
      const validatedPayload = TaskPayloadSchema.safeParse(payload); //
      if (!validatedPayload.success) { //
        return NextResponse.json({ success: false, error: 'Invalid task payload', details: validatedPayload.error.flatten() }, { status: 400 }); //
      }

      const { title, dateStr } = validatedPayload.data; //

      // Parse dateStr (same logic as deadlines, adjust if needed)
      let dueDate: Date;
      try { //
        const currentYear = new Date().getFullYear(); //
        let parsedDate = new Date(`${dateStr} ${currentYear}`); //
        if (isNaN(parsedDate.getTime())) { //
           parsedDate = new Date(dateStr); // Try parsing directly if year might be included //
        }
        if (isNaN(parsedDate.getTime())) { //
            throw new Error('Invalid date format'); //
        }
        dueDate = parsedDate; //
      } catch (dateError) { //
        console.error("Date Parsing Error (Task):", dateError); //
        return NextResponse.json({ success: false, error: `Invalid date format: '${dateStr}'. Please use a recognizable format (e.g., 'Nov 15' or 'Nov 15, 2025').` }, { status: 400 }); //
      }

      // Insert into deadlines table with course_id as NULL
      const { error: taskError } = await supabase //
        .from('deadlines') //
        .insert({ //
          course_id: null, // Set course_id to null for generic tasks //
          title: title, //
          due_date: dueDate.toISOString(), //
          type: 'Task', // Use a specific type like 'Task' or 'Other' //
          description: `Added via mobile on ${new Date().toLocaleDateString()}`, //
        });

      if (taskError) throw taskError; //

      return NextResponse.json({ success: true, message: 'Task added.' }); //
    // --- End New ---

    } else {
      // Should not happen due to schema validation
      return NextResponse.json({ success: false, error: 'Unsupported type' }, { status: 400 }); //
    }
  } catch (error: any) { //
    // --- Generic Error Handling ---
    console.error(`API Error (${type}):`, error); //
    return NextResponse.json({ success: false, error: error.message || 'An internal server error occurred.' }, { status: 500 }); //
  }
}