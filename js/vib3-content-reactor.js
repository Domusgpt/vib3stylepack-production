/**
 * VIB3STYLEPACK CONTENT REACTOR
 * Dynamic content system that reacts to geometry changes
 * Content updates based on current section geometry
 */

console.log('📝 VIB3STYLEPACK Content Reactor Loading...');

class VIB3ContentReactor {
    constructor(styleSystem, config = {}) {
        this.styleSystem = styleSystem;
        this.config = {
            enableContentReaction: true,
            transitionDuration: 500,
            ...config
        };
        
        // Content mapping for each geometry
        this.contentMap = {
            hypercube: {
                title: 'Multi-Dimensional Data Architecture',
                subtitle: 'The foundational 4D framework for digital sovereignty',
                theme: 'sovereignty',
                accent: 'Mathematical Foundation'
            },
            tetrahedron: {
                title: 'Structured Knowledge Systems',
                subtitle: 'Technical documentation with stable geometric foundation',
                theme: 'stability',
                accent: 'Technical Precision'
            },
            sphere: {
                title: 'Infinite Potential Media',
                subtitle: 'Dynamic content with spherical flow patterns',
                theme: 'potential',
                accent: 'Dynamic Flow'
            },
            torus: {
                title: 'Continuous Flow Audio',
                subtitle: 'Temporal content with toroidal geometry',
                theme: 'continuity',
                accent: 'Temporal Stream'
            },
            wave: {
                title: 'Quantum Philosophy Spaces',
                subtitle: 'Exoditical Moral Architecture principles',
                theme: 'philosophy',
                accent: 'Quantum States'
            }
        };
        
        // Current state
        this.currentGeometry = 'hypercube';
        this.isTransitioning = false;
        
        this.initialize();
    }
    
    initialize() {
        this.setupContentElements();
        this.setupGeometryListener();
        
        console.log('📝 Content reactor initialized');
    }
    
    setupContentElements() {
        // Find all reactive content elements
        this.contentElements = {
            titles: document.querySelectorAll('[data-vib3-content="title"]'),
            subtitles: document.querySelectorAll('[data-vib3-content="subtitle"]'),
            accents: document.querySelectorAll('[data-vib3-content="accent"]')
        };
        
        console.log(`📝 Found ${this.contentElements.titles.length} reactive content elements`);
    }
    
    setupGeometryListener() {
        // Listen for section changes from portal scroll
        document.addEventListener('vib3-section-changed', (e) => {
            const { sectionKey, geometry } = e.detail;
            this.reactToGeometry(geometry, sectionKey);
        });
        
        // Also listen for parameter changes
        document.addEventListener('vib3-parameters-changed', (e) => {
            this.updateContentIntensity(e.detail);
        });
    }
    
    reactToGeometry(geometry, sectionKey) {
        if (this.currentGeometry === geometry || this.isTransitioning) return;
        
        console.log(`📝 Content reacting to geometry: ${this.currentGeometry} → ${geometry}`);
        
        this.isTransitioning = true;
        this.currentGeometry = geometry;
        
        // Get content for this geometry
        const content = this.contentMap[geometry];
        if (!content) return;
        
        // Update content with smooth transition
        this.updateContent(content, sectionKey);
    }
    
    updateContent(content, sectionKey) {
        // Update titles in current section
        this.contentElements.titles.forEach(titleEl => {
            const section = titleEl.closest('[data-vib3-section]');
            if (section && section.dataset.vib3Section === sectionKey) {
                this.animateTextChange(titleEl, content.title);
            }
        });
        
        // Update subtitles in current section
        this.contentElements.subtitles.forEach(subtitleEl => {
            const section = subtitleEl.closest('[data-vib3-section]');
            if (section && section.dataset.vib3Section === sectionKey) {
                this.animateTextChange(subtitleEl, content.subtitle);
            }
        });
        
        // Update accent elements
        this.contentElements.accents.forEach(accentEl => {
            const section = accentEl.closest('[data-vib3-section]');
            if (section && section.dataset.vib3Section === sectionKey) {
                this.animateTextChange(accentEl, content.accent);
            }
        });
        
        // Apply theme class to section
        this.applyThemeToSection(sectionKey, content.theme);
        
        setTimeout(() => {
            this.isTransitioning = false;
        }, this.config.transitionDuration);
    }
    
    animateTextChange(element, newText) {
        if (element.textContent === newText) return;
        
        // Fade out
        element.style.transition = `opacity ${this.config.transitionDuration / 2}ms ease`;
        element.style.opacity = '0';
        
        setTimeout(() => {
            // Change text
            element.textContent = newText;
            
            // Fade in
            element.style.opacity = '1';
        }, this.config.transitionDuration / 2);
    }
    
    applyThemeToSection(sectionKey, theme) {
        const section = document.querySelector(`[data-vib3-section="${sectionKey}"]`);
        if (!section) return;
        
        // Remove existing theme classes
        section.classList.remove('theme-sovereignty', 'theme-stability', 'theme-potential', 'theme-continuity', 'theme-philosophy');
        
        // Add new theme class
        section.classList.add(`theme-${theme}`);
        
        console.log(`🎨 Applied theme ${theme} to section ${sectionKey}`);
    }
    
    updateContentIntensity(parameterData) {
        const { masterState } = parameterData;
        
        // Adjust content based on master intensity
        const intensity = masterState.intensity || 1.0;
        
        // Scale font sizes based on intensity
        document.querySelectorAll('[data-vib3-content]').forEach(el => {
            const baseSize = parseFloat(getComputedStyle(el).fontSize);
            const scaledSize = baseSize * (0.9 + intensity * 0.2);
            el.style.fontSize = `${scaledSize}px`;
        });
    }
    
    // Trigger content reaction manually
    triggerReaction(geometry) {
        this.reactToGeometry(geometry, 'current');
    }
    
    // Get current content state
    getCurrentContent() {
        return {
            geometry: this.currentGeometry,
            content: this.contentMap[this.currentGeometry],
            isTransitioning: this.isTransitioning
        };
    }
    
    destroy() {
        // Reset all content elements
        document.querySelectorAll('[data-vib3-content]').forEach(el => {
            el.style.transition = '';
            el.style.opacity = '';
            el.style.fontSize = '';
        });
        
        console.log('🗑️ Content reactor destroyed');
    }
}

window.VIB3ContentReactor = VIB3ContentReactor;
console.log('✅ VIB3STYLEPACK Content Reactor loaded - Dynamic content reaction ready');