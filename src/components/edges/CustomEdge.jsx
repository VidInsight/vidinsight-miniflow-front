import React, { useState } from 'react';
import { getSmoothStepPath, EdgeLabelRenderer, BaseEdge } from '@xyflow/react';
import { X } from 'lucide-react';

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Edge'in ortasındaki koordinatları hesapla
  const centerX = (sourceX + targetX) / 2;
  const centerY = (sourceY + targetY) / 2;

  const handleDeleteEdge = (event) => {
    event.stopPropagation();
    console.log('🗑️ Delete button clicked for edge:', id);
    
    // Custom event oluştur ve dispatch et
    const deleteEvent = new CustomEvent('edgeDelete', {
      detail: { edgeId: id, apiEdgeId: data?.apiEdgeId }
    });
    window.dispatchEvent(deleteEvent);
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: '#3b82f6',
          strokeWidth: 2,
          ...style,
        }}
      />
      
      {/* Silme butonu - sürekli görünür */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${centerX}px,${centerY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button
            onClick={handleDeleteEdge}
            className="bg-gray-300 hover:bg-gray-400 text-gray-600 hover:text-gray-700 rounded-full w-4 h-4 flex items-center justify-center shadow-sm transition-colors z-10"
            title="Edge'i sil"
          >
            <X className="w-2 h-2" />
          </button>
        </div>
      </EdgeLabelRenderer>
      
      {/* Edge label */}
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: 'all',
            }}
            className="nodrag nopan bg-white px-2 py-1 rounded shadow-sm border border-gray-200 text-gray-600"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default CustomEdge;