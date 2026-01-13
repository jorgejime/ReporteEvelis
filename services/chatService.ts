import { GoogleGenAI } from "@google/genai";
import { SalesRecord } from "../types";
import { backend } from "./backend";

const CHAT_SYSTEM_INSTRUCTION = `
Eres un asistente de análisis de ventas experto que responde preguntas en lenguaje natural sobre datos de ventas.

Tu trabajo es:
1. Analizar la pregunta del usuario y extraer los filtros necesarios (tienda, producto, rango de fechas).
2. Interpretar los datos de ventas filtrados.
3. Generar una respuesta clara y concisa en ESPAÑOL.
4. Decidir si la respuesta debe incluir un gráfico o solo texto.

Formato de Respuesta:
- Usa HTML limpio para formatear texto (sin etiquetas <html>, <head>, <body>)
- Usa <strong> para resaltar cifras importantes
- Usa <ul>/<li> para listas
- Usa <p> para párrafos
- NO uses bloques de código markdown

Cuando generar gráficos:
- Si la pregunta es sobre tendencias en el tiempo → sugiere LineChart
- Si la pregunta compara entre tiendas o productos → sugiere BarChart
- Si la pregunta es sobre distribución o porcentajes → sugiere PieChart
- Si solo piden un número o información simple → solo texto

Tono: Amigable, profesional, directo y basado en los datos provistos.
`;

export interface ChatQuestion {
  question: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

export interface ChatResponse {
  content: string;
  chartData?: any;
  chartType?: 'bar' | 'line' | 'pie';
  filters?: {
    store?: string;
    product?: string;
    startDate?: string;
    endDate?: string;
  };
}

export const extractFiltersFromQuestion = (question: string): {
  store?: string;
  product?: string;
  startDate?: string;
  endDate?: string;
} => {
  const filters: any = {};
  const lowerQuestion = question.toLowerCase();

  const storeKeywords = ['tienda', 'sede', 'sucursal', 'local'];
  const productKeywords = ['producto', 'canto', 'rollo', 'vinilo'];

  const datePatterns = {
    'este mes': () => {
      const now = new Date();
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
      };
    },
    'mes pasado': () => {
      const now = new Date();
      return {
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0],
        endDate: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
      };
    },
    'última semana': () => {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return {
        startDate: weekAgo.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      };
    },
    'últimos 30 días': () => {
      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return {
        startDate: monthAgo.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      };
    }
  };

  for (const [pattern, getRange] of Object.entries(datePatterns)) {
    if (lowerQuestion.includes(pattern)) {
      const range = getRange();
      filters.startDate = range.startDate;
      filters.endDate = range.endDate;
      break;
    }
  }

  const words = question.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase();

    if (storeKeywords.some(keyword => word.includes(keyword))) {
      if (i + 1 < words.length) {
        filters.store = words.slice(i + 1).join(' ').replace(/[¿?]/g, '').trim();
        break;
      }
    }

    if (productKeywords.some(keyword => word.includes(keyword))) {
      if (i + 1 < words.length) {
        filters.product = words.slice(i + 1).join(' ').replace(/[¿?]/g, '').trim();
        break;
      }
    }
  }

  return filters;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const aggregateDataByStore = (data: SalesRecord[]) => {
  const storeMap = new Map<string, { total: number; units: number }>();

  data.forEach(record => {
    const current = storeMap.get(record.store) || { total: 0, units: 0 };
    storeMap.set(record.store, {
      total: current.total + record.total,
      units: current.units + record.qty
    });
  });

  return Array.from(storeMap.entries())
    .map(([name, data]) => ({ name, value: data.total, units: data.units }))
    .sort((a, b) => b.value - a.value);
};

const aggregateDataByProduct = (data: SalesRecord[]) => {
  const productMap = new Map<string, { total: number; units: number }>();

  data.forEach(record => {
    const current = productMap.get(record.product) || { total: 0, units: 0 };
    productMap.set(record.product, {
      total: current.total + record.total,
      units: current.units + record.qty
    });
  });

  return Array.from(productMap.entries())
    .map(([name, data]) => ({ name, value: data.total, units: data.units }))
    .sort((a, b) => b.value - a.value);
};

