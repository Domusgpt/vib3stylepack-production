import { PresetManager } from './PresetManager.js';
import { VIB34D } from './VIB34D.js';
import { InteractionCoordinator } from './InteractionCoordinator.js';

/**
 * VIB3StyleSystem - Main Conductor
 * Initializes and coordinates all subsystems: PresetManager, VIB34D visualizers,
 * and InteractionCoordinator. Scans the DOM to create visualizers and bind interactions.
 */
export class VIB3StyleSystem {
    constructor() {
        this.visualizers = new Map(); // Stores DOMElement -> VIB34D instance
        this.presetManager = new PresetManager();
        this.interactionCoordinator = null; // Initialized after presets and visualizers
        this.isInitialized = false;

        console.log("VIB3StyleSystem: Conductor created.");
    }

    /**
     * Initializes the entire system.
     * Must be called after the DOM is ready.
     * @param {string} presetsUrl - URL to the presets.json file.
     */
    async init(presetsUrl = 'presets.json') {
        if (this.isInitialized) {
            console.warn("VIB3StyleSystem: Already initialized.");
            return;
        }

        console.log("VIB3StyleSystem: Initializing...");

        // 1. Load Presets
        await this.presetManager.loadPresets(presetsUrl);
        if (!this.presetManager.isLoaded) {
            console.error("VIB3StyleSystem: Failed to load presets. Aborting initialization.");
            return;
        }
        console.log("VIB3StyleSystem: Presets loaded.");

        // 2. Create Visualizers
        this.createVisualizers();
        console.log(`VIB3StyleSystem: Created ${this.visualizers.size} visualizer(s).`);

        // 3. Initialize Interaction Coordinator
        this.interactionCoordinator = new InteractionCoordinator(this.presetManager, this.visualizers);
        this.interactionCoordinator.bindInteractions();
        console.log("VIB3StyleSystem: InteractionCoordinator initialized and interactions bound.");

        this.isInitialized = true;
        console.log("VIB3StyleSystem: Initialization complete.");
    }

    /**
     * Scans the DOM for elements with [data-vib3-style] and creates VIB34D instances.
     */
    createVisualizers() {
        const styledElements = document.querySelectorAll('[data-vib3-style]');
        styledElements.forEach((element, index) => {
            const styleName = element.dataset.vib3Style;
            const visualStylePreset = this.presetManager.getVisualStyle(styleName);

            if (visualStylePreset && visualStylePreset.parameters) {
                // Assign a unique ID to the visualizer for easier debugging and tracking
                const visualizerId = element.id || `vib3d-style-${styleName}-${index}`;
                const instance = new VIB34D(element, visualStylePreset.parameters, visualizerId);
                this.visualizers.set(element, instance);
            } else {
                console.warn(`VIB3StyleSystem: Visual style preset "${styleName}" not found or misconfigured for element:`, element);
            }
        });
    }

    /**
     * Retrieves a VIB34D instance associated with a given DOM element.
     * @param {HTMLElement} element - The DOM element.
     * @returns {VIB34D | undefined} The VIB34D instance or undefined if not found.
     */
    getVisualizerForElement(element) {
        return this.visualizers.get(element);
    }

    /**
     * Destroys all visualizers and cleans up the system.
     * (Basic implementation for now)
     */
    destroy() {
        this.visualizers.forEach(viz => viz.destroy());
        this.visualizers.clear();
        // Further cleanup for InteractionCoordinator (e.g., remove event listeners) could be added here.
        this.isInitialized = false;
        console.log("VIB3StyleSystem: System destroyed.");
    }
}
