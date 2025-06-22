/**
 * VIB3STYLEPACK PORTAL SCROLL SYSTEM
 * Infinite scroll with geometry transitions and snap-to-section
 * Creates portal effects when transitioning between geometries
 */

console.log('🌀 VIB3STYLEPACK Portal Scroll Loading...');

class VIB3PortalScroll {
    constructor(styleSystem, config = {}) {
        this.styleSystem = styleSystem;
        this.config = {
            snapToSections: true,
            transitionDuration: 800,
            portalEffectIntensity: 1.5,
            scrollThreshold: 0.1,
            ...config
        };
        
        // Scroll state
        this.scrollState = {
            currentSection: 'home',
            targetSection: null,
            isTransitioning: false,
            scrollVelocity: 0,
            lastScrollY: 0,
            lastScrollTime: Date.now()
        };
        
        // Section positions
        this.sectionPositions = new Map();
        
        // Portal transition state
        this.portalState = {
            fromGeometry: 'hypercube',
            toGeometry: 'hypercube',
            progress: 0,
            isActive: false
        };
        
        this.initialize();
    }
    
    initialize() {
        this.calculateSectionPositions();
        this.setupScrollListeners();
        this.setupIntersectionObserver();
        
        console.log('🌀 Portal scroll system initialized');
    }
    
    calculateSectionPositions() {
        const sections = document.querySelectorAll('[data-vib3-section]');
        
        sections.forEach((section, index) => {
            const sectionKey = section.dataset.vib3Section;
            const geometry = section.dataset.vib3Geometry;
            
            this.sectionPositions.set(sectionKey, {
                element: section,
                geometry: geometry,
                index: index,
                top: section.offsetTop,
                height: section.offsetHeight
            });
        });
        
        console.log(`📍 Calculated positions for ${this.sectionPositions.size} sections`);
    }
    
