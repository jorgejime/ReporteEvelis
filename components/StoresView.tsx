import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MapPin, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { StoreMetrics } from '../types';

interface StoresViewProps {
  storeMetrics: StoreMetrics[];
}

const StoresView: React.FC<StoresViewProps> = ({ storeMetrics }) => {
  const [expandedStore, setExpandedStore] = useState<string | null>(null);

  if (storeMetrics.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Análisis por Tienda</h3>
        <p className="text-slate-500">No hay datos disponibles</p>
      </div>
    );
  }

  const top10Stores = storeMetrics.slice(0, 10);
  const chartData = top10Stores.map(s => ({
    name: s.storeName.length > 20 ? s.storeName.substring(0, 20) + '...' : s.storeName,
    units: s.totalUnits
  }));

  const toggleExpand = (storeName: string) => {
    setExpandedStore(expandedStore === storeName ? null : storeName);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-emerald-50 to-slate-50 p-6 rounded-2xl shadow-md border border-emerald-200">
        <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
          <MapPin className="w-7 h-7 mr-3 text-emerald-600" />
          Ventas por Tienda
        </h3>

        <div className="bg-white p-5 rounded-xl shadow-sm mb-6">
          <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase">Top 10 Tiendas por Unidades</h4>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={150} />
              <Tooltip />
              <Bar dataKey="units" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <TrendingUp className="w-6 h-6 mr-2 text-emerald-600" />
          Detalle por Tienda
        </h4>
        <div className="space-y-3">
          {storeMetrics.map((store, idx) => (
            <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
              <div
                className="p-4 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors flex items-center justify-between"
                onClick={() => toggleExpand(store.storeName)}
              >
                <div className="flex-1">
                  <h5 className="font-bold text-slate-800 text-lg">{store.storeName}</h5>
                  <div className="flex gap-6 mt-2 text-sm">
                    <span className="text-slate-600">
                      <span className="font-semibold text-emerald-600">{store.totalUnits.toLocaleString()}</span> unidades
                    </span>
                    <span className="text-slate-600">
                      <span className="font-semibold">{store.uniqueProducts}</span> productos
                    </span>
                  </div>
                </div>
                <div className="text-slate-400">
                  {expandedStore === store.storeName ? (
                    <ChevronUp className="w-6 h-6" />
                  ) : (
                    <ChevronDown className="w-6 h-6" />
                  )}
                </div>
              </div>

              {expandedStore === store.storeName && (
                <div className="p-4 bg-white border-t border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h6 className="text-sm font-bold text-slate-700 mb-3 uppercase">Top Grupos</h6>
                      <div className="space-y-2">
                        {store.byGroup.map((group, gIdx) => (
                          <div key={gIdx} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                            <span className="text-sm font-medium text-slate-700">{group.groupName}</span>
                            <span className="text-sm font-bold text-emerald-600">{group.units.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h6 className="text-sm font-bold text-slate-700 mb-3 uppercase">Ventas por Mes (Últimos 12)</h6>
                      <div className="space-y-2">
                        {store.byMonth.map((month, mIdx) => (
                          <div key={mIdx} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                            <span className="text-sm font-medium text-slate-700">{month.month}</span>
                            <span className="text-sm font-bold text-blue-600">{month.units.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoresView;
