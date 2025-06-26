/**
 * Manages the registration and retrieval of geometry classes.
 */
class GeometryManager {
    constructor() {
        this.geometries = new Map();
    }

    /**
     * Registers a new geometry class.
     * @param {string} name - The name to register the geometry under.
     * @param {typeof BaseGeometry} geometryClass - The geometry class (must extend BaseGeometry).
     */
    registerGeometry(name, geometryClass) {
        if (!(geometryClass.prototype instanceof BaseGeometry)) {
            throw new Error("Geometry class must extend BaseGeometry.");
        }
        if (this.geometries.has(name)) {
            console.warn(`GeometryManager: Geometry with name "${name}" is already registered. Overwriting.`);
        }
        this.geometries.set(name, geometryClass);
        console.log(`GeometryManager: Registered geometry "${name}".`);
    }

    /**
     * Retrieves a geometry class by its registered name.
     * @param {string} name - The name of the geometry to retrieve.
     * @returns {typeof BaseGeometry | undefined} The geometry class, or undefined if not found.
     */
    getGeometryClass(name) {
        if (!this.geometries.has(name)) {
            console.warn(`GeometryManager: Geometry with name "${name}" not found.`);
            return undefined;
        }
        return this.geometries.get(name);
    }

    /**
     * Creates an instance of a registered geometry.
     * @param {string} name - The name of the geometry to instantiate.
     * @param {object} [initialParams] - Optional parameters to pass to the geometry's constructor or an initial update.
     * @returns {BaseGeometry | null} An instance of the geometry, or null if the class is not found.
     */
    createGeometryInstance(name, initialParams = {}) {
        const GeometryClass = this.getGeometryClass(name);
        if (GeometryClass) {
            const instance = new GeometryClass();
            // Assuming generate might take parameters or update is called after instantiation
            if (typeof instance.generate === 'function') {
                 // If generate can take params, or if there's a specific init method.
                 // For now, we assume generate is parameterless and update is used for params.
                instance.generate();
            }
            if (typeof instance.update === 'function' && Object.keys(initialParams).length > 0) {
                instance.update(initialParams);
            }
            return instance;
        }
        return null;
    }

    /**
     * Lists all registered geometry names.
     * @returns {Array<string>}
     */
    listGeometries() {
        return Array.from(this.geometries.keys());
    }
}

// This ensures BaseGeometry is available if this script is loaded directly in a browser
// or in a Node.js environment for testing.
if (typeof BaseGeometry === 'undefined') {
    // This is a simplified mock for environments where BaseGeometry isn't loaded.
    // In a real project, module loading (ESM or CommonJS) would handle this.
    window.BaseGeometry = class BaseGeometry {
        constructor() { if (this.constructor === BaseGeometry) throw new Error("Abstract class"); }
        generate() { throw new Error("Must implement"); }
        update(params) {}
    };
}
