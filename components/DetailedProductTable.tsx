import React, { useState } from 'react';
import { DetailedProductData } from '../types';
import { ChevronDown, ChevronRight, Store } from 'lucide-react';
import { MONTHS } from '../services/reportDataProcessor';

interface DetailedProductTableProps {
  data: DetailedProductData[];
}

const DetailedProductTable: React.FC<DetailedProductTableProps> = ({ data }) => {
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <p className="text-slate-500 text-lg">No hay datos disponibles para mostrar</p>
      </div>
    );
  }

  const toggleStore = (storeName: string) => {
    const newExpanded = new Set(expandedStores);
    if (newExpanded.has(storeName)) {
      newExpanded.delete(storeName);
    } else {
      newExpanded.add(storeName);
    }
    setExpandedStores(newExpanded);
  };

  const toggleAll = () => {
    if (expandedStores.size === data.length) {
      setExpandedStores(new Set());
    } else {
      setExpandedStores(new Set(data.map(d => d.storeName)));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <button
          onClick={toggleAll}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
        >
          {expandedStores.size === data.length ? 'Colapsar Todas' : 'Expandir Todas'}
        </button>
      </div>

      {data.map((storeData) => {
        const isExpanded = expandedStores.has(storeData.storeName);
        const storeTotal = storeData.products.reduce((sum, p) => sum + p.total, 0);

        return (
          <div key={storeData.storeName} className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => toggleStore(storeData.storeName)}
              className="w-full px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Store className="w-5 h-5 text-white" />
                <h3 className="text-lg font-bold text-white">{storeData.storeName}</h3>
                <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm font-semibold">
                  {storeData.products.length} productos
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-white font-bold text-lg">
                  Total: {storeTotal.toLocaleString('es-ES')}
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 sticky left-0 bg-slate-100 z-10 min-w-[250px]">
                        Producto
                      </th>
                      {MONTHS.map(month => (
                        <th key={month} className="px-3 py-3 text-center text-xs font-bold text-slate-700 min-w-[80px]">
                          {month.slice(0, 3)}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-xs font-bold text-slate-900 bg-slate-200 min-w-[100px]">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {storeData.products.map((product, index) => (
                      <tr
                        key={product.productName}
                        className={`border-b border-slate-200 hover:bg-cyan-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                        }`}
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-slate-800 sticky left-0 bg-inherit z-10">
                          {product.productName}
                        </td>
                        {MONTHS.map(month => {
                          const value = product.monthlyData[month] || 0;
                          return (
                            <td
                              key={month}
                              className={`px-3 py-3 text-center text-sm ${
                                value > 0 ? 'text-slate-700 font-medium' : 'text-slate-400'
                              }`}
                            >
                              {value > 0 ? value.toLocaleString('es-ES') : '-'}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-900 bg-slate-100">
                          {product.total.toLocaleString('es-ES')}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gradient-to-r from-cyan-100 to-blue-100 font-bold">
                      <td className="px-4 py-4 text-sm text-slate-900 sticky left-0 z-10 bg-gradient-to-r from-cyan-100 to-blue-100">
                        TOTAL {storeData.storeName}
                      </td>
                      {MONTHS.map(month => {
                        const total = storeData.products.reduce((sum, p) => sum + (p.monthlyData[month] || 0), 0);
                        return (
                          <td key={month} className="px-3 py-4 text-center text-sm text-slate-900">
                            {total.toLocaleString('es-ES')}
                          </td>
                        );
                      })}
                      <td className="px-4 py-4 text-center text-sm text-slate-900 bg-cyan-200">
                        {storeTotal.toLocaleString('es-ES')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DetailedProductTable;
