/**
 * HypercubeGeometry: Generates vertices and indices for a 4D hypercube (tesseract).
 * Includes methods for 4D rotations.
 */
class HypercubeGeometry extends BaseGeometry {
    constructor(options = {}) {
        super();
        // Default parameters for the hypercube
        this.parameters = {
            size: options.size || 1.0,
        };
        this.baseVertices4D = [];
        this.normals = []; // Initialize normals array
        this.generate();
    }

    generate() {
        this.vertices = [];
        this.indices = [];
        this.normals = []; // Clear normals for regeneration
        this.baseVertices4D = [];

        const s = this.parameters.size;

        // A hypercube has 2^4 = 16 vertices in 4D
        // Each coordinate can be -s or +s
        for (let i = 0; i < 16; i++) {
            const x = (i & 1) ? s : -s;
            const y = (i & 2) ? s : -s;
            const z = (i & 4) ? s : -s;
            const w = (i & 8) ? s : -s;
            this.baseVertices4D.push(x, y, z, w);

            // Simplified normal: normalized position vector (Option A)
            // This will give a "rounded" lighting effect.
            const L = Math.sqrt(x*x + y*y + z*z + w*w);
            if (L > 0) {
                this.normals.push(x/L, y/L, z/L, w/L);
            } else {
                this.normals.push(0,0,1,0); // Default for origin point (not expected for hypercube)
            }
        }

        // Edges of a hypercube:
        // Two vertices form an edge if they differ in exactly one coordinate.
        // A hypercube has 32 edges.
        const edges = [
            // Vary X
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
            // Vary Y
            0, 2, 1, 3, 4, 6, 5, 7, 8, 10, 9, 11, 12, 14, 13, 15,
            // Vary Z
            0, 4, 1, 5, 2, 6, 3, 7, 8, 12, 9, 13, 10, 14, 11, 15,
            // Vary W
            0, 8, 1, 9, 2, 10, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15,
        ];

        // Generate indices for line segments (edges)
        // Each pair of numbers in 'edges' represents the vertex indices for an edge
        // This structure is a bit redundant; a more systematic way is to iterate
        // and connect vertices differing by one coordinate.

        this.indices = [];
        for(let i = 0; i < 16; ++i) {
            for(let j = i + 1; j < 16; ++j) {
                let diff = 0;
                if ((this.baseVertices4D[i*4+0] !== this.baseVertices4D[j*4+0])) diff++;
                if ((this.baseVertices4D[i*4+1] !== this.baseVertices4D[j*4+1])) diff++;
                if ((this.baseVertices4D[i*4+2] !== this.baseVertices4D[j*4+2])) diff++;
                if ((this.baseVertices4D[i*4+3] !== this.baseVertices4D[j*4+3])) diff++;
                if (diff === 1) {
                    this.indices.push(i, j);
                }
            }
        }

        // For rendering hypercubes, we often project 4D vertices to 3D
        // This can be done here or, more commonly, in the vertex shader.
        // If done here, 'this.vertices' would be populated with 3D coords.
        // For now, we keep 'baseVertices4D' and assume shader-based projection.
        // The 'vertices' array in BaseGeometry might be used by a CPU-side projection
        // or directly fed to WebGL if the shader expects 4D input (e.g. attribute vec4 a_position4D).

        // Let's populate 'this.vertices' with the 4D data for now, assuming the renderer/shader can handle it
        // Or make it clear that this.vertices will be populated by a projection step if needed.
        // For now, this class provides 4D vertices. The rendering pipeline (HypercubeCore + Shader)
        // will decide how to use/project them.
        this.vertices = [...this.baseVertices4D]; // Store 4D vertices
    }

    /**
     * Returns the 4D vertices of the hypercube.
     * @returns {Array<number>} Flat array of 4D coordinates [x,y,z,w, x,y,z,w, ...].
     */
    get4DVertices() {
        return this.baseVertices4D;
    }

    /**
     * Returns the indices for drawing edges of the hypercube.
     * @returns {Array<number>}
     */
    getEdgeIndices() {
        return this.indices; // These are already set up for edges
    }

    // In BaseGeometry, getVertices() and getIndices() are standard.
    // We'll ensure they return the appropriate data.
    // getVertices() will return the (potentially 4D) vertex data.
    // getIndices() will return edge indices for line drawing.

