import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Report from './components/Report';
import AIReport from './components/AIReport';
import ChatAI from './components/ChatAI';
import { ReportsHistory } from './components/ReportsHistory';
import { UploadedFilesList } from './components/UploadedFilesList';
import ToastContainer from './components/ToastContainer';
import { ToastData } from './components/Toast';
import { SalesRecord, SalesMetrics, AppTab, ProductGroup } from './types';
import { processSingleFile } from './services/dataProcessing';
import { backend } from './services/backend';
import { checkAndMigrate } from './services/migration';
import { calculateMetrics } from './services/metricsCalculator';
import { Layers, Database, Server, RefreshCw, Upload, CloudUpload, AlertCircle } from 'lucide-react';


export default function App() {
  const [salesData, setSalesData] = useState<SalesRecord[]>([]);
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [initProgress, setInitProgress] = useState<string>('Conectando...');
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

  const retryInitialization = () => {
    setInitializing(true);
    setInitError(null);
    window.location.reload();
  };

  useEffect(() => {
    const initialize = async () => {
      console.log('[INIT] Iniciando conexión con Supabase...');
      setInitError(null);
      setInitProgress('Conectando con Supabase...');

      try {
        console.log('[INIT] Verificando migración...');
        setInitProgress('Verificando datos locales...');
        const migrationResult = await checkAndMigrate();
        console.log('[INIT] Migración completada:', migrationResult);

        if (migrationResult.migrated) {
          addToast('success', `¡Migración exitosa! ${migrationResult.recordCount} registros movidos a Supabase Cloud.`, 7000);
        }

        console.log('[INIT] Obteniendo datos de ventas...');
        setInitProgress('Cargando registros de ventas...');
        const dataPromise = backend.getAll();

        console.log('[INIT] Obteniendo grupos de productos...');
        setInitProgress('Cargando grupos de productos...');
        const groupsPromise = backend.getProductGroups().catch(error => {
          console.warn('[INIT] Error al cargar grupos (no crítico):', error);
          return [];
        });

        const [data, groups] = await Promise.all([dataPromise, groupsPromise]);

        console.log(`[INIT] Datos cargados: ${data.length} registros, ${groups.length} grupos`);
        setInitProgress('Finalizando...');

        setSalesData(data);
        setProductGroups(groups);

        if (data.length > 0 && !migrationResult.migrated) {
          addToast('info', `${data.length} registros cargados desde Supabase Cloud.`, 4000);
        } else if (data.length === 0) {
          console.log('[INIT] Base de datos vacía');
        }

        console.log('[INIT] Inicialización completada exitosamente');
      } catch (e: any) {
        console.error('[INIT] Error durante la inicialización:', e);
        const errorMsg = e?.message || 'Error desconocido al conectar con Supabase';
        setInitError(errorMsg);
        addToast('error', `Error de conexión: ${errorMsg}`);
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

  useEffect(() => {
    const savedYear = localStorage.getItem('selectedYear');
    if (savedYear && savedYear !== 'null') {
      setSelectedYear(parseInt(savedYear));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedYear', selectedYear?.toString() || 'null');
  }, [selectedYear]);

  const availableYears = useMemo(() => {
    const years = salesData
      .map(record => record.year)
      .filter((year): year is number => year !== undefined && year !== null);
    return [...new Set(years)].sort((a, b) => b - a);
  }, [salesData]);

  const filteredSalesData = useMemo(() => {
    if (selectedYear === null) {
      return salesData;
    }
    return salesData.filter(record => record.year === selectedYear);
  }, [salesData, selectedYear]);

  const metrics: SalesMetrics = useMemo(() => {
    return calculateMetrics(filteredSalesData, productGroups);
  }, [filteredSalesData, productGroups]);

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setLoading(true);
    setUploadProgress(null);

    try {
      let totalRecordsAdded = 0;
      let errors: string[] = [];
      let successCount = 0;

      for (const file of files) {
        try {
          console.log(`[UPLOAD] Procesando archivo: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
          setUploadProgress({ current: 0, total: 100, fileName: file.name });

          const fileHash = await backend.generateFileHash(file);
          setUploadProgress({ current: 10, total: 100, fileName: file.name });

          const result = await processSingleFile(file);
          console.log(`[UPLOAD] Archivo procesado: ${result.data.length} registros encontrados`);
          setUploadProgress({ current: 30, total: result.data.length, fileName: file.name });

          if (result.data.length > 0) {
            const fileId = await backend.createFileRecord(
              file.name,
              fileHash,
              file.size
            );

            if (fileId) {
              await backend.addBatchWithFileId(result.data, fileId, (current, total) => {
                setUploadProgress({
                  current: Math.min(current, total),
                  total,
                  fileName: file.name
                });
              });
              totalRecordsAdded += result.data.length;
              successCount++;
            }
          }
        } catch (err: any) {
          errors.push(file.name);
          console.error(`Error processing file ${file.name}:`, err);
        }
      }

      setUploadProgress(null);
      const allData = await backend.getAll();
      setSalesData(allData);

      if (successCount > 0) {
        if (errors.length > 0) {
          addToast('warning', `${successCount} archivo(s) subido(s) con ${totalRecordsAdded} registros. Fallaron: ${errors.length} archivo(s).`);
        } else {
          addToast('success', `${successCount} archivo(s) subido(s) exitosamente con ${totalRecordsAdded} registros.`);
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
      setUploadProgress(null);
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

  const handleFilesChange = async () => {
    const allData = await backend.getAll();
    setSalesData(allData);
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse"></div>
          <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-md">
            {!initError ? (
              <>
                <CloudUpload className="w-16 h-16 mb-4 text-blue-600 animate-bounce mx-auto" />
                <h2 className="text-2xl font-bold text-slate-800 text-center">Conectando a Supabase Cloud</h2>
                <p className="text-slate-500 mt-2 text-sm text-center">Sincronizando con tu base de datos segura en la nube</p>
                <p className="text-blue-600 mt-3 text-sm text-center font-semibold">{initProgress}</p>
                <div className="mt-6 flex justify-center">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-16 h-16 mb-4 text-red-500 mx-auto" />
                <h2 className="text-2xl font-bold text-slate-800 text-center">Error de Conexión</h2>
                <p className="text-slate-600 mt-2 text-sm text-center">{initError}</p>
                <p className="text-slate-500 mt-2 text-xs text-center">Verifica tu conexión a internet y las credenciales de Supabase</p>
                <button
                  onClick={retryInitialization}
                  className="mt-6 w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-6 rounded-xl font-bold hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Reintentar Conexión
                </button>
              </>
            )}
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
            availableYears={availableYears}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            salesData={salesData}
          />
        )}

        {activeTab === AppTab.REPORT && (
          <Report salesData={salesData} />
        )}

        {activeTab === AppTab.AI_REPORT && (
          <AIReport metrics={metrics} hasData={salesData.length > 0} onShowToast={showToast} />
        )}

        {activeTab === AppTab.REPORTS_HISTORY && (
          <ReportsHistory onShowToast={showToast} />
        )}

        {activeTab === AppTab.CHAT_AI && (
          <ChatAI hasData={salesData.length > 0} onShowToast={showToast} />
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
                <div className="mt-6 space-y-4">
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                      <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                      <span className="font-bold text-lg text-slate-800">
                        {uploadProgress ? `Guardando: ${uploadProgress.fileName}` : 'Procesando archivo...'}
                      </span>
                    </div>
                    {uploadProgress && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-slate-600">
                          <span>Progreso</span>
                          <span className="font-semibold">
                            {uploadProgress.current.toLocaleString()} / {uploadProgress.total.toLocaleString()} registros
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-300 shadow-lg"
                            style={{ width: `${Math.min((uploadProgress.current / uploadProgress.total) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-500 text-center">
                          {Math.round((uploadProgress.current / uploadProgress.total) * 100)}% completado
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-slate-200/50">
              <UploadedFilesList onShowToast={showToast} onFilesChange={handleFilesChange} />
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
                    <th className="px-6 py-4 font-bold">Año</th>
                    <th className="px-6 py-4 font-bold">Fecha</th>
                    <th className="px-6 py-4 font-bold">Tienda</th>
                    <th className="px-6 py-4 font-bold">Grupo</th>
                    <th className="px-6 py-4 font-bold">Producto</th>
                    <th className="px-6 py-4 text-right font-bold">Cantidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesData.map((row, idx) => (
                    <tr key={idx} className="bg-white hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200">
                      <td className="px-6 py-3 whitespace-nowrap">
                        {row.year ? (
                          <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1 rounded-lg font-bold text-sm shadow-sm">
                            {row.year}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap font-medium text-slate-700">{row.date}</td>
                      <td className="px-6 py-3 font-bold text-slate-800">{row.store}</td>
                      <td className="px-6 py-3 text-sm">
                        {row.grupo ? (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-semibold text-xs">
                            {row.grupo}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-3 max-w-xs truncate" title={row.product}>{row.product}</td>
                      <td className="px-6 py-3 text-right text-blue-700 font-bold text-lg">{row.qty.toLocaleString()}</td>
                    </tr>
                  ))}
                  {salesData.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-24 text-center">
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
