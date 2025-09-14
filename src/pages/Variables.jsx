import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Shield, Globe, User, Clock, Loader2, AlertCircle } from "lucide-react";
import { apiService } from "../services/api";
import CreateVariableModal from "../components/CreateVeriableModal";

// Mock data removed - now using real API data

const getScopeIcon = (scope) => {
  switch (scope) {
    case "GLOBAL": return <Globe className="w-4 h-4 text-green-400" />;
    case "USER": return <User className="w-4 h-4 text-blue-400" />;
    default: return <Shield className="w-4 h-4 text-yellow-400" />;
  }
};

const getScopeBadge = (scope) => {
  const colors = {
    GLOBAL: "bg-green-500/20 text-green-400 border border-green-500/40",
    USER: "bg-blue-500/20 text-blue-400 border border-blue-500/40",
    SESSION: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40",
  };
  return <span className={`px-2 py-1 text-xs rounded-md ${colors[scope] || "bg-gray-600/30 text-gray-300"}`}>{scope}</span>;
};

const getTypeBadge = (type) => {
  const colors = {
    STRING: "bg-purple-500/20 text-purple-400 border border-purple-500/40",
    INTEGER: "bg-blue-500/20 text-blue-400 border border-blue-500/40",
    URL: "bg-green-500/20 text-green-400 border border-green-500/40",
    BOOLEAN: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40",
  };
  return <span className={`px-2 py-1 text-xs rounded-md ${colors[type] || "bg-gray-600/30 text-gray-300"}`}>{type}</span>;
};

const formatDate = (date) => new Date(date).toLocaleString();


