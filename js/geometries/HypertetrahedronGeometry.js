/**
 * HypertetrahedronGeometry: Generates vertices and indices for a 4D regular simplex (5-cell).
 * Also includes parameters for "plane thickness" for visualization.
 */
class HypertetrahedronGeometry extends BaseGeometry {
    constructor(options = {}) {
        super();
        this.parameters = {
            size: options.size || 1.0, // Size parameter (e.g., distance from center to vertex)
            tetraThickness: options.tetraThickness || 0.05, // For visualizing "thick" faces/edges
        };

        // FIX: Define 'r' from parameters before using it.
        const r = this.parameters.size;

        // The vertices of a regular 5-cell (pentachoron) centered at the origin.
        // This set has the first 4 vertices forming a regular tetrahedron in the hyperplane w = -c,
        // and the 5th vertex is at (0,0,0, 4c). To center the whole thing at the origin, the sum of w-coordinates should be 0.
        // The distance from the origin to any vertex is consistent, so it's a valid regular simplex construction.
        const r_scaled = this.parameters.size; // Using size directly as a scaling factor.
        const radiusScale = 1 / (4 / Math.sqrt(5)); // Scale such that distance to vertex is `r_scaled`.

        this.baseVertices4D = [
             1,  1,  1, -1 / Math.sqrt(5),
             1, -1, -1, -1 / Math.sqrt(5),
            -1,  1, -1, -1 / Math.sqrt(5),
            -1, -1,  1, -1 / Math.sqrt(5),
             0,  0,  0,  4 / Math.sqrt(5)
        ].map(val => val * r_scaled * radiusScale);


        this.generate();
    }

    generate() {
        this.vertices = [...this.baseVertices4D]; // Store 4D vertices
        this.indices = []; // For drawing edges (lines)

        // A 5-cell has 5 vertices. Every pair of vertices forms an edge.
        // Number of edges = C(5,2) = 10 edges.
        const numVertices = 5;
        for (let i = 0; i < numVertices; i++) {
            for (let j = i + 1; j < numVertices; j++) {
                this.indices.push(i, j);
            }
        }
    }

    get4DVertices() {
        return this.vertices;
    }

    getEdgeIndices() {
        return this.indices;
    }

    update(params) {
        let needsRegeneration = false;
        if (params.size !== undefined && params.size !== this.parameters.size) {
            this.parameters.size = params.size;

            const r_scaled = this.parameters.size;
            const radiusScale = 1 / (4 / Math.sqrt(5));
            this.baseVertices4D = [
                 1,  1,  1, -1 / Math.sqrt(5),
                 1, -1, -1, -1 / Math.sqrt(5),
                -1,  1, -1, -1 / Math.sqrt(5),
                -1, -1,  1, -1 / Math.sqrt(5),
                 0,  0,  0,  4 / Math.sqrt(5)
            ].map(val => val * r_scaled * radiusScale);
            needsRegeneration = true;
        }
        if (params.tetraThickness !== undefined && params.tetraThickness !== this.parameters.tetraThickness) {
            this.parameters.tetraThickness = params.tetraThickness;
        }

        if (needsRegeneration) {
            this.generate();
        }

        if (params.rotations) {
            if (typeof this.apply4DRotations === 'function') {
                this.apply4DRotations(params.rotations);
            } else if (super.apply4DRotations) {
                super.apply4DRotations(params.rotations);
            }
        }
    }

    apply4DRotations(rotations) {
        const { xy = 0, xz = 0, xw = 0, yz = 0, yw = 0, zw = 0 } = rotations;
        let rotatedVertices = [...this.baseVertices4D];

        const cos = Math.cos;
        const sin = Math.sin;

        if (xy !== 0) { const c = cos(xy), s = sin(xy); for (let i = 0; i < rotatedVertices.length; i += 4) { const x = rotatedVertices[i], y = rotatedVertices[i+1]; rotatedVertices[i] = x * c - y * s; rotatedVertices[i+1] = x * s + y * c; }}
        if (xz !== 0) { const c = cos(xz), s = sin(xz); for (let i = 0; i < rotatedVertices.length; i += 4) { const x = rotatedVertices[i], z = rotatedVertices[i+2]; rotatedVertices[i] = x * c - z * s; rotatedVertices[i+2] = x * s + z * c; }}
        if (xw !== 0) { const c = cos(xw), s = sin(xw); for (let i = 0; i < rotatedVertices.length; i += 4) { const x = rotatedVertices[i], w = rotatedVertices[i+3]; rotatedVertices[i] = x * c - w * s; rotatedVertices[i+3] = x * s + w * c; }}
        if (yz !== 0) { const c = cos(yz), s = sin(yz); for (let i = 0; i < rotatedVertices.length; i += 4) { const y = rotatedVertices[i+1], z = rotatedVertices[i+2]; rotatedVertices[i+1] = y * c - z * s; rotatedVertices[i+2] = y * s + z * c; }}
        if (yw !== 0) { const c = cos(yw), s = sin(yw); for (let i = 0; i < rotatedVertices.length; i += 4) { const y = rotatedVertices[i+1], w = rotatedVertices[i+3]; rotatedVertices[i+1] = y * c - w * s; rotatedVertices[i+3] = y * s + w * c; }}
        if (zw !== 0) { const c = cos(zw), s = sin(zw); for (let i = 0; i < rotatedVertices.length; i += 4) { const z = rotatedVertices[i+2], w = rotatedVertices[i+3]; rotatedVertices[i+2] = z * c - w * s; rotatedVertices[i+3] = z * s + w * c; }}

        this.vertices = rotatedVertices;
        return this.vertices;
    }

    getVertexPositionsBuffer(gl) {
        if (!this.vertexPosBuffer) {
            this.vertexPosBuffer = gl.createBuffer();
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
        return this.vertexPosBuffer;
    }

    getIndexBuffer(gl) {
        if (!this.indexBuffer) {
            this.indexBuffer = gl.createBuffer();
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
        return this.indexBuffer;
    }

    destroy(gl) {
        if (this.vertexPosBuffer) gl.deleteBuffer(this.vertexPosBuffer);
        if (this.indexBuffer) gl.deleteBuffer(this.indexBuffer);
        this.vertexPosBuffer = null;
        this.indexBuffer = null;
    }
}

if (typeof BaseGeometry === 'undefined') {
    window.BaseGeometry = class {
        constructor() { this.vertices = []; this.indices = []; }
        generate() {}
        update(params) {}
        getVertices() { return this.vertices; }
        getIndices() { return this.indices; }
    };
}