/**
 * HypersphereGeometry: Generates vertices and indices for a 4D hypersphere (glome).
 * Can also represent a spherical shell.
 */
class HypersphereGeometry extends BaseGeometry {
    constructor(options = {}) {
        super();
        this.parameters = {
            radius: options.radius || 1.0,
            shellWidth: options.shellWidth || 0.1, // For creating a shell
            divisionsU: options.divisionsU || 32, // Corresponds to phi in 3D sphere (longitude)
            divisionsV: options.divisionsV || 16, // Corresponds to theta in 3D sphere (latitude)
            divisionsW: options.divisionsW || 8,   // Divisions for the 4th dimension angle (chi)
            isShell: options.isShell !== undefined ? options.isShell : true, // Whether to generate a shell or solid
        };
        this.baseVertices4D = [];
        this.generate();
    }

    generate() {
        this.vertices = []; // Will store 4D vertex data
        this.indices = [];  // Will store indices for triangles (or lines if wireframe)
        this.baseVertices4D = []; // Store unrotated 4D vertices

        const { radius, shellWidth, divisionsU, divisionsV, divisionsW, isShell } = this.parameters;

        // Generate vertices for the outer surface
        this.generateSphereSurface(radius, divisionsU, divisionsV, divisionsW, this.baseVertices4D);

        let innerShellOffset = this.baseVertices4D.length / 4; // Number of vertices in the outer shell

        if (isShell && shellWidth > 0 && shellWidth < radius) {
            // Generate vertices for the inner surface
            this.generateSphereSurface(radius - shellWidth, divisionsU, divisionsV, divisionsW, this.baseVertices4D);
        } else if (isShell && (shellWidth <=0 || shellWidth >= radius)) {
            // If shellWidth is invalid for a shell, effectively render as a solid sphere (or just outer surface)
            // For simplicity, we'll only use the outer shell vertices and connect them as if solid.
            innerShellOffset = 0; // No distinct inner shell
        }


        // Generate indices to form triangles for the surface(s)
        // This is complex for a 4D object's projection.
        // Typically, a 3-sphere's surface is a 3-manifold. Projecting this to 3D
        // and then rendering its "surface" (which is 2D) is tricky.
        // A common approach is to render the "voxels" or "tetrahedra" that make up the 3-sphere.
        // Or, to visualize its 3D cross-sections.

        // For now, let's focus on generating points on the 3-sphere surface (S^3).
        // If we want to render it as a "solid" looking object in 3D projection,
        // we'd need to define cells (like tetrahedra) and then render their projected faces.

        // Simpler approach for visualization: connect points to form lines or triangles
        // as if it's a 3D sphere being tessellated, but using 4D coordinates.
        // The following indexing is for a 3D sphere-like surface.

        // Indices for the outer surface
        this.generateSurfaceIndices(0, divisionsU, divisionsV, divisionsW, false);

        if (isShell && innerShellOffset > 0) {
            // Indices for the inner surface (offset by number of outer vertices)
            this.generateSurfaceIndices(innerShellOffset, divisionsU, divisionsV, divisionsW, true); // true for reversed winding

            // Indices to connect outer and inner shells (sides of the shell)
            // For each quad on the outer shell, connect it to the corresponding quad on the inner shell
            // This creates 8 triangles (2 per side face of the cuboid between quads)
            for (let iw = 0; iw < divisionsW; iw++) {
                for (let iv = 0; iv < divisionsV; iv++) {
                    for (let iu = 0; iu < divisionsU; iu++) {
                        const i1 = (iw * (divisionsV + 1) + iv) * (divisionsU + 1) + iu;
                        const i2 = i1 + 1;
                        const i3 = ((iw * (divisionsV + 1) + (iv + 1))) * (divisionsU + 1) + iu;
                        const i4 = i3 + 1;

                        const o1 = i1 + innerShellOffset;
                        const o2 = i2 + innerShellOffset;
                        const o3 = i3 + innerShellOffset;
                        const o4 = i4 + innerShellOffset;

                        // Side 1 (i1, i2, o2, o1)
                        this.indices.push(i1, i2, o1); this.indices.push(o1, i2, o2);
                        // Side 2 (i2, i4, o4, o2)
                        this.indices.push(i2, i4, o2); this.indices.push(o2, i4, o4);
                        // Side 3 (i4, i3, o3, o4)
                        this.indices.push(i4, i3, o4); this.indices.push(o4, i3, o3);
                        // Side 4 (i3, i1, o1, o3)
                        this.indices.push(i3, i1, o3); this.indices.push(o3, i1, o1);
                    }
                }
            }
        }


        this.vertices = [...this.baseVertices4D]; // Store 4D vertices
    }

