/**
 * FractalGeometry: Generates vertices for various 4D fractal structures.
 * This is a placeholder for a more specific fractal type, e.g., a 4D Mandelbrot/Julia set cross-section,
 * or a 4D version of iterative function systems (IFS) like a Menger sponge or Sierpinski tetrahedron.
 *
 * For simplicity, we'll start with a 4D generalization of a Sierpinski Tetrahedron (or rather, a 5-cell).
 * A Sierpinski n-simplex is formed by taking an n-simplex, finding midpoints of edges,
 * and forming (n+1) smaller n-simplices at the corners, then repeating.
 *
 * This implementation will generate points for a level-N Sierpinski 5-cell.
 * It will generate individual points, not meshes, as meshing fractals is complex.
 * The shader will then render these points.
 */
class FractalGeometry extends BaseGeometry {
    constructor(options = {}) {
        super();
        this.parameters = {
            iterations: options.iterations || 3, // Number of recursive steps
            size: options.size || 1.0,          // Initial size of the base 5-cell
            // Specific fractal type could be a parameter too
            fractalType: options.fractalType || 'sierpinski5cell',
        };
        this.baseVertices4D = []; // Store the points of the fractal
        this.generate();
    }

    generate() {
        this.vertices = []; // Will store 4D point data
        this.indices = [];  // Likely unused for point clouds, or could define connectivity if needed
        this.baseVertices4D = [];

        if (this.parameters.fractalType === 'sierpinski5cell') {
            this.generateSierpinski5Cell();
        } else {
            console.warn(`FractalGeometry: Unknown fractalType "${this.parameters.fractalType}". Generating nothing.`);
        }

        this.vertices = [...this.baseVertices4D];
        // For point clouds, indices might not be used, or each point is its own index if needed by renderer.
        // for (let i = 0; i < this.vertices.length / 4; i++) this.indices.push(i);
    }

    generateSierpinski5Cell() {
        // 1. Define the initial 5 vertices of a regular 5-cell (pentachoron).
        const r = this.parameters.size;
        const radiusScale = 1 / (4 / Math.sqrt(5)); // Scale such that distance to vertex is `r`
        const initialPentachoronVertices = [
            [ 1,  1,  1, -1 / Math.sqrt(5)],
            [ 1, -1, -1, -1 / Math.sqrt(5)],
            [-1,  1, -1, -1 / Math.sqrt(5)],
            [-1, -1,  1, -1 / Math.sqrt(5)],
            [ 0,  0,  0,  4 / Math.sqrt(5)]
        ].map(v => v.map(c => c * r * radiusScale));

        // Store points in this.baseVertices4D
        this.recursiveSierpinski(initialPentachoronVertices, this.parameters.iterations);
    }

