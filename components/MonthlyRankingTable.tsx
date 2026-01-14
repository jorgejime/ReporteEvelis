import React from 'react';
import { MonthlyRankingData } from '../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { MONTHS } from '../services/reportDataProcessor';

interface MonthlyRankingTableProps {
  data: MonthlyRankingData[];
}

const MonthlyRankingTable: React.FC<MonthlyRankingTableProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <p className="text-slate-500 text-lg">No hay datos disponibles para mostrar</p>
      </div>
    );
  }

  const getRankColor = (rank: number): string => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 font-bold';
    if (rank === 2) return 'bg-gray-200 text-gray-800 font-bold';
    if (rank === 3) return 'bg-orange-100 text-orange-800 font-bold';
    if (rank <= 5) return 'bg-green-50 text-green-700';
    if (rank <= 10) return 'bg-blue-50 text-blue-700';
    return 'bg-slate-50 text-slate-600';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
          <h3 className="text-lg font-bold text-white">Ventas Mensuales por Tienda</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 sticky left-0 bg-slate-100 z-10 min-w-[180px]">
                  Tienda
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
              {data.map((store, index) => (
                <tr
                  key={store.storeName}
                  className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                  }`}
                >
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800 sticky left-0 bg-inherit z-10">
                    {store.storeName}
                  </td>
                  {MONTHS.map(month => (
                    <td key={month} className="px-3 py-3 text-center text-sm text-slate-700">
                      {(store.monthlyData[month] || 0).toLocaleString('es-ES')}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center text-sm font-bold text-slate-900 bg-slate-100">
                    {store.totalYear.toLocaleString('es-ES')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
          <h3 className="text-lg font-bold text-white">Ranking de Posición Mensual</h3>
          <p className="text-sm text-emerald-100 mt-1">Posición de cada tienda mes a mes</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 w-16">Pos.</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 sticky left-0 bg-slate-100 z-10 min-w-[180px]">
                  Tienda
                </th>
                {MONTHS.map(month => (
                  <th key={month} className="px-3 py-3 text-center text-xs font-bold text-slate-700 min-w-[60px]">
                    {month.slice(0, 3)}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-900 bg-slate-200 min-w-[80px]">
                  Rank
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-900 bg-slate-200 min-w-[80px]">
                  Tend.
                </th>
              </tr>
            </thead>
            <tbody>
              {data
                .slice()
                .sort((a, b) => a.accumulatedRanking - b.accumulatedRanking)
                .map((store, index) => (
                  <tr
                    key={store.storeName}
                    className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                    }`}
                  >
                    <td className={`px-4 py-3 text-center text-sm font-bold ${
                      index === 0 ? 'text-yellow-600' :
                      index === 1 ? 'text-gray-600' :
                      index === 2 ? 'text-orange-600' :
                      'text-slate-600'
                    }`}>
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800 sticky left-0 bg-inherit z-10">
                      {store.storeName}
                    </td>
                    {MONTHS.map(month => (
                      <td key={month} className="px-3 py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs ${getRankColor(store.rankings[month] || 999)}`}>
                          {store.rankings[month] || '-'}
                        </span>
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center bg-slate-100">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getRankColor(store.accumulatedRanking)}`}>
                        {store.accumulatedRanking}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center bg-slate-100">
                      <div className="flex justify-center">
                        {getTrendIcon(store.trend)}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
        <h4 className="text-sm font-bold text-slate-700 mb-3">Leyenda de Colores</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-yellow-100 border-2 border-yellow-400"></div>
            <span className="text-xs text-slate-600">1° Lugar</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gray-200 border-2 border-gray-400"></div>
            <span className="text-xs text-slate-600">2° Lugar</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-orange-100 border-2 border-orange-400"></div>
            <span className="text-xs text-slate-600">3° Lugar</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-green-50 border-2 border-green-300"></div>
            <span className="text-xs text-slate-600">Top 5</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-50 border-2 border-blue-300"></div>
            <span className="text-xs text-slate-600">Top 10</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyRankingTable;
