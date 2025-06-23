/**
 * Manages the registration and retrieval of projection classes.
 */
class ProjectionManager {
    constructor() {
        this.projections = new Map();
    }

    /**
     * Registers a new projection class.
     * @param {string} name - The name to register the projection under.
     * @param {typeof BaseProjection} projectionClass - The projection class (must extend BaseProjection).
     */
    registerProjection(name, projectionClass) {
        if (!(projectionClass.prototype instanceof BaseProjection)) {
            throw new Error("Projection class must extend BaseProjection.");
        }
        if (this.projections.has(name)) {
            console.warn(`ProjectionManager: Projection with name "${name}" is already registered. Overwriting.`);
        }
        this.projections.set(name, projectionClass);
        console.log(`ProjectionManager: Registered projection "${name}".`);
    }

    /**
     * Retrieves a projection class by its registered name.
     * @param {string} name - The name of the projection to retrieve.
     * @returns {typeof BaseProjection | undefined} The projection class, or undefined if not found.
     */
    getProjectionClass(name) {
        if (!this.projections.has(name)) {
            console.warn(`ProjectionManager: Projection with name "${name}" not found.`);
            return undefined;
        }
        return this.projections.get(name);
    }

    /**
     * Creates an instance of a registered projection.
     * @param {string} name - The name of the projection to instantiate.
     * @param {object} [initialParams] - Optional parameters to pass to the projection's update method upon creation.
     * @returns {BaseProjection | null} An instance of the projection, or null if the class is not found.
     */
    createProjectionInstance(name, initialParams = {}) {
        const ProjectionClass = this.getProjectionClass(name);
        if (ProjectionClass) {
            const instance = new ProjectionClass();
            // Projections are typically configured via an update method with parameters like FOV, aspect ratio, etc.
            if (typeof instance.update === 'function') {
                instance.update(initialParams); // Pass initial params to update
            }
            return instance;
        }
        return null;
    }

    /**
     * Lists all registered projection names.
     * @returns {Array<string>}
     */
    listProjections() {
        return Array.from(this.projections.keys());
    }
}

// Mock BaseProjection if not available (similar to GeometryManager)
if (typeof BaseProjection === 'undefined') {
    global.BaseProjection = class BaseProjection {
        constructor() { if (this.constructor === BaseProjection) throw new Error("Abstract class"); }
        update(params) { throw new Error("Must implement"); }
        getProjectionMatrix() { return []; }
        project(target) { throw new Error("Must implement"); }
    };
}
