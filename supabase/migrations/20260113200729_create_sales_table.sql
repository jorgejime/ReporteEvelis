/*
  # Crear tabla de registros de ventas

  1. Nueva Tabla
    - `sales_records`
      - `id` (bigint, primary key, auto-increment) - Identificador único del registro
      - `ean` (text) - Código EAN del producto
      - `store` (text) - Nombre de la tienda
      - `date` (text) - Fecha de venta en formato string
      - `product` (text) - Nombre del producto
      - `qty` (integer) - Cantidad vendida
      - `price` (numeric) - Precio unitario
      - `total` (numeric) - Total de la venta
      - `created_at` (timestamptz) - Timestamp de creación del registro
      
  2. Índices
    - Índice en `date` para optimizar consultas por fecha
    - Índice en `store` para optimizar consultas por tienda
    - Índice en `product` para optimizar búsquedas de productos
    
  3. Seguridad
    - Habilitar RLS en la tabla `sales_records`
    - Crear política para permitir lectura pública de todos los registros
    - Crear política para permitir inserción pública de registros
    - Crear política para permitir eliminación pública de todos los registros
    
  Notas importantes:
    - Esta tabla almacenará todos los registros de ventas cargados desde archivos Excel/CSV
    - Los índices mejoran significativamente el rendimiento en consultas por fecha y tienda
    - Las políticas públicas permiten el uso sin autenticación (single-user app)
*/

-- Crear tabla de registros de ventas
CREATE TABLE IF NOT EXISTS sales_records (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ean text NOT NULL DEFAULT '',
  store text NOT NULL DEFAULT '',
  date text NOT NULL DEFAULT '',
  product text NOT NULL DEFAULT '',
  qty integer NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_sales_records_date ON sales_records(date);
CREATE INDEX IF NOT EXISTS idx_sales_records_store ON sales_records(store);
CREATE INDEX IF NOT EXISTS idx_sales_records_product ON sales_records(product);

-- Habilitar Row Level Security
ALTER TABLE sales_records ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura de todos los registros (público)
CREATE POLICY "Permitir lectura pública de registros"
  ON sales_records
  FOR SELECT
  USING (true);

-- Política para permitir inserción de registros (público)
CREATE POLICY "Permitir inserción pública de registros"
  ON sales_records
  FOR INSERT
  WITH CHECK (true);

-- Política para permitir eliminación de registros (público)
CREATE POLICY "Permitir eliminación pública de registros"
  ON sales_records
  FOR DELETE
  USING (true);