/*
  # Agregar campo year a sales_records

  1. Modificaciones
    - Agregar columna `year` (integer) a la tabla `sales_records`
    - Extraer automáticamente el año desde el campo `date` para registros existentes
    - Crear índice en el campo `year` para optimizar consultas de filtrado por año
    
  2. Seguridad
    - Mantener las políticas RLS existentes
    
  Notas importantes:
    - El campo year facilita el filtrado y análisis por períodos anuales
    - Se extrae automáticamente el año desde el campo date para compatibilidad con datos existentes
    - El índice mejora significativamente el rendimiento en consultas filtradas por año
*/

-- Agregar columna year a sales_records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_records' AND column_name = 'year'
  ) THEN
    ALTER TABLE sales_records ADD COLUMN year integer;
  END IF;
END $$;

-- Actualizar registros existentes para extraer el año del campo date
-- El formato de date puede ser DD/MM/YYYY o YYYY-MM-DD
UPDATE sales_records
SET year = CASE
  -- Si el formato es DD/MM/YYYY (día/mes/año)
  WHEN date ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN 
    CAST(SUBSTRING(date FROM '\d{4}$') AS INTEGER)
  -- Si el formato es YYYY-MM-DD (año-mes-día)
  WHEN date ~ '^\d{4}-\d{1,2}-\d{1,2}$' THEN 
    CAST(SUBSTRING(date FROM '^\d{4}') AS INTEGER)
  -- Si el formato es YYYY/MM/DD
  WHEN date ~ '^\d{4}/\d{1,2}/\d{1,2}$' THEN 
    CAST(SUBSTRING(date FROM '^\d{4}') AS INTEGER)
  ELSE NULL
END
WHERE year IS NULL;

-- Crear índice en el campo year para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_sales_records_year ON sales_records(year);
