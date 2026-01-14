/*
  # Crear tabla de grupos de productos y reglas de clasificación

  1. Nueva Tabla: product_groups
    - `id` (uuid, clave primaria)
    - `group_name` (text) - Nombre del grupo (ej: "Aceites", "Margarinas", "Mantecas")
    - `keywords` (text[]) - Array de palabras clave para identificar productos
    - `priority` (integer) - Prioridad de la regla (mayor número = mayor prioridad)
    - `color` (text) - Color para visualización
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  2. Seguridad
    - Habilitar RLS en la tabla
    - Políticas para usuarios autenticados

  3. Datos iniciales
    - Grupos comunes de productos SODI
*/

-- Crear tabla de grupos de productos
CREATE TABLE IF NOT EXISTS product_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name text NOT NULL UNIQUE,
  keywords text[] NOT NULL DEFAULT '{}',
  priority integer NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '#6366f1',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE product_groups ENABLE ROW LEVEL SECURITY;

-- Políticas para lectura (todos los usuarios autenticados pueden leer)
CREATE POLICY "Usuarios autenticados pueden ver grupos"
  ON product_groups
  FOR SELECT
  TO authenticated
  USING (true);

-- Políticas para inserción
CREATE POLICY "Usuarios autenticados pueden crear grupos"
  ON product_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Políticas para actualización
CREATE POLICY "Usuarios autenticados pueden actualizar grupos"
  ON product_groups
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para eliminación
CREATE POLICY "Usuarios autenticados pueden eliminar grupos"
  ON product_groups
  FOR DELETE
  TO authenticated
  USING (true);

-- Insertar grupos iniciales con palabras clave comunes
INSERT INTO product_groups (group_name, keywords, priority, color) VALUES
  ('Aceites', ARRAY['aceite', 'oil', 'aceite de', 'cooking oil'], 10, '#f59e0b'),
  ('Margarinas', ARRAY['margarina', 'margarine', 'mantequilla vegetal'], 10, '#eab308'),
  ('Mantecas', ARRAY['manteca', 'shortening', 'grasa vegetal'], 10, '#84cc16'),
  ('Cremas', ARRAY['crema', 'cream', 'nata'], 10, '#06b6d4'),
  ('Leches', ARRAY['leche', 'milk', 'lactea'], 10, '#3b82f6'),
  ('Postres', ARRAY['postre', 'dessert', 'dulce', 'gelatina', 'flan'], 8, '#8b5cf6'),
  ('Condimentos', ARRAY['sal', 'pimienta', 'condimento', 'seasoning', 'sazonador'], 8, '#ec4899'),
  ('Harinas', ARRAY['harina', 'flour'], 9, '#f97316'),
  ('Bebidas', ARRAY['bebida', 'refresco', 'jugo', 'drink', 'juice'], 7, '#14b8a6'),
  ('Snacks', ARRAY['snack', 'botana', 'papas', 'chips'], 7, '#ef4444'),
  ('Pastas', ARRAY['pasta', 'espagueti', 'fideo', 'macarron'], 9, '#f43f5e'),
  ('Salsas', ARRAY['salsa', 'sauce', 'catsup', 'mayonesa'], 8, '#dc2626'),
  ('Otros', ARRAY[]::text[], 1, '#6b7280')
ON CONFLICT (group_name) DO NOTHING;

-- Crear índice para búsquedas más rápidas
CREATE INDEX IF NOT EXISTS idx_product_groups_keywords ON product_groups USING gin(keywords);
CREATE INDEX IF NOT EXISTS idx_product_groups_priority ON product_groups(priority DESC);