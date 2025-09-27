
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import Sidebar from './Sidebar';
import { nodeTypes } from './nodes';
import { edgeTypes } from './edges';
import NodeConfigPanel from './NodeConfigPanel';
import Toolbar from './Toolbar';
import { useParams } from 'react-router-dom';
import { apiService } from '../services/api';


const initialEdges = [];

const WorkflowBuilder = () => {
  // ✅ URL'den workflow ID'sini al
  const { workflowId } = useParams();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [fromSelectedNodes, setFromSelectedNodes] = useState(null);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [workflowData, setWorkflowData] = useState(null);

  // ✅ Workflow ID varsa detayları yükle
  useEffect(() => {
    const loadWorkflowDetails = async () => {
      if (!workflowId) {
        console.log('🔍 No workflowId provided, starting with empty workflow');
        return;
      }

      try {
        setIsLoading(true);
        console.log('🔍 Loading workflow details for ID:', workflowId);
        
        const result = await apiService.getWorkflowDetails(workflowId);
        
        if (result.success && result.workflow) {
          console.log('✅ Workflow details loaded:', result.workflow);
          
          // Nodes'ları set et
          if (result.workflow.nodes && result.workflow.nodes.length > 0) {
            setNodes(result.workflow.nodes);
          }
          
          // Edges'leri set et
          if (result.workflow.edges && result.workflow.edges.length > 0) {
            setEdges(result.workflow.edges);
          }
          
          // Workflow data'sını sakla
          setWorkflowData(result.workflow);
        }
      } catch (error) {
        console.error('❌ Error loading workflow details:', error);
        alert('Workflow detayları yüklenirken hata oluştu!');
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkflowDetails();
  }, [workflowId]);

  // ✅ Workflow ID'sini logla
  useEffect(() => {
    console.log('🔍 WorkflowBuilder mounted with workflowId:', workflowId);
  }, [workflowId]);

  // State değişikliklerini takip etmek için useEffect
  useEffect(() => {
    console.log("🔄 State Updated - Nodes:", nodes, "Edges:", edges);
  }, [nodes, edges]);

  const onConnect = useCallback(
    async (params) => {
      console.log('🔗 Connecting nodes:', params);
      
      // Önce local olarak edge ekle
      const newEdge = { ...params, type: 'custom' };
      setEdges((eds) => addEdge(newEdge, eds));
      
      // Eğer workflowId varsa API'ye edge oluşturma isteği gönder
      if (workflowId) {
        try {
          // Source ve target node'larını bul
          const sourceNode = nodes.find(node => node.id === params.source);
          const targetNode = nodes.find(node => node.id === params.target);
          
          if (!sourceNode || !targetNode) {
            console.error('❌ Source or target node not found');
            return;
          }
          
          // Node'ların API'den gelen ID'lerini al
          const fromNodeId = sourceNode.data.nodeId || sourceNode.id;
          const toNodeId = targetNode.data.nodeId || targetNode.id;
          
          const apiEdgeData = {
            workflow_id: workflowId,
            from_node_id: fromNodeId,
            to_node_id: toNodeId,
            condition_type: 'success'
          };
          
          console.log('📤 Creating edge via API:', apiEdgeData);
          const result = await apiService.createEdge(apiEdgeData);
          console.log('✅ Edge created via API:', result);
          
          // Edge'e API'den gelen ID'yi ekle
          setEdges((eds) => 
            eds.map(edge => 
              edge.source === params.source && edge.target === params.target
                ? { ...edge, id: result.edge_id, apiEdgeId: result.edge_id }
                : edge
            )
          );
        } catch (error) {
          console.error('❌ Error creating edge via API:', error);
          alert('Edge oluşturulurken hata oluştu: ' + error.message);
          
          // Hata durumunda edge'i kaldır
          setEdges((eds) => eds.filter(edge => 
            !(edge.source === params.source && edge.target === params.target)
          ));
        }
      }
    },
    [setEdges, workflowId, nodes]
  );

  // ✅ Basit ve direkt yaklaşım
  const onNodeClick = useCallback((event, node) => {
    console.log('🖱️ Node clicked:', node.id);
    
    // Seçilen node'a gelen edge'leri hemen hesapla
    const incomingEdges = edges.filter(edge => edge.target === node.id);
    console.log(' Incoming edges for node', node.id, ':', incomingEdges);
    
    // Bu edge'lerin kaynak node'larının bilgilerini topla
    const fromNodes = incomingEdges.map(edge => {
      const sourceNode = nodes.find(node => node.id === edge.source);
      
      if (!sourceNode) {
        console.log('❌ Source node not found for edge:', edge);
        return null;
      }
      
      const result = {
        id: sourceNode.id,
        name: sourceNode.data.label || sourceNode.data.type || sourceNode.id,
        output_params: sourceNode.data.outputParams || [],
        node_data: {
          id: sourceNode.id,
          label: sourceNode.data.label,
          type: sourceNode.data.type,
          description: sourceNode.data.description,
          configFields: sourceNode.data.configFields || [],
          settings: sourceNode.data.settings || {},
          outputParams: sourceNode.data.outputParams || []
        }
      };
      
      console.log('✅ Created node result:', result);
      return result;
    }).filter(node => node !== null);
    
    console.log(' Final fromNodes:', fromNodes);
    
    setSelectedNode(node);
    setFromSelectedNodes(fromNodes);
    setIsConfigPanelOpen(true);
  }, [edges, nodes]);

  // ✅ Unique node name oluştur
  const generateUniqueNodeName = useCallback((baseName) => {
    let counter = 1;
    let uniqueName = baseName;
    
    // Mevcut node'larda aynı isim var mı kontrol et
    while (nodes.some(node => node.data.label === uniqueName)) {
      uniqueName = `${baseName}_${counter}`;
      counter++;
    }
    
    return uniqueName;
  }, [nodes]);

  const addNode = useCallback(async (type, nodeData) => {
    console.log("Node Data", nodeData);
    
    // Unique node name oluştur
    const uniqueNodeName = generateUniqueNodeName(nodeData.label);
    
    // Eğer workflowId varsa API'ye node oluşturma isteği gönder
    if (workflowId) {
      try {
        // configFields'dan params oluştur
        const params = {};
        if (nodeData.configFields && Array.isArray(nodeData.configFields)) {
          nodeData.configFields.forEach(field => {
            params[field.name] = field.defaultValue || '';
          });
        }
        
        const apiNodeData = {
          workflow_id: workflowId,
          script_id: nodeData.id, // Bu zaten script_id
          name: uniqueNodeName, // Unique node name kullan
          params: params, // configFields'dan oluşturulan params
          max_retries: 3,
          timeout_seconds: 300
        };
        
        console.log('📤 Creating node via API:', apiNodeData);
        const result = await apiService.createNode(apiNodeData);
        console.log('✅ Node created via API:', result);
        
        // API'den dönen node ID'sini kullan
        const newNode = {
          id: result.node_id || `${Date.now()}`,
          type: 'custom',
          position: {
            x: Math.random() * 400 + 100,
            y: Math.random() * 400 + 100,
          },
          data: {
            ...nodeData,
            label: uniqueNodeName, // Unique name'i data'ya da ekle
            nodeId: result.node_id, // API'den gelen node ID'sini sakla
            apiNodeId: result.node_id, // API'den gelen node ID'sini ayrıca sakla
            settings: params // Oluşturulan params'ı settings'e de ekle
          },
        };
        
        console.log('🔍 Created node with ID:', result.node_id, 'Type:', typeof result.node_id);
        setNodes((nds) => nds.concat(newNode));
      } catch (error) {
        console.error('❌ Error creating node via API:', error);
        alert('Node oluşturulurken hata oluştu: ' + error.message);
        
        // Hata durumunda local olarak ekle
        const newNode = {
          id: `${Date.now()}`,
          type: 'custom',
          position: {
            x: Math.random() * 400 + 100,
            y: Math.random() * 400 + 100,
          },
          data: {
            ...nodeData,
            label: uniqueNodeName, // Unique name'i data'ya da ekle
          },
        };
        setNodes((nds) => nds.concat(newNode));
      }
    } else {
      // WorkflowId yoksa sadece local olarak ekle
      const newNode = {
        id: `${Date.now()}`,
        type: 'custom',
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 400 + 100,
        },
        data: {
          ...nodeData,
          label: uniqueNodeName, // Unique name'i data'ya da ekle
        },
      };
      setNodes((nds) => nds.concat(newNode));
    }
  }, [setNodes, workflowId, generateUniqueNodeName]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    async (event) => {
      event.preventDefault();
      
      const reactFlowBounds = event.target.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const nodeData = JSON.parse(type);
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      // Unique node name oluştur
      const uniqueNodeName = generateUniqueNodeName(nodeData.label);

      // Eğer workflowId varsa API'ye node oluşturma isteği gönder
      if (workflowId) {
        try {
          // configFields'dan params oluştur
          const params = {};
          if (nodeData.configFields && Array.isArray(nodeData.configFields)) {
            nodeData.configFields.forEach(field => {
              params[field.name] = field.defaultValue || '';
            });
          }
          
          const apiNodeData = {
            workflow_id: workflowId,
            script_id: nodeData.id, // Bu zaten script_id
            name: uniqueNodeName, // Unique node name kullan
            params: params, // configFields'dan oluşturulan params
            max_retries: 3,
            timeout_seconds: 300
          };
          
          console.log('📤 Creating node via API (drop):', apiNodeData);
          const result = await apiService.createNode(apiNodeData);
          console.log('✅ Node created via API (drop):', result);
          
          // API'den dönen node ID'sini kullan
          const newNode = {
            id: result.node_id || `${Date.now()}`,
            type: 'custom',
            position,
            data: {
              ...nodeData,
              label: uniqueNodeName, // Unique name'i data'ya da ekle
              nodeId: result.node_id, // API'den gelen node ID'sini sakla
              apiNodeId: result.node_id, // API'den gelen node ID'sini ayrıca sakla
              settings: params // Oluşturulan params'ı settings'e de ekle
            },
          };

          console.log("➕ Adding new node (drop):", newNode);
          setNodes((nds) => nds.concat(newNode));
        } catch (error) {
          console.error('❌ Error creating node via API (drop):', error);
          alert('Node oluşturulurken hata oluştu: ' + error.message);
          
          // Hata durumunda local olarak ekle
          const newNode = {
            id: `${Date.now()}`,
            type: 'custom',
            position,
            data: {
              ...nodeData,
              label: uniqueNodeName, // Unique name'i data'ya da ekle
            },
          };
          setNodes((nds) => nds.concat(newNode));
        }
      } else {
        // WorkflowId yoksa sadece local olarak ekle
        const newNode = {
          id: `${Date.now()}`,
          type: 'custom',
          position,
          data: {
            ...nodeData,
            label: uniqueNodeName, // Unique name'i data'ya da ekle
          },
        };

        console.log("➕ Adding new node (drop):", newNode);
        setNodes((nds) => nds.concat(newNode));
      }
    },
    [setNodes, workflowId, generateUniqueNodeName]
  );

  const updateNodeData = useCallback(async (nodeId, newData) => {
    console.log("Updating node:", nodeId, "with data:", newData);
    setIsLoading(true); // Loading state'i aç

    try {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) {
        console.error('❌ Node not found for update:', nodeId);
        return;
      }

      // Yeni node adını al
      const newName = newData.label || node.data.label;

      // Params'ı al
      const params = {};
      if (node.data.configFields && Array.isArray(node.data.configFields)) {
        node.data.configFields.forEach(field => {
          params[field.name] = newData.settings[field.name] || field.defaultValue || '';
        });
      }

      const apiNodeData = {
        workflow_id: workflowId,
        name: newName,
        script_id: node.data.id, // script_id
        params: params,
        max_retries: 3,
        timeout_seconds: 300
      };

      console.log('📤 Updating node via API:', apiNodeData);
      
      // Node ID'sini doğru şekilde al
      let nodeIdToUpdate = null;
      
      // Önce node.data.nodeId'yi kontrol et
      if (node.data.nodeId) {
        nodeIdToUpdate = node.data.nodeId;
      }
      // Sonra node.data.apiNodeId'yi kontrol et
      else if (node.data.apiNodeId) {
        nodeIdToUpdate = node.data.apiNodeId;
      }
      // Son olarak node.id'yi kullan
      else {
        nodeIdToUpdate = nodeId;
      }
      
      console.log('🔍 Node data:', node.data);
      console.log('🔍 Using node ID for update:', nodeIdToUpdate);
      
      const result = await apiService.updateNode(nodeIdToUpdate, apiNodeData);
      console.log('✅ Node updated via API:', result);

      // API'den dönen node ID'sini kullan
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  label: newName,
                  settings: params,
                  nodeId: result.node_id || nodeIdToUpdate, // API'den gelen node ID'sini sakla
                },
              }
            : n
        )
      );
    } catch (error) {
      console.error('❌ Error updating node via API:', error);
      alert('Node güncellenirken hata oluştu: ' + error.message);
    } finally {
      setIsLoading(false); // Loading state'i kapat
    }
  }, [setNodes, workflowId, nodes]);

  const deleteNode = useCallback(async (nodeId) => {
    console.log("🗑️ Deleting node:", nodeId);
    setIsLoading(true); // Loading state'i aç

    try {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) {
        console.error('❌ Node not found for deletion:', nodeId);
        return;
      }

      // 1. Önce bu node'a bağlı tüm edge'leri bul ve sil
      const connectedEdges = edges.filter(edge => 
        edge.source === nodeId || edge.target === nodeId
      );
      
      console.log('🔗 Found connected edges to delete:', connectedEdges);

      // 2. Edge'leri API'den sil
      if (workflowId && connectedEdges.length > 0) {
        const edgeDeletePromises = connectedEdges.map(async (edge) => {
          try {
            // Edge'in API ID'sini al
            const edgeId = edge.apiEdgeId || edge.id;
            
            console.log('📤 Deleting connected edge via API:', edgeId);
            const result = await apiService.deleteEdge(edgeId);
            console.log('✅ Connected edge deleted via API:', result);
            
            return { success: true, edgeId };
          } catch (error) {
            console.error('❌ Error deleting connected edge via API:', error);
            return { success: false, edgeId: edge.id, error };
          }
        });
        
        // Tüm edge silme işlemlerini bekle
        const edgeResults = await Promise.all(edgeDeletePromises);
        
        // Başarısız olan edge silme işlemlerini kontrol et
        const failedEdgeDeletions = edgeResults.filter(result => !result.success);
        if (failedEdgeDeletions.length > 0) {
          console.warn('⚠️ Some connected edges failed to delete:', failedEdgeDeletions);
        }
      }

      // 3. Node'u API'den sil
      if (workflowId) {
        // Node'un API ID'sini al
        const nodeIdToDelete = node.data.nodeId || node.data.apiNodeId || nodeId;
        
        console.log('📤 Deleting node via API:', nodeIdToDelete);
        const result = await apiService.deleteNode(nodeIdToDelete);
        console.log('✅ Node deleted via API:', result);
      }

      // 4. Local state'den node ve bağlı edge'leri kaldır
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      
      // 5. Eğer silinen node seçiliyse config panel'i kapat
      if (selectedNode?.id === nodeId) {
        setFromSelectedNodes(null);
        setSelectedNode(null);
        setIsConfigPanelOpen(false);
      }
      
      console.log('✅ Node and connected edges deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting node via API:', error);
      alert('Node silinirken hata oluştu: ' + error.message);
    } finally {
      setIsLoading(false); // Loading state'i kapat
    }
  }, [setNodes, setEdges, workflowId, nodes, edges, selectedNode, setFromSelectedNodes, setIsConfigPanelOpen]);

  // ✅ Edge silme işlemi
  const onEdgesDelete = useCallback(async (edgesToDelete) => {
    console.log('️ Deleting edges:', edgesToDelete);
    
    // Eğer workflowId varsa API'ye edge silme istekleri gönder
    if (workflowId) {
      const deletePromises = edgesToDelete.map(async (edge) => {
        try {
          // Edge'in API ID'sini al
          const edgeId = edge.apiEdgeId || edge.id;
          
          console.log('📤 Deleting edge via API:', edgeId);
          const result = await apiService.deleteEdge(edgeId);
          console.log('✅ Edge deleted via API:', result);
          
          return { success: true, edgeId };
        } catch (error) {
          console.error('❌ Error deleting edge via API:', error);
          alert(`Edge silinirken hata oluştu: ${error.message}`);
          return { success: false, edgeId: edge.id, error };
        }
      });
      
      // Tüm silme işlemlerini bekle
      const results = await Promise.all(deletePromises);
      
      // Başarısız olan işlemleri kontrol et
      const failedDeletions = results.filter(result => !result.success);
      if (failedDeletions.length > 0) {
        console.warn('⚠️ Some edges failed to delete:', failedDeletions);
      }
    }
  }, [workflowId]);

  // ✅ Edge click handler
  const onEdgeClick = useCallback(async (event, edge) => {
    console.log('🖱️ Edge clicked:', edge.id);
    
    // Eğer edge'in üzerindeki silme butonuna tıklandıysa
    if (event.target.closest('button')) {
      console.log('🗑️ Delete button clicked for edge:', edge.id);
      
      // Eğer workflowId varsa API'ye edge silme isteği gönder
      if (workflowId) {
        try {
          // Edge'in API ID'sini al
          const edgeId = edge.apiEdgeId || edge.id;
          
          console.log('📤 Deleting edge via API:', edgeId);
          const result = await apiService.deleteEdge(edgeId);
          console.log('✅ Edge deleted via API:', result);
          
          // Edge'i local state'den kaldır
          setEdges((eds) => eds.filter((e) => e.id !== edge.id));
        } catch (error) {
          console.error('❌ Error deleting edge via API:', error);
          alert('Edge silinirken hata oluştu: ' + error.message);
        }
      } else {
        // WorkflowId yoksa sadece local'den kaldır
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      }
    }
  }, [workflowId, setEdges]);

  // ✅ Edge silme event listener
  useEffect(() => {
    const handleEdgeDelete = async (event) => {
      const { edgeId, apiEdgeId } = event.detail;
      console.log('🗑️ Edge delete event received:', edgeId, apiEdgeId);
      
      // Eğer workflowId varsa API'ye edge silme isteği gönder
      if (workflowId) {
        try {
          // Edge'in API ID'sini al
          const edgeIdToDelete = apiEdgeId || edgeId;
          
          console.log('📤 Deleting edge via API:', edgeIdToDelete);
          const result = await apiService.deleteEdge(edgeIdToDelete);
          console.log('✅ Edge deleted via API:', result);
          
          // Edge'i local state'den kaldır
          setEdges((eds) => eds.filter((e) => e.id !== edgeId));
        } catch (error) {
          console.error('❌ Error deleting edge via API:', error);
          alert('Edge silinirken hata oluştu: ' + error.message);
        }
      } else {
        // WorkflowId yoksa sadece local'den kaldır
        setEdges((eds) => eds.filter((e) => e.id !== edgeId));
      }
    };

    window.addEventListener('edgeDelete', handleEdgeDelete);

    return () => {
      window.removeEventListener('edgeDelete', handleEdgeDelete);
    };
  }, [workflowId, setEdges]);

  return (
    <div className="flex" style={{ height: 'calc(100vh - 64px)' }}>
      <Sidebar onAddNode={addNode} />
      
      <div className="flex-1 relative">
        {/* ✅ Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Workflow yükleniyor...</p>
            </div>
          </div>
        )}
        
        {/* ✅ Toolbar'a workflowId'yi gönder */}
        <Toolbar 
          nodes={nodes} 
          edges={edges}
          workflowName={isLoading ? "Yükleniyor..." : (workflowData?.name || "Yeni Workflow")}
          workflowId={workflowId}
        />
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onEdgesDelete={onEdgesDelete}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionLineType={ConnectionLineType.SmoothStep}
          defaultEdgeOptions={{
            type: 'custom',
            animated: true,
            deletable: true, // Edge'lerin silinebilir olmasını sağla
            style: { stroke: '#3b82f6', strokeWidth: 2 },
          }}
          className="bg-gray-50"
          fitView
        >
          <Controls className="bg-white shadow-lg border border-gray-200" />
          <MiniMap 
            className="bg-white shadow-lg border border-gray-200"
            nodeColor="#3b82f6"
            maskColor="rgba(0, 0, 0, 0.1)"
          />
          <Background variant="dots" gap={20} size={1} color="#343536ff" />
          
          
        </ReactFlow>
      </div>

      {isConfigPanelOpen && selectedNode && (
        <NodeConfigPanel
          node={selectedNode}
          fromSelectedNodes={fromSelectedNodes}
          onClose={() => setIsConfigPanelOpen(false)}
          onUpdateNode={updateNodeData}
          onDeleteNode={deleteNode}
          workflowId={workflowId}
          nodes={nodes}
        />
      )}
    </div>
  );
};

export default WorkflowBuilder;