// src/app/api/fcm/remind/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { google } from 'googleapis'; // 👈 CRITICAL: Google Auth Library Import

// --- IMPORTANT CONFIGURATION ---
// 1. Secret Key to secure this endpoint (must be set in your environment variables)
const CRON_SECRET = process.env.CRON_SECRET || "A1b9ZpXy7sDkL3mO4jHq2eN0"; 

// 2. Your Firebase Project ID (needed for the FCM v1 API endpoint)
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "mybee-bfaa7"; 

// 3. The Firebase API endpoint
const FCM_API_URL = `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;

// 🛑 CRITICAL: This environment variable holds the JSON content of your Service Account Key
const SERVICE_ACCOUNT_KEY_CONTENT = process.env.FIREBASE_SERVICE_ACCOUNT_KEY; 
// --------------------------------

function createSupabaseRouteHandlerClient() {
    const cookieStore = cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    );
}

/**
 * NEW FUNCTION: Generates a short-lived OAuth 2.0 Access Token using the service account key.
 */
async function getAccessToken(): Promise<string> {
    if (!SERVICE_ACCOUNT_KEY_CONTENT) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.");
    }

    try {
        // Parse the JSON string from the environment variable
        const key = JSON.parse(SERVICE_ACCOUNT_KEY_CONTENT);
        const SCOPES = ['https://www.googleapis.com/auth/firebase.messaging'];
        
        const jwtClient = new google.auth.JWT(
            key.client_email,
            null,
            key.private_key,
            SCOPES,
            null
        );

        // Authorize the JWT client and get the access token
        const tokens = await jwtClient.authorize();
        
        if (!tokens || !tokens.access_token) {
            throw new Error("Failed to mint access token: Authorization returned no token.");
        }
        
        console.log("Successfully generated new FCM Access Token.");
        return tokens.access_token;

    } catch (error) {
        // Log the detailed error for debugging purposes
        console.error("TOKEN GENERATION ERROR:", error);
        throw new Error("Failed to generate OAuth 2.0 token. Check FIREBASE_SERVICE_ACCOUNT_KEY format or dependencies.");
    }
}

/**
 * Sends a push notification to the first token in the list.
 */
async function sendFCMNotification(tokens: string[], title: string, body: string, accessToken: string): Promise<{ success: boolean, message: string }> {
    if (tokens.length === 0) return { success: true, message: "No tokens to send to." };

    // Using the first token for a quick test
    const targetToken = tokens[0];
    
    const messagePayload = {
        message: {
            token: targetToken,
            notification: {
                title: title,
                body: body,
            },
            android: {
                priority: 'HIGH',
            },
        },
    };

    try {
        const response = await fetch(FCM_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`, 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messagePayload),
        });

        const responseText = await response.text();

        if (response.ok) {
            console.log(`[FCM-SUCCESS] Notification sent. Response: ${responseText}`);
            return { 
                success: true, 
                message: `Successfully sent notification to target device.` 
            };
        } else {
            console.error(`[FCM-API-ERROR] Status: ${response.status}. Response: ${responseText}`);
            return { 
                success: false, 
                message: `FCM API call failed with status ${response.status}. Response: ${responseText}` 
            };
        }
    } catch (e: any) {
        console.error("[FCM-FETCH-ERROR] Network or fetch failure:", e);
        return { 
            success: false, 
            message: `Network error during FCM fetch: ${e.message}` 
        };
    }
}


/**
 * POST handler to be called by a scheduler (cron job).
 */
export async function POST(req: NextRequest) {
    const supabase = createSupabaseRouteHandlerClient();

    // 1. --- Security Check (Secret Key) ---
    const requestSecret = req.nextUrl.searchParams.get('secret');

    if (requestSecret !== CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized: Invalid cron secret.' }, { status: 401 });
    }

    try {
        // 🛑 NEW: Generate the real access token. Will throw if environment variable is missing/bad.
        const accessToken = await getAccessToken();

        const now = new Date();
        const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60000);
        
        const nowISO = now.toISOString();
        const futureISO = thirtyMinutesFromNow.toISOString();


        // 2. --- Query Upcoming Deadlines (Due between NOW and NOW + 30 mins) ---
        const { data: deadlines, error: deadlinesError } = await supabase
            .from('deadlines')
            .select(`
                title, 
                due_date,
                courses (title, code)
            `)
            .gte('due_date', nowISO)
            .lte('due_date', futureISO);

        if (deadlinesError) throw deadlinesError;

        if (!deadlines || deadlines.length === 0) {
            return NextResponse.json({ success: true, message: "No deadlines approaching in the next 30 minutes." });
        }

        // 3. --- Fetch all FCM Tokens ---
        const { data: tokensData, error: tokensError } = await supabase
            .from('fcm_tokens')
            .select('token');
            
        if (tokensError) throw tokensError;

        const allTokens = tokensData.map(t => t.token);
        
        if (allTokens.length === 0) {
             return NextResponse.json({ success: true, message: "Deadlines found, but no mobile devices registered." });
        }

        // 4. --- Send Notifications (REAL CALL) ---
        let successfulReminders = 0;

        for (const deadline of deadlines) {
            const courseTitle = deadline.courses?.code || 'Course';
            const reminderTitle = `⏰ Deadline Alert: ${courseTitle}`;
            const reminderBody = `"${deadline.title}" is due in the next 30 minutes! Stay focused.`;

            // Sends notification using the valid OAuth token
            const sendResult = await sendFCMNotification(
                allTokens, 
                reminderTitle, 
                reminderBody, 
                accessToken
            );
            
            if (sendResult.success) {
                successfulReminders++;
            } else {
                console.error(`FCM Send failed for deadline: ${deadline.title}. Reason: ${sendResult.message}`);
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Processed ${deadlines.length} deadlines. Sent ${successfulReminders} notifications.`,
            debug: { fcm_url: FCM_API_URL }
        });

    } catch (error: any) {
        console.error("CRON JOB ERROR:", error);
        return NextResponse.json({ success: false, error: error.message || 'An internal server error occurred during scheduling.' }, { status: 500 });
    }
}