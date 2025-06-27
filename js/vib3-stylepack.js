/**
 * VIB3STYLEPACK - MAIN ORCHESTRATION SYSTEM
 * Brings together all components for the complete visual language system
 */

console.log('🎨 VIB3STYLEPACK Main System Loading...');

class VIB3StylePack {
    constructor(config = {}) {
        this.config = {
            // Canvas consolidation settings
            enableCanvasConsolidation: true,
            targetContexts: 6, // 5 sections + 1 crystal
            
            // Section configuration
            sectionModifiers: {
                home: 1.0,
                articles: 0.8,
                videos: 1.2,
                podcasts: 1.1,
                ema: 0.9
            },
            
            sectionGeometries: {
                home: 'hypercube',
                articles: 'tetrahedron', 
                videos: 'sphere',
                podcasts: 'torus',
                ema: 'wave'
            },
            
            // Element roles
            elementRoles: {
                background: { modifier: 0.7, color: [1,0,1], opacity: 0.8 },
                content: { modifier: 1.0, color: [0,1,1], opacity: 0.6 },
                accent: { modifier: 1.3, color: [1,1,0], opacity: 0.4 },
                navigation: { modifier: 0.9, color: [0,1,0], opacity: 0.7 }
            },
            
            // Portal scroll settings
            enablePortalScroll: true,
            snapToSections: true,
            transitionDuration: 800,
            
            // Debug
            debugMode: false,
            
            ...config
        };
        
        // Core systems
        this.homeMaster = null;
        this.portalScroll = null;
        this.elementMapper = null;
        this.multiVisualizerSystem = null;
        
        // Section renderers (MULTIPLE per section)
        this.sectionRenderers = new Map();
        this.sections = new Map();
        
        // Global state
        this.isInitialized = false;
        this.renderLoopActive = false;
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Initializing VIB3STYLEPACK System...');
        
        try {
            // Step 1: Initialize home-master parameter system
            await this.initializeHomeMaster();
            
            // Step 2: Detect and setup sections
            await this.detectSections();
            
            // Step 3: Initialize Multi-Visualizer System (MULTIPLE instances per section)
            await this.initializeMultiVisualizerSystem();
            
            // Step 4: Initialize element mapper
            await this.initializeElementMapper();
            
            // Step 5: Initialize portal scroll system
            if (this.config.enablePortalScroll) {
                await this.initializePortalScroll();
            }
            
            // Step 6: Setup global interactions
            await this.setupGlobalInteractions();
            
            // Step 7: Start render loop
            this.startRenderLoop();
            
            // Step 8: Update status display
            this.updateStatusDisplay();
            
            this.isInitialized = true;
            
            // Count total instances
            let totalInstances = 0;
            if (this.multiVisualizerSystem) {
                this.multiVisualizerSystem.sectionInstances.forEach(instances => {
                    totalInstances += instances.length;
                });
            }
            
            console.log(`✅ VIB3STYLEPACK initialized with ${totalInstances} visualizer instances across ${this.sections.size} sections`);
            
        } catch (error) {
            console.error('🚨 VIB3STYLEPACK initialization failed:', error);
        }
    }
    
    async initializeHomeMaster() {
        if (typeof VIB3HomeMaster === 'undefined') {
            console.error('🚨 VIB3HomeMaster not loaded');
            return;
        }
        
        this.homeMaster = new VIB3HomeMaster({
            sectionModifiers: this.config.sectionModifiers
        });
        
        console.log('🏠 Home-Master system initialized');
    }
    
    async detectSections() {
        const sectionElements = document.querySelectorAll('[data-vib3-section]');
        
        console.log(`🔍 Scanning for sections... found ${sectionElements.length} elements`);
        
        sectionElements.forEach((element, index) => {
            const sectionKey = element.dataset.vib3Section;
            const geometry = element.dataset.vib3Geometry || this.config.sectionGeometries[sectionKey] || 'hypercube';
            const modifier = parseFloat(element.dataset.vib3Modifier) || this.config.sectionModifiers[sectionKey] || 1.0;
            
            console.log(`📍 Section ${index + 1}: [${sectionKey}] -> geometry: ${geometry}, modifier: ${modifier}`, element);
            
            this.sections.set(sectionKey, {
                element: element,
                geometry: geometry,
                modifier: modifier,
                isVisible: false,
                isActive: false
            });
        });
        
        console.log(`📍 Final section count: ${this.sections.size}`, Array.from(this.sections.keys()));
    }
    
