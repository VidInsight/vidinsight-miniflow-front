import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Play, X, BarChart3, Activity, Timer, AlertTriangle } from 'lucide-react';
import { apiService } from '../services/api';

const ExecutionResults = ({ executionId, isOpen, onClose }) => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && executionId) {
      fetchExecutionResults();
    }
  }, [isOpen, executionId]);

  const fetchExecutionResults = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiService.getExecutionResults(executionId);
      setResults(data);
    } catch (err) {
      console.error('Error fetching execution results:', err);
      setError('Execution sonuçları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'success':
        return 'Başarılı';
      case 'error':
      case 'failed':
        return 'Başarısız';
      case 'running':
        return 'Çalışıyor';
      case 'pending':
        return 'Bekliyor';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Bilinmiyor';
    return new Date(dateString).toLocaleString('tr-TR');
  };

  const isExecutionFailed = () => {
    return results?.execution_status === 'ExecutionStatus.FAILED' || 
           results?.execution_status === 'FAILED';
  };

  const hasDetailedResults = () => {
    return results?.node_results && results?.execution_flow && results?.total_nodes;
  };

  return (
    <div className="fixed inset-0 backdrop-blur bg-grey bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Play className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Execution Detayları</h2>
              <p className="text-sm text-gray-500">ID: {executionId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
              <span className="text-gray-600">Execution sonuçları yükleniyor...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          ) : results ? (
            <div className="space-y-6">
              {/* Execution Status */}
              <div className={`p-4 rounded-lg border ${isExecutionFailed() ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center space-x-2">
                  {isExecutionFailed() ? (
                    <XCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  <span className="font-medium">
                    {isExecutionFailed() ? 'Execution Başarısız Oldu' : 'Execution Başarıyla Tamamlandı'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Durum: {results.execution_status}
                </p>
              </div>

              {/* Execution Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center mb-2">
                    <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-900">Toplam Node</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {hasDetailedResults() ? results.total_nodes : results.results?.total || 0}
                  </p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-900">Başarılı</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {hasDetailedResults() ? results.summary.success : results.results?.success || 0}
                  </p>
                </div>
                
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center mb-2">
                    <XCircle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="font-medium text-red-900">Başarısız</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900">
                    {hasDetailedResults() ? results.summary.failure : results.results?.failure || 0}
                  </p>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="font-medium text-yellow-900">İptal Edilen</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-900">
                    {hasDetailedResults() ? (results.summary.cancelled || 0) : results.results?.cancelled || 0}
                  </p>
                </div>
              </div>

              {/* Failed Execution Message */}
              {isExecutionFailed() && !hasDetailedResults() && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <XCircle className="w-6 h-6 text-red-500 mr-2" />
                    <h3 className="text-lg font-semibold text-red-900">Execution Başarısız</h3>
                  </div>
                  <p className="text-red-800 mb-3">
                    Bu execution başarısız olduğu için detaylı node bilgileri mevcut değil.
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-red-300">
                    <h4 className="font-medium text-red-900 mb-2">Özet Bilgiler:</h4>
                    <ul className="text-sm text-red-800 space-y-1">
                      <li>• Toplam Node: {results.results?.total || 0}</li>
                      <li>• Başarılı: {results.results?.success || 0}</li>
                      <li>• Başarısız: {results.results?.failure || 0}</li>
                      <li>• İptal Edilen: {results.results?.cancelled || 0}</li>
                      <li>• Timeout: {results.results?.timeout || 0}</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Node Results - Only show if detailed results exist */}
              {hasDetailedResults() && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Node Sonuçları
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(results.node_results).map(([nodeName, nodeResult]) => (
                      <div key={nodeName} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{nodeName}</h4>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="text-sm text-gray-600">
                          <strong>Sonuç:</strong> {JSON.stringify(nodeResult.result)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Execution Flow - Only show if detailed results exist */}
              {hasDetailedResults() && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Execution Akışı</h3>
                  <div className="space-y-3">
                    {results.execution_flow.map((flow, index) => (
                      <div key={flow.node_id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              flow.status === 'success' ? 'bg-green-500 text-white' :
                              flow.status === 'error' ? 'bg-red-500 text-white' :
                              'bg-gray-300 text-gray-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{flow.node_name}</h4>
                              <p className="text-sm text-gray-500">ID: {flow.node_id}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(flow.status)}`}>
                              {getStatusText(flow.status)}
                            </span>
                            <span className="text-sm text-gray-600">
                              {apiService.calculateNodeDuration(flow.started_at, flow.ended_at)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <strong>Başlangıç:</strong> {formatDate(flow.started_at)}
                          </div>
                          <div>
                            <strong>Bitiş:</strong> {formatDate(flow.ended_at)}
                          </div>
                        </div>
                        
                        {flow.has_result && (
                          <div className="mt-2 text-sm text-green-600">
                            ✓ Sonuç mevcut
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Consolidated Time - Only show if detailed results exist */}
              {hasDetailedResults() && results.consolidated_at && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center mb-2">
                    <Timer className="w-5 h-5 text-gray-600 mr-2" />
                    <span className="font-medium text-gray-900">Tamamlanma Zamanı</span>
                  </div>
                  <p className="text-sm text-gray-600">{formatDate(results.consolidated_at)}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecutionResults; 