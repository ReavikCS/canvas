class Node {
    constructor(id, x, y, name, title, description, width = 220, height = 140) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.name = name;
        this.title = title;
        this.description = description;
        this.width = width;
        this.height = height;
        this.inputConnector = { x: this.x, y: this.y + this.height / 2 };
        this.outputConnector = { x: this.x + this.width, y: this.y + this.height / 2 };
        this.selected = false;
        this.isEditing = false;
        this.searchHighlight = false; // Para destaque de pesquisa
        this.resizeHandle = { x: this.x + this.width, y: this.y + this.height, size: 10 };
    }

    // Método para converter códigos de cor do Minecraft (&) em estilos CSS
    parseMinecraftColors(text) {
        // Mapeamento de códigos de cor do Minecraft para cores hexadecimais
        const colorMap = {
            '0': '#000000', // Preto
            '1': '#0000AA', // Azul escuro
            '2': '#00AA00', // Verde
            '3': '#00AAAA', // Ciano escuro
            '4': '#AA0000', // Vermelho escuro
            '5': '#AA00AA', // Roxo
            '6': '#FFAA00', // Ouro
            '7': '#AAAAAA', // Cinza
            '8': '#555555', // Cinza escuro
            '9': '#5555FF', // Azul
            'a': '#55FF55', // Verde lima
            'b': '#55FFFF', // Ciano
            'c': '#FF5555', // Vermelho
            'd': '#FF55FF', // Rosa
            'e': '#FFFF55', // Amarelo
            'f': '#FFFFFF'  // Branco
        };
        
        // Expressão regular para encontrar códigos de cor
        const colorRegex = /&([0-9a-f])/gi;
        
        // Dividir o texto em partes com base nos códigos de cor
        const parts = [];
        let lastIndex = 0;
        let currentColor = '#FFFFFF'; // Cor padrão (branco)
        
        text.replace(colorRegex, (match, code, index) => {
            // Adicionar o texto antes deste código de cor
            if (index > lastIndex) {
                parts.push({
                    text: text.substring(lastIndex, index),
                    color: currentColor
                });
            }
            
            // Atualizar a cor atual
            currentColor = colorMap[code.toLowerCase()] || currentColor;
            lastIndex = index + 2; // +2 para pular o "&" e o código
        });
        
        // Adicionar o texto restante
        if (lastIndex < text.length) {
            parts.push({
                text: text.substring(lastIndex),
                color: currentColor
            });
        }
        
        // Se não houve códigos de cor, retornar o texto inteiro com a cor padrão
        if (parts.length === 0) {
            parts.push({
                text: text,
                color: currentColor
            });
        }
        
        return parts;
    }

    // Método para desenhar texto com cores do Minecraft
    drawColoredText(ctx, text, x, y, maxWidth) {
        const coloredParts = this.parseMinecraftColors(text);
        let currentX = x;
        
        ctx.font = '15px Segoe UI';
        
        for (const part of coloredParts) {
            ctx.fillStyle = part.color;
            
            // Medir o texto para verificar se cabe na largura máxima
            const metrics = ctx.measureText(part.text);
            
            // Se couber completamente, desenhar o texto
            if (currentX + metrics.width <= x + maxWidth) {
                ctx.fillText(part.text, currentX, y);
                currentX += metrics.width;
            } else {
                // Truncar o texto se não couber
                let truncatedText = part.text;
                while (truncatedText.length > 0 && currentX + ctx.measureText(truncatedText + '...').width > x + maxWidth) {
                    truncatedText = truncatedText.slice(0, -1);
                }
                
                if (truncatedText.length > 0) {
                    ctx.fillText(truncatedText + '...', currentX, y);
                }
                break;
            }
        }
    }

    draw(ctx, offsetX = 0, offsetY = 0) {
        // Não desenhar nós ocultos
        if (this.hidden) return;
        
        // Aplicar offset para movimentação do canvas
        const drawX = this.x + offsetX;
        const drawY = this.y + offsetY;
        
        // Atualizar posição do manipulador de redimensionamento
        this.resizeHandle = { x: drawX + this.width, y: drawY + this.height, size: 10 };
        
        // Salvar contexto
        ctx.save();
        
        // Criar caminho arredondado para o nó
        const radius = 12;
        ctx.beginPath();
        ctx.moveTo(drawX + radius, drawY);
        ctx.lineTo(drawX + this.width - radius, drawY);
        ctx.quadraticCurveTo(drawX + this.width, drawY, drawX + this.width, drawY + radius);
        ctx.lineTo(drawX + this.width, drawY + this.height - radius);
        ctx.quadraticCurveTo(drawX + this.width, drawY + this.height, drawX + this.width - radius, drawY + this.height);
        ctx.lineTo(drawX + radius, drawY + this.height);
        ctx.quadraticCurveTo(drawX, drawY + this.height, drawX, drawY + this.height - radius);
        ctx.lineTo(drawX, drawY + radius);
        ctx.quadraticCurveTo(drawX, drawY, drawX + radius, drawY);
        ctx.closePath();
        
        // Gradiente para o fundo do nó
        const gradient = ctx.createLinearGradient(drawX, drawY, drawX, drawY + this.height);
        if (this.selected) {
            gradient.addColorStop(0, '#3a3a5a');
            gradient.addColorStop(1, '#2a2a4a');
        } else {
            gradient.addColorStop(0, '#2d2d4d');
            gradient.addColorStop(1, '#252540');
        }
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Borda do nó
        let borderColor = this.selected ? '#4CAF50' : 'rgba(255, 255, 255, 0.1)';
        let borderWidth = this.selected ? 3 : 2;
        
        // Se o nó está destacado na pesquisa, usar borda vermelha piscante
        if (this.searchHighlight) {
            // Calcular valor de pulsação baseado no tempo
            const pulse = Math.sin(Date.now() / 200) * 0.5 + 0.5;
            const redValue = Math.floor(200 + 55 * pulse);
            borderColor = `rgb(${redValue}, 50, 50)`;
            borderWidth = 3;
        }
        
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.stroke();
        
        // Sombra quando selecionado
        if (this.selected) {
            ctx.shadowColor = 'rgba(76, 175, 80, 0.5)';
            ctx.shadowBlur = 15;
            ctx.stroke();
            ctx.shadowBlur = 0;
        } else if (this.searchHighlight) {
            // Sombra para nós destacados na pesquisa
            ctx.shadowColor = 'rgba(255, 50, 50, 0.5)';
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        
        // Divisor entre header e conteúdo
        ctx.beginPath();
        ctx.moveTo(drawX + 15, drawY + 35);
        ctx.lineTo(drawX + this.width - 15, drawY + 35);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Ícones decorativos no canto superior direito
        ctx.beginPath();
        ctx.arc(drawX + this.width - 20, drawY + 20, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#4CAF50';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(drawX + this.width - 30, drawY + 20, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#2196F3';
        ctx.fill();
        
        // Botão de edição no topo do nó (próximo às bolinhas)
        // Fundo do botão
        ctx.beginPath();
        ctx.arc(drawX + this.width - 55, drawY + 20, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#FF9800';
        ctx.fill();
        
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(drawX + this.width - 55, drawY + 20, 8, 0, Math.PI * 2);
        ctx.stroke();
        
        // Ícone de lápis no botão de edição
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(drawX + this.width - 58, drawY + 17);
        ctx.lineTo(drawX + this.width - 52, drawY + 23);
        ctx.moveTo(drawX + this.width - 58, drawY + 23);
        ctx.lineTo(drawX + this.width - 52, drawY + 17);
        ctx.stroke();
        
        // Texto "Editar" próximo ao botão
        ctx.fillStyle = '#FF9800';
        ctx.font = 'bold 12px Segoe UI';
        ctx.fillText('Editar', drawX + this.width - 100, drawY + 24);
        
        // Nome do nó (header) com suporte a cores do Minecraft
        const coloredNameParts = this.parseMinecraftColors(this.name);
        let nameX = drawX + 15;
        ctx.font = 'bold 16px Segoe UI';
        
        for (const part of coloredNameParts) {
            ctx.fillStyle = part.color;
            ctx.fillText(part.text, nameX, drawY + 25);
            nameX += ctx.measureText(part.text).width;
        }
        
        // Título do nó com suporte a cores do Minecraft
        const coloredTitleParts = this.parseMinecraftColors(this.title);
        let titleX = drawX + 15;
        ctx.font = '15px Segoe UI';
        
        for (const part of coloredTitleParts) {
            ctx.fillStyle = part.color;
            ctx.fillText(part.text, titleX, drawY + 55);
            titleX += ctx.measureText(part.text).width;
        }
        
        // Descrição do nó com suporte a cores do Minecraft e quebra de linha correta
        ctx.font = '13px Segoe UI';
        const maxWidth = this.width - 30;
        const lineHeight = 16;
        
        // Processar a descrição com quebra de linha e cores
        this.drawColoredWrappedText(ctx, this.description, drawX + 15, drawY + 75, maxWidth, lineHeight);
        
        // Conectores
        this.drawConnectors(ctx, offsetX, offsetY);
        
        // Manipulador de redimensionamento (apenas quando selecionado)
        if (this.selected) {
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(
                this.resizeHandle.x - this.resizeHandle.size / 2,
                this.resizeHandle.y - this.resizeHandle.size / 2,
                this.resizeHandle.size,
                this.resizeHandle.size
            );
            
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.strokeRect(
                this.resizeHandle.x - this.resizeHandle.size / 2,
                this.resizeHandle.y - this.resizeHandle.size / 2,
                this.resizeHandle.size,
                this.resizeHandle.size
            );
        }
        
        // Restaurar contexto
        ctx.restore();
    }
    
    // Método para desenhar texto com cores do Minecraft e quebra de linha
    drawColoredWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
        const paragraphs = text.split('\n');
        let currentY = y;
        
        for (let p = 0; p < paragraphs.length; p++) {
            const paragraph = paragraphs[p];
            const coloredParts = this.parseMinecraftColors(paragraph);
            let line = '';
            let lineParts = [];
            let currentX = x;
            
            // Processar cada parte com cor
            for (const part of coloredParts) {
                const words = part.text.split(' ');
                
                for (let i = 0; i < words.length; i++) {
                    const testLine = line + (line ? ' ' : '') + words[i];
                    ctx.fillStyle = part.color;
                    const metrics = ctx.measureText(testLine);
                    
                    // Se a linha exceder a largura máxima, desenhar a linha atual
                    if (metrics.width > maxWidth && line !== '') {
                        // Desenhar a linha acumulada
                        let lineX = currentX;
                        for (const linePart of lineParts) {
                            ctx.fillStyle = linePart.color;
                            ctx.fillText(linePart.text, lineX, currentY);
                            lineX += ctx.measureText(linePart.text).width;
                        }
                        
                        // Começar uma nova linha
                        currentY += lineHeight;
                        line = words[i];
                        lineParts = [{ text: words[i], color: part.color }];
                        currentX = x;
                    } else {
                        line = testLine;
                        // Adicionar ou atualizar a parte da linha
                        if (lineParts.length > 0 && lineParts[lineParts.length - 1].color === part.color) {
                            // Mesclar com a parte anterior se tiver a mesma cor
                            lineParts[lineParts.length - 1].text += (lineParts[lineParts.length - 1].text ? ' ' : '') + words[i];
                        } else {
                            lineParts.push({ text: words[i], color: part.color });
                        }
                    }
                }
            }
            
            // Desenhar a última linha do parágrafo
            let lineX = currentX;
            for (const linePart of lineParts) {
                ctx.fillStyle = linePart.color;
                ctx.fillText(linePart.text, lineX, currentY);
                lineX += ctx.measureText(linePart.text).width;
            }
            
            // Avançar para a próxima linha após o parágrafo
            currentY += lineHeight;
        }
    }

    drawConnectors(ctx, offsetX = 0, offsetY = 0) {
        // Aplicar offset para movimentação do canvas
        const drawX = this.x + offsetX;
        const drawY = this.y + offsetY;
        
        // Conector de entrada (azul)
        const inputGradient = ctx.createRadialGradient(
            drawX, drawY + this.height / 2, 2,
            drawX, drawY + this.height / 2, 8
        );
        inputGradient.addColorStop(0, '#64B5F6');
        inputGradient.addColorStop(1, '#1976D2');
        
        ctx.fillStyle = inputGradient;
        ctx.beginPath();
        ctx.arc(drawX, drawY + this.height / 2, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Conector de saída (verde)
        const outputGradient = ctx.createRadialGradient(
            drawX + this.width, drawY + this.height / 2, 2,
            drawX + this.width, drawY + this.height / 2, 8
        );
        outputGradient.addColorStop(0, '#81C784');
        outputGradient.addColorStop(1, '#388E3C');
        
        ctx.fillStyle = outputGradient;
        ctx.beginPath();
        ctx.arc(drawX + this.width, drawY + this.height / 2, 8, 0, Math.PI * 2);
        ctx.fill();
    }
    
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        // Substituir \n por quebras reais e dividir o texto
        const paragraphs = text.split('\n');
        let currentY = y;
        
        for (let p = 0; p < paragraphs.length; p++) {
            const paragraph = paragraphs[p];
            const words = paragraph.split(' ');
            let line = '';
            
            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                const testWidth = metrics.width;
                
                if (testWidth > maxWidth && n > 0) {
                    ctx.fillText(line, x, currentY);
                    line = words[n] + ' ';
                    currentY += lineHeight;
                } else {
                    line = testLine;
                }
            }
            
            // Desenhar a última linha do parágrafo
            ctx.fillText(line, x, currentY);
            currentY += lineHeight;
        }
    }
    
    updatePosition(x, y) {
        this.x = x;
        this.y = y;
        // Não precisa atualizar conectores aqui pois serão calculados ao desenhar
    }
    
    resize(width, height) {
        // Limitar tamanho mínimo
        this.width = Math.max(150, width);
        this.height = Math.max(100, height);
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
        return Math.sqrt(dx * dx + dy * dy) <= 8;
    }
    
    isPointOnOutputConnector(x, y, offsetX = 0, offsetY = 0) {
        // Aplicar offset para movimentação do canvas
        const drawX = this.x + offsetX;
        const drawY = this.y + offsetY;
        
        const connectorX = drawX + this.width;
        const connectorY = drawY + this.height / 2;
        
        const dx = x - connectorX;
        const dy = y - connectorY;
        return Math.sqrt(dx * dx + dy * dy) <= 8;
    }
    
    isPointOnResizeHandle(x, y, offsetX = 0, offsetY = 0) {
        // Aplicar offset para movimentação do canvas
        const drawX = this.x + offsetX;
        const drawY = this.y + offsetY;
        
        const handleX = drawX + this.width;
        const handleY = drawY + this.height;
        
        return x >= handleX - this.resizeHandle.size / 2 && 
               x <= handleX + this.resizeHandle.size / 2 &&
               y >= handleY - this.resizeHandle.size / 2 && 
               y <= handleY + this.resizeHandle.size / 2;
    }
    
    // Método para verificar se o ponto está sobre o botão de edição (incluindo área do texto)
    isPointOnEditButton(x, y, offsetX = 0, offsetY = 0) {
        // Aplicar offset para movimentação do canvas
        const drawX = this.x + offsetX;
        const drawY = this.y + offsetY;
        
        // Área clicável para o botão de edição (inclui o texto "Editar")
        const buttonAreaX = drawX + this.width - 95;
        const buttonAreaY = drawY + 10;
        
        return x >= buttonAreaX && x <= drawX + this.width - 45 && 
               y >= buttonAreaY && y <= buttonAreaY + 20;
    }

    clone() {
        return new Node(
            this.id,
            this.x,
            this.y,
            this.name,
            this.title,
            this.description
        );
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
        
        // Salvar contexto
        ctx.save();
        
        // Desenhar linha com gradiente
        const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
        gradient.addColorStop(0, '#81C784');
        gradient.addColorStop(1, '#64B5F6');
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Desenhar ponta de seta
        const angle = Math.atan2(endY - startY, endX - startX);
        const arrowSize = 8;
        
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowSize * Math.cos(angle - Math.PI / 6),
            endY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            endX - arrowSize * Math.cos(angle + Math.PI / 6),
            endY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = '#64B5F6';
        ctx.fill();
        
        // Restaurar contexto
        ctx.restore();
    }
    
    clone(startNode, endNode) {
        return new Connection(startNode, endNode);
    }
}