    async initializeMultiVisualizerSystem() {
        if (typeof VIB3MultiVisualizerSystem === 'undefined') {
            console.error('🚨 VIB3MultiVisualizerSystem not loaded');
            return;
        }
        
        this.multiVisualizerSystem = new VIB3MultiVisualizerSystem(this, {
            instancesPerSection: 3, // Multiple visualizers per section
            transitionDuration: 1200,
            infiniteScrollSpeed: 0.8
        });
        
        console.log('🎨 Multi-Visualizer System initialized - Multiple instances per section created');
    }
    
    async initializeElementMapper() {
        if (typeof VIB3ElementMapper === 'undefined') {
            console.error('🚨 VIB3ElementMapper not loaded');
            return;
        }
        
        this.elementMapper = new VIB3ElementMapper(this, {
            elementRoles: this.config.elementRoles
        });
        
        console.log('🗺️ Element mapper initialized');
    }
    
    async initializePortalScroll() {
        if (typeof VIB3PortalScroll === 'undefined') {
            console.error('🚨 VIB3PortalScroll not loaded');
            return;
        }
        
        this.portalScroll = new VIB3PortalScroll(this, {
            snapToSections: this.config.snapToSections,
            transitionDuration: this.config.transitionDuration
        });
        
        console.log('🌀 Portal scroll system initialized');
    }
    
