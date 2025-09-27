// Gerçek API servisi: Tüm istekler bu base URL üzerinden yapılır
const API_BASE_URL = 'https://n8n.vidinsight.com.tr/api/bff';
// API fonksiyonları
// API ile ilgili tüm fonksiyonları içeren servis nesnesi
export const apiService = {
  // Genel yardımcılar: API response normalizasyonu
  extractData(json) {
    if (json == null) return null;
    if (typeof json === 'object' && 'data' in json && json.data !== undefined) return json.data;
    return json;
  },
  extractList(maybeList, preferredKeys = []) {
    if (Array.isArray(maybeList)) return maybeList;
    if (!maybeList || typeof maybeList !== 'object') return [];
    const defaultKeys = ['items', 'data', 'results', 'workflows', 'executions', 'files', 'variables', 'scripts'];
    const keysToTry = [...preferredKeys, ...defaultKeys];
    for (const key of keysToTry) {
      if (Array.isArray(maybeList[key])) return maybeList[key];
    }
    return [];
  },

  // Workflow listesini getir
  // Tüm workflow'ları API'den çeker ve kart formatına dönüştürür
  async getWorkflows() {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data && (data.success === undefined || data.success === true)) {
        const payload = this.extractData(data);
        return this.transformWorkflowsToCards(payload);
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      console.error('Error fetching workflows:', error);
      throw error;
    }
  },


    // ✅ Workflow sil
    async deleteWorkflow(workflowId) {
      try {
        console.log('🗑️ Deleting workflow with ID:', workflowId);
        const response = await fetch(`${API_BASE_URL}/workflows/${workflowId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API Error Response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ Workflow deleted successfully:', data);
        return {
          success: true,
          message: 'Workflow başarıyla silindi',
          data: data
        };
      } catch (error) {
        console.error('❌ Error deleting workflow:', error);
        throw error;
      }
    },

  // Workflow verilerini kart formatına dönüştür
  // API'den gelen workflow verisini dashboard'da kullanılacak kart formatına dönüştürür
  transformWorkflowsToCards(workflows) {
    // Bilinen liste alanlarını kontrol et
    const list = this.extractList(workflows, ['workflows']);

    return list.map(workflow => ({
      id: workflow.id,
      name: workflow.name,
      status: this.mapWorkflowStatus(workflow.status),
      lastRun: this.formatDate(workflow.updated_at),
      duration: this.calculateDuration(workflow.created_at, workflow.updated_at),
      description: workflow.description || 'Açıklama bulunmuyor',
      steps: workflow.node_count,
      priority: workflow.priority || 0,
      created_at: workflow.created_at,
      updated_at: workflow.updated_at,
      nodes: workflow.nodes || [],
      edges: workflow.edges || [],
      triggers: workflow.triggers || []
    }));
  },

  // Workflow status'unu dashboard formatına dönüştür
  // API'den gelen workflow durumunu dashboard'da gösterilecek duruma çevirir
  mapWorkflowStatus(status) {
    const statusMap = {
      'draft': 'pending',
      'active': 'running',
      'completed': 'completed',
      'error': 'failed',
      'paused': 'pending'
    };
    return statusMap[status] || 'running';
  },

  // Tarih formatla
  // Tarih bilgisini insan okunabilir Türkçe formatta döndürür
  formatDate(dateString) {
    if (!dateString) return 'Bilinmiyor';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    
    return date.toLocaleDateString('tr-TR');
  },

  // Süre hesapla
  // Workflow'un ne kadar sürdüğünü hesaplar ve okunabilir formatta döndürür
  calculateDuration(createdAt, updatedAt) {
    if (!createdAt || !updatedAt) return 'Bilinmiyor';
    
    const created = new Date(createdAt);
    const updated = new Date(updatedAt);
    const diffMs = updated - created;
    
    if (diffMs < 0) return 'Bilinmiyor';
    
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffSecs < 60) return `${diffSecs}s`;
    if (diffMins < 60) return `${diffMins}m ${diffSecs % 60}s`;
    return `${diffHours}h ${diffMins % 60}m`;
  },

  // Tamamlanan adımları hesapla
  // Workflow'da tamamlanan adım sayısını workflow durumuna göre hesaplar
 

  // Workflow şablonları
  // Farklı tipte örnek workflow şablonları döndürür
  getWorkflowTemplates() {
    return {
      addition_workflow: {
        name: "addition_workflow",
        description: "Her düğümün çıktısı sonrakine girer",
        nodes: [
          {
            name: "node_1",
            script_name: "addition_script",
            params: { a: 2, b: 3 }
          },
          {
            name: "node_2",
            script_name: "addition_script",
            params: { a: "{{node_1.result}}", b: 10 }
          },
          {
            name: "node_3",
            script_name: "addition_script",
            params: { a: "{{node_2.result}}", b: "{{node_1.result}}" }
          }
        ],
        edges: [
          { from_node: "node_1", to_node: "node_2", condition_type: "success" },
          { from_node: "node_1", to_node: "node_3", condition_type: "success" },
          { from_node: "node_2", to_node: "node_3", condition_type: "success" }
        ],
        triggers: [
          { trigger_type: "manual", config: {}, is_active: true }
        ]
      },
      simple_workflow: {
        name: "simple_workflow",
        description: "Basit tek node workflow",
        nodes: [
          {
            name: "node_1",
            script_name: "addition_script",
            params: { a: 5, b: 5 }
          }
        ],
        edges: [],
        triggers: [
          { trigger_type: "manual", config: {}, is_active: true }
        ]
      },
      empty_workflow: {
        name: "empty_workflow",
        description: "Boş workflow - düzenlemeye hazır",
        nodes: [],
        edges: [],
        triggers: [
          { trigger_type: "manual", config: {}, is_active: true }
        ]
      }
    };
  },

  // ✅ Yeni workflow oluştur - güncellenmiş format
  async createWorkflow(workflowData = {}) {
    try {
      console.log('🔄 Creating workflow with data:', workflowData);
      
      // Yeni endpoint için payload oluştur
      const workflowPayload = {
        name: workflowData.name || `Yeni Workflow ${Date.now()}`,
        description: workflowData.description || 'Yeni oluşturulan workflow',
        priority: workflowData.priority || 10 // Varsayılan öncelik 10 olarak ayarlandı
      };
      
      console.log('📤 Sending workflow payload to new endpoint:', workflowPayload);

      const response = await fetch(`${API_BASE_URL}/workflows/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const responseData = await response.json();
      console.log('✅ Workflow created successfully:', responseData);
      
      if (responseData.success && responseData.data && responseData.data.record_id) {
        // API'den dönen veriyi kullan
        return {
          success: true,
          workflow: {
            id: responseData.data.record_id, // WF-6B6D34D4B12C457AB formatında ID
            name: workflowData.name || workflowPayload.name,
            description: workflowData.description || workflowPayload.description,
            priority: workflowData.priority || workflowPayload.priority,
            status: 'draft',
            nodes: [],
            edges: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          message: responseData.message || 'Workflow başarıyla oluşturuldu',
          data: responseData.data,
          correlation_id: responseData.correlation_id,
          timestamp: responseData.timestamp
        };
      } else {
        throw new Error(responseData.message || 'API response\'da geçerli bir workflow yanıtı alınamadı');
      }
    } catch (error) {
      console.error('❌ Error creating workflow:', error);
      throw error;
    }
  },

  // Workflow güncelle
  // Var olan bir workflow'u günceller
  async updateWorkflow(workflowId, workflowData) {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows/${workflowId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw error;
    }
  },

  // Script listesini getir
  // Script listesini API'den çeker ve node kategorilerine dönüştürür
  async getNodeCategories() {
    try {
      const response = await fetch(`${API_BASE_URL}/scripts/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      const payload = this.extractData(data);
      const list = this.extractList(payload, ['scripts']);
      // API response'unu node kategorilerine dönüştür
      return this.transformScriptsToNodeCategories(list);
    } catch (error) {
      console.error('Error fetching scripts:', error);
      throw error;
    }
  },

  // Script silme işlemi
  async deleteScript(scriptId) {
    try {
      console.log('🗑️ Deleting script with ID:', scriptId);
      const response = await fetch(`${API_BASE_URL}/scripts/${scriptId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Script deleted successfully:', data);
      return {
        success: true,
        message: 'Script başarıyla silindi',
        data: data
      };
    } catch (error) {
      console.error('❌ Error deleting script:', error);
      throw error;
    }
  },

  // Scripts listesi (Scripts sayfası için basit liste döner)
  async getScripts() {
    try {
      const response = await fetch(`${API_BASE_URL}/scripts/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const payload = this.extractData(data);
      const scripts = this.extractList(payload, ['scripts']);
      return { success: true, scripts };
    } catch (error) {
      console.error('Error fetching scripts:', error);
      throw error;
    }
  },

  // Scripts'i node kategorilerine dönüştür
  // Script listesini node kategorisi formatına dönüştürür
  transformScriptsToNodeCategories(scripts) {
    const categories = [
      {
        id: 'scripts',
        title: 'Scripts',
        nodes: scripts.map(script => ({
          id: script.id,
          type: 'script',
          label: script.name,
          icon: this.getIconForScript(script.language),
          color: this.getColorForScript(script.language),
          description: script.description,
          language: script.language,
          status: script.status,
          configFields: this.transformInputParamsToConfigFields(script.input_params),
          outputParams: script.output_params || [],
        }))
      }
    ];

    return categories;
  },

  // Input params'ı config fields'e dönüştür
  // Script'in input parametrelerini form alanlarına dönüştürür
  transformInputParamsToConfigFields(inputParams) {
    if (!inputParams) return [];

    return Object.entries(inputParams).map(([key, param]) => {
      const field = {
        name: key,
        label: this.formatLabel(key),
        type: this.mapWidgetToInputType(param.widget),
        placeholder: param.placeholder || '',
        required: param.required || false
      };

      // Select widget için options ekle
      if (param.widget === 'select' && param.widget_values) {
        field.options = param.widget_values;
      }

      // Default value varsa ekle
      if (param.default_value !== undefined) {
        field.defaultValue = param.default_value;
      }

      return field;
    });
  },

  // Widget tipini HTML input tipine dönüştür
  // API'den gelen widget tipini HTML input tipine çevirir
  mapWidgetToInputType(widget) {
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
  },

  // Script dili için icon belirle
  // Script dili için uygun ikon adını döndürür
  getIconForScript(language) {
    const iconMap = {
      'python': 'Code',
      'javascript': 'Code',
      'bash': 'Terminal',
      'sql': 'Database',
      'default': 'FileText'
    };

    return iconMap[language] || iconMap.default;
  },

  // Script dili için renk belirle
  // Script dili için uygun arka plan rengini döndürür
  getColorForScript(language) {
    const colorMap = {
      'python': 'bg-blue-500',
      'javascript': 'bg-yellow-500',
      'bash': 'bg-gray-600',
      'sql': 'bg-green-500',
      'default': 'bg-indigo-500'
    };

    return colorMap[language] || colorMap.default;
  },

  // Label formatla (snake_case'den Title Case'e)
  // snake_case anahtarları baş harfleri büyük olacak şekilde label'a çevirir
  formatLabel(key) {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  // Belirli bir script'in detaylarını getir
  async getNodeDetails(nodeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/scripts/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      const payload = this.extractData(data);
      const scripts = this.extractList(payload, ['scripts']);
      const script = scripts.find(s => s.script_id === nodeId || s.id === nodeId);
      if (!script) {
        throw new Error('Script not found');
      }

      return {
        id: script.script_id,
        type: 'script',
        label: script.name,
        icon: this.getIconForScript(script.language),
        color: this.getColorForScript(script.language),
        description: script.description,
        language: script.language,
        status: script.status,
        configFields: this.transformInputParamsToConfigFields(script.input_params),
        outputParams: script.output_params || [],
      };
    } catch (error) {
      console.error('Error fetching script details:', error);
      throw error;
    }
  },

  // ✅ Workflow adını güncelle
  async updateWorkflowName(workflowId, newName) {
    try {
      console.log('🔄 Updating workflow name:', workflowId, 'to:', newName);
      
      const response = await fetch(`${API_BASE_URL}/workflows/${workflowId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Workflow name updated successfully:', data);
      
      return {
        success: true,
        message: 'Workflow adı başarıyla güncellendi',
        data: data
      };
    } catch (error) {
      console.error('❌ Error updating workflow name:', error);
      throw error;
    }
  },

  // ✅ Workflow kaydet - gerçek API endpoint'ine gönder
  async saveWorkflow(workflowData, workflowId) {
    try {
      console.log(' Saving workflow to API:', workflowData);
      
      // Eğer sadece workflow adı güncelleniyorsa
      if (workflowData && typeof workflowData === 'string') {
        return await this.updateWorkflowName(workflowId, workflowData);
      }
      
      const response = await fetch(`${API_BASE_URL}/workflows/${workflowId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Workflow saved successfully:', data);
      
      return {
        success: true,
        id: data.workflow_id || Date.now(),
        message: 'Workflow başarıyla kaydedildi',
        data: data
      };
    } catch (error) {
      console.error('❌ Error saving workflow:', error);
      throw error;
    }
  },

  // ✅ Workflow başlatma fonksiyonu
  async executeWorkflow(workflowId) {
    try {
      console.log(' Executing workflow:', workflowId);
      
      const response = await fetch(`${API_BASE_URL}/executions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Eğer execution için özel parametreler varsa buraya eklenebilir
          workflow_id: workflowId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Workflow execution started successfully:', data);
      
      return {
        success: true,
        execution_id: data.execution_id || Date.now(),
        message: 'Workflow başarıyla başlatıldı',
        data: data
      };
    } catch (error) {
      console.error('❌ Error executing workflow:', error);
      throw error;
    }
  },

  // ✅ Workflow kaydet ve hemen başlat
  async saveAndExecuteWorkflow(workflowData) {
    try {
      console.log('🔄 Saving and executing workflow:', workflowData);
      
      // Önce workflow'u kaydet
      const savedWorkflow = await this.saveWorkflow(workflowData);
      console.log('✅ Workflow saved:', savedWorkflow);
      
      // Sonra workflow'u başlat
      const executionResult = await this.executeWorkflow(savedWorkflow.id);
      console.log('✅ Workflow execution started:', executionResult);
      
      return {
        success: true,
        workflow_id: savedWorkflow.id,
        execution_id: executionResult.execution_id,
        message: 'Workflow başarıyla kaydedildi ve başlatıldı',
        workflow_data: savedWorkflow,
        execution_data: executionResult
      };
    } catch (error) {
      console.error('❌ Error in save and execute workflow:', error);
      throw error;
    }
  },

  // ✅ Workflow detaylarını getir
  async getWorkflowDetails(workflowId) {
    try {
      console.log('🔍 Fetching workflow details for ID:', workflowId);
      
      const response = await fetch(`${API_BASE_URL}/workflows/${workflowId}?include_relationships=true`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Workflow details fetched:', data);
      
      // API'den gelen veriyi React Flow formatına dönüştür
      const payload = this.extractData(data);
      const transformedData = this.transformWorkflowToReactFlow(payload);
      
      return {
        success: true,
        workflow: transformedData,
        originalData: data
      };
    } catch (error) {
      console.error('❌ Error fetching workflow details:', error);
      throw error;
    }
  },

  getIconForScript(language) {
    const iconMap = {
      'python': 'Code',
      'javascript': 'Code',
      'bash': 'Terminal',
      'sql': 'Database',
      'default': 'FileText'
    };

    return iconMap[language] || iconMap.default;
  },

  // ✅ API workflow verisini React Flow formatına dönüştür
  transformWorkflowToReactFlow(workflowData) {
    try {
      console.log('🔄 Transforming workflow data to React Flow format:', workflowData);
      
      // Nodes'ları dönüştür
      const transformedNodes = (workflowData.nodes || []).map((node, index) => {
        // Node pozisyonunu hesapla (grid layout)
        const x = (index % 3) * 250 + 100;
        const y = Math.floor(index / 3) * 150 + 100;
        console.log("Node", node);
        
        return {
          id: node.name, // API'den gelen name field'ını id olarak kullan
          type: 'custom',
          position: { x, y },
          data: {
            id: node.id,
            label: node.name,
            type: 'script',
            icon: this.getIconForScript("python"),
            color: 'bg-blue-500',
            description: node.description || 'Script node',
            configFields: this.transformParamsToConfigFields(node.input_params),
            settings: node.input_params || {},
            outputParams: node.output_params || [], // API'den output_params gelmiyorsa boş array
            nodeId: node.id,
            scriptId: node.script_id,
            maxRetries: node.max_retries,
            timeoutSeconds: node.timeout_seconds,
            metaData: node.meta_data
          }
        };
      });

      // Edges'leri dönüştür
      const transformedEdges = (workflowData.edges || []).map((edge) => {
        // API'den gelen from_node_id ve to_node_id'yi name field'ına çevir
        const fromNode = workflowData.nodes?.find(n => n.id === edge.from_node_id);
        const toNode = workflowData.nodes?.find(n => n.id === edge.to_node_id);
        
        if (!fromNode || !toNode) {
          console.warn('⚠️ Edge için node bulunamadı:', edge);
          return null;
        }

        return {
          id: edge.id,
          source: fromNode.name, // API'den gelen name field'ını kullan
          target: toNode.name,   // API'den gelen name field'ını kullan
          type: 'custom',
          data: {
            condition_type: edge.condition_type || 'SUCCESS'
          }
        };
      }).filter(Boolean); // null edge'leri filtrele

      console.log('✅ Transformed nodes:', transformedNodes);
      console.log('✅ Transformed edges:', transformedEdges);

      return {
        id: workflowData.id,
        name: workflowData.name,
        description: workflowData.description,
        status: workflowData.status,
        status_message: workflowData.status_message,
        priority: workflowData.priority,
        total_executions: workflowData.total_executions,
        successful_executions: workflowData.successful_executions,
        failed_executions: workflowData.failed_executions,
        cancelled_executions: workflowData.cancelled_executions,
        avg_execution_duration: workflowData.avg_execution_duration,
        min_execution_duration: workflowData.min_execution_duration,
        max_execution_duration: workflowData.max_execution_duration,
        last_executed_at: workflowData.last_executed_at,
        last_successful_execution_at: workflowData.last_successful_execution_at,
        last_failed_execution_at: workflowData.last_failed_execution_at,
        nodes: transformedNodes,
        edges: transformedEdges,
        triggers: workflowData.triggers || [],
        executions: workflowData.executions || [],
        created_at: workflowData.created_at,
        updated_at: workflowData.updated_at
      };
    } catch (error) {
      console.error('❌ Error transforming workflow data:', error);
      throw error;
    }
  },

  // ✅ API params'ını configFields formatına dönüştür
  transformParamsToConfigFields(params) {
    if (!params || typeof params !== 'object') return [];
    
    return Object.entries(params).map(([key, value]) => ({
      name: key,
      type: 'string', // Varsayılan olarak string
      label: this.formatLabel(key),
      defaultValue: value || '',
      description: `${key} parametresi`
    }));
  },

  // ✅ Node oluştur
  async createNode(nodeData) {
    try {
      console.log('🔄 Creating node with data:', nodeData);
      
      const nodePayload = {
        workflow_id: nodeData.workflow_id,
        name: nodeData.name || 'test',
        description: nodeData.description || 'string',
        script_id: nodeData.script_id,
        
      };
      
      console.log('📤 Sending node payload:', nodePayload);

      const response = await fetch(`${API_BASE_URL}/nodes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nodePayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Node created successfully:', data);
      
      // API response structure: data.data.record_id or data.record_id
      const nodeId = data.data?.record_id || data.record_id || data.node_id || Date.now();
      
      return {
        success: true,
        node_id: nodeId,
        message: 'Node başarıyla oluşturuldu',
        data: data
      };
    } catch (error) {
      console.error('❌ Error creating node:', error);
      throw error;
    }
  },

  // ✅ Edge oluştur
  async createEdge(edgeData) {
    try {
      console.log('🔄 Creating edge with data:', edgeData);
      
      const edgePayload = {
        workflow_id: edgeData.workflow_id,
        from_node_id: String(edgeData.from_node_id),
        to_node_id: String(edgeData.to_node_id),
        condition_type: edgeData.condition_type || 'SUCCESS'
      };
      
      console.log('📤 Sending edge payload:', edgePayload);

      const response = await fetch(`${API_BASE_URL}/edges/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(edgePayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Edge created successfully:', data);
      
      // Return the response in the expected format
      return {
        success: data.success || true,
        data: data.data || {},
        message: data.message || 'Edge başarıyla oluşturuldu',
        correlation_id: data.correlation_id || null,
        timestamp: data.timestamp || new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error creating edge:', error);
      throw error;
    }
  },

  // ✅ Edge sil
  async deleteEdge(edgeId) {
    try {
      console.log('🗑️ Deleting edge with ID:', edgeId);
      
      const response = await fetch(`${API_BASE_URL}/edges/${edgeId}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Edge deleted successfully:', data);
      
      return {
        success: true,
        message: 'Edge başarıyla silindi',
        data: data
      };
    } catch (error) {
      console.error('❌ Error deleting edge:', error);
      throw error;
    }
  },

  // ✅ Node güncelle
  async updateNode(nodeId, nodeData) {
    try {
      console.log('🔄 Updating node with ID:', nodeId, 'data:', nodeData);
      
      // nodeData null check
      if (!nodeData) {
        throw new Error('Node data is required');
      }
      
      // Format the payload according to the new API structure
      const nodePayload = {
        name: nodeData.name || 'Updated Node',
        description: nodeData.description || 'Updated node description',
        input_params: nodeData.input_params || {},
        output_params: nodeData.output_params || {},
        meta_data: nodeData.meta_data || {},
        max_retries: nodeData.max_retries || 3,
        timeout_seconds: nodeData.timeout_seconds || 300
      };
      
      console.log('📤 Sending node update payload:', nodePayload);

      const response = await fetch(`${API_BASE_URL}/nodes/${nodeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nodePayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Node updated successfully:', data);
      
      return {
        success: true,
        message: 'Node başarıyla güncellendi',
        data: data
      };
    } catch (error) {
      console.error('❌ Error updating node:', error);
      throw error;
    }
  },

  // ✅ Node sil
  async deleteNode(nodeId) {
    try {
      console.log('🗑️ Deleting node with ID:', nodeId);
      
      const response = await fetch(`${API_BASE_URL}/nodes/${nodeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Node deleted successfully:', data);
      
      return {
        success: true,
        message: 'Node başarıyla silindi',
        data: data
      };
    } catch (error) {
      console.error('❌ Error deleting node:', error);
      throw error;
    }
  },


  // ✅ Workflow execution geçmişini getir
  async getWorkflowExecutions(workflowId) {
    try {
      console.log(' Fetching execution history for workflow:', workflowId);
      
      const response = await fetch(`${API_BASE_URL}/executions/?workflow_id=${workflowId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Execution history fetched:', data);
      
      const payload = this.extractData(data);
      const list = this.extractList(payload, ['executions', 'data']);
      if (Array.isArray(list)) {
        // Tarih bazında sırala (en güncel önce)
        const sortedExecutions = list.sort((a, b) => {
          const dateA = new Date(a.started_at);
          const dateB = new Date(b.started_at);
          return dateB - dateA; // Azalan sıralama (en güncel önce)
        });
        
        // İlk 5 execution'ı al ve formatla
        const executions = sortedExecutions.slice(0, 5).map(execution => ({
          id: execution.id,
          date: this.formatExecutionDate(execution.started_at),
          status: execution.status,
          duration: this.calculateExecutionDuration(execution.started_at, execution.ended_at),
          pending_nodes: execution.pending_nodes,
          executed_nodes: execution.executed_nodes,
          started_at: execution.started_at,
          ended_at: execution.ended_at
        }));
        
        // Ortalama süreyi hesapla
        const averageDuration = this.calculateAverageExecutionDuration(sortedExecutions.slice(0, 5));
        
        // Son execution tarihini hesapla
        const lastExecutionDate = this.getLastExecutionDate(sortedExecutions);
        
        return {
          success: true,
          executions: executions,
          average_duration: averageDuration,
          last_execution_date: lastExecutionDate,
          total_count: data.total_count || payload?.total_count || executions.length,
          data: data
        };
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      console.error('❌ Error fetching execution history:', error);
      throw error;
    }
  },

  // ✅ Execution tarihini formatla
  formatExecutionDate(dateString) {
    if (!dateString) return 'Bilinmiyor';
    
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // ✅ Execution süresini hesapla
  calculateExecutionDuration(startedAt, endedAt) {
    if (!startedAt || !endedAt) return 'Bilinmiyor';
    
    const started = new Date(startedAt);
    const ended = new Date(endedAt);
    const diffMs = ended - started;
    
    if (diffMs < 0) return 'Bilinmiyor';
    
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffSecs < 60) return `${diffSecs}s`;
    if (diffMins < 60) return `${diffMins}m ${diffSecs % 60}s`;
    return `${diffHours}h ${diffMins % 60}m`;
  },

  // ✅ Execution süresini milisaniye cinsinden hesapla
  calculateExecutionDurationMs(startedAt, endedAt) {
    if (!startedAt || !endedAt) return null;
    
    const started = new Date(startedAt);
    const ended = new Date(endedAt);
    const diffMs = ended - started;
    
    return diffMs >= 0 ? diffMs : null;
  },

  // ✅ Son 5 execution'ın ortalama süresini hesapla
  calculateAverageExecutionDuration(executions) {
    if (!executions || executions.length === 0) return 'Bilinmiyor';
    
    // Sadece tamamlanmış execution'ları al
    const completedExecutions = executions.filter(execution => 
      execution.status === 'completed' && execution.started_at && execution.ended_at
    );
    
    if (completedExecutions.length === 0) return 'Bilinmiyor';
    
    // Her execution'ın süresini milisaniye cinsinden hesapla
    const durations = completedExecutions.map(execution => 
      this.calculateExecutionDurationMs(execution.started_at, execution.ended_at)
    ).filter(duration => duration !== null);
    
    if (durations.length === 0) return 'Bilinmiyor';
    
    // Ortalama süreyi hesapla
    const averageMs = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    
    // Ortalama süreyi okunabilir formata çevir
    return this.formatDuration(averageMs);
  },

  // ✅ Milisaniyeyi okunabilir formata çevir
  formatDuration(milliseconds) {
    if (!milliseconds || milliseconds < 0) return 'Bilinmiyor';
    
    const diffSecs = Math.floor(milliseconds / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffSecs < 60) return `${diffSecs}s`;
    if (diffMins < 60) return `${diffMins}m ${diffSecs % 60}s`;
    return `${diffHours}h ${diffMins % 60}m`;
  },

  // ✅ Son execution'ın tarihini hesapla
  getLastExecutionDate(executions) {
    if (!executions || executions.length === 0) return 'Bilinmiyor';
    
    // En güncel execution'ı bul (zaten sıralanmış olarak geliyor)
    const lastExecution = executions[0];
    
    if (!lastExecution.started_at) return 'Bilinmiyor';
    
    // Tarihi "ne kadar önce" formatında göster
    return this.formatRelativeDate(lastExecution.started_at);
  },

  // ✅ Tarihi "ne kadar önce" formatında göster
  formatRelativeDate(dateString) {
    if (!dateString) return 'Bilinmiyor';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    
    return date.toLocaleDateString('tr-TR');
  },

  // ✅ Execution sonuçlarını getir
  async getExecutionResults(executionId) {
    try {
      console.log(' Fetching execution results for ID:', executionId);
      
      const response = await fetch(`${API_BASE_URL}/executions/${executionId}/results`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Execution results fetched:', data);
      
      const payload = this.extractData(data) || {};
      const results = payload.results || data.results;
      const meta = payload.data || payload;
      const executionStatus = meta.execution_status || payload.execution_status;
      
      if (data.status === undefined || data.status) {
        // Başarısız execution'lar için farklı veri yapısı
        if (executionStatus === 'ExecutionStatus.FAILED' || executionStatus === 'FAILED') {
          return {
            success: true,
            execution_id: meta.execution_id,
            execution_status: executionStatus,
            results: results, // Basit results objesi
            data: data
          };
        }
        
        // Başarılı execution'lar için detaylı veri yapısı
        if (results && results.summary) {
          return {
            success: true,
            execution_id: meta.execution_id,
            execution_status: executionStatus,
            summary: results.summary,
            node_results: results.node_results,
            execution_flow: results.execution_flow,
            total_nodes: results.total_nodes,
            consolidated_at: results.consolidated_at,
            data: data
          };
        }
        
        throw new Error('Invalid API response format');
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      console.error('❌ Error fetching execution results:', error);
      throw error;
    }
  },

  // ✅ Node süresini hesapla
  calculateNodeDuration(startedAt, endedAt) {
    if (!startedAt || !endedAt) return 'Bilinmiyor';
    
    const started = new Date(startedAt);
    const ended = new Date(endedAt);
    const diffMs = ended - started;
    
    if (diffMs < 0) return 'Bilinmiyor';
    
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    
    if (diffSecs < 60) return `${diffSecs}ms`;
    if (diffMins < 60) return `${diffMins}s ${diffSecs % 60}ms`;
    return `${diffMins}m ${diffSecs % 60}s`;
  },
  
  // ✅ Dosya yükleme fonksiyonu
  async uploadFile(file, isTemporary = true) {
    try {
      console.log('📤 Uploading file:', file.name, 'is_temporary:', isTemporary);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('is_temporary', isTemporary);
      
      const response = await fetch(`${API_BASE_URL}/files/`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ File uploaded successfully:', data);
      
      if (data.success && data.data) {
        return {
          success: true,
          file: data.data,
          message: 'Dosya başarıyla yüklendi',
          data: data
        };
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      throw error;
    }
  },

  // ✅ Dosya listesini getir
  async getFiles() {
    try {
      console.log('📋 Fetching files list');
      
      const response = await fetch(`${API_BASE_URL}/files/`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Files list fetched:', data);
      
      const payload = this.extractData(data);
      const files = this.extractList(payload, ['files', 'data']);
      return {
        success: true,
        files: files,
        message: 'Dosya listesi başarıyla getirildi',
        data: data
      };
    } catch (error) {
      console.error('❌ Error fetching files:', error);
      throw error;
    }
  },

  // ✅ Dosya silme fonksiyonu
  async deleteFile(fileId) {
    try {
      console.log('🗑️ Deleting file with ID:', fileId);
      
      const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ File deleted successfully:', data);
      
      return {
        success: true,
        message: 'Dosya başarıyla silindi',
        data: data
      };
    } catch (error) {
      console.error('❌ Error deleting file:', error);
      throw error;
    }
  },

  // ✅ Dosya durumunu güncelle (temporary/permanent)
  async updateFileStatus(fileId, isTemporary) {
    try {
      console.log('🔄 Updating file status:', fileId, 'is_temporary:', isTemporary);
      
      const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_temporary: isTemporary
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ File status updated successfully:', data);
      
      return {
        success: true,
        message: 'Dosya durumu başarıyla güncellendi',
        data: data
      };
    } catch (error) {
      console.error('❌ Error updating file status:', error);
      throw error;
    }
  },

  // ✅ Environment Variables - Değişkenleri getir
  async getEnvironmentVariables() {
    try {
      console.log('📋 Fetching environment variables');
      
      const response = await fetch(`${API_BASE_URL}/envar/`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Environment variables fetched:', data);
      
      const payload = this.extractData(data);
      const variablesList = this.extractList(payload, ['variables', 'data']);
      if (Array.isArray(variablesList)) {
        // API'den gelen veriyi component formatına dönüştür
        const transformedVariables = variablesList.map(variable => ({
          id: variable.id,
          name: variable.name,
          value: variable.value,
          description: variable.description || '',
          type: variable.variable_type?.toUpperCase() || 'STRING',
          scope: variable.scope?.toUpperCase() || 'USER',
          last_accessed_at: variable.last_accessed_at,
          access_count: variable.access_count || 0,
          created_at: variable.created_at,
          updated_at: variable.updated_at,
          last_modified_by: variable.last_modified_by
        }));
        
        return {
          success: true,
          variables: transformedVariables,
          message: 'Environment variables başarıyla getirildi',
          data: data
        };
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      console.error('❌ Error fetching environment variables:', error);
      throw error;
    }
  },

  // ✅ Environment Variable oluştur
  async createEnvironmentVariable(variableData) {
    try {
      console.log('🔄 Creating environment variable with data:', variableData);
      
      // Ensure variable_type is one of the allowed values in uppercase
      const allowedVariableTypes = ['STRING', 'INTEGER', 'FLOAT', 'BOOLEAN', 'JSON', 'SECRET', 'CREDENTIAL', 'FILE_PATH', 'URL'];
      const variableType = (variableData.variable_type || 'STRING').toUpperCase();
      
      // Ensure scope is one of the allowed values in uppercase
      const allowedScopes = ['GLOBAL', 'WORKFLOW', 'TRIGGER', 'USER', 'NODE'];
      const scope = (variableData.scope || 'USER').toUpperCase();
      
      // Validate variable_type
      if (!allowedVariableTypes.includes(variableType)) {
        throw new Error(`Invalid variable_type. Must be one of: ${allowedVariableTypes.join(', ')}`);
      }
      
      // Validate scope
      if (!allowedScopes.includes(scope)) {
        throw new Error(`Invalid scope. Must be one of: ${allowedScopes.join(', ')}`);
      }
      
      const response = await fetch(`${API_BASE_URL}/envar/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...variableData,
          variable_type: variableType,
          scope: scope,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Environment variable created successfully:', data);
      
      return {
        success: true,
        variable: data.data,
        message: 'Environment variable başarıyla oluşturuldu',
        data: data
      };
    } catch (error) {
      console.error('❌ Error creating environment variable:', error);
      throw error;
    }
  },

  // ✅ Environment Variable güncelle
  async updateEnvironmentVariable(variableId, variableData) {
    try {
      console.log('🔄 Updating environment variable with ID:', variableId, 'data:', variableData);
      
      // Ensure variable_type is one of the allowed values in uppercase
      const allowedVariableTypes = ['STRING', 'INTEGER', 'FLOAT', 'BOOLEAN', 'JSON', 'SECRET', 'CREDENTIAL', 'FILE_PATH', 'URL'];
      const variableType = (variableData.variable_type || 'STRING').toUpperCase();
      
      // Ensure scope is one of the allowed values in uppercase
      const allowedScopes = ['GLOBAL', 'WORKFLOW', 'TRIGGER', 'USER', 'NODE'];
      const scope = (variableData.scope || 'USER').toUpperCase();
      
      // Validate variable_type
      if (!allowedVariableTypes.includes(variableType)) {
        throw new Error(`Invalid variable_type. Must be one of: ${allowedVariableTypes.join(', ')}`);
      }
      
      // Validate scope
      if (!allowedScopes.includes(scope)) {
        throw new Error(`Invalid scope. Must be one of: ${allowedScopes.join(', ')}`);
      }
      
      const response = await fetch(`${API_BASE_URL}/envar/${variableId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...variableData,
          variable_type: variableType,
          scope: scope,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Environment variable updated successfully:', data);
      
      return {
        success: true,
        variable: data.data,
        message: 'Environment variable başarıyla güncellendi',
        data: data
      };
    } catch (error) {
      console.error('❌ Error updating environment variable:', error);
      throw error;
    }
  },

  // ✅ Environment Variable sil
  async deleteEnvironmentVariable(variableId) {
    try {
      console.log('🗑️ Deleting environment variable with ID:', variableId);
      
      const response = await fetch(`${API_BASE_URL}/envar/${variableId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Environment variable deleted successfully:', data);
      
      return {
        success: true,
        message: 'Environment variable başarıyla silindi',
        data: data
      };
    } catch (error) {
      console.error('❌ Error deleting environment variable:', error);
      throw error;
    }
  },

  // ✅ Executions listesini getir
  async getExecutions() {
    try {
      console.log('📋 Fetching executions list');
      
      const response = await fetch(`${API_BASE_URL}/executions/`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Executions list fetched:', data);
      
      const payload = this.extractData(data);
      const executions = this.extractList(payload, ['executions', 'data']);
      return {
        success: true,
        executions: executions,
        total_count: data.total_count || payload?.total_count || executions.length || 0,
        page_info: data.page_info || payload?.page_info || {},
        message: 'Executions listesi başarıyla getirildi',
        data: data
      };
    } catch (error) {
      console.error('❌ Error fetching executions:', error);
      throw error;
    }
  },

  // ✅ Trigger oluştur
  async createTrigger(triggerData) {
    try {
      console.log('🔄 Creating trigger with data:', triggerData);
      
      const triggerPayload = {
        workflow_id: triggerData.workflow_id,
        name: triggerData.name || 'manual_trigger_addition_chain',
        trigger_type: triggerData.trigger_type || 'MANUAL',
        description: triggerData.description || 'Manual trigger for testing addition chain workflow',
        config: triggerData.config || {
          allow_parallel: false,
          description: 'Test trigger for sequential addition operations'
        },
        status: triggerData.status || 'ACTIVE'
      };
      
      console.log('📤 Sending trigger payload:', triggerPayload);

      const response = await fetch(`${API_BASE_URL}/triggers/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(triggerPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Trigger created successfully:', data);
      
      return {
        success: true,
        trigger_id: data.data?.record_id || Date.now(),
        message: 'Trigger başarıyla oluşturuldu',
        data: data
      };
    } catch (error) {
      console.error('❌ Error creating trigger:', error);
      throw error;
    }
  },

  // ✅ Node detaylarını getir
  async getNodeDetails(nodeId) {
    try {
      console.log('🔍 Fetching node details for ID:', nodeId);
      
      const response = await fetch(`${API_BASE_URL}/nodes/${nodeId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Node details fetched:', data);
      
      if (data.success && data.data) {
        const nodeData = data.data;
        
        // API response'unu NodeConfigPanel formatına dönüştür
        return {
          success: true,
          node: {
            id: nodeData.id,
            name: nodeData.name,
            description: nodeData.description,
            workflow_id: nodeData.workflow_id,
            script_id: nodeData.script_id,
            input_params: nodeData.input_params || {},
            output_params: nodeData.output_params || {},
            meta_data: nodeData.meta_data || {},
            max_retries: nodeData.max_retries,
            timeout_seconds: nodeData.timeout_seconds,
            created_at: nodeData.created_at,
            updated_at: nodeData.updated_at
          },
          message: data.message || 'Node detayları başarıyla getirildi',
          data: data
        };
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      console.error('❌ Error fetching node details:', error);
      throw error;
    }
  },

  // ✅ Trigger çalıştır
  async executeTrigger(triggerId) {
    try {
      console.log('🔄 Executing trigger with ID:', triggerId);
      
      const triggerPayload = {
        input_data: {
          test_execution: true,
          description: "Testing addition chain workflow: 2+2, result+2, result+2"
        }
      };
      
      console.log('📤 Sending trigger execution payload:', triggerPayload);

      const response = await fetch(`${API_BASE_URL}/triggers/${triggerId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(triggerPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Trigger executed successfully:', data);
      
      return {
        success: data.success || true,
        trigger_id: data.data?.trigger_id,
        workflow_id: data.data?.workflow_id,
        execution_id: data.data?.execution_id,
        execution_status: data.data?.execution_status,
        trigger_type: data.data?.trigger_type,
        triggered_at: data.data?.triggered_at,
        processed_data: data.data?.processed_data,
        message: data.message || 'Trigger başarıyla çalıştırıldı',
        correlation_id: data.correlation_id,
        timestamp: data.timestamp,
        data: data
      };
    } catch (error) {
      console.error('❌ Error executing trigger:', error);
      throw error;
    }
  },
};