const aggregateDataByDate = (data: SalesRecord[]) => {
  const dateMap = new Map<string, number>();

  data.forEach(record => {
    const current = dateMap.get(record.date) || 0;
    dateMap.set(record.date, current + record.total);
  });

  return Array.from(dateMap.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

const determineChartType = (question: string, dataLength: number): 'bar' | 'line' | 'pie' | null => {
  const lowerQuestion = question.toLowerCase();

  if (lowerQuestion.includes('tendencia') ||
      lowerQuestion.includes('tiempo') ||
      lowerQuestion.includes('evolución') ||
      lowerQuestion.includes('histórico')) {
    return 'line';
  }

  if (lowerQuestion.includes('comparar') ||
      lowerQuestion.includes('top') ||
      lowerQuestion.includes('mayor') ||
      lowerQuestion.includes('mejor')) {
    return 'bar';
  }

  if (lowerQuestion.includes('distribución') ||
      lowerQuestion.includes('porcentaje') ||
      lowerQuestion.includes('participación')) {
    return 'pie';
  }

  if (dataLength > 5 && (lowerQuestion.includes('tienda') || lowerQuestion.includes('producto'))) {
    return 'bar';
  }

  return null;
};

export const askQuestion = async (
  question: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<ChatResponse> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("API Key de Gemini no configurada. Por favor agrega VITE_GEMINI_API_KEY en el archivo .env");
  }

  const filters = extractFiltersFromQuestion(question);
  const filteredData = await backend.getFilteredSalesData(filters);

  if (filteredData.length === 0) {
    return {
      content: "<p>No se encontraron datos para tu consulta. Intenta con otros parámetros o verifica que hayas cargado datos en el sistema.</p>",
      filters
    };
  }

  const totalRevenue = filteredData.reduce((sum, record) => sum + record.total, 0);
  const totalUnits = filteredData.reduce((sum, record) => sum + record.qty, 0);
  const uniqueStores = new Set(filteredData.map(r => r.store)).size;
  const uniqueProducts = new Set(filteredData.map(r => r.product)).size;

  const summary = {
    total_records: filteredData.length,
    total_revenue: formatCurrency(totalRevenue),
    total_units: totalUnits,
    unique_stores: uniqueStores,
    unique_products: uniqueProducts,
    date_range: {
      start: filteredData[0]?.date,
      end: filteredData[filteredData.length - 1]?.date
    }
  };

  let chartData = null;
  let chartType = determineChartType(question, filteredData.length);

  if (chartType) {
    if (question.toLowerCase().includes('tienda') && !filters.store) {
      const storeData = aggregateDataByStore(filteredData);
      chartData = storeData.slice(0, 10);
    } else if (question.toLowerCase().includes('producto') && !filters.product) {
      const productData = aggregateDataByProduct(filteredData);
      chartData = productData.slice(0, 10);
    } else if (chartType === 'line') {
      const timeData = aggregateDataByDate(filteredData);
      chartData = timeData;
    } else {
      const storeData = aggregateDataByStore(filteredData);
      chartData = storeData.slice(0, 10);
    }
  }

  const ai = new GoogleGenAI({ apiKey });

  const conversationContext = conversationHistory
    ? conversationHistory.slice(-4).map(msg => `${msg.role}: ${msg.content}`).join('\n')
    : '';

  const prompt = `
Pregunta del usuario: ${question}

Datos resumidos encontrados:
${JSON.stringify(summary, null, 2)}

${conversationContext ? `Contexto de la conversación:\n${conversationContext}\n` : ''}

${chartType ? `Se generará un gráfico de tipo ${chartType} con los datos.` : 'No se generará gráfico, solo texto.'}

Genera una respuesta clara y concisa que responda la pregunta del usuario basándote en los datos.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: CHAT_SYSTEM_INSTRUCTION,
        temperature: 0.5,
      }
    });

    let content = response.text || "<p>No se pudo generar una respuesta.</p>";
    content = content.replace(/^```html/, '').replace(/```$/, '').trim();

    return {
      content,
      chartData,
      chartType: chartType || undefined,
      filters
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Error al procesar tu pregunta. Por favor intenta de nuevo.");
  }
};
