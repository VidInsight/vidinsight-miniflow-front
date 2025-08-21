import React, { useState, useCallback, useEffect } from 'react';
import { Download, Upload, House } from 'lucide-react';
import ExecutionResults from './ExecutionResults';
import { apiService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Toolbar = ({ nodes, edges, workflowName, workflowId }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [currentWorkflowName, setCurrentWorkflowName] = useState(workflowName || 'Yeni Workflow');
  const navigate = useNavigate();

  // Export workflow as JSON
  const handleExportWorkflow = useCallback(() => {
    if (!nodes || nodes.length === 0) return;
    const workflowJson = {
      workflowId,
      workflowName: currentWorkflowName,
      nodes,
      edges
    };
    const dataStr = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(workflowJson, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${currentWorkflowName || 'workflow'}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [nodes, edges, workflowId, currentWorkflowName]);

  useEffect(() => {
    if (workflowName && workflowName !== 'Yükleniyor...') {
      console.log('🔄 Toolbar: workflowName updated:', workflowName);
      setCurrentWorkflowName(workflowName);
    }
  }, [workflowName]);

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

  {/*Dashboard yönlendirme */ }
  const goToDashboard = () => {
    navigate('/dashboard'); // Dashboard sayfasının route'u
  };
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


  // Workflow çalıştırma
  const handleRunWorkflow = async () => {
    alert('Workflow çalışıyor, sonuçları ana sayfada görebilirsiniz...')
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



  // Sonuçları kapatma
  const handleCloseResults = () => {
    setExecutionResult(null);
  };

  return (
    <>
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex items-center space-x-2">
        {/* Run Button */}
        <button
          onClick={handleRunWorkflow}

          disabled={isRunning || !nodes || nodes.length === 0}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${isRunning || !nodes || nodes.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          title={!nodes || nodes.length === 0 ? 'Workflow boş, çalıştırılamaz' : 'Workflow\'u çalıştır'}
        >

          <span className="text-sm font-medium">
            {'Run'}
          </span>
        </button>

        <div className="h-6 w-px bg-gray-300"></div>

        {/* Workflow Name Input */}
        <text
          type="text"
          className=" p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >

          Workflow Name: {currentWorkflowName}

        </text>

        <div className="h-6 w-px bg-gray-300"></div>

        {/* Export Button */}
        <button
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Export"
          disabled={!nodes || nodes.length === 0}
          onClick={handleExportWorkflow}
        >
          <Download className="w-4 h-4 text-gray-600" />
        </button>

        <div className="h-6 w-px bg-gray-300"></div>

        {/* Import Button */}
        <button
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Import"
        >
          <Upload className="w-4 h-4 text-gray-600" />
        </button>

        <div className="h-6 w-px bg-gray-300"></div>

        {/* Dashboard Button */}
        <button
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title='Dashboard'
          onClick={goToDashboard}

        >
          <House className="w-4 h-4 text-gray-600" />
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