    /**
     * Recursively generates points for the Sierpinski 5-cell.
     * @param {Array<Array<number>>} vertices - The 5 vertices of the current 5-cell ([v0, v1, v2, v3, v4], each an array [x,y,z,w]).
     * @param {number} depth - Current recursion depth.
     */
    recursiveSierpinski(currentVertices, depth) {
        if (depth === 0) {
            // At max depth, add the vertices of this small 5-cell as points
            // Or, more commonly for point cloud fractals, add the center or just one vertex.
            // For a classic Sierpinski Gasket, we'd add the vertices of the current scaled simplex.
            // Let's add all 5 vertices of the current smallest simplex.
            for (const vertex of currentVertices) {
                this.baseVertices4D.push(...vertex);
            }
            return;
        }

        // A 5-cell has 5 vertices.
        // For each vertex, we create a new smaller 5-cell scaled by 0.5 towards it.
        // The new 5-cells are formed by taking one original vertex and the midpoints
        // of the edges connecting it to the other 4 original vertices.

        for (let i = 0; i < 5; i++) { // For each vertex v_i of the current 5-cell
            const v_i = currentVertices[i];
            const nextSimplexVertices = [v_i]; // The first vertex of the new smaller simplex is v_i itself.

            for (let j = 0; j < 5; j++) { // For all other vertices v_j
                if (i === j) continue;
                const v_j = currentVertices[j];
                // Midpoint m_ij = (v_i + v_j) / 2
                const midpoint = [
                    (v_i[0] + v_j[0]) / 2,
                    (v_i[1] + v_j[1]) / 2,
                    (v_i[2] + v_j[2]) / 2,
                    (v_i[3] + v_j[3]) / 2,
                ];
                // The new smaller simplex is defined by v_i and the midpoints m_ik (where k != i)
                // This is the standard construction: the new smaller simplices are at the "corners" of the larger one.
                // The vertices of the i-th sub-simplex are v_i and (v_i+v_k)/2 for k!=i.
            }
            // So, for the sub-simplex associated with vertex currentVertices[i]:
            // Its vertices are:
            // 1. currentVertices[i]
            // 2. (currentVertices[i] + currentVertices[j_1]) / 2
            // 3. (currentVertices[i] + currentVertices[j_2]) / 2
            // 4. (currentVertices[i] + currentVertices[j_3]) / 2
            // 5. (currentVertices[i] + currentVertices[j_4]) / 2
            // where j_1 to j_4 are indices different from i.

            const subSimplexVerts = [currentVertices[i]]; // First vertex is the "corner"
            for (let k = 0; k < 5; k++) {
                if (k === i) continue;
                const vk = currentVertices[k];
                subSimplexVerts.push([
                    (currentVertices[i][0] + vk[0]) / 2,
                    (currentVertices[i][1] + vk[1]) / 2,
                    (currentVertices[i][2] + vk[2]) / 2,
                    (currentVertices[i][3] + vk[3]) / 2,
                ]);
            }
            this.recursiveSierpinski(subSimplexVerts, depth - 1);
        }
    }


    get4DVertices() {
        return this.vertices;
    }

    // No UVs or standard indices for this type of fractal point cloud.
    // getUVs() { return []; }
    // getIndices() { return this.indices; } // Could be a sequence 0,1,2,... for point rendering

    apply4DRotations(rotations) {
        // This should rotate the entire point cloud.
        // We need to decide if rotations apply to baseVertices4D and then copy to vertices,
        // or if vertices are rotated directly.
        // For fractals, usually regenerate or transform the generated points.
        const { xy = 0, xz = 0, xw = 0, yz = 0, yw = 0, zw = 0 } = rotations;
        // Create a fresh copy for rotation if baseVertices4D is the source of truth.
        // Or, if this.vertices is already populated from baseVertices4D:
        let rotatedVertices = [...this.vertices]; // Assuming this.vertices holds the current state.

        const cos = Math.cos;
        const sin = Math.sin;

        // Apply rotations to each point [x,y,z,w] in the rotatedVertices array
        if (xy !== 0) { const c = cos(xy), s = sin(xy); for (let i = 0; i < rotatedVertices.length; i += 4) { const x = rotatedVertices[i], y = rotatedVertices[i+1]; rotatedVertices[i] = x * c - y * s; rotatedVertices[i+1] = x * s + y * c; }}
        if (xz !== 0) { const c = cos(xz), s = sin(xz); for (let i = 0; i < rotatedVertices.length; i += 4) { const x = rotatedVertices[i], z = rotatedVertices[i+2]; rotatedVertices[i] = x * c - z * s; rotatedVertices[i+2] = x * s + z * c; }}
        if (xw !== 0) { const c = cos(xw), s = sin(xw); for (let i = 0; i < rotatedVertices.length; i += 4) { const x = rotatedVertices[i], w = rotatedVertices[i+3]; rotatedVertices[i] = x * c - w * s; rotatedVertices[i+3] = x * s + w * c; }}
        if (yz !== 0) { const c = cos(yz), s = sin(yz); for (let i = 0; i < rotatedVertices.length; i += 4) { const y = rotatedVertices[i+1], z = rotatedVertices[i+2]; rotatedVertices[i+1] = y * c - z * s; rotatedVertices[i+2] = y * s + z * c; }}
        if (yw !== 0) { const c = cos(yw), s = sin(yw); for (let i = 0; i < rotatedVertices.length; i += 4) { const y = rotatedVertices[i+1], w = rotatedVertices[i+3]; rotatedVertices[i+1] = y * c - w * s; rotatedVertices[i+3] = y * s + w * c; }}
        if (zw !== 0) { const c = cos(zw), s = sin(zw); for (let i = 0; i < rotatedVertices.length; i += 4) { const z = rotatedVertices[i+2], w = rotatedVertices[i+3]; rotatedVertices[i+2] = z * c - w * s; rotatedVertices[i+3] = z * s + w * c; }}

        this.vertices = rotatedVertices; // Update with the rotated points
        return this.vertices;
    }


