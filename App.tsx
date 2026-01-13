import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AIReport from './components/AIReport';
import { SalesRecord, SalesMetrics, AppTab } from './types';
import { processSingleFile } from './services/dataProcessing';
import { backend } from './services/backend';
import { Layers, AlertCircle, Database, Server, RefreshCw } from 'lucide-react';

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

  // --- Initialization ---

  useEffect(() => {
    // Load data from Backend (IndexedDB) on startup
    const loadData = async () => {
      try {
        const data = await backend.getAll();
        setSalesData(data);
      } catch (e) {
        console.error("Error conectando con el backend local", e);
      } finally {
        setInitializing(false);
      }
    };
    loadData();
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

  // --- Metrics Calculation ---

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
    
    // Top Stores
    const storeMap: Record<string, number> = {};
    salesData.forEach(d => {
      storeMap[d.store] = (storeMap[d.store] || 0) + d.total;
    });
    const topStores = Object.entries(storeMap)
      .map(([name, val]) => ({ name, value: val }))
      .sort((a, b) => b.value - a.value);

    // Top Products
    const productMap: Record<string, number> = {};
    salesData.forEach(d => {
      const name = d.product.length > 25 ? d.product.substring(0, 25) + '...' : d.product;
      productMap[name] = (productMap[name] || 0) + d.qty;
    });
    const topProducts = Object.entries(productMap)
      .map(([name, val]) => ({ name, value: val }))
      .sort((a, b) => b.value - a.value);

    // Timeline
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

  // --- Handlers ---

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const files = Array.from(event.target.files);
    setLoading(true);
    
    try {
      const results = await Promise.allSettled(files.map(processSingleFile));
      
      let newDataBatch: SalesRecord[] = [];
      let errors: string[] = [];

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          newDataBatch = [...newDataBatch, ...result.value.data];
        } else {
          // @ts-ignore
          errors.push(result.reason.fileName || 'Unknown file');
        }
      });

      if (newDataBatch.length > 0) {
        // 1. Save to Backend
        await backend.addBatch(newDataBatch);
        
        // 2. Refresh State from Backend (Source of Truth)
        const allData = await backend.getAll();
        setSalesData(allData);

        if (errors.length > 0) {
           alert(`Se guardaron datos parciales en el servidor local. Fallaron: ${errors.join(', ')}`);
        } else {
           setActiveTab(AppTab.DASHBOARD);
        }
      } else if (errors.length > 0) {
        alert(`Error al procesar archivos.`);
      }

    } catch (e) {
      console.error(e);
      alert("Error crítico guardando en base de datos.");
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const clearData = async () => {
    if (confirm("¿Está seguro de eliminar TODOS los registros de la base de datos local? Esta acción no se puede deshacer.")) {
      try {
        setLoading(true);
        await backend.clear();
        setSalesData([]);
        alert("Base de datos limpia.");
      } catch (e) {
        alert("Error limpiando base de datos.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <Server className="w-12 h-12 mb-4 text-blue-500 animate-pulse" />
        <h2 className="text-xl font-semibold">Conectando al Backend Local...</h2>
        <p className="text-slate-400 mt-2 text-sm">Sincronizando base de datos segura (IndexedDB)</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        
        {activeTab === AppTab.DASHBOARD && (
          <Dashboard 
            metrics={metrics} 
            hasData={salesData.length > 0} 
            onClearData={clearData} 
          />
        )}

        {activeTab === AppTab.AI_REPORT && (
          <AIReport metrics={metrics} hasData={salesData.length > 0} />
        )}

        {activeTab === AppTab.UPLOAD && (
          <div className="max-w-2xl mx-auto mt-10 animate-in zoom-in-95 duration-300">
            <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 text-center">
              <div className="bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner relative">
                 {xlsxReady ? <Layers className="w-10 h-10 text-emerald-600" /> : <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />}
                 <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1.5 border-2 border-white">
                    <Database className="w-4 h-4 text-white" />
                 </div>
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Centro de Datos</h2>
              <div className="flex items-center justify-center gap-2 mb-4 text-sm text-emerald-700 bg-emerald-50 py-1 px-3 rounded-full w-fit mx-auto">
                <Server className="w-3 h-3" />
                <span className="font-semibold">Backend Local Activo</span>
              </div>
              <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
                Los datos que cargues se guardarán de forma segura en la base de datos persistente del navegador.
              </p>
              
              <label className={`block w-full cursor-pointer group ${(!xlsxReady || loading) ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="border-3 border-dashed border-slate-200 rounded-2xl p-12 group-hover:border-emerald-500 group-hover:bg-emerald-50/50 transition-all duration-300 relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-slate-600 font-semibold text-lg">Seleccionar Archivos</p>
                    <p className="text-sm text-slate-400 mt-2">.xlsx o .csv (Soporta carga masiva)</p>
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
              
              {loading && (
                <div className="mt-6 flex justify-center items-center text-blue-600 font-medium bg-blue-50 py-3 px-6 rounded-lg animate-pulse">
                  <RefreshCw className="h-5 w-5 animate-spin mr-3" />
                  Sincronizando con base de datos...
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === AppTab.DATA && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-slate-400" />
                <h3 className="font-bold text-slate-700">Registros en Base de Datos</h3>
              </div>
              <span className="text-xs bg-slate-200 text-slate-600 px-3 py-1 rounded-full font-medium">
                {salesData.length.toLocaleString()} filas almacenadas
              </span>
            </div>
            <div className="overflow-x-auto max-h-[70vh]">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Fecha</th>
                    <th className="px-6 py-4 font-semibold">Tienda</th>
                    <th className="px-6 py-4 font-semibold">EAN</th>
                    <th className="px-6 py-4 font-semibold">Producto</th>
                    <th className="px-6 py-4 text-right font-semibold">Cant.</th>
                    <th className="px-6 py-4 text-right font-semibold">Precio</th>
                    <th className="px-6 py-4 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesData.slice(0, 200).map((row, idx) => (
                    <tr key={idx} className="bg-white hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap">{row.date}</td>
                      <td className="px-6 py-3 font-medium text-slate-800">{row.store}</td>
                      <td className="px-6 py-3 font-mono text-xs text-slate-400">{row.ean}</td>
                      <td className="px-6 py-3 max-w-xs truncate" title={row.product}>{row.product}</td>
                      <td className="px-6 py-3 text-right text-slate-500">{row.qty}</td>
                      <td className="px-6 py-3 text-right text-slate-500">{formatCurrency(row.price)}</td>
                      <td className="px-6 py-3 text-right font-bold text-slate-800">{formatCurrency(row.total)}</td>
                    </tr>
                  ))}
                  {salesData.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center text-slate-400">
                        La base de datos está vacía.
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
