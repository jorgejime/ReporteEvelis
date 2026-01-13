import { SalesRecord } from '../types';

declare global {
  interface Window {
    XLSX: any;
  }
}

const processRawRows = (headers: string[], rows: any[]): SalesRecord[] => {
  return rows.map(row => {
    let rowData: Record<string, any> = {};
    if (Array.isArray(row)) {
      headers.forEach((h, i) => {
        if (h) rowData[h] = row[i];
      });
    } else {
      rowData = row;
    }

    const ean = rowData['EAN'] || rowData['Código EAN del item'];
    const store = rowData['TIENDA'] || rowData['Descripción'] || rowData['Punto de venta'] || rowData['Almacén'];
    const date = rowData['FECHA'] || rowData['Fecha Inicial'] || rowData['Fecha'];
    const grupo = rowData['GRUPO'] || rowData['Grupo'];
    const product = rowData['DESCRIPCION'] || rowData['Descripción del Ítem'] || rowData['Producto'];
    const qtyRaw = rowData['Cantidad Vendida'] || rowData['Cantidad'];
    const priceRaw = rowData['Precio neto al consumido sin impuestos'] || rowData['Precio'];

    if (!product || !store) return null;

    const qty = typeof qtyRaw === 'number' ? qtyRaw : parseInt(String(qtyRaw).replace(/,/g, '') || '0');
    const price = priceRaw ? (typeof priceRaw === 'number' ? priceRaw : parseInt(String(priceRaw).replace(/,/g, '') || '0')) : undefined;

    if (isNaN(qty) || qty === 0) return null;

    const dateStr = String(date);
    let year: number | undefined;

    if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      year = parseInt(dateStr.split('/')[2]);
    } else if (dateStr.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
      year = parseInt(dateStr.split('-')[0]);
    } else if (dateStr.match(/^\d{4}\/\d{1,2}\/\d{1,2}$/)) {
      year = parseInt(dateStr.split('/')[0]);
    }

    const record: SalesRecord = {
      store: String(store),
      date: dateStr,
      product: String(product),
      qty
    };

    if (year && !isNaN(year)) record.year = year;
    if (ean) record.ean = String(ean);
    if (grupo) record.grupo = String(grupo);
    if (price !== undefined && !isNaN(price)) {
      record.price = price;
      record.total = qty * price;
    }

    return record;
  }).filter((item): item is SalesRecord => item !== null && item.qty > 0);
};

const parseCSV = (csvText: string): SalesRecord[] => {
  const lines = csvText.split(/\r\n|\n/);
  const headerIndex = lines.findIndex(line =>
    line.startsWith('FECHA') || line.startsWith('EAN,') || line.startsWith('EAN;')
  );
  if (headerIndex === -1) throw new Error("No se encontró la cabecera en el CSV.");

  const headers = lines[headerIndex].split(',').map(h => h.trim());
  const data: any[] = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const currentLine = lines[i];
    if (!currentLine) continue;
    const values = currentLine.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if (values.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        let val = values[index] ? values[index].replace(/^"|"$/g, '').trim() : '';
        row[header] = val;
      });
      data.push(row);
    }
  }
  return processRawRows(headers, data);
};

export const processSingleFile = (file: File): Promise<{ fileName: string, data: SalesRecord[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    reader.onload = (e) => {
      try {
        let cleanData: SalesRecord[] = [];
        if (isExcel) {
          if (!window.XLSX) throw new Error("Motor Excel no cargado.");
          const data = new Uint8Array(e.target.result as ArrayBuffer);
          const workbook = window.XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

          const headerRowIndex = jsonData.findIndex((row: any[]) =>
            row && row.some(cell =>
              String(cell).includes('FECHA') ||
              String(cell).includes('EAN') ||
              String(cell).includes('TIENDA')
            )
          );
          if (headerRowIndex === -1) throw new Error(`Sin cabecera válida en ${file.name}`);

          const headers = jsonData[headerRowIndex] as string[];
          const rows = jsonData.slice(headerRowIndex + 1);
          cleanData = processRawRows(headers, rows);
        } else {
          cleanData = parseCSV(e.target.result as string);
        }
        resolve({ fileName: file.name, data: cleanData });
      } catch (err: any) {
        reject({ fileName: file.name, error: err.message });
      }
    };

    if (isExcel) reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
  });
};
