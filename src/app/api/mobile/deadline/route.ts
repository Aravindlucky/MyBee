// src/app/api/mobile/deadlines/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// IMPORTANT: Use the same API key as your other mobile endpoints
// This key is currently hardcoded in your system as: 2xftFJ5YwwCAydiwepWqfUDMac4aa4dG
const EXPECTED_API_KEY = process.env.MOBILE_API_KEY || "2xftFJ5YwwCAydiwepWqfUDMac4aa4dG"; 

// Helper to create Supabase client for Route Handlers
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

// --- GET Handler for Deadlines ---
export async function GET(req: NextRequest) {
  const supabase = createSupabaseRouteHandlerClient();

  // 1. --- Security Check (API Key) ---
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey || apiKey !== EXPECTED_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. --- Fetch Deadlines with Course Details ---
  try {
    // Fetch all deadlines, ordered by due_date, and join course details
    const { data: deadlines, error } = await supabase
        .from('deadlines')
        .select(`
          id,
          title,
          due_date,
          due_time,
          description,
          type,
          courses ( code, title ) 
        `)
        // Sort by date, then time (if present)
        .order('due_date', { ascending: true })
        .order('due_time', { ascending: true, nullsFirst: true }); 

    if (error) {
      console.error('Supabase Error Fetching Deadlines:', error);
      throw error;
    }

    // 3. --- Return Deadlines as JSON ---
    return NextResponse.json(deadlines || []);

  } catch (error: any) {
    // --- Error Handling ---
    console.error('API Error fetching deadlines:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch deadlines.' }, { status: 500 });
  }
}

