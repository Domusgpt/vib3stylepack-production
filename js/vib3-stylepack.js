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
        
        // Section renderers (one per section)
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
            
            // Step 3: Create section renderers (canvas consolidation)
            await this.createSectionRenderers();
            
            // Step 4: Initialize element mapper
            await this.initializeElementMapper();
            
            // Step 5: Initialize portal scroll system
            if (this.config.enablePortalScroll) {\n                await this.initializePortalScroll();\n            }\n            \n            // Step 6: Setup global interactions\n            await this.setupGlobalInteractions();\n            \n            // Step 7: Start render loop\n            this.startRenderLoop();\n            \n            // Step 8: Update status display\n            this.updateStatusDisplay();\n            \n            this.isInitialized = true;\n            console.log(`✅ VIB3STYLEPACK initialized with ${this.sectionRenderers.size} renderers`);\n            \n        } catch (error) {\n            console.error('🚨 VIB3STYLEPACK initialization failed:', error);\n        }\n    }\n    \n    async initializeHomeMaster() {\n        if (typeof VIB3HomeMaster === 'undefined') {\n            console.error('🚨 VIB3HomeMaster not loaded');\n            return;\n        }\n        \n        this.homeMaster = new VIB3HomeMaster({\n            sectionModifiers: this.config.sectionModifiers\n        });\n        \n        console.log('🏠 Home-Master system initialized');\n    }\n    \n    async detectSections() {\n        const sectionElements = document.querySelectorAll('[data-vib3-section]');\n        \n        sectionElements.forEach((element) => {\n            const sectionKey = element.dataset.vib3Section;\n            const geometry = element.dataset.vib3Geometry || this.config.sectionGeometries[sectionKey] || 'hypercube';\n            const modifier = parseFloat(element.dataset.vib3Modifier) || this.config.sectionModifiers[sectionKey] || 1.0;\n            \n            this.sections.set(sectionKey, {\n                element: element,\n                geometry: geometry,\n                modifier: modifier,\n                isVisible: false,\n                isActive: false\n            });\n            \n            console.log(`📍 Detected section [${sectionKey}] with geometry: ${geometry}`);\n        });\n        \n        console.log(`📍 Detected ${this.sections.size} sections`);\n    }\n    \n    async createSectionRenderers() {\n        // Create ONE renderer per section (canvas consolidation)\n        for (let [sectionKey, sectionData] of this.sections) {\n            await this.createSectionRenderer(sectionKey, sectionData);\n        }\n        \n        console.log(`🎨 Created ${this.sectionRenderers.size} section renderers`);\n    }\n    \n    async createSectionRenderer(sectionKey, sectionData) {\n        if (typeof VIB3Core === 'undefined') {\n            console.error('🚨 VIB3Core not loaded');\n            return;\n        }\n        \n        // Create canvas for this section\n        const canvas = document.createElement('canvas');\n        canvas.id = `vib3-canvas-${sectionKey}`;\n        canvas.className = 'vib3-section-canvas';\n        canvas.style.cssText = `\n            position: absolute;\n            top: 0;\n            left: 0;\n            width: 100%;\n            height: 100%;\n            pointer-events: none;\n            z-index: 1;\n        `;\n        \n        // Size canvas\n        canvas.width = window.innerWidth;\n        canvas.height = window.innerHeight;\n        \n        // Add to section\n        sectionData.element.style.position = 'relative';\n        sectionData.element.insertBefore(canvas, sectionData.element.firstChild);\n        \n        // Create renderer\n        const renderer = new VIB3Core(canvas, {\n            sectionKey: sectionKey,\n            geometry: sectionData.geometry,\n            modifier: sectionData.modifier\n        });\n        \n        this.sectionRenderers.set(sectionKey, renderer);\n        \n        console.log(`🎨 Created renderer for section [${sectionKey}]`);\n    }\n    \n    async initializeElementMapper() {\n        if (typeof VIB3ElementMapper === 'undefined') {\n            console.error('🚨 VIB3ElementMapper not loaded');\n            return;\n        }\n        \n        this.elementMapper = new VIB3ElementMapper(this, {\n            elementRoles: this.config.elementRoles\n        });\n        \n        console.log('🗺️ Element mapper initialized');\n    }\n    \n    async initializePortalScroll() {\n        if (typeof VIB3PortalScroll === 'undefined') {\n            console.error('🚨 VIB3PortalScroll not loaded');\n            return;\n        }\n        \n        this.portalScroll = new VIB3PortalScroll(this, {\n            snapToSections: this.config.snapToSections,\n            transitionDuration: this.config.transitionDuration\n        });\n        \n        console.log('🌀 Portal scroll system initialized');\n    }\n    \n    async setupGlobalInteractions() {\n        // Mouse movement\n        document.addEventListener('mousemove', (e) => {\n            const mouseX = e.clientX / window.innerWidth;\n            const mouseY = e.clientY / window.innerHeight;\n            \n            // Send to all renderers\n            this.sectionRenderers.forEach((renderer) => {\n                renderer.updateInteraction({\n                    type: 'mouse',\n                    mouseX: mouseX,\n                    mouseY: mouseY,\n                    intensity: 0.2\n                });\n            });\n            \n            // Send to home-master\n            if (this.homeMaster) {\n                this.homeMaster.updateMasterInteraction({\n                    type: 'mouse',\n                    mouseX: mouseX,\n                    mouseY: mouseY,\n                    intensity: 0.1\n                });\n            }\n        });\n        \n        // Click interactions\n        document.addEventListener('click', (e) => {\n            const clickX = e.clientX / window.innerWidth;\n            const clickY = e.clientY / window.innerHeight;\n            \n            // Send click to all renderers\n            this.sectionRenderers.forEach((renderer) => {\n                renderer.updateInteraction({\n                    type: 'click',\n                    mouseX: clickX,\n                    mouseY: clickY,\n                    intensity: 0.8\n                });\n            });\n            \n            // Send to home-master\n            if (this.homeMaster) {\n                this.homeMaster.updateMasterInteraction({\n                    type: 'click',\n                    intensity: 0.6\n                });\n            }\n        });\n        \n        // Window resize\n        window.addEventListener('resize', () => {\n            this.handleResize();\n        });\n        \n        // Parameter change listener\n        document.addEventListener('vib3-parameters-changed', (e) => {\n            this.handleParameterChange(e.detail);\n        });\n        \n        console.log('🎯 Global interactions configured');\n    }\n    \n    handleParameterChange(detail) {\n        const { derivedParameters, specificSection } = detail;\n        \n        if (specificSection) {\n            // Update specific section\n            const renderer = this.sectionRenderers.get(specificSection);\n            if (renderer) {\n                const params = derivedParameters[specificSection];\n                renderer.updateGeometry(renderer.geometry, params.modifier);\n            }\n        } else {\n            // Update all sections\n            Object.entries(derivedParameters).forEach(([sectionKey, params]) => {\n                const renderer = this.sectionRenderers.get(sectionKey);\n                if (renderer) {\n                    renderer.updateGeometry(renderer.geometry, params.modifier);\n                }\n            });\n        }\n    }\n    \n    handleResize() {\n        this.sectionRenderers.forEach((renderer) => {\n            renderer.resize();\n        });\n        \n        // Update element bounds\n        if (this.elementMapper) {\n            this.elementMapper.updateElementBounds();\n        }\n        \n        console.log('📐 Handled resize');\n    }\n    \n    startRenderLoop() {\n        if (this.renderLoopActive) return;\n        \n        this.renderLoopActive = true;\n        \n        const render = () => {\n            if (!this.renderLoopActive) return;\n            \n            // Render all active section renderers\n            this.sectionRenderers.forEach((renderer, sectionKey) => {\n                const sectionData = this.sections.get(sectionKey);\n                \n                // Only render visible sections\n                if (this.isElementInViewport(sectionData.element)) {\n                    if (!renderer.isActive) {\n                        renderer.start();\n                    }\n                    renderer.render();\n                } else {\n                    if (renderer.isActive) {\n                        renderer.pause();\n                    }\n                }\n            });\n            \n            requestAnimationFrame(render);\n        };\n        \n        render();\n        console.log('🎬 Render loop started');\n    }\n    \n    isElementInViewport(element) {\n        const rect = element.getBoundingClientRect();\n        const windowHeight = window.innerHeight;\n        \n        // Element is visible if any part is in viewport + buffer\n        return (rect.bottom > -200 && rect.top < windowHeight + 200);\n    }\n    \n    updateStatusDisplay() {\n        const updateInterval = 1000; // Update every second\n        \n        const update = () => {\n            const elements = {\n                systemStatus: document.getElementById('system-status'),\n                contextCount: document.getElementById('context-count'),\n                elementCount: document.getElementById('element-count')\n            };\n            \n            if (elements.systemStatus) {\n                elements.systemStatus.textContent = this.isInitialized ? 'Active' : 'Initializing';\n                elements.systemStatus.style.color = this.isInitialized ? '#0f0' : '#ff0';\n            }\n            \n            if (elements.contextCount) {\n                const contextCount = this.sectionRenderers.size;\n                elements.contextCount.textContent = contextCount;\n                elements.contextCount.style.color = contextCount <= 6 ? '#0f0' : '#f00';\n            }\n            \n            if (elements.elementCount && this.elementMapper) {\n                const status = this.elementMapper.getStatus();\n                elements.elementCount.textContent = status.totalElements;\n            }\n        };\n        \n        update();\n        setInterval(update, updateInterval);\n    }\n    \n    // Section transition callback for portal scroll\n    onSectionChange(sectionKey, geometry) {\n        console.log(`📍 Section changed to: ${sectionKey} (${geometry})`);\n        \n        // Update any section-specific logic here\n    }\n    \n    // Public API methods\n    activateSection(sectionKey) {\n        const renderer = this.sectionRenderers.get(sectionKey);\n        if (renderer) {\n            renderer.start();\n            console.log(`🎬 Activated section: ${sectionKey}`);\n        }\n    }\n    \n    pauseSection(sectionKey) {\n        const renderer = this.sectionRenderers.get(sectionKey);\n        if (renderer) {\n            renderer.pause();\n            console.log(`⏸️ Paused section: ${sectionKey}`);\n        }\n    }\n    \n    updateMasterParameters(params) {\n        if (this.homeMaster) {\n            this.homeMaster.updateMasterParameters(params);\n        }\n    }\n    \n    loadPreset(presetName) {\n        if (this.homeMaster) {\n            this.homeMaster.loadPreset(presetName);\n        }\n    }\n    \n    getSystemStatus() {\n        return {\n            isInitialized: this.isInitialized,\n            sectionCount: this.sections.size,\n            rendererCount: this.sectionRenderers.size,\n            elementCount: this.elementMapper ? this.elementMapper.getStatus().totalElements : 0,\n            homeMasterStatus: this.homeMaster ? this.homeMaster.getStatus() : null,\n            portalScrollStatus: this.portalScroll ? this.portalScroll.getScrollState() : null\n        };\n    }\n    \n    destroy() {\n        this.renderLoopActive = false;\n        \n        // Destroy all renderers\n        this.sectionRenderers.forEach((renderer) => {\n            renderer.destroy();\n        });\n        this.sectionRenderers.clear();\n        \n        // Destroy subsystems\n        if (this.portalScroll) {\n            this.portalScroll.destroy();\n        }\n        \n        if (this.elementMapper) {\n            this.elementMapper.destroy();\n        }\n        \n        console.log('🗑️ VIB3STYLEPACK system destroyed');\n    }\n}\n\n// Global initialization\nlet globalVIB3StylePack = null;\n\nfunction initializeVIB3StylePack(config = {}) {\n    if (globalVIB3StylePack) {\n        console.warn('⚠️ VIB3STYLEPACK already initialized');\n        return globalVIB3StylePack;\n    }\n    \n    const finalConfig = { ...window.VIB3Config, ...config };\n    globalVIB3StylePack = new VIB3StylePack(finalConfig);\n    return globalVIB3StylePack;\n}\n\n// Auto-initialize when DOM is ready\nif (document.readyState === 'loading') {\n    document.addEventListener('DOMContentLoaded', () => {\n        setTimeout(() => {\n            initializeVIB3StylePack();\n        }, 100);\n    });\n} else {\n    setTimeout(() => {\n        initializeVIB3StylePack();\n    }, 100);\n}\n\n// Export for global access\nwindow.VIB3StylePack = VIB3StylePack;\nwindow.initializeVIB3StylePack = initializeVIB3StylePack;\nwindow.getVIB3StylePack = () => globalVIB3StylePack;\n\nconsole.log('✅ VIB3STYLEPACK Main System loaded - Auto-initialization enabled');