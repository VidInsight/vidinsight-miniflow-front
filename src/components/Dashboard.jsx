import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Workflow, TrendingUp, Clock, AlertCircle, RefreshCw, Plus, Code, Database } from 'lucide-react';
import StatsCard from './StatsCard';
import ExecutionsTable from './ExecutionTable';
import CreateWorkflowModal from './CreateWorkflowModal';
import CreateScriptModal from './CreateScriptModal';
import CreateVariableModal from '../components/CreateVeriableModal';
import { useWorkflows } from '../App';
import { apiService } from '../services/api';
function Dashboard() {
  const navigate = useNavigate();
  const { workflows, loading, error, refreshWorkflows } = useWorkflows();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Executions state
  const [executions, setExecutions] = useState([]);
  const [executionsLoading, setExecutionsLoading] = useState(false);
  const [executionsError, setExecutionsError] = useState(null);

  // Modal states
  const [isCreateWorkflowModalOpen, setIsCreateWorkflowModalOpen] = useState(false);
  const [isCreateScriptModalOpen, setIsCreateScriptModalOpen] = useState(false);
  const [isCreateVariableModalOpen, setIsCreateVariableModalOpen] = useState(false);

  // Fetch executions
  const fetchExecutions = async () => {
    setExecutionsLoading(true);
    setExecutionsError(null);
    try {
      const result = await apiService.getExecutions();
      setExecutions(result.executions);
    } catch (error) {
      console.error('Error fetching executions:', error);
      setExecutionsError(error.message);
    } finally {
      setExecutionsLoading(false);
    }
  };

  // Load executions on component mount
  useEffect(() => {
    fetchExecutions();
  }, []);

  // Modal handlers
  const handleWorkflowCreated = (workflow) => {
    console.log('✅ New workflow created:', workflow);
    // Workflow builder'a yönlendir
    navigate(`/workflow-builder/${workflow.id}`);
  };

  const handleScriptCreated = (newScript) => {
    console.log('✅ New script created:', newScript);
    // Scripts sayfasına yönlendir
    navigate('/scripts');
  };

  const handleVariableSuccess = (result) => {
    console.log('✅ Variable operation successful:', result);
    // Variables sayfasına yönlendir
    navigate('/variables');
  };

  // Filtrelenmiş workflow'lar
  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination için state
  const [currentPage, setCurrentPage] = useState(1);
  const workflowsPerPage = 6;
  const totalPages = Math.ceil(filteredWorkflows.length / workflowsPerPage);
  const paginatedWorkflows = filteredWorkflows.slice(
    (currentPage - 1) * workflowsPerPage,
    currentPage * workflowsPerPage
  );

  const stats = {
    total: workflows.length,
    running: workflows.filter(w => w.status === 'running').length,
    completed: workflows.filter(w => w.status === 'completed').length,
    failed: workflows.filter(w => w.status === 'failed').length
  };

  return (
  <div className="min-h-screen bg-black flex">
     
    {/* Sağdaki içerik alanı */}
    <div className="flex-1 flex flex-col">


      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Toplam Workflow"
            value={stats.total}
            icon={Workflow}
            color="bg-blue-500"
            change="+2 bu ay"
            changeType="positive"
          />
          <StatsCard
            title="Çalışan Workflow"
            value={stats.running}
            icon={TrendingUp}
            color="bg-green-500"
            change="Aktif"
            changeType="neutral"
          />
          <StatsCard
            title="Tamamlanan Workflow"
            value={stats.completed}
            icon={Clock}
             change="+15 bugün"
            changeType="positive"
          />
          <StatsCard
            title="Başarısız Workflow"
            value={stats.failed}
            icon={AlertCircle}
             change="-2 bu hafta"
            changeType="positive"
          />
        </div>

        {/* Create Buttons Section */}
        <div className="mb-8">
  <div className="flex flex-wrap gap-4">
    {/* Create Workflow */}
    <button
      onClick={() => setIsCreateWorkflowModalOpen(true)}
      className="group relative flex items-center space-x-2 px-6 py-3 
                 bg-gradient-to-r from-blue-500 to-indigo-600 
                 text-white rounded-xl shadow-lg backdrop-blur-md 
                 transition-all duration-300 
                 hover:scale-105 hover:shadow-blue-500/40"
    >
      <Plus className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
      <span className="font-semibold tracking-wide">Create Workflow</span>
    </button>

    {/* Create Script */}
    <button
      onClick={() => setIsCreateScriptModalOpen(true)}
      className="group relative flex items-center space-x-2 px-6 py-3 
                 bg-gradient-to-r from-green-500 to-emerald-600 
                 text-white rounded-xl shadow-lg backdrop-blur-md 
                 transition-all duration-300 
                 hover:scale-105 hover:shadow-green-500/40"
    >
      <Code className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
      <span className="font-semibold tracking-wide">Create Script</span>
    </button>

    {/* Create Variable */}
    <button
      onClick={() => setIsCreateVariableModalOpen(true)}
      className="group relative flex items-center space-x-2 px-6 py-3 
                 bg-gradient-to-r from-purple-500 to-pink-600 
                 text-white rounded-xl shadow-lg backdrop-blur-md 
                 transition-all duration-300 
                 hover:scale-105 hover:shadow-purple-500/40"
    >
      <Database className="w-5 h-5 transition-transform duration-300 group-hover:-rotate-12" />
      <span className="font-semibold tracking-wide">Create Variable</span>
    </button>
  </div>
</div>


        {/* Executions Table */}
        <div className="mb-8">
          <ExecutionsTable
            executions={executions}
            loading={executionsLoading}
            error={executionsError}
            onRefresh={fetchExecutions}
          />
        </div>
      
      </div>
    </div>

    {/* Modals */}
    <CreateWorkflowModal
      isOpen={isCreateWorkflowModalOpen}
      onClose={() => setIsCreateWorkflowModalOpen(false)}
      onWorkflowCreated={handleWorkflowCreated}
    />

    <CreateScriptModal
      isOpen={isCreateScriptModalOpen}
      onClose={() => setIsCreateScriptModalOpen(false)}
      onScriptCreated={handleScriptCreated}
    />

    <CreateVariableModal
      isOpen={isCreateVariableModalOpen}
      onClose={() => setIsCreateVariableModalOpen(false)}
      onSuccess={handleVariableSuccess}
    />
  </div>
);

}

export default Dashboard
