/**
 * VIB3STYLEPACK MULTI-VISUALIZER SYSTEM
 * Multiple visualizer instances per section forming UI in juxtaposition
 * Morphing transitions between sections with infinite scroll portal effects
 */

console.log('🎨 VIB3STYLEPACK Multi-Visualizer System Loading...');

class VIB3MultiVisualizerSystem {
    constructor(styleSystem, config = {}) {
        this.styleSystem = styleSystem;
        this.config = {
            instancesPerSection: 3, // Multiple visualizers per section
            transitionDuration: 1200, // Smooth morphing time
            portalSnapThreshold: 0.1, // Snap sensitivity
            infiniteScrollSpeed: 0.8,
            ...config
        };
        
        // Multi-instance management
        this.sectionInstances = new Map(); // section -> [instance1, instance2, instance3]
        this.transitionState = {
            isTransitioning: false,
            fromSection: null,
            toSection: null,
            progress: 0
        };
        
        // UI element positioning for each instance role
        this.instanceRoles = {
            'background': { x: 0.5, y: 0.5, size: 1.0, zIndex: 1 },
            'ui-left': { x: 0.25, y: 0.4, size: 0.6, zIndex: 3 },
            'ui-right': { x: 0.75, y: 0.6, size: 0.4, zIndex: 3 },
            'accent': { x: 0.6, y: 0.3, size: 0.3, zIndex: 2 }
        };
        
        this.initialize();
    }
    
    initialize() {
        this.createMultipleInstancesPerSection();
        this.setupInfiniteScrollPortal();
        this.setupMorphingTransitions();
        
        // Activate the first section by default
        this.activateHomeSection();
        
        console.log('🎨 Multi-Visualizer System initialized with multiple instances per section');
    }
    
    activateHomeSection() {
        // Start with home section active
        const homeInstances = this.sectionInstances.get('home');
        if (homeInstances) {
            homeInstances.forEach(instance => {
                instance.isActive = true;
                instance.renderer.start();
            });
            this.activeSection = 'home';
            console.log('🏠 Home section activated with multiple instances');
        }
    }
    
    createMultipleInstancesPerSection() {
        this.styleSystem.sections.forEach((sectionData, sectionKey) => {
            const instances = [];
            
            // Create multiple visualizer instances for this section
            for (let i = 0; i < this.config.instancesPerSection; i++) {
                const instance = this.createVisualizerInstance(sectionKey, sectionData, i);
                instances.push(instance);
            }
            
            this.sectionInstances.set(sectionKey, instances);
            console.log(`🎨 Created ${instances.length} visualizer instances for section [${sectionKey}]`);
        });
    }
    
