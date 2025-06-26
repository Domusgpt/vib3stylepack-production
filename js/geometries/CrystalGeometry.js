/**
 * CrystalGeometry: Generates vertices for ordered lattice structures in 4D.
 * This could be a section of a 4D crystal lattice (e.g., hypercubic, body-centered hypercubic).
 * We will implement a simple hypercubic lattice section.
 * Each lattice point can be represented by a small shape (e.g., a small hypercube or hypersphere)
 * or connected by lines representing bonds.
 *
 * For this implementation, we'll generate points at the lattice sites of a hypercubic grid.
 * The "geometry" will be a point cloud of these sites.
 * Optionally, we can generate edges connecting adjacent sites.
 */
class CrystalGeometry extends BaseGeometry {
    constructor(options = {}) {
        super();
        this.parameters = {
            latticeSize: options.latticeSize || [3, 3, 3, 2], // Number of unit cells along each of the 4 dimensions (nx,ny,nz,nw)
            unitCellSpacing: options.unitCellSpacing || 0.5, // Spacing between lattice points
            pointRepresentation: options.pointRepresentation || 'point', // 'point', 'smallCube', 'sphere' - affects how it might be rendered later
                                                                    // For now, this class just generates points and optionally edges.
        };
        this.baseVertices4D = []; // Stores the 4D coordinates of lattice points
        this.generate();
    }

    generate() {
        this.vertices = []; // Will store 4D point data
        this.indices = [];  // For edges or if points are represented by more complex shapes

        const { latticeSize, unitCellSpacing } = this.parameters;
        const [nx, ny, nz, nw] = latticeSize; // Number of points along each axis, not cells. Let's clarify: cells or points?
                                            // If cells, then (nx+1) points. Let's assume nx,ny,nz,nw are number of points.

        const startOffset = [
            -(nx -1) * unitCellSpacing / 2,
            -(ny -1) * unitCellSpacing / 2,
            -(nz -1) * unitCellSpacing / 2,
            -(nw -1) * unitCellSpacing / 2,
        ];

        const pointMap = new Map(); // To map (i,j,k,l) index to flat vertex index for edge generation
        let flatVertexIndex = 0;

        for (let l = 0; l < nw; l++) { // W dimension
            const w_coord = startOffset[3] + l * unitCellSpacing;
            for (let k = 0; k < nz; k++) { // Z dimension
                const z_coord = startOffset[2] + k * unitCellSpacing;
                for (let j = 0; j < ny; j++) { // Y dimension
                    const y_coord = startOffset[1] + j * unitCellSpacing;
                    for (let i = 0; i < nx; i++) { // X dimension
                        const x_coord = startOffset[0] + i * unitCellSpacing;

                        this.baseVertices4D.push(x_coord, y_coord, z_coord, w_coord);
                        pointMap.set(`${i},${j},${k},${l}`, flatVertexIndex++);
                    }
                }
            }
        }

        this.vertices = [...this.baseVertices4D];

        // Generate indices for edges connecting adjacent lattice points
        for (let l = 0; l < nw; l++) {
            for (let k = 0; k < nz; k++) {
                for (let j = 0; j < ny; j++) {
                    for (let i = 0; i < nx; i++) {
                        const p1_idx = pointMap.get(`${i},${j},${k},${l}`);

                        // Connect to neighbor in +X direction
                        if (i + 1 < nx) {
                            const p2_idx = pointMap.get(`${i+1},${j},${k},${l}`);
                            this.indices.push(p1_idx, p2_idx);
                        }
                        // Connect to neighbor in +Y direction
                        if (j + 1 < ny) {
                            const p2_idx = pointMap.get(`${i},${j+1},${k},${l}`);
                            this.indices.push(p1_idx, p2_idx);
                        }
                        // Connect to neighbor in +Z direction
                        if (k + 1 < nz) {
                            const p2_idx = pointMap.get(`${i},${j},${k+1},${l}`);
                            this.indices.push(p1_idx, p2_idx);
                        }
                        // Connect to neighbor in +W direction
                        if (l + 1 < nw) {
                            const p2_idx = pointMap.get(`${i},${j},${k},${l+1}`);
                            this.indices.push(p1_idx, p2_idx);
                        }
                    }
                }
            }
        }
        // If pointRepresentation is 'smallCube' or 'sphere', the actual geometry for those
        // would be instanced at each point by the renderer/shader. This class provides sites.
    }

    get4DVertices() {
        return this.vertices;
    }

    getEdgeIndices() {
        return this.indices;
    }

    // No specific UVs for this type unless mapping texture to the lattice.
    // getUVs() { return []; }