class Canvas {
    constructor(name) {
        this.name = name;
        this.nodes = [];
        this.connections = [];
        this.nextNodeId = 1;
    }
    
    addNode(x, y, name, title, description, width = 220, height = 140) {
        const node = new Node(this.nextNodeId++, x, y, name, title, description, width, height);
        this.nodes.push(node);
        return node;
    }
    
    clear() {
        this.nodes = [];
        this.connections = [];
        this.nextNodeId = 1;
    }
    
    getSelectedNodes() {
        return this.nodes.filter(node => node.selected && !node.hidden);
    }
    
    deselectAll() {
        this.nodes.forEach(node => node.selected = false);
        // Limpar campo de pesquisa e destaque
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
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
        
        // Propriedades para zoom
        this.zoom = 1.0;
        this.minZoom = 0.1;
        this.maxZoom = 3.0;
        
        // Propriedades para controle de teclas
        this.shiftPressed = false;
        
        // Propriedades de seleção e clipboard
        this.clipboard = {
            nodes: [],
            connections: []
        };
        this.selectionStart = null;
        this.selectionEnd = null;
        this.isSelecting = false;
        
        // Propriedades de edição
        this.resizingNode = null;
        this.resizeStart = { x: 0, y: 0 };
        this.originalSize = { width: 0, height: 0 };
        
        // Propriedade para controlar quando um modal está aberto
        this.modalOpen = false;
        
        // Propriedades para movimentação de múltiplos nós
        this.multipleNodeDrag = false;
        this.initialNodePositions = []; // Armazena posições iniciais dos nós selecionados
        
        // Propriedades para menu de contexto
        this.contextMenu = null;
        this.contextMenuPosition = { x: 0, y: 0 };
        
        // Propriedades para histórico de ações (Undo/Redo)
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50; // Limite máximo de ações no histórico
        
        // Propriedades para modo de apresentação
        this.presentationMode = false;
        
        // Criar canvas padrão
        this.createCanvas('Principal');
        this.setCurrentCanvas('Principal');
        
        // Definir tamanho do canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Carregar dados salvos automaticamente
        this.loadFromLocalStorage();
        
        // Inicializar histórico
        this.saveState();
        
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
        // Botões da toolbar (sem o botão de adicionar objeto)
        document.getElementById('addCanvasBtn').addEventListener('click', () => {
            this.openCanvasModal();
        });
        
        document.getElementById('saveFileBtn').addEventListener('click', () => {
            this.saveToFile();
        });
        
        // Botão de carregar arquivo
        document.getElementById('loadFileBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        
        // Input file para carregar arquivo
        document.getElementById('fileInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadFromFile(file);
            }
            // Limpar o input para permitir carregar o mesmo arquivo novamente
            e.target.value = '';
        });
        
