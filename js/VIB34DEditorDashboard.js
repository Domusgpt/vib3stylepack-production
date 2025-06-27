/**
 * VIB34D Editor Dashboard - External JavaScript
 * Reactive UI Builder System
 */

// Global editor dashboard instance
let editorDashboard;

// VIB34D Editor Dashboard Class
class VIB34DEditorDashboard {
    constructor() {
        this.elements = new Map();
        this.selectedElement = null;
        this.relationships = [];
        this.smartLinks = [];
        this.draggedItem = null;
        this.linkMode = 'focused'; // focused, linked, environment
        this.reactionSettings = {
            type: 'congruent',
            strength: 1.0,
            delay: 0
        };
        this.visualGuidance = {
            showConnections: true,
            showInfluenceZones: false,
            showReactionPreview: false
        };
        this.globalParameters = {
            intensity: 0.8,
            speed: 1.0,
            density: 10,
            saturation: 0.9
        };
        
        this.setupDragAndDrop();
        this.setupEventListeners();
        this.setupComponentLibrary();
        
        console.log('🎨 VIB34D Editor Dashboard initialized with Smart Linking');
    }
    
    setupComponentLibrary() {
        // Setup component library tab switching
        setTimeout(() => {
            console.log('🔧 Setting up component library tabs');
        }, 200);
    }
    
