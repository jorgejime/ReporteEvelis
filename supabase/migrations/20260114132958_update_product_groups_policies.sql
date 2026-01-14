/*
  # Actualizar políticas RLS de product_groups para acceso público

  1. Cambios
    - Eliminar políticas restrictivas existentes
    - Crear nuevas políticas que permitan acceso público de lectura
    - Mantener restricciones de escritura
    
  2. Seguridad
    - Lectura pública para todos los usuarios
    - Escritura solo para usuarios autenticados
*/

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver grupos" ON product_groups;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear grupos" ON product_groups;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar grupos" ON product_groups;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar grupos" ON product_groups;

-- Crear política de lectura pública
CREATE POLICY "Cualquiera puede ver grupos"
  ON product_groups
  FOR SELECT
  USING (true);

-- Políticas de escritura para usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden crear grupos"
  ON product_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar grupos"
  ON product_groups
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden eliminar grupos"
  ON product_groups
  FOR DELETE
  TO authenticated
  USING (true);