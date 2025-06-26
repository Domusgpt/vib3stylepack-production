/**
 * PresetManager
 * Handles loading, storing, and retrieving visual and interaction presets
 * from an external JSON file.
 */
export class PresetManager {
    constructor() {
        this.visualStyles = new Map();
        this.interactionPresets = new Map();
        this.isLoaded = false;
    }

    /**
     * Fetches and parses the presets from the given URL.
     * @param {string} url - The URL of the presets JSON file.
     * @returns {Promise<void>} A promise that resolves when presets are loaded.
     */
    async loadPresets(url) {
        if (this.isLoaded) {
            console.log("Presets already loaded.");
            return;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch presets: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();

            if (data.visualStyles) {
                for (const [name, preset] of Object.entries(data.visualStyles)) {
                    this.visualStyles.set(name, preset);
                }
            }

            if (data.interactionPresets) {
                for (const [name, preset] of Object.entries(data.interactionPresets)) {
                    this.interactionPresets.set(name, preset);
                }
            }

            this.isLoaded = true;
            console.log("Presets loaded successfully.");
        } catch (error) {
            console.error("Error loading presets:", error);
            // In a real application, you might want to throw the error
            // or have a more robust error handling mechanism.
        }
    }

    /**
     * Retrieves a visual style preset by its name.
     * @param {string} name - The name of the visual style preset.
     * @returns {object | undefined} The preset object or undefined if not found.
     */
    getVisualStyle(name) {
        if (!this.isLoaded) {
            console.warn("Attempted to get visual style before presets were loaded.");
            return undefined;
        }
        const preset = this.visualStyles.get(name);
        if (!preset) {
            console.warn(`Visual style preset "${name}" not found.`);
        }
        return preset;
    }

    /**
     * Retrieves an interaction preset by its name.
     * @param {string} name - The name of the interaction preset.
     * @returns {object | undefined} The preset object or undefined if not found.
     */
    getInteractionPreset(name) {
        if (!this.isLoaded) {
            console.warn("Attempted to get interaction preset before presets were loaded.");
            return undefined;
        }
        const preset = this.interactionPresets.get(name);
        if (!preset) {
            console.warn(`Interaction preset "${name}" not found.`);
        }
        return preset;
    }
}
