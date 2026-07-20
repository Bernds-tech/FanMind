alter table public.workspaces
  add column if not exists cancellation_requested_at timestamptz,
  add column if not exists cancellation_effective_at timestamptz,
  add column if not exists cancellation_revoked_at timestamptz,
  add column if not exists commitment_started_at timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists archive_mode boolean not null default false,
  add column if not exists channel_sync_enabled boolean not null default true,
  add column if not exists ai_features_enabled boolean not null default true;

create table if not exists public.subscription_audit_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_user_id uuid,
  action text not null check (action in ('cancel_requested','cancel_revoked','archive_activated','reactivated')),
  effective_at timestamptz,
  stripe_subscription_id text,
  created_at timestamptz not null default now()
);

create index if not exists subscription_audit_log_workspace_created_idx
  on public.subscription_audit_log(workspace_id, created_at desc);

alter table public.subscription_audit_log enable row level security;
