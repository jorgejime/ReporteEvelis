/*
  # Agregar función de clasificación automática de productos

  1. Función
    - `classify_product_by_name` - Clasifica un producto basándose en su nombre
    - Busca coincidencias con las palabras clave de los grupos
    - Retorna el grupo con mayor prioridad que coincida
    - Si no encuentra coincidencia, retorna "Otros"

  2. Trigger
    - Actualiza automáticamente el campo grupo al insertar/actualizar registros
*/

-- Función para clasificar productos automáticamente
CREATE OR REPLACE FUNCTION classify_product_by_name(product_name text)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  matched_group text;
  product_lower text;
BEGIN
  -- Convertir el nombre del producto a minúsculas para comparación
  product_lower := lower(product_name);
  
  -- Buscar el grupo con mayor prioridad que tenga una palabra clave que coincida
  SELECT group_name INTO matched_group
  FROM product_groups
  WHERE EXISTS (
    SELECT 1
    FROM unnest(keywords) AS keyword
    WHERE product_lower LIKE '%' || lower(keyword) || '%'
  )
  ORDER BY priority DESC, group_name
  LIMIT 1;
  
  -- Si no se encuentra coincidencia, retornar "Otros"
  RETURN COALESCE(matched_group, 'Otros');
END;
$$;

-- Función trigger para actualizar automáticamente el grupo
CREATE OR REPLACE FUNCTION auto_classify_product_group()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si el grupo no está especificado o está vacío, clasificar automáticamente
  IF NEW.grupo IS NULL OR NEW.grupo = '' THEN
    NEW.grupo := classify_product_by_name(NEW.product);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para clasificación automática en INSERT
DROP TRIGGER IF EXISTS trigger_auto_classify_on_insert ON sales_records;
CREATE TRIGGER trigger_auto_classify_on_insert
  BEFORE INSERT ON sales_records
  FOR EACH ROW
  EXECUTE FUNCTION auto_classify_product_group();

-- Crear trigger para clasificación automática en UPDATE
DROP TRIGGER IF EXISTS trigger_auto_classify_on_update ON sales_records;
CREATE TRIGGER trigger_auto_classify_on_update
  BEFORE UPDATE ON sales_records
  FOR EACH ROW
  WHEN (OLD.product IS DISTINCT FROM NEW.product OR NEW.grupo IS NULL OR NEW.grupo = '')
  EXECUTE FUNCTION auto_classify_product_group();

-- Actualizar registros existentes que no tienen grupo o tienen grupo vacío
UPDATE sales_records
SET grupo = classify_product_by_name(product)
WHERE grupo IS NULL OR grupo = '';