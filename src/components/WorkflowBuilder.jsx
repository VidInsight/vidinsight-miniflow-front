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
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import Sidebar from './Sidebar';
import { nodeTypes } from './nodes';
import { edgeTypes } from './edges';
import NodeConfigPanel from './NodeConfigPanel';
import Toolbar from './Toolbar';
import { useParams } from 'react-router-dom';
import { apiService } from '../services/api';

const initialNodes = [
  {
    id: '1',
    type: 'custom',
    position: { x: 250, y: 100 },
    data: { 
      label: 'Start', 
      type: 'trigger',
      icon: '🚀',
      description: 'Workflow başlangıç noktası'
    },
  },
];

const initialEdges = [];

const WorkflowBuilder = () => {
  // ✅ URL'den workflow ID'sini al
  const { workflowId } = useParams();
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
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
    (params) => setEdges((eds) => addEdge({ ...params, type: 'custom' }, eds)),
    [setEdges]
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

  const addNode = useCallback((type, nodeData) => {
    console.log("Node Data", nodeData);
    const newNode = {
      id: `${Date.now()}`,
      type: 'custom',
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
      data: nodeData,
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
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

      const newNode = {
        id: `${Date.now()}`,
        type: 'custom',
        position,
        data: nodeData,
      };

      console.log("➕ Adding new node:", newNode);
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
  }, [setNodes]);

  const deleteNode = useCallback((nodeId) => {
    console.log("🗑️ Deleting node:", nodeId);
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setFromSelectedNodes(null);
      setSelectedNode(null);
      setIsConfigPanelOpen(false);
    }
  }, [setNodes, setEdges, selectedNode]);

  return (
    <div className="flex h-full">
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
          workflowName={workflowData?.name || "Yeni Workflow"}
          workflowId={workflowId}
        />
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionLineType={ConnectionLineType.SmoothStep}
          defaultEdgeOptions={{
            type: 'custom',
            animated: true,
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
          <Background variant="dots" gap={20} size={1} color="#e5e7eb" />
          
          <Panel position="top-center">
            <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
              <h1 className="text-lg font-semibold text-gray-800">Workflow Builder</h1>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {isConfigPanelOpen && selectedNode && (
        <NodeConfigPanel
          node={selectedNode}
          fromSelectedNodes={fromSelectedNodes}
          onClose={() => setIsConfigPanelOpen(false)}
          onUpdateNode={updateNodeData}
          onDeleteNode={deleteNode}
        />
      )}
    </div>
  );
};

export default WorkflowBuilder;