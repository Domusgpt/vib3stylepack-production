/**
 * WaveGeometry: Generates vertices for visualizing probability wave functions or other wave phenomena in 4D.
 * This could be a surface plot of a function f(x,y,z,w) = value, or a parametric surface
 * whose shape evolves over time (another dimension, or animated parameter).
 *
 * For simplicity, let's create a 4D wave pattern on a grid or sphere.
 * Example: A vibrating hypersphere surface, where radius is modulated by a wave function.
 * Or a 4D version of a ripple tank: a 3D grid whose w-coordinate is a wave function of x,y,z and time.
 * w = A * sin(k_x*x + k_y*y + k_z*z - omega*t)
 *
 * Let's try a parametric surface in 4D that has wave-like properties.
 * Consider a base surface (e.g., a plane or sphere) and displace its points
 * in a fourth dimension (or one of its existing dimensions) according to a wave function.
 *
 * We will generate a 3D grid of points in XYZ, and the W coordinate will be a function of X,Y,Z and time (passed as a parameter).
 * x, y, z from -range to +range.
 * w = amplitude * sin(k.x * x + k.y * y + k.z * z - frequency * time_param)
 */
class WaveGeometry extends BaseGeometry {
    constructor(options = {}) {
        super();
        this.parameters = {
            gridSize: options.gridSize || 2.0,       // Max extent of the XYZ grid (e.g., -gridSize/2 to +gridSize/2)
            divisions: options.divisions || 20,      // Number of divisions along each axis (X, Y, Z)

            // Wave parameters
            amplitude: options.amplitude || 0.2,
            waveVector: options.waveVector || [Math.PI, Math.PI, Math.PI], // [kx, ky, kz]
            frequency: options.frequency || 1.0,       // omega
            time: options.time || 0.0                  // Current time for animation
        };
        this.baseVertices4D = []; // Store the (x,y,z,0) grid points
        this.uvs = []; // Can store (x,y,z) normalized coords or similar for texturing
        this.generate();
    }

    generate() {
        this.vertices = []; // Will store 4D point data (x,y,z,w)
        this.indices = [];  // For rendering the grid as quads or lines
        this.baseVertices4D = []; // Store the static part of the grid
        this.uvs = [];

        const { gridSize, divisions } = this.parameters;
        const step = gridSize / divisions;
        const halfGrid = gridSize / 2;

        // Generate a 3D grid of points (x,y,z)
        // The w-coordinate will be calculated dynamically in update() or a specific method.
        for (let i = 0; i <= divisions; i++) { // X axis
            const x = -halfGrid + i * step;
            for (let j = 0; j <= divisions; j++) { // Y axis
                const y = -halfGrid + j * step;
                for (let k = 0; k <= divisions; k++) { // Z axis
                    const z = -halfGrid + k * step;
                    this.baseVertices4D.push(x, y, z, 0); // Initial w = 0
                    this.uvs.push(i/divisions, j/divisions, k/divisions); // Store normalized grid coords as UVW
                }
            }
        }

        this.vertices = [...this.baseVertices4D]; // Initialize vertices
        this.calculateWave(); // Calculate initial wave displacement

        // Generate indices to draw the grid (e.g., as a series of connected quads or lines)
        // This is complex for a full 3D grid if we want to render "surfaces" of constant wave value.
        // For now, let's assume we might render points, or slices, or the shader handles interpretation.
        // If we want to render it as a volume or iso-surface, that's a much bigger task.
        //
        // Let's generate indices for rendering cell faces on the "outer shell" of the 3D grid,
        // or if it's a point cloud, indices are just 0,1,2...
        // For a simple visualization, we can create quads for each XY plane at different Z values.
        const d1 = divisions + 1; // points per axis
        for (let k = 0; k < divisions; k++) { // Iterate through Z slices
            for (let j = 0; j < divisions; j++) { // Iterate through Y rows
                for (let i = 0; i < divisions; i++) { // Iterate through X columns
                    // Base index for the current cell's "bottom-left-front" corner
                    const base = (i * d1 * d1) + (j * d1) + k; // This indexing is for x varying fastest.
                                                            // My loops are i (X), j (Y), k (Z)
                                                            // So point (i,j,k) is at index k + j*d1 + i*d1*d1 if Z varies fastest.
                                                            // If X varies fastest: i + j*d1 + k*d1*d1
                    // Let's re-verify indexing based on loop order:
                    // Outer loop i (X), then j (Y), then k (Z).
                    // Point (ix, iy, iz) is at index: iz + iy*d1 + ix*d1*d1
                    const p000 = k + j*d1 + i*d1*d1;
                    const p100 = k + j*d1 + (i+1)*d1*d1;
                    const p010 = k + (j+1)*d1 + i*d1*d1;
                    const p110 = k + (j+1)*d1 + (i+1)*d1*d1;
                    const p001 = (k+1) + j*d1 + i*d1*d1;
                    const p101 = (k+1) + j*d1 + (i+1)*d1*d1;
                    const p011 = (k+1) + (j+1)*d1 + i*d1*d1;
                    const p111 = (k+1) + (j+1)*d1 + (i+1)*d1*d1;

                    // Create quads for the face in XY plane (front face: k, back face: k+1)
                    // Front face (z = z_k)
                    this.indices.push(p000, p100, p110); this.indices.push(p000, p110, p010);
                    // Back face (z = z_k+1)
                    this.indices.push(p001, p011, p111); this.indices.push(p001, p111, p101);

                    // Left face (x = x_i)
                    this.indices.push(p000, p010, p011); this.indices.push(p000, p011, p001);
                    // Right face (x = x_i+1)
                    this.indices.push(p100, p101, p111); this.indices.push(p100, p111, p110);

                    // Bottom face (y = y_j)
                    this.indices.push(p000, p001, p101); this.indices.push(p000, p101, p100);
                    // Top face (y = y_j+1)
                    this.indices.push(p010, p110, p111); this.indices.push(p010, p111, p011);
                }
            }
        }
        // This generates a lot of interior faces. For "shell" rendering, only outer faces are needed.
        // For now, this will create a full grid of cells.
        // The visual result will depend heavily on projection and rendering (e.g. wireframe, transparent).
    }

