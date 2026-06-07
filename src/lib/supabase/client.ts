"use client";

import { getSupabaseAuthUrl, getSupabaseHeaders } from "./config";

type SupabaseAuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

type SupabaseAuthSession = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  user?: SupabaseAuthUser;
};

type SupabaseAuthResponse = {
  session: SupabaseAuthSession | null;
  user: SupabaseAuthUser | null;
  error: Error | null;
};

type SignUpInput = {
  email: string;
  password: string;
  options?: {
    data?: Record<string, unknown>;
  };
};

type SignInInput = {
  email: string;
  password: string;
};

async function parseSupabaseError(response: Response): Promise<Error> {
  const payload = (await response.json().catch(() => null)) as { msg?: string; message?: string; error_description?: string; error?: string } | null;
  const message = payload?.msg ?? payload?.message ?? payload?.error_description ?? payload?.error ?? "Supabase Auth konnte die Anfrage nicht verarbeiten.";

  return new Error(message);
}

async function persistBrowserSession(session: SupabaseAuthSession | null): Promise<void> {
  if (!session?.access_token) {
    return;
  }

  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresIn: session.expires_in,
    }),
  });
}

function normalizeAuthPayload(payload: SupabaseAuthSession & { session?: SupabaseAuthSession }): SupabaseAuthResponse {
  const session = payload.session ?? (payload.access_token ? payload : null);
  const user = session?.user ?? payload.user ?? null;

  return { session, user, error: null };
}

async function postAuth(path: string, body: Record<string, unknown>): Promise<SupabaseAuthResponse> {
  try {
    const response = await fetch(getSupabaseAuthUrl(path), {
      method: "POST",
      headers: getSupabaseHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return { session: null, user: null, error: await parseSupabaseError(response) };
    }

    const payload = (await response.json()) as SupabaseAuthSession & { session?: SupabaseAuthSession };
    const authResponse = normalizeAuthPayload(payload);
    await persistBrowserSession(authResponse.session);

    return authResponse;
  } catch (error) {
    return { session: null, user: null, error: error instanceof Error ? error : new Error("Unbekannter Supabase-Fehler.") };
  }
}

export function createSupabaseBrowserClient() {
  return {
    auth: {
      signUp({ email, password, options }: SignUpInput) {
        return postAuth("/signup", {
          email,
          password,
          data: options?.data,
        });
      },
      signInWithPassword({ email, password }: SignInInput) {
        return postAuth("/token?grant_type=password", {
          email,
          password,
        });
      },
      async signOut() {
        await fetch("/api/auth/logout", { method: "POST" });
      },
    },
  };
}
