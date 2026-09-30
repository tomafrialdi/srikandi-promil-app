-- Data for the plan catalogue (separate file: enum value added in the previous migration).

insert into public.plan_catalog (plan, label, price_idr, period_months, tagline, sort_order) values
  ('free', 'Free', 0, 1, 'Core tracking only', 1),
  ('plus_monthly', 'Plus Monthly', 49000, 1, 'All Plus features', 2),
  ('plus_yearly', 'Plus Yearly', 399000, 12, 'All Plus features · best value', 3),
  ('clinic_sponsored', 'Clinic-sponsored', 0, 12, 'Paid by partner clinic · needs clinic code', 4),
  ('trial', 'Trial', 0, 1, '7-day Plus trial', 5);

-- Monthly-equivalent prices now follow the catalogue.
update public.plan_prices set monthly_idr = 49000 where plan = 'plus_monthly';
update public.plan_prices set monthly_idr = 33250 where plan = 'plus_yearly';
insert into public.plan_prices (plan, monthly_idr) values ('clinic_sponsored', 0) on conflict do nothing;
