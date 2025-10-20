// src/app/api/fcm/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Define expected request body structure
const FcmTokenSchema = z.object({
  token: z.string().min(10).describe('The Firebase Cloud Messaging token.'),
});

// IMPORTANT: This key must match the one hardcoded in MyFirebaseMessagingService.kt
const EXPECTED_API_KEY = process.env.MOBILE_API_KEY || "2xftFJ5YwwCAydiwepWqfUDMac4aa4dG"; 

function createSupabaseRouteHandlerClient() {
    const cookieStore = cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    );
}


export async function POST(req: NextRequest) {
    const supabase = createSupabaseRouteHandlerClient();

    // 1. Check API Key
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey || apiKey !== EXPECTED_API_KEY) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and Validate Request Body
    let requestBody: any;
    try {
        requestBody = await req.json();
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const validatedPayload = FcmTokenSchema.safeParse(requestBody);

    if (!validatedPayload.success) {
        return NextResponse.json({ success: false, error: 'Invalid token format.' }, { status: 400 });
    }
    const { token } = validatedPayload.data;

    try {
        // NOTE: We rely on Supabase RLS to get the user ID automatically, 
        // but since this is a server route using the Anon key, we'll store 
        // the token directly. If a user session was available, we'd link it.

        // Use UPSERT: If the token already exists, nothing happens.
        // If the token is new, it is inserted. This prevents duplicates.
        const { error } = await supabase
            .from('fcm_tokens')
            .upsert(
                { token: token },
                { onConflict: 'token' } // Assuming 'token' is set as unique key in Supabase
            );

        if (error) {
            console.error("Supabase FCM Insert Error:", error);
            throw new Error(error.message);
        }

        return NextResponse.json({ success: true, message: 'FCM token registered.' });

    } catch (error: any) {
        console.error("FCM Token Registration Error:", error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to register token.' }, { status: 500 });
    }
}