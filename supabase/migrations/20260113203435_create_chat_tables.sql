/*
  # Crear sistema de chat conversacional con IA

  1. Nuevas Tablas
    - `chat_conversations`
      - `id` (uuid, primary key) - Identificador único de conversación
      - `title` (text) - Título de la conversación (primeras palabras de la pregunta)
      - `saved` (boolean) - Indica si la conversación fue guardada manualmente
      - `created_at` (timestamptz) - Fecha de creación de la conversación
      - `updated_at` (timestamptz) - Última actualización
    
    - `chat_messages`
      - `id` (uuid, primary key) - Identificador único del mensaje
      - `conversation_id` (uuid, foreign key) - Referencia a la conversación
      - `role` (text) - Rol del mensaje ('user' o 'assistant')
      - `content` (text) - Contenido del mensaje en texto/HTML
      - `chart_data` (jsonb) - Datos estructurados para gráficos (opcional)
      - `metadata` (jsonb) - Metadata adicional (tipo de gráfico, configuración, etc.)
      - `created_at` (timestamptz) - Fecha de creación del mensaje

  2. Seguridad
    - Habilitar RLS en ambas tablas
    - Políticas permisivas para permitir acceso completo (sin autenticación por ahora)
    - En futuro se pueden agregar políticas por usuario autenticado

  3. Índices
    - Índice en conversation_id para optimizar consultas de mensajes
    - Índice en created_at para ordenamiento eficiente
*/

-- Crear tabla de conversaciones
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Nueva conversación',
  saved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear tabla de mensajes
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  chart_data jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id 
  ON chat_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at 
  ON chat_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_created_at 
  ON chat_conversations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_saved 
  ON chat_conversations(saved, created_at DESC);

-- Habilitar RLS
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo (permitir acceso completo)
CREATE POLICY "Permitir lectura de conversaciones"
  ON chat_conversations FOR SELECT
  USING (true);

CREATE POLICY "Permitir creación de conversaciones"
  ON chat_conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir actualización de conversaciones"
  ON chat_conversations FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir eliminación de conversaciones"
  ON chat_conversations FOR DELETE
  USING (true);

CREATE POLICY "Permitir lectura de mensajes"
  ON chat_messages FOR SELECT
  USING (true);

CREATE POLICY "Permitir creación de mensajes"
  ON chat_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir actualización de mensajes"
  ON chat_messages FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir eliminación de mensajes"
  ON chat_messages FOR DELETE
  USING (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en conversaciones
DROP TRIGGER IF EXISTS update_chat_conversations_updated_at ON chat_conversations;
CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();