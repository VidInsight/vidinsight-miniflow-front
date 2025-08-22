import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, User, Settings, ChevronDown, Edit, Trash2 } from 'lucide-react';
import { apiService } from '../services/api';
import ExecutionResults from './ExecutionResults';

export default function WorkflowModal({ workflow, isOpen, onClose, onEdit }) {
  // Workflow bilgisi local state
  const [localWorkflow, setLocalWorkflow] = useState(workflow);

  const [executionHistory, setExecutionHistory] = useState([]);
  const [averageDuration, setAverageDuration] = useState('Bilinmiyor');
  const [lastExecutionDate, setLastExecutionDate] = useState('Bilinmiyor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedExecutionId, setSelectedExecutionId] = useState(null);
  const [showExecutionResults, setShowExecutionResults] = useState(false);

  // Workflow silme işlemi
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Silme onayı için modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Düzenleme için state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(workflow?.name || '');
  const [editDescription, setEditDescription] = useState(workflow?.description || '');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  const handleDeleteWorkflow = async () => {
    if (!workflow?.id || deleting) return;
    setShowDeleteConfirm(true);
  };

  const confirmDeleteWorkflow = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiService.deleteWorkflow(workflow.id);
      setShowDeleteConfirm(false);
      if (onClose) onClose();
    } catch (err) {
      setDeleteError('Workflow silinirken hata oluştu');
      console.error('Error deleting workflow:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Workflow modal açıldığında execution geçmişini getir
  useEffect(() => {
    if (isOpen && workflow) {
      fetchExecutionHistory();
      setLocalWorkflow(workflow);
      setEditName(workflow?.name || '');
      setEditDescription(workflow?.description || '');
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

  // Eski edit butonu için fonksiyon (sadece onEdit'i çağırır)
  const handleEditClick = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(workflow);
    }
  };

  // Yeni düzenleme modalı için fonksiyonlar
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const handleOpenEditModal = () => {
    setEditName(workflow?.name || '');
    setEditDescription(workflow?.description || '');
    setEditError(null);
    setIsEditModalOpen(true);
  };
  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setEditError(null);
  };
  const handleEditSave = async () => {
    if (!editName.trim()) {
      setEditError('İsim boş olamaz');
      return;
    }
    setEditLoading(true);
    setEditError(null);
    try {
      await apiService.updateWorkflow(localWorkflow.id, {
        name: editName,
        description: editDescription,
      });
      // Local workflow bilgisini güncelle
      setLocalWorkflow(prev => ({ ...prev, name: editName, description: editDescription }));
      setIsEditModalOpen(false);
    } catch (err) {
      setEditError('Workflow güncellenirken hata oluştu');
      console.error('Error updating workflow:', err);
    } finally {
      setEditLoading(false);
    }
  };
  return (
    <>
      <div className="fixed inset-0 bg-gray-800/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[100vh] overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 border-b border-gray-200">
            {/* Başlık ve açıklama*/}
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 w-full">
              <div className="flex-1">
                <div className="flex items-center">
                  <h2 className="text-2xl font-bold text-gray-900 mr-2">{localWorkflow?.name}</h2>
                  {/* Icon button yanına */}
                  <button
                    onClick={handleOpenEditModal}
                    className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200"
                    title="Ad ve açıklamayı düzenle"
                    style={{ lineHeight: 0 }}
                  >
                    <Edit className="w-5 h-5 text-blue-600" />
                  </button>
                </div>
                <p className="text-gray-600 mt-1">{localWorkflow?.description}</p>
              </div>
              {/* Eski edit butonu başlığın yanında */}
              <button
                onClick={handleEditClick}
                className="mt-3 sm:mt-0 p-2  hover:bg-gray-100  rounded-full transition-all duration-200"
                title="Düzenle (onEdit)"
              >
                <Edit className="w-5 h-5" />
              </button>
            </div>
            {/* Delete butonu */}
            <button
              onClick={handleDeleteWorkflow}
              className={`mt-3 sm:mt-0 p-2 hover:bg-gray-100 rounded-full transition-colors ${deleting ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={deleting}
              title="Workflow'u Sil"
            >
              <Trash2 />
            </button>
            {/* Close butonu */}
            <button
              onClick={onClose}
              className="mt-3 sm:mt-0 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>



          <div className="p-6 space-y-8">
            {/* Silme hatası mesajı */}
            {deleteError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-sm">{deleteError}</p>
              </div>
            )}
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
                <p className="text-sm text-gray-600">{localWorkflow?.steps} adım</p>
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
                        className="text-blue-500 hover:text-blue-800 text-sm font-medium text-left"
                      >
                        Detaylar
                        <ChevronDown className="inline w-4 h-4 ml-1" />
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

      {/* Ad ve açıklama düzenleme modalı */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Workflow Adı ve Açıklamasını Düzenle</h3>
            <input
              type="text"
              className="text-lg font-bold text-gray-900 border-b border-gray-300 focus:outline-none focus:border-blue-500 w-full mb-2"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              disabled={editLoading}
              placeholder="Workflow adı"
            />
            <textarea
              className="text-gray-600 mt-1 border-b border-gray-300 focus:outline-none focus:border-blue-500 w-full resize-none"
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              disabled={editLoading}
              placeholder="Açıklama"
              rows={2}
            />
            {editError && <div className="text-red-600 text-sm mt-2">{editError}</div>}
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={handleEditSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={editLoading}
              >
                {editLoading ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button
                onClick={handleEditCancel}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                disabled={editLoading}
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Silme onay modalı */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Workflow'u silmek istediğinize emin misiniz?</h3>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Vazgeç
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={confirmDeleteWorkflow}
                disabled={deleting}
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}