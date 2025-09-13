import React from 'react';
import { Clock, CheckCircle, XCircle, Play, Pause, Edit } from 'lucide-react';

const statusConfig = {
  running: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Play,
    dot: 'bg-blue-500'
  },
  completed: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    dot: 'bg-green-500'
  },
  failed: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    dot: 'bg-red-500'
  },
  pending: {
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Pause,
    dot: 'bg-amber-500'
  },
  draft: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Clock,
    dot: 'bg-gray-500'
  },
  // Default fallback
  default: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Clock,
    dot: 'bg-gray-500'
  }
};

export default function WorkflowCard({ workflow, onClick, onEdit }) {
  // Güvenli status config alma
  const config = statusConfig[workflow.status] || statusConfig.default;
  const StatusIcon = config?.icon || Clock;
  const progress = workflow.steps > 0 ? (workflow.completedSteps / workflow.steps) * 100 : 0;

  const handleEditClick = (e) => {
    e.stopPropagation(); // Prevent card click event
    if (onEdit) {
      onEdit(workflow);
    }
  };

  // Tüm metinler için kısaltma
  const truncate = (str, n) => str && str.length > n ? str.slice(0, n) + '...' : str;
  const shortName = truncate(workflow.name, 28);
  const shortDesc = truncate(workflow.description, 60);
  const shortStatus = truncate(workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1), 16);
  const shortNodeCount = truncate(`Node Sayısı : ${workflow.steps}`, 16);

  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group hover:border-gray-300 relative"
      style={{ minHeight: '180px', height: '160px', minWidth: '300px', maxWidth: '300px', width: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
      onClick={() => onClick(workflow)}
    >
      {/* Edit Button */}
      <button
        onClick={handleEditClick}
        className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
        title="Düzenle"
      >
        <Edit className="w-4 h-4" />
      </button>

      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {shortName}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {shortDesc}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{shortNodeCount}</span>
          </div>
        </div>
      </div>
      {/* Sağ alt köşede durum bilgisi */}
      <div
        className={`absolute bottom-4 right-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}
        style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        <div className={`w-2 h-2 rounded-full ${config.dot} mr-2`}></div>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', verticalAlign: 'middle', maxWidth: '70px' }}>
          {shortStatus}
        </span>
      </div>
    </div>
  );
}