import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface YearSelectorProps {
  availableYears: number[];
  selectedYear: number | null;
  onYearChange: (year: number | null) => void;
}

const YearSelector: React.FC<YearSelectorProps> = ({ availableYears, selectedYear, onYearChange }) => {
  const sortedYears = [...availableYears].sort((a, b) => b - a);

  return (
    <div className="relative inline-block">
      <label className="block text-xs font-semibold text-slate-600 mb-2">Filtrar por año</label>
      <div className="relative">
        <select
          value={selectedYear === null ? 'all' : selectedYear}
          onChange={(e) => {
            const value = e.target.value;
            onYearChange(value === 'all' ? null : parseInt(value));
          }}
          className="appearance-none bg-white border-2 border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-semibold text-slate-700 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer shadow-sm hover:shadow-md"
        >
          <option value="all">Todos los años</option>
          {sortedYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1">
          <Calendar className="w-4 h-4 text-slate-400" />
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
      </div>
      {selectedYear !== null && (
        <div className="mt-2 text-xs text-blue-600 font-medium">
          Mostrando datos de {selectedYear}
        </div>
      )}
    </div>
  );
};

export default YearSelector;
