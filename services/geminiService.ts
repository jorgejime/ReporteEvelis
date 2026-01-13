import { GoogleGenAI } from "@google/genai";
import { SalesMetrics } from "../types";

const SYSTEM_INSTRUCTION = `
Eres un experto Analista Financiero y de Operaciones Senior.
Tu trabajo es analizar los datos de ventas resumidos (JSON) y generar un reporte ejecutivo profesional para la gerencia.

Instrucciones de Formato:
1. El idioma debe ser estrictamente **ESPAÑOL**.
2. El formato de salida debe ser **HTML** limpio.
3. NO uses etiquetas <html>, <head> o <body>. Devuelve solo el contenido (divs, p, h3, ul, li).
4. NO uses bloques de código markdown (\`\`\`html). Devuelve el HTML directamente.
5. Usa etiquetas <h3> para títulos de secciones, <ul>/<li> para listas, <p> para párrafos y <strong> para resaltar cifras o puntos clave.

Estructura del Reporte:

<h3>1. Resumen Ejecutivo Financiero (Para el CFO)</h3>
<p>Analiza los ingresos totales, el ticket promedio y la salud financiera general basada en los datos.</p>
<ul>
  <li>Comenta sobre la concentración de ingresos (Top Tiendas y Productos).</li>
  <li>Identifica tendencias de crecimiento o decrecimiento en la línea de tiempo.</li>
</ul>

<h3>2. Informe de Operaciones y Logística (Para el COO)</h3>
<p>Analiza el volumen de unidades y la presión sobre la cadena de suministro.</p>
<ul>
  <li>Destaca las tiendas con mayor movimiento (prioridad de reabastecimiento).</li>
  <li>Identifica los productos "estrella" que no pueden agotarse.</li>
</ul>

<h3>3. Recomendaciones Estratégicas</h3>
<ul>
  <li>Provee 3 acciones concretas y breves para mejorar la rentabilidad o eficiencia operativa.</li>
</ul>

Tono: Profesional, corporativo, directo y basado exclusivamente en los datos provistos.
`;

export const generateAIReport = async (metrics: SalesMetrics): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare a lightweight payload for the model
  const payload = {
    period: metrics.dateRange,
    total_revenue: metrics.totalRevenue,
    total_units: metrics.totalUnits,
    average_order_value: metrics.averageOrderValue,
    top_5_stores_by_revenue: metrics.topStores.slice(0, 5),
    top_5_products_by_qty: metrics.topProducts.slice(0, 5),
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