    setupScrollListeners() {
        let scrollTimeout;
        
        document.addEventListener('scroll', (e) => {
            const currentTime = Date.now();
            const currentScrollY = window.scrollY;
            
            // Calculate scroll velocity
            const deltaY = currentScrollY - this.scrollState.lastScrollY;
            const deltaTime = currentTime - this.scrollState.lastScrollTime;
            
            if (deltaTime > 0) {
                this.scrollState.scrollVelocity = Math.abs(deltaY / deltaTime * 100);
                
                // Update visual effects based on scroll velocity
                this.updateScrollEffects();
                
                // Check for section transitions
                this.checkSectionTransition();
            }
            
            this.scrollState.lastScrollY = currentScrollY;
            this.scrollState.lastScrollTime = currentTime;
            
            // Snap to section after scroll stops
            if (this.config.snapToSections) {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    this.snapToNearestSection();
                }, 150);
            }
        });
        
        console.log('📜 Scroll listeners configured');
    }
    
    setupIntersectionObserver() {
        const options = {
            rootMargin: '0px',
            threshold: 0.5
        };\n        
        this.observer = new IntersectionObserver((entries) => {\n            entries.forEach(entry => {\n                if (entry.isIntersecting) {\n                    const sectionKey = entry.target.dataset.vib3Section;\n                    if (sectionKey && sectionKey !== this.scrollState.currentSection) {\n                        this.transitionToSection(sectionKey);\n                    }\n                }\n            });\n        }, options);\n        \n        // Observe all sections\n        this.sectionPositions.forEach((data) => {\n            this.observer.observe(data.element);\n        });\n        \n        console.log('👁️ Intersection observer setup complete');\n    }\n    \n    updateScrollEffects() {\n        const velocity = this.scrollState.scrollVelocity;\n        \n        // Send scroll data to home-master for global effects\n        if (this.styleSystem.homeMaster) {\n            this.styleSystem.homeMaster.updateMasterInteraction({\n                type: 'scroll',\n                scrollVelocity: velocity,\n                intensity: Math.min(velocity / 20, 1.0)\n            });\n        }\n        \n        // Portal effects during fast scrolling\n        if (velocity > 15 && !this.portalState.isActive) {\n            this.activatePortalEffect();\n        } else if (velocity < 5 && this.portalState.isActive) {\n            this.deactivatePortalEffect();\n        }\n    }\n    \n    checkSectionTransition() {\n        const currentScrollY = window.scrollY;\n        const windowHeight = window.innerHeight;\n        const scrollCenter = currentScrollY + windowHeight / 2;\n        \n        // Find which section is at scroll center\n        let targetSection = null;\n        \n        for (let [sectionKey, data] of this.sectionPositions) {\n            if (scrollCenter >= data.top && scrollCenter < data.top + data.height) {\n                targetSection = sectionKey;\n                break;\n            }\n        }\n        \n        if (targetSection && targetSection !== this.scrollState.currentSection) {\n            this.scrollState.targetSection = targetSection;\n            this.initiateGeometryTransition();\n        }\n    }\n    \n    transitionToSection(sectionKey) {\n        const previousSection = this.scrollState.currentSection;\n        this.scrollState.currentSection = sectionKey;\n        \n        const sectionData = this.sectionPositions.get(sectionKey);\n        if (!sectionData) return;\n        \n        console.log(`🌀 Portal transition: ${previousSection} → ${sectionKey} (${sectionData.geometry})`);\n        \n        // Update status display\n        this.updateStatusDisplay(sectionKey, sectionData.geometry);\n        \n        // Notify style system of section change\n        if (this.styleSystem.onSectionChange) {\n            this.styleSystem.onSectionChange(sectionKey, sectionData.geometry);\n        }\n        \n        // Update content based on new geometry\n        this.updateContentForSection(sectionKey, sectionData.geometry);\n    }\n    \n    initiateGeometryTransition() {\n        if (this.scrollState.isTransitioning) return;\n        \n        const fromSection = this.scrollState.currentSection;\n        const toSection = this.scrollState.targetSection;\n        \n        const fromData = this.sectionPositions.get(fromSection);\n        const toData = this.sectionPositions.get(toSection);\n        \n        if (!fromData || !toData) return;\n        \n        this.scrollState.isTransitioning = true;\n        \n        // Start portal transition\n        this.portalState = {\n            fromGeometry: fromData.geometry,\n            toGeometry: toData.geometry,\n            progress: 0,\n            isActive: true\n        };\n        \n        console.log(`🌈 Geometry transition: ${fromData.geometry} → ${toData.geometry}`);\n        \n        // Animate transition\n        this.animateGeometryTransition();\n    }\n    \n    animateGeometryTransition() {\n        const startTime = Date.now();\n        const duration = this.config.transitionDuration;\n        \n        const animate = () => {\n            const elapsed = Date.now() - startTime;\n            const progress = Math.min(elapsed / duration, 1.0);\n            \n            this.portalState.progress = progress;\n            \n            // Smooth easing\n            const easedProgress = 1 - Math.pow(1 - progress, 3);\n            \n            // Update portal effects\n            this.updatePortalEffects(easedProgress);\n            \n            if (progress < 1.0) {\n                requestAnimationFrame(animate);\n            } else {\n                this.completeGeometryTransition();\n            }\n        };\n        \n        animate();\n    }\n    \n    updatePortalEffects(progress) {\n        // Increase visual intensity during transition\n        const intensity = this.config.portalEffectIntensity * Math.sin(progress * Math.PI);\n        \n        // Send portal effect to all renderers\n        if (this.styleSystem.homeMaster) {\n            this.styleSystem.homeMaster.updateMasterInteraction({\n                type: 'portal',\n                progress: progress,\n                intensity: intensity,\n                fromGeometry: this.portalState.fromGeometry,\n                toGeometry: this.portalState.toGeometry\n            });\n        }\n    }\n    \n    completeGeometryTransition() {\n        this.scrollState.isTransitioning = false;\n        this.portalState.isActive = false;\n        \n        // Finalize section transition\n        this.transitionToSection(this.scrollState.targetSection);\n        \n        console.log('✅ Geometry transition complete');\n    }\n    \n    activatePortalEffect() {\n        this.portalState.isActive = true;\n        \n        // Visual portal effects\n        document.body.style.filter = 'hue-rotate(0deg)';\n        \n        console.log('🌀 Portal effect activated');\n    }\n    \n    deactivatePortalEffect() {\n        this.portalState.isActive = false;\n        \n        // Clear portal effects\n        document.body.style.filter = '';\n        \n        console.log('🌀 Portal effect deactivated');\n    }\n    \n    snapToNearestSection() {\n        if (this.scrollState.isTransitioning) return;\n        \n        const currentScrollY = window.scrollY;\n        const windowHeight = window.innerHeight;\n        \n        let nearestSection = null;\n        let minDistance = Infinity;\n        \n        // Find nearest section center\n        for (let [sectionKey, data] of this.sectionPositions) {\n            const sectionCenter = data.top + data.height / 2;\n            const viewportCenter = currentScrollY + windowHeight / 2;\n            const distance = Math.abs(sectionCenter - viewportCenter);\n            \n            if (distance < minDistance) {\n                minDistance = distance;\n                nearestSection = { key: sectionKey, data };\n            }\n        }\n        \n        if (nearestSection && minDistance > 50) {\n            // Smooth scroll to section\n            const targetY = nearestSection.data.top;\n            \n            window.scrollTo({\n                top: targetY,\n                behavior: 'smooth'\n            });\n            \n            console.log(`📍 Snapped to section: ${nearestSection.key}`);\n        }\n    }\n    \n    updateContentForSection(sectionKey, geometry) {\n        // Update content based on current geometry\n        const titleElements = document.querySelectorAll('[data-vib3-content=\"title\"]');\n        const subtitleElements = document.querySelectorAll('[data-vib3-content=\"subtitle\"]');\n        \n        // Content mapping based on geometry\n        const contentMap = {\n            hypercube: {\n                title: 'Multi-Dimensional Data Architecture',\n                subtitle: 'The foundational 4D framework for digital sovereignty'\n            },\n            tetrahedron: {\n                title: 'Structured Knowledge Systems',\n                subtitle: 'Technical documentation with stable geometric foundation'\n            },\n            sphere: {\n                title: 'Infinite Potential Media',\n                subtitle: 'Dynamic content with spherical flow patterns'\n            },\n            torus: {\n                title: 'Continuous Flow Audio',\n                subtitle: 'Temporal content with toroidal geometry'\n            },\n            wave: {\n                title: 'Quantum Philosophy Spaces',\n                subtitle: 'Exoditical Moral Architecture principles'\n            }\n        };\n        \n        const content = contentMap[geometry];\n        if (content) {\n            titleElements.forEach(el => {\n                if (el.closest(`[data-vib3-section=\"${sectionKey}\"]`)) {\n                    el.textContent = content.title;\n                }\n            });\n            \n            subtitleElements.forEach(el => {\n                if (el.closest(`[data-vib3-section=\"${sectionKey}\"]`)) {\n                    el.textContent = content.subtitle;\n                }\n            });\n        }\n    }\n    \n    updateStatusDisplay(sectionKey, geometry) {\n        const elements = {\n            currentSection: document.getElementById('current-section'),\n            currentGeometry: document.getElementById('current-geometry'),\n            currentModifier: document.getElementById('current-modifier')\n        };\n        \n        if (elements.currentSection) {\n            elements.currentSection.textContent = sectionKey;\n        }\n        \n        if (elements.currentGeometry) {\n            elements.currentGeometry.textContent = geometry;\n        }\n        \n        if (elements.currentModifier && window.VIB3Config) {\n            const modifier = window.VIB3Config.sectionModifiers[sectionKey] || 1.0;\n            elements.currentModifier.textContent = modifier.toFixed(1);\n        }\n    }\n    \n    // Get current scroll state for debugging\n    getScrollState() {\n        return {\n            ...this.scrollState,\n            portalState: this.portalState,\n            sectionCount: this.sectionPositions.size\n        };\n    }\n    \n    destroy() {\n        if (this.observer) {\n            this.observer.disconnect();\n        }\n        \n        console.log('🗑️ Portal scroll system destroyed');\n    }\n}\n\nwindow.VIB3PortalScroll = VIB3PortalScroll;\nconsole.log('✅ VIB3STYLEPACK Portal Scroll loaded - Infinite scroll with geometry transitions ready');