import React from 'react';
import { CheckCircle, XCircle, Clock, Play } from 'lucide-react';

const ExecutionResults = ({ result, onClose }) => {
  if (!result) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Play className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Workflow Execution Results</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {/* Overall Result */}
          <div className={`mb-6 p-4 rounded-lg border ${getStatusColor(result.success ? 'success' : 'error')}`}>
            <div className="flex items-center space-x-2">
              {getStatusIcon(result.success ? 'success' : 'error')}
              <span className="font-medium">
                {result.success ? 'Workflow Completed Successfully' : 'Workflow Failed'}
              </span>
            </div>
            {result.error && (
              <p className="mt-2 text-sm">{result.error}</p>
            )}
          </div>

          {/* Execution History */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Execution History</h3>
            
            {result.executionHistory && result.executionHistory.length > 0 ? (
              <div className="space-y-3">
                {result.executionHistory.map((step, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(step.status)}
                        <span className="font-medium text-gray-800">{step.nodeLabel}</span>
                        <span className="text-sm text-gray-500">({step.nodeType})</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {step.executionTime}ms
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Input:</strong> {JSON.stringify(step.input, null, 2)}
                    </div>
                    
                    {step.output && (
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Output:</strong> {JSON.stringify(step.output, null, 2)}
                      </div>
                    )}
                    
                    {step.error && (
                      <div className="text-sm text-red-600">
                        <strong>Error:</strong> {step.error}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(step.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No execution history available.</p>
            )}
          </div>

          {/* Final Result */}
          {result.finalResult && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Final Result</h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(result.finalResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecutionResults; 