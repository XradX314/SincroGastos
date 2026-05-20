-- ============================================================
-- GastApp — Migración inicial
-- ============================================================

-- Extensión para UUID
create extension if not exists "pgcrypto";

-- ============================================================
-- Tabla principal de gastos
-- ============================================================
create table if not exists expenses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  categoria     text not null check (categoria in ('Casa','Hijo 1','Hijo 2','Hijo 3','Yo','Otros')),
  subcategoria  text not null,
  fecha         date not null,
  detalle       text,
  importe       numeric(12,2) not null,
  origen        text not null default 'web' check (origen in ('web','excel')),
  hash_unico    text not null unique,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- Índices de rendimiento
-- ============================================================
create index if not exists idx_expenses_user_fecha
  on expenses (user_id, fecha desc);

create index if not exists idx_expenses_user_categoria
  on expenses (user_id, categoria);

create index if not exists idx_expenses_hash
  on expenses (hash_unico);

-- ============================================================
-- Trigger para updated_at automático
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_expenses_updated_at
  before update on expenses
  for each row execute procedure set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table expenses enable row level security;

-- Política SELECT: solo el propio usuario
create policy "expenses_select_own"
  on expenses for select
  using (auth.uid() = user_id);

-- Política INSERT: solo el propio usuario
create policy "expenses_insert_own"
  on expenses for insert
  with check (auth.uid() = user_id);

-- Política UPDATE: solo el propio usuario
create policy "expenses_update_own"
  on expenses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Política DELETE: solo el propio usuario
create policy "expenses_delete_own"
  on expenses for delete
  using (auth.uid() = user_id);
