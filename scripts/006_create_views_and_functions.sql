-- Create view for invoice summary with payment information
create or replace view public.invoice_summary as
select 
  i.id,
  i.invoice_number,
  i.title,
  i.amount,
  i.tax_amount,
  i.total_amount,
  i.status,
  i.due_date,
  i.issue_date,
  i.paid_date,
  c.name as client_name,
  c.email as client_email,
  c.company as client_company,
  p.full_name as created_by_name,
  coalesce(sum(pay.amount) filter (where pay.status = 'completed'), 0) as paid_amount,
  i.total_amount - coalesce(sum(pay.amount) filter (where pay.status = 'completed'), 0) as remaining_amount,
  case 
    when coalesce(sum(pay.amount) filter (where pay.status = 'completed'), 0) >= i.total_amount then 'Fully Paid'
    when coalesce(sum(pay.amount) filter (where pay.status = 'completed'), 0) > 0 then 'Partially Paid'
    else 'Unpaid'
  end as payment_status,
  i.created_at,
  i.updated_at
from public.invoices i
left join public.clients c on i.client_id = c.id
left join public.profiles p on i.created_by = p.id
left join public.payments pay on i.id = pay.invoice_id
group by i.id, c.id, p.id;

-- Create view for financial dashboard metrics
create or replace view public.financial_metrics as
select 
  -- Total invoices
  count(*) as total_invoices,
  
  -- Revenue metrics
  sum(total_amount) as total_revenue,
  sum(case when status = 'paid' then total_amount else 0 end) as paid_revenue,
  sum(case when status in ('draft', 'sent') then total_amount else 0 end) as pending_revenue,
  sum(case when status = 'overdue' then total_amount else 0 end) as overdue_revenue,
  
  -- Payment metrics
  sum(coalesce((
    select sum(amount) 
    from public.payments pay 
    where pay.invoice_id = invoices.id and pay.status = 'completed'
  ), 0)) as total_payments,
  
  -- Outstanding amount
  sum(total_amount) - sum(coalesce((
    select sum(amount) 
    from public.payments pay 
    where pay.invoice_id = invoices.id and pay.status = 'completed'
  ), 0)) as outstanding_amount,
  
  -- Monthly metrics (current month)
  sum(case when extract(month from created_at) = extract(month from current_date) 
           and extract(year from created_at) = extract(year from current_date)
           then total_amount else 0 end) as monthly_revenue,
  
  -- Status counts
  sum(case when status = 'draft' then 1 else 0 end) as draft_count,
  sum(case when status = 'sent' then 1 else 0 end) as sent_count,
  sum(case when status = 'paid' then 1 else 0 end) as paid_count,
  sum(case when status = 'overdue' then 1 else 0 end) as overdue_count,
  sum(case when status = 'cancelled' then 1 else 0 end) as cancelled_count

from public.invoices;

-- Function to get monthly revenue data for charts
create or replace function public.get_monthly_revenue(months_back integer default 12)
returns table (
  month_year text,
  revenue decimal(15,2),
  payments decimal(15,2),
  invoice_count bigint
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    to_char(date_trunc('month', i.created_at), 'YYYY-MM') as month_year,
    sum(i.total_amount) as revenue,
    sum(coalesce((
      select sum(p.amount) 
      from public.payments p 
      where p.invoice_id = i.id and p.status = 'completed'
    ), 0)) as payments,
    count(i.id) as invoice_count
  from public.invoices i
  where i.created_at >= date_trunc('month', current_date) - interval '1 month' * months_back
  group by date_trunc('month', i.created_at)
  order by month_year;
end;
$$;

-- Function to get top clients by revenue
create or replace function public.get_top_clients(limit_count integer default 10)
returns table (
  client_id uuid,
  client_name text,
  client_company text,
  total_revenue decimal(15,2),
  invoice_count bigint,
  paid_amount decimal(15,2)
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    c.id as client_id,
    c.name as client_name,
    c.company as client_company,
    sum(i.total_amount) as total_revenue,
    count(i.id) as invoice_count,
    sum(coalesce((
      select sum(p.amount) 
      from public.payments p 
      where p.invoice_id = i.id and p.status = 'completed'
    ), 0)) as paid_amount
  from public.clients c
  left join public.invoices i on c.id = i.client_id
  group by c.id, c.name, c.company
  having sum(i.total_amount) > 0
  order by total_revenue desc
  limit limit_count;
end;
$$;
