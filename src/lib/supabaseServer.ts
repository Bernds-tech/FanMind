type SupabaseRequestOptions = {
  select?: string;
  order?: string;
};

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return {
    url: url.replace(/\/$/, ""),
    serviceRoleKey
  };
}

export function isSupabaseConfigured() {
  return getSupabaseConfig() !== null;
}

export async function readSupabaseTable<T>(table: string, options: SupabaseRequestOptions = {}) {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  const searchParams = new URLSearchParams();
  searchParams.set("select", options.select ?? "*");

  if (options.order) {
    searchParams.set("order", options.order);
  }

  const response = await fetch(`${config.url}/rest/v1/${table}?${searchParams.toString()}`, {
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Supabase read failed for ${table}: ${response.status}`);
  }

  return (await response.json()) as T[];
}
