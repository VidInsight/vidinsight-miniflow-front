import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Workflow, TrendingUp, Clock, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import WorkflowCard from '../components/WorkflowCard';
import StatsCard from '../components/StatsCard';
import WorkflowModal from '../components/WorkflowModal';
import CreateWorkflowModal from '../components/CreateWorkflowModal'; // ✅ Yeni modal'ı import et
import { useWorkflows } from '../App';
  
function Workflows() {
  const navigate = useNavigate();
  const { workflows, loading, error, refreshWorkflows } = useWorkflows();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // ✅ Create modal state'i
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewType, setViewType] = useState('card'); // 'card' or 'list'


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

  const handleWorkflowClick = (workflow) => {
    setSelectedWorkflow(workflow);
    setIsModalOpen(true);
  };

  const handleEditWorkflow = (workflow) => {
    console.log('workflow', workflow)
    navigate(`/workflow-builder/${workflow.id}`);
  };

  // ✅ Yeni workflow oluşturulduğunda çağrılacak fonksiyon
  const handleWorkflowCreated = (workflow) => {
    console.log('✅ New workflow created:', workflow);
    // Workflow builder'a yönlendir
    navigate(`/workflow-builder/${workflow.id}`);
  };

  // ✅ New Workflow butonuna tıklandığında modal'ı aç
  const handleNewWorkflow = () => {
    setIsCreateModalOpen(true);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshWorkflows();
    } finally {
      setIsRefreshing(false);
    }
  };


 
     return (
 <div className="min-h-screen bg-black flex text-gray-200">
  {/* Sağdaki içerik alanı */}
  <div className="flex-1 flex flex-col">
    {/* Header */}
    <div className="bg-black border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-2">
            {/* Görünüm seçici */}
            <button
              className={`px-2 py-1 rounded-lg border ${viewType === 'card' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-200'}`}
              onClick={() => setViewType('card')}
              title="Kart görünümü"
            >
              <Workflow className="w-5 h-5" />
            </button>
            <button
              className={`px-2 py-1 rounded-lg border ${viewType === 'list' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-200'}`}
              onClick={() => setViewType('list')}
              title="Liste görünümü"
            >
              <TrendingUp className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center space-x-4">
            {error && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 mr-1" />
                <span>API Bağlantı Hatası</span>
              </div>
            )}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-purple-400 hover:bg-purple-900/30 rounded-lg transition-colors disabled:opacity-50"
              title="Workflow'ları Yenile"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing || loading ? "animate-spin text-purple-400" : ""}`}
              />
              <span>{isRefreshing ? "Yenileniyor..." : "Yenile"}</span>
            </button>
            {/* New Workflow Button */}
            <button
              onClick={handleNewWorkflow}
              disabled={loading}
              className="bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-md transform hover:scale-[1.03]"
            >
              <Plus className="w-4 h-4" />
              <span>New Workflow</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Content */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Toplam Workflow"
          value={stats.total}
          icon={Workflow}
          color="bg-purple-500"
          change="+2 bu ay"
          changeType="positive"
        />
        <StatsCard
          title="Çalışan Workflow"
          value={stats.running}
          icon={TrendingUp}
          color="bg-blue-500"
          change="Aktif"
          changeType="neutral"
        />
        <StatsCard
          title="Tamamlanan Workflow"
          value={stats.completed}
          icon={Clock}
          color="bg-green-500"
          change="+15 bugün"
          changeType="positive"
        />
        <StatsCard
          title="Başarısız Workflow"
          value={stats.failed}
          icon={AlertCircle}
          color="bg-red-500"
          change="-2 bu hafta"
          changeType="negative"
        />
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Workflow ara..."
              className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-xl bg-gray-900 text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Filter className="w-5 h-5 text-gray-400 mr-2" />
              <select
                className="border border-gray-600 rounded-xl px-3 py-2 bg-gray-900 text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tüm Durumlar</option>
                <option value="running">Çalışan</option>
                <option value="completed">Tamamlanan</option>
                <option value="failed">Başarısız</option>
                <option value="pending">Bekleyen</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Grid + List + Pagination */}
      {loading ? (
        viewType === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-gray-800 rounded-2xl border border-gray-700 p-6 animate-pulse"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-8 w-8 bg-gray-700 rounded"></div>
                </div>
                <div className="h-3 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-2/3 mb-4"></div>
                <div className="flex items-center justify-between">
                  <div className="h-6 bg-gray-700 rounded w-16"></div>
                  <div className="h-4 bg-gray-700 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-800 rounded-2xl border border-gray-700">
              <thead>
                <tr className="text-left text-gray-400">
                  <th className="px-4 py-2">Ad</th>
                  <th className="px-4 py-2">Durum</th>
                  <th className="px-4 py-2">Oluşturulma</th>
                  <th className="px-4 py-2">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {[1,2,3,4,5,6].map((i) => (
                  <tr key={i} className="border-t border-gray-700 animate-pulse">
                    <td className="px-4 py-2"><div className="h-4 bg-gray-700 rounded w-3/4"></div></td>
                    <td className="px-4 py-2"><div className="h-4 bg-gray-700 rounded w-1/2"></div></td>
                    <td className="px-4 py-2"><div className="h-4 bg-gray-700 rounded w-1/2"></div></td>
                    <td className="px-4 py-2"><div className="h-4 bg-gray-700 rounded w-1/2"></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <>
          {viewType === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedWorkflows.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  onClick={handleWorkflowClick}
                  onEdit={handleEditWorkflow}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-800 rounded-2xl border border-gray-700">
                <thead>
                  <tr className="text-left text-gray-400">
                    <th className="px-4 py-2">Ad</th>
                    <th className="px-4 py-2">Durum</th>
                    <th className="px-4 py-2">Oluşturulma</th>
                    <th className="px-4 py-2">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedWorkflows.map((workflow) => (
                    <tr key={workflow.id} className="border-t border-gray-700 hover:bg-gray-700/30">
                      <td className="px-4 py-2 cursor-pointer" onClick={() => handleWorkflowClick(workflow)}>
                        {workflow.name}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${workflow.status === 'completed' ? 'bg-green-700 text-green-200' : workflow.status === 'running' ? 'bg-blue-700 text-blue-200' : workflow.status === 'failed' ? 'bg-red-700 text-red-200' : 'bg-gray-700 text-gray-200'}`}>{workflow.status}</span>
                      </td>
                      <td className="px-4 py-2">
                        {workflow.createdAt ? new Date(workflow.createdAt).toLocaleString('tr-TR') : '-'}
                      </td>
                      <td className="px-4 py-2 flex gap-2">
                        <button
                          className="px-2 py-1 rounded bg-purple-600 text-white text-xs hover:bg-purple-700"
                          onClick={() => handleEditWorkflow(workflow)}
                        >Düzenle</button>
                        <button
                          className="px-2 py-1 rounded bg-gray-700 text-gray-200 text-xs hover:bg-gray-600"
                          onClick={() => handleWorkflowClick(workflow)}
                        >Detay</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 space-x-2">
              <button
                className="px-3 py-1 rounded-xl border bg-gray-800 text-gray-200 disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Önceki
              </button>
              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx}
                  className={`px-3 py-1 rounded-xl border ${currentPage === idx + 1 ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-200'}`}
                  onClick={() => setCurrentPage(idx + 1)}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                className="px-3 py-1 rounded-xl border bg-gray-800 text-gray-200 disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Sonraki
              </button>
            </div>
          )}
        </>
      )}

      {!loading && filteredWorkflows.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Workflow className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-200 mb-2">
            {error ? "Workflow verileri yüklenemedi" : "Workflow bulunamadı"}
          </h3>
          <p className="text-gray-400">
            {error
              ? "API bağlantısını kontrol edin ve yenile butonuna tıklayın."
              : "Farklı arama kriterleri deneyin veya yeni bir workflow oluşturun."}
          </p>
          {error && (
            <button
              onClick={handleRefresh}
              className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-all"
            >
              Tekrar Dene
            </button>
          )}
        </div>
      )}
    </div>
  </div>

  {/* Modallar */}
  {isModalOpen && selectedWorkflow && (
    <WorkflowModal
      workflow={selectedWorkflow}
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onEdit={handleEditWorkflow}
    />
  )}

  <CreateWorkflowModal
    isOpen={isCreateModalOpen}
    onClose={() => setIsCreateModalOpen(false)}
    onWorkflowCreated={handleWorkflowCreated}
  />
</div>

);
}

export default Workflows;