export default function Environment() {
  const [searchTerm, setSearchTerm] = useState("");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [showValues, setShowValues] = useState({});
  const [environmentVariables, setEnvironmentVariables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingVariable, setEditingVariable] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // API'den environment variables'ları çek
  useEffect(() => {
    const fetchVariables = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiService.getEnvironmentVariables();
        if (result.success) {
          setEnvironmentVariables(result.variables);
        } else {
          setError('Veriler yüklenirken hata oluştu');
        }
      } catch (err) {
        console.error('Error fetching environment variables:', err);
        setError(err.message || 'Veriler yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchVariables();
  }, []);

  const toggleValueVisibility = (id) => {
    setShowValues(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Refresh variables list
  const refreshVariables = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.getEnvironmentVariables();
      if (result.success) {
        setEnvironmentVariables(result.variables);
      } else {
        setError('Veriler yüklenirken hata oluştu');
      }
    } catch (err) {
      console.error('Error fetching environment variables:', err);
      setError(err.message || 'Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Handle variable creation/update success
  const handleVariableSuccess = (result) => {
    console.log('Variable operation successful:', result);
    refreshVariables();
  };

  // Handle edit variable
  const handleEditVariable = (variable) => {
    setEditingVariable(variable);
    setIsCreateModalOpen(true);
  };

  // Handle delete variable
  const handleDeleteVariable = async (variable) => {
    if (!deleteConfirm || deleteConfirm.id !== variable.id) {
      setDeleteConfirm(variable);
      return;
    }

    try {
      const result = await apiService.deleteEnvironmentVariable(variable.id);
      if (result.success) {
        console.log('Variable deleted successfully:', result);
        refreshVariables();
        setDeleteConfirm(null);
      } else {
        setError(result.message || 'Variable silinirken hata oluştu');
      }
    } catch (err) {
      console.error('Error deleting variable:', err);
      setError(err.message || 'Variable silinirken hata oluştu');
    }
  };

  // Close modals
  const closeModals = () => {
    setIsCreateModalOpen(false);
    setEditingVariable(null);
    setDeleteConfirm(null);
  };

  const filteredVariables = environmentVariables.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesScope = scopeFilter === "all" || v.scope === scopeFilter;
    return matchesSearch && matchesScope;
  });

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gradient-to-br from-gray-900 via-gray-950 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Environment variables yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen p-8 bg-gradient-to-br from-gray-900 via-gray-950 to-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-gray-900 via-gray-950 to-black">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-500" />
            Environment Variables ({filteredVariables.length})
          </h1>
          <p className="text-gray-400 mt-1">Manage secure configuration variables for your workflows and scripts</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <Plus className="w-4 h-4" /> New Variable
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e)=>setSearchTerm(e.target.value)}
            placeholder="Search variables..."
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-900 text-gray-200 border border-gray-700 focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <select
          value={scopeFilter}
          onChange={(e)=>setScopeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-900 text-gray-200 border border-gray-700 focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Scopes</option>
          <option value="GLOBAL">Global</option>
          <option value="USER">User</option>
          <option value="SESSION">Session</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900/60 backdrop-blur-lg rounded-xl border border-gray-700 overflow-hidden shadow-xl">
        <table className="w-full border-collapse text-gray-200">
          <thead className="bg-gray-800/70 text-gray-400 text-sm">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Value</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Scope</th>
              <th className="p-3 text-left">Access Count</th>
               <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVariables.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-400">
                  <Shield className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                  <p>Henüz environment variable bulunmuyor</p>
                  <p className="text-sm mt-1">Yeni bir variable oluşturmak için "New Variable" butonuna tıklayın</p>
                </td>
              </tr>
            ) : (
              filteredVariables.map(v => (
                <tr key={v.id} className="border-t border-gray-800 hover:bg-purple-500/10 transition">
                  <td className="p-3 font-mono">
                    <div>{v.name}</div>
                    <div className="text-xs text-gray-400">{v.description}</div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-800 px-2 py-1 rounded text-gray-200">
                        {showValues[v.id] ? v.value : "••••••••"}
                      </code>
                      <button onClick={()=>toggleValueVisibility(v.id)}>
                        {showValues[v.id] ? <EyeOff className="w-4 h-4 text-red-400" /> : <Eye className="w-4 h-4 text-green-400" />}
                      </button>
                    </div>
                  </td>
                  <td className="p-3">{getTypeBadge(v.type)}</td>
                  <td className="p-3 flex items-center gap-2">{getScopeIcon(v.scope)} {getScopeBadge(v.scope)}</td>
                  <td className="p-3 flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400" /> {v.access_count}</td>
                  <td className="p-3 text-xs text-gray-400">{v.last_accessed_at ? formatDate(v.last_accessed_at) : 'Hiç kullanılmamış'}</td>
                  <td className="p-3 flex justify-end gap-2">
                    <button 
                      onClick={() => handleEditVariable(v)}
                      className="p-2 hover:bg-purple-600/20 rounded-lg transition"
                      title="Edit variable"
                    >
                      <Edit className="w-4 h-4 text-gray-200" />
                    </button>
                    <button 
                      onClick={() => handleDeleteVariable(v)}
                      className={`p-2 rounded-lg transition ${
                        deleteConfirm?.id === v.id 
                          ? 'bg-red-600/20 text-red-400' 
                          : 'hover:bg-red-600/20 text-red-400'
                      }`}
                      title={deleteConfirm?.id === v.id ? 'Click again to confirm delete' : 'Delete variable'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Variable Modal */}
      <CreateVariableModal
        isOpen={isCreateModalOpen}
        onClose={closeModals}
        onSuccess={handleVariableSuccess}
        editingVariable={editingVariable}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete Variable</h3>
                  <p className="text-sm text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-300 mb-2">
                  Are you sure you want to delete the variable:
                </p>
                <div className="bg-gray-800 p-3 rounded-lg">
                  <code className="text-purple-400 font-mono">{deleteConfirm.name}</code>
                  {deleteConfirm.description && (
                    <p className="text-gray-400 text-sm mt-1">{deleteConfirm.description}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteVariable(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Variable
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
