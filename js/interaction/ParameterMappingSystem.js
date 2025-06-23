/**
 * ParameterMappingSystem
 *
 * This system takes base visual parameters (e.g., from UI controls or presets)
 * and modulates them using real-time interaction data from VIB34DInteractionEngine
 * to produce "effective" parameters that are then sent as uniforms to shaders.
 *
 * It defines:
 * - How interaction data (intensity, velocity, patterns) maps to parameter changes.
 * - Rules for combining base values with interaction-driven modulations.
 * - Clamping of final parameter values to valid ranges.
 */
class ParameterMappingSystem {
    constructor(baseParameters, interactionEngine) {
        this.baseParameters = { ...baseParameters }; // Initial static parameters
        this.interactionEngine = interactionEngine;
        this.effectiveParameters = { ...baseParameters }; // Parameters after interaction modulation

        // Define mapping rules or functions.
        // These rules specify which interaction aspects affect which parameters and how.
        // Example: scroll intensity might affect u_gridDensity or u_universeModifier.
        //          mouse movement might affect u_rotationSpeed or u_colorShift.
        //          click/hold might affect u_morphFactor or u_glitchIntensity.
        //
        // This is a simplified example. A more complex system might use a declarative
        // structure for mappings or allow dynamic configuration.
        this.mappings = [
            // Example mapping: Scroll intensity (audioBass) affects u_gridDensity
            {
                sourceInteraction: 'audioBass', // Key from interactionEngine.getInteractionState()
                targetParameter: 'u_gridDensity',
                // How the source value (0-1) modulates the target.
                // value = base + interactionValue * scale +/- offset
                // Or, value = base * (1 + interactionValue * scale)
                mapFunction: (baseValue, interactionValue) => {
                    // Let scroll increase grid density.
                    // Base u_gridDensity is 10.0. Max could be 25.0.
                    // InteractionValue (0-1).
                    // If interaction = 1, increase by, say, 10.0.
                    return baseValue + interactionValue * 10.0;
                },
                clamp: { min: 1.0, max: 25.0 }
            },
            // Example: Click/Hold intensity (audioMid) affects u_morphFactor
            {
                sourceInteraction: 'audioMid',
                targetParameter: 'u_morphFactor',
                mapFunction: (baseValue, interactionValue) => {
                    // Base morph factor is 0.0. Max 1.5.
                    return baseValue + interactionValue * 1.5;
                },
                clamp: { min: 0.0, max: 1.5 }
            },
            // Example: Mouse movement intensity (audioHigh) affects u_rotationSpeed
            {
                sourceInteraction: 'audioHigh',
                targetParameter: 'u_rotationSpeed',
                mapFunction: (baseValue, interactionValue) => {
                    // Base rotation speed 0.5. Max 3.0.
                    // Let high intensity mouse movement significantly increase speed.
                    return baseValue + interactionValue * 2.5;
                },
                clamp: { min: 0.0, max: 3.0 }
            },
            // Example: Idle decay affects patternIntensity (e.g., visuals become calmer when idle)
            {
                sourceInteractionPath: ['idle', 'decayFactor'], // Path to nested value
                targetParameter: 'u_patternIntensity',
                mapFunction: (baseValue, decayFactor) => {
                    // decayFactor is 1 when active, -> 0 when idle.
                    // Let patternIntensity be its base value when active, and half when fully idle.
                    return baseValue * (0.5 + 0.5 * decayFactor) ;
                },
                clamp: { min: 0.1, max: 3.0 } // Assuming base u_patternIntensity is within this.
            },
            // Example: Mouse X position could affect u_colorShift
            {
                sourceInteractionPath: ['mouseMovement', 'normalizedX'],
                targetParameter: 'u_colorShift',
                mapFunction: (baseValue, mouseX) => {
                    // mouseX is 0-1. u_colorShift is -1 to 1.
                    // Let base be 0. Mouse X directly maps to -1 to 1.
                    return baseValue + (mouseX * 2.0 - 1.0);
                },
                clamp: { min: -1.0, max: 1.0 }
            },
            // Add more mappings for the 8 specified parameter mapping calculations
            // This is just a start. The other uniforms (u_universeModifier, u_glitchIntensity, etc.)
            // would also need mappings if they are to be interactive.

            // Example: u_glitchIntensity based on click/hold pattern
            {
                sourceInteractionPath: ['pattern','type'],
                sourceInteractionValuePath: ['clickHold', 'intensity'], // Get value from here
                targetParameter: 'u_glitchIntensity',
                mapFunction: (baseValue, patternType, clickIntensity) => {
                    if (patternType === 'rhythmic' || patternType === 'intense') {
                        return baseValue + clickIntensity * 0.15; // Max glitch 0.15
                    }
                    return baseValue; // No glitch otherwise
                },
                clamp: { min: 0.0, max: 0.15 }
            },
            // Example: u_universeModifier based on scroll pattern or intensity
            {
                sourceInteractionPath: ['scroll', 'intensity'],
                targetParameter: 'u_universeModifier',
                mapFunction: (baseValue, scrollIntensity) => {
                    // u_universeModifier 0.3 -> 2.5
                    // Base is 1.0. Scroll can shift it by +/- 0.7
                    return baseValue + (scrollIntensity * 1.4 - 0.7);
                },
                clamp: {min: 0.3, max: 2.5}
            }
            // TODO: Add more mappings to cover 8 distinct parameter interactions if possible
            // For example, u_shellWidth, u_tetraThickness could be subtly modulated by idle state or specific patterns.
        ];
    }

