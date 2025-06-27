/**
 * VIB3STYLEPACK ELEMENT MAPPER
 * Maps HTML elements to geometry variations
 * Same geometry, different colors/effects for different UI roles
 */

console.log('🗺️ VIB3STYLEPACK Element Mapper Loading...');

class VIB3ElementMapper {
    constructor(styleSystem, config = {}) {
        this.styleSystem = styleSystem;
        this.config = {
            elementRoles: {
                background: { modifier: 0.7, color: [1,0,1], opacity: 0.8 }, // Magenta
                content: { modifier: 1.0, color: [0,1,1], opacity: 0.6 },    // Cyan
                accent: { modifier: 1.3, color: [1,1,0], opacity: 0.4 },     // Yellow
                navigation: { modifier: 0.9, color: [0,1,0], opacity: 0.7 }  // Green
            },
            ...config
        };
        
        // Element registry
        this.mappedElements = new Map();
        this.sectionElements = new Map();
        
        this.initialize();
    }
    
    initialize() {
        this.scanForElements();
        this.setupElementInteractions();
        this.createElementVariations();
        
        console.log(`🗺️ Element mapper initialized with ${this.mappedElements.size} elements`);
    }
    
    scanForElements() {
        // Scan for elements with data-vib3-element attributes
        const elements = document.querySelectorAll('[data-vib3-element]');
        
        elements.forEach((element, index) => {
            const role = element.dataset.vib3Element;
            const sectionElement = element.closest('[data-vib3-section]');
            const sectionKey = sectionElement ? sectionElement.dataset.vib3Section : 'global';
            
            const elementData = {
                element: element,
                role: role,
                sectionKey: sectionKey,
                id: `element-${index}`,
                bounds: element.getBoundingClientRect(),
                isHovered: false,
                isActive: false
            };
            
            this.mappedElements.set(element, elementData);
            
            // Group by section
            if (!this.sectionElements.has(sectionKey)) {
                this.sectionElements.set(sectionKey, []);
            }
            this.sectionElements.get(sectionKey).push(elementData);
            
            console.log(`📍 Mapped ${role} element in section ${sectionKey}`);
        });
    }
    
    setupElementInteractions() {
        this.mappedElements.forEach((elementData, element) => {
            // Hover effects
            element.addEventListener('mouseenter', () => {
                this.activateElement(elementData);
            });
            
            element.addEventListener('mouseleave', () => {
                this.deactivateElement(elementData);
            });
            
            // Click effects
            element.addEventListener('click', () => {
                this.triggerElementEffect(elementData);
            });
            
            // Focus for accessibility
            element.addEventListener('focus', () => {
                this.activateElement(elementData);
            });
            
            element.addEventListener('blur', () => {
                this.deactivateElement(elementData);
            });
        });
        
        console.log('🎯 Element interactions configured');
    }
    
    createElementVariations() {
        // Create geometry variations for each section based on its elements
        this.sectionElements.forEach((elements, sectionKey) => {
            const variations = [];
            
            // Always include background variation
            const backgroundRole = this.config.elementRoles.background;
            variations.push({
                role: 'background',
                modifier: backgroundRole.modifier,
                color: backgroundRole.color,
                opacity: backgroundRole.opacity
            });
            
            // Add variations for each unique element role in this section
            const uniqueRoles = [...new Set(elements.map(el => el.role))];
            
            uniqueRoles.forEach(role => {
                if (role !== 'background' && this.config.elementRoles[role]) {
                    const roleConfig = this.config.elementRoles[role];
                    variations.push({
                        role: role,
                        modifier: roleConfig.modifier,
                        color: roleConfig.color,
                        opacity: roleConfig.opacity
                    });
                }
            });
            
            // Send variations to section renderer
            if (this.styleSystem.sectionRenderers && this.styleSystem.sectionRenderers.has(sectionKey)) {
                const renderer = this.styleSystem.sectionRenderers.get(sectionKey);
                renderer.setElementVariations(variations);
                
                console.log(`🎨 Set ${variations.length} variations for section ${sectionKey}`);
            }
        });
    }
    
    activateElement(elementData) {
        if (elementData.isHovered) return;
        
        elementData.isHovered = true;
        elementData.isActive = true;
        
        // Visual feedback
        elementData.element.style.transform = 'scale(1.02)';
        
        // Geometry effect enhancement
        this.enhanceElementGeometry(elementData, 1.5);
        
        console.log(`✨ Activated ${elementData.role} element`);
    }
    
    deactivateElement(elementData) {
        elementData.isHovered = false;
        elementData.isActive = false;
        
        // Reset visual feedback
        elementData.element.style.transform = '';
        
        // Reset geometry effect
        this.enhanceElementGeometry(elementData, 1.0);
    }
    
