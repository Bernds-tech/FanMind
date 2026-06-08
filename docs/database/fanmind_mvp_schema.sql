-- FanMind MVP Supabase/Postgres schema
-- Zweck dieses PRs: nur Auth-/Workspace-Grundstein mit planId vorbereiten.
-- Kontakte, Messages, Memories, Follow-ups und KI-Ausgaben bleiben bewusst spätere Tabellen.
-- Dieses Schema setzt keine Service-Role im Browser voraus; Inserts laufen über auth.uid() + RLS.
--
-- Plan-/Paket-Regeln im MVP:
-- - FanMind kennt genau vier plan_id-Werte: pilot, starter, growth, agency.
-- - plan_id kommt aktuell aus /register?plan=...; gültig sind /register?plan=pilot,
--   /register?plan=starter, /register?plan=growth und /register?plan=agency.
-- - Wenn kein plan gesetzt ist, nutzt die App starter als Default für echte Registrierungen.
-- - Ungültige plan-Werte werden in der App auf einen sicheren Fallback normalisiert und
--   sollen weder Registrierung noch Onboarding crashen lassen.
-- - Onboarding verwendet plan_id, um pro Paket passende Inhalte anzuzeigen.
-- - Später wird plan_id produktiv aus Session -> Workspace-Membership -> workspaces.plan_id
--   gelesen; die URL bleibt dann nur Landingpage-/Demo-Einstieg.
-- - Keine Payment-, Stripe- oder Subscription-Logik in diesem Schema.
-- - MVP-Commercial-Werte werden als Workspace-Grunddaten gespeichert:
--   pilot_only = 99000 Setup-Cents, 0 Monats-Cents, 0 Monate Bindung.
--   starter_paid_setup = 99000 Setup-Cents, 29900 Monats-Cents, 0 Monate Bindung.
--   starter_12m_setup_waived = 0 Setup-Cents, 29900 Monats-Cents, 12 Monate Bindung.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null default 'starter' check (plan_id in ('pilot', 'starter', 'growth', 'agency')),
  commercial_option text not null default 'starter_12m_setup_waived' check (commercial_option in ('pilot_only', 'starter_paid_setup', 'starter_12m_setup_waived')),
  setup_fee_cents integer not null default 0 check (setup_fee_cents >= 0),
  monthly_fee_cents integer not null default 29900 check (monthly_fee_cents >= 0),
  commitment_months integer not null default 12 check (commitment_months in (0, 12)),
  created_at timestamptz not null default now()
);

-- Migration für bereits bestehende Supabase-Tabellen:
-- alter table public.workspaces add column if not exists commercial_option text not null default 'starter_12m_setup_waived';
-- alter table public.workspaces add column if not exists setup_fee_cents integer not null default 0;
-- alter table public.workspaces add column if not exists monthly_fee_cents integer not null default 29900;
-- alter table public.workspaces add column if not exists commitment_months integer not null default 12;
-- alter table public.workspaces add constraint workspaces_plan_id_check check (plan_id in ('pilot', 'starter', 'growth', 'agency'));
-- alter table public.workspaces add constraint workspaces_commercial_option_check check (commercial_option in ('pilot_only', 'starter_paid_setup', 'starter_12m_setup_waived'));
-- alter table public.workspaces add constraint workspaces_commitment_months_check check (commitment_months in (0, 12));
-- alter table public.workspaces add constraint workspaces_setup_fee_cents_check check (setup_fee_cents >= 0);
-- alter table public.workspaces add constraint workspaces_monthly_fee_cents_check check (monthly_fee_cents >= 0);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "workspaces_select_owner_or_member"
  on public.workspaces for select
  using (
    owner_user_id = auth.uid()
    or exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = workspaces.id
        and wm.user_id = auth.uid()
    )
  );

create policy "workspaces_insert_owner"
  on public.workspaces for insert
  with check (owner_user_id = auth.uid());

create policy "workspaces_update_owner"
  on public.workspaces for update
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "workspace_members_select_own"
  on public.workspace_members for select
  using (user_id = auth.uid());

create policy "workspace_members_insert_workspace_owner"
  on public.workspace_members for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.workspaces w
      where w.id = workspace_members.workspace_id
        and w.owner_user_id = auth.uid()
    )
  );

-- Spätere, in diesem PR NICHT im UI genutzte Tabellen:
-- - public.contacts: Fan-/Kontaktstammdaten pro Workspace.
-- - public.messages: manuell verwaltete Nachrichtenhistorie pro Kontakt.
-- - public.memories: zusammengefasste Kontextnotizen/Fan-Gedächtnis pro Kontakt.
-- - public.followups: manuelle Follow-up-Erinnerungen und Status.
-- - public.ai_generations: protokollierte KI-Entwürfe ohne automatischen Versand.
-- Diese Tabellen werden absichtlich erst ergänzt, wenn die jeweiligen Produktflows gebaut werden.
