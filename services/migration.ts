import { legacyBackend } from './legacyBackend';
import { backend } from './backend';

const MIGRATION_KEY = 'sodi_migration_completed';

export async function checkAndMigrate(): Promise<{
  needsMigration: boolean;
  recordCount: number;
  migrated: boolean;
}> {
  const migrationCompleted = localStorage.getItem(MIGRATION_KEY);

  if (migrationCompleted === 'true') {
    return { needsMigration: false, recordCount: 0, migrated: false };
  }

  try {
    const legacyCount = await legacyBackend.count();

    if (legacyCount === 0) {
      localStorage.setItem(MIGRATION_KEY, 'true');
      return { needsMigration: false, recordCount: 0, migrated: false };
    }

    const legacyData = await legacyBackend.getAll();

    if (legacyData.length > 0) {
      await backend.addBatch(legacyData);
      await legacyBackend.clear();
      localStorage.setItem(MIGRATION_KEY, 'true');

      return {
        needsMigration: true,
        recordCount: legacyData.length,
        migrated: true
      };
    }

    localStorage.setItem(MIGRATION_KEY, 'true');
    return { needsMigration: false, recordCount: 0, migrated: false };

  } catch (error) {
    console.error('Error durante la migración:', error);
    return { needsMigration: false, recordCount: 0, migrated: false };
  }
}
