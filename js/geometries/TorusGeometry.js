/**
 * TorusGeometry: Generates vertices and indices for a 4D Torus (specifically, a 3-torus or duocylinder).
 * A 3-torus can be parameterized as ( (R + r_xy * cos(v)) * cos(u), (R + r_xy * cos(v)) * sin(u), r_zw * cos(w), r_zw * sin(w) )
 * Or, more simply, x = cos(u), y = sin(u), z = cos(v), w = sin(v) for a unit Clifford torus in S^3.
 * We will implement a Clifford Torus, which is a product of two circles S1 x S1 embedded in R4 (as part of S3).
 * For flow patterns, this usually implies animating texture coordinates or vertex properties.
 */
class TorusGeometry extends BaseGeometry {
    constructor(options = {}) {
        super();
        this.parameters = {
            // For a Clifford torus S^1 x S^1, radii of the two circles can be different, affecting embedding in R^4.
            // If r1=r2, it's embedded in a 3-sphere. Let's use r1, r2 for the two circles.
            radius1: options.radius1 || 1.0, // Radius of the first circle (e.g., in XY plane)
            radius2: options.radius2 || 0.5, // Radius of the second circle (e.g., in ZW plane)
            tubeRadius1: options.tubeRadius1 || 0.2, // If we are making a "thick" torus, like a 2-torus extended.
            tubeRadius2: options.tubeRadius2 || 0.1, // This is getting too complex.
            // Let's simplify: Clifford Torus S1 x S1.
            // x = r1 * cos(u)
            // y = r1 * sin(u)
            // z = r2 * cos(v)
            // w = r2 * sin(v)
            // The total radius in R^4 is sqrt(r1^2 + r2^2). If this is 1, it's on the unit 3-sphere.
            // We will use r1 and r2 as the primary radii.
            majorRadius: options.majorRadius || 1.0, // r1 for the "major" circle
            minorRadius: options.minorRadius || 0.5, // r2 for the "minor" circle
            divisionsU: options.divisionsU || 32,    // Segments for the first angle (major circle)
            divisionsV: options.divisionsV || 16,    // Segments for the second angle (minor circle)
            // Flow pattern parameters could be texture coordinates or attributes for shaders
        };
        this.baseVertices4D = [];
        this.uvs = []; // For flow patterns
        this.generate();
    }

    generate() {
        this.vertices = [];
        this.indices = [];
        this.baseVertices4D = [];
        this.uvs = []; // u for major angle, v for minor angle

        const { majorRadius, minorRadius, divisionsU, divisionsV } = this.parameters;

        for (let j = 0; j <= divisionsV; j++) { // Angle v for the minor circle
            const v = (j / divisionsV) * 2 * Math.PI; // 0 to 2PI
            const cosV = Math.cos(v);
            const sinV = Math.sin(v);

            for (let i = 0; i <= divisionsU; i++) { // Angle u for the major circle
                const u = (i / divisionsU) * 2 * Math.PI; // 0 to 2PI
                const cosU = Math.cos(u);
                const sinU = Math.sin(u);

                // Parametrization of a Clifford Torus
                const x = majorRadius * cosU;
                const y = majorRadius * sinU;
                const z = minorRadius * cosV;
                const w = minorRadius * sinV;

                this.baseVertices4D.push(x, y, z, w);
                this.uvs.push(i / divisionsU, j / divisionsV); // Store UVs for texturing/flow
            }
        }

        // Generate indices for quads (two triangles per quad)
        for (let j = 0; j < divisionsV; j++) {
            for (let i = 0; i < divisionsU; i++) {
                const v1 = j * (divisionsU + 1) + i;
                const v2 = v1 + 1;
                const v3 = (j + 1) * (divisionsU + 1) + i;
                const v4 = v3 + 1;

                // Quad: v1-v2-v4-v3
                this.indices.push(v1, v2, v4);
                this.indices.push(v1, v4, v3);
            }
        }

        this.vertices = [...this.baseVertices4D];
    }

    get4DVertices() {
        return this.vertices;
    }

    getUVs() {
        return this.uvs;
    }

    // apply4DRotations - can be inherited or implemented.
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

    update(params) {
        let needsRegeneration = false;
        for (const key in params) {
            if (this.parameters.hasOwnProperty(key) && this.parameters[key] !== params[key]) {
                this.parameters[key] = params[key];
                needsRegeneration = true;
            }
        }

        if (needsRegeneration) {
            this.generate();
        }

        if (params.rotations) {
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

    getIndexBuffer(gl) {
        if (!this.indexBuffer) {
            this.indexBuffer = gl.createBuffer();
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        const maxIndex = (this.parameters.divisionsU + 1) * (this.parameters.divisionsV + 1) -1;
        if (maxIndex > 65535 && !this.warnedAboutIndices) {
             console.warn("TorusGeometry: Number of vertices exceeds Uint16 limit for indices. Consider using Uint32 if available (WebGL 2). Drawing may be incorrect.");
            this.warnedAboutIndices = true;
        }
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
        return this.indexBuffer;
    }

    getUVBuffer(gl) {
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
const torus = new TorusGeometry({
    majorRadius: 1.2,
    minorRadius: 0.4,
    divisionsU: 40,
    divisionsV: 20
});
console.log("Torus 4D Vertices Count:", torus.get4DVertices().length / 4);
console.log("Torus UVs Count:", torus.getUVs().length / 2);
console.log("Torus Indices Count:", torus.getIndices().length);

torus.update({ majorRadius: 1.3, rotations: { zw: Math.PI / 3 } });
console.log("Updated Torus First Vertex:", torus.getVertices().slice(0,4));
*/
