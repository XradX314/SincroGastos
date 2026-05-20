-- Tabla de categorías por usuario (editables desde la UI)
CREATE TABLE IF NOT EXISTS categories (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        REFERENCES auth.users NOT NULL,
  nombre        text        NOT NULL,
  subcategorias text[]      NOT NULL DEFAULT '{}',
  color         text        NOT NULL DEFAULT '#6B7280',
  orden         integer     NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_own" ON categories
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_categories_user ON categories (user_id, orden);
