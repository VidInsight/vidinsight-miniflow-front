import React from 'react';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { apiService } from '../services/api';
import { getIconComponent } from '../utils/iconMapper';

const Sidebar = ({ onAddNode }) => {
  const [nodeCategories, setNodeCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNodeCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const categories = await apiService.getNodeCategories();
        setNodeCategories(categories);
      } catch (err) {
        setError('Script listesi yüklenirken hata oluştu: ' + err.message);
        console.error('Error loading node categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNodeCategories();
  }, []);

  const handleDragStart = (event, nodeData) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleAddNode = (nodeData) => {
    onAddNode(nodeData.type, {
      ...nodeData,
      icon: getIconComponent(nodeData.icon)
    });
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 shadow-sm overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Node Library</h2>
        <p className="text-sm text-gray-600 mt-1">Drag nodes to canvas or click to add</p>
      </div>

      <div className="p-4 space-y-6">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">Script listesi yükleniyor...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 text-xs text-red-600 underline hover:text-red-800"
            >
              Tekrar dene
            </button>
          </div>
        )}

        {nodeCategories.map((category) => (
          <div key={category.title}>
            <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
              {category.title}
            </h3>
            <div className="space-y-2">
              {category.nodes.map((node) => {
                const Icon = getIconComponent(node.icon);
                const nodeData = {
                  id: node.id,
                  label: node.label,
                  type: node.type,
                  icon: node.icon,
                  color: node.color,
                  description: node.description,
                  configFields: node.configFields || [],
                  outputParams: node.outputParams || []
                };

                return (
                  <div
                    key={node.label}
                    className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors group"
                    draggable
                    onDragStart={(e) => handleDragStart(e, nodeData)}
                    onClick={() => handleAddNode(nodeData)}
                  >
                    <div className={`w-8 h-8 ${node.color || 'bg-gray-500'} rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 text-sm">{node.label}</div>
                      <div className="text-xs text-gray-500">{node.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;