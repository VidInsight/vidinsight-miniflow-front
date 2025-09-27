import React, { useState, useRef } from 'react';
import { Plus, Play, Zap, Webhook, Database, Mail, Calendar, MessageSquare, FileSpreadsheet, Edit3, Trash2 } from 'lucide-react';

import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import NodeConfigPanel from './NodeConfigPanel';
// Remove availableApps and useEffect from top-level. They will be added inside WorkflowBuilder.


const WorkflowStep = ({ step, stepNumber, onEdit, onDelete, isLast }) => {
  return (
    <div className="relative">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100">
                  <span className="text-sm font-semibold text-gray-600">{stepNumber}</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`${step.color} p-2 rounded-lg text-white`}>
                    {step.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                    <p className="text-sm text-gray-500">{step.app}</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{step.description}</p>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    step.configured 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {step.configured ? 'Configured' : 'Needs Setup'}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    step.type === 'trigger' 
                      ? 'bg-blue-100 text-blue-800'
                      : step.type === 'action'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {step.type.charAt(0).toUpperCase() + step.type.slice(1)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onEdit}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {!isLast && (
        <div className="flex justify-center py-4">
          <div className="w-px h-8 bg-gray-300"></div>
        </div>
      )}
    </div>
  );
};

const AddStepCard = ({ onAddStep }) => {
  return (
    <div className="relative">
      <div className="flex justify-center py-4">
        <div className="w-px h-8 bg-gray-300"></div>
      </div>
      <button
        onClick={onAddStep}
        className="w-full bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200 group"
      >
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 bg-gray-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors">
            <Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-900">Add Step</h3>
            <p className="text-sm text-gray-500 group-hover:text-blue-600">Choose an app and event</p>
          </div>
        </div>
      </button>
    </div>
  );
};

