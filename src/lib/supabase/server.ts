import { cookies } from "next/headers";
import { getSupabaseAuthUrl, getSupabaseHeaders, SUPABASE_ACCESS_TOKEN_COOKIE, SUPABASE_REFRESH_TOKEN_COOKIE } from "./config";

type SupabaseServerUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

type SupabaseServerUserResponse = {
  data: { user: SupabaseServerUser | null };
  error: Error | null;
};

async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();

  return cookieStore.get(SUPABASE_ACCESS_TOKEN_COOKIE)?.value;
}

export function createSupabaseServerClient() {
  return {
    auth: {
      async getUser(): Promise<SupabaseServerUserResponse> {
        const accessToken = await getAccessToken();

        if (!accessToken) {
          return { data: { user: null }, error: null };
        }

        try {
          const response = await fetch(getSupabaseAuthUrl("/user"), {
            headers: getSupabaseHeaders(accessToken),
            cache: "no-store",
          });

          if (!response.ok) {
            return { data: { user: null }, error: new Error("Die Supabase-Session ist ungültig oder abgelaufen.") };
          }

          const user = (await response.json()) as SupabaseServerUser;

          return { data: { user }, error: null };
        } catch (error) {
          return { data: { user: null }, error: error instanceof Error ? error : new Error("Unbekannter Supabase-Fehler.") };
        }
      },
      async signOut(): Promise<void> {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get(SUPABASE_ACCESS_TOKEN_COOKIE)?.value;

        if (accessToken) {
          await fetch(getSupabaseAuthUrl("/logout"), {
            method: "POST",
            headers: getSupabaseHeaders(accessToken),
          }).catch(() => undefined);
        }

        cookieStore.delete(SUPABASE_ACCESS_TOKEN_COOKIE);
        cookieStore.delete(SUPABASE_REFRESH_TOKEN_COOKIE);
      },
    },
  };
}
