import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Play,
  Code2,
  Clock,
  Filter,
  FileText,
  BarChart3,
  CheckCircle2,
  Tag,
} from "lucide-react";
import CreateScriptModal from "../components/CreateScriptModal";
import { apiService } from "../services/api";

// ✅ Renkli badge fonksiyonları
const getCategoryBadge = (category) => {
  const colors = {
    data_processing: "bg-green-500/20 text-green-400 border border-green-500/40",
    communication: "bg-blue-500/20 text-blue-400 border border-blue-500/40",
    maintenance: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40",
    validation: "bg-gray-500/20 text-gray-400 border border-gray-500/40",
  };
  return (
    <span
      className={`px-2 py-1 text-xs rounded-md ${colors[category] || "bg-gray-600/30 text-gray-300 border border-gray-500/40"}`}
    >
      {category.replace("_", " ")}
    </span>
  );
};

const getExtensionBadge = (ext) => {
  const colors = {
    py: "bg-green-500/20 text-green-400 border border-green-500/40",
    js: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40",
    sh: "bg-blue-500/20 text-blue-400 border border-blue-500/40",
    sql: "bg-purple-500/20 text-purple-400 border border-purple-500/40",
  };
  return (
    <span
      className={`px-2 py-1 text-xs rounded-md font-mono ${
        colors[ext] || "bg-gray-600/30 text-gray-300 border border-gray-500/40"
      }`}
    >
      {ext.toUpperCase()}
    </span>
  );
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
const formatDate = (date) => new Date(date).toLocaleDateString();

export default function Scripts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadScripts = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.getScripts();
      if (result.success && Array.isArray(result.scripts)) {
        setScripts(result.scripts);
      } else {
        setError("API'den veri alınamadı.");
      }
    } catch (error) {
      console.error('Error loading scripts:', error);
      setError("API bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScripts();
  }, []);

  const filteredScripts = scripts.filter((s) => {
    const matchesSearch =
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(s.tags) && s.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesCategory = categoryFilter === "all" || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleScriptCreated = (newScript) => {
    console.log('✅ New script created:', newScript);
    // Script listesini yeniden yükle
    loadScripts();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Code2 className="w-7 h-7 text-purple-500" />
              Scripts Library
            </h1>
            <p className="text-gray-400">
              Manage and execute your automation scripts with performance monitoring
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-purple-500/50 hover:bg-gray-700 transition">
              <FileText className="w-4 h-4 mr-2 text-gray-300" />
              <span className="text-gray-200">Import Script</span>
            </button>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Script
            </button>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="bg-gray-800/60 backdrop-blur-lg rounded-xl border border-gray-700 p-4 flex gap-4 items-center shadow-lg">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Search scripts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="data_processing">Data Processing</option>
            <option value="communication">Communication</option>
            <option value="maintenance">Maintenance</option>
            <option value="validation">Validation</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-gray-900/60 backdrop-blur-lg rounded-xl border border-gray-700 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">
              Scripts ({filteredScripts.length})
            </h2>
            <p className="text-sm text-gray-400">
              Automation scripts with performance metrics and execution history
            </p>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading scripts...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-400">{error}</div>
          ) : (
            <table className="w-full border-collapse text-gray-200">
              <thead>
                <tr className="bg-gray-800/70 text-left text-sm text-gray-400">
                  <th className="p-3 font-medium">Script</th>
                  <th className="p-3 font-medium">Category</th>
                  <th className="p-3 font-medium">Performance</th>
                  <th className="p-3 font-medium">Version</th>
                  <th className="p-3 font-medium">Size</th>
                  <th className="p-3 font-medium">Last Updated</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredScripts.map((s) => (
                  <tr
                    key={s.id}
                    className="border-t border-gray-800 hover:bg-purple-500/10 transition"
                  >
                    <td className="p-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-white">{s.name}</span>
                          {getExtensionBadge((s.file_extension || '').replace('.', ''))}
                        </div>
                        <p className="text-xs text-gray-400">{s.description}</p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {(Array.isArray(s.tags) && s.tags.length > 0 ? s.tags.slice(0, 3) : []).map((tag) => (
                            <span
                              key={tag}
                              className="flex items-center text-xs border border-gray-600 text-gray-300 px-1 py-0.5 rounded"
                            >
                              <Tag className="w-2 h-2 mr-1" />
                              {tag}
                            </span>
                          ))}
                          {Array.isArray(s.tags) && s.tags.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{s.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{getCategoryBadge(s.category)}</td>
                    <td className="p-3 text-sm">
                      <div className="flex items-center gap-1 text-green-400">
                        <CheckCircle2 className="w-3 h-3" />
                        {s.success_rate !== null && s.success_rate !== undefined ? `${s.success_rate}% success` : '—'}
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-3 h-3" /> {s.avg_execution_time !== null && s.avg_execution_time !== undefined ? `${s.avg_execution_time}s avg` : '—'}
                      </div>
                      <div className="text-xs text-gray-500">{s.total_executions ?? 0} runs</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 border border-gray-600 rounded text-xs text-gray-300">
                        {s.version}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-400">{formatFileSize(s.file_size)}</td>
                    <td className="p-3 text-sm text-gray-400">{formatDate(s.updated_at)}</td>
                    <td className="p-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <button className="p-2 hover:bg-purple-600/20 rounded-lg transition">
                          <Play className="w-4 h-4 text-purple-400" />
                        </button>
                        <button className="p-2 hover:bg-purple-600/20 rounded-lg transition">
                          <BarChart3 className="w-4 h-4 text-indigo-400" />
                        </button>
                        <button className="p-2 hover:bg-purple-600/20 rounded-lg transition">
                          <Edit className="w-4 h-4 text-gray-300" />
                        </button>
                        <button className="p-2 hover:bg-red-600/20 rounded-lg transition">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Create Script Modal */}
        <CreateScriptModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onScriptCreated={handleScriptCreated}
        />
      </div>
    </div>
  );
}
