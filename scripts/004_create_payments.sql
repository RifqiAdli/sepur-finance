-- Create payments table for down payment tracking
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  payment_number text not null unique,
  amount decimal(15,2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('cash', 'bank_transfer', 'credit_card', 'check', 'other')),
  payment_date date not null default current_date,
  reference_number text,
  notes text,
  status text not null default 'completed' check (status in ('pending', 'completed', 'failed', 'cancelled')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.payments enable row level security;

-- RLS policies for payments
create policy "payments_select_authenticated"
  on public.payments for select
  using (auth.uid() is not null);

create policy "payments_insert_authenticated"
  on public.payments for insert
  with check (auth.uid() is not null and created_by = auth.uid());

create policy "payments_update_authenticated"
  on public.payments for update
  using (auth.uid() is not null);

create policy "payments_delete_admin"
  on public.payments for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

-- Create trigger for updated_at
create trigger payments_updated_at
  before update on public.payments
  for each row
  execute function public.handle_updated_at();

-- Create indexes
create index if not exists payments_invoice_id_idx on public.payments(invoice_id);
create index if not exists payments_payment_number_idx on public.payments(payment_number);
create index if not exists payments_payment_date_idx on public.payments(payment_date);
create index if not exists payments_created_by_idx on public.payments(created_by);

-- Function to generate payment number
create or replace function public.generate_payment_number()
returns text
language plpgsql
security definer
as $$
declare
  next_number integer;
  payment_number text;
begin
  -- Get the next number in sequence
  select coalesce(max(cast(substring(payment_number from 'PAY-(\d+)') as integer)), 0) + 1
  into next_number
  from public.payments
  where payment_number ~ '^PAY-\d+$';
  
  -- Format as PAY-XXXX
  payment_number := 'PAY-' || lpad(next_number::text, 4, '0');
  
  return payment_number;
end;
$$;

-- Function to update invoice status based on payments
create or replace function public.update_invoice_payment_status()
returns trigger
language plpgsql
security definer
as $$
declare
  total_paid decimal(15,2);
  invoice_total decimal(15,2);
begin
  -- Get total paid amount for the invoice
  select coalesce(sum(amount), 0)
  into total_paid
  from public.payments
  where invoice_id = coalesce(NEW.invoice_id, OLD.invoice_id)
    and status = 'completed';
  
  -- Get invoice total
  select total_amount
  into invoice_total
  from public.invoices
  where id = coalesce(NEW.invoice_id, OLD.invoice_id);
  
  -- Update invoice status based on payment
  if total_paid >= invoice_total then
    update public.invoices
    set status = 'paid', paid_date = current_date
    where id = coalesce(NEW.invoice_id, OLD.invoice_id);
  elsif total_paid > 0 then
    update public.invoices
    set status = 'sent'
    where id = coalesce(NEW.invoice_id, OLD.invoice_id)
      and status not in ('paid', 'cancelled');
  end if;
  
  return coalesce(NEW, OLD);
end;
$$;

-- Create triggers to update invoice status
create trigger payments_update_invoice_status
  after insert or update or delete on public.payments
  for each row
  execute function public.update_invoice_payment_status();
