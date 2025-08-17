import React, { useState, useEffect } from 'react';
import { Settings, X, Save, Trash2, Copy, Check } from 'lucide-react';
import { getIconComponent } from '../utils/iconMapper';
import { apiService } from '../services/api';

const NodeConfigPanel = ({ node, fromSelectedNodes, onClose, onUpdateNode, onDeleteNode, workflowId, nodes }) => {
  const [config, setConfig] = useState({});
  const [nodeName, setNodeName] = useState('');
  const [copiedItems, setCopiedItems] = useState(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    console.log("Node Config Panel", node);
    setConfig(node.data.settings || {});
    setNodeName(node.data.label || node.id);
    setNameError(''); // Reset error when node changes
  }, [node]);

  // ✅ İsim kontrolü
  const validateNodeName = (newName) => {
    if (!newName || newName.trim() === '') {
      return 'Node adı boş olamaz';
    }
    
    // Mevcut node'larda aynı isim var mı kontrol et (kendisi hariç)
    const existingNode = nodes.find(n => 
      n.id !== node.id && n.data.label === newName.trim()
    );
    
    if (existingNode) {
      return `"${newName}" ismi zaten kullanılıyor`;
    }
    
    return '';
  };

  const handleSave = async () => {
    // İsim kontrolü yap
    const nameValidationError = validateNodeName(nodeName);
    if (nameValidationError) {
      setNameError(nameValidationError);
      return;
    }

    setIsSaving(true);
    setNameError(''); // Clear error when saving
    
    try {
      // Local state'i güncelle - API çağrısı updateNodeData'da yapılacak
      onUpdateNode(node.id, { 
        settings: config,
        label: nodeName.trim()
      });
      
      onClose();
    } catch (error) {
      console.error('❌ Error updating node:', error);
      alert('Node güncellenirken hata oluştu: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    onDeleteNode(node.id);
  };

  // ✅ Kopyalama fonksiyonu - unique key kullan
  const handleCopy = async (nodeId, key) => {
    const textToCopy = `{{${nodeId}.${key}}}`;
    const uniqueKey = `${nodeId}.${key}`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      
      setCopiedItems(prev => new Set([...prev, uniqueKey]));
      
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(uniqueKey);
          return newSet;
        });
      }, 2000);
      
      console.log('✅ Copied to clipboard:', textToCopy);
    } catch (error) {
      console.error('❌ Failed to copy:', error);
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setCopiedItems(prev => new Set([...prev, uniqueKey]));
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(uniqueKey);
          return newSet;
        });
      }, 2000);
    }
  };

  const renderDynamicConfigFields = () => {
    if (!node.data.configFields || node.data.configFields.length === 0) {
      return (
        <div className="text-gray-500 text-sm">Bu script'in herhangi bir parametresi yok.</div>
      );
    }

    return (
      <div className="space-y-4">
        {node.data.configFields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {field.type === 'select' ? (
              <select
                value={config[field.name] || field.defaultValue || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, [field.name]: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {field.options?.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                value={config[field.name] || field.defaultValue || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, [field.name]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            ) : (
              <input
                type={field.type}
                value={config[field.name] || field.defaultValue || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, [field.name]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderFromSelectedNodes = () => {
    if (!fromSelectedNodes || fromSelectedNodes.length === 0) {
      return (
        <div className="text-gray-500 text-sm">
          Bu node'a gelen bağlantı yok veya önceki node'ların çıktı parametresi bulunamadı.
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {fromSelectedNodes.map((node) => (
          <div key={node.id}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {node.id} - {node.name}
            </label>  
            {node.output_params && typeof node.output_params === 'object' && Object.keys(node.output_params).length > 0 ? (
              Object.entries(node.output_params).map(([key, param]) => {
                const uniqueKey = `${node.id}.${key}`;
                const isCopied = copiedItems.has(uniqueKey);
                
                return (
                  <div key={key} className="border p-3 rounded bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700">
                          {key} - {'{{' + node.id + '.' + key + '}}'}
                        </div>
                        <div className="text-xs text-gray-500">Tür: {param.type || 'unknown'}</div>
                        {param.description && (
                          <div className="text-xs text-gray-400 mt-1">{param.description}</div>
                        )}
                      </div>
                      {/* ✅ Sadece tıklanan buton için check işareti */}
                      <button
                        onClick={() => handleCopy(node.id, key)}
                        className={`ml-3 p-2 rounded-lg transition-colors ${
                          isCopied 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={`Kopyala: {{${node.id}.${key}}}`}
                      >
                        {isCopied ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-gray-500 text-sm">
                Bu node'un çıktı parametresi yok.
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // ✅ outputParams gösterimi için düzeltme
  const renderOutputParams = () => {
    // config.outputParams yerine node.data.outputParams kullan
    const outputParams = node.data.outputParams || {};
    const entries = Object.entries(outputParams);
    
    console.log('🔍 Output params:', outputParams);
    console.log(' Entries:', entries);
    
    if (entries.length === 0) {
      return (
        <div className="text-gray-500 text-sm">Bu script'in herhangi bir çıktı parametresi yok.</div>
      );
    }

    return (
      <div className="space-y-2">
        {entries.map(([key, param]) => (
          <div key={key} className="border p-3 rounded bg-gray-50">
            <div className="text-sm font-medium text-gray-700">{key}</div>
            <div className="text-xs text-gray-500">Tür: {param.type || 'unknown'}</div>
            {param.description && (
              <div className="text-xs text-gray-400 mt-1">{param.description}</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const Icon = getIconComponent(node.data.icon);

  return (
    <div className="w-96 bg-white border-l border-gray-200 shadow-xl overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Node Configuration</h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
          <div className={`w-10 h-10 ${node.data.color || 'bg-gray-500'} rounded-lg flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={nodeName}
                onChange={(e) => {
                  setNodeName(e.target.value);
                  // Real-time validation
                  const error = validateNodeName(e.target.value);
                  setNameError(error);
                }}
                className={`font-medium text-gray-800 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 w-full ${
                  nameError ? 'ring-2 ring-red-500' : ''
                }`}
                placeholder="Node adı"
              />
              {nameError && (
                <div className="absolute top-full left-0 mt-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                  {nameError}
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500 capitalize">{node.data.type}</div>
          </div>
        </div>

        {/* ✅ Önceki Düğümlerden Gelen Parametreler */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Önceki Düğümlerden Kullanılabilecek Çıktı Parametreleri</h4>
          {renderFromSelectedNodes()}
        </div>

        {/* Input Parametreler */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Script Parametreleri</h4>
          {renderDynamicConfigFields()}
        </div>

        {/* ✅ Output Parametreler */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Script Çıktıları</h4>
          {renderOutputParams()}
        </div>

        <div className="flex space-x-3 pt-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={isSaving || !!nameError}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Kaydediliyor...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeConfigPanel;