create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  password_hash text not null,
  avatar text not null default 'preset:cat',
  palette text not null default 'walnut',
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  start_date date not null default current_date,
  type text not null default 'development' check (type in ('development','test','production')),
  status text not null default 'running' check (status in ('running','paused','stopped')),
  level text not null default 'mini' check (level in ('mini','mid','max')),
  deadline date,
  details jsonb not null default '{"Git link":"","DB link":""}',
  notes text not null default '',
  visits integer not null default 0,
  last_worked timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  mime text not null,
  size integer not null,
  data bytea not null,
  created_at timestamptz not null default now()
);

create table if not exists activity (
  user_id uuid not null references users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  day date not null,
  seconds integer not null default 0,
  primary key (project_id, day)
);

create index if not exists projects_user_idx on projects(user_id);
create index if not exists tasks_project_idx on tasks(project_id);
create index if not exists activity_user_day_idx on activity(user_id, day);
