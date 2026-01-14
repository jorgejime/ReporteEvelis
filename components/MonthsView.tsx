import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Calendar, TrendingUp } from 'lucide-react';
import { MonthMetrics } from '../types';

interface MonthsViewProps {
  monthMetrics: MonthMetrics[];
}

const MonthsView: React.FC<MonthsViewProps> = ({ monthMetrics }) => {
  if (monthMetrics.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Análisis por Mes</h3>
        <p className="text-slate-500">No hay datos disponibles</p>
      </div>
    );
  }

  const timelineData = monthMetrics.map(m => ({
    month: m.month.substring(0, 15),
    units: m.totalUnits,
    products: m.uniqueProducts,
    stores: m.uniqueStores
  }));

  const allGroups = new Set<string>();
  monthMetrics.forEach(m => {
    m.byGroup.forEach(g => allGroups.add(g.groupName));
  });

  const groupColors: { [key: string]: string } = {
    'Aceites': '#f59e0b',
    'Margarinas': '#eab308',
    'Mantecas': '#84cc16',
    'Cremas': '#06b6d4',
    'Leches': '#3b82f6',
    'Postres': '#8b5cf6',
    'Condimentos': '#ec4899',
    'Harinas': '#f97316',
    'Bebidas': '#14b8a6',
    'Snacks': '#ef4444',
    'Pastas': '#f43f5e',
    'Salsas': '#dc2626',
    'Otros': '#6b7280'
  };

  const stackedData = monthMetrics.map(m => {
    const dataPoint: any = { month: m.month.substring(0, 15) };
    m.byGroup.forEach(g => {
      dataPoint[g.groupName] = g.units;
    });
    return dataPoint;
  });

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-cyan-50 to-slate-50 p-6 rounded-2xl shadow-md border border-cyan-200">
        <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
          <Calendar className="w-7 h-7 mr-3 text-cyan-600" />
          Evolución Mensual de Ventas
        </h3>

        <div className="bg-white p-5 rounded-xl shadow-sm mb-6">
          <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase">Tendencia de Unidades Vendidas</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="units" stroke="#3b82f6" strokeWidth={3} name="Unidades" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm">
          <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase">Ventas por Grupo - Mensual</h4>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={stackedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              {Array.from(allGroups).map((groupName) => (
                <Bar
                  key={groupName}
                  dataKey={groupName}
                  stackId="a"
                  fill={groupColors[groupName] || '#6b7280'}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <TrendingUp className="w-6 h-6 mr-2 text-emerald-600" />
          Detalle Mensual
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-300">
                <th className="text-left py-3 px-4 font-bold text-slate-700">Mes</th>
                <th className="text-right py-3 px-4 font-bold text-slate-700">Unidades</th>
                <th className="text-right py-3 px-4 font-bold text-slate-700">Productos</th>
                <th className="text-right py-3 px-4 font-bold text-slate-700">Tiendas</th>
                <th className="text-left py-3 px-4 font-bold text-slate-700">Top Grupo</th>
              </tr>
            </thead>
            <tbody>
              {monthMetrics.map((month, idx) => {
                const topGroup = month.byGroup[0];
                return (
                  <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800">{month.month}</td>
                    <td className="text-right py-3 px-4 font-semibold text-slate-700">
                      {month.totalUnits.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4 text-slate-600">{month.uniqueProducts}</td>
                    <td className="text-right py-3 px-4 text-slate-600">{month.uniqueStores}</td>
                    <td className="py-3 px-4">
                      {topGroup && (
                        <span className="text-sm text-slate-700">
                          <span className="font-semibold">{topGroup.groupName}</span>
                          <span className="text-slate-500 ml-2">({topGroup.units.toLocaleString()} unidades)</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonthsView;
