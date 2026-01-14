import { SalesRecord } from '../types';

declare global {
  interface Window {
    XLSX: any;
  }
}

const COLUMN_MAPPINGS = {
  ean: ['EAN', 'Código EAN del item', 'Codigo EAN', 'ean', 'código', 'codigo'],
  store: ['TIENDA', 'Descripción', 'Punto de venta', 'Almacén', 'tienda', 'almacen', 'store', 'sucursal'],
  date: ['FECHA', 'Fecha Inicial', 'Fecha', 'fecha', 'date', 'Fecha de venta'],
  grupo: ['GRUPO', 'Grupo', 'grupo', 'category', 'categoria', 'categoría', 'Categoría'],
  product: ['DESCRIPCION', 'Descripción del Ítem', 'Producto', 'producto', 'descripcion', 'product', 'item', 'Item'],
  qty: ['Cantidad Vendida', 'Cantidad', 'cantidad', 'qty', 'quantity', 'unidades', 'Unidades'],
  price: ['Precio neto al consumido sin impuestos', 'Precio', 'precio', 'price', 'valor', 'Valor']
};

const findColumnValue = (rowData: Record<string, any>, possibleNames: string[]): any => {
  for (const name of possibleNames) {
    if (rowData[name] !== undefined && rowData[name] !== null && rowData[name] !== '') {
      return rowData[name];
    }
  }
  return undefined;
};

const processRawRows = (headers: string[], rows: any[]): SalesRecord[] => {
  console.log(`[PROCESSING] Procesando ${rows.length} filas con ${headers.length} columnas`);
  console.log('[PROCESSING] Columnas detectadas:', headers);

  const processedRecords: SalesRecord[] = [];
  let skippedCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    let rowData: Record<string, any> = {};
    if (Array.isArray(row)) {
      headers.forEach((h, idx) => {
        if (h) rowData[h] = row[idx];
      });
    } else {
      rowData = row;
    }

    const ean = findColumnValue(rowData, COLUMN_MAPPINGS.ean);
    const store = findColumnValue(rowData, COLUMN_MAPPINGS.store);
    const date = findColumnValue(rowData, COLUMN_MAPPINGS.date);
    const grupo = findColumnValue(rowData, COLUMN_MAPPINGS.grupo);
    const product = findColumnValue(rowData, COLUMN_MAPPINGS.product);
    const qtyRaw = findColumnValue(rowData, COLUMN_MAPPINGS.qty);
    const priceRaw = findColumnValue(rowData, COLUMN_MAPPINGS.price);

    if (!product || !store) {
      skippedCount++;
      continue;
    }

    const qty = typeof qtyRaw === 'number' ? qtyRaw : parseInt(String(qtyRaw).replace(/,/g, '').replace(/\./g, '') || '0');
    const price = priceRaw ? (typeof priceRaw === 'number' ? priceRaw : parseFloat(String(priceRaw).replace(/,/g, '') || '0')) : undefined;

    if (isNaN(qty) || qty === 0) {
      skippedCount++;
      continue;
    }

    const dateStr = String(date || '');
    let year: number | undefined;

    if (dateStr.match(/^\d{1,2}\/\d{1,2}\/(\d{4})$/)) {
      year = parseInt(dateStr.split('/')[2]);
    } else if (dateStr.match(/^(\d{4})-\d{1,2}-\d{1,2}$/)) {
      year = parseInt(dateStr.split('-')[0]);
    } else if (dateStr.match(/^(\d{4})\/\d{1,2}\/\d{1,2}$/)) {
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

    processedRecords.push(record);
  }

  console.log(`[PROCESSING] Procesados: ${processedRecords.length} registros válidos, ${skippedCount} omitidos`);
  return processedRecords;
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
