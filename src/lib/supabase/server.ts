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
        // --- Fix for 'get' ---
        // The 'get' method needs to return string | undefined
        get(name: string): string | undefined {
          // Access the cookie value using the instance
          return cookieStore.get(name)?.value;
        },
        // --- Fix for 'set' ---
        // The 'set' method is correctly defined, but we add try/catch
        // as recommended by Supabase for server component usage.
        set(name: string, value: string, options: CookieOptions) {
          try {
            // Use the instance to set the cookie
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignore errors in Server Components (middleware handles refresh)
          }
        },
        // --- Fix for 'remove' ---
        // The 'remove' method is implemented using 'set' with an empty value
        // Add try/catch as recommended.
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