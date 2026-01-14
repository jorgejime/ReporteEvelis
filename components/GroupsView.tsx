import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package, TrendingUp } from 'lucide-react';
import { GroupMetrics } from '../types';

interface GroupsViewProps {
  groupMetrics: GroupMetrics[];
}

const GroupsView: React.FC<GroupsViewProps> = ({ groupMetrics }) => {
  if (groupMetrics.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Análisis por Grupo</h3>
        <p className="text-slate-500">No hay datos disponibles</p>
      </div>
    );
  }

  const chartData = groupMetrics.map(g => ({
    name: g.groupName,
    units: g.totalUnits,
    percentage: g.percentage
  }));

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-slate-50 p-6 rounded-2xl shadow-md border border-blue-200">
        <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
          <Package className="w-7 h-7 mr-3 text-blue-600" />
          Ventas por Grupo de Productos
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl shadow-sm">
            <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase">Distribución de Unidades</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="units"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.name}: ${entry.percentage.toFixed(1)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={groupMetrics[index].color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm">
            <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase">Comparativa por Grupo</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="units" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <TrendingUp className="w-6 h-6 mr-2 text-emerald-600" />
          Detalle por Grupo
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-300">
                <th className="text-left py-3 px-4 font-bold text-slate-700">Grupo</th>
                <th className="text-right py-3 px-4 font-bold text-slate-700">Unidades</th>
                <th className="text-right py-3 px-4 font-bold text-slate-700">% Total</th>
                <th className="text-right py-3 px-4 font-bold text-slate-700">Productos</th>
                <th className="text-right py-3 px-4 font-bold text-slate-700">Tiendas</th>
              </tr>
            </thead>
            <tbody>
              {groupMetrics.map((group, idx) => (
                <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="font-medium text-slate-800">{group.groupName}</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 font-semibold text-slate-700">
                    {group.totalUnits.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                      {group.percentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-right py-3 px-4 text-slate-600">{group.uniqueProducts}</td>
                  <td className="text-right py-3 px-4 text-slate-600">{group.uniqueStores}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GroupsView;
