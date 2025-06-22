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
        };
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionKey = entry.target.dataset.vib3Section;
                    if (sectionKey && sectionKey !== this.scrollState.currentSection) {
                        this.transitionToSection(sectionKey);
                    }
                }
            });
        }, options);
        
        // Observe all sections
        this.sectionPositions.forEach((data) => {
            this.observer.observe(data.element);
        });
        
        console.log('👁️ Intersection observer setup complete');
    }
    
    updateScrollEffects() {
        const velocity = this.scrollState.scrollVelocity;
        
        // Send scroll data to home-master for global effects
        if (this.styleSystem.homeMaster) {
            this.styleSystem.homeMaster.updateMasterInteraction({
                type: 'scroll',
                scrollVelocity: velocity,
                intensity: Math.min(velocity / 20, 1.0)
            });
        }
        
        // Portal effects during fast scrolling
        if (velocity > 15 && !this.portalState.isActive) {
            this.activatePortalEffect();
        } else if (velocity < 5 && this.portalState.isActive) {
            this.deactivatePortalEffect();
        }
    }
    
    checkSectionTransition() {
        const currentScrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const scrollCenter = currentScrollY + windowHeight / 2;
        
        // Find which section is at scroll center
        let targetSection = null;
        
        for (let [sectionKey, data] of this.sectionPositions) {
            if (scrollCenter >= data.top && scrollCenter < data.top + data.height) {
                targetSection = sectionKey;
                break;
            }
        }
        
        if (targetSection && targetSection !== this.scrollState.currentSection) {
            this.scrollState.targetSection = targetSection;
            this.initiateGeometryTransition();
        }
    }
    
    transitionToSection(sectionKey) {
        const previousSection = this.scrollState.currentSection;
        this.scrollState.currentSection = sectionKey;
        
        const sectionData = this.sectionPositions.get(sectionKey);
        if (!sectionData) return;
        
        console.log(`🌀 Portal transition: ${previousSection} → ${sectionKey} (${sectionData.geometry})`);
        
        // Update status display
        this.updateStatusDisplay(sectionKey, sectionData.geometry);
        
        // Notify style system of section change
        if (this.styleSystem.onSectionChange) {
            this.styleSystem.onSectionChange(sectionKey, sectionData.geometry);
        }
        
        // Update content based on new geometry
        this.updateContentForSection(sectionKey, sectionData.geometry);
    }
    
    initiateGeometryTransition() {
        if (this.scrollState.isTransitioning) return;
        
        const fromSection = this.scrollState.currentSection;
        const toSection = this.scrollState.targetSection;
        
        const fromData = this.sectionPositions.get(fromSection);
        const toData = this.sectionPositions.get(toSection);
        
        if (!fromData || !toData) return;
        
        this.scrollState.isTransitioning = true;
        
        // Start portal transition
        this.portalState = {
            fromGeometry: fromData.geometry,
            toGeometry: toData.geometry,
            progress: 0,
            isActive: true
        };
        
        console.log(`🌈 Geometry transition: ${fromData.geometry} → ${toData.geometry}`);
        
        // Animate transition
        this.animateGeometryTransition();
    }
    
    animateGeometryTransition() {
        const startTime = Date.now();
        const duration = this.config.transitionDuration;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1.0);
            
            this.portalState.progress = progress;
            
            // Smooth easing
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            
            // Update portal effects
            this.updatePortalEffects(easedProgress);
            
            if (progress < 1.0) {
                requestAnimationFrame(animate);
            } else {
                this.completeGeometryTransition();
            }
        };
        
        animate();
    }
    
    updatePortalEffects(progress) {
        // Increase visual intensity during transition
        const intensity = this.config.portalEffectIntensity * Math.sin(progress * Math.PI);
        
        // Send portal effect to all renderers
        if (this.styleSystem.homeMaster) {
            this.styleSystem.homeMaster.updateMasterInteraction({
                type: 'portal',
                progress: progress,
                intensity: intensity,
                fromGeometry: this.portalState.fromGeometry,
                toGeometry: this.portalState.toGeometry
            });
        }
    }
    
    completeGeometryTransition() {
        this.scrollState.isTransitioning = false;
        this.portalState.isActive = false;
        
        // Finalize section transition
        this.transitionToSection(this.scrollState.targetSection);
        
        console.log('✅ Geometry transition complete');
    }
    
    activatePortalEffect() {
        this.portalState.isActive = true;
        
        // Visual portal effects
        document.body.style.filter = 'hue-rotate(0deg)';
        
        console.log('🌀 Portal effect activated');
    }
    
    deactivatePortalEffect() {
        this.portalState.isActive = false;
        
        // Clear portal effects
        document.body.style.filter = '';
        
        console.log('🌀 Portal effect deactivated');
    }
    
    snapToNearestSection() {
        if (this.scrollState.isTransitioning) return;
        
        const currentScrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        
        let nearestSection = null;
        let minDistance = Infinity;
        
        // Find nearest section center
        for (let [sectionKey, data] of this.sectionPositions) {
            const sectionCenter = data.top + data.height / 2;
            const viewportCenter = currentScrollY + windowHeight / 2;
            const distance = Math.abs(sectionCenter - viewportCenter);
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestSection = { key: sectionKey, data };
            }
        }
        
        if (nearestSection && minDistance > 50) {
            // Smooth scroll to section
            const targetY = nearestSection.data.top;
            
            window.scrollTo({
                top: targetY,
                behavior: 'smooth'
            });
            
            console.log(`📍 Snapped to section: ${nearestSection.key}`);
        }
    }
    
    updateContentForSection(sectionKey, geometry) {
        // Update content based on current geometry
        const titleElements = document.querySelectorAll('[data-vib3-content="title"]');
        const subtitleElements = document.querySelectorAll('[data-vib3-content="subtitle"]');
        
        // Content mapping based on geometry
        const contentMap = {
            hypercube: {
                title: 'Multi-Dimensional Data Architecture',
                subtitle: 'The foundational 4D framework for digital sovereignty'
            },
            tetrahedron: {
                title: 'Structured Knowledge Systems',
                subtitle: 'Technical documentation with stable geometric foundation'
            },
            sphere: {
                title: 'Infinite Potential Media',
                subtitle: 'Dynamic content with spherical flow patterns'
            },
            torus: {
                title: 'Continuous Flow Audio',
                subtitle: 'Temporal content with toroidal geometry'
            },
            wave: {
                title: 'Quantum Philosophy Spaces',
                subtitle: 'Exoditical Moral Architecture principles'
            }
        };
        
        const content = contentMap[geometry];
        if (content) {
            titleElements.forEach(el => {
                if (el.closest(`[data-vib3-section="${sectionKey}"]`)) {
                    el.textContent = content.title;
                }
            });
            
            subtitleElements.forEach(el => {
                if (el.closest(`[data-vib3-section="${sectionKey}"]`)) {
                    el.textContent = content.subtitle;
                }
            });
        }
    }
    
    updateStatusDisplay(sectionKey, geometry) {
        const elements = {
            currentSection: document.getElementById('current-section'),
            currentGeometry: document.getElementById('current-geometry'),
            currentModifier: document.getElementById('current-modifier')
        };
        
        if (elements.currentSection) {
            elements.currentSection.textContent = sectionKey;
        }
        
        if (elements.currentGeometry) {
            elements.currentGeometry.textContent = geometry;
        }
        
        if (elements.currentModifier && window.VIB3Config) {
            const modifier = window.VIB3Config.sectionModifiers[sectionKey] || 1.0;
            elements.currentModifier.textContent = modifier.toFixed(1);
        }
    }
    
    // Get current scroll state for debugging
    getScrollState() {
        return {
            ...this.scrollState,
            portalState: this.portalState,
            sectionCount: this.sectionPositions.size
        };
    }
    
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        console.log('🗑️ Portal scroll system destroyed');
    }
}

window.VIB3PortalScroll = VIB3PortalScroll;
console.log('✅ VIB3STYLEPACK Portal Scroll loaded - Infinite scroll with geometry transitions ready');