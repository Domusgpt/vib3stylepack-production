/**
 * VIB3STYLEPACK HOME-MASTER SYSTEM
 * Home section controls ALL other sections via mathematical relationships
 * Fixed modifiers ensure visual coherence across entire experience
 */

console.log('🏠 VIB3STYLEPACK Home-Master Loading...');

class VIB3HomeMaster {
    constructor(config = {}) {
        this.config = {
            // Fixed section modifiers (home controls all)
            sectionModifiers: {
                home: 1.0,      // Master control
                articles: 0.8,   // Calmer, more readable
                videos: 1.2,     // More dynamic
                podcasts: 1.1,   // Medium energy
                ema: 0.9        // Thoughtful, philosophical
            },
            
            // Base parameters from home section
            baseParameters: {
                intensity: 0.8,
                speed: 1.0,
                density: 12.0,
                complexity: 1.0
            },
            
            ...config
        };
        
        // Current derived parameters for each section
        this.derivedParameters = new Map();
        
        // Master state
        this.masterState = {
            intensity: this.config.baseParameters.intensity,
            speed: this.config.baseParameters.speed,
            density: this.config.baseParameters.density,
            complexity: this.config.baseParameters.complexity
        };
        
        // Initialize derived parameters
        this.updateAllDerivedParameters();
        
        console.log('🏠 Home-Master initialized with section modifiers:', this.config.sectionModifiers);
    }
    
    // Update master parameters (from home section)
    updateMasterParameters(newParams) {
        Object.assign(this.masterState, newParams);
        this.updateAllDerivedParameters();
        
        console.log('📊 Master parameters updated:', this.masterState);
        
        // Notify all sections of parameter changes
        this.notifyParameterChange();
    }
    
    // Calculate derived parameters for specific section
    getDerivedParameters(sectionKey) {
        const modifier = this.config.sectionModifiers[sectionKey] || 1.0;
        
        const derived = {
            intensity: this.masterState.intensity * modifier,
            speed: this.masterState.speed * modifier,
            density: this.masterState.density * modifier,
            complexity: this.masterState.complexity * modifier,
            modifier: modifier
        };
        
        return derived;
    }
    
    // Update all section derived parameters
    updateAllDerivedParameters() {
        Object.keys(this.config.sectionModifiers).forEach(sectionKey => {
            const derived = this.getDerivedParameters(sectionKey);
            this.derivedParameters.set(sectionKey, derived);
        });
        
        console.log('🔗 Updated derived parameters for all sections');
    }
    
    // Get parameters for specific section
    getParametersForSection(sectionKey) {
        return this.derivedParameters.get(sectionKey) || this.getDerivedParameters(sectionKey);
    }
    
    // Update specific section modifier (advanced)
    updateSectionModifier(sectionKey, newModifier) {
        this.config.sectionModifiers[sectionKey] = newModifier;
        
        // Recalculate derived parameters
        const derived = this.getDerivedParameters(sectionKey);
        this.derivedParameters.set(sectionKey, derived);
        
        console.log(`🎛️ Updated modifier for ${sectionKey}: ${newModifier}`);
        
        // Notify specific section
        this.notifyParameterChange(sectionKey);
    }
    
    // Master interaction update (affects all sections)
    updateMasterInteraction(interactionData) {
        const { type, intensity = 0 } = interactionData;
        
        switch (type) {
            case 'scroll':
                // Scroll affects master speed and intensity
                this.masterState.speed = this.config.baseParameters.speed * (1.0 + intensity * 0.3);
                this.masterState.intensity = this.config.baseParameters.intensity * (1.0 + intensity * 0.2);
                break;
                
            case 'mouse':
                // Mouse movement affects complexity
                this.masterState.complexity = this.config.baseParameters.complexity * (1.0 + intensity * 0.1);
                break;
                
            case 'click':
                // Click creates intensity spike
                this.masterState.intensity = Math.min(this.masterState.intensity + intensity * 0.5, 2.0);
                break;
                
            case 'idle':
                // Gradual return to base parameters
                this.masterState.intensity *= 0.98;
                this.masterState.speed *= 0.99;
                this.masterState.complexity *= 0.99;
                break;
        }
        
        // Update all derived parameters
        this.updateAllDerivedParameters();
        
        // Notify all sections
        this.notifyParameterChange();
    }
    
    // Parameter change notification system
    notifyParameterChange(specificSection = null) {
        const event = new CustomEvent('vib3-parameters-changed', {
            detail: {
                masterState: this.masterState,
                derivedParameters: Object.fromEntries(this.derivedParameters),
                specificSection: specificSection
            }
        });
        
        document.dispatchEvent(event);
    }
    
    // Get current status for debugging
    getStatus() {
        return {
            masterState: this.masterState,
            sectionModifiers: this.config.sectionModifiers,
            derivedParameters: Object.fromEntries(this.derivedParameters)
        };
    }
    
    // Load preset configurations
    loadPreset(presetName) {
        const presets = {
            calm: {
                intensity: 0.5,
                speed: 0.7,
                density: 8.0,
                complexity: 0.8
            },
            
            normal: {
                intensity: 0.8,
                speed: 1.0,
                density: 12.0,
                complexity: 1.0
            },
            
            energetic: {
                intensity: 1.2,
                speed: 1.5,
                density: 16.0,
                complexity: 1.3
            },
            
            intense: {
                intensity: 1.5,
                speed: 2.0,
                density: 20.0,
                complexity: 1.5
            }
        };
        
        const preset = presets[presetName];
        if (preset) {
            this.updateMasterParameters(preset);
            console.log(`🎨 Loaded preset: ${presetName}`);
        } else {
            console.warn(`⚠️ Unknown preset: ${presetName}`);
        }
    }
    
    // Advanced: Create custom section relationships
    createSectionRelationship(fromSection, toSection, relationship) {
        // Example: articles intensity affects videos complexity
        // This allows for more complex inter-section relationships
        
        const fromParams = this.getParametersForSection(fromSection);
        const toParams = this.getParametersForSection(toSection);
        
        // Apply relationship (example: intensity → complexity)
        if (relationship.type === 'intensity-to-complexity') {
            toParams.complexity = fromParams.intensity * relationship.factor;
            this.derivedParameters.set(toSection, toParams);
        }
        
        console.log(`🔗 Created relationship: ${fromSection} → ${toSection} (${relationship.type})`);
    }
}

window.VIB3HomeMaster = VIB3HomeMaster;
console.log('✅ VIB3STYLEPACK Home-Master loaded - Mathematical parameter control ready');