    /**
     * Helper function to generate vertices for one spherical surface.
     * @param {number} r - Radius of the sphere.
     * @param {number} dU - Divisions for angle u (phi, longitude-like).
     * @param {number} dV - Divisions for angle v (theta, latitude-like).
     * @param {number} dW - Divisions for angle w (chi, 4th dimension angle).
     * @param {Array<number>} targetArray - Array to push vertices into.
     */
    generateSphereSurface(r, dU, dV, dW, targetArray) {
        // Parametric equations for a 3-sphere ( S^3 in R^4 )
        // x = r * cos(chi) * cos(theta) * cos(phi)
        // y = r * cos(chi) * cos(theta) * sin(phi)
        // z = r * cos(chi) * sin(theta)
        // w = r * sin(chi)
        // where phi in [0, 2pi], theta in [-pi/2, pi/2], chi in [-pi/2, pi/2] (or [0,pi] for half)
        // We'll use full ranges for more complete coverage if desired, adjust based on visualization goals.
        // Using: phi [0, 2PI], theta [0, PI], chi [0, PI] for simplicity here.
        // This covers one "hemisphere" of the 3-sphere if chi is [0, PI/2].
        // To get the full 3-sphere, chi should range over PI, or use symmetry.
        // Let's use chi from 0 to PI for a "full" sweep.

        for (let iw = 0; iw <= dW; iw++) { // chi angle (4th dimension)
            const chi = (iw / dW) * Math.PI; // 0 to PI
            const cosChi = Math.cos(chi);
            const sinChi = Math.sin(chi);

            for (let iv = 0; iv <= dV; iv++) { // theta angle (latitude-like)
                const theta = (iv / dV) * Math.PI; // 0 to PI
                const cosTheta = Math.cos(theta);
                const sinTheta = Math.sin(theta);

                for (let iu = 0; iu <= dU; iu++) { // phi angle (longitude-like)
                    const phi = (iu / dU) * 2 * Math.PI; // 0 to 2PI
                    const cosPhi = Math.cos(phi);
                    const sinPhi = Math.sin(phi);

                    const x = r * cosChi * sinTheta * cosPhi; // Standard spherical: sin(theta) for xy plane projection part
                    const y = r * cosChi * sinTheta * sinPhi;
                    const z = r * cosChi * cosTheta;          // Standard spherical: cos(theta) for z part
                    const w = r * sinChi;                     // The 4th dimension component

                    targetArray.push(x, y, z, w);
                }
            }
        }
    }

    /**
     * Helper to generate triangle indices for a spherical surface grid.
     * @param {number} offset - Vertex index offset (for inner/outer shells).
     * @param {number} dU - divisionsU
     * @param {number} dV - divisionsV
     * @param {number} dW - divisionsW
     * @param {boolean} reverseWinding - If true, reverses triangle winding order.
     */
    generateSurfaceIndices(offset, dU, dV, dW, reverseWinding) {
        // This indexing forms triangles on "slices" of the hypersphere.
        // A true "surface" of a 3-sphere is a 3-manifold, which is hard to directly triangulate into 2D.
        // This approach creates 2D patches (quads made of 2 triangles) across the "layers" defined by dW.
        // It's more like connecting adjacent points on the parametric grid.

        for (let iw = 0; iw < dW; iw++) {
            for (let iv = 0; iv < dV; iv++) {
                for (let iu = 0; iu < dU; iu++) {
                    // Vertex indices for a quad in the UV grid for a given W slice
                    const v1 = offset + (iw * (dV + 1) + iv) * (dU + 1) + iu;
                    const v2 = v1 + 1; // iu + 1
                    const v3 = offset + (iw * (dV + 1) + (iv + 1)) * (dU + 1) + iu;
                    const v4 = v3 + 1; // iu + 1, iv + 1

                    // Quad from (v1, v2, v4, v3)
                    if (!reverseWinding) {
                        this.indices.push(v1, v2, v4);
                        this.indices.push(v1, v4, v3);
                    } else {
                        this.indices.push(v1, v4, v2);
                        this.indices.push(v1, v3, v4);
                    }

                    // If we want to connect between W slices (more complex, forms tetrahedral cells)
                    // This part is omitted for now to keep it to surface rendering.
                    // To do that, you'd take a quad (v1,v2,v4,v3) on slice iw
                    // and connect it to the corresponding quad on slice iw+1.
                    // const nextW_offset = (dV + 1) * (dU + 1);
                    // const v1_nextW = v1 + nextW_offset;
                    // const v2_nextW = v2 + nextW_offset;
                    // const v3_nextW = v3 + nextW_offset;
                    // const v4_nextW = v4 + nextW_offset;
                    // Then form tetrahedra or prisms.
                }
            }
        }
    }


