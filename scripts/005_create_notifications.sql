-- Create notifications table for real-time updates
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text not null check (type in ('info', 'success', 'warning', 'error')),
  entity_type text check (entity_type in ('invoice', 'payment', 'client')),
  entity_id uuid,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.notifications enable row level security;

-- RLS policies for notifications
create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "notifications_insert_authenticated"
  on public.notifications for insert
  with check (auth.uid() is not null);

create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "notifications_delete_own"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- Create indexes
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_read_idx on public.notifications(read);
create index if not exists notifications_created_at_idx on public.notifications(created_at desc);

-- Function to create notification
create or replace function public.create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text default 'info',
  p_entity_type text default null,
  p_entity_id uuid default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  notification_id uuid;
begin
  insert into public.notifications (user_id, title, message, type, entity_type, entity_id)
  values (p_user_id, p_title, p_message, p_type, p_entity_type, p_entity_id)
  returning id into notification_id;
  
  return notification_id;
end;
$$;
