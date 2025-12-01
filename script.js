class Node {
    constructor(id, x, y, name, title, description) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.name = name;
        this.title = title;
        this.description = description;
        this.width = 200;
        this.height = 120;
        this.inputConnector = { x: this.x, y: this.y + this.height / 2 };
        this.outputConnector = { x: this.x + this.width, y: this.y + this.height / 2 };
        this.selected = false;
    }

    draw(ctx, offsetX = 0, offsetY = 0) {
        // Aplicar offset para movimentação do canvas
        const drawX = this.x + offsetX;
        const drawY = this.y + offsetY;
        
        // Desenhar o nó
        ctx.fillStyle = this.selected ? '#555' : '#444';
        ctx.fillRect(drawX, drawY, this.width, this.height);
        
        // Borda do nó
        ctx.strokeStyle = this.selected ? '#4CAF50' : '#555';
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX, drawY, this.width, this.height);
        
        // Sombra quando selecionado
        if (this.selected) {
            ctx.shadowColor = 'rgba(76, 175, 80, 0.5)';
            ctx.shadowBlur = 10;
            ctx.strokeRect(drawX, drawY, this.width, this.height);
            ctx.shadowBlur = 0;
        }
        
        // Nome do nó
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(this.name, drawX + 10, drawY + 25);
        
        // Título do nó
        ctx.fillStyle = '#ddd';
        ctx.font = '14px Arial';
        ctx.fillText(this.title, drawX + 10, drawY + 45);
        
        // Descrição do nó
        ctx.fillStyle = '#bbb';
        ctx.font = '12px Arial';
        this.wrapText(ctx, this.description, drawX + 10, drawY + 65, this.width - 20, 15);
        
        // Conectores
        this.drawConnectors(ctx, offsetX, offsetY);
    }
    
    drawConnectors(ctx, offsetX = 0, offsetY = 0) {
        // Aplicar offset para movimentação do canvas
        const drawX = this.x + offsetX;
        const drawY = this.y + offsetY;
        
        // Conector de entrada
        ctx.fillStyle = '#2196F3';
        ctx.beginPath();
        ctx.arc(drawX, drawY + this.height / 2, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Conector de saída
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(drawX + this.width, drawY + this.height / 2, 6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let lineNumber = 0;
        
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, y + lineNumber * lineHeight);
                line = words[n] + ' ';
                lineNumber++;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y + lineNumber * lineHeight);
    }
    
    updatePosition(x, y) {
        this.x = x;
        this.y = y;
        // Não precisa atualizar conectores aqui pois serão calculados ao desenhar
    }
    
    isPointInside(x, y, offsetX = 0, offsetY = 0) {
        // Aplicar offset para movimentação do canvas
        const drawX = this.x + offsetX;
        const drawY = this.y + offsetY;
        
        return x >= drawX && x <= drawX + this.width && 
               y >= drawY && y <= drawY + this.height;
    }
    
    isPointOnInputConnector(x, y, offsetX = 0, offsetY = 0) {
        // Aplicar offset para movimentação do canvas
        const drawX = this.x + offsetX;
        const drawY = this.y + offsetY;
        
        const connectorX = drawX;
        const connectorY = drawY + this.height / 2;
        
        const dx = x - connectorX;
        const dy = y - connectorY;
        return Math.sqrt(dx * dx + dy * dy) <= 6;
    }
    
    isPointOnOutputConnector(x, y, offsetX = 0, offsetY = 0) {
        // Aplicar offset para movimentação do canvas
        const drawX = this.x + offsetX;
        const drawY = this.y + offsetY;
        
        const connectorX = drawX + this.width;
        const connectorY = drawY + this.height / 2;
        
        const dx = x - connectorX;
        const dy = y - connectorY;
        return Math.sqrt(dx * dx + dy * dy) <= 6;
    }
}

class Connection {
    constructor(startNode, endNode) {
        this.startNode = startNode;
        this.endNode = endNode;
    }
    
