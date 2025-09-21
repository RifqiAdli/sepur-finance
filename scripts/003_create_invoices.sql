-- Create invoices table
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  client_id uuid references public.clients(id) on delete cascade not null,
  title text not null,
  description text,
  amount decimal(15,2) not null check (amount >= 0),
  tax_rate decimal(5,2) default 0 check (tax_rate >= 0 and tax_rate <= 100),
  tax_amount decimal(15,2) default 0 check (tax_amount >= 0),
  total_amount decimal(15,2) not null check (total_amount >= 0),
  currency text not null default 'IDR',
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date date,
  issue_date date not null default current_date,
  paid_date date,
  notes text,
  terms text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.invoices enable row level security;

-- RLS policies for invoices
create policy "invoices_select_authenticated"
  on public.invoices for select
  using (auth.uid() is not null);

create policy "invoices_insert_authenticated"
  on public.invoices for insert
  with check (auth.uid() is not null and created_by = auth.uid());

create policy "invoices_update_authenticated"
  on public.invoices for update
  using (auth.uid() is not null);

create policy "invoices_delete_admin"
  on public.invoices for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

-- Create trigger for updated_at
create trigger invoices_updated_at
  before update on public.invoices
  for each row
  execute function public.handle_updated_at();

-- Create indexes
create index if not exists invoices_invoice_number_idx on public.invoices(invoice_number);
create index if not exists invoices_client_id_idx on public.invoices(client_id);
create index if not exists invoices_status_idx on public.invoices(status);
create index if not exists invoices_due_date_idx on public.invoices(due_date);
create index if not exists invoices_created_by_idx on public.invoices(created_by);

-- Function to generate invoice number
create or replace function public.generate_invoice_number()
returns text
language plpgsql
security definer
as $$
declare
  next_number integer;
  invoice_number text;
begin
  -- Get the next number in sequence
  select coalesce(max(cast(substring(invoice_number from 'INV-(\d+)') as integer)), 0) + 1
  into next_number
  from public.invoices
  where invoice_number ~ '^INV-\d+$';
  
  -- Format as INV-XXXX
  invoice_number := 'INV-' || lpad(next_number::text, 4, '0');
  
  return invoice_number;
end;
$$;
