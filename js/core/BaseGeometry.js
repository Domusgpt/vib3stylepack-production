/**
 * @abstract
 * Base class for all geometry types.
 * Defines the interface for geometry generation and manipulation.
 */
class BaseGeometry {
    constructor() {
        if (this.constructor === BaseGeometry) {
            throw new Error("Abstract classes can't be instantiated.");
        }
        this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.uvs = [];
    }

    /**
     * @abstract
     * Generates the geometry data (vertices, indices, etc.).
     * This method must be implemented by subclasses.
     */
    generate() {
        throw new Error("Method 'generate()' must be implemented.");
    }

    /**
     * @abstract
     * Updates the geometry based on provided parameters.
     * This method can be overridden by subclasses if specific updates are needed.
     * @param {object} params - Parameters to update the geometry.
     */
    update(params) {
        // Optional: Common update logic can go here
    }

    /**
     * Returns the vertices of the geometry.
     * @returns {Array<number>}
     */
    getVertices() {
        return this.vertices;
    }

    /**
     * Returns the indices of the geometry.
     * @returns {Array<number>}
     */
    getIndices() {
        return this.indices;
    }

    /**
     * Returns the normals of the geometry.
     * @returns {Array<number>}
     */
    getNormals() {
        return this.normals;
    }

    /**
     * Returns the UV coordinates of the geometry.
     * @returns {Array<number>}
     */
    getUVs() {
        return this.uvs;
    }
}