    /**
     * Updates the base parameters. Call this when UI controls change static values.
     * @param {object} newBaseParameters - Object containing new base values for parameters.
     */
    setBaseParameters(newBaseParameters) {
        for (const key in newBaseParameters) {
            if (this.baseParameters.hasOwnProperty(key)) {
                this.baseParameters[key] = newBaseParameters[key];
            }
        }
        // After setting new base parameters, immediately update effective parameters
        // based on current interaction state.
        this.update();
    }

    /**
     * Updates a single base parameter.
     * @param {string} key - The parameter key (e.g., 'u_gridDensity').
     * @param {any} value - The new base value.
     */
    setBaseParameter(key, value) {
        if (this.baseParameters.hasOwnProperty(key)) {
            this.baseParameters[key] = value;
            this.update(); // Recalculate effective parameters
        } else {
            // console.warn(`ParameterMappingSystem: Base parameter "${key}" not found.`);
        }
    }


    /**
     * Recalculates all effective parameters based on current interaction data
     * and base parameter values.
     */
    update() {
        const interactionState = this.interactionEngine.getInteractionState();

        // Initialize effectiveParameters with a fresh copy of baseParameters
        // This ensures that any parameter not explicitly mapped remains at its base value.
        for (const key in this.baseParameters) {
            this.effectiveParameters[key] = this.baseParameters[key];
        }

        // Apply mappings
        for (const mapping of this.mappings) {
            const baseValue = this.baseParameters[mapping.targetParameter];
            if (baseValue === undefined) {
                // console.warn(`ParameterMappingSystem: Base parameter "${mapping.targetParameter}" not defined for mapping.`);
                continue;
            }

            let interactionValue;
            let secondaryInteractionValue; // For mapFunctions taking multiple interaction inputs

            if (mapping.sourceInteractionPath) {
                interactionValue = mapping.sourceInteractionPath.reduce((obj, key) => (obj && obj[key] !== 'undefined') ? obj[key] : undefined, interactionState);
            } else {
                interactionValue = interactionState[mapping.sourceInteraction];
            }

            if (mapping.sourceInteractionValuePath) { // For mapFunctions that need another value from interactions
                 secondaryInteractionValue = mapping.sourceInteractionValuePath.reduce((obj, key) => (obj && obj[key] !== 'undefined') ? obj[key] : undefined, interactionState);
            }


            if (interactionValue !== undefined) {
                let mappedValue;
                if (secondaryInteractionValue !== undefined) {
                     mappedValue = mapping.mapFunction(baseValue, interactionValue, secondaryInteractionValue);
                } else {
                     mappedValue = mapping.mapFunction(baseValue, interactionValue);
                }


                // Clamp the value
                if (mapping.clamp) {
                    mappedValue = Math.max(mapping.clamp.min, Math.min(mapping.clamp.max, mappedValue));
                }
                this.effectiveParameters[mapping.targetParameter] = mappedValue;
            } else {
                // console.warn(`ParameterMappingSystem: Interaction source "${mapping.sourceInteraction || mapping.sourceInteractionPath.join('.')}" not found or undefined.`);
                // If interaction source is not found, the effective parameter remains its base value (already set).
            }
        }

        // Some parameters might be directly set from interaction engine (e.g., audio sliders)
        // These are already part of interactionState and HypercubeCore can pick them directly.
        // This system is for *modulating* existing base parameters.
        // However, HypercubeCore will use `getEffectiveParameters()` to get ALL shader uniforms.
        // So, ensure u_audioBass, u_audioMid, u_audioHigh are also in effectiveParameters.
        // The InteractionEngine provides these directly in its state.
        this.effectiveParameters.u_audioBass = interactionState.audioBass;
        this.effectiveParameters.u_audioMid = interactionState.audioMid;
        this.effectiveParameters.u_audioHigh = interactionState.audioHigh;

        // Also pass through u_mouse, u_time, u_resolution as they are core & directly updated
        // by HypercubeCore, not typically mapped by this system.
        // HypercubeCore.parameters will be the ultimate source of truth for these before shader update.
        // This mapping system focuses on parameters that have a "base" and are "modulated".
    }

