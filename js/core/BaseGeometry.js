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
        this.normals = []; // For lighting
        this.uvs = [];     // For texturing
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

    /**
     * Returns the normals of the geometry.
     * Should be populated by subclass's generate() method.
     * @returns {Array<number>}
     */
    getNormals() {
        return this.normals;
    }

    /**
     * Creates and returns a WebGL buffer for the geometry's vertex normals.
     * This method can be overridden by subclasses if specific buffer handling is needed.
     * @param {WebGLRenderingContext} gl - The WebGL context.
     * @returns {WebGLBuffer | null} The created buffer, or null if no normals.
     */
    getNormalsBuffer(gl) {
        if (!this.normals || this.normals.length === 0) {
            return null;
        }
        if (!this.normalBuffer) {
            this.normalBuffer = gl.createBuffer();
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);
        return this.normalBuffer;
    }

    // Ensure destroy method is present or added to subclasses to clean up normalBuffer
    // Example (can be added to BaseGeometry if all subclasses should have it):
    /*
    destroy(gl) {
        if (this.vertexPosBuffer) gl.deleteBuffer(this.vertexPosBuffer);
        if (this.indexBuffer) gl.deleteBuffer(this.indexBuffer);
        if (this.normalBuffer) gl.deleteBuffer(this.normalBuffer);
        if (this.uvBuffer) gl.deleteBuffer(this.uvBuffer);
        this.vertexPosBuffer = null;
        this.indexBuffer = null;
        this.normalBuffer = null;
        this.uvBuffer = null;
    }
    */
}
