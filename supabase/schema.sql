-- ============================================================
-- NutriPlanner — Schéma Supabase
-- À coller dans : Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Profiles (1-1 avec auth.users)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  age int,
  sex text check (sex in ('male','female','other')),
  weight_kg numeric,
  height_cm numeric,
  activity text,
  goal text,
  calories_target int,
  diet_prefs jsonb default '{}'::jsonb,
  pantry_items text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Meal plans
create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  notes text,
  created_at timestamptz default now()
);

create index if not exists meal_plans_user_idx on public.meal_plans(user_id, start_date desc);

-- 3. Planned meals
create table if not exists public.planned_meals (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.meal_plans(id) on delete cascade,
  date date not null,
  moment text not null check (moment in ('breakfast','lunch','dinner')),
  recipe_id int not null,
  title text not null,
  image text,
  calories int,
  protein int,
  carbs int,
  fat int,
  ready_in_minutes int
);

create index if not exists planned_meals_plan_idx on public.planned_meals(plan_id, date);

-- 4. Shopping lists
create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.meal_plans(id) on delete cascade,
  created_at timestamptz default now()
);

-- 5. Shopping items
create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shopping_lists(id) on delete cascade,
  name text not null,
  amount numeric default 0,
  unit text,
  aisle text default 'Divers',
  checked boolean default false,
  recipe_ids int[] default '{}',
  prices jsonb default '{}'::jsonb
);

create index if not exists shopping_items_list_idx on public.shopping_items(list_id);

-- 6. Favorites
create table if not exists public.favorites (
  user_id uuid references auth.users(id) on delete cascade,
  recipe_id int not null,
  title text,
  image text,
  added_at timestamptz default now(),
  primary key (user_id, recipe_id)
);

-- 7. Price cache (partagé, pas per-user)
create table if not exists public.price_cache (
  id uuid primary key default gen_random_uuid(),
  ingredient_name text not null,
  retailer text not null,
  price numeric,
  currency text default 'EUR',
  source text,
  fetched_at timestamptz default now()
);

create unique index if not exists price_cache_unique on public.price_cache(ingredient_name, retailer);
create index if not exists price_cache_age_idx on public.price_cache(fetched_at);

-- 8. Nutrition logs (repas réellement consommés)
create table if not exists public.nutrition_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  moment text,
  recipe_id int,
  title text,
  calories int,
  protein int,
  carbs int,
  fat int,
  logged_at timestamptz default now()
);

create index if not exists nutrition_logs_user_date on public.nutrition_logs(user_id, date desc);

-- 9. Garde-manger (pantry)
create table if not exists public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text,
  emoji text,
  added_at timestamptz default now(),
  unique (user_id, name)
);

create index if not exists pantry_user_idx on public.pantry_items(user_id);

-- 10. Suivi eau
create table if not exists public.water_intake (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  glasses int not null default 0,
  updated_at timestamptz default now(),
  primary key (user_id, date)
);

-- 11. Suivi poids
create table if not exists public.weight_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  kg numeric not null,
  primary key (user_id, date)
);

-- 12. Plans archivés (historique)
create table if not exists public.archived_plans (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date,
  end_date date,
  meals_count int,
  notes text,
  average_rating numeric,
  archived_at timestamptz default now(),
  serialized jsonb not null
);

create index if not exists archived_plans_user_idx on public.archived_plans(user_id, archived_at desc);

-- 13. Custom items (catalogue ajouts)
create table if not exists public.custom_items (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text,
  emoji text,
  quantity numeric default 1,
  unit text,
  checked boolean default false,
  added_at timestamptz default now()
);

create index if not exists custom_items_user_idx on public.custom_items(user_id);

-- 14. Famille (autres membres sous un compte)
create table if not exists public.family_members (
  id uuid primary key,
  account_user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  age int,
  sex text,
  weight_kg numeric,
  height_cm numeric,
  activity text,
  goal text,
  calories_target int,
  diet_prefs jsonb default '{}'::jsonb,
  role text,
  avatar_emoji text,
  color text,
  created_at timestamptz default now(),
  onboarded_at timestamptz
);

create index if not exists family_account_idx on public.family_members(account_user_id);

-- 15. Historique repas (notes/ratings pour plan adaptatif)
create table if not exists public.meal_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id int,
  title text,
  rating int,
  consumed boolean default false,
  skipped boolean default false,
  swapped boolean default false,
  date date,
  recorded_at timestamptz default now()
);

create index if not exists meal_history_user_idx on public.meal_history(user_id, recorded_at desc);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.meal_plans enable row level security;
alter table public.planned_meals enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.shopping_items enable row level security;
alter table public.favorites enable row level security;
alter table public.nutrition_logs enable row level security;
alter table public.price_cache enable row level security;
alter table public.pantry_items enable row level security;
alter table public.water_intake enable row level security;
alter table public.weight_logs enable row level security;
alter table public.archived_plans enable row level security;
alter table public.custom_items enable row level security;
alter table public.family_members enable row level security;
alter table public.meal_history enable row level security;

-- Profiles : chacun voit/édite le sien
create policy "own profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Meal plans
create policy "own plans" on public.meal_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own planned meals" on public.planned_meals
  for all using (
    exists (select 1 from public.meal_plans p where p.id = plan_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.meal_plans p where p.id = plan_id and p.user_id = auth.uid())
  );

-- Shopping
create policy "own shopping lists" on public.shopping_lists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own shopping items" on public.shopping_items
  for all using (
    exists (select 1 from public.shopping_lists l where l.id = list_id and l.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.shopping_lists l where l.id = list_id and l.user_id = auth.uid())
  );

create policy "own favorites" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own nutrition logs" on public.nutrition_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Price cache : lecture publique, écriture serveur seulement
create policy "read prices" on public.price_cache for select using (true);

-- Pantry / water / weight / archived / custom / family / meal_history
create policy "own pantry" on public.pantry_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own water" on public.water_intake
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own weight" on public.weight_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own archived" on public.archived_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own custom items" on public.custom_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own family" on public.family_members
  for all using (auth.uid() = account_user_id) with check (auth.uid() = account_user_id);

create policy "own meal history" on public.meal_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
