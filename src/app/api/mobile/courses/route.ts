// src/app/api/mobile/courses/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// --- IMPORTANT: Use the same API key as your other mobile endpoint ---
const EXPECTED_API_KEY = process.env.MOBILE_API_KEY || "2xftFJ5YwwCAydiwepWqfUDMac4aa4dG"; // Get from .env.local

// --- Helper to create Supabase client (same as in the other mobile route) ---
function createSupabaseRouteHandlerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string): string | undefined {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set({ name, value, ...options }); } catch (error) { /* Ignore */ }
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.set({ name, value: '', ...options }); } catch (error) { /* Ignore */ }
        },
      },
    }
  );
}

// --- GET Handler for Courses ---
export async function GET(req: NextRequest) {
  const supabase = createSupabaseRouteHandlerClient();

  // 1. --- Check API Key ---
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey || apiKey !== EXPECTED_API_KEY) {
    // Return error in a format the app might understand (though it expects a list here)
    // Or just return a standard unauthorized error
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. --- Fetch Courses from Supabase ---
  try {
    // Fetch id, code, and name from the 'courses' table
    // Order by code for consistent display in the spinner
    const { data: courses, error } = await supabase
      .from('courses')
.select('id, code, title') // Assuming 'title' is the correct column name
       .order('code', { ascending: true }); // Optional: Order alphabetically by code

    if (error) {
      throw error; // Throw error to be caught below
    }

    // 3. --- Return Courses as JSON ---
    // The Android app expects a JSON array of Course objects
    return NextResponse.json(courses || []); // Return fetched courses or empty array if null

  } catch (error: any) {
    // --- Error Handling ---
    console.error('API Error fetching courses:', error);
    // Return error in a way the app might show (though ideally it expects a list)
    // A 500 status is appropriate here
    return NextResponse.json({ error: error.message || 'Failed to fetch courses.' }, { status: 500 });
  }
}