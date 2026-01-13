import React, { useEffect, useState } from 'react';
import { FileText, Download, Printer, Trash2, Calendar, DollarSign } from 'lucide-react';
import { backend } from '../services/backend';
import { AIReport } from '../types';

interface ReportsHistoryProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ReportsHistory: React.FC<ReportsHistoryProps> = ({ onShowToast }) => {
  const [reports, setReports] = useState<AIReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<AIReport | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await backend.getAIReports();
      setReports(data);
    } catch (error) {
      onShowToast('Error al cargar reportes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este reporte?')) return;

    const success = await backend.deleteAIReport(id);
    if (success) {
      setReports(reports.filter(r => r.id !== id));
      if (selectedReport?.id === id) {
        setSelectedReport(null);
      }
      onShowToast('Reporte eliminado exitosamente', 'success');
    } else {
      onShowToast('Error al eliminar el reporte', 'error');
    }
  };

  const handlePrint = () => {
    if (!selectedReport) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      onShowToast('Por favor permite ventanas emergentes para imprimir', 'error');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${selectedReport.title}</title>
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
            <h1>${selectedReport.title}</h1>
            <p><strong>Fecha de generación:</strong> ${new Date(selectedReport.created_at).toLocaleString('es-ES')}</p>
          </div>
          ${selectedReport.content}
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
    if (!selectedReport) return;

    onShowToast('Para descargar PDF, usa el botón de imprimir y selecciona "Guardar como PDF"', 'info');
    handlePrint();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando reportes...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-blue-900" />
          <h2 className="text-lg font-semibold text-gray-800">Historial de Reportes</h2>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No hay reportes guardados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedReport?.id === report.id
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <h3 className="font-medium text-sm text-gray-900 mb-1">{report.title}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                  <Calendar className="w-3 h-3" />
                  {formatDate(report.created_at)}
                </div>
                {report.metrics_summary && (
                  <div className="flex items-center gap-1 text-xs text-gray-700">
                    <DollarSign className="w-3 h-3" />
                    {formatCurrency(report.metrics_summary.totalRevenue || 0)}
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(report.id);
                  }}
                  className="mt-2 text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 180px)' }}>
        {selectedReport ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedReport.title}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Generado el {formatDate(selectedReport.created_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div
                dangerouslySetInnerHTML={{ __html: selectedReport.content }}
                className="prose prose-sm max-w-none"
                style={{
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Selecciona un reporte para visualizarlo</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
