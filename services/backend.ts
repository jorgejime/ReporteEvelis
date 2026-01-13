import { supabase } from './supabaseClient';
import { SalesRecord, AIReport, SalesMetrics, UploadedFile } from '../types';

class SupabaseBackend {
  private tableName = 'sales_records';

  async getAll(): Promise<SalesRecord[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('ean, store, date, product, qty, price, total')
        .order('date', { ascending: true });

      if (error) {
        console.error("Error fetching from Supabase:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching from backend:", error);
      return [];
    }
  }

  async addBatch(records: SalesRecord[]): Promise<void> {
    if (records.length === 0) return;

    const batchSize = 500;
    const batches = [];

    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const { error } = await supabase
        .from(this.tableName)
        .insert(batch);

      if (error) {
        console.error("Error inserting batch to Supabase:", error);
        throw error;
      }
    }
  }

  async clear(): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .neq('id', 0);

    if (error) {
      console.error("Error clearing Supabase table:", error);
      throw error;
    }
  }

  async count(): Promise<number> {
    const { count, error } = await supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error("Error counting records:", error);
      return 0;
    }

    return count || 0;
  }

  async saveAIReport(content: string, metrics: SalesMetrics): Promise<AIReport | null> {
    try {
      const title = `Reporte ${metrics.dateRange.start} - ${metrics.dateRange.end}`;

      const { data, error } = await supabase
        .from('ai_reports')
        .insert({
          title,
          content,
          metrics_summary: {
            totalRevenue: metrics.totalRevenue,
            totalUnits: metrics.totalUnits,
            averageOrderValue: metrics.averageOrderValue
          },
          date_range_start: metrics.dateRange.start,
          date_range_end: metrics.dateRange.end
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving AI report:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error saving report:", error);
      return null;
    }
  }

  async getAIReports(): Promise<AIReport[]> {
    try {
      const { data, error } = await supabase
        .from('ai_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching AI reports:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching reports:", error);
      return [];
    }
  }

  async deleteAIReport(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_reports')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting AI report:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error deleting report:", error);
      return false;
    }
  }

  async createFileRecord(filename: string, fileHash: string, fileSize: number): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('uploaded_files')
        .insert({
          filename,
          file_hash: fileHash,
          file_size: fileSize,
          records_count: 0
        })
        .select('id')
        .single();

      if (error) {
        console.error("Error creating file record:", error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error("Error creating file record:", error);
      return null;
    }
  }

  async addBatchWithFileId(records: SalesRecord[], fileId: string): Promise<void> {
    if (records.length === 0) return;

    const batchSize = 500;
    const batches = [];

    const recordsWithFileId = records.map(record => ({
      ...record,
      file_id: fileId
    }));

    for (let i = 0; i < recordsWithFileId.length; i += batchSize) {
      batches.push(recordsWithFileId.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const { error } = await supabase
        .from(this.tableName)
        .insert(batch);

      if (error) {
        console.error("Error inserting batch to Supabase:", error);
        throw error;
      }
    }

    await supabase
      .from('uploaded_files')
      .update({ records_count: records.length })
      .eq('id', fileId);
  }

  async getUploadedFiles(): Promise<UploadedFile[]> {
    try {
      const { data, error } = await supabase
        .from('uploaded_files')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error("Error fetching uploaded files:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching uploaded files:", error);
      return [];
    }
  }

  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('uploaded_files')
        .delete()
        .eq('id', fileId);

      if (error) {
        console.error("Error deleting file:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      return false;
    }
  }

  async generateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }
}

export const backend = new SupabaseBackend();
