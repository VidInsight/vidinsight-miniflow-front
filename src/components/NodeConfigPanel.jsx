import React, { useState, useEffect } from 'react';
import { Settings, X, Save, Trash2, Copy, Check } from 'lucide-react';
import { getIconComponent } from '../utils/iconMapper';
import { apiService } from '../services/api';

const NodeConfigPanel = ({ node, fromSelectedNodes, onClose, onUpdateNode, onDeleteNode, workflowId, nodes }) => {
  const [config, setConfig] = useState({});
  const [showParamSelector, setShowParamSelector] = useState({}); // { fieldName: boolean }
  const [paramSelectorField, setParamSelectorField] = useState('');
  const [nodeName, setNodeName] = useState('');
  const [copiedItems, setCopiedItems] = useState(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nodeData, setNodeData] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [previousNodeOutputs, setPreviousNodeOutputs] = useState({});
  const [environmentVariables, setEnvironmentVariables] = useState([]);

  // Fetch output parameters from previous nodes
  useEffect(() => {
    const fetchPreviousNodeOutputs = async () => {
      if (!fromSelectedNodes || fromSelectedNodes.length === 0) {
        setPreviousNodeOutputs({});
        return;
      }

      const outputs = {};
      
      for (const node of fromSelectedNodes) {
        try {
          // Try to get node details from API if we have nodeId
          if (node.data?.nodeId) {
            console.log('🔍 Fetching output params for node:', node.data.nodeId);
            const result = await apiService.getNodeDetails(node.data.nodeId);
            if (result.success && result.node.output_params) {
              outputs[node.data.label || node.name] = result.node.output_params;
              console.log('✅ Output params fetched for', node.data.label, ':', result.node.output_params);
            }
          }
          
          // Also check if output_params are already available in the node data
          if (node.output_params && Object.keys(node.output_params).length > 0) {
            outputs[node.data?.label || node.name] = node.output_params;
            console.log('✅ Output params from node data for', node.data?.label || node.name, ':', node.output_params);
          }
        } catch (error) {
          console.error('❌ Error fetching output params for node:', node.data?.label || node.name, error);
        }
      }
      
      setPreviousNodeOutputs(outputs);
      console.log('📋 All previous node outputs:', outputs);
      
      // Test için örnek output parametreleri ekle (gerçek API verisi yoksa ve önceki node varsa)
      if (Object.keys(outputs).length === 0 && fromSelectedNodes && fromSelectedNodes.length > 0) {
        console.log('🧪 Adding test output parameters for demonstration');
        const testOutputs = {};
        fromSelectedNodes.forEach(node => {
          if (node.data?.nodeId) {
            testOutputs[node.data.label || node.name] = {
              result: { type: 'number', description: 'İşlem sonucu' },
              status: { type: 'string', description: 'İşlem durumu' },
              data: { type: 'object', description: 'İşlem verisi' }
            };
          }
        });
        setPreviousNodeOutputs(testOutputs);
        console.log('🧪 Test outputs added:', testOutputs);
      } else if (!fromSelectedNodes || fromSelectedNodes.length === 0) {
        console.log('ℹ️ No previous nodes found - this is the first node in the workflow');
        // İlk node için previousNodeOutputs'u temizle
        setPreviousNodeOutputs({});
      }
    };

    fetchPreviousNodeOutputs();
  }, [fromSelectedNodes]);

  // Fetch environment variables
  useEffect(() => {
    const fetchEnvironmentVariables = async () => {
      try {
        console.log('🔍 Fetching environment variables');
        const result = await apiService.getEnvironmentVariables();
        if (result.success && result.variables) {
          setEnvironmentVariables(result.variables);
          console.log('✅ Environment variables fetched:', result.variables);
        }
      } catch (error) {
        console.error('❌ Error fetching environment variables:', error);
        setEnvironmentVariables([]);
      }
    };

    fetchEnvironmentVariables();
  }, []);

  useEffect(() => {
    console.log("Node Config Panel", node);
    console.log("Node data structure:", {
      id: node.id,
      nodeId: node.data.nodeId,
      apiNodeId: node.data.apiNodeId,
      label: node.data.label
    });
    
    // Fetch node data from API if we have a node ID
    const fetchNodeData = async () => {
      const nodeId = node.data.nodeId || node.data.apiNodeId;
      if (nodeId) {
        setIsLoading(true);
        try {
          console.log('🔍 Fetching node data for ID:', nodeId);
          const result = await apiService.getNodeDetails(nodeId);
          if (result.success) {
            setNodeData(result.node);
            // Transform API data to config format
            const transformedConfig = transformInputParamsToConfig(result.node.input_params);
            setConfig(transformedConfig);
            setNodeName(result.node.name);
            console.log('✅ Node data loaded:', result.node);
          }
        } catch (error) {
          console.error('❌ Error fetching node data:', error);
          // Fallback to existing data
          setConfig(node.data.settings || {});
          setNodeName(node.data.label || node.id);
        } finally {
          setIsLoading(false);
        }
      } else {
        // No API node ID, use existing data
        setConfig(node.data.settings || {});
        setNodeName(node.data.label || node.id);
      }
    };

    fetchNodeData();
    setNameError(''); // Reset error when node changes
  }, [node]);

  // Transform API input_params to config format
  const transformInputParamsToConfig = (inputParams) => {
    if (!inputParams || typeof inputParams !== 'object') return {};
    
    const config = {};
    Object.entries(inputParams).forEach(([key, param]) => {
      config[key] = param.value || '';
    });
    return config;
  };

  // Transform API input_params to configFields format
  const transformInputParamsToConfigFields = (inputParams) => {
    if (!inputParams || typeof inputParams !== 'object') return [];
    
    return Object.entries(inputParams).map(([key, param]) => ({
      name: key,
      label: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize first letter
      type: mapWidgetToInputType(param.widget),
      paramType: param.type, // Keep original parameter type for validation
      placeholder: param.placeholder || '',
      required: false, // API doesn't provide required field
      defaultValue: param.value || '',
      max_length: param.max_length,
      min_length: param.min_length
    }));
  };

  // Map widget type to HTML input type
  const mapWidgetToInputType = (widget) => {
    const widgetMap = {
      'text': 'textarea',
      'input': 'text',
      'select': 'select',
      'number': 'number',
      'email': 'email',
      'url': 'url',
      'password': 'password',
      'checkbox': 'checkbox',
      'radio': 'radio'
    };
    return widgetMap[widget] || 'text';
  };

  // Auto-detect input type based on value
  const detectInputType = (value, originalType) => {
    if (!value || value === '') return originalType;
    
    const stringValue = String(value).trim();
    
    // Check for boolean values
    if (stringValue.toLowerCase() === 'true' || stringValue.toLowerCase() === 'false') {
      return 'checkbox';
    }
    
    // Check for numbers (integers and floats)
    if (!isNaN(stringValue) && !isNaN(parseFloat(stringValue))) {
      return 'number';
    }
    
    // Check for email
    if (stringValue.includes('@') && stringValue.includes('.')) {
      return 'email';
    }
    
    // Check for URL
    if (stringValue.startsWith('http://') || stringValue.startsWith('https://') || 
        stringValue.startsWith('ftp://') || stringValue.startsWith('www.')) {
      return 'url';
    }
    
    // Check for JSON
    if ((stringValue.startsWith('{') && stringValue.endsWith('}')) || 
        (stringValue.startsWith('[') && stringValue.endsWith(']'))) {
      return 'textarea';
    }
    
    // Check for long text (more than 50 characters)
    if (stringValue.length > 50) {
      return 'textarea';
    }
    
    return originalType;
  };

  // Validate value based on parameter type
  const validateValueByType = (value, paramType, paramConfig) => {
    if (!value || value === '') return { isValid: true, value: value, error: null };
    
    const stringValue = String(value).trim();
    
    switch (paramType) {
      case 'int':
      case 'integer':
        const intValue = parseInt(stringValue, 10);
        if (isNaN(intValue) || !Number.isInteger(intValue)) {
          return { 
            isValid: false, 
            value: stringValue, 
            error: 'Geçerli bir tam sayı giriniz' 
          };
        }
        return { isValid: true, value: intValue, error: null };
        
      case 'float':
      case 'number':
        const floatValue = parseFloat(stringValue);
        if (isNaN(floatValue)) {
          return { 
            isValid: false, 
            value: stringValue, 
            error: 'Geçerli bir sayı giriniz' 
          };
        }
        return { isValid: true, value: floatValue, error: null };
        
      case 'bool':
      case 'boolean':
        const boolValue = stringValue.toLowerCase();
        if (boolValue === 'true' || boolValue === 'false') {
          return { isValid: true, value: boolValue === 'true', error: null };
        }
        return { 
          isValid: false, 
          value: stringValue, 
          error: 'Geçerli bir boolean değer giriniz (true/false)' 
        };
        
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(stringValue)) {
          return { 
            isValid: false, 
            value: stringValue, 
            error: 'Geçerli bir email adresi giriniz' 
          };
        }
        return { isValid: true, value: stringValue, error: null };
        
      case 'url':
        try {
          new URL(stringValue);
          return { isValid: true, value: stringValue, error: null };
        } catch {
          return { 
            isValid: false, 
            value: stringValue, 
            error: 'Geçerli bir URL giriniz' 
          };
        }
        
      case 'json':
        try {
          const jsonValue = JSON.parse(stringValue);
          return { isValid: true, value: jsonValue, error: null };
        } catch {
          return { 
            isValid: false, 
            value: stringValue, 
            error: 'Geçerli bir JSON formatı giriniz' 
          };
        }
        
      case 'string':
      case 'text':
      default:
        // String validation - check length constraints if specified
        if (paramConfig?.max_length && stringValue.length > paramConfig.max_length) {
          return { 
            isValid: false, 
            value: stringValue, 
            error: `Maksimum ${paramConfig.max_length} karakter olabilir` 
          };
        }
        if (paramConfig?.min_length && stringValue.length < paramConfig.min_length) {
          return { 
            isValid: false, 
            value: stringValue, 
            error: `Minimum ${paramConfig.min_length} karakter olmalı` 
          };
        }
        return { isValid: true, value: stringValue, error: null };
    }
  };

  // Auto-detect and convert value type
  const detectAndConvertValue = (value, detectedType) => {
    if (!value || value === '') return value;
    
    const stringValue = String(value).trim();
    
    switch (detectedType) {
      case 'checkbox':
        return stringValue.toLowerCase() === 'true';
      case 'number':
        return stringValue.includes('.') ? parseFloat(stringValue) : parseInt(stringValue, 10);
      case 'email':
      case 'url':
      case 'textarea':
      case 'text':
      default:
        return stringValue;
    }
  };

  // Handle input change with type detection and validation
  const handleInputChange = (fieldName, value) => {
    const currentField = nodeData?.input_params?.[fieldName];
    const originalType = currentField ? mapWidgetToInputType(currentField.widget) : 'text';
    const paramType = currentField?.type || 'string';
    
    // Validate the value based on parameter type
    const validation = validateValueByType(value, paramType, currentField);
    
    // Update validation errors
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: validation.isValid ? null : validation.error
    }));
    
    // Only update config if validation passes or if it's empty (allow empty values)
    if (validation.isValid || value === '') {
      // Detect the appropriate input type based on the value
      const detectedType = detectInputType(value, originalType);
      
      // Convert value to appropriate type
      const convertedValue = detectAndConvertValue(value, detectedType);
      
      // Update config with converted value
      setConfig(prev => ({ 
        ...prev, 
        [fieldName]: convertedValue 
      }));
      
      console.log(`🔄 Field ${fieldName}:`, {
        originalValue: value,
        detectedType: detectedType,
        convertedValue: convertedValue,
        originalType: originalType,
        paramType: paramType,
        validation: validation
      });
    } else {
      // Keep the invalid value in the input but don't update config
      console.log(`❌ Validation failed for ${fieldName}:`, validation.error);
    }
  };

  // ✅ İsim kontrolü
  const validateNodeName = (newName) => {
    if (!newName || newName.trim() === '') {
      return 'Node adı boş olamaz';
    }
    
    // Mevcut node'larda aynı isim var mı kontrol et (kendisi hariç)
    const existingNode = nodes.find(n => 
      n.id !== node.id && n.data.label === newName.trim()
    );
    
    if (existingNode) {
      return `"${newName}" ismi zaten kullanılıyor`;
    }
    
    return '';
  };

  const handleSave = async () => {
    // İsim kontrolü yap
    const nameValidationError = validateNodeName(nodeName);
    if (nameValidationError) {
      setNameError(nameValidationError);
      return;
    }

    // Validation error kontrolü yap
    const hasValidationErrors = Object.values(validationErrors).some(error => error !== null);
    if (hasValidationErrors) {
      alert('Lütfen tüm geçersiz değerleri düzeltiniz.');
      return;
    }

    setIsSaving(true);
    setNameError(''); // Clear error when saving
    
    try {
      // API'ye node güncelleme isteği gönder
      // Önce API'den dönen node ID'sini kontrol et, sonra local ID'yi kullan
      const nodeId = node.data.nodeId || node.data.apiNodeId || node.id;
      if (!nodeId) {
        throw new Error('Node ID bulunamadı');
      }
      
      console.log('🔍 Using node ID for update:', nodeId, 'from node.data:', node.data);

      // Transform config back to API format - update input_params with current values
      let inputParams = {};
      if (nodeData?.input_params) {
        // Update the input_params with current config values
        inputParams = { ...nodeData.input_params };
        Object.keys(config).forEach(key => {
          if (inputParams[key]) {
            inputParams[key].value = config[key];
          }
        });
      } else {
        // If no API data, create input_params from config
        Object.keys(config).forEach(key => {
          inputParams[key] = {
            type: 'string',
            widget: 'input',
            placeholder: '',
            value: config[key]
          };
        });
      }

      const updateData = {
        name: nodeName.trim(),
        description: nodeData?.description || `Updated ${nodeName.trim()} node`,
        input_params: inputParams,
        output_params: nodeData?.output_params || {},
        meta_data: nodeData?.meta_data || {},
        max_retries: nodeData?.max_retries || 3,
        timeout_seconds: nodeData?.timeout_seconds || 300
      };

      console.log('🔄 Updating node via API:', nodeId, updateData);
      const result = await apiService.updateNode(nodeId, updateData);
      
      if (result && result.success) {
        console.log('✅ Node updated successfully via API:', result);
        
        // Local state'i güncelle
        onUpdateNode(node.id, { 
          settings: config,
          label: nodeName.trim()
        });
        
        onClose();
      } else {
        throw new Error('API güncelleme başarısız oldu');
      }
    } catch (error) {
      console.error('❌ Error updating node:', error);
      alert('Node güncellenirken hata oluştu: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    onDeleteNode(node.id);
  };

  // ✅ Kopyalama fonksiyonu - unique key kullan
  const handleCopy = async (nodeId, key) => {
    // Node ID olarak node'un gerçek nodeId'sini kullan
    const actualNodeId = node.data.nodeId || node.data.apiNodeId || nodeId;
    const textToCopy = `{n{${actualNodeId}.${key}}}`;
    const uniqueKey = `${actualNodeId}.${key}`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      
      setCopiedItems(prev => new Set([...prev, uniqueKey]));
      
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(uniqueKey);
          return newSet;
        });
      }, 2000);
      
      console.log('✅ Copied to clipboard:', textToCopy);
    } catch (error) {
      console.error('❌ Failed to copy:', error);
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setCopiedItems(prev => new Set([...prev, uniqueKey]));
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(uniqueKey);
          return newSet;
        });
      }, 2000);
    }
  };

  const renderDynamicConfigFields = () => {
    // Use API data if available, otherwise fallback to node.data.configFields
    const configFields = nodeData?.input_params 
      ? transformInputParamsToConfigFields(nodeData.input_params)
      : node.data.configFields;

    if (!configFields || configFields.length === 0) {
      return (
        <div className="text-gray-500 text-sm">Bu script'in herhangi bir parametresi yok.</div>
      );
    }

    // Önceki node'lardan gelen çıktı parametrelerini hazırla - sadece önceki node varsa
    const isFirstNode = !fromSelectedNodes || fromSelectedNodes.length === 0;
    console.log('🔍 Node position check:', {
      isFirstNode,
      fromSelectedNodesLength: fromSelectedNodes?.length || 0,
      previousNodeOutputsKeys: Object.keys(previousNodeOutputs)
    });
    
    // Node output parameters
    const nodeOutputParams = isFirstNode 
      ? [] // İlk node ise boş array döndür
      : Object.entries(previousNodeOutputs)
          .flatMap(([nodeName, outputParams]) => {
            // Node'un gerçek nodeId'sini bul
            const node = fromSelectedNodes?.find(n => (n.data?.label || n.name) === nodeName);
            const nodeId = node?.data?.nodeId;
            
            if (!nodeId || !outputParams || typeof outputParams !== 'object') {
              return [];
            }
            
            return Object.entries(outputParams).map(([key, param]) => {
              const paramValue = `{n{${nodeId}.${key}}}`;
              console.log('🔗 Creating parameter:', {
                nodeName,
                nodeId,
                key,
                paramValue,
                param
              });
              
              return {
                label: `${nodeName} - ${key}`,
                value: paramValue,
                type: param.type || 'string',
                description: param.description || `${nodeName} node'ının ${key} çıktısı`,
                nodeId: nodeId,
                nodeName: nodeName,
                source: 'node_output'
              };
            });
          });

    // Environment variables
    const envVarParams = environmentVariables.map((envVar) => {
      const paramValue = `{env{${envVar.name}}}`;
      console.log('🌍 Creating environment variable parameter:', {
        name: envVar.name,
        value: envVar.value,
        type: envVar.type,
        paramValue
      });
      
      return {
        label: `Environment - ${envVar.name}`,
        value: paramValue,
        type: envVar.type?.toLowerCase() || 'string',
        description: envVar.description || `Environment variable: ${envVar.name}`,
        nodeId: null,
        nodeName: 'Environment',
        source: 'environment',
        scope: envVar.scope
      };
    });

    // Combine node outputs and environment variables
    const availableParams = [...nodeOutputParams, ...envVarParams];

    return (
      <div className="space-y-4">
        {configFields.map((field) => {
          const currentValue = config[field.name] || field.defaultValue || '';
          const detectedType = detectInputType(currentValue, field.type);
          const isTypeChanged = detectedType !== field.type;
          const hasError = validationErrors[field.name];
          const paramType = field.paramType || 'string';
          
          return (
            <div key={field.name} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {paramType}
                </span>
                {field.required && <span className="text-red-500 ml-1">*</span>}
                {isTypeChanged && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {detectedType}
                  </span>
                )}
                {/* Parameter indicator */}
                {currentValue && currentValue.toString().includes('{n{') && currentValue.toString().includes('}}') && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    🔗 Node Çıktısı
                  </span>
                )}
                {currentValue && currentValue.toString().includes('{env{') && currentValue.toString().includes('}}') && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    🌍 Environment Variable
                  </span>
                )}
              </label>
              <div className="flex items-center space-x-2">
                {field.type === 'select' ? (
                  <select
                    value={currentValue}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      hasError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    {field.options?.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : paramType === 'bool' || paramType === 'boolean' ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={currentValue === true || currentValue === 'true'}
                      onChange={(e) => handleInputChange(field.name, e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">
                      {currentValue === true || currentValue === 'true' ? 'True' : 'False'}
                    </span>
                  </div>
                ) : paramType === 'int' || paramType === 'integer' ? (
                  <input
                    type="number"
                    step="1"
                    value={currentValue}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      hasError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                ) : paramType === 'float' || paramType === 'number' ? (
                  <input
                    type="number"
                    step="any"
                    value={currentValue}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      hasError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                ) : paramType === 'email' ? (
                  <input
                    type="email"
                    value={currentValue}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      hasError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                ) : paramType === 'url' ? (
                  <input
                    type="url"
                    value={currentValue}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      hasError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                ) : paramType === 'json' || detectedType === 'textarea' ? (
                  <textarea
                    value={currentValue}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      hasError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    rows={3}
                  />
                ) : (
                  <input
                    type="text"
                    value={currentValue}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    maxLength={field.max_length}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      hasError ? 'border-red-300 bg-red-50' : 
                      isTypeChanged ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                    }`}
                  />
                )}
              {/* Parametre seçme butonu - environment variables her zaman göster */}
              {availableParams.length > 0 && (
                <button
                  type="button"
                  className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs border border-blue-300 font-medium transition-colors"
                  onClick={() => {
                    setShowParamSelector({ [field.name]: true });
                    setParamSelectorField(field.name);
                  }}
                  title="Node çıktısı veya environment değişkeni seç"
                >
                  📥 Parametre Seç
                </button>
              )}
              {/* Kopyalama butonu */}
              {config[field.name] && (
                <button
                  type="button"
                  className="ml-2 px-2 py-1 bg-blue-100 rounded hover:bg-blue-200 text-xs border border-blue-300"
                  onClick={() => handleCopy(node.data.nodeId || node.data.apiNodeId || node.id, field.name)}
                  title="Parametreyi kopyala"
                >
                  {copiedItems.has(`${node.data.nodeId || node.data.apiNodeId || node.id}.${field.name}`) ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-blue-600" />
                  )}
                </button>
              )}
            </div>
            {/* Validation error */}
            {hasError && (
              <div className="mt-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                ❌ {hasError}
              </div>
            )}
            
            {/* Value type indicator */}
            {currentValue && !hasError && (
              <div className="mt-1 text-xs text-gray-500">
                <span className="font-medium">Değer:</span> {String(currentValue)} 
                <span className="ml-2 font-medium">Tip:</span> {typeof currentValue}
                {isTypeChanged && (
                  <span className="ml-2 text-blue-600 font-medium">
                    (Otomatik algılandı: {detectedType})
                  </span>
                )}
                {/* Parameter preview */}
                {currentValue && currentValue.toString().includes('{n{') && currentValue.toString().includes('}}') && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                    <div className="text-xs text-green-800 font-medium">🔗 Node Çıktısı Bağlantısı</div>
                    <div className="text-xs text-green-700 mt-1">
                      Bu parametre önceki bir node'un çıktısını kullanacak. Workflow çalıştırıldığında 
                      <code className="bg-green-200 px-1 rounded mx-1">{String(currentValue)}</code> 
                      değeri gerçek çıktı ile değiştirilecek.
                    </div>
                  </div>
                )}
                {currentValue && currentValue.toString().includes('{env{') && currentValue.toString().includes('}}') && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                    <div className="text-xs text-green-800 font-medium">🌍 Environment Variable Bağlantısı</div>
                    <div className="text-xs text-green-700 mt-1">
                      Bu parametre bir environment değişkenini kullanacak. Workflow çalıştırıldığında 
                      <code className="bg-green-200 px-1 rounded mx-1">{String(currentValue)}</code> 
                      değeri gerçek environment değişkeni değeri ile değiştirilecek.
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Dropdown/modal - geliştirilmiş dropdown - environment variables her zaman göster */}
            {showParamSelector[field.name] && (
              <div className="absolute z-20 mt-2 bg-white border border-gray-300 rounded-lg shadow-xl w-80 max-h-64 overflow-hidden">
                <div className="p-3 bg-blue-50 border-b border-blue-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-blue-900">Kullanılabilir Parametreler</h4>
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-800 text-lg font-bold"
                      onClick={() => setShowParamSelector({})}
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">Bu parametre için kullanılabilir node çıktıları ve environment değişkenlerini seçin</p>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {availableParams.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {availableParams.map((param, idx) => (
                        <li key={idx}>
                          <button
                            type="button"
                            className={`w-full text-left px-4 py-3 transition-colors group ${
                              param.source === 'environment' 
                                ? 'hover:bg-green-50 border-l-4 border-green-400' 
                                : 'hover:bg-blue-50'
                            }`}
                            onClick={() => {
                              setConfig(prev => ({ ...prev, [field.name]: param.value }));
                              setShowParamSelector({});
                            }}
                            title={param.description}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className={`font-medium group-hover:text-blue-900 ${
                                  param.source === 'environment' ? 'text-green-900' : 'text-gray-900'
                                }`}>
                                  {param.source === 'environment' ? '🌍 ' : '🔗 '}
                                  {param.label}
                                </div>
                                <div className={`text-xs mt-1 font-mono px-2 py-1 rounded ${
                                  param.source === 'environment' 
                                    ? 'text-green-600 bg-green-100' 
                                    : 'text-gray-500 bg-gray-100'
                                }`}>
                                  {param.value}
                                </div>
                                {param.source === 'environment' ? (
                                  <div className="text-xs text-green-600 mt-1">
                                    Scope: {param.scope || 'USER'} | Type: {param.type}
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-400 mt-1">
                                    Node ID: {param.nodeId}
                                  </div>
                                )}
                                {param.description && (
                                  <div className={`text-xs mt-1 ${
                                    param.source === 'environment' ? 'text-green-500' : 'text-gray-400'
                                  }`}>
                                    {param.description}
                                  </div>
                                )}
                              </div>
                              <div className="ml-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  param.source === 'environment' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {param.type}
                                </span>
                              </div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      <div className="text-sm">Henüz önceki node çıktısı bulunmuyor</div>
                      <div className="text-xs mt-1">Önce bir node ekleyip çalıştırın</div>
                    </div>
                  )}
                </div>
                <div className="p-2 bg-gray-50 border-t border-gray-200">
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    onClick={() => setShowParamSelector({})}
                  >
                    Kapat
                  </button>
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>
    );
  };

 

  // ✅ outputParams gösterimi için düzeltme
  const renderOutputParams = () => {
    // Use API data if available, otherwise fallback to node.data.outputParams
    const outputParams = nodeData?.output_params || node.data.outputParams || {};
    const entries = Object.entries(outputParams);
    
    console.log('🔍 Output params:', outputParams);
    console.log(' Entries:', entries);
    
    if (entries.length === 0) {
      return (
        <div className="text-gray-500 text-sm">Bu script'in herhangi bir çıktı parametresi yok.</div>
      );
    }

    return (
      <div className="space-y-2">
        {entries.map(([key, param]) => (
          <div key={key} className="border p-3 rounded bg-gray-50">
            <div className="text-sm font-medium text-gray-700">{key}</div>
            <div className="text-xs text-gray-500">Tür: {param.type || 'unknown'}</div>
            {param.description && (
              <div className="text-xs text-gray-400 mt-1">{param.description}</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const Icon = getIconComponent(node.data.icon);

  return (
    <div className="w-96 bg-white border-l border-gray-200 shadow-xl overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Node Configuration</h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {isLoading ? (
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Node verileri yükleniyor...</span>
        </div>
      ) : (
        <div className="p-6 space-y-6">
        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
          <div className={`w-10 h-10 ${node.data.color || 'bg-gray-500'} rounded-lg flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={nodeName}
                onChange={(e) => {
                  setNodeName(e.target.value);
                  // Real-time validation
                  const error = validateNodeName(e.target.value);
                  setNameError(error);
                }}
                className={`font-medium text-gray-800 bg-transparent border-none outline focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 w-full -z-10 ${
                  nameError ? 'ring-2 ring-red-500' : ''
                }`}
                placeholder="Node adı"
              />
              {nameError && (
                <div className="absolute top-full left-0 mt-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                  {nameError}
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500 capitalize">{node.data.type}</div>
          </div>
        </div>

     

        {/* Input Parametreler */}
        <div className="border-t border-gray-200 pt-6"> 
          <h4 className="text-sm font-medium text-gray-700 mb-4">Script Parametreleri</h4>
          
          {/* Bilgi kutusu - environment variables veya önceki node varsa göster */}
          {(environmentVariables.length > 0 || (fromSelectedNodes && fromSelectedNodes.length > 0 && Object.keys(previousNodeOutputs).length > 0)) && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <div className="text-blue-600 text-sm">💡</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-blue-900">Kullanılabilir Parametreler</div>
                  <div className="text-xs text-blue-700 mt-1">
                    Environment değişkenleri ve önceki node çıktılarını parametre olarak kullanabilirsiniz:
                  </div>
                  
                  {/* Environment Variables */}
                  {environmentVariables.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-green-600 font-medium">🌍 Environment Variables:</div>
                      <div className="text-xs text-green-600">
                        {environmentVariables.map(envVar => envVar.name).join(', ')}
                      </div>
                    </div>
                  )}
                  
                  {/* Node Outputs */}
                  {fromSelectedNodes && fromSelectedNodes.length > 0 && Object.keys(previousNodeOutputs).length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="text-xs text-blue-600 font-medium">🔗 Node Çıktıları:</div>
                      {Object.entries(previousNodeOutputs).map(([nodeName, outputs]) => (
                        <div key={nodeName} className="text-xs text-blue-600">
                          <span className="font-medium">{nodeName}:</span> {Object.keys(outputs).join(', ')}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-3 p-2 bg-blue-100 rounded border border-blue-300">
                    <div className="text-xs text-blue-800 font-medium">💡 Nasıl Kullanılır:</div>
                    <div className="text-xs text-blue-700 mt-1">
                      "Parametre Seç" butonuna tıklayarak environment değişkenlerini veya önceki node'ların çıktılarını seçebilirsiniz. 
                      Environment değişkenleri <code className="bg-green-200 px-1 rounded">{'{env{değişkenAdı}}'}</code> formatında, 
                      node çıktıları <code className="bg-blue-200 px-1 rounded">{'{n{ND-XXXXXXXXX.çıktıAdı}}'}</code> formatında eklenir.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* İlk node için bilgi kutusu - sadece environment variables yoksa göster */}
          {(!fromSelectedNodes || fromSelectedNodes.length === 0) && environmentVariables.length === 0 && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <div className="text-gray-600 text-sm">ℹ️</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">İlk Node</div>
                  <div className="text-xs text-gray-700 mt-1">
                    Bu workflow'daki ilk node olduğu için önceki node çıktısı bulunmuyor. 
                    Parametreleri doğrudan değer olarak girebilirsiniz.
                  </div>
                </div>
              </div>
            </div>
          )}

          {renderDynamicConfigFields()}
        </div>

        {/* ✅ Output Parametreler */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Script Çıktıları</h4>
          {renderOutputParams()}
        </div>

        <div className="flex space-x-3 pt-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={isSaving || !!nameError || isLoading || Object.values(validationErrors).some(error => error !== null)}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Kaydediliyor...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        </div>
      )}
    </div>
  );
};

export default NodeConfigPanel;