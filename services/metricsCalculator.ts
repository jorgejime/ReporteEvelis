import { SalesRecord, SalesMetrics, GroupMetrics, MonthMetrics, StoreMetrics, ProductGroup } from '../types';

export const calculateMetrics = (records: SalesRecord[], productGroups: ProductGroup[]): SalesMetrics => {
  if (!records || records.length === 0) {
    return {
      totalUnits: 0,
      uniqueStores: 0,
      uniqueProducts: 0,
      uniqueGroups: 0,
      averageUnitsPerDay: 0,
      topStores: [],
      topProducts: [],
      topGroups: [],
      timeline: [],
      dateRange: { start: '-', end: '-' },
      byGroup: [],
      byMonth: [],
      byStore: []
    };
  }

  const totalUnits = records.reduce((sum, r) => sum + r.qty, 0);
  const uniqueStores = new Set(records.map(r => r.store)).size;
  const uniqueProducts = new Set(records.map(r => r.product)).size;
  const uniqueGroups = new Set(records.map(r => r.grupo).filter(g => g)).size;

  const sortedByDate = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const startDate = sortedByDate[0].date;
  const endDate = sortedByDate[sortedByDate.length - 1].date;

  const daysDiff = Math.max(1, Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  ));
  const averageUnitsPerDay = totalUnits / daysDiff;

  const storeMap = new Map<string, number>();
  records.forEach(r => {
    storeMap.set(r.store, (storeMap.get(r.store) || 0) + r.qty);
  });
  const topStores = Array.from(storeMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const productMap = new Map<string, number>();
  records.forEach(r => {
    productMap.set(r.product, (productMap.get(r.product) || 0) + r.qty);
  });
  const topProducts = Array.from(productMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const groupMap = new Map<string, number>();
  records.forEach(r => {
    if (r.grupo) {
      groupMap.set(r.grupo, (groupMap.get(r.grupo) || 0) + r.qty);
    }
  });
  const topGroups = Array.from(groupMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const dateMap = new Map<string, number>();
  records.forEach(r => {
    dateMap.set(r.date, (dateMap.get(r.date) || 0) + r.qty);
  });
  const timeline = Array.from(dateMap.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const byGroup = calculateGroupMetrics(records, productGroups);
  const byMonth = calculateMonthMetrics(records);
  const byStore = calculateStoreMetrics(records);

  return {
    totalUnits,
    uniqueStores,
    uniqueProducts,
    uniqueGroups,
    averageUnitsPerDay,
    topStores,
    topProducts,
    topGroups,
    timeline,
    dateRange: { start: startDate, end: endDate },
    byGroup,
    byMonth,
    byStore
  };
};

const calculateGroupMetrics = (records: SalesRecord[], productGroups: ProductGroup[]): GroupMetrics[] => {
  const totalUnits = records.reduce((sum, r) => sum + r.qty, 0);
  const groupMap = new Map<string, { units: number; products: Set<string>; stores: Set<string> }>();
  const colorMap = new Map<string, string>();

  if (productGroups && productGroups.length > 0) {
    productGroups.forEach(pg => {
      colorMap.set(pg.group_name, pg.color);
    });
  }

  records.forEach(r => {
    const grupo = r.grupo || 'Sin Clasificar';
    if (!groupMap.has(grupo)) {
      groupMap.set(grupo, {
        units: 0,
        products: new Set(),
        stores: new Set()
      });
    }
    const groupData = groupMap.get(grupo)!;
    groupData.units += r.qty;
    groupData.products.add(r.product);
    groupData.stores.add(r.store);
  });

  return Array.from(groupMap.entries())
    .map(([groupName, data]) => ({
      groupName,
      totalUnits: data.units,
      uniqueProducts: data.products.size,
      uniqueStores: data.stores.size,
      percentage: (data.units / totalUnits) * 100,
      color: colorMap.get(groupName) || '#6b7280'
    }))
    .sort((a, b) => b.totalUnits - a.totalUnits);
};

const calculateMonthMetrics = (records: SalesRecord[]): MonthMetrics[] => {
  const monthMap = new Map<string, {
    units: number;
    products: Set<string>;
    stores: Set<string>;
    byGroup: Map<string, number>;
  }>();

  records.forEach(r => {
    const date = new Date(r.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        units: 0,
        products: new Set(),
        stores: new Set(),
        byGroup: new Map()
      });
    }

    const monthData = monthMap.get(monthKey)!;
    monthData.units += r.qty;
    monthData.products.add(r.product);
    monthData.stores.add(r.store);

    const grupo = r.grupo || 'Sin Clasificar';
    monthData.byGroup.set(grupo, (monthData.byGroup.get(grupo) || 0) + r.qty);
  });

  return Array.from(monthMap.entries())
    .map(([monthKey, data]) => {
      const [yearStr, monthStr] = monthKey.split('-');
      const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
      const monthLabel = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });

      return {
        month: monthLabel,
        year: parseInt(yearStr),
        totalUnits: data.units,
        uniqueProducts: data.products.size,
        uniqueStores: data.stores.size,
        byGroup: Array.from(data.byGroup.entries())
          .map(([groupName, units]) => ({ groupName, units }))
          .sort((a, b) => b.units - a.units)
      };
    })
    .sort((a, b) => {
      const aDate = new Date(a.year, 0, 1);
      const bDate = new Date(b.year, 0, 1);
      return aDate.getTime() - bDate.getTime();
    });
};

const calculateStoreMetrics = (records: SalesRecord[]): StoreMetrics[] => {
  const storeMap = new Map<string, {
    units: number;
    products: Set<string>;
    byGroup: Map<string, number>;
    byMonth: Map<string, number>;
  }>();

  records.forEach(r => {
    if (!storeMap.has(r.store)) {
      storeMap.set(r.store, {
        units: 0,
        products: new Set(),
        byGroup: new Map(),
        byMonth: new Map()
      });
    }

    const storeData = storeMap.get(r.store)!;
    storeData.units += r.qty;
    storeData.products.add(r.product);

    const grupo = r.grupo || 'Sin Clasificar';
    storeData.byGroup.set(grupo, (storeData.byGroup.get(grupo) || 0) + r.qty);

    const date = new Date(r.date);
    const monthKey = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short' });
    storeData.byMonth.set(monthKey, (storeData.byMonth.get(monthKey) || 0) + r.qty);
  });

  return Array.from(storeMap.entries())
    .map(([storeName, data]) => ({
      storeName,
      totalUnits: data.units,
      uniqueProducts: data.products.size,
      byGroup: Array.from(data.byGroup.entries())
        .map(([groupName, units]) => ({ groupName, units }))
        .sort((a, b) => b.units - a.units)
        .slice(0, 5),
      byMonth: Array.from(data.byMonth.entries())
        .map(([month, units]) => ({ month, units }))
        .sort((a, b) => {
          return 0;
        })
        .slice(0, 12)
    }))
    .sort((a, b) => b.totalUnits - a.totalUnits);
};
