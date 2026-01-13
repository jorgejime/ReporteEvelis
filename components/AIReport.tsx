import React, { useState } from 'react';
import { Bot, Sparkles, FileText, Loader2, AlertTriangle } from 'lucide-react';
import { SalesMetrics } from '../types';
import { generateAIReport } from '../services/geminiService';

interface AIReportProps {
  metrics: SalesMetrics;
  hasData: boolean;
}

const AIReport: React.FC<AIReportProps> = ({ metrics, hasData }) => {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateAIReport(metrics);
      setReport(result);
    } catch (err: any) {
      setError(err.message || "Error generating report.");
    } finally {
      setLoading(false);
    }
  };

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <div className="bg-slate-100 p-6 rounded-full mb-4">
          <Bot className="w-12 h-12 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-700">Se requieren datos</h3>
        <p className="text-slate-500 mt-2 max-w-sm">
          Carga archivos de ventas primero para que la IA pueda analizar las métricas financieras y operativas.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-indigo-500" />
          Analista Gerencial IA
        </h2>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Genera reportes ejecutivos automáticos utilizando Gemini. 
          Obtén análisis financieros para el CFO y sugerencias de inventario para Operaciones en segundos.
        </p>
        
        {!report && !loading && (
          <button
            onClick={handleGenerate}
            className="mt-6 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full font-bold shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 flex items-center mx-auto gap-3"
          >
            <Bot className="w-5 h-5" />
            Generar Reporte Ejecutivo
          </button>
        )}
      </div>

      {loading && (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <h3 className="text-lg font-semibold text-slate-800">Analizando Datos...</h3>
          <p className="text-slate-400 text-sm mt-2">Identificando tendencias de ingresos, productos estrella y anomalías operativas.</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-4 rounded-xl border border-red-200 flex items-center gap-3 text-red-700">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {report && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-500" />
              <span className="font-semibold text-slate-700">Reporte Generado</span>
            </div>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">Gemini AI</span>
          </div>
          
          <div className="p-10">
             <div 
               className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-h3:text-indigo-900 prose-h3:mt-8 prose-h3:mb-4 prose-p:text-slate-600 prose-li:text-slate-600 prose-strong:text-slate-900"
               dangerouslySetInnerHTML={{ __html: report }}
             />
          </div>

          <div className="bg-slate-50 p-4 border-t border-slate-200 text-center">
             <button 
               onClick={() => setReport(null)}
               className="text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors"
             >
               Generar nuevo análisis
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIReport;