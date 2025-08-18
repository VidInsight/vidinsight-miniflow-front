import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import WorkflowBuilder from './components/WorkflowBuilder';
import { apiService } from './services/api';

// Create context for workflow management
const WorkflowContext = createContext();

export const useWorkflows = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflows must be used within a WorkflowProvider');
  }
  return context;
};

function App() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API'den workflow verilerini yükle
  const loadWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      const workflowData = await apiService.getWorkflows();
      setWorkflows(workflowData);
    } catch (err) {
      console.error('Failed to load workflows:', err);
      setError(err.message);
      // Hata durumunda fallback data kullan
      setWorkflows([
        {
          id: 'fallback-1',
          name: 'API Bağlantısı Kurulamadı',
          status: 'failed',
          lastRun: 'Bilinmiyor',
          duration: 'Bilinmiyor',
          description: 'Workflow verilerine ulaşılamıyor. Lütfen bağlantınızı kontrol edin.',
          steps: 0,
          completedSteps: 0
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Component mount olduğunda workflow'ları yükle
  useEffect(() => {
    loadWorkflows();
  }, []);

  // Workflow'ları yeniden yüklemek için fonksiyon
  const refreshWorkflows = () => {
    loadWorkflows();
  };

  // API ile yeni workflow oluştur
  const createNewWorkflow = async (workflowData = {}) => {
    try {
      setLoading(true);
      const newWorkflow = await apiService.createWorkflow(workflowData);
      setWorkflows(prev => [...prev, newWorkflow]);
      return newWorkflow;
    } catch (error) {
      console.error('Failed to create workflow:', error);
      setError(error.message);
      // Hata durumunda local workflow oluştur
      const fallbackWorkflow = {
        id: `local-${Date.now()}`,
        name: workflowData.name || `Yeni Workflow ${new Date().toLocaleString('tr-TR')}`,
        status: 'draft',
        lastRun: 'Hiç çalışmadı',
        duration: '0s',
        description: workflowData.description || 'Yeni oluşturulan workflow (offline)',
        steps: 0,
        completedSteps: 0,
        priority: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        nodes: [],
        edges: [],
        triggers: []
      };
      setWorkflows(prev => [...prev, fallbackWorkflow]);
      return fallbackWorkflow;
    } finally {
      setLoading(false);
    }
  };

  // Yeni workflow ekle (eski fonksiyon - geriye uyumluluk için)
  const addWorkflow = (workflow) => {
    const newWorkflow = {
      ...workflow,
      id: Date.now().toString(), // Geçici ID
      status: 'draft',
      lastRun: 'Hiç çalışmadı',
      duration: '0s',
      steps: workflow.nodes ? workflow.nodes.length : 0,
      completedSteps: 0
    };
    setWorkflows(prev => [...prev, newWorkflow]);
    return newWorkflow;
  };

  // Workflow güncelle
  const updateWorkflow = (id, updates) => {
    setWorkflows(prev => 
      prev.map(workflow => 
        workflow.id === id 
          ? { ...workflow, ...updates }
          : workflow
      )
    );
  };

  // Workflow sil
  const deleteWorkflow = (id) => {
    setWorkflows(prev => prev.filter(workflow => workflow.id !== id));
  };

  // Context value
  const contextValue = {
    workflows,
    loading,
    error,
    addWorkflow,
    createNewWorkflow,
    updateWorkflow,
    deleteWorkflow,
    refreshWorkflows
  };

  // Fallback workflow data (eski static data)
  const fallbackWorkflows = [
    {
      id: '1',
      name: 'Raporlama ve Analiz',
      status: 'pending',
      lastRun: '1 gün önce',
      duration: '3m 45s',
      description: 'Haftalık performans raporlarını oluşturur',
      steps: 6,
      completedSteps: 0
    },
    {
      id: '5',
      name: 'Sistem Bakım Kontrolü',
      status: 'completed',
      lastRun: '3 saat önce',
      duration: '1m 12s',
      description: 'Sistem sağlığını kontrol eder ve gerekli bakımları yapar',
      steps: 4,
      completedSteps: 4
    },
    {
      id: '6',
      name: 'API Entegrasyon Testi',
      status: 'running',
      lastRun: '10 dakika önce',
      duration: '2m 45s',
      description: 'Harici API entegrasyonlarını test eder',
      steps: 3,
      completedSteps: 1
    }
  ];

  // Context value'yu return et
  const value = contextValue;

  return (
    <WorkflowContext.Provider value={value}>
      <Router>
        <div className="h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/workflow-builder/:workflowId" element={<WorkflowBuilder />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </WorkflowContext.Provider>
  );
}

export default App;