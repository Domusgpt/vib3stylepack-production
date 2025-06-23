/**
 * KleinBottleGeometry: Generates vertices for a Klein bottle immersion in R^4 (or R^3).
 * A standard parametrization for a Klein bottle in R^3 (figure-8 immersion):
 * x = (R + r * cos(theta)) * cos(phi)  -- this is for a torus.
 *
 * Parametrization for a Klein bottle (from Wikipedia):
 * For 0 <= u < PI, 0 <= v < 2PI:
 * x = (r + cos(u/2) * sin(v) - sin(u/2) * sin(2v)) * cos(u)
 * y = (r + cos(u/2) * sin(v) - sin(u/2) * sin(2v)) * sin(u)
 * z = sin(u/2) * sin(v) + cos(u/2) * sin(2v)
 * This is an immersion in R^3. It self-intersects.
 *
 * For a non-intersecting embedding in R^4 (the "true" Klein bottle):
 * This is more complex. One way is to consider it as a fiber bundle over S^1 with fiber S^1.
 * x = r1 * cos(u)
 * y = r1 * sin(u)
 * z = r2 * cos(v) * cos(u/2) + r3 * sin(v) * sin(u/2)  -- This is not quite it.
 * w = r2 * cos(v) * sin(u/2) - r3 * sin(v) * cos(u/2)
 * This requires r1, r2, r3.
 *
 * Let's use a simpler approach: take a rectangle [0,1]x[0,1] and identify edges:
 * (0,y) ~ (1,y)  (cylinder)
 * (x,0) ~ (1-x,1) (Mobius strip identification for the ends)
 *
 * We will implement the R^3 immersion for visualization purposes, as it's more common in graphics.
 * The "non-orientable surface topology" is inherent.
 * We can add a 4th dimension component, e.g., w = constant, or w = f(u,v).
 * For now, w = 0, so it's an R^3 Klein bottle in the XYW space of R^4.
 */
class KleinBottleGeometry extends BaseGeometry {
    constructor(options = {}) {
        super();
        this.parameters = {
            scale: options.scale || 1.0, // General scale factor
            divisionsU: options.divisionsU || 50, // U parameter (0 to 2PI typically)
            divisionsV: options.divisionsV || 50, // V parameter (0 to 2PI typically)
            a: options.a || 2, // Parameter 'a' for some parametrizations (controls tube "thickness")
            // For the figure-8 immersion (Robert Israel's parametrization):
            // x = cos(u) * (cos(u/2) * (sqrt(2) + cos(v)) + sin(u/2) * sin(v) * cos(v))
            // y = sin(u) * (cos(u/2) * (sqrt(2) + cos(v)) + sin(u/2) * sin(v) * cos(v))
            // z = -sin(u/2) * (sqrt(2) + cos(v)) + cos(u/2) * sin(v) * cos(v)
            // u from -PI to PI, v from -PI to PI.
            // This is a bit complex.
            // Let's use the one from Three.js / Wikipedia (Lawson Klein Bottle)
            // x = (a + cos(v/2)sin(u) - sin(v/2)sin(2u))cos(v)
            // y = (a + cos(v/2)sin(u) - sin(v/2)sin(2u))sin(v)
            // z = sin(v/2)sin(u) + cos(v/2)sin(2u)
            // where u is [0, 2PI] and v is [0, 2PI]
            // This is still R^3. Let's use this and add a simple w component.
        };
        this.baseVertices4D = [];
        this.uvs = [];
        this.generate();
    }

    generate() {
        this.vertices = [];
        this.indices = [];
        this.baseVertices4D = [];
        this.uvs = [];

        const { scale, divisionsU, divisionsV, a } = this.parameters;
        const uRange = 2 * Math.PI;
        const vRange = 2 * Math.PI;

        for (let j = 0; j <= divisionsV; j++) {
            const v = (j / divisionsV) * vRange; // Parameter v

            for (let i = 0; i <= divisionsU; i++) {
                const u = (i / divisionsU) * uRange; // Parameter u

                // Lawson Klein Bottle parametrization (often used in graphics)
                const x_3d = (a + Math.cos(v / 2) * Math.sin(u) - Math.sin(v / 2) * Math.sin(2 * u)) * Math.cos(v);
                const y_3d = (a + Math.cos(v / 2) * Math.sin(u) - Math.sin(v / 2) * Math.sin(2 * u)) * Math.sin(v);
                const z_3d = Math.sin(v / 2) * Math.sin(u) + Math.cos(v / 2) * Math.sin(2 * u);

                // Simple extension to 4D: set w to 0 or a simple function.
                // Let w = 0 for now, placing it in the xyz hyperplane of R^4.
                // Or, to make it slightly more "4D", w could be related to u or v, e.g., w = scale * sin(u/2) * cos(v/2)
                // For this example, let's keep w = 0 to focus on the R^3 shape.
                const w_4d = 0.0; // Or, e.g., 0.1 * scale * Math.sin(u) * Math.cos(v);

                this.baseVertices4D.push(scale * x_3d, scale * y_3d, scale * z_3d, scale * w_4d);
                this.uvs.push(i / divisionsU, j / divisionsV);
            }
        }

        // Generate indices for quads
        for (let j = 0; j < divisionsV; j++) {
            for (let i = 0; i < divisionsU; i++) {
                const v1 = j * (divisionsU + 1) + i;
                const v2 = v1 + 1;
                const v3 = (j + 1) * (divisionsU + 1) + i;
                const v4 = v3 + 1;

                // Quad: v1-v2-v4-v3
                // Winding order might need adjustment depending on normals/lighting
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
             console.warn("KleinBottleGeometry: Number of vertices exceeds Uint16 limit for indices. Consider using Uint32 if available (WebGL 2). Drawing may be incorrect.");
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
    global.BaseGeometry = class {
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
const klein = new KleinBottleGeometry({
    scale: 0.5,
    divisionsU: 60,
    divisionsV: 60,
    a: 3 // Controls the "width" of the tube part
});
console.log("Klein Bottle Vertices Count:", klein.get4DVertices().length / 4);
console.log("Klein Bottle UVs Count:", klein.getUVs().length / 2);
console.log("Klein Bottle Indices Count:", klein.getIndices().length);

klein.update({ scale: 0.6, rotations: { xy: Math.PI / 4 } });
console.log("Updated Klein Bottle First Vertex:", klein.getVertices().slice(0,4));
*/
