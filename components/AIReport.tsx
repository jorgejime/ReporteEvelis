import React, { useState } from 'react';
import { Bot, Sparkles, FileText, Loader2, AlertTriangle, Printer, Download } from 'lucide-react';
import { SalesMetrics } from '../types';
import { generateAIReport } from '../services/geminiService';
import { backend } from '../services/backend';

interface AIReportProps {
  metrics: SalesMetrics;
  hasData: boolean;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const AIReport: React.FC<AIReportProps> = ({ metrics, hasData, onShowToast }) => {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateAIReport(metrics);
      setReport(result);

      const savedReport = await backend.saveAIReport(result, metrics);
      if (savedReport) {
        onShowToast('Reporte generado y guardado exitosamente', 'success');
      }
    } catch (err: any) {
      setError(err.message || "Error generating report.");
      onShowToast('Error al generar el reporte', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!report) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      onShowToast('Por favor permite ventanas emergentes para imprimir', 'error');
      return;
    }

    const title = `Reporte ${metrics.dateRange.start} - ${metrics.dateRange.end}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            h3 {
              color: #1e3a8a;
              margin-top: 20px;
            }
            p, li {
              line-height: 1.6;
            }
            .header {
              border-bottom: 2px solid #1e3a8a;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            @media print {
              body { padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p><strong>Fecha de generación:</strong> ${new Date().toLocaleString('es-ES')}</p>
          </div>
          ${report}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleDownloadPDF = () => {
    if (!report) return;
    onShowToast('Para descargar PDF, usa el botón de imprimir y selecciona "Guardar como PDF"', 'info');
    handlePrint();
  };

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4 animate-in fade-in duration-500">
        <div className="bg-gradient-to-br from-slate-100 to-blue-100 p-8 rounded-3xl mb-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 group-hover:scale-110 transition-transform"></div>
          <Bot className="w-16 h-16 text-slate-400 relative z-10" />
        </div>
        <h3 className="text-2xl font-bold text-slate-700 mb-2">Se requieren datos</h3>
        <p className="text-slate-500 max-w-sm">
          Carga archivos de ventas primero para que la IA pueda analizar las métricas financieras y operativas.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center gap-3 mb-4">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-2xl shadow-lg">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          Analista Gerencial IA
        </h2>
        <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Genera reportes ejecutivos automáticos utilizando Gemini.
          Obtén análisis financieros para el CFO y sugerencias de inventario para Operaciones en segundos.
        </p>

        {!report && !loading && (
          <button
            onClick={handleGenerate}
            className="mt-8 px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 flex items-center mx-auto gap-3 group"
          >
            <Bot className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            Generar Reporte Ejecutivo
          </button>
        )}
      </div>

      {loading && (
        <div className="bg-white/80 backdrop-blur-sm p-16 rounded-3xl shadow-2xl border border-slate-200/50 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse"></div>
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin relative z-10" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3">Analizando Datos...</h3>
          <p className="text-slate-500 text-sm max-w-md">
            Identificando tendencias de ingresos, productos estrella y anomalías operativas con inteligencia artificial.
          </p>
          <div className="mt-6 flex gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-6 rounded-2xl border-2 border-red-200 flex items-center gap-4 text-red-700 shadow-lg">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {report && (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/50 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 rounded-xl shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-slate-800 text-lg">Reporte Generado</span>
                <p className="text-xs text-slate-500">Análisis ejecutivo completo</p>
              </div>
            </div>
            <span className="text-xs bg-gradient-to-r from-emerald-100 to-cyan-100 text-emerald-700 px-4 py-2 rounded-full font-bold border border-emerald-200 shadow-sm flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              Gemini AI
            </span>
          </div>

          <div className="p-10">
            <div
              className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-h3:text-slate-900 prose-h3:mt-8 prose-h3:mb-4 prose-p:text-slate-600 prose-li:text-slate-600 prose-strong:text-slate-900"
              dangerouslySetInnerHTML={{ __html: report }}
            />
          </div>

          <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 p-6 border-t border-slate-200 flex justify-between items-center flex-wrap gap-4">
            <p className="text-sm text-slate-500 font-medium">
              Generado con inteligencia artificial
            </p>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={() => setReport(null)}
                className="text-sm text-blue-600 hover:text-blue-700 font-bold hover:bg-blue-50 px-4 py-2 rounded-xl transition-all border-2 border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md"
              >
                Generar nuevo análisis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIReport;