    draw(ctx, offsetX = 0, offsetY = 0) {
        // Aplicar offset para movimentação do canvas
        const startX = this.startNode.x + offsetX + this.startNode.width;
        const startY = this.startNode.y + offsetY + this.startNode.height / 2;
        const endX = this.endNode.x + offsetX;
        const endY = this.endNode.y + offsetY + this.endNode.height / 2;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class Canvas {
    constructor(name) {
        this.name = name;
        this.nodes = [];
        this.connections = [];
        this.nextNodeId = 1;
    }
    
    addNode(x, y, name, title, description) {
        const node = new Node(this.nextNodeId++, x, y, name, title, description);
        this.nodes.push(node);
        return node;
    }
    
    clear() {
        this.nodes = [];
        this.connections = [];
        this.nextNodeId = 1;
    }
}

class MultiCanvasEditor {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvases = {};
        this.currentCanvasName = null;
        this.selectedNode = null;
        this.draggingNode = null;
        this.connecting = false;
        this.connectionStartNode = null;
        this.mousePosition = { x: 0, y: 0 };
        
        // Propriedades para movimentação do canvas (panning)
        this.panning = false;
        this.panStart = { x: 0, y: 0 };
        this.offsetX = 0;
        this.offsetY = 0;
        this.currentOffsetX = 0;
        this.currentOffsetY = 0;
        
        // Propriedades de sincronização
        this.sessionId = 'sessao-padrao';
        this.syncEnabled = false;
        
        // Criar canvas padrão
        this.createCanvas('Principal');
        this.setCurrentCanvas('Principal');
        
        // Definir tamanho do canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Carregar dados salvos automaticamente
        this.loadFromLocalStorage();
        
        this.setupEventListeners();
        this.animate();
    }
    
    createCanvas(name) {
        if (!this.canvases[name]) {
            this.canvases[name] = new Canvas(name);
            this.updateCanvasSelector();
            return true;
        }
        return false;
    }
    
    setCurrentCanvas(name) {
        if (this.canvases[name]) {
            this.currentCanvasName = name;
            document.getElementById('canvasSelector').value = name;
            return true;
        }
        return false;
    }
    
    getCurrentCanvas() {
        return this.canvases[this.currentCanvasName] || null;
    }
    
    updateCanvasSelector() {
        const selector = document.getElementById('canvasSelector');
        selector.innerHTML = '';
        
        Object.keys(this.canvases).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            selector.appendChild(option);
        });
        
