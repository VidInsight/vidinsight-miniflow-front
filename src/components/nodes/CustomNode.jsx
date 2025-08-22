import React from 'react';
import { Handle, Position } from '@xyflow/react';

const CustomNode = ({ data, selected }) => {
  const Icon = data.icon;

  return (
    <div className={`
      relative bg-white rounded-lg shadow-md border-2 transition-all duration-200
      ${selected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'}
      min-w-[160px]
    `}>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-gray-400 hover:!bg-blue-500 transition-colors"
      />
      
      <div className="p-4">
        <div className="flex items-center space-x-3">
          <div className={`
            w-10 h-10 ${data.color || 'bg-gray-500'} rounded-lg flex items-center justify-center
            shadow-sm
          `}>
            {typeof Icon === 'function' ? (
              <Icon className="w-5 h-5 text-white" />
            ) : (
              <span className="text-lg">{typeof data.icon === 'string' ? data.icon : '⚙️'}</span>
            )}
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-800 text-sm">{data.label}</div>
            <div className="text-xs text-gray-500 capitalize">{data.type}</div>
          </div>
        </div>
        
        {data.description && (
          <div className="mt-2 text-xs text-gray-600 leading-relaxed">
            {data.description}
          </div>
        )}
        
        {data.status && (
          <div className={`
            mt-2 px-2 py-1 rounded text-xs font-medium
            ${data.status === 'success' ? 'bg-green-100 text-green-800' : 
              data.status === 'error' ? 'bg-red-100 text-red-800' : 
              data.status === 'running' ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'}
          `}>
            {data.status === 'success' ? '✓ Success' : 
             data.status === 'error' ? '✗ Error' : 
             data.status === 'running' ? '⏳ Running' :
             '⏳ Pending'}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-gray-400 hover:!bg-blue-500 transition-colors"
      />
    </div>
  );
};

export default CustomNode;