    setupDragAndDrop() {
        // Wait for DOM to be ready, then setup drag handlers
        setTimeout(() => {
            // Drag start from library - support both old geometry items and new component items
            const geometryItems = document.querySelectorAll('.geometry-item');
            const componentItems = document.querySelectorAll('.component-item');
            const allItems = [...geometryItems, ...componentItems];
            console.log(`🔧 Setting up drag-and-drop for ${allItems.length} items (${geometryItems.length} legacy + ${componentItems.length} components)`);
            
            allItems.forEach(item => {
                // Make sure draggable attribute is set
                item.setAttribute('draggable', 'true');
                
                item.addEventListener('dragstart', (e) => {
                    console.log('🎯 Drag started:', e.currentTarget.dataset);
                    const draggedElement = e.currentTarget;
                    
                    // Support both legacy geometry items and new component items
                    this.draggedItem = {
                        // Legacy support
                        geometry: draggedElement.dataset.geometry,
                        element: draggedElement.dataset.element,
                        // New component system
                        component: draggedElement.dataset.component,
                        type: draggedElement.dataset.type || draggedElement.dataset.geometry || draggedElement.dataset.element,
                        // Combined identifier for createElement
                        identifier: draggedElement.dataset.component || draggedElement.dataset.geometry || draggedElement.dataset.element
                    };
                    draggedElement.classList.add('dragging');
                    
                    // Set drag effect
                    e.dataTransfer.effectAllowed = 'copy';
                    e.dataTransfer.setData('text/plain', JSON.stringify(this.draggedItem));
                });
                
                item.addEventListener('dragend', (e) => {
                    console.log('🎯 Drag ended');
                    const draggedElement = e.currentTarget;
                    draggedElement.classList.remove('dragging');
                });
            });
        }, 100);
        
        // Setup drop zone
        setTimeout(() => {
            const canvas = document.getElementById('canvasWorkspace');
            if (canvas) {
                console.log('🎯 Setting up drop zone on canvas');
                
                canvas.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                    canvas.classList.add('drop-active');
                    console.log('🎯 Drag over canvas');
                });
                
                canvas.addEventListener('dragleave', (e) => {
                    canvas.classList.remove('drop-active');
                    console.log('🎯 Drag left canvas');
                });
                
                canvas.addEventListener('drop', (e) => {
                    e.preventDefault();
                    canvas.classList.remove('drop-active');
                    console.log('🎯 Drop on canvas!', e);
                    
                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    // Get drag data
                    let dragData = this.draggedItem;
                    if (!dragData) {
                        try {
                            dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
                        } catch (error) {
                            console.error('Failed to parse drag data:', error);
                            return;
                        }
                    }
                    
                    if (dragData) {
                        console.log('🎯 Creating element at:', x, y, dragData);
                        this.createElement(x, y, dragData);
                        this.draggedItem = null;
                    } else {
                        console.error('No drag data available');
                    }
                });
            } else {
                console.error('❌ Canvas workspace not found!');
            }
        }, 150);
    }
    
    setupEventListeners() {
        // Canvas click for element selection
        document.getElementById('canvasPreview').addEventListener('click', (e) => {
            if (e.target.classList.contains('ui-element')) {
                this.selectElement(e.target.dataset.id);
            } else {
                this.selectElement(null);
            }
        });
    }
    
    createElement(x, y, itemData) {
        const id = 'element_' + Date.now();
        const element = document.createElement('div');
        element.className = 'ui-element';
        element.dataset.id = id;
        element.style.left = x + 'px';
        element.style.top = y + 'px';
        element.style.width = '200px';
        element.style.height = '150px';
        
        // Create canvas for visualization
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 150;
        element.appendChild(canvas);
        
        // Initialize HyperAV core for this element
        try {
            const core = new HypercubeCore(canvas, {
                onStateChangeCallback: (reason) => {
                    console.log(`Element ${id} state changed: ${reason}`);
                }
            });
            
            // Set geometry based on dragged item
            if (itemData.geometry) {
                core.setGeometry(itemData.geometry);
            } else {
                core.setGeometry('hypercube'); // Default
            }
            
            core.setProjection('perspective');
            core.start();
            
            // Store element data
            this.elements.set(id, {
                domElement: element,
                canvas: canvas,
                core: core,
                type: itemData.type,
                geometry: itemData.geometry || 'hypercube',
                properties: {
                    intensity: 0.8,
                    speed: 1.0,
                    density: 10,
                    colorShift: 0.0,
                    morphFactor: 0.0
                },
                relationships: []
            });
            
        } catch (error) {
            console.error('Failed to create visualization for element:', error);
            element.innerHTML = `<div style="padding: 10px; text-align: center;">
                <div>${itemData.type}</div>
                <div style="font-size: 10px; color: #888;">${itemData.geometry || 'UI Element'}</div>
            </div>`;
        }
        
        // Make element draggable
        this.makeElementDraggable(element);
        
        document.getElementById('canvasPreview').appendChild(element);
        this.selectElement(id);
        
        console.log(`Created element: ${id} (${itemData.type})`);
    }
    
    makeElementDraggable(element) {
        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        element.addEventListener('mousedown', (e) => {
            if (e.target === element || e.target.tagName === 'CANVAS') {
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                initialX = parseInt(element.style.left);
                initialY = parseInt(element.style.top);
                
                e.preventDefault();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                
                element.style.left = (initialX + deltaX) + 'px';
                element.style.top = (initialY + deltaY) + 'px';
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }
    
    selectElement(elementId) {
        // Clear previous selection
        document.querySelectorAll('.ui-element.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        this.selectedElement = elementId;
        
        if (elementId && this.elements.has(elementId)) {
            const element = this.elements.get(elementId);
            element.domElement.classList.add('selected');
            this.showElementProperties(elementId);
        } else {
            this.showElementProperties(null);
        }
    }
    
    showElementProperties(elementId) {
        const propertiesContainer = document.getElementById('elementProperties');
        
        if (!elementId || !this.elements.has(elementId)) {
            propertiesContainer.innerHTML = `
                <p style="color: #888; font-size: 12px; text-align: center; margin-top: 50px;">
                    Select an element to edit properties
                </p>
            `;
            return;
        }
        
        const element = this.elements.get(elementId);
        
        propertiesContainer.innerHTML = `
            <div class="property-item">
                <label class="property-label">Element Type</label>
                <input type="text" class="property-input" value="${element.type}" readonly>
            </div>
            
            <div class="property-item">
                <label class="property-label">Geometry Type</label>
                <div class="geometry-selector">
                    ${['hypercube', 'hypersphere', 'hypertetrahedron', 'torus', 'kleinbottle', 'fractal', 'wave', 'crystal'].map(geo => `
                        <div class="geometry-option ${element.geometry === geo ? 'active' : ''}" 
                             onclick="editorDashboard.changeElementGeometry('${elementId}', '${geo}')">
                            ${geo}
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="property-item">
                <label class="property-label">Intensity</label>
                <input type="range" class="property-slider" min="0" max="2" step="0.01" 
                       value="${element.properties.intensity}"
                       onchange="editorDashboard.updateElementProperty('${elementId}', 'intensity', this.value)">
            </div>
            
            <div class="property-item">
                <label class="property-label">Animation Speed</label>
                <input type="range" class="property-slider" min="0" max="3" step="0.01" 
                       value="${element.properties.speed}"
                       onchange="editorDashboard.updateElementProperty('${elementId}', 'speed', this.value)">
            </div>
            
            <div class="property-item">
                <label class="property-label">Grid Density</label>
                <input type="range" class="property-slider" min="1" max="25" step="0.5" 
                       value="${element.properties.density}"
                       onchange="editorDashboard.updateElementProperty('${elementId}', 'density', this.value)">
            </div>
            
            <div class="property-item">
                <label class="property-label">Color Shift</label>
                <input type="range" class="property-slider" min="-1" max="1" step="0.01" 
                       value="${element.properties.colorShift}"
                       onchange="editorDashboard.updateElementProperty('${elementId}', 'colorShift', this.value)">
            </div>
            
            <div class="property-item">
                <label class="property-label">Morph Factor</label>
                <input type="range" class="property-slider" min="0" max="1.5" step="0.01" 
                       value="${element.properties.morphFactor}"
                       onchange="editorDashboard.updateElementProperty('${elementId}', 'morphFactor', this.value)">
            </div>
            
            <div class="property-item" style="margin-top: 20px;">
                <button class="toolbar-button" onclick="editorDashboard.deleteElement('${elementId}')" 
                        style="width: 100%; background: rgba(255, 0, 0, 0.3); border-color: #ff0000; color: #ff0000;">
                    Delete Element
                </button>
            </div>
        `;
    }
    
    changeElementGeometry(elementId, geometry) {
        if (!this.elements.has(elementId)) return;
        
        const element = this.elements.get(elementId);
        element.geometry = geometry;
        
        if (element.core) {
            element.core.setGeometry(geometry);
        }
        
        this.showElementProperties(elementId);
        console.log(`Changed element ${elementId} geometry to ${geometry}`);
    }
    
    updateElementProperty(elementId, property, value) {
        if (!this.elements.has(elementId)) return;
        
        const element = this.elements.get(elementId);
        element.properties[property] = parseFloat(value);
        
        // Update the core system with new parameters
        if (element.core) {
            const params = {};
            
            switch(property) {
                case 'intensity':
                    params.u_patternIntensity = value;
                    break;
                case 'speed':
                    params.u_rotationSpeed = value;
                    break;
                case 'density':
                    params.u_gridDensity = value;
                    break;
                case 'colorShift':
                    params.u_colorShift = value;
                    break;
                case 'morphFactor':
                    params.u_morphFactor = value;
                    break;
            }
            
            // Apply parameters to the core
            Object.assign(element.core.baseParameters, params);
        }
        
        console.log(`Updated element ${elementId} ${property} to ${value}`);
    }
    
    deleteElement(elementId) {
        if (!this.elements.has(elementId)) return;
        
        const element = this.elements.get(elementId);
        
        // Stop the core system
        if (element.core) {
            element.core.stop();
            element.core.destroy();
        }
        
        // Remove from DOM
        element.domElement.remove();
        
        // Remove from data structures
        this.elements.delete(elementId);
        
        // Clear selection if this was selected
        if (this.selectedElement === elementId) {
            this.selectElement(null);
        }
        
        console.log(`Deleted element ${elementId}`);
    }
    
    exportHTML() {
        const html = this.generateStandaloneHTML();
        document.getElementById('exportCode').textContent = html;
        document.getElementById('exportModal').classList.add('active');
    }
    
    generateStandaloneHTML() {
        const elementsConfig = [];
        
        this.elements.forEach((element, id) => {
            elementsConfig.push({
                id: id,
                type: element.type,
                geometry: element.geometry,
                position: {
                    x: parseInt(element.domElement.style.left),
                    y: parseInt(element.domElement.style.top),
                    width: parseInt(element.domElement.style.width) || 200,
                    height: parseInt(element.domElement.style.height) || 150
                },
                properties: element.properties,
                relationships: element.relationships
            });
        });
        
        // Generate elements HTML
        const elementsHTML = elementsConfig.map(config => {
            return `        <div class="vib34d-element" 
             style="left: ${config.position.x}px; top: ${config.position.y}px; width: ${config.position.width}px; height: ${config.position.height}px;"
             data-geometry="${config.geometry}" 
             data-element-id="${config.id}">
            <canvas width="${config.position.width}" height="${config.position.height}"></canvas>
        </div>`;
        }).join('\n');
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VIB34D Reactive UI - Generated</title>
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            background: #000; 
            color: #fff; 
            font-family: 'Courier New', monospace; 
            overflow: hidden;
            height: 100vh;
        }
        
        .vib34d-container {
            position: relative;
            width: 100vw;
            height: 100vh;
            background: radial-gradient(ellipse at center, #1a0033 0%, #000000 70%);
        }
        
        .vib34d-element {
            position: absolute;
            border-radius: 5px;
            overflow: hidden;
        }
        
        .vib34d-element canvas {
            width: 100%;
            height: 100%;
            display: block;
        }
    </style>
</head>
<body>
    <div class="vib34d-container">
${elementsHTML}
    </div>
    
    <!-- VIB34D Core System (Embedded) -->
    <script>
        // Embedded core system would go here
        // This is a simplified version for demonstration
        const VIB34D_CONFIG = ${JSON.stringify(elementsConfig, null, 2)};
        
        // Initialize all elements
        document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('.vib34d-element').forEach(element => {
                const canvas = element.querySelector('canvas');
                const config = VIB34D_CONFIG.find(c => c.id === element.dataset.elementId);
                
                if (canvas && config) {
                    // Initialize HyperAV core for each element
                    console.log('Initializing element:', config.id, 'with geometry:', config.geometry);
                    // Core initialization code would go here
                }
            });
        });
    </scr${''}ipt>
</body>
</html>`;
    }
    
    updateRelationshipDisplay() {
        const container = document.getElementById('relationshipManager');
        if (this.relationships.length === 0) {
            container.innerHTML = '<p style="color: #888; font-size: 12px; text-align: center;">No relationships created</p>';
            return;
        }
        
        container.innerHTML = this.relationships.map(rel => `
            <div class="relationship-item">
                <select class="relationship-type" onchange="editorDashboard.updateRelationshipType('${rel.id}', this.value)">
                    <option value="sync" ${rel.type === 'sync' ? 'selected' : ''}>Sync</option>
                    <option value="inverse" ${rel.type === 'inverse' ? 'selected' : ''}>Inverse</option>
                    <option value="cascade" ${rel.type === 'cascade' ? 'selected' : ''}>Cascade</option>
                    <option value="amplify" ${rel.type === 'amplify' ? 'selected' : ''}>Amplify</option>
                </select>
                <button class="delete-relationship" onclick="editorDashboard.deleteRelationship('${rel.id}')">×</button>
            </div>
        `).join('');
    }
    
    updateRelationshipType(relId, newType) {
        const rel = this.relationships.find(r => r.id === relId);
        if (rel) {
            rel.type = newType;
            console.log('Updated relationship type:', relId, newType);
        }
    }
    
    deleteRelationship(relId) {
        this.relationships = this.relationships.filter(r => r.id !== relId);
        this.updateRelationshipDisplay();
        console.log('Deleted relationship:', relId);
    }
    
    updateActiveLinksList() {
        const container = document.getElementById('activeLinks');
        if (!container) return;
        
        if (this.smartLinks.length === 0) {
            container.innerHTML = '<p style="color: #888; font-size: 12px; text-align: center;">No active links - select elements to create relationships</p>';
            return;
        }
        
        container.innerHTML = this.smartLinks.map(link => `
            <div class="link-item">
                <div class="link-info">
                    <div class="link-elements">${link.source} ↔ ${link.target}</div>
                    <div class="link-type">${link.type} (${link.strength}x, ${link.delay}ms)</div>
                </div>
                <button class="link-remove" onclick="editorDashboard.removeSmartLink('${link.id}')">×</button>
            </div>
        `).join('');
    }
    
    removeSmartLink(linkId) {
        this.smartLinks = this.smartLinks.filter(link => link.id !== linkId);
        this.updateActiveLinksList();
        console.log('Removed smart link:', linkId);
    }
}

// Global functions for toolbar
function updateGlobalParameter(param, value) {
    if (!editorDashboard) {
        console.error('Editor dashboard not initialized yet');
        return;
    }
    editorDashboard.globalParameters[param] = parseFloat(value);
    document.getElementById(param + 'Value').textContent = value;
    
    // Apply to all elements
    editorDashboard.elements.forEach((element) => {
        if (element.core) {
            editorDashboard.updateElementProperty(element.domElement.dataset.id, 
                param === 'density' ? 'density' : param === 'speed' ? 'speed' : 'intensity', 
                value);
        }
    });
}

function clearCanvas() {
    if (!editorDashboard) {
        console.error('Editor dashboard not initialized yet');
        return;
    }
    if (confirm('Clear all elements?')) {
        editorDashboard.elements.forEach((element, id) => {
            editorDashboard.deleteElement(id);
        });
    }
}

function saveProject() {
    if (!editorDashboard) {
        console.error('Editor dashboard not initialized yet');
        return;
    }
    const project = {
        elements: Array.from(editorDashboard.elements.entries()).map(([id, element]) => ({
            id,
            type: element.type,
            geometry: element.geometry,
            position: {
                x: parseInt(element.domElement.style.left),
                y: parseInt(element.domElement.style.top),
                width: parseInt(element.domElement.style.width) || 200,
                height: parseInt(element.domElement.style.height) || 150
            },
            properties: element.properties
        })),
        globalParameters: editorDashboard.globalParameters
    };
    
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vib34d-project.json';
    a.click();
    URL.revokeObjectURL(url);
}

function loadProject() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const project = JSON.parse(e.target.result);
                    // Implementation for loading project
                    console.log('Project loaded:', project);
                } catch (error) {
                    alert('Error loading project file');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

function exportHTML() {
    if (!editorDashboard) {
        console.error('Editor dashboard not initialized yet');
        return;
    }
    editorDashboard.exportHTML();
}

function addRelationship() {
    if (!editorDashboard) {
        console.error('Editor dashboard not initialized yet');
        return;
    }
    if (editorDashboard.elements.size >= 2) {
        const elementIds = Array.from(editorDashboard.elements.keys());
        const sourceId = elementIds[0];
        const targetId = elementIds[1];
        
        const relationship = {
            id: 'rel_' + Date.now(),
            source: sourceId,
            target: targetId,
            type: 'sync', // Default relationship type
            intensity: 1.0
        };
        
        editorDashboard.relationships.push(relationship);
        editorDashboard.updateRelationshipDisplay();
        console.log('Added relationship:', relationship);
    } else {
        alert('Need at least 2 elements to create relationships');
    }
}

function copyToClipboard() {
    const code = document.getElementById('exportCode').textContent;
    navigator.clipboard.writeText(code).then(() => {
        alert('Code copied to clipboard!');
    });
}

function downloadHTML() {
    const code = document.getElementById('exportCode').textContent;
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vib34d-reactive-ui.html';
    a.click();
    URL.revokeObjectURL(url);
}

function closeModal() {
    document.getElementById('exportModal').classList.remove('active');
}

function testDragDrop() {
    if (!editorDashboard) {
        console.error('Editor dashboard not initialized yet');
        return;
    }
    
    console.log('🧪 Testing drag-and-drop functionality...');
    
    // Check if geometry items exist
    const geometryItems = document.querySelectorAll('.geometry-item');
    console.log(`Found ${geometryItems.length} geometry items`);
    
    // Test programmatic element creation
    const testData = { geometry: 'hypercube', type: 'hypercube' };
    editorDashboard.createElement(300, 200, testData);
    console.log('✅ Created test hypercube at 300, 200');
    
    // Add another element
    setTimeout(() => {
        editorDashboard.createElement(500, 300, { geometry: 'hypersphere', type: 'hypersphere' });
        console.log('✅ Created test hypersphere at 500, 300');
    }, 1000);
    
    // Check drag handlers
    geometryItems.forEach((item, index) => {
        if (item.getAttribute('draggable') === 'true') {
            console.log(`✅ Item ${index} is draggable`);
        } else {
            console.log(`❌ Item ${index} is NOT draggable`);
            item.setAttribute('draggable', 'true');
        }
    });
    
    alert('Check console for drag-drop test results. Try dragging geometry items to canvas!');
}

// Global functions for component library and smart linking
function switchLibraryTab(tabName) {
    // Hide all library pages
    document.querySelectorAll('.library-page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Remove active from all tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected page and activate tab
    const targetPage = document.getElementById(tabName + '-page');
    const targetTab = document.querySelector(`[data-tab="${tabName}"]`);
    
    if (targetPage) targetPage.classList.add('active');
    if (targetTab) targetTab.classList.add('active');
    
    console.log(`📑 Switched to ${tabName} library tab`);
}

function setLinkMode(mode) {
    if (!editorDashboard) return;
    
    editorDashboard.linkMode = mode;
    
    // Update UI
    document.querySelectorAll('.link-mode').forEach(el => el.classList.remove('active'));
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    
    console.log(`🔗 Link mode set to: ${mode}`);
}

function updateReactionType() {
    if (!editorDashboard) return;
    
    const select = document.getElementById('reactionType');
    editorDashboard.reactionSettings.type = select.value;
    
    console.log(`⚡ Reaction type set to: ${select.value}`);
}

function updateReactionStrength(value) {
    if (!editorDashboard) return;
    
    editorDashboard.reactionSettings.strength = parseFloat(value);
    document.getElementById('reactionStrengthValue').textContent = value;
    
    console.log(`💪 Reaction strength set to: ${value}`);
}

function updateReactionDelay(value) {
    if (!editorDashboard) return;
    
    editorDashboard.reactionSettings.delay = parseInt(value);
    document.getElementById('reactionDelayValue').textContent = value;
    
    console.log(`⏱️ Reaction delay set to: ${value}ms`);
}

function toggleConnections(enabled) {
    if (!editorDashboard) return;
    
    editorDashboard.visualGuidance.showConnections = enabled;
    // TODO: Implement visual connection lines
    
    console.log(`🔗 Connection lines: ${enabled ? 'enabled' : 'disabled'}`);
}

function toggleInfluenceZones(enabled) {
    if (!editorDashboard) return;
    
    editorDashboard.visualGuidance.showInfluenceZones = enabled;
    // TODO: Implement influence zone visualization
    
    console.log(`🌍 Influence zones: ${enabled ? 'enabled' : 'disabled'}`);
}

function toggleReactionPreview(enabled) {
    if (!editorDashboard) return;
    
    editorDashboard.visualGuidance.showReactionPreview = enabled;
    // TODO: Implement reaction preview
    
    console.log(`👁️ Reaction preview: ${enabled ? 'enabled' : 'disabled'}`);
}

function createSmartLink() {
    if (!editorDashboard) return;
    
    // TODO: Implement smart linking based on selected elements
    console.log('🔗 Creating smart link between selected elements...');
    
    if (editorDashboard.selectedElement) {
        alert('Smart linking will be implemented - select multiple elements to create relationships');
    } else {
        alert('Please select an element first to create links');
    }
}

function clearAllLinks() {
    if (!editorDashboard) return;
    
    if (confirm('Clear all smart links?')) {
        editorDashboard.smartLinks = [];
        editorDashboard.updateActiveLinksList();
        console.log('🗑️ All smart links cleared');
    }
}

// Initialize the editor dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    editorDashboard = new VIB34DEditorDashboard();
    console.log('✅ VIB34D Editor Dashboard fully initialized');
});