    get4DVertices() {
        return this.baseVertices4D; // Or this.vertices if they are transformed
    }

    // apply4DRotations - could be inherited or implemented if specific rotation logic is needed
    // For now, assume BaseGeometry or a utility will handle rotations if CPU-side.
    // Or rotations are done in shader.

    update(params) {
        let needsRegeneration = false;
        for (const key in params) {
            if (this.parameters.hasOwnProperty(key) && this.parameters[key] !== params[key]) {
                this.parameters[key] = params[key];
                if (key !== 'shellWidth' || params.isShell) { // shellWidth only matters if isShell
                     needsRegeneration = true;
                } else if (key === 'isShell'){
                    needsRegeneration = true;
                }
            }
        }

        if (params.shellWidth !== undefined && this.parameters.isShell) {
             this.parameters.shellWidth = params.shellWidth;
             needsRegeneration = true; // shellWidth always needs regen if isShell
        }


        if (needsRegeneration) {
            this.generate();
        }

        // Handle dynamic rotation updates if needed (similar to HypercubeGeometry)
        if (params.rotations && typeof this.apply4DRotations === 'function') {
            this.apply4DRotations(params.rotations);
        } else if (params.rotations) {
            // Fallback or warning if rotations are expected but no method
            // console.warn("HypersphereGeometry: Rotations passed but no apply4DRotations method.");
            // As a default, let's assume a generic rotation application if available (e.g. from a common utility or future BaseGeometry enhancement)
            if (super.apply4DRotations) { // Check if BaseGeometry has a generic one
                super.apply4DRotations(params.rotations);
            }
        }
    }

    // Buffer methods (getVertexPositionsBuffer, getIndexBuffer, destroy) can be similar to HypercubeGeometry
    // or potentially generalized in BaseGeometry if the structure (this.vertices, this.indices) is consistent.

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
        // Hypersphere can have many vertices, check if Uint16 is enough for indices
        const maxIndex = this.vertices.length / 4 -1; // 4 components per vertex
        if (maxIndex > 65535 && !this.warnedAboutIndices) {
            console.warn("HypersphereGeometry: Number of vertices exceeds Uint16 limit for indices. Consider using Uint32 if available (WebGL 2). Drawing may be incorrect.");
            this.warnedAboutIndices = true; // Prevent spamming console
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
    global.BaseGeometry = class {
        constructor() { this.vertices = []; this.indices = []; }
        generate() {}
        update(params) {}
        getVertices() { return this.vertices; }
        getIndices() { return this.indices; }
    };
}

// Example Usage:
/*
const hypersphere = new HypersphereGeometry({
    radius: 1.0,
    shellWidth: 0.05, // u_shellWidth
    divisionsU: 16, // Related to grid density
    divisionsV: 8,
    divisionsW: 4,
    isShell: true
});
console.log("Hypersphere 4D Vertices Count:", hypersphere.get4DVertices().length / 4);
console.log("Hypersphere Indices Count:", hypersphere.getIndices().length);

// hypersphere.update({ radius: 1.2, shellWidth: 0.03 });
// console.log("Updated Hypersphere Vertices Count:", hypersphere.get4DVertices().length / 4);
*/