    createVisualizerInstance(sectionKey, sectionData, instanceIndex) {
        // Create individual canvas for this instance
        const canvas = document.createElement('canvas');
        canvas.id = `vib34d-${sectionKey}-${instanceIndex}`;
        canvas.className = 'vib34d-instance-canvas';
        
        // Role-based positioning
        const roleNames = Object.keys(this.instanceRoles);
        const role = roleNames[instanceIndex] || 'background';
        const roleConfig = this.instanceRoles[role];
        
        canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: auto;
            z-index: ${roleConfig.zIndex};
            transform: scale(${roleConfig.size});
            transform-origin: ${roleConfig.x * 100}% ${roleConfig.y * 100}%;
        `;
        
        // Size canvas
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Add to section
        sectionData.element.appendChild(canvas);
        
        // Create VIB34D instance with role-specific parameters
        const instanceModifier = this.getInstanceModifier(instanceIndex, role);
        const renderer = new VIB34DCore(canvas, {
            instanceId: `${sectionKey}-${role}-${instanceIndex}`,
            role: role,
            modifier: sectionData.modifier * instanceModifier,
            geometry: sectionData.geometry
        });
        
        // Position canvas for UI juxtaposition
        this.positionInstanceCanvas(canvas, role, roleConfig);
        
        return {
            renderer: renderer,
            canvas: canvas,
            role: role,
            instanceIndex: instanceIndex,
            isActive: false
        };
    }
    
    getInstanceModifier(instanceIndex, role) {
        // Different parameter variations for UI juxtaposition
        const modifiers = {
            'background': [1.0, 0.8, 1.2], // Subtle background variations
            'ui-left': [1.3, 1.5, 0.9],    // More dynamic UI elements
            'ui-right': [0.7, 1.1, 1.4],   // Contrasting right side
            'accent': [1.8, 0.6, 2.0]      // High contrast accents
        };
        
        return modifiers[role] ? modifiers[role][instanceIndex] || 1.0 : 1.0;
    }
    
    positionInstanceCanvas(canvas, role, roleConfig) {
        // Create visual juxtaposition through layered positioning
        const clipPath = this.getClipPathForRole(role);
        if (clipPath) {
            canvas.style.clipPath = clipPath;
        }
        
        // Blend modes for interesting interactions
        const blendModes = {
            'background': 'normal',
            'ui-left': 'multiply',
            'ui-right': 'screen',
            'accent': 'overlay'
        };
        
        canvas.style.mixBlendMode = blendModes[role] || 'normal';
        canvas.style.opacity = this.getOpacityForRole(role);
    }
    
    getClipPathForRole(role) {
        // Clip paths to create UI element shapes
        const clipPaths = {
            'ui-left': 'polygon(0% 0%, 60% 0%, 40% 100%, 0% 100%)',
            'ui-right': 'polygon(40% 0%, 100% 0%, 100% 100%, 60% 100%)',
            'accent': 'circle(30% at 60% 30%)'
        };
        
        return clipPaths[role];
    }
    
    getOpacityForRole(role) {
        const opacities = {
            'background': 0.4,
            'ui-left': 0.8,
            'ui-right': 0.7,
            'accent': 0.6
        };
        
        return opacities[role] || 0.5;
    }
    
    setupInfiniteScrollPortal() {
        let scrollVelocity = 0;
        let lastScrollY = window.scrollY;
        let lastScrollTime = Date.now();
        
        document.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            const currentTime = Date.now();
            const deltaY = currentScrollY - lastScrollY;
            const deltaTime = currentTime - lastScrollTime;
            
            if (deltaTime > 0) {
                scrollVelocity = Math.abs(deltaY / deltaTime * 100);
                
                // Fast scroll triggers portal effect
                if (scrollVelocity > 15) {
                    this.triggerPortalEffect(scrollVelocity);
                }
                
                // Update all visualizer instances with scroll reactivity
                this.updateInstancesWithScroll(scrollVelocity, currentScrollY);
                
                // Check for section transitions
                this.checkSectionTransition(currentScrollY);
            }
            
            lastScrollY = currentScrollY;
            lastScrollTime = currentTime;
        });
        
        console.log('♾️ Infinite scroll portal system configured');
    }
    
    updateInstancesWithScroll(velocity, scrollY) {
        this.sectionInstances.forEach((instances, sectionKey) => {
            instances.forEach((instance, index) => {
                if (instance.isActive) {
                    // Different scroll reactions per instance role
                    const scrollMultiplier = this.getScrollMultiplierForRole(instance.role);
                    
                    instance.renderer.updateInteraction({
                        type: 'scroll',
                        scrollVelocity: velocity * scrollMultiplier,
                        scrollPosition: scrollY,
                        intensity: Math.min(velocity / 20, 1.0)
                    });
                }
            });
        });
    }
    
    getScrollMultiplierForRole(role) {
        const multipliers = {
            'background': 0.3,  // Subtle background response
            'ui-left': 1.2,     // Strong UI response
            'ui-right': 0.8,    // Medium UI response
            'accent': 2.0       // Dramatic accent response
        };
        
        return multipliers[role] || 1.0;
    }
    
    triggerPortalEffect(velocity) {
        console.log(`🌀 Portal effect triggered with velocity: ${velocity}`);
        
        // Portal visual effects on all active instances
        this.sectionInstances.forEach((instances) => {
            instances.forEach((instance) => {
                if (instance.isActive) {
                    instance.renderer.updateInteraction({
                        type: 'portal',
                        intensity: Math.min(velocity / 30, 2.0),
                        portalActive: true
                    });
                    
                    // Portal visual effect on canvas
                    instance.canvas.style.transition = 'filter 0.3s ease';
                    instance.canvas.style.filter = `hue-rotate(${velocity * 2}deg) brightness(1.2)`;
                    
                    setTimeout(() => {
                        instance.canvas.style.filter = '';
                    }, 300);
                }
            });
        });
    }
    
    checkSectionTransition(scrollY) {
        const windowHeight = window.innerHeight;
        const scrollCenter = scrollY + windowHeight / 2;
        
        // Find current section
        let currentSection = null;
        this.styleSystem.sections.forEach((sectionData, sectionKey) => {
            const rect = sectionData.element.getBoundingClientRect();
            const sectionTop = scrollY + rect.top;
            const sectionBottom = sectionTop + rect.height;
            
            if (scrollCenter >= sectionTop && scrollCenter < sectionBottom) {
                currentSection = sectionKey;
            }
        });
        
        // Trigger morphing transition if section changed
        if (currentSection && currentSection !== this.activeSection) {
            this.morphToSection(currentSection);
        }
    }
    
    morphToSection(targetSection) {
        if (this.transitionState.isTransitioning) return;
        
        const fromSection = this.activeSection;
        const toSection = targetSection;
        
        console.log(`🔄 Morphing transition: ${fromSection} → ${toSection}`);
        
        this.transitionState = {
            isTransitioning: true,
            fromSection: fromSection,
            toSection: toSection,
            progress: 0
        };
        
        // Deactivate old section instances
        if (fromSection && this.sectionInstances.has(fromSection)) {
            this.sectionInstances.get(fromSection).forEach(instance => {
                instance.isActive = false;
                instance.renderer.pause();
            });
        }
        
        // Activate new section instances
        if (this.sectionInstances.has(toSection)) {
            this.sectionInstances.get(toSection).forEach(instance => {
                instance.isActive = true;
                instance.renderer.start();
            });
        }
        
        this.activeSection = toSection;
        
        // Animated morphing transition
        this.animateMorphingTransition();
    }
    
    animateMorphingTransition() {
        const startTime = Date.now();
        const duration = this.config.transitionDuration;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1.0);
            
            this.transitionState.progress = progress;
            
            // Smooth easing
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            
            // Apply morphing effects to active instances
            if (this.sectionInstances.has(this.activeSection)) {
                this.sectionInstances.get(this.activeSection).forEach((instance, index) => {
                    this.applyMorphingEffect(instance, easedProgress, index);
                });
            }
            
            if (progress < 1.0) {
                requestAnimationFrame(animate);
            } else {
                this.completeMorphingTransition();
            }
        };
        
        animate();
    }
    
    applyMorphingEffect(instance, progress, instanceIndex) {
        // Different morphing effects per instance
        const morphEffects = {
            'background': () => {
                instance.canvas.style.opacity = 0.4 * progress;
                instance.renderer.updateInteraction({
                    type: 'morph',
                    progress: progress,
                    intensity: 0.5
                });
            },
            'ui-left': () => {
                instance.canvas.style.transform = `scale(${0.6 + progress * 0.4}) translateX(${(1 - progress) * -50}px)`;
                instance.renderer.updateInteraction({
                    type: 'morph',
                    progress: progress,
                    intensity: 1.2
                });
            },
            'ui-right': () => {
                instance.canvas.style.transform = `scale(${0.4 + progress * 0.6}) translateX(${(1 - progress) * 50}px)`;
                instance.renderer.updateInteraction({
                    type: 'morph',
                    progress: progress,
                    intensity: 0.8
                });
            },
            'accent': () => {
                instance.canvas.style.opacity = 0.6 * Math.sin(progress * Math.PI);
                instance.renderer.updateInteraction({
                    type: 'morph',
                    progress: progress,
                    intensity: 2.0
                });
            }
        };
        
        const effect = morphEffects[instance.role];
        if (effect) effect();
    }
    
    completeMorphingTransition() {
        this.transitionState.isTransitioning = false;
        
        // Reset all transform effects
        if (this.sectionInstances.has(this.activeSection)) {
            this.sectionInstances.get(this.activeSection).forEach(instance => {
                instance.canvas.style.transition = '';
                // Keep opacity and positioning from role config
                instance.canvas.style.opacity = this.getOpacityForRole(instance.role);
                const roleConfig = this.instanceRoles[instance.role];
                instance.canvas.style.transform = `scale(${roleConfig.size})`;
            });
        }
        
        console.log(`✅ Morphing transition to [${this.activeSection}] complete`);
    }
    
    setupMorphingTransitions() {
        // Enhanced mouse interactions for all instances
        document.addEventListener('mousemove', (e) => {
            const mouseX = e.clientX / window.innerWidth;
            const mouseY = 1.0 - (e.clientY / window.innerHeight);
            
            this.sectionInstances.forEach((instances) => {
                instances.forEach((instance) => {
                    if (instance.isActive) {
                        // Different mouse sensitivity per role
                        const sensitivity = this.getMouseSensitivityForRole(instance.role);
                        
                        instance.renderer.updateInteraction({
                            type: 'mouse',
                            mouseX: mouseX,
                            mouseY: mouseY,
                            intensity: sensitivity
                        });
                    }
                });
            });
        });
        
        console.log('🔄 Morphing transition system configured');
    }
    
    getMouseSensitivityForRole(role) {
        const sensitivities = {
            'background': 0.2,
            'ui-left': 0.8,
            'ui-right': 0.6,
            'accent': 1.2
        };
        
        return sensitivities[role] || 0.5;
    }
    
    // Public API for manual control
    activateSection(sectionKey) {
        this.morphToSection(sectionKey);
    }
    
    setInstancesPerSection(count) {
        this.config.instancesPerSection = count;
        // Would need to recreate instances
    }
    
    getActiveInstances() {
        if (!this.activeSection) return [];
        return this.sectionInstances.get(this.activeSection) || [];
    }
    
    destroy() {
        this.sectionInstances.forEach((instances) => {
            instances.forEach((instance) => {
                instance.renderer.destroy();
            });
        });
        this.sectionInstances.clear();
        
        console.log('🗑️ Multi-Visualizer System destroyed');
    }
}

window.VIB3MultiVisualizerSystem = VIB3MultiVisualizerSystem;
console.log('✅ VIB3STYLEPACK Multi-Visualizer System loaded - Multiple instances per section with morphing transitions ready');