        if (this.currentCanvasName) {
            selector.value = this.currentCanvasName;
        }
    }
    
    resizeCanvas() {
        const container = document.querySelector('.container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }
    
    setupEventListeners() {
        // Botões da toolbar
        document.getElementById('addNodeBtn').addEventListener('click', () => {
            this.openNodeModal();
        });
        
        document.getElementById('addCanvasBtn').addEventListener('click', () => {
            this.openCanvasModal();
        });
        
        document.getElementById('clearCanvasBtn').addEventListener('click', () => {
            this.clearCurrentCanvas();
        });
        
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveToLocalStorage();
        });
        
        document.getElementById('syncBtn').addEventListener('click', () => {
            this.toggleSync();
        });
        
        document.getElementById('loadBtn').addEventListener('click', () => {
            this.loadFromLocalStorage();
        });
        
        // Selector de canvas
        document.getElementById('canvasSelector').addEventListener('change', (e) => {
            this.setCurrentCanvas(e.target.value);
        });
        
        // Campo de sessionId
        document.getElementById('sessionId').addEventListener('change', (e) => {
            this.sessionId = e.target.value || 'sessao-padrao';
        });
        
        // Modal de nó
        document.querySelector('#nodeModal .close').addEventListener('click', () => {
            this.closeNodeModal();
        });
        
        window.addEventListener('click', (event) => {
            const nodeModal = document.getElementById('nodeModal');
            const canvasModal = document.getElementById('canvasModal');
            
            if (event.target === nodeModal) {
                this.closeNodeModal();
            } else if (event.target === canvasModal) {
                this.closeCanvasModal();
            }
        });
        
        document.getElementById('nodeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createNodeFromForm();
        });
        
        // Modal de canvas
        document.querySelector('#canvasModal .close').addEventListener('click', () => {
            this.closeCanvasModal();
        });
        
        document.getElementById('canvasForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createCanvasFromForm();
        });
        
        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => {
            this.handleMouseDown(e);
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            this.handleMouseUp(e);
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.handleMouseLeave();
        });
        
        // Salvar automaticamente antes de fechar a página
        window.addEventListener('beforeunload', () => {
            this.saveToLocalStorage();
        });
    }
    
    toggleSync() {
        this.syncEnabled = !this.syncEnabled;
        const syncBtn = document.getElementById('syncBtn');
        
        if (this.syncEnabled) {
            syncBtn.textContent = 'Parar Sincronização';
            syncBtn.style.backgroundColor = '#ff9800';
            this.startSync();
        } else {
            syncBtn.textContent = 'Sincronizar';
            syncBtn.style.backgroundColor = '#4CAF50';
        }
    }
    
    startSync() {
        if (!this.syncEnabled) return;
        
        // Enviar dados atuais
        this.sendSyncData();
        
        // Verificar por atualizações a cada 5 segundos
        setTimeout(() => {
            if (this.syncEnabled) {
                this.checkForUpdates();
                this.startSync();
            }
        }, 5000);
    }
    
    sendSyncData() {
        // Em uma implementação real, aqui enviaria os dados para um servidor
        // Por enquanto, vamos simular usando sessionStorage compartilhado
        try {
            const data = {
                canvases: {},
                currentCanvasName: this.currentCanvasName,
                timestamp: Date.now()
            };
            
            Object.keys(this.canvases).forEach(name => {
                const canvas = this.canvases[name];
                data.canvases[name] = {
                    name: canvas.name,
                    nodes: canvas.nodes.map(node => ({
                        id: node.id,
                        x: node.x,
                        y: node.y,
                        name: node.name,
                        title: node.title,
                        description: node.description
                    })),
                    connections: canvas.connections.map(conn => ({
                        startNodeId: conn.startNode.id,
                        endNodeId: conn.endNode.id
                    })),
                    nextNodeId: canvas.nextNodeId
                };
            });
            
            // Salvar no sessionStorage com chave baseada no sessionId
            sessionStorage.setItem(`sync_${this.sessionId}`, JSON.stringify(data));
            console.log('Dados sincronizados para sessão:', this.sessionId);
        } catch (error) {
            console.error('Erro ao sincronizar dados:', error);
        }
    }
    
    checkForUpdates() {
        try {
            // Verificar se há dados mais recentes
            const syncData = sessionStorage.getItem(`sync_${this.sessionId}`);
            if (syncData) {
                const data = JSON.parse(syncData);
                const localData = sessionStorage.getItem(`local_${this.sessionId}`);
                
                if (localData) {
                    const local = JSON.parse(localData);
                    // Se os dados remotos são mais recentes, atualizar
                    if (data.timestamp > local.timestamp) {
                        this.loadSyncData(data);
                        console.log('Dados atualizados da sessão:', this.sessionId);
                    }
                } else {
                    // Primeira vez, carregar os dados
                    this.loadSyncData(data);
                }
            }
            
            // Salvar timestamp local
            sessionStorage.setItem(`local_${this.sessionId}`, JSON.stringify({
                timestamp: Date.now()
            }));
        } catch (error) {
            console.error('Erro ao verificar atualizações:', error);
        }
    }
    
    loadSyncData(data) {
        // Limpar canvases atuais
        this.canvases = {};
        
        // Criar canvases
        Object.keys(data.canvases).forEach(name => {
            const canvasData = data.canvases[name];
            this.canvases[name] = new Canvas(name);
            const canvas = this.canvases[name];
            
            // Restaurar propriedades
            canvas.nextNodeId = canvasData.nextNodeId || 1;
            
            // Criar nós
            const nodeMap = {};
            if (canvasData.nodes) {
                canvasData.nodes.forEach(nodeData => {
                    const node = canvas.addNode(
                        nodeData.x, 
                        nodeData.y, 
                        nodeData.name, 
                        nodeData.title, 
                        nodeData.description
                    );
                    node.id = nodeData.id;
                    nodeMap[node.id] = node;
                });
            }
            
            // Criar conexões
            if (canvasData.connections) {
                canvasData.connections.forEach(connData => {
                    const startNode = nodeMap[connData.startNodeId];
                    const endNode = nodeMap[connData.endNodeId];
                    
                    if (startNode && endNode) {
                        canvas.connections.push(new Connection(startNode, endNode));
                    }
                });
            }
        });
        
        // Definir canvas atual
        if (data.currentCanvasName && this.canvases[data.currentCanvasName]) {
            this.currentCanvasName = data.currentCanvasName;
        } else if (Object.keys(this.canvases).length > 0) {
            this.currentCanvasName = Object.keys(this.canvases)[0];
        }
        
        this.updateCanvasSelector();
    }
    
    openNodeModal() {
        document.getElementById('nodeModal').style.display = 'block';
        document.getElementById('nodeName').focus();
    }
    
    closeNodeModal() {
        document.getElementById('nodeModal').style.display = 'none';
        document.getElementById('nodeForm').reset();
    }
    
    openCanvasModal() {
        document.getElementById('canvasModal').style.display = 'block';
        document.getElementById('canvasName').focus();
    }
    
    closeCanvasModal() {
        document.getElementById('canvasModal').style.display = 'none';
        document.getElementById('canvasForm').reset();
    }
    
    createNodeFromForm() {
        const name = document.getElementById('nodeName').value;
        const title = document.getElementById('nodeTitle').value;
        const description = document.getElementById('nodeDescription').value;
        
        if (name && title && this.currentCanvasName) {
            const canvas = this.getCurrentCanvas();
            canvas.addNode(
                this.mousePosition.x - this.currentOffsetX - 100, 
                this.mousePosition.y - this.currentOffsetY - 60, 
                name, 
                title, 
                description
            );
            this.closeNodeModal();
            
            // Sincronizar se habilitado
            if (this.syncEnabled) {
                this.sendSyncData();
            }
        }
    }
    
    createCanvasFromForm() {
        const name = document.getElementById('canvasName').value;
        
        if (name) {
            if (this.createCanvas(name)) {
                this.setCurrentCanvas(name);
                
                // Sincronizar se habilitado
                if (this.syncEnabled) {
                    this.sendSyncData();
                }
            } else {
                alert('Já existe um canvas com esse nome!');
            }
            this.closeCanvasModal();
        }
    }
    
    clearCurrentCanvas() {
        if (this.currentCanvasName) {
            const canvas = this.getCurrentCanvas();
            canvas.clear();
            this.saveToLocalStorage();
            
            // Sincronizar se habilitado
            if (this.syncEnabled) {
                this.sendSyncData();
            }
        }
    }
    
    saveToLocalStorage() {
        const data = {
            canvases: {},
            currentCanvasName: this.currentCanvasName
        };
        
        Object.keys(this.canvases).forEach(name => {
            const canvas = this.canvases[name];
            data.canvases[name] = {
                name: canvas.name,
                nodes: canvas.nodes.map(node => ({
                    id: node.id,
                    x: node.x,
                    y: node.y,
                    name: node.name,
                    title: node.title,
                    description: node.description
                })),
                connections: canvas.connections.map(conn => ({
                    startNodeId: conn.startNode.id,
                    endNodeId: conn.endNode.id
                })),
                nextNodeId: canvas.nextNodeId
            };
        });
        
        localStorage.setItem('multiCanvasEditorData', JSON.stringify(data));
        
        // Também salvar para sincronização
        if (this.syncEnabled) {
            this.sendSyncData();
        }
    }
    
    loadFromLocalStorage() {
        const savedData = localStorage.getItem('multiCanvasEditorData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                
                // Limpar canvases atuais
                this.canvases = {};
                
                // Criar canvases
                Object.keys(data.canvases).forEach(name => {
                    const canvasData = data.canvases[name];
                    this.canvases[name] = new Canvas(name);
                    const canvas = this.canvases[name];
                    
                    // Restaurar propriedades
                    canvas.nextNodeId = canvasData.nextNodeId || 1;
                    
                    // Criar nós
                    const nodeMap = {};
                    if (canvasData.nodes) {
                        canvasData.nodes.forEach(nodeData => {
                            const node = canvas.addNode(
                                nodeData.x, 
                                nodeData.y, 
                                nodeData.name, 
                                nodeData.title, 
                                nodeData.description
                            );
                            node.id = nodeData.id;
                            nodeMap[node.id] = node;
                        });
                    }
                    
                    // Criar conexões
                    if (canvasData.connections) {
                        canvasData.connections.forEach(connData => {
                            const startNode = nodeMap[connData.startNodeId];
                            const endNode = nodeMap[connData.endNodeId];
                            
                            if (startNode && endNode) {
                                canvas.connections.push(new Connection(startNode, endNode));
                            }
                        });
                    }
                });
                
                // Definir canvas atual
                if (data.currentCanvasName && this.canvases[data.currentCanvasName]) {
                    this.currentCanvasName = data.currentCanvasName;
                } else if (Object.keys(this.canvases).length > 0) {
                    this.currentCanvasName = Object.keys(this.canvases)[0];
                }
                
                this.updateCanvasSelector();
            } catch (error) {
                console.error('Erro ao carregar dados salvos:', error);
            }
        }
    }
    
    isPointOnAnyNode(x, y) {
        const canvas = this.getCurrentCanvas();
        if (!canvas) return false;
        
        // Verificar se o ponto está sobre algum nó
        for (const node of canvas.nodes) {
            if (node.isPointInside(x, y, this.currentOffsetX, this.currentOffsetY)) {
                return true;
            }
            
            // Verificar se o ponto está sobre algum conector
            if (node.isPointOnInputConnector(x, y, this.currentOffsetX, this.currentOffsetY) ||
                node.isPointOnOutputConnector(x, y, this.currentOffsetX, this.currentOffsetY)) {
                return true;
            }
        }
        
        return false;
    }
    
    handleMouseDown(e) {
        if (!this.currentCanvasName) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.mousePosition = { x, y };
        
        const canvas = this.getCurrentCanvas();
        if (!canvas) return;
        
        // Verificar se clicou em uma área vazia (sem nós ou conectores)
        if (e.button === 0 && !this.isPointOnAnyNode(x, y)) {
            // Ativar panning
            this.panning = true;
            this.panStart = { x: x - this.currentOffsetX, y: y - this.currentOffsetY };
            this.canvas.style.cursor = 'grabbing';
            return;
        }
        
        // Verificar se clicou em um nó
        for (let i = canvas.nodes.length - 1; i >= 0; i--) {
            const node = canvas.nodes[i];
            
            // Verificar se clicou no conector de saída
            if (node.isPointOnOutputConnector(x, y, this.currentOffsetX, this.currentOffsetY)) {
                this.connecting = true;
                this.connectionStartNode = node;
                return;
            }
            
            // Verificar se clicou no conector de entrada
            if (node.isPointOnInputConnector(x, y, this.currentOffsetX, this.currentOffsetY)) {
                // Não remover conexões existentes - permitir múltiplas conexões para o mesmo nó
                return;
            }
            
            // Verificar se clicou dentro do nó
            if (node.isPointInside(x, y, this.currentOffsetX, this.currentOffsetY)) {
                // Selecionar o nó
                this.deselectAllNodes();
                node.selected = true;
                this.selectedNode = node;
                this.draggingNode = node;
                
                // Trazer o nó para frente
                canvas.nodes.splice(i, 1);
                canvas.nodes.push(node);
                return;
            }
        }
        
        // Se não clicou em nenhum nó, deselecionar todos
        this.deselectAllNodes();
    }
    
    handleMouseMove(e) {
        if (!this.currentCanvasName) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.mousePosition = { x, y };
        
        // Movimentação do canvas (panning)
        if (this.panning) {
            this.offsetX = x - this.panStart.x;
            this.offsetY = y - this.panStart.y;
            return;
        }
        
        // Arrastar nó
        if (this.draggingNode) {
            this.draggingNode.updatePosition(
                x - this.currentOffsetX - this.draggingNode.width / 2, 
                y - this.currentOffsetY - this.draggingNode.height / 2
            );
        }
    }
    
    handleMouseUp(e) {
        if (!this.currentCanvasName) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Finalizar panning
        if (this.panning) {
            this.panning = false;
            this.canvas.style.cursor = 'default';
            this.currentOffsetX = this.offsetX;
            this.currentOffsetY = this.offsetY;
            
            // Sincronizar se habilitado
            if (this.syncEnabled) {
                this.sendSyncData();
            }
        }
        
        const canvas = this.getCurrentCanvas();
        if (!canvas) return;
        
        // Finalizar conexão
        if (this.connecting && this.connectionStartNode) {
            // Verificar se soltou sobre um nó de entrada
            for (const node of canvas.nodes) {
                if (node.isPointOnInputConnector(x, y, this.currentOffsetX, this.currentOffsetY) && 
                    node !== this.connectionStartNode) {
                    // Adicionar nova conexão (permite múltiplas conexões)
                    canvas.connections.push(new Connection(this.connectionStartNode, node));
                    
                    // Sincronizar se habilitado
                    if (this.syncEnabled) {
                        this.sendSyncData();
                    }
                    break;
                }
            }
        }
        
        this.draggingNode = null;
        this.connecting = false;
        this.connectionStartNode = null;
    }
    
    handleMouseLeave() {
        this.draggingNode = null;
        this.connecting = false;
        this.connectionStartNode = null;
        
        // Finalizar panning se o mouse sair
        if (this.panning) {
            this.panning = false;
            this.canvas.style.cursor = 'default';
            this.currentOffsetX = this.offsetX;
            this.currentOffsetY = this.offsetY;
        }
    }
    
    deselectAllNodes() {
        const canvas = this.getCurrentCanvas();
        if (canvas) {
            canvas.nodes.forEach(node => node.selected = false);
        }
        this.selectedNode = null;
    }
    
    drawConnections() {
        const canvas = this.getCurrentCanvas();
        if (!canvas) return;
        
        canvas.connections.forEach(connection => {
            connection.draw(this.ctx, this.offsetX, this.offsetY);
        });
        
        // Desenhar conexão temporária durante a conexão
        if (this.connecting && this.connectionStartNode) {
            const startX = this.connectionStartNode.x + this.offsetX + this.connectionStartNode.width;
            const startY = this.connectionStartNode.y + this.offsetY + this.connectionStartNode.height / 2;
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(this.mousePosition.x, this.mousePosition.y);
            this.ctx.strokeStyle = '#4CAF50';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }
    
    drawNodes() {
        const canvas = this.getCurrentCanvas();
        if (!canvas) return;
        
        canvas.nodes.forEach(node => {
            node.draw(this.ctx, this.offsetX, this.offsetY);
        });
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenhar grid de fundo com offset
        this.drawGrid();
        
        // Desenhar conexões
        this.drawConnections();
        
        // Desenhar nós
        this.drawNodes();
        
        requestAnimationFrame(() => this.animate());
    }
    
    drawGrid() {
        const gridSize = 20;
        
        this.ctx.strokeStyle = '#3a3a3a';
        this.ctx.lineWidth = 1;
        
        // Linhas verticais
        for (let x = (this.offsetX % gridSize); x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Linhas horizontais
        for (let y = (this.offsetY % gridSize); y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
}

// Inicializar o editor quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    const editor = new MultiCanvasEditor();
});