const AppSelectionModal = ({ isOpen, onClose, onSelectApp, isFirstStep, availableApps = [] }) => {
  const [selectedApp, setSelectedApp] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Choose an Action
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 mt-1">
            This will happen when your workflow runs
          </p>
        </div>
        
        <div className="flex h-96">
          <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Popular Apps</h3>
              <div className="space-y-2">
                {availableApps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                      selectedApp?.id === app.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className={`${app.color} p-2 rounded-lg text-white`}>
                      {app.icon}
                    </div>
                    <span className="font-medium text-gray-900">{app.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="w-1/2 overflow-y-auto">
            <div className="p-4">
              {selectedApp ? (
                <>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Actions
                  </h3>
                  <div className="space-y-2">
                    {selectedApp.actions?.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => onSelectApp(selectedApp, action, 'action')}
                        className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{action}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          Action to perform {action.toLowerCase()}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Select an app to see available actions</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const WorkflowBuilder = () => {
  // Get workflowId from URL parameters
  const { workflowId } = useParams();
  
  const [availableApps, setAvailableApps] = useState([]);
  const [steps, setSteps] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [isLoading, setIsLoading] = useState(false);
  const triggerCreationRef = useRef(false);
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [selectedNodeForConfig, setSelectedNodeForConfig] = useState(null);
  const [triggerId, setTriggerId] = useState(null);

  // Fetch workflow details when workflowId is available
  useEffect(() => {
    const fetchWorkflowDetails = async () => {
      if (!workflowId) {
        console.log('🔍 No workflowId provided, using default name');
        return;
      }

      try {
        setIsLoading(true);
        console.log('🔄 Fetching workflow details for ID:', workflowId);
        
        const result = await apiService.getWorkflowDetails(workflowId);
        if (result && result.success && result.workflow) {
          console.log('✅ Workflow details fetched:', result.workflow);
          setWorkflowName(result.workflow.name || 'Untitled Workflow');
          
          // Mevcut node'ları steps olarak yükle
          if (result.workflow.nodes && result.workflow.nodes.length > 0) {
            console.log('🔄 Loading existing nodes as steps:', result.workflow.nodes);
            
            const existingSteps = result.workflow.nodes.map((node, index) => ({
              id: node.id,
              type: 'action', // Tüm node'lar action olarak ayarlanıyor
              title: node.data.label || node.id,
              description: node.data.description || `Script node: ${node.data.label}`,
              app: 'Script', // Script'lerden geldiği için
              configured: true, // Mevcut node'lar zaten configure edilmiş
              icon: <Zap className="w-6 h-6" />,
              color: 'bg-blue-500',
              nodeId: node.data.nodeId,
              scriptId: node.data.scriptId
            }));
            
            console.log('✅ Existing steps loaded:', existingSteps);
            setSteps(existingSteps);
          }
          
          // Check if workflow has triggers, if not create one
          if (!result.workflow.triggers || result.workflow.triggers.length === 0) {
            console.log('🔄 No triggers found, creating default trigger');
            await createDefaultTrigger();
          } else {
            // Store the first trigger ID for execution
            const firstTrigger = result.workflow.triggers[0];
            if (firstTrigger && firstTrigger.id) {
              console.log('✅ Found existing trigger ID:', firstTrigger.id);
              setTriggerId(firstTrigger.id);
            }
          }
        } else {
          console.warn('⚠️ Failed to fetch workflow details, using default name');
          // Create trigger for new workflow
          await createDefaultTrigger();
        }
      } catch (error) {
        console.error('❌ Error fetching workflow details:', error);
        // Keep default name on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkflowDetails();
  }, [workflowId]);

  // Create default trigger for workflow
  const createDefaultTrigger = async () => {
    if (!workflowId || triggerCreationRef.current) {
      console.log('🚫 Trigger creation skipped - workflowId missing or already attempted');
      return;
    }
    
    try {
      console.log('🔄 Creating default trigger for workflow:', workflowId);
      triggerCreationRef.current = true; // İşlemi başlattığımızı işaretle
      
      const triggerData = {
        workflow_id: workflowId,
        name: `manual_trigger_workflow_${workflowId}`,
        trigger_type: 'MANUAL',
        description: `Manual trigger for workflow ${workflowId}`,
        config: {
          allow_parallel: false,
          description: `Manual trigger for workflow ${workflowId}`
        },
        status: 'ACTIVE'
      };
      
      const triggerResult = await apiService.createTrigger(triggerData);
      
      if (triggerResult && triggerResult.success) {
        console.log('✅ Default trigger created successfully:', triggerResult);
        // Store the trigger ID for execution
        if (triggerResult.trigger_id) {
          setTriggerId(triggerResult.trigger_id);
        }
      } else {
        console.warn('⚠️ Default trigger creation failed');
        triggerCreationRef.current = false; // Başarısız olursa tekrar deneyebilsin
      }
    } catch (error) {
      console.error('❌ Error creating default trigger:', error);
      triggerCreationRef.current = false; // Hata olursa tekrar deneyebilsin
    }
  };

  useEffect(() => {
    async function fetchApps() {
      try {
        const result = await apiService.getScripts();
        if (result && result.scripts) {
          const mapped = result.scripts.map(script => ({
            id: script.id,
            name: script.name,
            icon: <Zap className="w-6 h-6" />,
            color: 'bg-blue-500',
            triggers: [script.name],
            actions: [script.name],
            description: script.description,
          }));
          setAvailableApps(mapped);
        }
      } catch (e) {
        setAvailableApps([]);
      }
    }
    fetchApps();
  }, []);

  const addStep = () => {
    setIsModalOpen(true);
  };

  const handleAppSelection = async (app, actionType, stepType) => {
    try {
      // Create node via API
      const nodeData = {
        workflow_id: workflowId,
        name: `${app.name}_${Date.now()}`,
        description: `Performs ${actionType.toLowerCase()} in ${app.name}`,
        script_id: app.id,
       
      };

      console.log('🔄 Creating node via API:', nodeData);
      const result = await apiService.createNode(nodeData);
      
      if (result && result.success) {
        console.log('✅ Node created successfully:', result);
        
        const newStep = {
          id: result.node_id || Date.now().toString(),
          type: stepType,
          title: actionType,
          description: `Performs ${actionType.toLowerCase()} in ${app.name}`,
          app: app.name,
          configured: false,
          icon: app.icon,
          color: app.color,
          nodeId: result.node_id,
          scriptId: app.id
        };
        
        const updatedSteps = [...steps, newStep];
        setSteps(updatedSteps);
        setIsModalOpen(false);
        
        // Create edge between previous node and new node (if there are previous nodes)
        if (steps.length > 0) {
          const previousStep = steps[steps.length - 1]; // Get the last step
          if (previousStep.nodeId) {
            try {
              console.log('🔄 Creating edge between nodes:', previousStep.nodeId, '->', result.node_id);
              
              const edgeData = {
                workflow_id: workflowId,
                from_node_id: previousStep.nodeId,
                to_node_id: result.node_id,
                condition_type: 'SUCCESS'
              };
              
              const edgeResult = await apiService.createEdge(edgeData);
              
              if (edgeResult && edgeResult.success) {
                console.log('✅ Edge created successfully:', edgeResult);
              } else {
                console.warn('⚠️ Edge creation failed, but node was created successfully');
              }
            } catch (edgeError) {
              console.error('❌ Error creating edge:', edgeError);
              // Don't show error to user as the node was created successfully
            }
          }
        }
      } else {
        throw new Error('Node creation failed');
      }
    } catch (error) {
      console.error('❌ Error creating node:', error);
      alert('Step oluşturulurken hata oluştu: ' + error.message);
    }
  };

  const editStep = (stepId) => {
    console.log('Edit step:', stepId);
    const step = steps.find(s => s.id === stepId);
    if (step) {
      // Convert step data to node format expected by NodeConfigPanel
      const nodeData = {
        id: step.id,
        data: {
          label: step.title,
          type: step.type,
          icon: 'zap', // Default icon
          color: step.color || 'bg-blue-500',
          settings: {}, // Will be populated from API if needed
          configFields: [], // Will be populated from script data if needed
          outputParams: {}, // Will be populated from script data if needed
          nodeId: step.nodeId,
          scriptId: step.scriptId
        }
      };
      
      setSelectedNodeForConfig(nodeData);
      setShowNodeConfig(true);
    }
  };

  const deleteStep = async (stepId) => {
    try {
      // Find the step to get nodeId
      const stepToDelete = steps.find(step => step.id === stepId);
      const stepIndex = steps.findIndex(step => step.id === stepId);
      
      if (stepToDelete && stepToDelete.nodeId) {
        console.log('🗑️ Deleting node from API:', stepToDelete.nodeId);
        await apiService.deleteNode(stepToDelete.nodeId);
        console.log('✅ Node deleted successfully from API');
        
        // Delete edges connected to this node
        // Note: In a real implementation, you might want to get the actual edge IDs
        // For now, we'll handle this in the workflow save operation
        console.log('🔄 Node deleted, edges will be handled in workflow save');
      }
      
      // Remove from local state
      const updatedSteps = steps.filter(step => step.id !== stepId);
      setSteps(updatedSteps);
      
      // If we deleted a middle node, we might need to recreate edges
      if (updatedSteps.length > 1 && stepIndex < steps.length - 1) {
        console.log('🔄 Recreating edges after node deletion');
        
        // Recreate edges between remaining nodes
        for (let i = 0; i < updatedSteps.length - 1; i++) {
          const currentStep = updatedSteps[i];
          const nextStep = updatedSteps[i + 1];
          
          if (currentStep.nodeId && nextStep.nodeId) {
            try {
              const edgeData = {
                workflow_id: workflowId,
                from_node_id: currentStep.nodeId,
                to_node_id: nextStep.nodeId,
                condition_type: 'SUCCESS'
              };
              
              await apiService.createEdge(edgeData);
              console.log(`✅ Recreated edge: ${currentStep.nodeId} -> ${nextStep.nodeId}`);
            } catch (edgeError) {
              console.error('❌ Error recreating edge:', edgeError);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error deleting node:', error);
      alert('Step silinirken hata oluştu: ' + error.message);
    }
  };

  const runWorkflow = async () => {
    if (steps.length === 0) {
      alert('Please add at least one step to run the workflow');
      return;
    }
    
    try {
      // Execute workflow using trigger
      if (triggerId) {
        console.log('🔄 Executing trigger:', triggerId);
        
        const executionResult = await apiService.executeTrigger(triggerId);
        
        if (executionResult && executionResult.success) {
          console.log('✅ Trigger execution started successfully:', executionResult);
          alert(`Workflow is running... Execution ID: ${executionResult.execution_id}, Status: ${executionResult.execution_status}`);
        } else {
          console.warn('⚠️ Trigger execution failed');
          alert('Workflow execution failed: ' + (executionResult?.message || 'Unknown error'));
        }
      } else {
        alert('Trigger ID not found. Please ensure the workflow has a trigger configured.');
      }
    } catch (error) {
      console.error('❌ Error executing workflow:', error);
      alert('Workflow execution failed: ' + error.message);
    }
  };

  // NodeConfigPanel handlers
  const handleUpdateNode = (nodeId, updatedData) => {
    console.log('Updating node:', nodeId, updatedData);
    
    // Update the step in the steps array
    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === nodeId 
          ? { 
              ...step, 
              title: updatedData.label,
              // Add other updated fields as needed
            }
          : step
      )
    );
    
    // Close the config panel
    setShowNodeConfig(false);
    setSelectedNodeForConfig(null);
  };

  const handleDeleteNode = (nodeId) => {
    console.log('Deleting node from config panel:', nodeId);
    // Use the existing deleteStep function
    deleteStep(nodeId);
    // Close the config panel
    setShowNodeConfig(false);
    setSelectedNodeForConfig(null);
  };

  const handleCloseNodeConfig = () => {
    setShowNodeConfig(false);
    setSelectedNodeForConfig(null);
  };


  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="flex-1">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Zap className="w-8 h-8 text-orange-500" />
                  <h1 className="text-2xl font-bold text-gray-900">Workflow Builder</h1>
                </div>
                <div className="text-gray-400">|</div>
                <input
                  type="text"
                  value={isLoading ? "Yükleniyor..." : workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  disabled={isLoading}
                  className="text-lg font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 disabled:opacity-50"
                />
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={runWorkflow}
                  className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>RUN</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8">
          {steps.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
                <Zap className="w-16 h-16 text-orange-500 mx-auto mb-6" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Build Your First Workflow
                </h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Connect your apps and automate your work. Start by choosing an action for your workflow.
                </p>
                <button
                  onClick={addStep}
                  className="inline-flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Your First Step</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              {steps.map((step, index) => (
                <WorkflowStep
                  key={step.id}
                  step={step}
                  stepNumber={index + 1}
                  onEdit={() => editStep(step.id)}
                  onDelete={() => deleteStep(step.id)}
                  isLast={index === steps.length - 1}
                />
              ))}
              <AddStepCard onAddStep={addStep} />
            </div>
          )}
        </div>

        <AppSelectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelectApp={handleAppSelection}
          isFirstStep={steps.length === 0}
          availableApps={availableApps}
        />
      </div>

      {/* NodeConfigPanel */}
      {showNodeConfig && selectedNodeForConfig && (
        <NodeConfigPanel
          node={selectedNodeForConfig}
          fromSelectedNodes={(() => {
            // Seçili node'un index'ini bul
            const selectedNodeIndex = steps.findIndex(step => step.id === selectedNodeForConfig.id);
            
            // Sadece seçili node'dan ÖNCE gelen node'ları al (workflow sırasına göre)
            const previousNodes = steps.slice(0, selectedNodeIndex).map(step => ({
              id: step.id,
              name: step.title,
              data: { 
                label: step.title,
                nodeId: step.nodeId,
                scriptId: step.scriptId
              },
              output_params: step.outputParams || {} // Will be populated from API
            }));
            
            console.log('🔍 Node order check:', {
              selectedNodeId: selectedNodeForConfig.id,
              selectedNodeIndex,
              totalSteps: steps.length,
              previousNodesCount: previousNodes.length,
              allSteps: steps.map(s => ({ id: s.id, title: s.title }))
            });
            
            return previousNodes;
          })()}
          onClose={handleCloseNodeConfig}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          workflowId={workflowId}
          nodes={steps.map(step => ({
            id: step.id,
            data: { label: step.title }
          }))}
        />
      )}
    </div>
  );
};

export default WorkflowBuilder;