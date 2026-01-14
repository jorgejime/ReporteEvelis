import React from 'react';
import { ReportFilters as Filters, ReportType } from '../types';
import { Filter, X } from 'lucide-react';
import { MONTHS } from '../services/reportDataProcessor';

interface ReportFiltersProps {
  filters: Filters;
  reportType: ReportType;
  availableYears: number[];
  availableStores: string[];
  availableLines: string[];
  onFiltersChange: (filters: Filters) => void;
  onApply: () => void;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
  filters,
  reportType,
  availableYears,
  availableStores,
  availableLines,
  onFiltersChange,
  onApply
}) => {
  const handleClearFilters = () => {
    onFiltersChange({
      year: availableYears[0] || null,
      month: null,
      store: null,
      line: null
    });
  };

  const showMonthFilter = reportType === ReportType.SALES_BY_STORE;
  const showStoreFilter = reportType === ReportType.DETAILED_BY_PRODUCT;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-bold text-slate-800">Filtros</h3>
        </div>
        <button
          onClick={handleClearFilters}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
          Limpiar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Año
          </label>
          <select
            value={filters.year || ''}
            onChange={(e) => onFiltersChange({ ...filters, year: e.target.value ? parseInt(e.target.value) : null })}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">Todos</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {showMonthFilter && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Mes
            </label>
            <select
              value={filters.month !== null ? filters.month : ''}
              onChange={(e) => onFiltersChange({ ...filters, month: e.target.value !== '' ? parseInt(e.target.value) : null })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">Todos</option>
              {MONTHS.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
          </div>
        )}

        {showStoreFilter && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Tienda
            </label>
            <select
              value={filters.store || ''}
              onChange={(e) => onFiltersChange({ ...filters, store: e.target.value || null })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">Todas</option>
              {availableStores.map(store => (
                <option key={store} value={store}>{store}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Línea de Producto
          </label>
          <select
            value={filters.line || ''}
            onChange={(e) => onFiltersChange({ ...filters, line: e.target.value || null })}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">Todas</option>
            {availableLines.map(line => (
              <option key={line} value={line}>{line}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={onApply}
            className="w-full px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/30"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;
