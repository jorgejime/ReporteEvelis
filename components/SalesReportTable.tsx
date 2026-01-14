import React, { useState } from 'react';
import { StoreReportData } from '../types';
import { ArrowUpDown } from 'lucide-react';

interface SalesReportTableProps {
  data: StoreReportData[];
}

const SalesReportTable: React.FC<SalesReportTableProps> = ({ data }) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <p className="text-slate-500 text-lg">No hay datos disponibles para mostrar</p>
      </div>
    );
  }

  const allLines = new Set<string>();
  data.forEach(store => {
    Object.keys(store.lines).forEach(line => allLines.add(line));
  });
  const sortedLines = Array.from(allLines).sort();

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;

    let valueA: number;
    let valueB: number;

    if (sortColumn === 'total') {
      valueA = a.total;
      valueB = b.total;
    } else {
      valueA = a.lines[sortColumn] || 0;
      valueB = b.lines[sortColumn] || 0;
    }

    return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
  });

  const columnTotals: { [key: string]: number } = {};
  sortedLines.forEach(line => {
    columnTotals[line] = data.reduce((sum, store) => sum + (store.lines[line] || 0), 0);
  });
  const grandTotal = data.reduce((sum, store) => sum + store.total, 0);

  const getLineColor = (line: string): string => {
    const colors: { [key: string]: string } = {
      'DELUXE': 'bg-blue-50 text-blue-700',
      'PREMIUM': 'bg-purple-50 text-purple-700',
      'MAB RH': 'bg-green-50 text-green-700',
      'Sin Clasificar': 'bg-gray-50 text-gray-700'
    };
    return colors[line] || 'bg-slate-50 text-slate-700';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-slate-700 to-slate-600 text-white">
              <th className="px-4 py-3 text-left text-sm font-bold w-16">No.</th>
              <th className="px-4 py-3 text-left text-sm font-bold min-w-[200px]">Tienda</th>
              {sortedLines.map(line => (
                <th
                  key={line}
                  className="px-4 py-3 text-center text-sm font-bold cursor-pointer hover:bg-slate-600 transition-colors min-w-[100px]"
                  onClick={() => handleSort(line)}
                >
                  <div className="flex items-center justify-center gap-1">
                    {line}
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              ))}
              <th
                className="px-4 py-3 text-center text-sm font-bold cursor-pointer hover:bg-slate-600 transition-colors bg-slate-800 min-w-[100px]"
                onClick={() => handleSort('total')}
              >
                <div className="flex items-center justify-center gap-1">
                  TOTAL
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((store, index) => (
              <tr
                key={store.storeName}
                className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                }`}
              >
                <td className="px-4 py-3 text-center text-sm text-slate-600 font-semibold">
                  {index + 1}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                  {store.storeName}
                </td>
                {sortedLines.map(line => (
                  <td
                    key={line}
                    className={`px-4 py-3 text-center text-sm font-semibold ${getLineColor(line)}`}
                  >
                    {(store.lines[line] || 0).toLocaleString('es-ES')}
                  </td>
                ))}
                <td className="px-4 py-3 text-center text-sm font-bold text-slate-900 bg-slate-100">
                  {store.total.toLocaleString('es-ES')}
                </td>
              </tr>
            ))}
            <tr className="bg-gradient-to-r from-slate-100 to-slate-200 font-bold">
              <td className="px-4 py-4 text-center text-sm"></td>
              <td className="px-4 py-4 text-sm text-slate-900">TOTAL</td>
              {sortedLines.map(line => (
                <td key={line} className="px-4 py-4 text-center text-sm text-slate-900">
                  {columnTotals[line].toLocaleString('es-ES')}
                </td>
              ))}
              <td className="px-4 py-4 text-center text-sm text-slate-900 bg-slate-300">
                {grandTotal.toLocaleString('es-ES')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesReportTable;
