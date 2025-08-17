class WorkflowExecutor {
  constructor(onStatusUpdate = null) {
    this.executionHistory = [];
    this.currentResults = {};
    this.onStatusUpdate = onStatusUpdate;
  }

  // Workflow JSON'ı okunur ve execution plan oluşturulur
  parseWorkflow(workflowData) {
    const { nodes, edges } = workflowData;
    
    // Trigger node'ları bul
    const triggerNodes = nodes.filter(node => node.data.type === 'trigger');
    
    if (triggerNodes.length === 0) {
      throw new Error('Workflow must have at least one trigger node');
    }

    // Execution path'ini oluştur
    const executionPath = this.buildExecutionPath(nodes, edges, triggerNodes[0].id);
    
    return {
      nodes,
      edges,
      executionPath,
      triggerNode: triggerNodes[0]
    };
  }

  // Execution path'ini edge'lere göre oluştur
  buildExecutionPath(nodes, edges, startNodeId) {
    const path = [];
    const visited = new Set();
    
    const traverse = (nodeId) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        path.push(node);
        
        // Bu node'dan çıkan edge'leri bul
        const outgoingEdges = edges.filter(edge => edge.source === nodeId);
        
        // Her edge için hedef node'u traverse et
        outgoingEdges.forEach(edge => {
          traverse(edge.target);
        });
      }
    };
    
    traverse(startNodeId);
    return path;
  }

  // Workflow'u çalıştır
  async executeWorkflow(workflowData) {
    try {
      console.log('Starting workflow execution...');
      
      // Tüm node'ları pending status'una reset et
      this.resetAllNodeStatuses(workflowData.nodes);
      
      // Workflow JSON'ı parse et
      const parsedWorkflow = this.parseWorkflow(workflowData);
      
      // Trigger node ile başla
      const triggerNode = parsedWorkflow.triggerNode;
      console.log(`Starting with trigger node: ${triggerNode.data.label}`);
      
      // Trigger node'u çalıştır
      const triggerResult = await this.executeNode(triggerNode, {});
      
      // Execution path boyunca her node'u çalıştır
      let currentResult = triggerResult;
      
      for (let i = 1; i < parsedWorkflow.executionPath.length; i++) {
        const node = parsedWorkflow.executionPath[i];
        console.log(`Executing node: ${node.data.label} (${node.data.type})`);
        
        // Her node çalıştırılır, sonucu bir sonraki node'a aktarılır
        currentResult = await this.executeNode(node, currentResult);
        
        // Node tipine göre özel mantık yürütülür
        await this.handleNodeTypeSpecificLogic(node, currentResult);
      }
      
      console.log('Workflow execution completed successfully');
      return {
        success: true,
        finalResult: currentResult,
        executionHistory: this.executionHistory
      };
      
    } catch (error) {
      console.error('Workflow execution failed:', error);
      return {
        success: false,
        error: error.message,
        executionHistory: this.executionHistory
      };
    }
  }

  // Node'u çalıştır
  async executeNode(node, inputData) {
    const startTime = Date.now();
    
    // Node'u running status'una güncelle
    this.updateNodeStatus(node.id, 'running', null);
    
    try {
      // Node tipine göre özel mantık yürütülür
      let result;
      
      switch (node.data.type) {
        case 'trigger':
          result = await this.executeTriggerNode(node, inputData);
          break;
        case 'action':
          result = await this.executeActionNode(node, inputData);
          break;
        case 'logic':
          result = await this.executeLogicNode(node, inputData);
          break;
        default:
          result = { message: `Unknown node type: ${node.data.type}` };
      }
      
      const executionTime = Date.now() - startTime;
      
      // Execution history'ye ekle
      this.executionHistory.push({
        nodeId: node.id,
        nodeLabel: node.data.label,
        nodeType: node.data.type,
        input: inputData,
        output: result,
        executionTime,
        status: 'success',
        timestamp: new Date().toISOString()
      });
      
      // Node'u güncelle
      this.updateNodeStatus(node.id, 'success', result);
      
      return result;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.executionHistory.push({
        nodeId: node.id,
        nodeLabel: node.data.label,
        nodeType: node.data.type,
        input: inputData,
        error: error.message,
        executionTime,
        status: 'error',
        timestamp: new Date().toISOString()
      });
      
      this.updateNodeStatus(node.id, 'error', { error: error.message });
      throw error;
    }
  }

  // Trigger node'ları için özel mantık
  async executeTriggerNode(node, inputData) {
    switch (node.data.label) {
      case 'Webhook':
        return {
          type: 'webhook',
          data: { url: 'https://api.example.com/webhook', method: 'POST' },
          timestamp: new Date().toISOString()
        };
      case 'Schedule':
        return {
          type: 'schedule',
          data: { cron: '0 0 * * *', timezone: 'UTC' },
          timestamp: new Date().toISOString()
        };
      case 'Manual':
        return {
          type: 'manual',
          data: { triggeredBy: 'user', timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString()
        };
      default:
        return { type: 'trigger', data: inputData };
    }
  }

  // Action node'ları için özel mantık
  async executeActionNode(node, inputData) {
    switch (node.data.label) {
      case 'HTTP Request':
        return await this.simulateHttpRequest(inputData);
      case 'Email':
        return await this.simulateEmailSend(inputData);
      case 'Database':
        return await this.simulateDatabaseOperation(inputData);
      case 'Code':
        return await this.executeCode(inputData);
      default:
        return { type: 'action', data: inputData };
    }
  }

  // Logic node'ları için özel mantık
  async executeLogicNode(node, inputData) {
    switch (node.data.label) {
      case 'Filter':
        return this.filterData(inputData);
      case 'Transform':
        return this.transformData(inputData);
      case 'Split':
        return this.splitData(inputData);
      default:
        return { type: 'logic', data: inputData };
    }
  }

  // Simülasyon fonksiyonları
  async simulateHttpRequest(inputData) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    return {
      type: 'http_response',
      status: 200,
      data: { message: 'HTTP request successful', input: inputData },
      headers: { 'content-type': 'application/json' }
    };
  }

  async simulateEmailSend(inputData) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      type: 'email_sent',
      to: 'recipient@example.com',
      subject: 'Workflow Notification',
      body: 'This is a test email from workflow',
      input: inputData
    };
  }

  async simulateDatabaseOperation(inputData) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      type: 'database_operation',
      operation: 'insert',
      table: 'workflow_logs',
      affectedRows: 1,
      input: inputData
    };
  }

  async executeCode(inputData) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      type: 'code_execution',
      result: 'Code executed successfully',
      input: inputData,
      output: { processed: true, timestamp: new Date().toISOString() }
    };
  }

  filterData(inputData) {
    return {
      type: 'filtered_data',
      original: inputData,
      filtered: inputData.data ? inputData.data.filter(item => item.active) : inputData
    };
  }

  transformData(inputData) {
    return {
      type: 'transformed_data',
      original: inputData,
      transformed: {
        ...inputData,
        processed: true,
        transformedAt: new Date().toISOString()
      }
    };
  }

  splitData(inputData) {
    return {
      type: 'split_data',
      original: inputData,
      parts: inputData.data ? [inputData.data.slice(0, 2), inputData.data.slice(2)] : [inputData]
    };
  }

  // Node tipine göre özel mantık
  async handleNodeTypeSpecificLogic(node, result) {
    // Bu fonksiyon node tipine göre ek işlemler yapabilir
    // Örneğin: logging, monitoring, error handling vb.
    console.log(`Node ${node.data.label} completed with result:`, result);
  }

  // Node status'unu güncelle
  updateNodeStatus(nodeId, status, result) {
    // Bu fonksiyon UI'da node'ların status'unu güncellemek için kullanılabilir
    this.currentResults[nodeId] = { status, result };
    
    // UI'ı güncelle
    if (this.onStatusUpdate) {
      this.onStatusUpdate(nodeId, status, result);
    }
  }

  // Execution history'yi temizle
  clearHistory() {
    this.executionHistory = [];
    this.currentResults = {};
  }

  // Tüm node'ları reset et
  resetAllNodeStatuses(nodes) {
    nodes.forEach(node => {
      this.updateNodeStatus(node.id, 'pending', null);
    });
  }
}

export default WorkflowExecutor; 