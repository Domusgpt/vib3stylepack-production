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
            const presetName = element.dataset.vib3InteractionPreset;
            const preset = this.presetManager.getInteractionPreset(presetName);

            if (preset && preset.events && Array.isArray(preset.events)) {
                preset.events.forEach(eventType => {
                    // Store the preset details with the handler for easy access
                    const handler = (event) => this.handleInteraction(event, presetName, preset, element);
                    element.addEventListener(eventType, handler);
                    // Consider adding a cleanup method to remove these listeners if elements are removed
                });
                console.log(`InteractionCoordinator: Bound preset "${presetName}" to element:`, element);
            } else {
                console.warn(`InteractionCoordinator: Preset "${presetName}" not found or misconfigured for element:`, element);
            }
        });
    }

    /**
     * Generic interaction handler.
     * @param {Event} event - The DOM event.
     * @param {string} presetName - Name of the interaction preset.
     * @param {object} preset - The interaction preset object.
     * @param {HTMLElement} targetElement - The element that triggered the interaction.
     */
    handleInteraction(event, presetName, preset, targetElement) {
        console.log(`Interaction on ${targetElement.className} with preset ${presetName} for event ${event.type}`);
        const eventType = event.type;

        // 1. Apply Target Actions
        if (preset.targetActions && preset.targetActions[eventType]) {
            const targetVisualizer = this.visualizers.get(targetElement);
            if (targetVisualizer) {
                this.applyActions(targetVisualizer, preset.targetActions[eventType], `target:${targetElement.id || targetElement.className}:${presetName}:${eventType}`);
            } else {
                console.warn(`InteractionCoordinator: No visualizer found for target element:`, targetElement);
            }
        }

        // 2. Apply Ecosystem Reactions
        if (preset.ecosystemReactions && Array.isArray(preset.ecosystemReactions)) {
            preset.ecosystemReactions.forEach(reaction => {
                if (reaction.actions && reaction.actions[eventType]) {
                    const ecosystemElements = document.querySelectorAll(reaction.selector);
                    ecosystemElements.forEach(ecoElement => {
                        if (reaction.excludeTarget && ecoElement === targetElement) {
                            return; // Skip if it's the target and excludeTarget is true
                        }
                        const ecoVisualizer = this.visualizers.get(ecoElement);
                        if (ecoVisualizer) {
                            this.applyActions(ecoVisualizer, reaction.actions[eventType], `eco:${ecoElement.id || ecoElement.className}:${presetName}:${eventType}`);
                        } else {
                             console.warn(`InteractionCoordinator: No visualizer found for ecosystem element matching selector "${reaction.selector}":`, ecoElement);
                        }
                    });
                }
            });
        }
    }

    /**
     * Applies actions (parameter updates or reset) to a visualizer.
     * @param {VIB34D} visualizerInstance - The VIB34D instance to apply actions to.
     * @param {object} actionDetails - The action details from the preset.
     * @param {string} effectId - A unique ID for managing temporary effects.
     */
    applyActions(visualizerInstance, actionDetails, effectId) {
        if (!visualizerInstance || !actionDetails) return;

        // Clear any existing temporary effect timeout for this visualizer and effectId
        const fullEffectId = `${visualizerInstance.id}-${effectId}`; // Make effectId more unique per instance
        if (this.activeTimeouts.has(fullEffectId)) {
            clearTimeout(this.activeTimeouts.get(fullEffectId));
            this.activeTimeouts.delete(fullEffectId);
        }

        if (actionDetails.resetToBase) {
            visualizerInstance.resetToBaseState(actionDetails.duration);
        } else if (actionDetails.params) {
            visualizerInstance.updateParameters(actionDetails.params, actionDetails.duration);

            if (actionDetails.temporary && actionDetails.resetDelay) {
                const timeoutId = setTimeout(() => {
                    visualizerInstance.resetToBaseState(actionDetails.duration || 300);
                    this.activeTimeouts.delete(fullEffectId);
                }, actionDetails.resetDelay);
                this.activeTimeouts.set(fullEffectId, timeoutId);
            }
        }
    }

    /**
     * Binds interaction preset events to a single dynamically added element.
     * @param {HTMLElement} element - The DOM element to bind interactions to.
     */
    bindInteractionsToElement(element) {
        if (!element.dataset.vib3InteractionPreset) return;

        const presetName = element.dataset.vib3InteractionPreset;
        const preset = this.presetManager.getInteractionPreset(presetName);

        if (preset && preset.events && Array.isArray(preset.events)) {
            preset.events.forEach(eventType => {
                const handler = (event) => this.handleInteraction(event, presetName, preset, element);
                element.addEventListener(eventType, handler);
                // Store handlers on the element for later removal
                if (!element._vib3BoundHandlers) {
                    element._vib3BoundHandlers = {};
                }

                // Prevent duplicate listeners for the same event type on the same element
                if (!element._vib3BoundHandlers[eventType]) {
                    element.addEventListener(eventType, handler);
                    element._vib3BoundHandlers[eventType] = handler; // Store the handler
                    element.classList.add('vib3-interaction-bound');
                    console.log(`InteractionCoordinator: Bound event "${eventType}" for preset "${presetName}" to element:`, element.id || element.className);
                } else {
                    // console.log(`InteractionCoordinator: Event "${eventType}" for preset "${presetName}" already bound to element:`, element.id || element.className);
                }
            });
        } else {
            if (presetName) console.warn(`InteractionCoordinator: Preset "${presetName}" not found or misconfigured for element:`, element.id || element.className);
        }
    }

    /**
     * Unbinds all VIB3 interaction preset events from a single element.
     * @param {HTMLElement} element - The DOM element to unbind interactions from.
     */
    unbindInteractionsFromElement(element) {
        if (!element._vib3BoundHandlers) return; // No handlers were bound by this coordinator

        const presetName = element.dataset.vib3InteractionPreset || "unknown preset"; // For logging
        let unboundCount = 0;

        for (const eventType in element._vib3BoundHandlers) {
            const handler = element._vib3BoundHandlers[eventType];
            element.removeEventListener(eventType, handler);
            unboundCount++;
            // console.log(`InteractionCoordinator: Unbound event "${eventType}" for preset "${presetName}" from element:`, element.id || element.className);
        }

        delete element._vib3BoundHandlers; // Clean up the storage property
        element.classList.remove('vib3-interaction-bound');
        if (unboundCount > 0) {
            console.log(`InteractionCoordinator: Unbound ${unboundCount} event(s) for preset "${presetName}" from element:`, element.id || element.className);
        }
    }
}
