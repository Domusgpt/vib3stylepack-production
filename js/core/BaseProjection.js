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

// Note: This assumes a library like gl-matrix for matrix operations (mat4).
// If not available, basic matrix operations would need to be implemented or
// a different library chosen. For now, we'll mock it for the structure.
// Mock gl-matrix for now if not present in the project
if (typeof mat4 === 'undefined') {
    window.mat4 = {
        create: () => new Array(16).fill(0),
        perspective: (out, fovy, aspect, near, far) => {},
        ortho: (out, left, right, bottom, top, near, far) => {},
        lookAt: (out, eye, center, up) => {},
        multiply: (out, a, b) => {},
        translate: (out, a, v) => {},
        rotate: (out, a, rad, axis) => {},
        scale: (out, a, v) => {},
        identity: (out) => { out.fill(0); for(let i=0; i<4; i++) out[i*4+i]=1;},
    };
}
