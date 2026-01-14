/*
  # Agregar columna para datos adicionales

  1. Cambios
    - Agregar columna `extra_data` (JSONB) a la tabla `sales_records`
    - Esta columna almacenará cualquier dato adicional de columnas no mapeadas
    - Permite soportar archivos con 100+ columnas de forma flexible
    
  2. Notas
    - La columna es nullable para no afectar datos existentes
    - Usa JSONB para búsquedas y consultas eficientes
    - Default es un objeto JSON vacío
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_records' AND column_name = 'extra_data'
  ) THEN
    ALTER TABLE sales_records ADD COLUMN extra_data JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;