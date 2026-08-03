import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

let browserClient: any = null;

export const getSupabase = () => {
  if (browserClient) return browserClient;

  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ohsqlwpatxjxirlgghrb.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
  // Sanitize URL: Remove trailing slash if present
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  const sanitizedAnonKey = anonKey.trim();
  browserClient = createBrowserClient(url, sanitizedAnonKey);
  return browserClient;
};

export const getServerSupabase = (cookieStore: any) => {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ohsqlwpatxjxirlgghrb.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
  // Sanitize URL: Remove trailing slash if present
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  const sanitizedAnonKey = anonKey.trim();
  return createServerClient(url, sanitizedAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: any) {
        try {
          cookiesToSet.forEach(({ name, value, options }: any) =>
            cookieStore.set(name, value, options)
          );
        } catch {}
      },
    },
  });
};

export const getServiceSupabase = () => {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ohsqlwpatxjxirlgghrb.supabase.co';
  let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-service-key';
  // Sanitize URL: Remove trailing slash if present
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  // Sanitize Service Key: Trim whitespace
  serviceKey = serviceKey.trim();
  return createClient(url, serviceKey);
};

