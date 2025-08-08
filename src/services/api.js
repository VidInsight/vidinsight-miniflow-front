// Gerçek API servisi: Tüm istekler bu base URL üzerinden yapılır
const API_BASE_URL = 'https://n8n.vidinsight.com.tr/miniflow/api/v1';
// API fonksiyonları
// API ile ilgili tüm fonksiyonları içeren servis nesnesi
export const apiService = {
  // Workflow listesini getir
  // Tüm workflow'ları API'den çeker ve kart formatına dönüştürür
  async getWorkflows() {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows/list`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.status && data.workflows) {
        return this.transformWorkflowsToCards(data.workflows);
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      console.error('Error fetching workflows:', error);
      throw error;
    }
  },

  // Workflow verilerini kart formatına dönüştür
  // API'den gelen workflow verisini dashboard'da kullanılacak kart formatına dönüştürür
  transformWorkflowsToCards(workflows) {
    return workflows.map(workflow => ({
      id: workflow.workflow_id,
      name: workflow.name,
      status: this.mapWorkflowStatus(workflow.status),
      lastRun: this.formatDate(workflow.updated_at),
      duration: this.calculateDuration(workflow.created_at, workflow.updated_at),
      description: workflow.description || 'Açıklama bulunmuyor',
      steps: workflow.nodes ? workflow.nodes.length : 0,
      completedSteps: this.calculateCompletedSteps(workflow),
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
    return statusMap[status] || 'pending';
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
  calculateCompletedSteps(workflow) {
    if (!workflow.nodes || workflow.nodes.length === 0) return 0;
    
    // Draft durumunda hiç adım tamamlanmamış
    if (workflow.status === 'draft') return 0;
    
    // Diğer durumlar için basit bir hesaplama
    const totalSteps = workflow.nodes.length;
    switch (workflow.status) {
      case 'active':
        return Math.floor(totalSteps / 2); // Yarısı tamamlanmış
      case 'completed':
        return totalSteps; // Hepsi tamamlanmış
      case 'error':
        return Math.floor(totalSteps * 0.3); // %30'u tamamlanmış
      default:
        return 0;
    }
  },

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

  // Yeni workflow oluştur
  // Yeni bir workflow oluşturur, API'ye gönderir ve sonucu kart formatında döndürür
  async createWorkflow(workflowData = {}) {
    try {
      const templates = this.getWorkflowTemplates();
      
      // Template seçimi (varsayılan: addition_workflow)
      const templateType = workflowData.template || 'addition_workflow';
      const template = templates[templateType] || templates.addition_workflow;
      
      // Workflow yapısını oluştur
      const workflowPayload = {
        name: workflowData.name || `${template.name}_${Date.now()}`,
        description: workflowData.description || template.description,
        nodes: workflowData.nodes || template.nodes,
        edges: workflowData.edges || template.edges,
        triggers: workflowData.triggers || template.triggers
      };
      
      // Eğer tamamen özel workflow verisi sağlanmışsa, onu kullan
      if (workflowData.customWorkflow) {
        Object.assign(workflowPayload, workflowData.customWorkflow);
      }
      
      console.log('Creating workflow with payload:', workflowPayload);

      const response = await fetch(`${API_BASE_URL}/workflows/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowPayload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status && data.workflow_id) {
        // Oluşturulan workflow'u kart formatında döndür
        return {
          id: data.workflow_id,
          name: workflowPayload.name,
          status: 'draft',
          lastRun: 'Hiç çalışmadı',
          duration: '0s',
          description: workflowPayload.description,
          steps: workflowPayload.nodes.length,
          completedSteps: 0,
          priority: workflowPayload.priority || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          nodes: workflowPayload.nodes,
          edges: workflowPayload.edges,
          triggers: workflowPayload.triggers
        };
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  },

  // Workflow güncelle
  // Var olan bir workflow'u günceller
  async updateWorkflow(workflowId, workflowData) {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows/${workflowId}`, {
        method: 'PUT',
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
      const response = await fetch(`${API_BASE_URL}/scripts/list`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // API response'unu node kategorilerine dönüştür
      return this.transformScriptsToNodeCategories(data.scripts);
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
  // Belirli bir script'in detaylarını API'den çeker ve node formatında döndürür
  async getNodeDetails(nodeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/scripts/list`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      const script = data.scripts.find(s => s.script_id === nodeId);
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

  // Workflow kaydet - gerçek API endpoint'ine gönder
  async saveWorkflow(workflowData) {
    try {
      console.log(' Saving workflow to API:', workflowData);
      
      const response = await fetch(`${API_BASE_URL}/workflows/create`, {
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
      
      const response = await fetch(`${API_BASE_URL}/executions/create/${workflowId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Eğer execution için özel parametreler varsa buraya eklenebilir
          trigger_type: 'manual',
          timestamp: new Date().toISOString()
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
      
      const response = await fetch(`${API_BASE_URL}/workflows/${workflowId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Workflow details fetched:', data);
      
      // API'den gelen veriyi React Flow formatına dönüştür
      const transformedData = this.transformWorkflowToReactFlow(data);
      
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

  // ✅ API workflow verisini React Flow formatına dönüştür
  transformWorkflowToReactFlow(workflowData) {
    try {
      console.log('🔄 Transforming workflow data to React Flow format:', workflowData);
      
      // Nodes'ları dönüştür
      const transformedNodes = (workflowData.nodes || []).map((node, index) => {
        // Node pozisyonunu hesapla (grid layout)
        const x = (index % 3) * 250 + 100;
        const y = Math.floor(index / 3) * 150 + 100;
        
        return {
          id: node.name, // API'den gelen name field'ını id olarak kullan
          type: 'custom',
          position: { x, y },
          data: {
            id: node.script_id,
            label: node.name,
            type: 'script',
            icon: 'Code',
            color: 'bg-blue-500',
            description: 'Script node',
            configFields: this.transformParamsToConfigFields(node.params),
            settings: node.params || {},
            outputParams: {}, // API'den output_params gelmiyorsa boş object
            nodeId: node.id, // API'den gelen node id'sini sakla
            scriptId: node.script_id
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
            condition_type: edge.condition_type || 'success'
          }
        };
      }).filter(Boolean); // null edge'leri filtrele

      console.log('✅ Transformed nodes:', transformedNodes);
      console.log('✅ Transformed edges:', transformedEdges);

      return {
        id: workflowData.workflow_id,
        name: workflowData.name,
        description: workflowData.description,
        status: workflowData.status,
        nodes: transformedNodes,
        edges: transformedEdges,
        triggers: workflowData.triggers || [],
        created_at: workflowData.created_at,
        updated_at: workflowData.updated_at,
        priority: workflowData.priority
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
      required: false,
      description: `${key} parametresi`
    }));
  },
};