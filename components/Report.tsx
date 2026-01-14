import React, { useState, useMemo } from 'react';
import { SalesRecord, ReportType, ReportFilters } from '../types';
import { FileBarChart, Download, Printer, Share2 } from 'lucide-react';
import ReportFilters from './ReportFilters';
import SalesReportTable from './SalesReportTable';
import MonthlyRankingTable from './MonthlyRankingTable';
import DetailedProductTable from './DetailedProductTable';
import {
  generateStoreReportData,
  generateMonthlyRankingData,
  generateDetailedProductData,
  getUniqueYears,
  getUniqueStores,
  getUniqueLines
} from '../services/reportDataProcessor';
import {
  generateSalesReportPDF,
  generateMonthlyRankingPDF,
  generateDetailedProductPDF
} from '../services/pdfGenerator';

interface ReportProps {
  salesData: SalesRecord[];
}

const Report: React.FC<ReportProps> = ({ salesData }) => {
  const [reportType, setReportType] = useState<ReportType>(ReportType.SALES_BY_STORE);
  const [filters, setFilters] = useState<ReportFilters>({
    year: null,
    month: null,
    store: null,
    line: null
  });
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters>(filters);
  const [isGenerating, setIsGenerating] = useState(false);

  const availableYears = useMemo(() => getUniqueYears(salesData), [salesData]);
  const availableStores = useMemo(() => getUniqueStores(salesData), [salesData]);
  const availableLines = useMemo(() => getUniqueLines(salesData), [salesData]);

  React.useEffect(() => {
    if (availableYears.length > 0 && filters.year === null) {
      const defaultYear = availableYears[0];
      setFilters(prev => ({ ...prev, year: defaultYear }));
      setAppliedFilters(prev => ({ ...prev, year: defaultYear }));
    }
  }, [availableYears, filters.year]);

  const salesReportData = useMemo(() =>
    generateStoreReportData(salesData, appliedFilters),
    [salesData, appliedFilters]
  );

  const monthlyRankingData = useMemo(() =>
    generateMonthlyRankingData(salesData, appliedFilters),
    [salesData, appliedFilters]
  );

  const detailedProductData = useMemo(() =>
    generateDetailedProductData(salesData, appliedFilters),
    [salesData, appliedFilters]
  );

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      if (reportType === ReportType.SALES_BY_STORE) {
        generateSalesReportPDF(salesReportData, appliedFilters);
      } else if (reportType === ReportType.MONTHLY_RANKING) {
        generateMonthlyRankingPDF(monthlyRankingData, appliedFilters);
      } else if (reportType === ReportType.DETAILED_BY_PRODUCT) {
        generateDetailedProductPDF(detailedProductData, appliedFilters);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const reportTabs = [
    { id: ReportType.SALES_BY_STORE, label: 'Ventas por Tienda', icon: '📊' },
    { id: ReportType.MONTHLY_RANKING, label: 'Ranking Mensual', icon: '🏆' },
    { id: ReportType.DETAILED_BY_PRODUCT, label: 'Detalle por Producto', icon: '📋' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl shadow-lg">
              <FileBarChart className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Informes Gerenciales</h2>
              <p className="text-sm text-slate-600">Reportes detallados para toma de decisiones</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 font-semibold shadow-sm"
              title="Imprimir"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className={`px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all flex items-center gap-2 font-semibold shadow-lg ${
                isGenerating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Download className="w-4 h-4" />
              {isGenerating ? 'Generando...' : 'Descargar PDF'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {reportTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`px-4 py-2.5 rounded-lg font-semibold transition-all ${
                reportType === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <ReportFilters
        filters={filters}
        reportType={reportType}
        availableYears={availableYears}
        availableStores={availableStores}
        availableLines={availableLines}
        onFiltersChange={setFilters}
        onApply={handleApplyFilters}
      />

      <div className="print:p-4">
        {reportType === ReportType.SALES_BY_STORE && (
          <SalesReportTable data={salesReportData} />
        )}

        {reportType === ReportType.MONTHLY_RANKING && (
          <MonthlyRankingTable data={monthlyRankingData} />
        )}

        {reportType === ReportType.DETAILED_BY_PRODUCT && (
          <DetailedProductTable data={detailedProductData} />
        )}
      </div>
    </div>
  );
};

export default Report;
