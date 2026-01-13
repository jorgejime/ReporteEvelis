import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AIReport from './components/AIReport';
import { ReportsHistory } from './components/ReportsHistory';
import ToastContainer from './components/ToastContainer';
import { ToastData } from './components/Toast';
import { SalesRecord, SalesMetrics, AppTab } from './types';
import { processSingleFile } from './services/dataProcessing';
import { backend } from './services/backend';
import { checkAndMigrate } from './services/migration';
import { Layers, Database, Server, RefreshCw, Upload, CloudUpload } from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function App() {
  const [salesData, setSalesData] = useState<SalesRecord[]>([]);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [xlsxReady, setXlsxReady] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const addToast = (type: ToastData['type'], message: string, duration = 5000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    addToast(type, message);
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        const migrationResult = await checkAndMigrate();

        if (migrationResult.migrated) {
          addToast('success', `¡Migración exitosa! ${migrationResult.recordCount} registros movidos a Supabase Cloud.`, 7000);
        }

        const data = await backend.getAll();
        setSalesData(data);

        if (data.length > 0 && !migrationResult.migrated) {
          addToast('info', `${data.length} registros cargados desde Supabase Cloud.`, 4000);
        }
      } catch (e) {
        console.error("Error conectando con Supabase", e);
        addToast('error', 'Error al conectar con la base de datos en la nube.');
      } finally {
        setInitializing(false);
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    if (window.XLSX) {
      setXlsxReady(true);
    } else {
      const interval = setInterval(() => {
        if (window.XLSX) {
          setXlsxReady(true);
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  const metrics: SalesMetrics = useMemo(() => {
    if (salesData.length === 0) {
      return {
        totalRevenue: 0,
        totalUnits: 0,
        uniqueStores: 0,
        uniqueProducts: 0,
        averageOrderValue: 0,
        topStores: [],
        topProducts: [],
        timeline: [],
        dateRange: { start: '-', end: '-' }
      };
    }

    const totalRevenue = salesData.reduce((acc, curr) => acc + curr.total, 0);
    const totalUnits = salesData.reduce((acc, curr) => acc + curr.qty, 0);
    const uniqueStores = new Set(salesData.map(d => d.store)).size;
    const uniqueProducts = new Set(salesData.map(d => d.product)).size;

    const storeMap: Record<string, number> = {};
    salesData.forEach(d => {
      storeMap[d.store] = (storeMap[d.store] || 0) + d.total;
    });
    const topStores = Object.entries(storeMap)
      .map(([name, val]) => ({ name, value: val }))
      .sort((a, b) => b.value - a.value);

    const productMap: Record<string, number> = {};
    salesData.forEach(d => {
      const name = d.product.length > 25 ? d.product.substring(0, 25) + '...' : d.product;
      productMap[name] = (productMap[name] || 0) + d.qty;
    });
    const topProducts = Object.entries(productMap)
      .map(([name, val]) => ({ name, value: val }))
      .sort((a, b) => b.value - a.value);

    const dateMap: Record<string, number> = {};
    const dates: string[] = [];
    salesData.forEach(d => {
      if (!dateMap[d.date]) {
        dateMap[d.date] = 0;
        dates.push(d.date);
      }
      dateMap[d.date] += d.total;
    });
    const timeline = Object.entries(dateMap)
      .map(([date, val]) => ({ date, value: val }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const dateRange = {
      start: dates[0] || '-',
      end: dates[dates.length - 1] || '-'
    };

    return {
      totalRevenue,
      totalUnits,
      uniqueStores,
      uniqueProducts,
      averageOrderValue: totalRevenue / salesData.length,
      topStores,
      topProducts,
      timeline,
      dateRange
    };
  }, [salesData]);

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setLoading(true);

    try {
      const results = await Promise.allSettled(files.map(processSingleFile));

      let newDataBatch: SalesRecord[] = [];
      let errors: string[] = [];

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          newDataBatch = [...newDataBatch, ...result.value.data];
        } else {
          errors.push((result.reason as any).fileName || 'Archivo desconocido');
        }
      });

      if (newDataBatch.length > 0) {
        await backend.addBatch(newDataBatch);
        const allData = await backend.getAll();
        setSalesData(allData);

        if (errors.length > 0) {
          addToast('warning', `${newDataBatch.length} registros guardados. Fallaron: ${errors.length} archivos.`);
        } else {
          addToast('success', `${newDataBatch.length} registros guardados exitosamente en Supabase Cloud.`);
          setActiveTab(AppTab.DASHBOARD);
        }
      } else if (errors.length > 0) {
        addToast('error', `Error al procesar ${errors.length} archivo(s).`);
      }

    } catch (e) {
      console.error(e);
      addToast('error', 'Error crítico al guardar en base de datos cloud.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const files = Array.from(event.target.files) as File[];
    await processFiles(files);
    event.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter((file: File) =>
      file.name.endsWith('.csv') ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls') ||
      file.name.endsWith('.txt')
    ) as File[];

    if (files.length > 0) {
      await processFiles(files);
    } else {
      addToast('warning', 'Por favor arrastra solo archivos Excel o CSV.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const clearData = async () => {
    if (confirm("¿Está seguro de eliminar TODOS los registros de Supabase Cloud? Esta acción no se puede deshacer.")) {
      try {
        setLoading(true);
        await backend.clear();
        setSalesData([]);
        addToast('success', 'Base de datos limpiada exitosamente.');
      } catch (e) {
        addToast('error', 'Error al limpiar la base de datos.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse"></div>
          <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
            <CloudUpload className="w-16 h-16 mb-4 text-blue-600 animate-bounce mx-auto" />
            <h2 className="text-2xl font-bold text-slate-800 text-center">Conectando a Supabase Cloud</h2>
            <p className="text-slate-500 mt-2 text-sm text-center max-w-sm">Sincronizando con tu base de datos segura en la nube</p>
            <div className="mt-6 flex justify-center">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 overflow-y-auto">

        {activeTab === AppTab.DASHBOARD && (
          <Dashboard
            metrics={metrics}
            hasData={salesData.length > 0}
            onClearData={clearData}
          />
        )}

        {activeTab === AppTab.AI_REPORT && (
          <AIReport metrics={metrics} hasData={salesData.length > 0} onShowToast={showToast} />
        )}

        {activeTab === AppTab.REPORTS_HISTORY && (
          <ReportsHistory onShowToast={showToast} />
        )}

        {activeTab === AppTab.UPLOAD && (
          <div className="max-w-3xl mx-auto mt-10 animate-in zoom-in-95 duration-500">
            <div className="bg-white/80 backdrop-blur-sm p-8 sm:p-12 rounded-3xl shadow-2xl border border-slate-200/50">
              <div className="text-center mb-8">
                <div className="bg-gradient-to-br from-blue-100 to-cyan-100 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 group-hover:scale-110 transition-transform"></div>
                  {xlsxReady ? <Layers className="w-12 h-12 text-blue-600 relative z-10" /> : <RefreshCw className="w-12 h-12 text-blue-600 animate-spin relative z-10" />}
                  <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full p-2 border-3 border-white shadow-lg">
                    <CloudUpload className="w-5 h-5 text-white" />
                  </div>
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3">
                  Centro de Datos Cloud
                </h2>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-cyan-50 py-2 px-4 rounded-full border border-emerald-200/50">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
                    <Server className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-700">Supabase Cloud Activo</span>
                  </div>
                </div>
                <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
                  Arrastra y suelta tus archivos o haz clic para seleccionar. Tus datos se guardarán de forma segura en Supabase Cloud.
                </p>
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative transition-all duration-300 ${(!xlsxReady || loading) ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <label className="block w-full cursor-pointer group">
                  <div className={`border-3 border-dashed rounded-2xl p-16 transition-all duration-300 relative overflow-hidden ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50 scale-105 shadow-xl'
                      : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/50'
                  }`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10 text-center">
                      <Upload className={`w-16 h-16 mx-auto mb-4 transition-all duration-300 ${
                        dragActive ? 'text-blue-600 scale-110' : 'text-slate-400 group-hover:text-blue-500'
                      }`} />
                      <p className="text-slate-700 font-bold text-xl mb-2">
                        {dragActive ? '¡Suelta aquí!' : 'Arrastra archivos o haz clic'}
                      </p>
                      <p className="text-sm text-slate-500">
                        Formatos: .xlsx, .xls, .csv o .txt (Carga múltiple soportada)
                      </p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".csv,.txt,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileUpload}
                    multiple
                    disabled={loading || !xlsxReady}
                  />
                </label>
              </div>

              {loading && (
                <div className="mt-6 flex justify-center items-center">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 px-8 rounded-xl animate-pulse shadow-lg">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                      <span className="font-bold text-lg">Guardando en Supabase Cloud...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === AppTab.DATA && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden animate-in fade-in">
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-50 to-blue-50/30">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 rounded-xl shadow-lg">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Registros en Base de Datos Cloud</h3>
                  <p className="text-xs text-slate-500">Datos sincronizados con Supabase</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 px-4 py-2 rounded-full font-bold border border-blue-200 shadow-sm">
                  {salesData.length.toLocaleString()} filas
                </span>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[70vh]">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-gradient-to-r from-slate-100 to-blue-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 font-bold">Fecha</th>
                    <th className="px-6 py-4 font-bold">Tienda</th>
                    <th className="px-6 py-4 font-bold">EAN</th>
                    <th className="px-6 py-4 font-bold">Producto</th>
                    <th className="px-6 py-4 text-right font-bold">Cant.</th>
                    <th className="px-6 py-4 text-right font-bold">Precio</th>
                    <th className="px-6 py-4 text-right font-bold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesData.slice(0, 200).map((row, idx) => (
                    <tr key={idx} className="bg-white hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200">
                      <td className="px-6 py-3 whitespace-nowrap font-medium text-slate-700">{row.date}</td>
                      <td className="px-6 py-3 font-bold text-slate-800">{row.store}</td>
                      <td className="px-6 py-3 font-mono text-xs text-slate-400">{row.ean}</td>
                      <td className="px-6 py-3 max-w-xs truncate" title={row.product}>{row.product}</td>
                      <td className="px-6 py-3 text-right text-slate-600 font-medium">{row.qty}</td>
                      <td className="px-6 py-3 text-right text-slate-600">{formatCurrency(row.price)}</td>
                      <td className="px-6 py-3 text-right font-bold text-blue-700">{formatCurrency(row.total)}</td>
                    </tr>
                  ))}
                  {salesData.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-24 text-center">
                        <Database className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-400 text-lg font-medium">La base de datos está vacía.</p>
                        <p className="text-slate-400 text-sm mt-2">Sube archivos para empezar</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
