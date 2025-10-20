import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createSupabaseServerClient() {
  // Get the cookie store instance from next/headers
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // --- FIX FOR 'GET' ERROR ---
        // Access the cookie value using the instance inside a try/catch
        get(name: string): string | undefined {
          try {
             return cookieStore.get(name)?.value;
          } catch (error) {
             // This silence prevents Next.js from throwing errors on dynamic cookie access
             return undefined; 
          }
        },
        // --- Fix for 'set' ---
        set(name: string, value: string, options: CookieOptions) {
          try {
            // Use the instance to set the cookie
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignore errors in Server Components (middleware handles refresh)
          }
        },
        // --- Fix for 'remove' ---
        remove(name: string, options: CookieOptions) {
          try {
            // Use the instance to remove the cookie (by setting empty value)
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Ignore errors in Server Components
          }
        },
      },
    }
  );
}