    calculateWave() {
        const { amplitude, waveVector, frequency, time } = this.parameters;
        const kx = waveVector[0];
        const ky = waveVector[1];
        const kz = waveVector[2];

        for (let i = 0; i < this.baseVertices4D.length; i += 4) {
            const x = this.baseVertices4D[i];
            const y = this.baseVertices4D[i+1];
            const z = this.baseVertices4D[i+2];

            const phase = kx * x + ky * y + kz * z - frequency * time;
            const w = amplitude * Math.sin(phase);

            this.vertices[i+3] = w; // Update the w-coordinate in the live vertices array
        }
    }

    get4DVertices() {
        return this.vertices;
    }

    getUVs() { // Returns the (u,v,w) normalized grid coordinates
        return this.uvs;
    }

    apply4DRotations(rotations) {
        const { xy = 0, xz = 0, xw = 0, yz = 0, yw = 0, zw = 0 } = rotations;
        // Important: rotations should ideally be applied to the base grid shape,
        // then wave displacement. Or, if wave is in 'world space', rotate after displacement.
        // Current implementation rotates the (x,y,z,w_displaced) points.
        let rotatedVertices = [...this.vertices];

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

    update(params) {
        let needsRegeneration = false; // For grid structure changes
        let needsWaveRecalculation = false; // For wave parameter changes

        for (const key in params) {
            if (this.parameters.hasOwnProperty(key)) {
                if (this.parameters[key] !== params[key]) {
                    this.parameters[key] = params[key];
                    if (['gridSize', 'divisions'].includes(key)) {
                        needsRegeneration = true;
                    } else if (['amplitude', 'waveVector', 'frequency', 'time'].includes(key)) {
                        needsWaveRecalculation = true;
                    }
                }
            }
        }

        if (needsRegeneration) {
            this.generate(); // This also calls calculateWave() for the new grid
        } else if (needsWaveRecalculation) {
            this.calculateWave();
        }

        if (params.rotations) {
            // Apply rotations after potential regeneration or wave recalculation
            this.apply4DRotations(params.rotations);
        }
    }

    // Buffer methods
    getVertexPositionsBuffer(gl) {
        if (!this.vertexPosBuffer) {
            this.vertexPosBuffer = gl.createBuffer();
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPosBuffer);
        // Use DYNAMIC_DRAW if vertices are updated frequently (e.g., time animation)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.DYNAMIC_DRAW);
        return this.vertexPosBuffer;
    }

    getIndexBuffer(gl) {
        if (!this.indexBuffer) {
            this.indexBuffer = gl.createBuffer();
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        const numPoints = (this.parameters.divisions + 1)**3;
        if (numPoints > 65535 && !this.warnedAboutIndices) {
             console.warn("WaveGeometry: Number of vertices exceeds Uint16 limit for indices. Consider using Uint32 if available (WebGL 2). Drawing may be incorrect.");
            this.warnedAboutIndices = true;
        }
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
        return this.indexBuffer;
    }

    getUVBuffer(gl) { // Provides 3D UVW coordinates
        if (!this.uvBuffer) {
            this.uvBuffer = gl.createBuffer();
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvs), gl.STATIC_DRAW);
        return this.uvBuffer;
    }

    destroy(gl) {
        if (this.vertexPosBuffer) gl.deleteBuffer(this.vertexPosBuffer);
        if (this.indexBuffer) gl.deleteBuffer(this.indexBuffer);
        if (this.uvBuffer) gl.deleteBuffer(this.uvBuffer);
        this.vertexPosBuffer = null;
        this.indexBuffer = null;
        this.uvBuffer = null;
        this.warnedAboutIndices = false;
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
const wave = new WaveGeometry({
    gridSize: 3.0,
    divisions: 10, // Keep low for manageable number of vertices/indices initially
    amplitude: 0.3,
    waveVector: [Math.PI, Math.PI/2, Math.PI/4],
    frequency: 1.5,
    time: 0
});
console.log("Wave Geometry Vertices Count:", wave.get4DVertices().length / 4);
console.log("Wave Geometry Indices Count:", wave.getIndices().length);

// Simulate time passing
// wave.update({ time: 0.5, rotations: { zw: Math.PI / 8 } });
// console.log("Wave First Vertex after update:", wave.getVertices().slice(0,4));
// wave.update({ time: 1.0 });
// console.log("Wave First Vertex after second update:", wave.getVertices().slice(0,4));

// Rendering this would involve drawing many small quads.
// Performance could be an issue with high divisions.
// Alternative: use points and shader to color based on 'w' value, or isosurface extraction.
*/
