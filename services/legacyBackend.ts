import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SalesRecord } from '../types';

interface SodiDB extends DBSchema {
  sales: {
    key: number;
    value: SalesRecord;
  };
}

const DB_NAME = 'SodiAnalyticsDB';
const STORE_NAME = 'sales';
const DB_VERSION = 1;

class LegacyBackend {
  private dbPromise: Promise<IDBPDatabase<SodiDB>>;

  constructor() {
    this.dbPromise = openDB<SodiDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { autoIncrement: true });
        }
      },
    });
  }

  async getAll(): Promise<SalesRecord[]> {
    try {
      const db = await this.dbPromise;
      return await db.getAll(STORE_NAME);
    } catch (error) {
      console.error("Error fetching from legacy backend:", error);
      return [];
    }
  }

  async clear(): Promise<void> {
    const db = await this.dbPromise;
    await db.clear(STORE_NAME);
  }

  async count(): Promise<number> {
    const db = await this.dbPromise;
    return await db.count(STORE_NAME);
  }
}

export const legacyBackend = new LegacyBackend();
