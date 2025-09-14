import React from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

const ExecutionTable = ({ executions, loading, error, onRefresh }) => {
  // Status icon mapping
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
      case 'in_progress':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending':
      case 'waiting':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  // Status badge styling
  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'failed':
      case 'error':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'running':
      case 'in_progress':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'pending':
      case 'waiting':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Bilinmiyor';
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Format duration
  const formatDuration = (startedAt, endedAt) => {
    if (!startedAt || !endedAt) return 'Bilinmiyor';
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    const diffMs = end - start;
    
    if (diffMs < 0) return 'Bilinmiyor';
    
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffSecs < 60) return `${diffSecs}s`;
    if (diffMins < 60) return `${diffMins}m ${diffSecs % 60}s`;
    return `${diffHours}h ${diffMins % 60}m`;
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mr-2" />
          <span className="text-gray-300">Executions yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-400 mb-2">Executions yüklenirken hata oluştu</p>
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!executions || executions.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Executions</h3>
          <button
            onClick={onRefresh}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <Clock className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-400">Henüz execution bulunmuyor</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Executions</h3>
        <button
          onClick={onRefresh}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title="Yenile"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-2 text-gray-300 font-medium">ID</th>
              <th className="text-left py-3 px-2 text-gray-300 font-medium">Workflow</th>
              <th className="text-left py-3 px-2 text-gray-300 font-medium">Durum</th>
              <th className="text-left py-3 px-2 text-gray-300 font-medium">Başlangıç</th>
              <th className="text-left py-3 px-2 text-gray-300 font-medium">Bitiş</th>
              <th className="text-left py-3 px-2 text-gray-300 font-medium">Süre</th>
            </tr>
          </thead>
          <tbody>
            {executions.map((execution) => (
              <tr key={execution.id} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                <td className="py-3 px-2 text-gray-300 font-mono text-xs">
                  {execution.id}
                </td>
                <td className="py-3 px-2 text-white">
                  {execution.workflow_name || execution.workflow_id || 'Bilinmiyor'}
                </td>
                <td className="py-3 px-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(execution.status)}
                    <span className={getStatusBadge(execution.status)}>
                      {execution.status || 'Bilinmiyor'}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-2 text-gray-300">
                  {formatDate(execution.started_at)}
                </td>
                <td className="py-3 px-2 text-gray-300">
                  {formatDate(execution.ended_at)}
                </td>
                <td className="py-3 px-2 text-gray-300">
                  {formatDuration(execution.started_at, execution.ended_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {executions.length > 0 && (
        <div className="mt-4 text-xs text-gray-400 text-center">
          Toplam {executions.length} execution gösteriliyor
        </div>
      )}
    </div>
  );
};

export default ExecutionTable;