        // Selector de canvas
        document.getElementById('canvasSelector').addEventListener('change', (e) => {
            this.setCurrentCanvas(e.target.value);
        });
        
        // Campo de pesquisa
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterNodes(e.target.value);
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
        
        // Evento de clique com botão direito do mouse no canvas
        this.canvas.addEventListener('contextmenu', (e) => {
            this.handleContextMenu(e);
        });
        
        // Evento de rolagem do mouse para zoom
        this.canvas.addEventListener('wheel', (e) => {
            this.handleWheel(e);
        });
        
        // Fechar menu de contexto ao clicar fora dele
        document.addEventListener('click', (e) => {
            this.hideContextMenu();
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') {
                this.shiftPressed = false;
            }
        });
        
        // Storage event listener para detecção de mudanças externas
        window.addEventListener('storage', (e) => {
            this.loadFromLocalStorage();
        });
        
        // Salvar automaticamente antes de fechar a página
        window.addEventListener('beforeunload', () => {
            this.saveToLocalStorage();
        });
        
        // Controle de teclas pressionadas
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Shift') {
                this.shiftPressed = true;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') {
                this.shiftPressed = false;
            }
        });
        
        // Tutorial drawer events
        document.getElementById('tutorialTab').addEventListener('click', () => {
            this.toggleTutorial();
        });
        
        document.getElementById('closeTutorial').addEventListener('click', () => {
            this.closeTutorial();
        });
        
        // Inicializar conteúdo do tutorial
        this.initTutorialContent();
    }
    
    handleKeyDown(e) {
        // Se um modal está aberto, não processar atalhos do editor
        if (this.modalOpen) {
            return;
        }
        
        // Atualizar estado da tecla Shift
        if (e.key === 'Shift') {
            this.shiftPressed = true;
        }
        
        // Copiar (Ctrl+C)
        if (e.ctrlKey && e.key === 'c') {
            e.preventDefault();
            this.copySelectedNodes();
        }
        
        // Colar (Ctrl+V)
        if (e.ctrlKey && e.key === 'v') {
            e.preventDefault();
            this.pasteNodes();
        }
        
        // Selecionar tudo (Ctrl+A)
        if (e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            this.selectAllNodes();
        }
        
        // Deletar (Delete)
        if (e.key === 'Delete') {
            e.preventDefault();
            this.deleteSelectedNodes();
        }
        
        // Editar texto do nó selecionado (F2)
        if (e.key === 'F2') {
            e.preventDefault();
            const canvas = this.getCurrentCanvas();
            if (canvas) {
                const selectedNodes = canvas.getSelectedNodes();
                if (selectedNodes.length === 1) {
                    this.editSelectedNodeText(selectedNodes[0]);
                }
            }
        }
        
        // Undo (Ctrl+Z)
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            this.undo();
        }
        
        // Redo (Ctrl+Y)
        if (e.ctrlKey && e.key === 'y') {
            e.preventDefault();
            this.redo();
        }
        
        // Pesquisa (Ctrl+F)
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            searchInput.focus();
            searchInput.select();
        }
        
        // Modo de apresentação (F11)
        if (e.key === 'F11') {
            // Prevenir o comportamento padrão do F11 para controlar totalmente o modo de apresentação
            e.preventDefault();
            this.togglePresentationMode();
        }
        
        // Sair do modo de apresentação (ESC)
        if (e.key === 'Escape' && this.presentationMode) {
            e.preventDefault();
            this.togglePresentationMode();
        }
    }

    editSelectedNodeText(node) {
        // Marcar que um modal está aberto
        this.modalOpen = true;
        
        // Criar modal de edição de texto
        const modal = document.createElement('div');
        modal.id = 'editTextModal';
        modal.className = 'modal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Editar Texto do Nó</h2>
                <form id="editNodeForm">
                    <label for="editNodeName">Nome:</label>
                    <input type="text" id="editNodeName" value="${node.name}" required>
                    
                    <label for="editNodeTitle">Título:</label>
                    <input type="text" id="editNodeTitle" value="${node.title}" required>
                    
                    <label for="editNodeDescription">Descrição:</label>
                    <textarea id="editNodeDescription" rows="4">${node.description}</textarea>
                    
                    <button type="submit">Salvar</button>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Adicionar eventos
        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
            this.modalOpen = false;
        });
        
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                document.body.removeChild(modal);
                this.modalOpen = false;
            }
        });
        
        const form = document.getElementById('editNodeForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            // Salvar estado no histórico antes de editar
            this.saveState();
            
            node.name = document.getElementById('editNodeName').value;
            node.title = document.getElementById('editNodeTitle').value;
            node.description = document.getElementById('editNodeDescription').value;
            document.body.removeChild(modal);
            this.modalOpen = false;
            
            // Salvar automaticamente
            this.saveToLocalStorage();
        });
        
        // Focar no primeiro campo
        document.getElementById('editNodeName').focus();
    }
    
    selectAllNodes() {
        const canvas = this.getCurrentCanvas();
        if (canvas) {
            canvas.nodes.forEach(node => node.selected = true);
        }
    }
    
    deleteSelectedNodes() {
        const canvas = this.getCurrentCanvas();
        if (!canvas) return;
        
        // Obter nós selecionados
        const selectedNodes = canvas.getSelectedNodes();
        if (selectedNodes.length === 0) return;
        
        // Salvar estado no histórico antes de deletar
        this.saveState();
        
        // Remover conexões relacionadas aos nós selecionados
        canvas.connections = canvas.connections.filter(conn => 
            !selectedNodes.includes(conn.startNode) && 
            !selectedNodes.includes(conn.endNode)
        );
        
        // Remover nós selecionados
        canvas.nodes = canvas.nodes.filter(node => !node.selected);
        
        // Salvar automaticamente
        this.saveToLocalStorage();
    }
    
    copySelectedNodes() {
        const canvas = this.getCurrentCanvas();
        if (!canvas) return;
        
        const selectedNodes = canvas.getSelectedNodes();
        if (selectedNodes.length === 0) return;
        
        // Criar mapa de nós selecionados para manter referências
        const nodeMap = {};
        const newNodeList = [];
        
        // Copiar nós selecionados
        selectedNodes.forEach(node => {
            const newNode = {
                id: node.id,
                x: node.x,
                y: node.y,
                name: node.name,
                title: node.title,
                description: node.description,
                width: node.width,
                height: node.height
            };
            nodeMap[node.id] = newNode;
            newNodeList.push(newNode);
        });
        
        // Copiar conexões entre nós selecionados
        const newConnectionList = [];
        canvas.connections.forEach(conn => {
            // Verificar se ambos os nós da conexão estão selecionados
            if (selectedNodes.includes(conn.startNode) && selectedNodes.includes(conn.endNode)) {
                newConnectionList.push({
                    startNodeId: conn.startNode.id,
                    endNodeId: conn.endNode.id
                });
            }
        });
        
        // Armazenar no clipboard
        this.clipboard = {
            nodes: newNodeList,
            connections: newConnectionList
        };
        
        console.log(`${newNodeList.length} nós e ${newConnectionList.length} conexões copiados para o clipboard`);
    }
    
    pasteNodes() {
        const canvas = this.getCurrentCanvas();
        if (!canvas || this.clipboard.nodes.length === 0) return;
        
        // Salvar estado no histórico antes de colar
        this.saveState();
        
        // Desselecionar todos os nós
        canvas.deselectAll();
        this.filterNodes('');
        
        // Calcular centro do clipboard
        let minX = Infinity, minY = Infinity;
        this.clipboard.nodes.forEach(node => {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
        });
        
        // Mapa para mapear IDs antigos para novos nós
        const oldToNewNodeMap = {};
        const newNodes = [];
        
        // Colar nós com offset do mouse
        const offsetX = this.mousePosition.x - this.currentOffsetX - minX;
        const offsetY = this.mousePosition.y - this.currentOffsetY - minY;
        
        this.clipboard.nodes.forEach(nodeData => {
            const newNode = canvas.addNode(
                nodeData.x + offsetX,
                nodeData.y + offsetY,
                nodeData.name,
                nodeData.title,
                nodeData.description,
                nodeData.width,
                nodeData.height
            );
            newNode.selected = true;
            oldToNewNodeMap[nodeData.id] = newNode;
            newNodes.push(newNode);
        });
        
        // Recriar conexões entre os nós colados
        this.clipboard.connections.forEach(connData => {
            const startNode = oldToNewNodeMap[connData.startNodeId];
            const endNode = oldToNewNodeMap[connData.endNodeId];
            
            if (startNode && endNode) {
                canvas.connections.push(new Connection(startNode, endNode));
            }
        });
        
        // Salvar automaticamente
        this.saveToLocalStorage();
        
        console.log(`${newNodes.length} nós e ${this.clipboard.connections.length} conexões colados`);
    }
    
    saveToFile() {
        try {
            const data = {
                canvases: {},
                currentCanvasName: this.currentCanvasName,
                version: '1.0',
                createdAt: new Date().toISOString()
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
                        description: node.description,
                        width: node.width,    // Adicionando largura
                        height: node.height   // Adicionando altura
                    })),
                    connections: canvas.connections.map(conn => ({
                        startNodeId: conn.startNode.id,
                        endNodeId: conn.endNode.id
                    })),
                    nextNodeId: canvas.nextNodeId
                };
            });
            
            const jsonData = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `visualflow-diagram-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
            document.body.appendChild(a);
            a.click();
            
            // Limpar após um curto período
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            console.log('Arquivo salvo com sucesso');
        } catch (error) {
            console.error('Erro ao salvar arquivo:', error);
            alert('Erro ao salvar arquivo: ' + error.message);
        }
    }
    
    // Método para carregar dados de um arquivo
    loadFromFile(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                // Limpar canvases atuais
                this.canvases = {};
                
                // Criar canvases
                Object.keys(data.canvases).forEach(name => {
                    const canvasData = data.canvases[name];
                    this.canvases[name] = new Canvas(name);
                    const canvas = this.canvases[name];
                    
                    // Restaurar propriedades
                    canvas.nextNodeId = canvasData.nextNodeId || 1;
                    
                    // Criar nós com tamanho personalizado
                    const nodeMap = {};
                    if (canvasData.nodes) {
                        canvasData.nodes.forEach(nodeData => {
                            // Passar largura e altura ao criar o nó
                            const node = canvas.addNode(
                                nodeData.x, 
                                nodeData.y, 
                                nodeData.name, 
                                nodeData.title, 
                                nodeData.description,
                                nodeData.width || 220,   // Usar largura salva ou padrão
                                nodeData.height || 140   // Usar altura salva ou padrão
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
                
                console.log('Arquivo carregado com sucesso');
            } catch (error) {
                console.error('Erro ao carregar arquivo:', error);
                alert('Erro ao carregar arquivo: ' + error.message);
            }
        };
        reader.readAsText(file);
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
                    description: node.description,
                    width: node.width,    // Adicionando largura
                    height: node.height   // Adicionando altura
                })),
                connections: canvas.connections.map(conn => ({
                    startNodeId: conn.startNode.id,
                    endNodeId: conn.endNode.id
                })),
                nextNodeId: canvas.nextNodeId
            };
        });
        
        localStorage.setItem('visualflowEditorData', JSON.stringify(data));
    }
    
    loadFromLocalStorage() {
        const savedData = localStorage.getItem('visualflowEditorData');
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
                    
                    // Criar nós com tamanho personalizado
                    const nodeMap = {};
                    if (canvasData.nodes) {
                        canvasData.nodes.forEach(nodeData => {
                            // Passar largura e altura ao criar o nó
                            const node = canvas.addNode(
                                nodeData.x, 
                                nodeData.y, 
                                nodeData.name, 
                                nodeData.title, 
                                nodeData.description,
                                nodeData.width || 220,   // Usar largura salva ou padrão
                                nodeData.height || 140   // Usar altura salva ou padrão
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
            // Salvar estado no histórico antes de adicionar
            this.saveState();
            
            const canvas = this.getCurrentCanvas();
            // Converter coordenadas do mouse para coordenadas do mundo (considerando zoom)
            const x = (this.mousePosition.x - this.currentOffsetX) / this.zoom;
            const y = (this.mousePosition.y - this.currentOffsetY) / this.zoom;
            
            canvas.addNode(
                x - 110, 
                y - 70, 
                name, 
                title, 
                description
            );
            this.closeNodeModal();
            
            // Salvar automaticamente
            this.saveToLocalStorage();
        }
    }
    
    createCanvasFromForm() {
        const name = document.getElementById('canvasName').value;
        
        if (name) {
            if (this.createCanvas(name)) {
                this.setCurrentCanvas(name);
                
                // Salvar automaticamente
                this.saveToLocalStorage();
            } else {
                alert('Já existe um canvas com esse nome!');
            }
            this.closeCanvasModal();
        }
    }
    
    isPointOnAnyNode(x, y) {
        const canvas = this.getCurrentCanvas();
        if (!canvas) return false;
        
        // Verificar em ordem reversa (últimos desenhados primeiro)
        for (let i = canvas.nodes.length - 1; i >= 0; i--) {
            const node = canvas.nodes[i];
            // Ignorar nós ocultos
            if (node.hidden) continue;
            
            if (node.isPointInside(x, y, 0, 0) ||
                node.isPointOnInputConnector(x, y, 0, 0) ||
                node.isPointOnOutputConnector(x, y, 0, 0) ||
                node.isPointOnResizeHandle(x, y, 0, 0) ||
                node.isPointOnEditButton(x, y, 0, 0)) {
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
        
        // Converter coordenadas do mouse para coordenadas do mundo (considerando zoom)
        const worldX = (x - this.currentOffsetX) / this.zoom;
        const worldY = (y - this.currentOffsetY) / this.zoom;
        
        const canvas = this.getCurrentCanvas();
        if (!canvas) return;
        
        // Verificar se clicou em um nó com botão esquerdo
        if (e.button === 0) {
            for (let i = canvas.nodes.length - 1; i >= 0; i--) {
                const node = canvas.nodes[i];
                
                // Verificar se clicou no manipulador de redimensionamento
                if (node.isPointOnResizeHandle(worldX, worldY, 0, 0)) {
                    this.resizingNode = node;
                    this.resizeStart = { x: worldX, y: worldY };
                    this.originalSize = { width: node.width, height: node.height };
                    return;
                }
                
                // Verificar se clicou no botão de edição
                if (node.isPointOnEditButton(worldX, worldY, 0, 0)) {
                    this.editSelectedNodeText(node);
                    return;
                }
                
                // Verificar se clicou no conector de saída
                if (node.isPointOnOutputConnector(worldX, worldY, 0, 0)) {
                    this.connecting = true;
                    this.connectionStartNode = node;
                    return;
                }
                
                // Verificar se clicou no conector de entrada (para remover conexões)
                if (node.isPointOnInputConnector(worldX, worldY, 0, 0)) {
                    // Se o nó estiver selecionado, remover conexões para este nó
                    if (node.selected) {
                        this.removeConnectionsToNode(node);
                        return;
                    }
                    return;
                }
                
                // Verificar se clicou dentro do nó
                if (node.isPointInside(worldX, worldY, 0, 0)) {
                    // Se Shift não está pressionado, desselecionar outros nós
                    if (!e.shiftKey) {
                        canvas.deselectAll();
                        this.filterNodes('');
                    }
                    
                    // Selecionar o nó
                    node.selected = true;
                    this.selectedNode = node;
                    this.draggingNode = node;
                    
                    // Trazer o nó para frente
                    canvas.nodes.splice(i, 1);
                    canvas.nodes.push(node);
                    return;
                }
            }
            
            // Se não clicou em nenhum nó
            // Shift + clique esquerdo para seleção por área
            if (e.shiftKey) {
                canvas.deselectAll();
                this.filterNodes('');
                this.isSelecting = true;
                this.selectionStart = { x: worldX, y: worldY };
                this.selectionEnd = { x: worldX, y: worldY };
                return;
            }
            
            // Clique esquerdo em área vazia para mover o canvas (panning)
            this.panning = true;
            this.panStart = { x: worldX, y: worldY };
            this.canvas.style.cursor = 'grabbing';
        }
    }
    
    handleMouseMove(e) {
        if (!this.currentCanvasName) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.mousePosition = { x, y };
        
        // Converter coordenadas do mouse para coordenadas do mundo (considerando zoom)
        const worldX = (x - this.currentOffsetX) / this.zoom;
        const worldY = (y - this.currentOffsetY) / this.zoom;
        
        // Movimentação do canvas (panning)
        if (this.panning) {
            this.offsetX = (worldX - this.panStart.x) * this.zoom + this.currentOffsetX;
            this.offsetY = (worldY - this.panStart.y) * this.zoom + this.currentOffsetY;
            return;
        }
        
        // Seleção por área
        if (this.isSelecting) {
            this.selectionEnd = { x: worldX, y: worldY };
            return;
        }
        
        // Redimensionamento do nó
        if (this.resizingNode) {
            const deltaX = worldX - this.resizeStart.x;
            const deltaY = worldY - this.resizeStart.y;
            
            this.resizingNode.resize(
                this.originalSize.width + deltaX,
                this.originalSize.height + deltaY
            );
            return;
        }
        
        // Arrastar nó único
        if (this.draggingNode && !this.multipleNodeDrag) {
            let targetX = worldX - this.draggingNode.width / 2;
            let targetY = worldY - this.draggingNode.height / 2;
            
            // Aplicar alinhamento magnético se Shift estiver pressionado
            if (this.shiftPressed) {
                const snappedPosition = this.getSnapPosition(this.draggingNode, targetX, targetY);
                targetX = snappedPosition.x;
                targetY = snappedPosition.y;
            }
            
            this.draggingNode.updatePosition(targetX, targetY);
            return;
        }
        
        // Arrastar múltiplos nós
        if (this.multipleNodeDrag) {
            const deltaX = worldX - this.mouseDownPosition.x;
            const deltaY = worldY - this.mouseDownPosition.y;
            
            // Mover todos os nós selecionados mantendo suas posições relativas
            const selectedNodes = this.getCurrentCanvas().getSelectedNodes();
            for (let i = 0; i < selectedNodes.length; i++) {
                const node = selectedNodes[i];
                const initialPos = this.initialNodePositions[i];
                
                if (initialPos) {
                    let targetX = initialPos.x + deltaX;
                    let targetY = initialPos.y + deltaY;
                    
                    // Aplicar alinhamento magnético se Shift estiver pressionado
                    // Somente para o primeiro nó para evitar conflitos
                    if (this.shiftPressed && i === 0) {
                        const snappedPosition = this.getSnapPosition(node, targetX, targetY);
                        const snapDeltaX = snappedPosition.x - targetX;
                        const snapDeltaY = snappedPosition.y - targetY;
                        
                        // Aplicar o mesmo deslocamento para todos os nós
                        targetX = snappedPosition.x;
                        targetY = snappedPosition.y;
                        
                        // Atualizar as posições iniciais de todos os nós com o deslocamento
                        for (let j = 0; j < this.initialNodePositions.length; j++) {
                            this.initialNodePositions[j].x += snapDeltaX;
                            this.initialNodePositions[j].y += snapDeltaY;
                        }
                    }
                    
                    node.updatePosition(targetX, targetY);
                }
            }
            return;
        }
        
        // Verificar se o cursor deve mudar para redimensionamento
        const canvas = this.getCurrentCanvas();
        if (canvas) {
            let overResizeHandle = false;
            for (let i = canvas.nodes.length - 1; i >= 0; i--) {
                const node = canvas.nodes[i];
                if (node.selected && node.isPointOnResizeHandle(worldX, worldY, 0, 0)) {
                    overResizeHandle = true;
                    break;
                }
            }
            
            if (overResizeHandle) {
                this.canvas.style.cursor = 'nw-resize';
            } else if (this.canvas.style.cursor === 'nw-resize') {
                this.canvas.style.cursor = 'default';
            }
        }
    }
    
    handleMouseUp(e) {
        if (!this.currentCanvasName) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Converter coordenadas do mouse para coordenadas do mundo (considerando zoom)
        const worldX = (x - this.currentOffsetX) / this.zoom;
        const worldY = (y - this.currentOffsetY) / this.zoom;
        
        // Finalizar panning
        if (this.panning) {
            this.panning = false;
            this.canvas.style.cursor = 'default';
            this.currentOffsetX = this.offsetX;
            this.currentOffsetY = this.offsetY;
            
            // Salvar automaticamente
            this.saveToLocalStorage();
        }
        
        // Finalizar seleção por área
        if (this.isSelecting) {
            this.isSelecting = false;
            this.performAreaSelection();
        }
        
        // Finalizar redimensionamento
        if (this.resizingNode) {
            // Salvar estado no histórico antes de redimensionar
            this.saveState();
            
            this.resizingNode = null;
            this.resizeStart = { x: 0, y: 0 };
            this.originalSize = { width: 0, height: 0 };
            this.canvas.style.cursor = 'default';
            
            // Salvar automaticamente
            this.saveToLocalStorage();
        }
        
        // Finalizar arrastar nó único
        if (this.draggingNode && !this.multipleNodeDrag) {
            // Salvar estado no histórico antes de mover
            this.saveState();
            
            this.draggingNode = null;
            
            // Salvar automaticamente
            this.saveToLocalStorage();
        }
        
        // Finalizar arrastar múltiplos nós
        if (this.multipleNodeDrag) {
            // Salvar estado no histórico antes de mover
            this.saveState();
            
            this.multipleNodeDrag = false;
            this.initialNodePositions = [];
            this.mouseDownPosition = null;
            this.draggingNode = null;
            
            // Salvar automaticamente
            this.saveToLocalStorage();
        }
        
        const canvas = this.getCurrentCanvas();
        if (!canvas) return;
        
        // Finalizar conexão
        if (this.connecting && this.connectionStartNode) {
            // Verificar se soltou sobre um nó de entrada
            for (const node of canvas.nodes) {
                if (node.isPointOnInputConnector(worldX, worldY, 0, 0) && 
                    node !== this.connectionStartNode) {
                    // Salvar estado no histórico antes de criar conexão
                    this.saveState();
                    
                    // Adicionar nova conexão (permite múltiplas conexões)
                    canvas.connections.push(new Connection(this.connectionStartNode, node));
                    
                    // Salvar automaticamente
                    this.saveToLocalStorage();
                    break;
                }
            }
        }
        
        this.connecting = false;
        this.connectionStartNode = null;
    }
    
    performAreaSelection() {
        const canvas = this.getCurrentCanvas();
        if (!canvas) return;
        
        // Calcular área de seleção
        const minX = Math.min(this.selectionStart.x, this.selectionEnd.x);
        const maxX = Math.max(this.selectionStart.x, this.selectionEnd.x);
        const minY = Math.min(this.selectionStart.y, this.selectionEnd.y);
        const maxY = Math.max(this.selectionStart.y, this.selectionEnd.y);
        
        // Selecionar nós dentro da área
        canvas.nodes.forEach(node => {
            const nodeCenterX = node.x + node.width / 2;
            const nodeCenterY = node.y + node.height / 2;
            
            if (nodeCenterX >= minX && nodeCenterX <= maxX &&
                nodeCenterY >= minY && nodeCenterY <= maxY) {
                node.selected = true;
            }
        });
    }
    
    handleMouseLeave() {
        this.draggingNode = null;
        this.connecting = false;
        this.connectionStartNode = null;
        this.isSelecting = false;
        this.resizingNode = null;
        
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
            canvas.deselectAll();
            this.filterNodes('');
        }
        this.selectedNode = null;
    }
    
    drawConnections() {
        const canvas = this.getCurrentCanvas();
        if (!canvas) return;
        
        canvas.connections.forEach(connection => {
            // Não desenhar conexões com nós ocultos
            if (connection.startNode.hidden || connection.endNode.hidden) return;
            
            // Passar 0 para offset já que estamos aplicando transformações no contexto
            connection.draw(this.ctx, 0, 0);
        });
        
        // Desenhar conexão temporária durante a conexão
        if (this.connecting && this.connectionStartNode) {
            // As coordenadas já são transformadas pelo contexto
            const startX = this.connectionStartNode.x + this.connectionStartNode.width;
            const startY = this.connectionStartNode.y + this.connectionStartNode.height / 2;
            
            // Converter coordenadas do mouse para coordenadas do mundo
            const mouseX = (this.mousePosition.x - this.currentOffsetX) / this.zoom;
            const mouseY = (this.mousePosition.y - this.currentOffsetY) / this.zoom;
            
            // Salvar contexto
            this.ctx.save();
            
            // Desenhar linha temporária
            const gradient = this.ctx.createLinearGradient(startX, startY, mouseX, mouseY);
            gradient.addColorStop(0, '#81C784');
            gradient.addColorStop(1, '#64B5F6');
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(mouseX, mouseY);
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 3 / this.zoom; // Ajustar largura da linha com base no zoom
            this.ctx.lineCap = 'round';
            this.ctx.stroke();
            
            // Restaurar contexto
            this.ctx.restore();
        }
    }
    
    drawNodes() {
        const canvas = this.getCurrentCanvas();
        if (!canvas) return;
        
        canvas.nodes.forEach(node => {
            // Passar 0 para offset já que estamos aplicando transformações no contexto
            node.draw(this.ctx, 0, 0);
        });
    }
    
    drawSelectionBox() {
        if (!this.isSelecting) return;
        
        // Salvar contexto
        this.ctx.save();
        
        // Aplicar transformações para alinhar com o zoom
        this.ctx.translate(this.currentOffsetX, this.currentOffsetY);
        this.ctx.scale(this.zoom, this.zoom);
        
        // Desenhar caixa de seleção
        const width = this.selectionEnd.x - this.selectionStart.x;
        const height = this.selectionEnd.y - this.selectionStart.y;
        
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 2 / this.zoom; // Ajustar largura da linha com base no zoom
        this.ctx.setLineDash([5 / this.zoom, 5 / this.zoom]); // Ajustar traço com base no zoom
        this.ctx.strokeRect(this.selectionStart.x, this.selectionStart.y, width, height);
        
        this.ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
        this.ctx.fillRect(this.selectionStart.x, this.selectionStart.y, width, height);
        
        // Restaurar contexto
        this.ctx.restore();
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Salvar contexto antes das transformações
        this.ctx.save();
        
        // Aplicar transformações de zoom e offset
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.zoom, this.zoom);
        
        // Desenhar grid de fundo com offset
        this.drawGrid();
        
        // Desenhar conexões
        this.drawConnections();
        
        // Desenhar nós
        this.drawNodes();
        
        // Restaurar contexto
        this.ctx.restore();
        
        // Desenhar caixa de seleção (sem zoom)
        this.drawSelectionBox();
        
        requestAnimationFrame(() => this.animate());
    }
    
    drawGrid() {
        const gridSize = 30;
        
        // Salvar contexto
        this.ctx.save();
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        // Ajustar o tamanho da grade com base no zoom
        const scaledGridSize = gridSize * this.zoom;
        
        // Calcular os limites visíveis do canvas em coordenadas do mundo
        const minX = -this.offsetX / this.zoom;
        const minY = -this.offsetY / this.zoom;
        const maxX = (this.canvas.width - this.offsetX) / this.zoom;
        const maxY = (this.canvas.height - this.offsetY) / this.zoom;
        
        // Linhas verticais
        const startX = Math.floor(minX / gridSize) * gridSize;
        for (let x = startX; x <= maxX; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, minY);
            this.ctx.lineTo(x, maxY);
            this.ctx.stroke();
        }
        
        // Linhas horizontais
        const startY = Math.floor(minY / gridSize) * gridSize;
        for (let y = startY; y <= maxY; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(minX, y);
            this.ctx.lineTo(maxX, y);
            this.ctx.stroke();
        }
        
        // Restaurar contexto
        this.ctx.restore();
    }
    
    handleContextMenu(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.contextMenuPosition = { x, y };
        
        // Criar ou mostrar menu de contexto
        this.showContextMenu(x, y);
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        // Calcular o fator de zoom baseado no movimento do scroll
        const zoomIntensity = 0.1;
        const wheel = e.deltaY < 0 ? 1 : -1;
        const zoomFactor = Math.exp(wheel * zoomIntensity);
        
        // Calcular nova posição de zoom
        const newZoom = this.zoom * zoomFactor;
        
        // Limitar o zoom aos valores mínimos e máximos
        if (newZoom < this.minZoom || newZoom > this.maxZoom) {
            return;
        }
        
        // Atualizar o nível de zoom
        this.zoom = newZoom;
        
        // Ajustar o offset para fazer o zoom centralizado na posição do mouse
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calcular o ponto central antes do zoom
        const worldX = (mouseX - this.currentOffsetX) / (this.zoom / zoomFactor);
        const worldY = (mouseY - this.currentOffsetY) / (this.zoom / zoomFactor);
        
        // Calcular o novo offset para manter o ponto sob o cursor
        this.currentOffsetX = mouseX - worldX * this.zoom;
        this.currentOffsetY = mouseY - worldY * this.zoom;
        
        this.offsetX = this.currentOffsetX;
        this.offsetY = this.currentOffsetY;
    }
    
    showContextMenu(x, y) {
        // Remover menu existente se houver
        this.hideContextMenu();
        
        // Criar elemento do menu
        this.contextMenu = document.createElement('div');
        this.contextMenu.className = 'context-menu';
        this.contextMenu.style.position = 'absolute';
        this.contextMenu.style.left = `${x}px`;
        this.contextMenu.style.top = `${y}px`;
        this.contextMenu.style.zIndex = '1000';
        
        // Adicionar opções do menu
        const menuHTML = `
            <div class="context-menu-item" data-action="add-node">
                Adicionar Objeto
            </div>
        `;
        
        this.contextMenu.innerHTML = menuHTML;
        
        // Adicionar evento de clique aos itens do menu
        this.contextMenu.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            if (action) {
                this.handleContextMenuItemClick(action);
            }
        });
        
        // Adicionar menu ao documento
        document.body.appendChild(this.contextMenu);
    }

    hideContextMenu() {
        if (this.contextMenu && this.contextMenu.parentNode) {
            this.contextMenu.parentNode.removeChild(this.contextMenu);
            this.contextMenu = null;
        }
    }

    handleContextMenuItemClick(action) {
        switch (action) {
            case 'add-node':
                this.addNodeAtContextMenuPosition();
                break;
        }
        
        // Esconder menu após ação
        this.hideContextMenu();
    }

    addNodeAtContextMenuPosition() {
        const canvas = this.getCurrentCanvas();
        if (!canvas || !this.currentCanvasName) return;
        
        // Salvar estado no histórico antes de adicionar
        this.saveState();
        
        // Converter posição do menu para coordenadas do mundo (considerando zoom)
        const x = (this.contextMenuPosition.x - this.currentOffsetX) / this.zoom;
        const y = (this.contextMenuPosition.y - this.currentOffsetY) / this.zoom;
        
        // Adicionar novo nó
        const newNode = canvas.addNode(
            x - 110, // Centralizar nó horizontalmente
            y - 70,  // Centralizar nó verticalmente
            'Novo Nó',
            'Título',
            'Descrição'
        );
        
        // Selecionar o novo nó
        canvas.deselectAll();
        this.filterNodes('');
        newNode.selected = true;
        
        // Salvar automaticamente
        this.saveToLocalStorage();
    }
    
    // Método para remover conexões que terminam em um nó específico
    removeConnectionsToNode(node) {
        const canvas = this.getCurrentCanvas();
        if (!canvas) return;
        
        const initialCount = canvas.connections.length;
        
        // Filtrar conexões que não terminam no nó especificado
        canvas.connections = canvas.connections.filter(conn => conn.endNode !== node);
        
        const removedCount = initialCount - canvas.connections.length;
        
        if (removedCount > 0) {
            console.log(`${removedCount} conexão(ões) removida(s) do nó ${node.name}`);
            
            // Salvar automaticamente
            this.saveToLocalStorage();
        }
    }
    
    // Método para preparar o arrastar de múltiplos nós
    // Função para calcular a posição de alinhamento magnético
    getSnapPosition(node, targetX, targetY) {
        const snapDistance = 20; // Distância em pixels para alinhamento
        const canvas = this.getCurrentCanvas();
        
        if (!canvas) return { x: targetX, y: targetY };
        
        let snappedX = targetX;
        let snappedY = targetY;
        let minDistanceX = snapDistance;
        let minDistanceY = snapDistance;
        
        // Verificar alinhamento com outros nós (exceto o próprio nó)
        for (const otherNode of canvas.nodes) {
            if (otherNode === node) continue;
            
            // Alinhamento pelas bordas esquerda, direita, superior e inferior
            
            // Alinhamento pela borda esquerda
            const leftToLeft = Math.abs(targetX - otherNode.x);
            if (leftToLeft < minDistanceX) {
                snappedX = otherNode.x;
                minDistanceX = leftToLeft;
            }
            
            // Alinhamento pela borda direita
            const rightToRight = Math.abs((targetX + node.width) - (otherNode.x + otherNode.width));
            if (rightToRight < minDistanceX) {
                snappedX = otherNode.x + otherNode.width - node.width;
                minDistanceX = rightToRight;
            }
            
            // Alinhamento pela borda esquerda com a direita do outro nó
            const leftToRight = Math.abs(targetX - (otherNode.x + otherNode.width));
            if (leftToRight < minDistanceX) {
                snappedX = otherNode.x + otherNode.width;
                minDistanceX = leftToRight;
            }
            
            // Alinhamento pela borda direita com a esquerda do outro nó
            const rightToLeft = Math.abs((targetX + node.width) - otherNode.x);
            if (rightToLeft < minDistanceX) {
                snappedX = otherNode.x - node.width;
                minDistanceX = rightToLeft;
            }
            
            // Alinhamento pela borda superior
            const topToTop = Math.abs(targetY - otherNode.y);
            if (topToTop < minDistanceY) {
                snappedY = otherNode.y;
                minDistanceY = topToTop;
            }
            
            // Alinhamento pela borda inferior
            const bottomToBottom = Math.abs((targetY + node.height) - (otherNode.y + otherNode.height));
            if (bottomToBottom < minDistanceY) {
                snappedY = otherNode.y + otherNode.height - node.height;
                minDistanceY = bottomToBottom;
            }
            
            // Alinhamento pela borda superior com a inferior do outro nó
            const topToBottom = Math.abs(targetY - (otherNode.y + otherNode.height));
            if (topToBottom < minDistanceY) {
                snappedY = otherNode.y + otherNode.height;
                minDistanceY = topToBottom;
            }
            
            // Alinhamento pela borda inferior com a superior do outro nó
            const bottomToTop = Math.abs((targetY + node.height) - otherNode.y);
            if (bottomToTop < minDistanceY) {
                snappedY = otherNode.y - node.height;
                minDistanceY = bottomToTop;
            }
        }
        
        return { x: snappedX, y: snappedY };
    }
    
    // Método para salvar o estado atual no histórico
    saveState() {
        const canvas = this.getCurrentCanvas();
        if (!canvas) return;
        
        // Criar uma cópia profunda do estado atual
        const state = {
            nodes: canvas.nodes.map(node => ({
                id: node.id,
                x: node.x,
                y: node.y,
                name: node.name,
                title: node.title,
                description: node.description,
                width: node.width,
                height: node.height
            })),
            connections: canvas.connections.map(conn => ({
                startNodeId: conn.startNode.id,
                endNodeId: conn.endNode.id
            }))
        };
        
        // Remover estados futuros se estivermos no meio do histórico
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        // Adicionar o novo estado
        this.history.push(state);
        
        // Manter o tamanho máximo do histórico
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }
    
    // Método para restaurar um estado do histórico
    restoreState(state) {
        const canvas = this.getCurrentCanvas();
        if (!canvas || !state) return;
        
        // Limpar canvas atual
        canvas.clear();
        
        // Mapa para mapear IDs para nós criados
        const nodeMap = {};
        
        // Recriar nós
        state.nodes.forEach(nodeData => {
            const node = canvas.addNode(
                nodeData.x,
                nodeData.y,
                nodeData.name,
                nodeData.title,
                nodeData.description,
                nodeData.width,
                nodeData.height
            );
            node.id = nodeData.id;
            nodeMap[node.id] = node;
        });
        
        // Recriar conexões
        state.connections.forEach(connData => {
            const startNode = nodeMap[connData.startNodeId];
            const endNode = nodeMap[connData.endNodeId];
            
            if (startNode && endNode) {
                canvas.connections.push(new Connection(startNode, endNode));
            }
        });
    }
    
    // Método para desfazer a última ação
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState(this.history[this.historyIndex]);
            this.saveToLocalStorage();
        }
    }
    
    // Método para refazer a última ação desfeita
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreState(this.history[this.historyIndex]);
            this.saveToLocalStorage();
        }
    }
    
    // Método para filtrar nós com base em texto
    filterNodes(searchText) {
        const canvas = this.getCurrentCanvas();
        if (!canvas) return;
        
        // Se o texto de pesquisa estiver vazio, remover destaque de todos os nós
        if (!searchText.trim()) {
            canvas.nodes.forEach(node => {
                node.searchHighlight = false;
            });
            return;
        }
        
        // Converter texto de pesquisa para minúsculas para comparação
        const lowerSearchText = searchText.toLowerCase();
        
        // Verificar se há prefixos especiais para pesquisa específica
        let searchType = 'all'; // all, name, title, description
        let searchTerm = lowerSearchText;
        
        if (lowerSearchText.startsWith('@')) {
            searchType = 'name';
            searchTerm = lowerSearchText.substring(1);
        } else if (lowerSearchText.startsWith('#')) {
            searchType = 'title';
            searchTerm = lowerSearchText.substring(1);
        } else if (lowerSearchText.startsWith('$')) {
            searchType = 'description';
            searchTerm = lowerSearchText.substring(1);
        }
        
        // Destacar nós com base no texto de pesquisa
        canvas.nodes.forEach(node => {
            // Verificar se o texto de pesquisa está presente no nome, título ou descrição
            const nodeName = node.name ? node.name.toLowerCase() : '';
            const nodeTitle = node.title ? node.title.toLowerCase() : '';
            const nodeDescription = node.description ? node.description.toLowerCase() : '';
            
            // Destacar nós que correspondem à pesquisa com base no tipo
            switch (searchType) {
                case 'name':
                    node.searchHighlight = nodeName.includes(searchTerm);
                    break;
                case 'title':
                    node.searchHighlight = nodeTitle.includes(searchTerm);
                    break;
                case 'description':
                    node.searchHighlight = nodeDescription.includes(searchTerm);
                    break;
                default: // all
                    node.searchHighlight = (nodeName.includes(lowerSearchText) || 
                                          nodeTitle.includes(lowerSearchText) || 
                                          nodeDescription.includes(lowerSearchText));
            }
        });
    }
    
    // Método para alternar o tutorial
    toggleTutorial() {
        const tutorialDrawer = document.getElementById('tutorialDrawer');
        const tutorialContent = tutorialDrawer.querySelector('.tutorial-content');
        
        tutorialContent.classList.toggle('expanded');
    }
    
    // Método para fechar o tutorial
    closeTutorial() {
        const tutorialDrawer = document.getElementById('tutorialDrawer');
        const tutorialContent = tutorialDrawer.querySelector('.tutorial-content');
        
        tutorialContent.classList.remove('expanded');
    }
    
    // Método para inicializar o conteúdo do tutorial
    initTutorialContent() {
        const tutorialBody = document.getElementById('tutorialBody');
        
        tutorialBody.innerHTML = `
            <div class="tutorial-section">
                <h3>Introdução</h3>
                <p>Bem-vindo ao VisualFlow! Este é um editor de diagramas visual que permite criar e conectar objetos de forma intuitiva.</p>
            </div>
            
            <div class="tutorial-section">
                <h3>Adicionar Objetos</h3>
                <p>Existem duas formas de adicionar objetos:</p>
                <ul>
                    <li>Clique com o botão direito do mouse no canvas e selecione "Adicionar Objeto"</li>
                    <li>Ou clique no botão "Adicionar Canvas" na barra de ferramentas</li>
                </ul>
            </div>
            
            <div class="tutorial-section">
                <h3>Movimentar Objetos</h3>
                <p>Para mover objetos no canvas:</p>
                <ul>
                    <li>Clique e arraste um objeto para movê-lo</li>
                    <li>Segure <span class="shortcut-key">Shift</span> enquanto arrasta para alinhamento magnético</li>
                    <li>Clique e arraste em uma área vazia do canvas para mover toda a visualização</li>
                </ul>
            </div>
            
            <div class="tutorial-section">
                <h3>Conectar Objetos</h3>
                <p>Para criar conexões entre objetos:</p>
                <ul>
                    <li>Clique no círculo verde (saída) de um objeto</li>
                    <li>Arraste até o círculo azul (entrada) de outro objeto</li>
                    <li>Solte para criar a conexão</li>
                </ul>
            </div>
            
            <div class="tutorial-section">
                <h3>Seleção e Edição</h3>
                <p>Para selecionar e editar objetos:</p>
                <ul>
                    <li>Clique em um objeto para selecioná-lo (borda verde)</li>
                    <li>Segure <span class="shortcut-key">Shift</span> e clique para seleção múltipla</li>
                    <li>Clique no botão "Editar" no topo do objeto para modificar seus textos</li>
                    <li>Use <span class="shortcut-key">F2</span> para editar rapidamente um objeto selecionado</li>
                </ul>
            </div>
            
            <div class="tutorial-section">
                <h3>Atalhos do Teclado</h3>
                <ul>
                    <li><span class="shortcut-key">Ctrl + Z</span> - Desfazer</li>
                    <li><span class="shortcut-key">Ctrl + Y</span> - Refazer</li>
                    <li><span class="shortcut-key">Ctrl + C</span> - Copiar objetos selecionados</li>
                    <li><span class="shortcut-key">Ctrl + V</span> - Colar objetos copiados</li>
                    <li><span class="shortcut-key">Ctrl + A</span> - Selecionar todos os objetos</li>
                    <li><span class="shortcut-key">Delete</span> - Excluir objetos selecionados</li>
                    <li><span class="shortcut-key">Ctrl + F</span> - Pesquisar objetos</li>
                    <li><span class="shortcut-key">F11</span> - Modo apresentação</li>
                </ul>
            </div>
            
            <div class="tutorial-section">
                <h3>Pesquisa</h3>
                <p>Use o campo de pesquisa na barra de ferramentas para encontrar objetos:</p>
                <ul>
                    <li>Digite qualquer parte do nome, título ou descrição de um objeto</li>
                    <li>Os objetos correspondentes serão destacados com borda vermelha piscante</li>
                    <li>Pressione <span class="shortcut-key">Ctrl + F</span> para focar rapidamente no campo de pesquisa</li>
                </ul>
                <p><strong>Pesquisa Avançada:</strong></p>
                <ul>
                    <li>Use <span class="shortcut-key">@texto</span> para pesquisar apenas pelo nome do nó</li>
                    <li>Use <span class="shortcut-key">#texto</span> para pesquisar apenas pelo título do nó</li>
                    <li>Use <span class="shortcut-key">$texto</span> para pesquisar apenas pela descrição do nó</li>
                </ul>
            </div>
            
            <div class="tutorial-section">
                <h3>Salvamento</h3>
                <p>O trabalho é salvo automaticamente, mas você também pode:</p>
                <ul>
                    <li>Clique no botão "Salvar Arquivo" para exportar seu diagrama como JSON</li>
                    <li>Os dados são armazenados localmente no seu navegador</li>
                </ul>
            </div>
        `;
    }
    
    // Método para alternar o modo de apresentação
    togglePresentationMode() {
        this.presentationMode = !this.presentationMode;
        
        // Adicionar ou remover classe CSS para o modo de apresentação
        if (this.presentationMode) {
            document.body.classList.add('presentation-mode');
            
            // Garantir que não haja rolagem
            document.body.style.overflow = 'hidden';
            
            // Adicionar botão de saída do modo de apresentação
            this.createExitPresentationButton();
            
            // Tentar entrar em tela cheia
            this.enterFullscreen();
        } else {
            document.body.classList.remove('presentation-mode');
            
            // Restaurar rolagem
            document.body.style.overflow = '';
            
            // Remover botão de saída do modo de apresentação
            this.removeExitPresentationButton();
            
            // Sair do modo tela cheia
            this.exitFullscreen();
        }
    }
    
    // Método para entrar em tela cheia
    enterFullscreen() {
        // Solicitar modo tela cheia
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) { // Firefox
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) { // Chrome, Safari and Opera
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) { // IE/Edge
            document.documentElement.msRequestFullscreen();
        }
    }
    
    // Método para sair do modo tela cheia
    exitFullscreen() {
        // Sair do modo tela cheia
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { // Firefox
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { // Chrome, Safari and Opera
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { // IE/Edge
            document.msExitFullscreen();
        }
    }
    
    // Método para criar botão de saída do modo de apresentação
    createExitPresentationButton() {
        // Remover botão existente se houver
        this.removeExitPresentationButton();
        
        // Criar botão de saída
        const exitBtn = document.createElement('button');
        exitBtn.id = 'exitPresentationBtn';
        exitBtn.textContent = 'Sair (ESC)';
        exitBtn.style.position = 'fixed';
        exitBtn.style.top = '10px';
        exitBtn.style.right = '10px';
        exitBtn.style.zIndex = '1000';
        exitBtn.style.background = 'rgba(0, 0, 0, 0.7)';
        exitBtn.style.color = 'white';
        exitBtn.style.border = 'none';
        exitBtn.style.padding = '10px 15px';
        exitBtn.style.borderRadius = '5px';
        exitBtn.style.cursor = 'pointer';
        exitBtn.style.fontSize = '14px';
        
        exitBtn.addEventListener('click', () => {
            this.togglePresentationMode();
        });
        
        document.body.appendChild(exitBtn);
    }
    
    // Método para remover botão de saída do modo de apresentação
    removeExitPresentationButton() {
        const exitBtn = document.getElementById('exitPresentationBtn');
        if (exitBtn) {
            exitBtn.remove();
        }
    }
    
    prepareMultipleNodeDrag(clickedNode) {
        const canvas = this.getCurrentCanvas();
        const selectedNodes = canvas.getSelectedNodes();
        
        // Armazenar posições iniciais de todos os nós selecionados
        this.initialNodePositions = selectedNodes.map(node => ({
            x: node.x,
            y: node.y
        }));
        
        // Armazenar posição do mouse em coordenadas do mundo
        this.mouseDownPosition = { 
            x: (this.mousePosition.x - this.currentOffsetX) / this.zoom, 
            y: (this.mousePosition.y - this.currentOffsetY) / this.zoom 
        };
        
        // Ativar modo de arrastar múltiplos nós
        this.multipleNodeDrag = true;
        this.draggingNode = clickedNode;
    }
}

// Inicializar o editor quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    const editor = new MultiCanvasEditor();
});