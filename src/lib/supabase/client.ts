"use client";

import { getSupabaseHeaders, getSupabaseRestUrl, getSupabaseAuthUrl } from "./config";

type SupabaseAuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

export type SupabaseAuthSession = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  user?: SupabaseAuthUser;
};

type SupabaseAuthResponse = {
  data: {
    session: SupabaseAuthSession | null;
    user: SupabaseAuthUser | null;
  };
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

type SupabaseMutationResponse<T = unknown> = {
  data: T | null;
  error: Error | null;
};

type InsertResult = PromiseLike<SupabaseMutationResponse> & {
  select(columns: string): {
    single<T = Record<string, unknown>>(): Promise<SupabaseMutationResponse<T>>;
  };
};

async function parseSupabaseError(response: Response): Promise<Error> {
  const payload = (await response.json().catch(() => null)) as { msg?: string; message?: string; error_description?: string; error?: string } | null;
  const message = payload?.msg ?? payload?.message ?? payload?.error_description ?? payload?.error ?? "Supabase konnte die Anfrage nicht verarbeiten.";

  return new Error(message);
}

async function persistServerSession(session: SupabaseAuthSession | null): Promise<void> {
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
      expiresAt: session.expires_at,
    }),
  });
}

function normalizeAuthPayload(payload: SupabaseAuthSession & { session?: SupabaseAuthSession; user?: SupabaseAuthUser }): SupabaseAuthResponse {
  const session = payload.session ?? (payload.access_token ? payload : null);
  const user = session?.user ?? payload.user ?? null;

  return { data: { session, user }, error: null };
}

async function postAuth(path: string, body: Record<string, unknown>, rememberSession: (session: SupabaseAuthSession | null) => void): Promise<SupabaseAuthResponse> {
  try {
    const response = await fetch(getSupabaseAuthUrl(path), {
      method: "POST",
      headers: getSupabaseHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return { data: { session: null, user: null }, error: await parseSupabaseError(response) };
    }

    const payload = (await response.json()) as SupabaseAuthSession & { session?: SupabaseAuthSession; user?: SupabaseAuthUser };
    const authResponse = normalizeAuthPayload(payload);
    rememberSession(authResponse.data.session);
    await persistServerSession(authResponse.data.session);

    return authResponse;
  } catch (error) {
    return { data: { session: null, user: null }, error: error instanceof Error ? error : new Error("Unbekannter Supabase-Fehler.") };
  }
}

async function postgrestRequest<T>(table: string, method: "POST" | "PATCH", values: unknown, accessToken?: string, select?: string, single?: boolean, upsert?: boolean): Promise<SupabaseMutationResponse<T>> {
  try {
    const url = new URL(getSupabaseRestUrl(table));

    if (select) {
      url.searchParams.set("select", select);
    }

    if (upsert && typeof values === "object" && values && "id" in values) {
      url.searchParams.set("on_conflict", "id");
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        ...getSupabaseHeaders(accessToken),
        Prefer: `${upsert ? "resolution=merge-duplicates," : ""}${select ? "return=representation" : "return=minimal"}`,
      },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      return { data: null, error: await parseSupabaseError(response) };
    }

    if (!select) {
      return { data: null, error: null };
    }

    const payload = (await response.json()) as T[];

    return { data: single ? payload[0] ?? null : (payload as T), error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error("Unbekannter Supabase-Fehler.") };
  }
}

function createInsertResult(table: string, values: unknown, getAccessToken: () => string | undefined): InsertResult {
  const execute = () => postgrestRequest(table, "POST", values, getAccessToken());

  return {
    then(resolve, reject) {
      return execute().then(resolve, reject);
    },
    select(columns: string) {
      return {
        single<T = Record<string, unknown>>() {
          return postgrestRequest<T>(table, "POST", values, getAccessToken(), columns, true);
        },
      };
    },
  };
}

export function createSupabaseBrowserClient() {
  let currentSession: SupabaseAuthSession | null = null;
  const rememberSession = (session: SupabaseAuthSession | null) => {
    currentSession = session;
  };
  const getAccessToken = () => currentSession?.access_token;

  return {
    auth: {
      signUp({ email, password, options }: SignUpInput) {
        return postAuth("/signup", { email, password, data: options?.data }, rememberSession);
      },
      signInWithPassword({ email, password }: SignInInput) {
        return postAuth("/token?grant_type=password", { email, password }, rememberSession);
      },
      async signOut() {
        await fetch("/api/auth/logout", { method: "POST" });
        currentSession = null;
      },
    },
    from(table: string) {
      return {
        upsert(values: unknown) {
          return postgrestRequest(table, "POST", values, getAccessToken(), undefined, false, true);
        },
        insert(values: unknown) {
          return createInsertResult(table, values, getAccessToken);
        },
      };
    },
  };
}

export async function syncSupabaseSessionForServer(session: SupabaseAuthSession | null): Promise<void> {
  await persistServerSession(session);
}
