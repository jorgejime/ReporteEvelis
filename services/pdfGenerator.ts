import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StoreReportData, MonthlyRankingData, DetailedProductData, ReportFilters } from '../types';
import { MONTHS } from './reportDataProcessor';

const formatNumber = (num: number): string => {
  return num.toLocaleString('es-ES');
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const addReportHeader = (doc: jsPDF, title: string): void => {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text(title, 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Corte al: ${formatDate(new Date())}`, 14, 28);
};

const addReportFooter = (doc: jsPDF): void => {
  const pageCount = doc.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
};

export const generateSalesReportPDF = (
  data: StoreReportData[],
  filters: ReportFilters
): void => {
  const doc = new jsPDF();

  addReportHeader(doc, 'REPORTE DE VENTAS DE TABLEROS');

  let filterText = '';
  if (filters.year) filterText += `Año: ${filters.year}  `;
  if (filters.month !== null) filterText += `Mes: ${MONTHS[filters.month]}  `;
  if (filters.line) filterText += `Línea: ${filters.line}`;

  if (filterText) {
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(filterText, 14, 35);
  }

  const allLines = new Set<string>();
  data.forEach(store => {
    Object.keys(store.lines).forEach(line => allLines.add(line));
  });
  const sortedLines = Array.from(allLines).sort();

  const tableHeaders = ['No.', 'Tienda', ...sortedLines, 'TOTAL'];

  const tableData = data.map((store, index) => {
    const row: (string | number)[] = [index + 1, store.storeName];

    sortedLines.forEach(line => {
      row.push(store.lines[line] || 0);
    });

    row.push(store.total);

    return row;
  });

  const totalsRow: (string | number)[] = ['', 'TOTAL'];
  sortedLines.forEach(line => {
    const total = data.reduce((sum, store) => sum + (store.lines[line] || 0), 0);
    totalsRow.push(total);
  });
  const grandTotal = data.reduce((sum, store) => sum + store.total, 0);
  totalsRow.push(grandTotal);

  tableData.push(totalsRow);

  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: filterText ? 40 : 35,
    theme: 'grid',
    headStyles: {
      fillColor: [100, 100, 100],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [50, 50, 50]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', cellWidth: 40 }
    },
    didParseCell: (data) => {
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 240, 240];
      }
    }
  });

  addReportFooter(doc);
  doc.save(`reporte_ventas_${new Date().getTime()}.pdf`);
};

export const generateMonthlyRankingPDF = (
  data: MonthlyRankingData[],
  filters: ReportFilters
): void => {
  const doc = new jsPDF('l', 'mm', 'a4');

  addReportHeader(doc, 'VENTA DE TABLEROS POR MESES -- RANKING DE POSICIÓN');

  let filterText = '';
  if (filters.year) filterText += `Año: ${filters.year}  `;
  if (filters.line) filterText += `Línea: ${filters.line}`;

  if (filterText) {
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(filterText, 14, 35);
  }

  const tableHeaders = [
    'Tienda',
    ...MONTHS,
    'Total General'
  ];

  const tableData = data.map(store => {
    const row: (string | number)[] = [store.storeName];

    MONTHS.forEach(month => {
      row.push(store.monthlyData[month] || 0);
    });

    row.push(store.totalYear);

    return row;
  });

  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: filterText ? 40 : 35,
    theme: 'grid',
    headStyles: {
      fillColor: [100, 100, 100],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [50, 50, 50],
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 30 }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RANKING DE POSICIÓN', 14, finalY);

  const rankingHeaders = [
    'Posición',
    'Tienda',
    ...MONTHS.map(m => m.slice(0, 3)),
    'Rank Acum.',
    'Tendencia'
  ];

  const sortedByRanking = [...data].sort((a, b) => a.accumulatedRanking - b.accumulatedRanking);

  const rankingData = sortedByRanking.map((store, index) => {
    const row: (string | number)[] = [index + 1, store.storeName];

    MONTHS.forEach(month => {
      row.push(store.rankings[month] || '-');
    });

    row.push(store.accumulatedRanking);

    row.push(store.trend === 'up' ? '↑' : store.trend === 'down' ? '↓' : '→');

    return row;
  });

  autoTable(doc, {
    head: [rankingHeaders],
    body: rankingData,
    startY: finalY + 5,
    theme: 'grid',
    headStyles: {
      fillColor: [52, 152, 219],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [50, 50, 50],
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'left', cellWidth: 30 }
    },
    didParseCell: (data) => {
      if (data.column.index === 0 && data.section === 'body') {
        const position = data.cell.raw as number;
        if (position === 1) {
          data.cell.styles.fillColor = [255, 215, 0];
        } else if (position === 2) {
          data.cell.styles.fillColor = [192, 192, 192];
        } else if (position === 3) {
          data.cell.styles.fillColor = [205, 127, 50];
        }
      }
    }
  });

  addReportFooter(doc);
  doc.save(`ranking_mensual_${new Date().getTime()}.pdf`);
};

export const generateDetailedProductPDF = (
  data: DetailedProductData[],
  filters: ReportFilters
): void => {
  const doc = new jsPDF('l', 'mm', 'a4');

  addReportHeader(doc, 'VENTA DETALLADA POR COLOR Y TIENDA');

  let filterText = '';
  if (filters.year) filterText += `Año: ${filters.year}  `;
  if (filters.store) filterText += `Tienda: ${filters.store}  `;
  if (filters.line) filterText += `Línea: ${filters.line}`;

  if (filterText) {
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(filterText, 14, 35);
  }

  let startY = filterText ? 40 : 35;

  data.forEach((storeData, storeIndex) => {
    if (storeIndex > 0 && startY > 150) {
      doc.addPage();
      startY = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185);
    doc.text(`■ ${storeData.storeName}`, 14, startY);

    const tableHeaders = ['Producto', ...MONTHS, 'Total'];

    const tableData = storeData.products.map(product => {
      const row: (string | number)[] = [product.productName];

      MONTHS.forEach(month => {
        row.push(product.monthlyData[month] || 0);
      });

      row.push(product.total);

      return row;
    });

    const totalsRow: (string | number)[] = ['TOTAL'];
    MONTHS.forEach(month => {
      const total = storeData.products.reduce((sum, p) => sum + (p.monthlyData[month] || 0), 0);
      totalsRow.push(total);
    });
    const grandTotal = storeData.products.reduce((sum, p) => sum + p.total, 0);
    totalsRow.push(grandTotal);

    tableData.push(totalsRow);

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: startY + 5,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [50, 50, 50],
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 50 }
      },
      didParseCell: (data) => {
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [230, 230, 230];
        }
      }
    });

    startY = (doc as any).lastAutoTable.finalY + 10;
  });

  addReportFooter(doc);
  doc.save(`detalle_productos_${new Date().getTime()}.pdf`);
};