    /**
     * Returns the calculated effective parameters after applying interaction modulations.
     * @returns {object}
     */
    getEffectiveParameters() {
        // Ensure parameters are up-to-date before returning
        this.update();
        return this.effectiveParameters;
    }
}

// Example Usage (Conceptual - typically HypercubeCore would own and call this)
/*
// Assume `baseParamsFromUI` is an object like HypercubeCore.parameters
// Assume `interactionEng` is an instance of VIB34DInteractionEngine

let baseParamsFromUI = {
    u_resolution: [800, 600], u_time: 0.0, u_mouse: [0,0], u_dimension: 4.0,
    u_gridDensity: 10.0, u_lineThickness: 0.01, u_universeModifier: 1.0, u_patternIntensity: 1.5,
    u_morphFactor: 0.1, u_rotationSpeed: 0.5,
    u_shellWidth: 0.05, u_tetraThickness: 0.02, u_glitchIntensity: 0.0,
    u_colorShift: 0.0,
    u_audioBass: 0.0, u_audioMid: 0.0, u_audioHigh: 0.0,
    // ... other non-uniform params like fov, near, far
};

// const interactionEng = new VIB34DInteractionEngine(document.createElement('canvas')); // Dummy canvas
// const paramMapper = new ParameterMappingSystem(baseParamsFromUI, interactionEng);

function gameLoop() {
    // interactionEng.update(); // Called by getInteractionState() or explicitly
    // paramMapper.update(); // Called by getEffectiveParameters() or explicitly

    const effectiveParams = paramMapper.getEffectiveParameters();

    // Pass effectiveParams to HypercubeCore.updateParameter() or directly to ShaderManager
    // For example:
    // hypercubeCore.updateParameter('u_gridDensity', effectiveParams.u_gridDensity);
    // hypercubeCore.updateParameter('u_morphFactor', effectiveParams.u_morphFactor);
    // ... and so on for all mapped parameters.
    // Or: hypercubeCore.updateParameters(effectiveParams); (if HypercubeCore supports batch update)

    // console.log("Effective Grid Density:", effectiveParams.u_gridDensity);
    // console.log("Effective Morph Factor:", effectiveParams.u_morphFactor);

    // requestAnimationFrame(gameLoop);
}
// requestAnimationFrame(gameLoop);
*/