    apply4DRotations(rotations) {
        const { xy = 0, xz = 0, xw = 0, yz = 0, yw = 0, zw = 0 } = rotations;
        let rotatedVertices = [...this.baseVertices4D]; // Rotate the original lattice points

        const cos = Math.cos;
        const sin = Math.sin;

        if (xy !== 0) { const c = cos(xy), s = sin(xy); for (let i = 0; i < rotatedVertices.length; i += 4) { const x = rotatedVertices[i], y = rotatedVertices[i+1]; rotatedVertices[i] = x * c - y * s; rotatedVertices[i+1] = x * s + y * c; }}
        if (xz !== 0) { const c = cos(xz), s = sin(xz); for (let i = 0; i < rotatedVertices.length; i += 4) { const x = rotatedVertices[i], z = rotatedVertices[i+2]; rotatedVertices[i] = x * c - z * s; rotatedVertices[i+2] = x * s + z * c; }}
        if (xw !== 0) { const c = cos(xw), s = sin(xw); for (let i = 0; i < rotatedVertices.length; i += 4) { const x = rotatedVertices[i], w = rotatedVertices[i+3]; rotatedVertices[i] = x * c - w * s; rotatedVertices[i+3] = x * s + w * c; }}
        if (yz !== 0) { const c = cos(yz), s = sin(yz); for (let i = 0; i < rotatedVertices.length; i += 4) { const y = rotatedVertices[i+1], z = rotatedVertices[i+2]; rotatedVertices[i+1] = y * c - z * s; rotatedVertices[i+2] = y * s + z * c; }}
        if (yw !== 0) { const c = cos(yw), s = sin(yw); for (let i = 0; i < rotatedVertices.length; i += 4) { const y = rotatedVertices[i+1], w = rotatedVertices[i+3]; rotatedVertices[i+1] = y * c - w * s; rotatedVertices[i+3] = y * s + w * c; }}
        if (zw !== 0) { const c = cos(zw), s = sin(zw); for (let i = 0; i < rotatedVertices.length; i += 4) { const z = rotatedVertices[i+2], w = rotatedVertices[i+3]; rotatedVertices[i+2] = z * c - w * s; rotatedVertices[i+3] = z * s + w * c; }}

        this.vertices = rotatedVertices; // Update live vertices
        return this.vertices;
    }

    update(params) {
        let needsRegeneration = false;
        if (params.latticeSize !== undefined &&
            (params.latticeSize.length !== this.parameters.latticeSize.length ||
             params.latticeSize.some((val, idx) => val !== this.parameters.latticeSize[idx]))) {
            this.parameters.latticeSize = [...params.latticeSize];
            needsRegeneration = true;
        }
        if (params.unitCellSpacing !== undefined && params.unitCellSpacing !== this.parameters.unitCellSpacing) {
            this.parameters.unitCellSpacing = params.unitCellSpacing;
            needsRegeneration = true;
        }
        if (params.pointRepresentation !== undefined && params.pointRepresentation !== this.parameters.pointRepresentation) {
            this.parameters.pointRepresentation = params.pointRepresentation;
            // This might not require vertex/index regeneration if handled by shader,
            // but could if it implied different base geometry.
        }

        if (needsRegeneration) {
            this.generate(); // This sets this.baseVertices4D and this.vertices, and this.indices
        }

        if (params.rotations) {
            // If regenerated, this.vertices is fresh. If not, it might have prior rotations.
            // To avoid cumulative rotation issues, apply4DRotations should work from baseVertices4D.
            // The current apply4DRotations uses this.baseVertices4D as source.
            this.apply4DRotations(params.rotations);
        }
    }

    // Buffer methods
    getVertexPositionsBuffer(gl) {
        if (!this.vertexPosBuffer) {
            this.vertexPosBuffer = gl.createBuffer();
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
        return this.vertexPosBuffer;
    }

    getIndexBuffer(gl) { // For edges
        if (!this.indexBuffer) {
            this.indexBuffer = gl.createBuffer();
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        const numPoints = this.parameters.latticeSize.reduce((acc, val) => acc * val, 1);
        if (numPoints > 65535 && !this.warnedAboutIndices) { // Max index can be numPoints-1
             console.warn("CrystalGeometry: Number of vertices exceeds Uint16 limit for indices. Consider using Uint32 if available (WebGL 2). Drawing may be incorrect.");
            this.warnedAboutIndices = true;
        }
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
        return this.indexBuffer;
    }

    destroy(gl) {
        if (this.vertexPosBuffer) gl.deleteBuffer(this.vertexPosBuffer);
        if (this.indexBuffer) gl.deleteBuffer(this.indexBuffer);
        this.vertexPosBuffer = null;
        this.indexBuffer = null;
        this.warnedAboutIndices = false;
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

// Example Usage:
/*
const crystal = new CrystalGeometry({
    latticeSize: [3, 3, 2, 2], // nx, ny, nz, nw points
    unitCellSpacing: 0.8
});
console.log("Crystal Lattice Points Count:", crystal.get4DVertices().length / 4);
console.log("Crystal Lattice Edges Count:", crystal.getEdgeIndices().length / 2);

// crystal.update({ unitCellSpacing: 1.0, rotations: { yz: Math.PI / 6 } });
// console.log("Updated Crystal First Point:", crystal.getVertices().slice(0,4));

// Rendering this would typically use gl.POINTS for lattice sites
// and gl.LINES for edges.
*/
