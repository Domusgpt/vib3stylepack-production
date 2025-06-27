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
            console.log(`VIB3StyleSystem: Attempting to create visualizer ${visualizerId} for element:`, element, 'with preset:', styleName);
            const instance = new VIB34D(element, visualStylePreset.parameters, visualizerId);
            if (instance && (instance.gl || instance.ctx)) { // Check if VIB34D instance was successfully created with a context
                this.visualizers.set(element, instance);
                console.log(`VIB3StyleSystem: Successfully created visualizer ${visualizerId}. Total visualizers: ${this.visualizers.size}`);
                return instance;
            } else {
                console.error(`VIB3StyleSystem: Failed to create VIB34D instance or its context for ${visualizerId}.`);
                return null;
            }
        } else {
            console.warn(`VIB3StyleSystem: Visual style preset "${styleName}" not found or parameters missing for element:`, element);
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
        console.log("VIB3StyleSystem: Scanning for new elements in", containerElement.id || containerElement.tagName);
        let newVisualizersCount = 0;
        let newInteractionsCount = 0;

        // Initialize new styled elements
        const newStyledElements = containerElement.querySelectorAll('[data-vib3-style]');
        newStyledElements.forEach(element => {
            // Check if element itself or its parent (if containerElement is a direct child) is new
            if (!this.visualizers.has(element)) {
                if(this.createVisualizerForElement(element)) {
                    newVisualizersCount++;
                }
            }
        });
        if (newVisualizersCount > 0) console.log(`VIB3StyleSystem: Initialized ${newVisualizersCount} new VIB3 visualizers.`);

        // Initialize new interactive elements
        const newInteractiveElements = containerElement.querySelectorAll('[data-vib3-interaction-preset]');
        if (this.interactionCoordinator) {
            newInteractiveElements.forEach(element => {
                // Assuming bindInteractionsToElement is idempotent or checks internally
                // We pass element to count if it was newly bound.
                // For now, InteractionCoordinator logs its own successful bindings.
                this.interactionCoordinator.bindInteractionsToElement(element);
            });
             // Could count new bindings if bindInteractionsToElement returned a status
        }
        console.log("VIB3StyleSystem: Finished scanning for new elements in", containerElement.id || containerElement.tagName);
    }

    /**
     * Conceptual: Removes a visualizer and cleans up its resources.
     * This would be called if a dynamically added element with a VIB3 instance is removed from DOM.
     * Full implementation requires tracking listeners in InteractionCoordinator too.
     * @param {HTMLElement} element - The DOM element whose visualizer should be destroyed.
     */
    destroyVisualizerForElement(element) {
        if (this.visualizers.has(element)) {
            const viz = this.visualizers.get(element);

            // Unbind interactions first
            if (this.interactionCoordinator && this.interactionCoordinator.unbindInteractionsFromElement) {
                this.interactionCoordinator.unbindInteractionsFromElement(element);
            }

            viz.destroy(); // Call VIB34D instance's destroy method
            this.visualizers.delete(element);
            console.log(`VIB3StyleSystem: Destroyed visualizer and unbound interactions for element:`, element.id || element.className, `. Total visualizers: ${this.visualizers.size}`);
        } else {
            // console.log("VIB3StyleSystem: No visualizer found to destroy for element:", element.id || element.className);
        }
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
     */
    destroy() {
        console.log(`VIB3StyleSystem: Destroying all ${this.visualizers.size} visualizers and unbinding interactions.`);
        this.visualizers.forEach((viz, element) => {
            if (this.interactionCoordinator && this.interactionCoordinator.unbindInteractionsFromElement) {
               this.interactionCoordinator.unbindInteractionsFromElement(element);
            }
            viz.destroy();
        });
        this.visualizers.clear();

        // Reset InteractionCoordinator state if it holds any global state beyond listeners on elements
        // For now, unbinding from elements is the main part. If InteractionCoordinator had a global
        // list of active listeners or something, that would be cleared here too.
        // element._vib3BoundHandlers is cleaned by unbindInteractionsFromElement.

        this.isInitialized = false;
        console.log("VIB3StyleSystem: System destroyed and uninitialized.");
    }
}
