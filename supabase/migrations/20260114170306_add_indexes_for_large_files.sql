/*
  # Agregar índices para optimizar consultas en archivos grandes

  1. Nuevos Índices
    - Índice en columna `year` para filtrado rápido por año
    - Índice en columna `store` para búsquedas por tienda
    - Índice en columna `grupo` para filtrado por grupo
    - Índice compuesto en `year, store` para consultas combinadas
    
  2. Beneficios
    - Mejora significativa en velocidad de consultas con 20k+ registros
    - Optimiza filtros en Dashboard y Reports
    - Reduce tiempos de carga en vistas filtradas
*/

CREATE INDEX IF NOT EXISTS idx_sales_records_year ON sales_records(year);
CREATE INDEX IF NOT EXISTS idx_sales_records_store ON sales_records(store);
CREATE INDEX IF NOT EXISTS idx_sales_records_grupo ON sales_records(grupo);
CREATE INDEX IF NOT EXISTS idx_sales_records_year_store ON sales_records(year, store);
CREATE INDEX IF NOT EXISTS idx_sales_records_date ON sales_records(date);