    /**
     * Applies 4D rotations to the baseVertices4D.
     * This is a CPU-side transformation. Often, rotations are handled in shaders for performance.
     * @param {object} rotations - Object containing rotation angles in radians for different planes.
     *                             e.g., { xy: 0.1, xz: 0.0, xw: 0.0, yz: 0.0, yw: 0.0, zw: 0.0 }
     */
    apply4DRotations(rotations) {
        const { xy = 0, xz = 0, xw = 0, yz = 0, yw = 0, zw = 0 } = rotations;
        let rotatedVertices = [...this.baseVertices4D]; // Operate on a copy

        const cos = Math.cos;
        const sin = Math.sin;

        // Apply XY rotation (around ZW plane)
        if (xy !== 0) {
            const c = cos(xy);
            const s = sin(xy);
            for (let i = 0; i < rotatedVertices.length; i += 4) {
                const x = rotatedVertices[i];
                const y = rotatedVertices[i+1];
                rotatedVertices[i]   = x * c - y * s;
                rotatedVertices[i+1] = x * s + y * c;
            }
        }
        // Apply XZ rotation (around YW plane)
        if (xz !== 0) {
            const c = cos(xz);
            const s = sin(xz);
            for (let i = 0; i < rotatedVertices.length; i += 4) {
                const x = rotatedVertices[i];
                const z = rotatedVertices[i+2];
                rotatedVertices[i]   = x * c - z * s;
                rotatedVertices[i+2] = x * s + z * c;
            }
        }
        // Apply XW rotation (around YZ plane)
        if (xw !== 0) {
            const c = cos(xw);
            const s = sin(xw);
            for (let i = 0; i < rotatedVertices.length; i += 4) {
                const x = rotatedVertices[i];
                const w = rotatedVertices[i+3];
                rotatedVertices[i]   = x * c - w * s;
                rotatedVertices[i+3] = x * s + w * c;
            }
        }
        // Apply YZ rotation (around XW plane)
        if (yz !== 0) {
            const c = cos(yz);
            const s = sin(yz);
            for (let i = 0; i < rotatedVertices.length; i += 4) {
                const y = rotatedVertices[i+1];
                const z = rotatedVertices[i+2];
                rotatedVertices[i+1] = y * c - z * s;
                rotatedVertices[i+2] = y * s + z * c;
            }
        }
        // Apply YW rotation (around XZ plane)
        if (yw !== 0) {
            const c = cos(yw);
            const s = sin(yw);
            for (let i = 0; i < rotatedVertices.length; i += 4) {
                const y = rotatedVertices[i+1];
                const w = rotatedVertices[i+3];
                rotatedVertices[i+1] = y * c - w * s;
                rotatedVertices[i+3] = y * s + w * c;
            }
        }
        // Apply ZW rotation (around XY plane)
        if (zw !== 0) {
            const c = cos(zw);
            const s = sin(zw);
            for (let i = 0; i < rotatedVertices.length; i += 4) {
                const z = rotatedVertices[i+2];
                const w = rotatedVertices[i+3];
                rotatedVertices[i+2] = z * c - w * s;
                rotatedVertices[i+3] = z * s + w * c;
            }
        }

        this.vertices = rotatedVertices; // Update the main vertices array
        return this.vertices;
    }

    /**
     * Updates geometry parameters.
     * @param {object} params - Parameters to update, e.g., { size: newSize }.
     */
    update(params) {
        if (params.size && params.size !== this.parameters.size) {
            this.parameters.size = params.size;
            this.generate(); // Regenerate if size changes
        }
        // Handle rotation updates if they are passed here
        if (params.rotations) {
            this.apply4DRotations(params.rotations);
        }
    }

    // WebGL buffer creation methods (to be called by HypercubeCore or a renderer)
    // These are examples; buffer management can vary.

    /**
     * Creates and returns a WebGL buffer for the hypercube's 4D vertex positions.
     * @param {WebGLRenderingContext} gl - The WebGL context.
     * @returns {WebGLBuffer} The created buffer.
     */
    getVertexPositionsBuffer(gl) {
        if (!this.vertexPosBuffer) {
            this.vertexPosBuffer = gl.createBuffer();
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW); // Use current 'vertices'
        return this.vertexPosBuffer;
    }

    /**
     * Creates and returns a WebGL buffer for the hypercube's edge indices.
     * @param {WebGLRenderingContext} gl - The WebGL context.
     * @returns {WebGLBuffer} The created buffer.
     */
    getIndexBuffer(gl) {
        if (!this.indexBuffer) {
            this.indexBuffer = gl.createBuffer();
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
        return this.indexBuffer;
    }

    // Cleanup WebGL resources
    destroy(gl) {
        if (this.vertexPosBuffer) gl.deleteBuffer(this.vertexPosBuffer);
        if (this.indexBuffer) gl.deleteBuffer(this.indexBuffer);
        if (this.normalBuffer) gl.deleteBuffer(this.normalBuffer); // Added
        this.vertexPosBuffer = null;
        this.indexBuffer = null;
        this.normalBuffer = null; // Added
    }
}

// Ensure BaseGeometry is available if not using modules
if (typeof BaseGeometry === 'undefined') {
    // Mock BaseGeometry for environments where it might not be loaded (e.g. testing snippet)
    global.BaseGeometry = class {
        constructor() { this.vertices = []; this.indices = []; }
        generate() {}
        update(params) {}
        getVertices() { return this.vertices; }
        getIndices() { return this.indices; }
    };
}

// Example Usage (conceptual, typically integrated into HypercubeCore)
/*
const hypercube = new HypercubeGeometry({ size: 1.5 });
console.log("4D Vertices:", hypercube.get4DVertices());
console.log("Edge Indices:", hypercube.getEdgeIndices());

// Apply some rotations
hypercube.update({ rotations: { xw: Math.PI / 4, yz: Math.PI / 6 } });
console.log("Rotated 4D Vertices:", hypercube.getVertices()); // getVertices() now returns rotated ones

// If used with WebGL (simplified):
// const gl = canvas.getContext('webgl');
// const vbo = hypercube.getVertexPositionsBuffer(gl);
// const ibo = hypercube.getIndexBuffer(gl);
// ... setup shader attributes, bind buffers, and drawElements with gl.LINES ...
*/
