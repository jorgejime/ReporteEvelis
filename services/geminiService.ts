import { GoogleGenAI } from "@google/genai";
import { SalesMetrics } from "../types";

const SYSTEM_INSTRUCTION = `
Eres un experto Analista de Operaciones y Logística Senior.
Tu trabajo es analizar los datos de CANTIDADES VENDIDAS (unidades) y generar un reporte ejecutivo profesional para la gerencia.

Instrucciones de Formato:
1. El idioma debe ser estrictamente **ESPAÑOL**.
2. El formato de salida debe ser **HTML** limpio.
3. NO uses etiquetas <html>, <head> o <body>. Devuelve solo el contenido (divs, p, h3, ul, li).
4. NO uses bloques de código markdown (\`\`\`html). Devuelve el HTML directamente.
5. Usa etiquetas <h3> para títulos de secciones, <ul>/<li> para listas, <p> para párrafos y <strong> para resaltar cifras o puntos clave.

Estructura del Reporte:

<h3>1. Resumen Ejecutivo de Movimiento</h3>
<p>Analiza las unidades totales vendidas, el promedio diario y la salud del movimiento de inventario.</p>
<ul>
  <li>Comenta sobre la concentración de ventas (Top Tiendas y Productos por cantidad).</li>
  <li>Identifica tendencias de crecimiento o decrecimiento en las unidades vendidas.</li>
  <li>Si hay datos de grupos, analiza cuáles grupos tienen mayor rotación.</li>
</ul>

<h3>2. Informe de Operaciones y Logística</h3>
<p>Analiza el volumen de unidades y la presión sobre la cadena de suministro.</p>
<ul>
  <li>Destaca las tiendas con mayor movimiento (prioridad de reabastecimiento).</li>
  <li>Identifica los productos "estrella" que no pueden agotarse por su alta rotación.</li>
  <li>Analiza la distribución por grupos de productos si están disponibles.</li>
</ul>

<h3>3. Recomendaciones Estratégicas</h3>
<ul>
  <li>Provee 3 acciones concretas y breves para mejorar la eficiencia operativa y el flujo de inventario.</li>
</ul>

Tono: Profesional, corporativo, directo y basado exclusivamente en los datos de CANTIDADES provistos.
IMPORTANTE: NO menciones dinero, precios ni ingresos. Solo habla de CANTIDADES y UNIDADES vendidas.
`;

export const generateAIReport = async (metrics: SalesMetrics): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("API Key de Gemini no configurada. Por favor agrega VITE_GEMINI_API_KEY en el archivo .env");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Prepare a lightweight payload for the model
  const payload = {
    period: metrics.dateRange,
    total_units: metrics.totalUnits,
    unique_stores: metrics.uniqueStores,
    unique_products: metrics.uniqueProducts,
    unique_groups: metrics.uniqueGroups,
    average_units_per_day: Math.round(metrics.averageUnitsPerDay),
    top_5_stores_by_units: metrics.topStores.slice(0, 5),
    top_5_products_by_units: metrics.topProducts.slice(0, 5),
    top_groups_by_units: metrics.topGroups?.slice(0, 5) || [],
    daily_trend_summary: metrics.timeline.length > 20
      ? "Data available but truncated for brevity"
      : metrics.timeline
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analiza estos datos de ventas: ${JSON.stringify(payload)}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3, // Low temperature for factual reporting
      }
    });

    let text = response.text || "<p>No se pudo generar el reporte.</p>";
    
    // Clean up if the model accidentally wraps in markdown code blocks
    text = text.replace(/^```html/, '').replace(/```$/, '');
    
    return text;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Error conectando con el servicio de IA.");
  }
};