    triggerElementEffect(elementData) {
        // Click creates visual ripple effect
        const { element, role, sectionKey } = elementData;
        
        // Add visual feedback
        element.style.transition = 'transform 0.1s ease';
        element.style.transform = 'scale(0.98)';
        
        setTimeout(() => {
            element.style.transform = elementData.isHovered ? 'scale(1.02)' : '';
        }, 100);
        
        // Send click effect to geometry renderer
        this.sendElementInteraction(elementData, {
            type: 'click',
            intensity: 0.8,
            role: role
        });
        
        console.log(`💫 Triggered ${role} element effect`);
    }
    
    enhanceElementGeometry(elementData, intensityMultiplier) {
        // Send enhancement to specific section renderer
        this.sendElementInteraction(elementData, {
            type: 'element_hover',
            role: elementData.role,
            intensity: intensityMultiplier,
            isActive: elementData.isActive
        });
    }
    
    sendElementInteraction(elementData, interactionData) {
        const { sectionKey } = elementData;
        
        // Send to section renderer
        if (this.styleSystem.sectionRenderers && this.styleSystem.sectionRenderers.has(sectionKey)) {
            const renderer = this.styleSystem.sectionRenderers.get(sectionKey);
            
            // Enhance interaction data with element-specific info
            const enhancedData = {
                ...interactionData,
                elementData: elementData,
                sectionKey: sectionKey
            };
            
            renderer.updateInteraction(enhancedData);
        }
        
        // Also send to home-master for global effects
        if (this.styleSystem.homeMaster) {
            this.styleSystem.homeMaster.updateMasterInteraction({
                type: 'element_interaction',
                elementRole: elementData.role,
                sectionKey: sectionKey,
                ...interactionData
            });
        }
    }
    
    // Update element positions (for responsive layouts)
    updateElementBounds() {
        this.mappedElements.forEach((elementData) => {
            elementData.bounds = elementData.element.getBoundingClientRect();
        });
        
        console.log('📐 Updated element bounds');
    }
    
    // Add new element dynamically
    addElement(element) {
        const role = element.dataset.vib3Element;
        if (!role) return;
        
        const sectionElement = element.closest('[data-vib3-section]');
        const sectionKey = sectionElement ? sectionElement.dataset.vib3Section : 'global';
        
        const elementData = {
            element: element,
            role: role,
            sectionKey: sectionKey,
            id: `element-${this.mappedElements.size}`,
            bounds: element.getBoundingClientRect(),
            isHovered: false,
            isActive: false
        };
        
        this.mappedElements.set(element, elementData);
        
        // Setup interactions
        this.setupElementInteractions();
        
        // Update section variations
        this.createElementVariations();
        
        console.log(`➕ Added new ${role} element to section ${sectionKey}`);
    }
    
    // Remove element
    removeElement(element) {
        const elementData = this.mappedElements.get(element);
        if (elementData) {
            this.mappedElements.delete(element);
            
            // Remove from section list
            const sectionElements = this.sectionElements.get(elementData.sectionKey);
            if (sectionElements) {
                const index = sectionElements.indexOf(elementData);
                if (index > -1) {
                    sectionElements.splice(index, 1);
                }
            }
            
            console.log(`➖ Removed ${elementData.role} element`);
        }
    }
    
    // Get element data for debugging
    getElementData(element) {
        return this.mappedElements.get(element);
    }
    
    // Get all elements in section
    getSectionElements(sectionKey) {
        return this.sectionElements.get(sectionKey) || [];
    }
    
    // Get status for debugging
    getStatus() {
        const elementsByRole = {};
        const elementsBySection = {};
        
        this.mappedElements.forEach((elementData) => {
            // Count by role
            elementsByRole[elementData.role] = (elementsByRole[elementData.role] || 0) + 1;
            
            // Count by section
            elementsBySection[elementData.sectionKey] = (elementsBySection[elementData.sectionKey] || 0) + 1;
        });
        
        return {
            totalElements: this.mappedElements.size,
            elementsByRole,
            elementsBySection,
            sectionCount: this.sectionElements.size
        };
    }
    
    destroy() {
        // Remove all event listeners
        this.mappedElements.forEach((elementData, element) => {
            element.style.transform = '';
            element.style.transition = '';
        });
        
        this.mappedElements.clear();
        this.sectionElements.clear();
        
        console.log('🗑️ Element mapper destroyed');
    }
}

window.VIB3ElementMapper = VIB3ElementMapper;
console.log('✅ VIB3STYLEPACK Element Mapper loaded - HTML to geometry mapping ready');