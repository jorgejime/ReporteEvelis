import { SalesRecord, StoreReportData, MonthlyRankingData, DetailedProductData, ReportFilters } from '../types';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const generateStoreReportData = (
  records: SalesRecord[],
  filters: ReportFilters
): StoreReportData[] => {
  let filteredRecords = [...records];

  if (filters.year) {
    filteredRecords = filteredRecords.filter(r => {
      const recordYear = r.year || new Date(r.date).getFullYear();
      return recordYear === filters.year;
    });
  }

  if (filters.month !== null) {
    filteredRecords = filteredRecords.filter(r => {
      const recordMonth = new Date(r.date).getMonth();
      return recordMonth === filters.month;
    });
  }

  if (filters.store) {
    filteredRecords = filteredRecords.filter(r => r.store === filters.store);
  }

  if (filters.line) {
    filteredRecords = filteredRecords.filter(r => r.grupo === filters.line);
  }

  const storeMap = new Map<string, { lines: Map<string, number>; total: number }>();

  filteredRecords.forEach(record => {
    if (!storeMap.has(record.store)) {
      storeMap.set(record.store, { lines: new Map(), total: 0 });
    }

    const storeData = storeMap.get(record.store)!;
    const line = record.grupo || 'Sin Clasificar';

    storeData.lines.set(line, (storeData.lines.get(line) || 0) + record.qty);
    storeData.total += record.qty;
  });

  const result: StoreReportData[] = Array.from(storeMap.entries()).map(([storeName, data]) => {
    const lines: { [lineName: string]: number } = {};
    data.lines.forEach((qty, lineName) => {
      lines[lineName] = qty;
    });

    return {
      storeName,
      lines,
      total: data.total
    };
  });

  return result.sort((a, b) => b.total - a.total);
};

export const generateMonthlyRankingData = (
  records: SalesRecord[],
  filters: ReportFilters
): MonthlyRankingData[] => {
  let filteredRecords = [...records];

  if (filters.year) {
    filteredRecords = filteredRecords.filter(r => {
      const recordYear = r.year || new Date(r.date).getFullYear();
      return recordYear === filters.year;
    });
  }

  if (filters.line) {
    filteredRecords = filteredRecords.filter(r => r.grupo === filters.line);
  }

  const storeMap = new Map<string, { monthlyData: Map<string, number> }>();

  filteredRecords.forEach(record => {
    if (!storeMap.has(record.store)) {
      storeMap.set(record.store, { monthlyData: new Map() });
    }

    const storeData = storeMap.get(record.store)!;
    const month = MONTHS[new Date(record.date).getMonth()];

    storeData.monthlyData.set(month, (storeData.monthlyData.get(month) || 0) + record.qty);
  });

  const result: MonthlyRankingData[] = [];

  storeMap.forEach((data, storeName) => {
    const monthlyData: { [month: string]: number } = {};
    let totalYear = 0;

    MONTHS.forEach(month => {
      const qty = data.monthlyData.get(month) || 0;
      monthlyData[month] = qty;
      totalYear += qty;
    });

    result.push({
      storeName,
      monthlyData,
      totalYear,
      rankings: {},
      accumulatedRanking: 0,
      trend: 'stable'
    });
  });

  calculateRankings(result);

  return result.sort((a, b) => b.totalYear - a.totalYear);
};

const calculateRankings = (data: MonthlyRankingData[]): void => {
  MONTHS.forEach(month => {
    const monthData = data.map((store, index) => ({
      storeIndex: index,
      value: store.monthlyData[month] || 0
    })).sort((a, b) => b.value - a.value);

    monthData.forEach((item, rank) => {
      data[item.storeIndex].rankings[month] = rank + 1;
    });
  });

  data.forEach(store => {
    const rankValues = Object.values(store.rankings);
    const avgRank = rankValues.reduce((sum, r) => sum + r, 0) / rankValues.length;
    store.accumulatedRanking = Math.round(avgRank);

    const firstHalfRanks = rankValues.slice(0, Math.floor(rankValues.length / 2));
    const secondHalfRanks = rankValues.slice(Math.floor(rankValues.length / 2));

    const firstHalfAvg = firstHalfRanks.reduce((sum, r) => sum + r, 0) / firstHalfRanks.length;
    const secondHalfAvg = secondHalfRanks.reduce((sum, r) => sum + r, 0) / secondHalfRanks.length;

    if (secondHalfAvg < firstHalfAvg - 1) {
      store.trend = 'up';
    } else if (secondHalfAvg > firstHalfAvg + 1) {
      store.trend = 'down';
    } else {
      store.trend = 'stable';
    }
  });
};

export const generateDetailedProductData = (
  records: SalesRecord[],
  filters: ReportFilters
): DetailedProductData[] => {
  let filteredRecords = [...records];

  if (filters.year) {
    filteredRecords = filteredRecords.filter(r => {
      const recordYear = r.year || new Date(r.date).getFullYear();
      return recordYear === filters.year;
    });
  }

  if (filters.store) {
    filteredRecords = filteredRecords.filter(r => r.store === filters.store);
  }

  if (filters.line) {
    filteredRecords = filteredRecords.filter(r => r.grupo === filters.line);
  }

  const storeMap = new Map<string, Map<string, Map<string, number>>>();

  filteredRecords.forEach(record => {
    if (!storeMap.has(record.store)) {
      storeMap.set(record.store, new Map());
    }

    const storeProducts = storeMap.get(record.store)!;

    if (!storeProducts.has(record.product)) {
      storeProducts.set(record.product, new Map());
    }

    const productMonths = storeProducts.get(record.product)!;
    const month = MONTHS[new Date(record.date).getMonth()];

    productMonths.set(month, (productMonths.get(month) || 0) + record.qty);
  });

  const result: DetailedProductData[] = [];

  storeMap.forEach((storeProducts, storeName) => {
    const products: DetailedProductData['products'] = [];

    storeProducts.forEach((productMonths, productName) => {
      const monthlyData: { [month: string]: number } = {};
      let total = 0;

      MONTHS.forEach(month => {
        const qty = productMonths.get(month) || 0;
        monthlyData[month] = qty;
        total += qty;
      });

      products.push({
        productName,
        monthlyData,
        total
      });
    });

    products.sort((a, b) => b.total - a.total);

    result.push({
      storeName,
      products
    });
  });

  return result.sort((a, b) => {
    const totalA = a.products.reduce((sum, p) => sum + p.total, 0);
    const totalB = b.products.reduce((sum, p) => sum + p.total, 0);
    return totalB - totalA;
  });
};

export const getUniqueYears = (records: SalesRecord[]): number[] => {
  const years = new Set<number>();
  records.forEach(r => {
    const year = r.year || new Date(r.date).getFullYear();
    years.add(year);
  });
  return Array.from(years).sort((a, b) => b - a);
};

export const getUniqueStores = (records: SalesRecord[]): string[] => {
  const stores = new Set<string>();
  records.forEach(r => stores.add(r.store));
  return Array.from(stores).sort();
};

export const getUniqueLines = (records: SalesRecord[]): string[] => {
  const lines = new Set<string>();
  records.forEach(r => {
    if (r.grupo) {
      lines.add(r.grupo);
    }
  });
  return Array.from(lines).sort();
};

export { MONTHS };
