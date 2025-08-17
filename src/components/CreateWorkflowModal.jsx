import React, { useState } from 'react';
import { X, Plus, Loader } from 'lucide-react';
import { apiService } from '../services/api';

export default function CreateWorkflowModal({ isOpen, onClose, onWorkflowCreated }) {
  const [workflowName, setWorkflowName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!workflowName.trim()) {
      setError('Workflow adı gereklidir');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      // API'ye create isteği gönder
      const workflowData = {
        name: workflowName.trim(),
        description: description.trim() || 'Yeni oluşturulan workflow',
        priority: 0,
        nodes: [],
        edges: []
      };

      console.log('🔄 Creating workflow:', workflowData);
      
      const result = await apiService.createWorkflow(workflowData);
      
      if (result.success) {
        console.log('✅ Workflow created successfully:', result);
        onWorkflowCreated(result.workflow);
        onClose();
      } else {
        throw new Error(result.message || 'Workflow oluşturulamadı');
      }
    } catch (error) {
      console.error('❌ Error creating workflow:', error);
      setError(error.message || 'Workflow oluşturulurken hata oluştu');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setWorkflowName('');
      setDescription('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Yeni Workflow</h2>
              <p className="text-sm text-gray-600">Yeni bir workflow oluştur</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isCreating}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Workflow Name */}
          <div>
            <label htmlFor="workflowName" className="block text-sm font-medium text-gray-700 mb-2">
              Workflow Adı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="workflowName"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="Örn: Veri İşleme Workflow'u"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isCreating}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Workflow'un ne yaptığını açıkla..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isCreating}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isCreating}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isCreating || !workflowName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isCreating ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Oluşturuluyor...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Oluştur</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
