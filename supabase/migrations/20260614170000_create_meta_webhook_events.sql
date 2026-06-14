create table if not exists public.meta_webhook_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  social_connection_id uuid references public.social_connections(id) on delete set null,
  platform text not null default 'facebook',
  source text not null default 'meta_webhook',
  event_type text not null default 'unknown',
  page_id text,
  sender_id text,
  message_text text,
  raw_payload jsonb not null default '{}'::jsonb,
  status text not null default 'received',
  error_reason text,
  message_id uuid references public.conversation_messages(id) on delete set null,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists meta_webhook_events_workspace_received_idx
  on public.meta_webhook_events (workspace_id, received_at desc);

create index if not exists meta_webhook_events_page_received_idx
  on public.meta_webhook_events (page_id, received_at desc);

alter table public.meta_webhook_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'meta_webhook_events'
      and policyname = 'meta_webhook_events_select_workspace_member'
  ) then
    create policy meta_webhook_events_select_workspace_member
      on public.meta_webhook_events for select
      using (
        workspace_id is not null
        and exists (
          select 1 from public.workspace_members wm
          where wm.workspace_id = meta_webhook_events.workspace_id
            and wm.user_id = auth.uid()
        )
      );
  end if;
end;
$$;
