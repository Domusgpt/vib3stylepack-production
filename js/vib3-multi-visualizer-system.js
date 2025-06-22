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
        
        // Enhanced UI element positioning with dynamic parameters
        this.instanceRoles = {
            'background': { 
                x: 0.5, y: 0.5, size: 1.0, zIndex: 1,
                gridScale: 0.8, morphScale: 0.6, rotationScale: 0.4,
                dimensionBoost: 0.0, interactionSensitivity: 0.3
            },
            'ui-left': { 
                x: 0.2, y: 0.3, size: 0.7, zIndex: 3,
                gridScale: 1.5, morphScale: 1.2, rotationScale: 1.0,
                dimensionBoost: 0.3, interactionSensitivity: 1.2
            },
            'ui-right': { 
                x: 0.8, y: 0.7, size: 0.5, zIndex: 3,
                gridScale: 1.8, morphScale: 0.9, rotationScale: 1.4,
                dimensionBoost: 0.2, interactionSensitivity: 0.9
            },
            'accent': { 
                x: 0.6, y: 0.15, size: 0.35, zIndex: 4,
                gridScale: 2.2, morphScale: 1.8, rotationScale: 0.6,
                dimensionBoost: 0.6, interactionSensitivity: 2.0
            }
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
            border-radius: ${this.getBorderRadiusForRole(role)};
            backdrop-filter: ${this.getBackdropFilterForRole(role)};
            box-shadow: ${this.getBoxShadowForRole(role)};
        `;
        
        // Size canvas
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Add to section
        sectionData.element.appendChild(canvas);
        
        // Create VIB34D instance with enhanced role-specific parameters
        const instanceModifier = this.getInstanceModifier(instanceIndex, role);
        const colorInversion = this.getColorInversionForRole(role, instanceIndex);
        const parameterEnhancements = this.getParameterEnhancementsForRole(role, sectionData);
        
        const renderer = new VIB34DCore(canvas, {
            instanceId: `${sectionKey}-${role}-${instanceIndex}`,
            role: role,
            modifier: sectionData.modifier * instanceModifier,
            geometry: sectionData.geometry,
            colorInversion: colorInversion,
            parameterEnhancements: parameterEnhancements
        });
        
        // Position canvas for UI juxtaposition
        this.positionInstanceCanvas(canvas, role, roleConfig);
        
        // Store renderer reference on canvas for UI component interactions
        canvas.__vib34d_renderer = renderer;
        
        // Create UI component wrapper for this visualizer instance
        const uiComponent = this.createUIComponent(canvas, role, sectionKey, instanceIndex);
        
        return {
            renderer: renderer,
            canvas: canvas,
            role: role,
            instanceIndex: instanceIndex,
            isActive: false,
            uiComponent: uiComponent
        };
    }
    
    getInstanceModifier(instanceIndex, role) {
        // Enhanced parameter variations for glassmorphic UI juxtaposition
        const modifiers = {
            'background': [0.8, 1.0, 0.6], // Subtle background variations
            'ui-left': [1.4, 1.8, 1.1],    // Strong UI presence
            'ui-right': [0.9, 1.3, 1.6],   // Contrasting dynamics
            'accent': [2.2, 0.4, 2.8]      // Dramatic accent variations
        };
        
        return modifiers[role] ? modifiers[role][instanceIndex] || 1.0 : 1.0;
    }
    
    positionInstanceCanvas(canvas, role, roleConfig) {
        // Create visual juxtaposition through layered positioning
        const clipPath = this.getClipPathForRole(role);
        if (clipPath) {
            canvas.style.clipPath = clipPath;
        }
        
        // Enhanced glassmorphic blend modes and effects
        const blendModes = {
            'background': 'normal',
            'ui-left': 'multiply',
            'ui-right': 'screen',
            'accent': 'color-dodge'
        };
        
        canvas.style.mixBlendMode = blendModes[role] || 'normal';
        canvas.style.opacity = this.getOpacityForRole(role);
        
        // Apply glassmorphic styling
        this.applyGlassmorphicStyling(canvas, role);
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
            'background': 0.3,
            'ui-left': 0.85,
            'ui-right': 0.75,
            'accent': 0.9
        };
        
        return opacities[role] || 0.5;
    }
    
    getBorderRadiusForRole(role) {
        const borderRadius = {
            'background': '0px',
            'ui-left': '20px 0px 0px 20px',
            'ui-right': '0px 20px 20px 0px',
            'accent': '50%'
        };
        
        return borderRadius[role] || '10px';
    }
    
    getBackdropFilterForRole(role) {
        const filters = {
            'background': 'blur(0px)',
            'ui-left': 'blur(12px) saturate(1.8)',
            'ui-right': 'blur(8px) saturate(1.4)',
            'accent': 'blur(20px) saturate(2.2) brightness(1.2)'
        };
        
        return filters[role] || 'blur(4px)';
    }
    
    getBoxShadowForRole(role) {
        const shadows = {
            'background': 'none',
            'ui-left': 'inset 0 0 40px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.3)',
            'ui-right': 'inset 0 0 30px rgba(255,255,255,0.08), 0 4px 24px rgba(0,0,0,0.2)',
            'accent': 'inset 0 0 60px rgba(255,255,255,0.15), 0 12px 40px rgba(0,0,0,0.4)'
        };
        
        return shadows[role] || '0 4px 16px rgba(0,0,0,0.1)';
    }
    
    getColorInversionForRole(role, instanceIndex) {
        // Create color inversions for dramatic UI juxtaposition
        const inversions = {
            'background': [
                { hue: 0, saturation: 1.0, brightness: 1.0 },      // Base colors
                { hue: 30, saturation: 0.8, brightness: 0.9 },     // Slight warm shift
                { hue: -20, saturation: 1.2, brightness: 1.1 }     // Cool bright shift
            ],
            'ui-left': [
                { hue: 120, saturation: 1.5, brightness: 1.2 },    // Green-cyan shift
                { hue: 180, saturation: 2.0, brightness: 0.8 },    // Full cyan inversion
                { hue: 60, saturation: 1.3, brightness: 1.4 }      // Yellow-green shift
            ],
            'ui-right': [
                { hue: -60, saturation: 1.2, brightness: 0.9 },    // Purple shift
                { hue: -120, saturation: 1.8, brightness: 1.1 },   // Deep blue inversion
                { hue: -30, saturation: 1.4, brightness: 1.3 }     // Magenta shift
            ],
            'accent': [
                { hue: 180, saturation: 2.5, brightness: 1.5 },    // Full complement inversion
                { hue: -90, saturation: 0.5, brightness: 0.7 },    // Dramatic desaturation
                { hue: 90, saturation: 3.0, brightness: 1.8 }      // Extreme saturation boost
            ]
        };
        
        const roleInversions = inversions[role] || inversions.background;
        return roleInversions[instanceIndex] || roleInversions[0];
    }
    
    applyGlassmorphicStyling(canvas, role) {
        // Additional glassmorphic effects beyond CSS
        const parent = canvas.parentElement;
        if (!parent) return;
        
        // Create glassmorphic container overlay
        if (!parent.querySelector(`.glassmorphic-overlay-${role}`)) {
            const overlay = document.createElement('div');
            overlay.className = `glassmorphic-overlay-${role}`;
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: ${canvas.style.zIndex + 1};
                background: ${this.getGlassmorphicGradient(role)};
                border: ${this.getGlassmorphicBorder(role)};
                border-radius: ${this.getBorderRadiusForRole(role)};
                opacity: 0.15;
            `;
            parent.appendChild(overlay);
        }
    }
    
    getGlassmorphicGradient(role) {
        const gradients = {
            'background': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            'ui-left': 'linear-gradient(135deg, rgba(0,255,255,0.2) 0%, rgba(255,0,255,0.1) 100%)',
            'ui-right': 'linear-gradient(45deg, rgba(255,255,0,0.15) 0%, rgba(255,0,0,0.08) 100%)',
            'accent': 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 70%)'
        };
        
        return gradients[role] || gradients.background;
    }
    
    getGlassmorphicBorder(role) {
        const borders = {
            'background': 'none',
            'ui-left': '1px solid rgba(0,255,255,0.3)',
            'ui-right': '1px solid rgba(255,255,0,0.25)',
            'accent': '2px solid rgba(255,255,255,0.4)'
        };
        
        return borders[role] || '1px solid rgba(255,255,255,0.1)';
    }
    
    getParameterEnhancementsForRole(role, sectionData) {
        // Enhanced parameter differentiation based on role and section
        const roleConfig = this.instanceRoles[role];
        const baseGeometry = sectionData.geometry;
        
        // Geometry-specific enhancements
        const geometryEnhancements = {
            'hypercube': {
                dimensionBoostMultiplier: 1.0,
                gridComplexity: 1.0,
                morphingStyle: 'smooth'
            },
            'tetrahedron': {
                dimensionBoostMultiplier: 0.8,
                gridComplexity: 1.2,
                morphingStyle: 'sharp'
            },
            'sphere': {
                dimensionBoostMultiplier: 1.3,
                gridComplexity: 0.9,
                morphingStyle: 'flowing'
            },
            'torus': {
                dimensionBoostMultiplier: 1.1,
                gridComplexity: 1.1,
                morphingStyle: 'continuous'
            },
            'wave': {
                dimensionBoostMultiplier: 1.4,
                gridComplexity: 0.7,
                morphingStyle: 'oscillating'
            }
        };
        
        const geomEnhancement = geometryEnhancements[baseGeometry] || geometryEnhancements.hypercube;
        
        return {
            gridScale: roleConfig.gridScale * geomEnhancement.gridComplexity,
            morphScale: roleConfig.morphScale,
            rotationScale: roleConfig.rotationScale,
            dimensionBoost: roleConfig.dimensionBoost * geomEnhancement.dimensionBoostMultiplier,
            interactionSensitivity: roleConfig.interactionSensitivity,
            morphingStyle: geomEnhancement.morphingStyle,
            geometryComplexity: geomEnhancement.gridComplexity
        };
    }
    
    createUIComponent(canvas, role, sectionKey, instanceIndex) {
        // Create interactive UI component overlay using the visualizer as background
        const parent = canvas.parentElement;
        if (!parent) {
            console.warn(`⚠️ No parent element for canvas [${sectionKey}-${role}]`);
            return null;
        }
        
        try {
            const componentWrapper = document.createElement('div');
            componentWrapper.className = `vib3-ui-component vib3-${role}`;
            componentWrapper.id = `ui-${sectionKey}-${role}-${instanceIndex}`;
            
            // Get proper z-index value
            const canvasZIndex = canvas.style.zIndex || '1';
            const componentZIndex = parseInt(canvasZIndex) + 10;
            
            // Position over the canvas
            componentWrapper.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: auto;
                z-index: ${componentZIndex};
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            
            // Create role-specific UI content
            const uiContent = this.createUIContentForRole(role, sectionKey, instanceIndex);
            if (uiContent) {
                componentWrapper.appendChild(uiContent);
            }
            
            // Add interactive behaviors
            this.addUIComponentInteractivity(componentWrapper, canvas, role);
            
            parent.appendChild(componentWrapper);
            
            console.log(`✅ UI Component created: [${sectionKey}-${role}] z-index: ${componentZIndex}`);
            return componentWrapper;
            
        } catch (error) {
            console.error(`🚨 Error creating UI component [${sectionKey}-${role}]:`, error);
            return null;
        }
    }
    
    createUIContentForRole(role, sectionKey, instanceIndex) {
        const content = document.createElement('div');
        content.className = `vib3-ui-content vib3-${role}-content`;
        
        switch(role) {
            case 'background':
                // Background instances don't need visible UI content
                content.style.display = 'none';
                break;
                
            case 'ui-left':
                content.innerHTML = this.createNavigationPanel(sectionKey);
                content.style.cssText = `
                    background: rgba(0,255,255,0.1);
                    border: 1px solid rgba(0,255,255,0.3);
                    border-radius: 15px;
                    padding: 1.5rem;
                    backdrop-filter: blur(20px);
                    max-width: 250px;
                    margin-left: -30%;
                `;
                break;
                
            case 'ui-right':
                content.innerHTML = this.createActionPanel(sectionKey);
                content.style.cssText = `
                    background: rgba(255,255,0,0.1);
                    border: 1px solid rgba(255,255,0,0.3);
                    border-radius: 15px;
                    padding: 1.5rem;
                    backdrop-filter: blur(20px);
                    max-width: 200px;
                    margin-right: -30%;
                `;
                break;
                
            case 'accent':
                content.innerHTML = this.createFloatingButton(sectionKey);
                content.style.cssText = `
                    background: rgba(255,255,255,0.15);
                    border: 2px solid rgba(255,255,255,0.4);
                    border-radius: 50%;
                    width: 80px;
                    height: 80px;
                    backdrop-filter: blur(25px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                `;
                break;
        }
        
        return content;
    }
    
    createNavigationPanel(sectionKey) {
        const navItems = {
            'home': ['Dashboard', 'Overview', 'Quick Start'],
            'articles': ['Latest', 'Categories', 'Archive'],
            'videos': ['Tutorials', 'Demos', 'Webinars'],
            'podcasts': ['Episodes', 'Series', 'Hosts'],
            'ema': ['Principles', 'Case Studies', 'Community']
        };
        
        const items = navItems[sectionKey] || ['Item 1', 'Item 2', 'Item 3'];
        return `
            <div class="vib3-nav-panel">
                <h4 style="color: rgba(0,255,255,0.9); margin-bottom: 1rem; font-size: 0.9rem;">
                    ${sectionKey.toUpperCase()} MENU
                </h4>
                ${items.map(item => `
                    <div class="vib3-nav-item" style="
                        padding: 0.5rem 0;
                        color: rgba(255,255,255,0.8);
                        font-size: 0.8rem;
                        cursor: pointer;
                        border-bottom: 1px solid rgba(0,255,255,0.2);
                        transition: all 0.2s ease;
                    " onmouseover="this.style.color='rgba(0,255,255,1)'" 
                       onmouseout="this.style.color='rgba(255,255,255,0.8)'">
                        ${item}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    createActionPanel(sectionKey) {
        const actions = {
            'home': ['Get Started', 'Learn More', 'Contact'],
            'articles': ['Read Now', 'Subscribe', 'Share'],
            'videos': ['Watch', 'Download', 'Subscribe'],
            'podcasts': ['Listen', 'Subscribe', 'Download'],
            'ema': ['Join Movement', 'Contribute', 'Learn']
        };
        
        const actionItems = actions[sectionKey] || ['Action 1', 'Action 2', 'Action 3'];
        return `
            <div class="vib3-action-panel">
                <h4 style="color: rgba(255,255,0,0.9); margin-bottom: 1rem; font-size: 0.9rem;">
                    ACTIONS
                </h4>
                ${actionItems.map(action => `
                    <button class="vib3-action-btn" style="
                        display: block;
                        width: 100%;
                        padding: 0.7rem;
                        margin: 0.5rem 0;
                        background: rgba(255,255,0,0.1);
                        border: 1px solid rgba(255,255,0,0.3);
                        border-radius: 8px;
                        color: rgba(255,255,255,0.9);
                        font-size: 0.8rem;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                    " onmouseover="this.style.background='rgba(255,255,0,0.2)'" 
                       onmouseout="this.style.background='rgba(255,255,0,0.1)'">
                        ${action}
                    </button>
                `).join('')}
            </div>
        `;
    }
    
    createFloatingButton(sectionKey) {
        const icons = {
            'home': '🏠',
            'articles': '📖',
            'videos': '🎥',
            'podcasts': '🎧',
            'ema': '⚡'
        };
        
        const icon = icons[sectionKey] || '●';
        return `
            <div style="font-size: 1.5rem; color: rgba(255,255,255,0.9);">
                ${icon}
            </div>
        `;
    }
    
    addUIComponentInteractivity(componentWrapper, canvas, role) {
        const renderer = canvas.__vib34d_renderer;
        
        // Click interactions
        componentWrapper.addEventListener('click', (e) => {
            console.log(`🎯 UI Component clicked: ${role}`);
            
            // Trigger visual feedback on the visualizer
            if (renderer) {
                renderer.updateInteraction({
                    type: 'click',
                    intensity: 1.0,
                    mouseX: e.offsetX / componentWrapper.offsetWidth,
                    mouseY: e.offsetY / componentWrapper.offsetHeight
                });
            }
            
            // Role-specific click actions
            this.handleUIComponentClick(role, componentWrapper);
            
            e.stopPropagation();
        });
        
        // Hover effects
        componentWrapper.addEventListener('mouseenter', () => {
            componentWrapper.style.transform = 'scale(1.02)';
            
            if (renderer) {
                renderer.updateInteraction({
                    type: 'hover',
                    intensity: 0.6
                });
            }
        });
        
        componentWrapper.addEventListener('mouseleave', () => {
            componentWrapper.style.transform = 'scale(1.0)';
            
            if (renderer) {
                renderer.updateInteraction({
                    type: 'hover',
                    intensity: 0.0
                });
            }
        });
        
        // Renderer reference already stored during creation
    }
    
    handleUIComponentClick(role, componentWrapper) {
        switch(role) {
            case 'ui-left':
                console.log('📋 Navigation panel activated');
                componentWrapper.style.animation = 'pulse 0.3s ease';
                setTimeout(() => componentWrapper.style.animation = '', 300);
                break;
                
            case 'ui-right':
                console.log('⚡ Action panel activated');
                componentWrapper.style.animation = 'bounce 0.4s ease';
                setTimeout(() => componentWrapper.style.animation = '', 400);
                break;
                
            case 'accent':
                console.log('🎯 Floating button activated');
                componentWrapper.style.animation = 'spin 0.5s ease';
                setTimeout(() => componentWrapper.style.animation = '', 500);
                break;
        }
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