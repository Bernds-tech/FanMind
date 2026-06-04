create table if not exists agencies (
  id text primary key,
  name text not null,
  language_default text not null default 'de',
  plan text not null default 'FanMind Pilot',
  created_at timestamptz not null default now()
);

create table if not exists users (
  id text primary key,
  agency_id text not null references agencies(id) on delete cascade,
  email text not null unique,
  name text not null,
  role text not null default 'agency_user',
  created_at timestamptz not null default now()
);

create table if not exists creators (
  id text primary key,
  agency_id text not null references agencies(id) on delete cascade,
  display_name text not null,
  platform text not null default 'manual',
  language text not null default 'de',
  tone text,
  persona_notes text,
  boundaries text,
  created_at timestamptz not null default now()
);

create table if not exists fans (
  id text primary key,
  agency_id text not null references agencies(id) on delete cascade,
  creator_id text not null references creators(id) on delete cascade,
  handle text not null,
  display_name text not null,
  status text not null default 'new',
  language text not null default 'de',
  summary text,
  tags text[] not null default '{}',
  value_level text not null default 'low',
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id text primary key,
  agency_id text not null references agencies(id) on delete cascade,
  creator_id text not null references creators(id) on delete cascade,
  fan_id text not null references fans(id) on delete cascade,
  direction text not null,
  content text not null,
  source text not null default 'manual',
  created_by text references users(id),
  created_at timestamptz not null default now()
);

create table if not exists memories (
  id text primary key,
  agency_id text not null references agencies(id) on delete cascade,
  creator_id text not null references creators(id) on delete cascade,
  fan_id text not null references fans(id) on delete cascade,
  memory_type text not null,
  content text not null,
  importance text not null default 'medium',
  created_by text references users(id),
  created_at timestamptz not null default now()
);

create table if not exists followups (
  id text primary key,
  agency_id text not null references agencies(id) on delete cascade,
  creator_id text not null references creators(id) on delete cascade,
  fan_id text not null references fans(id) on delete cascade,
  due_date date,
  due_label text,
  reason text not null,
  priority text not null default 'medium',
  status text not null default 'open',
  created_by text references users(id),
  created_at timestamptz not null default now()
);

create table if not exists ai_generations (
  id text primary key,
  agency_id text not null references agencies(id) on delete cascade,
  creator_id text not null references creators(id) on delete cascade,
  fan_id text not null references fans(id) on delete cascade,
  prompt_type text not null,
  input_snapshot jsonb not null,
  output_text jsonb not null,
  model text not null,
  token_estimate integer,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id text primary key,
  agency_id text references agencies(id) on delete cascade,
  user_id text references users(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_creators_agency_id on creators(agency_id);
create index if not exists idx_fans_agency_creator on fans(agency_id, creator_id);
create index if not exists idx_fans_status on fans(status);
create index if not exists idx_messages_fan_id on messages(fan_id);
create index if not exists idx_memories_fan_id on memories(fan_id);
create index if not exists idx_followups_status_due on followups(status, due_date);
create index if not exists idx_ai_generations_fan_id on ai_generations(fan_id);
