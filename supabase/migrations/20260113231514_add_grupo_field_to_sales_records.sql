/*
  # Agregar campo grupo y adaptar tabla para análisis de cantidades

  1. Cambios en Tabla `sales_records`
    - Agregar columna `grupo` (text) - Categoría/etiqueta del producto (CANTO, PREMIUM, DELUXE)
    - La columna `product` pasa a ser `descripcion` (mantener nombre actual por compatibilidad)
    - Columnas `price` y `total` se mantienen para compatibilidad con datos anteriores pero serán opcionales
    - Columna `qty` será el campo principal de análisis (cantidad vendida)
    
  2. Notas Importantes
    - Los datos anteriores se mantienen intactos
    - Los nuevos datos de 2025 incluirán el campo grupo
    - El enfoque del análisis cambia de valores monetarios a cantidades vendidas
    - Datos anteriores sin grupo tendrán valor NULL en ese campo
*/

-- Agregar columna grupo a la tabla sales_records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_records' AND column_name = 'grupo'
  ) THEN
    ALTER TABLE sales_records ADD COLUMN grupo text;
  END IF;
END $$;

-- Crear índice para búsquedas por grupo
CREATE INDEX IF NOT EXISTS idx_sales_records_grupo 
  ON sales_records(grupo);

-- Hacer price y total opcionales (permitir NULL) para nuevos datos
DO $$
BEGIN
  ALTER TABLE sales_records ALTER COLUMN price DROP NOT NULL;
  ALTER TABLE sales_records ALTER COLUMN total DROP NOT NULL;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Agregar comentarios descriptivos
COMMENT ON COLUMN sales_records.grupo IS 'Categoría o grupo del producto (CANTO, PREMIUM, DELUXE, etc.)';
COMMENT ON COLUMN sales_records.qty IS 'Cantidad vendida - campo principal de análisis';
COMMENT ON COLUMN sales_records.product IS 'Descripción del producto';
