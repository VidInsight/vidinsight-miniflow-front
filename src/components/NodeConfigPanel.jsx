import React, { useState, useEffect } from 'react';
import { Settings, X, Save, Trash2, Copy, Check } from 'lucide-react'; // Copy ve Check ikonlarını ekle
import { getIconComponent } from '../utils/iconMapper';

const NodeConfigPanel = ({ node, fromSelectedNodes, onClose, onUpdateNode, onDeleteNode }) => {
  const [config, setConfig] = useState({});
  const [copiedItems, setCopiedItems] = useState(new Set()); // ✅ Set kullanarak birden fazla item'ı takip et

  useEffect(() => {
    setConfig(node.data.settings || {});
  }, [node]);

  const handleSave = () => {
    onUpdateNode(node.id, { settings: config });
    onClose();
  };

  const handleDelete = () => {
    onDeleteNode(node.id);
  };

  // ✅ Kopyalama fonksiyonu - unique key kullan
  const handleCopy = async (nodeId, key) => {
    const textToCopy = `{{${nodeId}.${key}}}`;
    const uniqueKey = `${nodeId}.${key}`; // ✅ Unique key oluştur
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      
      // ✅ Sadece bu item'ı copied olarak işaretle
      setCopiedItems(prev => new Set([...prev, uniqueKey]));
      
      // 2 saniye sonra sadece bu item'ın copied state'ini sıfırla
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
      // Fallback: eski yöntem
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
                const uniqueKey = `${node.id}.${key}`; // ✅ Her item için unique key
                const isCopied = copiedItems.has(uniqueKey); // ✅ Bu item'ın copied durumunu kontrol et
                
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
          <div>
            <div className="font-medium text-gray-800">{node.data.label}</div>
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
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
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