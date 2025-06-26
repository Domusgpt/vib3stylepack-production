/**
 * InteractionCoordinator
 * Manages event listeners for interactive elements and orchestrates visual responses
 * based on presets from PresetManager.
 */
export class InteractionCoordinator {
    constructor(presetManager, visualizers) {
        if (!presetManager) {
            throw new Error("InteractionCoordinator: PresetManager is required.");
        }
        if (!visualizers) {
            throw new Error("InteractionCoordinator: Visualizers map is required.");
        }
        this.presetManager = presetManager;
        this.visualizers = visualizers; // Map of DOM element -> VIB34D instance
        this.activeTimeouts = new Map(); // To manage temporary effects
    }

    /**
     * Scans the DOM for elements with [data-vib3-interaction-preset]
     * and attaches appropriate event listeners.
     */
    bindInteractions() {
        const interactiveElements = document.querySelectorAll('[data-vib3-interaction-preset]');
        interactiveElements.forEach(element => {
            this.bindInteractionsToElement(element);
        });
    }

    /**
     * Binds interactions to a single element.
     * @param {HTMLElement} element - The element to bind interactions to.
     */
    bindInteractionsToElement(element) {
        const presetName = element.dataset.vib3InteractionPreset;
        const preset = this.presetManager.getInteractionPreset(presetName);

        if (preset && preset.trigger) {
            // Handle the trigger event
            const triggerHandler = (event) => this.handleTrigger(event, preset, element);
            element.addEventListener(preset.trigger, triggerHandler);
            
            // Handle the revert event if specified
            if (preset.revert) {
                const revertHandler = (event) => this.handleRevert(event, preset, element);
                element.addEventListener(preset.revert, revertHandler);
            }
            
            console.log(`InteractionCoordinator: Bound preset "${presetName}" to element:`, element);
        } else {
            console.warn(`InteractionCoordinator: Preset "${presetName}" not found or misconfigured for element:`, element);
        }
    }

    /**
     * Handles trigger events (e.g., mouseover).
     * @param {Event} event - The DOM event.
     * @param {object} preset - The interaction preset object.
     * @param {HTMLElement} element - The target element.
     */
    handleTrigger(event, preset, element) {
        const visualizer = this.visualizers.get(element);
        if (!visualizer) {
            console.warn(`InteractionCoordinator: No visualizer found for element:`, element);
            return;
        }

        if (preset.animation && preset.animation.properties) {
            const duration = preset.animation.duration || 300;
            visualizer.updateParameters(preset.animation.properties, duration);
        }
    }

    /**
     * Handles revert events (e.g., mouseout).
     * @param {Event} event - The DOM event.
     * @param {object} preset - The interaction preset object.
     * @param {HTMLElement} element - The target element.
     */
    handleRevert(event, preset, element) {
        const visualizer = this.visualizers.get(element);
        if (!visualizer) {
            console.warn(`InteractionCoordinator: No visualizer found for element:`, element);
            return;
        }

        // Reset to base parameters
        const duration = preset.animation ? preset.animation.duration || 300 : 300;
        visualizer.resetToBaseState(duration);
    }

}
