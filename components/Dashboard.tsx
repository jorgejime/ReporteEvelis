import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell
} from 'recharts';
import {
  Package, MapPin, Filter, Calendar, Trash2, TrendingUp, Layers
} from 'lucide-react';
import { SalesMetrics } from '../types';
import KPICard from './KPICard';
import YearSelector from './YearSelector';

interface DashboardProps {
  metrics: SalesMetrics;
  hasData: boolean;
  onClearData: () => void;
  availableYears: number[];
  selectedYear: number | null;
  onYearChange: (year: number | null) => void;
}

const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard: React.FC<DashboardProps> = ({ metrics, hasData, onClearData, availableYears, selectedYear, onYearChange }) => {
  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in duration-500">
        <div className="bg-gradient-to-br from-slate-100 to-blue-100 p-8 rounded-3xl mb-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 group-hover:scale-110 transition-transform"></div>
          <Calendar className="w-16 h-16 text-slate-400 relative z-10" />
        </div>
        <h3 className="text-2xl font-bold text-slate-700 mb-2">Sin datos cargados</h3>
        <p className="text-slate-500 max-w-sm">Dirígete a la sección "Cargar Datos" para subir tus archivos Excel o CSV y comenzar a analizar.</p>
      </div>
    );
  }

  const totalUnits = metrics.totalUnits;
  const topStorePercent = metrics.topStores[0]
    ? ((metrics.topStores[0].value / totalUnits) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6 pb-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
              Resumen Ejecutivo
            </h2>
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4" />
              <p className="text-sm font-medium">
                Periodo: {metrics.dateRange.start} - {metrics.dateRange.end}
              </p>
            </div>
          </div>
          <button
            onClick={onClearData}
            className="text-red-600 hover:bg-red-50 hover:text-red-700 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center space-x-2 transition-all duration-200 border-2 border-red-200 hover:border-red-300 shadow-sm hover:shadow-md group"
          >
            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Limpiar Datos</span>
          </button>
        </div>
        {availableYears.length > 0 && (
          <div className="flex items-center gap-4">
            <YearSelector
              availableYears={availableYears}
              selectedYear={selectedYear}
              onYearChange={onYearChange}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Unidades"
          value={metrics.totalUnits.toLocaleString()}
          icon={Package}
          colorClass="bg-gradient-to-br from-blue-400 to-blue-600"
        />
        <KPICard
          title="Puntos de Venta"
          value={metrics.uniqueStores}
          icon={MapPin}
          colorClass="bg-gradient-to-br from-cyan-400 to-cyan-600"
        />
        <KPICard
          title="Productos Únicos"
          value={metrics.uniqueProducts}
          icon={Filter}
          colorClass="bg-gradient-to-br from-emerald-400 to-emerald-600"
        />
        <KPICard
          title="Grupos"
          value={metrics.uniqueGroups || 'N/A'}
          icon={Layers}
          colorClass="bg-gradient-to-br from-purple-400 to-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300 group">
          <h3 className="text-lg font-bold mb-6 flex items-center text-slate-800">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 rounded-xl mr-3 shadow-md group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            Tendencia de Ventas (Unidades)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickMargin={10} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: number) => [val.toLocaleString() + ' unidades', 'Ventas']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.15)' }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300 group">
          <h3 className="text-lg font-bold mb-6 flex items-center text-slate-800">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-500 p-2 rounded-xl mr-3 shadow-md group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            Top 5 Tiendas (Unidades)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.topStores.slice(0, 5)} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={140}
                  tick={{ fontSize: 11, fill: '#475569' }}
                />
                <Tooltip
                  formatter={(val: number) => [val.toLocaleString() + ' unidades', 'Vendidas']}
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.15)' }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={28}>
                  {metrics.topStores.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300 group">
          <h3 className="text-lg font-bold mb-6 flex items-center text-slate-800">
            <div className="bg-gradient-to-br from-emerald-500 to-green-500 p-2 rounded-xl mr-3 shadow-md group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5 text-white" />
            </div>
            Top 5 Productos (Unidades)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.topProducts.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: number) => [val.toLocaleString() + ' unidades', 'Vendidas']}
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.15)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={50}>
                  {metrics.topProducts.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {metrics.topGroups && metrics.topGroups.length > 0 ? (
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300 group">
            <h3 className="text-lg font-bold mb-6 flex items-center text-slate-800">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-xl mr-3 shadow-md group-hover:scale-110 transition-transform">
                <Layers className="w-5 h-5 text-white" />
              </div>
              Top Grupos (Unidades)
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.topGroups}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(val: number) => [val.toLocaleString() + ' unidades', 'Vendidas']}
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.15)' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={50}>
                    {metrics.topGroups.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 text-slate-300 p-8 rounded-2xl shadow-2xl flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Package className="w-48 h-48 text-white" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 group-hover:opacity-100 opacity-0 transition-opacity"></div>
            <h3 className="text-white text-2xl font-bold mb-8 relative z-10 flex items-center">
              <TrendingUp className="w-6 h-6 mr-3" />
              Insights Rápidos
            </h3>
            <ul className="space-y-6 relative z-10">
              <li className="flex items-start group/item">
                <div className="w-3 h-3 bg-emerald-400 rounded-full mt-2 mr-4 shadow-lg shadow-emerald-500/50 group-hover/item:scale-125 transition-transform"></div>
                <div>
                  <p className="text-xs uppercase font-bold text-emerald-400 mb-2 tracking-wider">Concentración de Ventas</p>
                  <p className="text-slate-200 leading-relaxed">
                    La tienda líder aporta el{' '}
                    <span className="text-white font-bold text-xl bg-emerald-500/20 px-2 py-0.5 rounded">
                      {topStorePercent}%
                    </span>
                    {' '}del total de unidades vendidas.
                  </p>
                </div>
              </li>
              <li className="flex items-start group/item">
                <div className="w-3 h-3 bg-blue-400 rounded-full mt-2 mr-4 shadow-lg shadow-blue-500/50 group-hover/item:scale-125 transition-transform"></div>
                <div>
                  <p className="text-xs uppercase font-bold text-blue-400 mb-2 tracking-wider">Promedio Diario</p>
                  <p className="text-slate-200 leading-relaxed">
                    Vendes un promedio de{' '}
                    <span className="text-white font-bold text-xl bg-blue-500/20 px-2 py-0.5 rounded">
                      {Math.round(metrics.averageUnitsPerDay).toLocaleString()}
                    </span>
                    {' '}unidades por día.
                  </p>
                </div>
              </li>
              <li className="flex items-start group/item">
                <div className="w-3 h-3 bg-cyan-400 rounded-full mt-2 mr-4 shadow-lg shadow-cyan-500/50 group-hover/item:scale-125 transition-transform"></div>
                <div>
                  <p className="text-xs uppercase font-bold text-cyan-400 mb-2 tracking-wider">Catálogo</p>
                  <p className="text-slate-200 leading-relaxed">
                    Trabajando con{' '}
                    <span className="text-white font-bold text-xl bg-cyan-500/20 px-2 py-0.5 rounded">
                      {metrics.uniqueProducts}
                    </span>
                    {' '}productos diferentes en tu inventario.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
