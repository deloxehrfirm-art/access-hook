import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getAuthUser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  
  if (!url || !anonKey) {
    return null;
  }

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Safe to ignore if called in a read-only context (like page component rendering)
          }
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (err) {
    console.error("Auth check failed:", err);
    return null;
  }
}
