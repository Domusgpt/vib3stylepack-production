/**
 * @abstract
 * Base class for all projection types.
 * Defines the interface for applying projection transformations.
 */
class BaseProjection {
    constructor() {
        if (this.constructor === BaseProjection) {
            throw new Error("Abstract classes can't be instantiated.");
        }
        this.projectionMatrix = mat4.create(); // Assuming gl-matrix is used
    }

    /**
     * @abstract
     * Updates the projection matrix based on provided parameters.
     * This method must be implemented by subclasses.
     * @param {object} params - Parameters to update the projection.
     *                          Common parameters might include fov, aspect, near, far.
     */
    update(params) {
        throw new Error("Method 'update()' must be implemented.");
    }

    /**
     * Returns the projection matrix.
     * @returns {mat4} - The projection matrix.
     */
    getProjectionMatrix() {
        return this.projectionMatrix;
    }

    /**
     * @abstract
     * Applies the projection to a given set of vertices or a scene.
     * @param {Array<number> | object} target - Vertices or scene object to project.
     */
    project(target) {
        throw new Error("Method 'project()' must be implemented.");
    }
}

// Note: This class assumes a matrix library like gl-matrix is available globally (e.g., glMatrix.mat4 as mat4).
// The gl-matrix library should be included in the HTML file before this script.
// Example: const { mat4 } = glMatrix; (if glMatrix is the global object from the library)
// For simplicity in these files, we'll assume 'mat4' is available globally after gl-matrix loads.
