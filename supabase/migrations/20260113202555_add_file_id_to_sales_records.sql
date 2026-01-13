/*
  # Agregar referencia de archivo a registros de ventas

  1. Modificaciones
    - Agregar columna `file_id` a la tabla `sales_records`
    - Crear foreign key constraint hacia `uploaded_files`
    - Crear índice en `file_id` para consultas rápidas

  2. Notas
    - Los registros existentes tendrán `file_id` NULL (datos históricos sin tracking)
    - Los nuevos registros siempre tendrán un `file_id` asociado
*/

-- Agregar columna file_id a sales_records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_records' AND column_name = 'file_id'
  ) THEN
    ALTER TABLE sales_records ADD COLUMN file_id uuid REFERENCES uploaded_files(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Crear índice para mejorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_sales_records_file_id ON sales_records(file_id);