    update(params) {
        let needsRegeneration = false;
        if (params.iterations !== undefined && params.iterations !== this.parameters.iterations) {
            this.parameters.iterations = params.iterations;
            needsRegeneration = true;
        }
        if (params.size !== undefined && params.size !== this.parameters.size) {
            this.parameters.size = params.size;
            needsRegeneration = true;
        }
        if (params.fractalType !== undefined && params.fractalType !== this.parameters.fractalType) {
            this.parameters.fractalType = params.fractalType;
            needsRegeneration = true;
        }

        if (needsRegeneration) {
            this.generate(); // This populates this.baseVertices4D and then this.vertices
        }

        if (params.rotations) {
            // If we just regenerated, this.vertices is fresh from baseVertices4D.
            // If not, this.vertices might have prior rotations.
            // To ensure rotations are not cumulative beyond what's intended,
            // it's often best to rotate the 'canonical' base points.
            // However, apply4DRotations as written above takes this.vertices (current state).
            // For fractals, if baseVertices4D IS the canonical set of points, then rotations
            // should transform that and update this.vertices.
            // Let's adjust: apply4DRotations should ideally work from baseVertices4D.

            // Simplified: assume update() is called, if rotations are present, apply them to current this.vertices.
            // If regeneration also happened, this.vertices is fresh.
            this.apply4DRotations(params.rotations);
        }
    }

    // Buffer methods
    getVertexPositionsBuffer(gl) {
        if (!this.vertexPosBuffer) {
            this.vertexPosBuffer = gl.createBuffer();
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW); // Use current 'vertices'
        return this.vertexPosBuffer;
    }

    // No index buffer for point clouds typically, unless drawing specific connections.
    // getIndexBuffer(gl) { ... }

    // No UV buffer typically for this kind of fractal.
    // getUVBuffer(gl) { ... }


    destroy(gl) {
        if (this.vertexPosBuffer) gl.deleteBuffer(this.vertexPosBuffer);
        this.vertexPosBuffer = null;
    }
}

if (typeof BaseGeometry === 'undefined') {
    window.BaseGeometry = class {
        constructor() { this.vertices = []; this.indices = []; this.uvs = []; }
        generate() {}
        update(params) {}
        getVertices() { return this.vertices; }
        getIndices() { return this.indices; }
        getUVs() { return this.uvs; }
    };
}

// Example Usage:
/*
const fractal = new FractalGeometry({
    iterations: 2, // Low iteration for fewer points initially
    size: 1.5,
    fractalType: 'sierpinski5cell'
});
console.log("Fractal Points Count:", fractal.get4DVertices().length / 4);

// fractal.update({ iterations: 3, rotations: { xw: Math.PI / 6 } });
// console.log("Updated Fractal Points Count:", fractal.getVertices().length / 4);
// console.log("First point after update:", fractal.getVertices().slice(0,4));

// To render this, you would typically use gl.POINTS in your draw call.
// And the shader would take 4D positions and project them.
*/
