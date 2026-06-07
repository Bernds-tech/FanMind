import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "./dashboard.module.css";

type DashboardPageProps = {
  searchParams: Promise<{ demo?: string | string[] }>;
};

async function logout() {
  "use server";

  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const isDemoMode = Array.isArray(params.demo) ? params.demo.includes("1") : params.demo === "1";
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!isDemoMode && !data.user) {
    redirect("/login");
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-label="FanMind Workspace">
        <p className={styles.eyebrow}>FanMind MVP</p>
        <h1>FanMind Workspace</h1>
        {isDemoMode ? (
          <p className={styles.demoBadge}>Demo-Modus aktiv · ohne echte Authentifizierung</p>
        ) : (
          <p className={styles.status}>Du bist angemeldet.</p>
        )}
        {data.user?.email && <p className={styles.meta}>Session für {data.user.email}</p>}
        <p className={styles.notice}>
          Dieser Workspace ist bewusst minimal: Auth, Session und ein geschützter Einstieg sind vorbereitet. Kontakte, Memories, Follow-ups und KI-Logik folgen erst in späteren MVP-Schritten.
        </p>
        <div className={styles.actions}>
          <a href="/landing-v2">Zur Landingpage</a>
          {isDemoMode ? (
            <a href="/login">Zum Login</a>
          ) : (
            <form action={logout}>
              <button type="submit">Logout</button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
