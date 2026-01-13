import React, { useEffect, useState } from 'react';
import { FileText, Trash2, Calendar, Database, HardDrive } from 'lucide-react';
import { backend } from '../services/backend';
import { UploadedFile } from '../types';

interface UploadedFilesListProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  onFilesChange: () => void;
}

export const UploadedFilesList: React.FC<UploadedFilesListProps> = ({ onShowToast, onFilesChange }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const data = await backend.getUploadedFiles();
      setFiles(data);
    } catch (error) {
      onShowToast('Error al cargar archivos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (file: UploadedFile) => {
    if (!confirm(`¿Estás seguro de eliminar "${file.filename}"? Se eliminarán ${file.records_count} registros.`)) {
      return;
    }

    setDeleting(file.id);
    try {
      const success = await backend.deleteFile(file.id);
      if (success) {
        setFiles(files.filter(f => f.id !== file.id));
        onShowToast(`Archivo "${file.filename}" eliminado exitosamente`, 'success');
        onFilesChange();
      } else {
        onShowToast('Error al eliminar el archivo', 'error');
      }
    } catch (error) {
      onShowToast('Error al eliminar el archivo', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Cargando archivos...</div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl border-2 border-dashed border-slate-200">
        <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <p className="text-slate-500 font-medium">No hay archivos subidos</p>
        <p className="text-sm text-slate-400 mt-1">Los archivos que subas aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          Archivos Subidos ({files.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {files.map((file) => (
          <div
            key={file.id}
            className="bg-white border-2 border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-all hover:shadow-md group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="bg-gradient-to-br from-blue-100 to-cyan-100 p-2.5 rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-800 truncate" title={file.filename}>
                    {file.filename}
                  </h4>
                  <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Calendar className="w-3 h-3" />
                      {formatDate(file.uploaded_at)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Database className="w-3 h-3" />
                      {file.records_count.toLocaleString()} registros
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <HardDrive className="w-3 h-3" />
                      {formatFileSize(file.file_size)}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(file)}
                disabled={deleting === file.id}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ml-2"
              >
                <Trash2 className="w-3 h-3" />
                {deleting === file.id ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <p className="text-sm text-blue-800 flex items-center gap-2">
          <Database className="w-4 h-4" />
          <span>
            <strong>Total:</strong> {files.reduce((acc, f) => acc + f.records_count, 0).toLocaleString()} registros en {files.length} archivo(s)
          </span>
        </p>
      </div>
    </div>
  );
};
