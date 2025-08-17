import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, User, Settings, ChevronRight } from 'lucide-react';
import { apiService } from '../services/api';
import ExecutionResults from './ExecutionResults';

export default function WorkflowModal({ workflow, isOpen, onClose }) {
  const [executionHistory, setExecutionHistory] = useState([]);
  const [averageDuration, setAverageDuration] = useState('Bilinmiyor');
  const [lastExecutionDate, setLastExecutionDate] = useState('Bilinmiyor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedExecutionId, setSelectedExecutionId] = useState(null);
  const [showExecutionResults, setShowExecutionResults] = useState(false);

  // Workflow modal açıldığında execution geçmişini getir
  useEffect(() => {
    if (isOpen && workflow) {
      fetchExecutionHistory();
    }
  }, [isOpen, workflow]);

  const fetchExecutionHistory = async () => {
    if (!workflow?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiService.getWorkflowExecutions(workflow.id);
      setExecutionHistory(result.executions || []);
      setAverageDuration(result.average_duration || 'Bilinmiyor');
      setLastExecutionDate(result.last_execution_date || 'Bilinmiyor');
    } catch (err) {
      console.error('Error fetching execution history:', err);
      setError('Execution geçmişi yüklenirken hata oluştu');
      setExecutionHistory([]);
      setAverageDuration('Bilinmiyor');
      setLastExecutionDate('Bilinmiyor');
    } finally {
      setLoading(false);
    }
  };

  const handleShowExecutionResults = (executionId) => {
    console.log('Opening execution results for:', executionId);
    setSelectedExecutionId(executionId);
    setShowExecutionResults(true);
  };

  const handleCloseExecutionResults = () => {
    setShowExecutionResults(false);
    setSelectedExecutionId(null);
  };

  if (!isOpen || !workflow) return null;

  const workflowSteps = [
    { id: 1, name: 'Veri Doğrulama', status: 'completed', duration: '30s' },
    { id: 2, name: 'İşlem Yapma', status: 'completed', duration: '1m 20s' },
    { id: 3, name: 'Rapor Oluşturma', status: 'running', duration: '25s' },
    { id: 4, name: 'Bildirim Gönderme', status: 'pending', duration: '-' },
  ];

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Başarılı';
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{workflow.name}</h2>
              <p className="text-gray-600 mt-1">{workflow.description}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* Workflow Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Clock className="w-5 h-5 text-gray-500 mr-2" />
                  <span className="font-medium text-gray-900">Son Çalışma</span>
                </div>
                <p className="text-sm text-gray-600">
                  {loading ? 'Hesaplanıyor...' : lastExecutionDate}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Calendar className="w-5 h-5 text-gray-500 mr-2" />
                  <span className="font-medium text-gray-900">Ortalama Süre</span>
                </div>
                <p className="text-sm text-gray-600">
                  {loading ? 'Hesaplanıyor...' : averageDuration}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Settings className="w-5 h-5 text-gray-500 mr-2" />
                  <span className="font-medium text-gray-900">Toplam Adım</span>
                </div>
                <p className="text-sm text-gray-600">{workflow.steps} adım</p>
              </div>
            </div>

            {/* Current Steps */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mevcut Adımlar</h3>
              <div className="space-y-3">
                {workflowSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-4 ${
                        step.status === 'completed' ? 'bg-green-500 text-white' :
                        step.status === 'running' ? 'bg-blue-500 text-white' :
                        'bg-gray-300 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{step.name}</h4>
                        <p className="text-sm text-gray-600">Süre: {step.duration}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      step.status === 'completed' ? 'bg-green-100 text-green-800' :
                      step.status === 'running' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {step.status === 'completed' ? 'Tamamlandı' :
                       step.status === 'running' ? 'Çalışıyor' : 'Bekliyor'}
                    </div>
                    {index < workflowSteps.length - 1 && (
                      <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Execution History */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Çalışma Geçmişi</h3>
                {loading && (
                  <div className="text-sm text-gray-500">Yükleniyor...</div>
                )}
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <div className="grid grid-cols-5 gap-4 p-4 bg-gray-100 text-sm font-medium text-gray-700">
                  <span>Tarih & Saat</span>
                  <span>Durum</span>
                  <span>Süre</span>
                  <span>Çalışan Node</span>
                  <span></span>
                </div>
                
                {loading ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    Execution geçmişi yükleniyor...
                  </div>
                ) : executionHistory.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    Henüz execution geçmişi bulunmuyor
                  </div>
                ) : (
                  executionHistory.map((execution) => (
                    <div key={execution.id} className="grid grid-cols-5 gap-4 p-4 border-t border-gray-200">
                      <span className="text-sm text-gray-900">{execution.date}</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium w-fit ${getStatusColor(execution.status)}`}>
                        {getStatusText(execution.status)}
                      </span>
                      <span className="text-sm text-gray-600">{execution.duration}</span>
                      <span className="text-sm text-gray-600">{execution.executed_nodes} / {execution.executed_nodes + execution.pending_nodes}</span>
                      <button 
                        onClick={() => handleShowExecutionResults(execution.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium text-left"
                      >
                        Detaylar
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Execution Results Modal */}
      {showExecutionResults && selectedExecutionId && (
        <ExecutionResults
          executionId={selectedExecutionId}
          isOpen={showExecutionResults}
          onClose={handleCloseExecutionResults}
        />
      )}
    </>
  );
}