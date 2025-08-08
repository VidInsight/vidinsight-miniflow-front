import React, { useState, useCallback } from 'react';
import { Play, Save, Download, Upload, Undo, Redo, ZoomIn, ZoomOut, Loader } from 'lucide-react';
import WorkflowExecutor from '../services/WorkflowExecutor';
import ExecutionResults from './ExecutionResults';
import { apiService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Toolbar = ({ nodes, edges, workflowName, workflowId }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [currentWorkflowName, setCurrentWorkflowName] = useState(workflowName || 'Yeni Workflow');
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  // Nodes verisini API formatına çevirme - ilk node'u atla (id === '1' ise)
  const getNodesData = useCallback(() => {
    if (!nodes || nodes.length === 0) return [];
    
    // İlk node'un id'si '1' ise 2. node'dan başla
    const filteredNodes = nodes[0]?.id === '1' ? nodes.slice(1) : nodes;
    
    const nodesData = filteredNodes.map(node => ({
      name: node.id,
      script_name: node.data.label || node.data.type,
      params: node.data.configFields ? node.data.configFields.reduce((params, param) => {
        // Dinamik property oluşturma - doğru syntax
        params[param.name] = node.data.settings?.[param.name] || param.defaultValue || '';
        return params;
      }, {}) : {}
    }));
    
    console.log('🔄 Converted nodes data (filtered):', nodesData);
    return nodesData;
  }, [nodes]);

  // Edges verisini API formatına çevirme - ilk edge'i atla (source === '1' ise)
  const getEdgesData = useCallback(() => {
    if (!edges || edges.length === 0) return [];
    
    // İlk edge'in source'u '1' ise 2. edge'den başla
    const filteredEdges = edges[0]?.source === '1' ? edges.slice(1) : edges;
    
    const edgesData = filteredEdges.map(edge => ({
      from_node: edge.source,
      to_node: edge.target,
      condition_type: "success",
    }));
    
    console.log('🔄 Converted edges data (filtered):', edgesData);
    return edgesData;
  }, [edges]);

  // Workflow verisini toplama
  const getWorkflowData = useCallback(() => {
    return {
      name: currentWorkflowName,
      description: 'Workflow description',
      nodes: getNodesData(),
      edges: getEdgesData(),
      triggers: [
        {
          trigger_type: "manual",
          config: {},
          is_active: true
        }
      ]
    };
  }, [nodes, edges, currentWorkflowName, workflowId, getNodesData]);

  // Workflow çalıştırma
  const handleRunWorkflow = async () => {
    const workflowData = getWorkflowData();
    
    /*if (!workflowData.nodes || workflowData.nodes.length === 0) {
      alert('Workflow verisi bulunamadı veya boş!');
      return;
    }*/

    setIsRunning(true);
    setExecutionResult(null);

    try {
      console.log('🚀 Starting workflow execution...');
      
      // Önce kaydet, sonra başlat
      const result = await apiService.executeWorkflow(workflowId);
      
      setExecutionResult({
        success: true,
        workflow_id: result.workflow_id,
        execution_id: result.execution_id,
        message: result.message,
        data: result
      });

      console.log('✅ Workflow execution result:', result);
    } catch (error) {
      console.error('❌ Workflow execution error:', error);
      
      let errorMessage = 'Workflow çalıştırılırken hata oluştu!';
      
      if (error.message.includes('HTTP error')) {
        errorMessage = `API Hatası: ${error.message}`;
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.';
      }
      
      setExecutionResult({
        success: false,
        error: errorMessage,
        executionHistory: []
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Workflow kaydetme
  const handleSaveWorkflow = async () => {
    try {
      setIsSaving(true);
      const workflowData = getWorkflowData();
      
      console.log('🔄 Saving workflow data:', workflowData);
      
      // API'ye gönder
      const savedWorkflow = await apiService.saveWorkflow(workflowData);
      console.log('✅ Workflow saved:', savedWorkflow);
      
      //alert('Workflow başarıyla kaydedildi!');
      //navigate('/dashboard');
    } catch (error) {
      console.error('❌ Save error:', error);
      alert('Workflow kaydedilirken hata oluştu!');
    } finally {
      setIsSaving(false);
    }
  };

  // Sonuçları kapatma
  const handleCloseResults = () => {
    setExecutionResult(null);
  };

  return (
    <>
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex items-center space-x-2">
        {/* Run Button */}
        <button
          onClick={handleRunWorkflow}
          disabled={isRunning || !nodes || nodes.length === 0}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
            isRunning || !nodes || nodes.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
          title={!nodes || nodes.length === 0 ? 'Workflow boş, çalıştırılamaz' : 'Workflow\'u çalıştır'}
        >
          {isRunning ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {isRunning ? 'Running...' : 'Run'}
          </span>
        </button>

        {/* Save Button */}
        <button
          onClick={handleSaveWorkflow}
          disabled={isSaving || !nodes || nodes.length === 0}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
            isSaving || !nodes || nodes.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          title={!nodes || nodes.length === 0 ? 'Workflow boş, kaydedilemez' : 'Workflow\'u kaydet'}
        >
          {isSaving ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {isSaving ? 'Saving...' : 'Save'}
          </span>
        </button>

        {/* Workflow Name Input */}
        <input
          type="text"
          value={currentWorkflowName}
          onChange={(e) => setCurrentWorkflowName(e.target.value)}
          className="border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder='Workflow Name'
          disabled={isSaving}
        />

        <div className="h-6 w-px bg-gray-300"></div>

        {/* Export Button */}
        <button 
          className="p-2 hover:bg-gray-100 rounded-md transition-colors" 
          title="Export"
          disabled={!nodes || nodes.length === 0}
        >
          <Download className="w-4 h-4 text-gray-600" />
        </button>

        {/* Import Button */}
        <button 
          className="p-2 hover:bg-gray-100 rounded-md transition-colors" 
          title="Import"
        >
          <Upload className="w-4 h-4 text-gray-600" />
        </button>

        <div className="h-6 w-px bg-gray-300"></div>

        {/* Undo Button */}
        <button 
          className="p-2 hover:bg-gray-100 rounded-md transition-colors" 
          title="Undo"
          disabled={true} // Henüz implement edilmedi
        >
          <Undo className="w-4 h-4 text-gray-400" />
        </button>

        {/* Redo Button */}
        <button 
          className="p-2 hover:bg-gray-100 rounded-md transition-colors" 
          title="Redo"
          disabled={true} // Henüz implement edilmedi
        >
          <Redo className="w-4 h-4 text-gray-400" />
        </button>

        <div className="h-6 w-px bg-gray-300"></div>

        {/* Zoom In Button */}
        <button 
          className="p-2 hover:bg-gray-100 rounded-md transition-colors" 
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 text-gray-600" />
        </button>

        {/* Zoom Out Button */}
        <button 
          className="p-2 hover:bg-gray-100 rounded-md transition-colors" 
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Execution Results Modal */}
      {executionResult && (
        <ExecutionResults result={executionResult} onClose={handleCloseResults} />
      )}
    </>
  );
};

export default Toolbar;
