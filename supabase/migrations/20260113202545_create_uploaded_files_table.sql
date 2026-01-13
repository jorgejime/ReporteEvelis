/*
  # Crear tabla de archivos subidos

  1. Nueva Tabla
    - `uploaded_files`
      - `id` (uuid, primary key) - Identificador único del archivo
      - `filename` (text) - Nombre del archivo original
      - `records_count` (integer) - Cantidad de registros importados
      - `file_hash` (text) - Hash único para evitar duplicados
      - `uploaded_at` (timestamptz) - Fecha y hora de carga
      - `file_size` (integer) - Tamaño del archivo en bytes

  2. Seguridad
    - Habilitar RLS en la tabla `uploaded_files`
    - Agregar políticas para permitir acceso público (no hay autenticación en la app)

  3. Índices
    - Crear índice en `uploaded_at` para consultas rápidas ordenadas por fecha
    - Crear índice único en `file_hash` para prevenir duplicados
*/

-- Crear tabla de archivos subidos
CREATE TABLE IF NOT EXISTS uploaded_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  records_count integer DEFAULT 0,
  file_hash text UNIQUE NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  file_size integer DEFAULT 0
);

-- Habilitar RLS
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

-- Políticas para acceso público
CREATE POLICY "Permitir lectura pública de archivos"
  ON uploaded_files
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Permitir inserción pública de archivos"
  ON uploaded_files
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Permitir eliminación pública de archivos"
  ON uploaded_files
  FOR DELETE
  TO public
  USING (true);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploaded_at ON uploaded_files(uploaded_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_uploaded_files_hash ON uploaded_files(file_hash);