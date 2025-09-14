import { useState, useEffect } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import { apiService } from "../services/api";

export default function CreateVariableModal({ isOpen, onClose, onSuccess, editingVariable = null }) {
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    description: '',
    variable_type: 'string',
    scope: 'user'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form validation
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingVariable) {
      setFormData({
        name: editingVariable.name || '',
        value: editingVariable.value || '',
        description: editingVariable.description || '',
        variable_type: editingVariable.type?.toLowerCase() || 'string',
        scope: editingVariable.scope?.toLowerCase() || 'user'
      });
    } else {
      setFormData({
        name: '',
        value: '',
        description: '',
        variable_type: 'string',
        scope: 'user'
      });
    }
    setError('');
    setErrors({});
  }, [editingVariable, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Variable name is required';
    } else if (!/^[A-Z_][A-Z0-9_]*$/i.test(formData.name)) {
      newErrors.name = 'Variable name must start with letter and contain only letters, numbers, and underscores';
    }

    if (!formData.value.trim()) {
      newErrors.value = 'Variable value is required';
    }

    if (!formData.variable_type) {
      newErrors.variable_type = 'Variable type is required';
    }

    if (!formData.scope) {
      newErrors.scope = 'Scope is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        name: formData.name.trim(),
        value: formData.value.trim(),
        description: formData.description.trim(),
        variable_type: formData.variable_type,
        scope: formData.scope
      };

      let result;
      if (editingVariable) {
        result = await apiService.updateEnvironmentVariable(editingVariable.id, payload);
      } else {
        result = await apiService.createEnvironmentVariable(payload);
      }

      if (result.success) {
        onSuccess(result);
        onClose();
      } else {
        setError(result.message || 'An error occurred');
      }
    } catch (err) {
      console.error('Error saving variable:', err);
      setError(err.message || 'An error occurred while saving the variable');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {editingVariable ? 'Edit Environment Variable' : 'Create Environment Variable'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Variable Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Variable Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., API_KEY, DATABASE_URL"
              className={`w-full px-3 py-2 rounded-lg bg-gray-800 text-gray-200 border ${
                errors.name ? 'border-red-500' : 'border-gray-600'
              } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              disabled={loading}
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Variable Value */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Variable Value *
            </label>
            <textarea
              value={formData.value}
              onChange={(e) => handleInputChange('value', e.target.value)}
              placeholder="Enter the variable value..."
              rows={3}
              className={`w-full px-3 py-2 rounded-lg bg-gray-800 text-gray-200 border ${
                errors.value ? 'border-red-500' : 'border-gray-600'
              } focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none`}
              disabled={loading}
            />
            {errors.value && (
              <p className="text-red-400 text-xs mt-1">{errors.value}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Optional description for this variable..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 text-gray-200 border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              disabled={loading}
            />
          </div>

          {/* Variable Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Variable Type *
            </label>
            <select
              value={formData.variable_type}
              onChange={(e) => handleInputChange('variable_type', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg bg-gray-800 text-gray-200 border ${
                errors.variable_type ? 'border-red-500' : 'border-gray-600'
              } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              disabled={loading}
            >
              <option value="string">String</option>
              <option value="integer">Integer</option>
              <option value="boolean">Boolean</option>
              <option value="url">URL</option>
            </select>
            {errors.variable_type && (
              <p className="text-red-400 text-xs mt-1">{errors.variable_type}</p>
            )}
          </div>

          {/* Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Scope *
            </label>
            <select
              value={formData.scope}
              onChange={(e) => handleInputChange('scope', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg bg-gray-800 text-gray-200 border ${
                errors.scope ? 'border-red-500' : 'border-gray-600'
              } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              disabled={loading}
            >
              <option value="user">User</option>
              <option value="global">Global</option>
              <option value="session">Session</option>
            </select>
            {errors.scope && (
              <p className="text-red-400 text-xs mt-1">{errors.scope}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {editingVariable ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {editingVariable ? 'Update Variable' : 'Create Variable'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