    async setupGlobalInteractions() {
        // Mouse movement for GEOMETRIC UI
        document.addEventListener('mousemove', (e) => {
            const mouseX = e.clientX / window.innerWidth;
            const mouseY = 1.0 - (e.clientY / window.innerHeight); // Flip Y for WebGL
            
            // Send to all GEOMETRIC UI renderers
            this.sectionRenderers.forEach((renderer) => {
                renderer.updateInteraction({
                    type: 'mouse',
                    mouseX: mouseX,
                    mouseY: mouseY,
                    intensity: 0.8
                });
            });
            
            // Send to home-master
            if (this.homeMaster) {
                this.homeMaster.updateMasterInteraction({
                    type: 'mouse',
                    mouseX: mouseX,
                    mouseY: mouseY,
                    intensity: 0.3
                });
            }
        });
        
        // Click interactions
        document.addEventListener('click', (e) => {
            const clickX = e.clientX / window.innerWidth;
            const clickY = e.clientY / window.innerHeight;
            
            // Send click to all renderers
            this.sectionRenderers.forEach((renderer) => {
                renderer.updateInteraction({
                    type: 'click',
                    mouseX: clickX,
                    mouseY: clickY,
                    intensity: 0.8
                });
            });
            
            // Send to home-master
            if (this.homeMaster) {
                this.homeMaster.updateMasterInteraction({
                    type: 'click',
                    intensity: 0.6
                });
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Parameter change listener
        document.addEventListener('vib3-parameters-changed', (e) => {
            this.handleParameterChange(e.detail);
        });
        
        console.log('🎯 Global interactions configured');
    }
    
    handleParameterChange(detail) {
        const { derivedParameters, specificSection } = detail;
        
        if (specificSection) {
            // Update specific section
            const renderer = this.sectionRenderers.get(specificSection);
            if (renderer) {
                const params = derivedParameters[specificSection];
                renderer.updateGeometry(renderer.geometry, params.modifier);
            }
        } else {
            // Update all sections
            Object.entries(derivedParameters).forEach(([sectionKey, params]) => {
                const renderer = this.sectionRenderers.get(sectionKey);
                if (renderer) {
                    renderer.updateGeometry(renderer.geometry, params.modifier);
                }
            });
        }
    }
    
    handleResize() {
        this.sectionRenderers.forEach((renderer) => {
            renderer.resize();
        });
        
        // Update element bounds
        if (this.elementMapper) {
            this.elementMapper.updateElementBounds();
        }
        
        console.log('📐 Handled resize');
    }
    
    startRenderLoop() {
        if (this.renderLoopActive) return;
        
        this.renderLoopActive = true;
        
        const render = () => {
            if (!this.renderLoopActive) return;
            
            // Render all active multi-visualizer instances
            if (this.multiVisualizerSystem) {
                this.multiVisualizerSystem.sectionInstances.forEach((instances, sectionKey) => {
                    instances.forEach(instance => {
                        if (instance.isActive) {
                            instance.renderer.render();
                        }
                    });
                });
            }
            
            requestAnimationFrame(render);
        };
        
        render();
        console.log('🎬 Render loop started');
    }
    
    isElementInViewport(element) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Element is visible if any part is in viewport + buffer
        return (rect.bottom > -200 && rect.top < windowHeight + 200);
    }
    
    updateStatusDisplay() {
        const updateInterval = 1000; // Update every second
        
        const update = () => {
            const elements = {
                systemStatus: document.getElementById('system-status'),
                contextCount: document.getElementById('context-count'),
                uiComponentCount: document.getElementById('ui-component-count'),
                activeInstanceCount: document.getElementById('active-instance-count')
            };
            
            if (elements.systemStatus) {
                elements.systemStatus.textContent = this.isInitialized ? 'Active' : 'Initializing';
                elements.systemStatus.style.color = this.isInitialized ? '#0f0' : '#ff0';
            }
            
            if (elements.contextCount) {
                const contextCount = this.sectionRenderers.size;
                elements.contextCount.textContent = contextCount;
                elements.contextCount.style.color = contextCount <= 6 ? '#0f0' : '#f00';
            }
            
            if (elements.uiComponentCount && this.multiVisualizerSystem) {
                let uiComponentCount = 0;
                this.multiVisualizerSystem.sectionInstances.forEach(instances => {
                    instances.forEach(instance => {
                        if (instance.uiComponent) uiComponentCount++;
                    });
                });
                elements.uiComponentCount.textContent = uiComponentCount;
                elements.uiComponentCount.style.color = uiComponentCount > 0 ? '#0f0' : '#ff0';
            }
            
            if (elements.activeInstanceCount && this.multiVisualizerSystem) {
                let activeCount = 0;
                this.multiVisualizerSystem.sectionInstances.forEach(instances => {
                    instances.forEach(instance => {
                        if (instance.isActive) activeCount++;
                    });
                });
                elements.activeInstanceCount.textContent = activeCount;
                elements.activeInstanceCount.style.color = activeCount > 0 ? '#0f0' : '#ff0';
            }
        };
        
        update();
        setInterval(update, updateInterval);
    }
    
    // Section transition callback for portal scroll
    onSectionChange(sectionKey, geometry) {
        console.log(`📍 Section changed to: ${sectionKey} (${geometry})`);
        
        // Update any section-specific logic here
    }
    
    // Public API methods
    activateSection(sectionKey) {
        const renderer = this.sectionRenderers.get(sectionKey);
        if (renderer) {
            renderer.start();
            console.log(`🎬 Activated section: ${sectionKey}`);
        }
    }
    
    pauseSection(sectionKey) {
        const renderer = this.sectionRenderers.get(sectionKey);
        if (renderer) {
            renderer.pause();
            console.log(`⏸️ Paused section: ${sectionKey}`);
        }
    }
    
    updateMasterParameters(params) {
        if (this.homeMaster) {
            this.homeMaster.updateMasterParameters(params);
        }
    }
    
    loadPreset(presetName) {
        if (this.homeMaster) {
            this.homeMaster.loadPreset(presetName);
        }
    }
    
    getSystemStatus() {
        return {
            isInitialized: this.isInitialized,
            sectionCount: this.sections.size,
            rendererCount: this.sectionRenderers.size,
            elementCount: this.elementMapper ? this.elementMapper.getStatus().totalElements : 0,
            homeMasterStatus: this.homeMaster ? this.homeMaster.getStatus() : null,
            portalScrollStatus: this.portalScroll ? this.portalScroll.getScrollState() : null
        };
    }
    
    destroy() {
        this.renderLoopActive = false;
        
        // Destroy all renderers
        this.sectionRenderers.forEach((renderer) => {
            renderer.destroy();
        });
        this.sectionRenderers.clear();
        
        // Destroy subsystems
        if (this.portalScroll) {
            this.portalScroll.destroy();
        }
        
        if (this.elementMapper) {
            this.elementMapper.destroy();
        }
        
        console.log('🗑️ VIB3STYLEPACK system destroyed');
    }
}

// Global initialization
let globalVIB3StylePack = null;

function initializeVIB3StylePack(config = {}) {
    if (globalVIB3StylePack) {
        console.warn('⚠️ VIB3STYLEPACK already initialized');
        return globalVIB3StylePack;
    }
    
    const finalConfig = { ...window.VIB3Config, ...config };
    globalVIB3StylePack = new VIB3StylePack(finalConfig);
    return globalVIB3StylePack;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            initializeVIB3StylePack();
        }, 100);
    });
} else {
    setTimeout(() => {
        initializeVIB3StylePack();
    }, 100);
}

// Export for global access
window.VIB3StylePack = VIB3StylePack;
window.initializeVIB3StylePack = initializeVIB3StylePack;
window.getVIB3StylePack = () => globalVIB3StylePack;

console.log('✅ VIB3STYLEPACK Main System loaded - Auto-initialization enabled');