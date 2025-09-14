import React, { useState } from 'react';
import { X, Plus, Loader, Code2, FileText, Tag, Package } from 'lucide-react';

export default function CreateScriptModal({ isOpen, onClose, onScriptCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    language: 'PY',
    category: 'data_processing',
    subcategory: 'utilities',
    description: '',
    version: '1.0.0',
    content: '',
    required_packages: [],
    input_schema: {},
    output_schema: {},
    test_input_params: {},
    test_output_params: {},
    tags: [],
    author: ''
  });
  
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [newPackage, setNewPackage] = useState('');
  const [newTag, setNewTag] = useState('');

  const languageOptions = [
    { value: 'PY', label: 'Python' },
    { value: 'JS', label: 'JavaScript' },
    { value: 'SH', label: 'Shell' },
    { value: 'SQL', label: 'SQL' }
  ];

  const categoryOptions = [
    { value: 'data_processing', label: 'Data Processing' },
    { value: 'communication', label: 'Communication' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'validation', label: 'Validation' }
  ];

  const subcategoryOptions = {
    data_processing: [
      { value: 'utilities', label: 'Utilities' },
      { value: 'transformation', label: 'Transformation' },
      { value: 'analysis', label: 'Analysis' }
    ],
    communication: [
      { value: 'email', label: 'Email' },
      { value: 'api', label: 'API' },
      { value: 'notification', label: 'Notification' }
    ],
    maintenance: [
      { value: 'cleanup', label: 'Cleanup' },
      { value: 'backup', label: 'Backup' },
      { value: 'monitoring', label: 'Monitoring' }
    ],
    validation: [
      { value: 'data_validation', label: 'Data Validation' },
      { value: 'format_check', label: 'Format Check' },
      { value: 'integrity_check', label: 'Integrity Check' }
    ]
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addPackage = () => {
    if (newPackage.trim() && !formData.required_packages.includes(newPackage.trim())) {
      setFormData(prev => ({
        ...prev,
        required_packages: [...prev.required_packages, newPackage.trim()]
      }));
      setNewPackage('');
    }
  };

  const removePackage = (packageName) => {
    setFormData(prev => ({
      ...prev,
      required_packages: prev.required_packages.filter(pkg => pkg !== packageName)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Script adı gereklidir');
      return;
    }

    if (!formData.content.trim()) {
      setError('Script içeriği gereklidir');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      // API'ye script oluşturma isteği gönder
      const scriptData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim() || 'Script for processing data',
        content: formData.content.trim(),
        author: formData.author.trim() || 'Test User'
      };

      console.log('🔄 Creating script:', scriptData);
      
      const response = await fetch('https://n8n.vidinsight.com.tr/api/bff/scripts/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scriptData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Script created successfully:', result);
      
      if (result.success) {
        onScriptCreated(result.data);
        onClose();
      } else {
        throw new Error(result.message || 'Script oluşturulamadı');
      }
    } catch (error) {
      console.error('❌ Error creating script:', error);
      setError(error.message || 'Script oluşturulurken hata oluştu');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setFormData({
        name: '',
        language: 'PY',
        category: 'data_processing',
        subcategory: 'utilities',
        description: '',
        version: '1.0.0',
        content: '',
        required_packages: [],
        input_schema: {},
        output_schema: {},
        test_input_params: {},
        test_output_params: {},
        tags: [],
        author: ''
      });
      setNewPackage('');
      setNewTag('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Code2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Yeni Script</h2>
              <p className="text-sm text-gray-600">Yeni bir script oluştur</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isCreating}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Script Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Script Adı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Örn: data_processor"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isCreating}
                autoFocus
              />
            </div>

            {/* Language */}
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                Dil <span className="text-red-500">*</span>
              </label>
              <select
                id="language"
                value={formData.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isCreating}
              >
                {languageOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => {
                  handleInputChange('category', e.target.value);
                  handleInputChange('subcategory', subcategoryOptions[e.target.value][0].value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isCreating}
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory */}
            <div>
              <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-2">
                Alt Kategori
              </label>
              <select
                id="subcategory"
                value={formData.subcategory}
                onChange={(e) => handleInputChange('subcategory', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isCreating}
              >
                {subcategoryOptions[formData.category]?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Version */}
            <div>
              <label htmlFor="version" className="block text-sm font-medium text-gray-700 mb-2">
                Versiyon
              </label>
              <input
                type="text"
                id="version"
                value={formData.version}
                onChange={(e) => handleInputChange('version', e.target.value)}
                placeholder="1.0.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isCreating}
              />
            </div>

            {/* Author */}
            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
                Yazar
              </label>
              <input
                type="text"
                id="author"
                value={formData.author}
                onChange={(e) => handleInputChange('author', e.target.value)}
                placeholder="Test User"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isCreating}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Script'in ne yaptığını açıkla..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              disabled={isCreating}
            />
          </div>

          {/* Required Packages */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Package className="w-4 h-4 inline mr-1" />
              Gerekli Paketler
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newPackage}
                onChange={(e) => setNewPackage(e.target.value)}
                placeholder="Örn: pandas"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isCreating}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPackage())}
              />
              <button
                type="button"
                onClick={addPackage}
                disabled={isCreating || !newPackage.trim()}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.required_packages.map((pkg, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-md"
                >
                  {pkg}
                  <button
                    type="button"
                    onClick={() => removePackage(pkg)}
                    disabled={isCreating}
                    className="ml-1 text-purple-600 hover:text-purple-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Etiketler
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Örn: data, processing"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isCreating}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button
                type="button"
                onClick={addTag}
                disabled={isCreating || !newTag.trim()}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded-md"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    disabled={isCreating}
                    className="ml-1 text-gray-600 hover:text-gray-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Script Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Script İçeriği <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="import pandas as pd&#10;&#10;def process_data(df):&#10;    # Data processing logic&#10;    return df.dropna()&#10;&#10;if __name__ == '__main__':&#10;    print('Data processor script')"
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              disabled={isCreating}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isCreating}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isCreating || !formData.name.trim() || !formData.content.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isCreating ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Oluşturuluyor...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Oluştur</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
