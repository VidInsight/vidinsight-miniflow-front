// Gerçek API servisi: Tüm istekler bu base URL üzerinden yapılır
const API_BASE_URL = 'https://n8n.vidinsight.com.tr/api/bff';
// API fonksiyonları
// API ile ilgili tüm fonksiyonları içeren servis nesnesi
export const apiService = {
  // Workflow listesini getir
  // Tüm workflow'ları API'den çeker ve kart formatına dönüştürür
  async getWorkflows() {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.success && data.data) {
        return this.transformWorkflowsToCards(data.data);
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
    return workflows.map(workflow => ({
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

  // ✅ Workflow oluştur - basit format için güncellendi
  async createWorkflow(workflowData = {}) {
    try {
      console.log('🔄 Creating workflow with data:', workflowData);
      
      // Basit workflow payload'ı oluştur
      const workflowPayload = {
        name: workflowData.name || `Yeni Workflow ${Date.now()}`,
        description: workflowData.description || 'Yeni oluşturulan workflow',
        priority: workflowData.priority || 0,
        nodes: workflowData.nodes || [],
        edges: workflowData.edges || []
      };
      
      console.log('📤 Sending workflow payload:', workflowPayload);

      const response = await fetch(`${API_BASE_URL}/workflows/create`, {
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

      const data = await response.json();
      console.log('✅ Workflow created successfully:', data);
      
      if (data.workflow_id) {
        // API'den dönen veriyi kullan
        return {
          success: true,
          workflow: {
            id: data.workflow_id,
            name: workflowPayload.name,
            description: workflowPayload.description,
            status: 'draft',
            priority: workflowPayload.priority,
            nodes: workflowPayload.nodes,
            edges: workflowPayload.edges,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          message: 'Workflow başarıyla oluşturuldu',
          data: data
        };
      } else {
        throw new Error('API response\'da workflow_id bulunamadı');
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
      
      // API response'unu node kategorilerine dönüştür
      return this.transformScriptsToNodeCategories(data.data);
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
      
      const response = await fetch(`${API_BASE_URL}/workflows/${workflowId}?include_nodes=true&include_edges=true`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Workflow details fetched:', data);
      
      // API'den gelen veriyi React Flow formatına dönüştür
      const transformedData = this.transformWorkflowToReactFlow(data.data);
      
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
        
        return {
          id: node.name, // API'den gelen name field'ını id olarak kullan
          type: 'custom',
          position: { x, y },
          data: {
            id: node.script_id,
            label: node.name,
            type: 'script',
            icon: this.getIconForScript("python"),
            color: 'bg-blue-500',
            description: 'Script node',
            configFields: this.transformParamsToConfigFields(node.params),
            settings: node.params || {},
            outputParams: node.output_params || [], // API'den output_params gelmiyorsa boş object
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
        id: workflowData.id,
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

  // ✅ Node oluştur
  async createNode(nodeData) {
    try {
      console.log('🔄 Creating node with data:', nodeData);
      
      const nodePayload = {
        workflow_id: nodeData.workflow_id,
        script_id: nodeData.script_id,
        name: nodeData.name,
        params: nodeData.params || {},
        max_retries: nodeData.max_retries || 3,
        timeout_seconds: nodeData.timeout_seconds || 300
      };
      
      console.log('📤 Sending node payload:', nodePayload);

      const response = await fetch(`${API_BASE_URL}/nodes/create`, {
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
      
      return {
        success: true,
        node_id: data.node_id || Date.now(),
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
        from_node_id: edgeData.from_node_id,
        to_node_id: edgeData.to_node_id,
        condition_type: edgeData.condition_type || 'success'
      };
      
      console.log('📤 Sending edge payload:', edgePayload);

      const response = await fetch(`${API_BASE_URL}/edges/create`, {
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
      
      return {
        success: true,
        edge_id: data.edge_id || Date.now(),
        message: 'Edge başarıyla oluşturuldu',
        data: data
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
      console.log(' Updating node with ID:', nodeId, 'data:', nodeData);
      
      // nodeData null check
      if (!nodeData) {
        throw new Error('Node data is required');
      }
      
      const nodePayload = {
        workflow_id: nodeData.workflow_id,
        name: nodeData.name,
        script_id: nodeData.script_id,
        params: nodeData.params || {},
        max_retries: nodeData.max_retries || 3,
        timeout_seconds: nodeData.timeout_seconds || 300
      };
      
      console.log('📤 Sending node update payload:', nodePayload);

      const response = await fetch(`${API_BASE_URL}/nodes/${nodeId}/update`, {
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
      
      const response = await fetch(`${API_BASE_URL}/nodes/${nodeId}/delete`, {
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
      
      if (data.status && data.data) {
        // Tarih bazında sırala (en güncel önce)
        const sortedExecutions = data.data.sort((a, b) => {
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
          total_count: data.total_count,
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
      
      if (data.status) {
        // Başarısız execution'lar için farklı veri yapısı
        if (data.data.execution_status === 'ExecutionStatus.FAILED' || 
            data.data.execution_status === 'FAILED') {
          return {
            success: true,
            execution_id: data.data.execution_id,
            execution_status: data.data.execution_status,
            results: data.results, // Basit results objesi
            data: data
          };
        }
        
        // Başarılı execution'lar için detaylı veri yapısı
        if (data.results && data.results.summary) {
          return {
            success: true,
            execution_id: data.data.execution_id,
            execution_status: data.data.execution_status,
            summary: data.results.summary,
            node_results: data.results.node_results,
            execution_flow: data.results.execution_flow,
            total_nodes: data.results.total_nodes,
            consolidated_at: data.results.consolidated_at,
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
      
      if (data.success && data.data) {
        return {
          success: true,
          files: data.data,
          message: 'Dosya listesi başarıyla getirildi',
          data: data
        };
      } else {
        throw new Error('Invalid API response format');
      }
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
};