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
  
  const [executions, setExecutions] = useState([]);
  const [executionsLoading, setExecutionsLoading] = useState(false);
  const [executionsError, setExecutionsError] = useState(null);

  const [isCreateWorkflowModalOpen, setIsCreateWorkflowModalOpen] = useState(false);
  const [isCreateScriptModalOpen, setIsCreateScriptModalOpen] = useState(false);
  const [isCreateVariableModalOpen, setIsCreateVariableModalOpen] = useState(false);

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

  useEffect(() => {
    fetchExecutions();
  }, []);

  const handleWorkflowCreated = (workflow) => {
    console.log('✅ New workflow created:', workflow);
    navigate(`/workflow-builder/${workflow.id}`);
  };

  const handleScriptCreated = (newScript) => {
    console.log('✅ New script created:', newScript);
    navigate('/scripts');
  };

  const handleVariableSuccess = (result) => {
    console.log('✅ Variable operation successful:', result);
    navigate('/variables');
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
    <div className="min-h-screen flex bg-black relative overflow-hidden">
      {/* Arka Plan Efektleri */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,150,255,0.2),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(255,0,150,0.2),transparent_40%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 mix-blend-overlay"></div>

      {/* İçerik */}
      <div className="flex-1 flex flex-col relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-10 flex-1">
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-blue-500/30 transition-all">
              <StatsCard title="Toplam Workflow" value={stats.total} icon={Workflow} color="bg-blue-500" change="+2 bu ay" changeType="positive"/>
            </div>
            <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-green-500/30 transition-all">
              <StatsCard title="Çalışan Workflow" value={stats.running} icon={TrendingUp} color="bg-green-500" change="Aktif" changeType="neutral"/>
            </div>
            <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-purple-500/30 transition-all">
              <StatsCard title="Tamamlanan Workflow" value={stats.completed} icon={Clock} change="+15 bugün" changeType="positive"/>
            </div>
            <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-red-500/30 transition-all">
              <StatsCard title="Başarısız Workflow" value={stats.failed} icon={AlertCircle} change="-2 bu hafta" changeType="positive"/>
            </div>
          </div>

          {/* Butonlar */}
          <div className="mb-10">
            <div className="flex flex-wrap gap-6">
              <button
                onClick={() => setIsCreateWorkflowModalOpen(true)}
                className="relative flex items-center space-x-3 px-7 py-3 rounded-2xl font-semibold tracking-wide 
                           bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 
                           text-white shadow-lg shadow-blue-500/30 
                           hover:scale-105 hover:shadow-blue-500/60 transition-all duration-300"
              >
                <Plus className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
                <span>Create Workflow</span>
              </button>

              <button
                onClick={() => setIsCreateScriptModalOpen(true)}
                className="relative flex items-center space-x-3 px-7 py-3 rounded-2xl font-semibold tracking-wide 
                           bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 
                           text-white shadow-lg shadow-green-500/30 
                           hover:scale-105 hover:shadow-green-500/60 transition-all duration-300"
              >
                <Code className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
                <span>Create Script</span>
              </button>

              <button
                onClick={() => setIsCreateVariableModalOpen(true)}
                className="relative flex items-center space-x-3 px-7 py-3 rounded-2xl font-semibold tracking-wide 
                           bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 
                           text-white shadow-lg shadow-pink-500/30 
                           hover:scale-105 hover:shadow-pink-500/60 transition-all duration-300"
              >
                <Database className="w-5 h-5 transition-transform duration-300 group-hover:-rotate-12" />
                <span>Create Variable</span>
              </button>
            </div>
          </div>

          {/* Executions Table */}
          <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl p-4">
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

export default Dashboard;
