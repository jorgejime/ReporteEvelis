import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Cell 
} from 'recharts';
import { 
  DollarSign, Package, MapPin, Filter, Calendar, Trash2 
} from 'lucide-react';
import { SalesMetrics } from '../types';
import KPICard from './KPICard';

interface DashboardProps {
  metrics: SalesMetrics;
  hasData: boolean;
  onClearData: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'];

const Dashboard: React.FC<DashboardProps> = ({ metrics, hasData, onClearData }) => {
  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="bg-slate-100 p-6 rounded-full mb-4">
          <Calendar className="w-12 h-12 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-700">Sin datos cargados</h3>
        <p className="text-slate-500 mt-2 max-w-sm">Dirígete a la sección "Cargar Datos" para subir tus archivos Excel o CSV.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-end pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Resumen Ejecutivo</h2>
          <p className="text-slate-500 mt-1">
            Periodo: {metrics.dateRange.start} - {metrics.dateRange.end}
          </p>
        </div>
        <button 
          onClick={onClearData} 
          className="text-red-500 hover:bg-red-50 hover:text-red-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Limpiar Datos</span>
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Ingresos Totales" 
          value={formatCurrency(metrics.totalRevenue)} 
          icon={DollarSign} 
          colorClass="bg-gradient-to-br from-emerald-400 to-emerald-600" 
        />
        <KPICard 
          title="Unidades Movidas" 
          value={metrics.totalUnits.toLocaleString()} 
          icon={Package} 
          colorClass="bg-gradient-to-br from-blue-400 to-blue-600" 
        />
        <KPICard 
          title="Puntos de Venta" 
          value={metrics.uniqueStores} 
          icon={MapPin} 
          colorClass="bg-gradient-to-br from-indigo-400 to-indigo-600" 
        />
        <KPICard 
          title="Ticket Promedio" 
          value={formatCurrency(metrics.averageOrderValue)}
          icon={Filter} 
          colorClass="bg-gradient-to-br from-violet-400 to-violet-600" 
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 flex items-center text-slate-800">
            <Calendar className="w-5 h-5 mr-2 text-blue-500" />
            Tendencia de Ventas (Ingresos)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{fontSize: 11, fill: '#64748b'}} tickMargin={10} />
                <YAxis 
                  tickFormatter={(val) => `$${val/1000000}M`} 
                  tick={{fontSize: 11, fill: '#64748b'}} 
                />
                <Tooltip 
                  formatter={(val: number) => [formatCurrency(val), 'Ventas']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} 
                  activeDot={{r: 6}} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Stores */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 flex items-center text-slate-800">
            <MapPin className="w-5 h-5 mr-2 text-indigo-500" />
            Top 5 Tiendas por Ingresos
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.topStores} layout="vertical" margin={{left: 20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={140} 
                  tick={{fontSize: 11, fill: '#475569'}} 
                />
                <Tooltip 
                  formatter={(val: number) => [formatCurrency(val), 'Ingresos']}
                  cursor={{fill: '#f8fafc'}}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
                   {metrics.topStores.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

       {/* Charts Row 2 */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 flex items-center text-slate-800">
            <Package className="w-5 h-5 mr-2 text-violet-500" />
            Top 5 Productos (Unidades)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.topProducts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{fontSize: 10, fill: '#64748b'}} 
                  interval={0} 
                  angle={-15} 
                  textAnchor="end" 
                  height={60} 
                />
                <YAxis tick={{fontSize: 11, fill: '#64748b'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={40}>
                   {metrics.topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insight Box */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-slate-300 p-8 rounded-2xl shadow-lg flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <DollarSign className="w-48 h-48 text-white" />
            </div>
            <h3 className="text-white text-xl font-bold mb-6 relative z-10">Insights Rápidos</h3>
            <ul className="space-y-6 relative z-10">
              <li className="flex items-start">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-4 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                <div>
                  <p className="text-xs uppercase font-semibold text-slate-500 mb-1">Concentración de Ventas</p>
                  <p className="text-slate-200">La tienda líder aporta el <span className="text-white font-bold text-lg">{metrics.topStores[0] ? ((metrics.topStores[0].value / metrics.totalRevenue) * 100).toFixed(1) : 0}%</span> del total.</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-4 shadow-[0_0_10px_rgba(96,165,250,0.5)]"></div>
                <div>
                  <p className="text-xs uppercase font-semibold text-slate-500 mb-1">Volumen de Datos</p>
                  <p className="text-slate-200">Análisis basado en <span className="text-white font-bold text-lg">{metrics.totalUnits.toLocaleString()}</span> unidades en total.</p>
                </div>
              </li>
            </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
