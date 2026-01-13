/*
  # Crear tabla de reportes IA

  1. Nueva Tabla
    - `ai_reports`
      - `id` (uuid, primary key) - Identificador único del reporte
      - `title` (text) - Título descriptivo del reporte
      - `content` (text) - Contenido HTML del reporte generado por IA
      - `metrics_summary` (jsonb) - Resumen de las métricas usadas para generar el reporte
      - `created_at` (timestamptz) - Fecha y hora de creación del reporte
      - `date_range_start` (date) - Fecha inicio del periodo analizado
      - `date_range_end` (date) - Fecha fin del periodo analizado

  2. Seguridad
    - Habilitar RLS en la tabla `ai_reports`
    - Agregar políticas para permitir acceso público a los reportes (no hay autenticación en la app)

  3. Índices
    - Crear índice en `created_at` para consultas rápidas ordenadas por fecha
*/

-- Crear tabla de reportes IA
CREATE TABLE IF NOT EXISTS ai_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  metrics_summary jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  date_range_start date,
  date_range_end date
);

-- Habilitar RLS
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;

-- Políticas para acceso público (la app no tiene autenticación)
CREATE POLICY "Permitir lectura pública de reportes"
  ON ai_reports
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Permitir inserción pública de reportes"
  ON ai_reports
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Permitir eliminación pública de reportes"
  ON ai_reports
  FOR DELETE
  TO public
  USING (true);

-- Crear índice para consultas ordenadas por fecha
CREATE INDEX IF NOT EXISTS idx_ai_reports_created_at ON ai_reports(created_at DESC);