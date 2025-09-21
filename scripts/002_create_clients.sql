-- Create clients table
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  address text,
  company text,
  tax_id text,
  notes text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.clients enable row level security;

-- RLS policies for clients
create policy "clients_select_authenticated"
  on public.clients for select
  using (auth.uid() is not null);

create policy "clients_insert_authenticated"
  on public.clients for insert
  with check (auth.uid() is not null and created_by = auth.uid());

create policy "clients_update_authenticated"
  on public.clients for update
  using (auth.uid() is not null);

create policy "clients_delete_admin"
  on public.clients for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

-- Create trigger for updated_at
create trigger clients_updated_at
  before update on public.clients
  for each row
  execute function public.handle_updated_at();

-- Create indexes
create index if not exists clients_name_idx on public.clients(name);
create index if not exists clients_email_idx on public.clients(email);
create index if not exists clients_created_by_idx on public.clients(created_by);
