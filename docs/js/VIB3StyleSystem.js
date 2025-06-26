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
        styledElements.forEach((element) => {
            this.createVisualizerForElement(element);
        });
    }

    /**
     * Creates a VIB34D visualizer instance for a single element if it has a valid style.
     * @param {HTMLElement} element - The DOM element to create a visualizer for.
     * @param {number} index - Optional index for unique ID generation (less critical now with element.id).
     */
    createVisualizerForElement(element, index = 0) {
        if (this.visualizers.has(element)) {
            // console.log("VIB3StyleSystem: Visualizer already exists for element:", element);
            return this.visualizers.get(element);
        }

        const styleName = element.dataset.vib3Style;
        if (!styleName) return null;

        const visualStylePreset = this.presetManager.getVisualStyle(styleName);

        if (visualStylePreset && visualStylePreset.parameters) {
            const visualizerId = element.id || `vib3d-style-${styleName}-${Math.random().toString(16).slice(2)}`;
            const instance = new VIB34D(element, visualStylePreset.parameters, visualizerId);
            this.visualizers.set(element, instance);
            console.log(`VIB3StyleSystem: Created visualizer ${visualizerId} for element:`, element);
            return instance;
        } else {
            console.warn(`VIB3StyleSystem: Visual style preset "${styleName}" not found or misconfigured for element:`, element);
            return null;
        }
    }


    /**
     * Scans a container (or the whole document) for new elements with VIB3 data attributes
     * and initializes them.
     * @param {HTMLElement} [containerElement=document.body] - The element to scan within.
     */
    scanAndInitializeNewElements(containerElement = document.body) {
        if (!this.isInitialized || !this.presetManager.isLoaded) {
            console.warn("VIB3StyleSystem: Cannot scan new elements, system not fully initialized.");
            return;
        }
        console.log("VIB3StyleSystem: Scanning for new elements in", containerElement);

        // Initialize new styled elements
        const newStyledElements = containerElement.querySelectorAll('[data-vib3-style]');
        newStyledElements.forEach(element => {
            if (!this.visualizers.has(element)) { // Check if it's truly new or child of new
                 this.createVisualizerForElement(element);
            } else if (containerElement.contains(element) && element !== containerElement) {
                 // If the container itself was previously styled, its children might be re-scanned
                 // but are already known. This is fine.
            }
        });

        // Initialize new interactive elements
        const newInteractiveElements = containerElement.querySelectorAll('[data-vib3-interaction-preset]');
        if (this.interactionCoordinator) {
            newInteractiveElements.forEach(element => {
                // InteractionCoordinator's bindInteractionsToElement should be idempotent
                // or check if listeners are already attached if called multiple times on same element.
                // For now, we assume it's safe to call, or it handles its own checks.
                this.interactionCoordinator.bindInteractionsToElement(element);
            });
        }
        console.log("VIB3StyleSystem: Finished scanning for new elements.");
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
