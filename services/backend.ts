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

class LocalBackend {
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

  /**
   * Obtiene todos los registros almacenados en la base de datos local.
   */
  async getAll(): Promise<SalesRecord[]> {
    try {
      const db = await this.dbPromise;
      return await db.getAll(STORE_NAME);
    } catch (error) {
      console.error("Error fetching from backend:", error);
      return [];
    }
  }

  /**
   * Guarda un lote de registros en la base de datos.
   */
  async addBatch(records: SalesRecord[]): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    // Usamos Promise.all para insertar en paralelo (IndexedDB lo maneja eficientemente)
    await Promise.all(records.map(record => store.add(record)));
    await tx.done;
  }

  /**
   * Elimina todos los registros de la base de datos.
   */
  async clear(): Promise<void> {
    const db = await this.dbPromise;
    await db.clear(STORE_NAME);
  }

  /**
   * Cuenta el total de registros (más rápido que traerlos todos).
   */
  async count(): Promise<number> {
    const db = await this.dbPromise;
    return await db.count(STORE_NAME);
  }
}

// Singleton export
export const backend = new LocalBackend();
