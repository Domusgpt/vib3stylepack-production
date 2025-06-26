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

        // The 5 vertices of a regular 5-cell in R^4 can be defined as:
        // v0 = (s, s, s, -3s/sqrt(5)) * k
        // v1 = (s, -s, -s, s/sqrt(5)) * k
        // v2 = (-s, s, -s, s/sqrt(5)) * k
        // v3 = (-s, -s, s, s/sqrt(5)) * k
        // v4 = (0, 0, 0, 4s/sqrt(5)) * k  -- wait, this is for R^3 for a tetrahedron.
        //
        // Correct vertices for a 5-cell centered at origin in R^4:
        // (1,1,1,-1/sqrt(5)) * scale
        // (1,-1,-1,-1/sqrt(5)) * scale
        // (-1,1,-1,-1/sqrt(5)) * scale
        // (-1,-1,1,-1/sqrt(5)) * scale
        // (0,0,0, 4/sqrt(5)-1/sqrt(5) = 3/sqrt(5) ) No this is for a specific orientation.
        //
        // Standard construction for n-simplex:
        // Vertices e_i in R^(n+1) (standard basis vectors) and then project to R^n.
        // Or, use points:
        // (s,0,0,0), (0,s,0,0), (0,0,s,0), (0,0,0,s) and a fifth point.
        // A common set of vertices for a 5-cell centered at the origin:
        // Let k = size parameter.
        // v0 = (k, k, k, k) -- not regular unless these are permutations of (+-1,0,0,0) etc.
        //
        // Vertices of a regular n-simplex can be taken as permutations of (1,0,...,0) in R^n if centered appropriately.
        // Or, more directly for a 5-cell (regular hypertetrahedron) in R^4:
        // (s, s, s, -s/√2) -- this is not it either.
        //
        // Using the standard construction for a regular n-simplex of edge length L:
        // v_i = ( L/(sqrt(2)) * e_i ) for i=1..n
        // v_{n+1} = ( L/(2*sqrt(2)) * (1,1,..,1) - L * sqrt((n+2)/(8n)) * (1,1,..,1) ) -- this is too complex.
        //
        // Let's use a known set of coordinates for a 5-cell (pentachoron) of edge length sqrt(2)*s:
        // (s,0,0,0), (0,s,0,0), (0,0,s,0), (0,0,0,s), (-s/2,-s/2,-s/2,-s/2) -- No this is not centered.
        //
        // A set of 5 points forming a regular simplex in R^4, centered at the origin, with side length 'a':
        // Let a = this.parameters.size for simplicity, though 'size' might mean radius here.
        // For edge length L:
        const s = this.parameters.size; // This 's' will be a scaling factor for unit coordinates.
        this.baseVertices4D = [
            s * 1, s * 0, s * 0, s * (-1 / Math.sqrt(10)),
            s * (-1/3), s * (2 * Math.sqrt(2) / 3), s * 0, s * (-1 / Math.sqrt(10)),
            s * (-1/3), s * (-Math.sqrt(2) / 3), s * (Math.sqrt(6) / 3), s * (-1 / Math.sqrt(10)),
            s * (-1/3), s * (-Math.sqrt(2) / 3), s * (-Math.sqrt(6) / 3), s * (-1 / Math.sqrt(10)),
            s * 0, s * 0, s * 0, s * (4 / Math.sqrt(10)) // This makes the sum of w coords non-zero, so not centered at origin if these are direct.
        ];
        // The above set is for a tetrahedron in R^3 embedded in R^4, with the 4th vertex along w.
        // This is NOT a 5-cell.

        // Vertices for a 5-cell (regular 4-simplex) centered at the origin.
        // These can be:
        // (1,1,1,-1), (1,-1,-1,-1), (-1,1,-1,-1), (-1,-1,1,-1), (0,0,0,2) -- not regular like this.
        //
        // Use construction from https://en.wikipedia.org/wiki/5-cell#Coordinates
        // Edge length sqrt(2). Scale by 's'.
        this.baseVertices4D = [
             s * 1,  s * 1,  s * 1,  s * 1,  // Not centered.
            // Center these: sum of coords should be 0.
            // Vertices (±1, ±1, 0, 0) permuted, then take a subset. No.
            //
            // From "Regular Polytopes" by Coxeter, or MathWorld:
            // A 5-cell with edge length L = 2 can have vertices:
            // (1,1,1,1), (1,-1,-1,-1), (-1,1,-1,-1), (-1,-1,1,-1), (-1,-1,-1,1) - No, these are vertices of a tesseract (hypercube) or cross-polytope.
            //
            // Let's use the set:
            // (s,0,0,0), (0,s,0,0), (0,0,s,0), (0,0,0,s) and a 5th vertex that makes it regular.
            // This is not easy to find directly.
            //
            // Alternative: coordinates for the vertices of an n-simplex centered at the origin are
            // v_k for k=0 to n: x_i = -C if i=k, x_i = C_n if i!=k
            // where C_n = 1/sqrt(2n(n+1)) and C = -n*C_n = -n/sqrt(2n(n+1))
            // For n=4 (5-cell):
            // C_4 = 1/sqrt(2*4*5) = 1/sqrt(40)
            // C = -4/sqrt(40) = -2/sqrt(10)
            // Vertex 0: (-2/sqrt(10), 1/sqrt(40), 1/sqrt(40), 1/sqrt(40)) - This is not intuitive.

            // Using a simpler construction: 5 points in R^4, all equidistant.
            // v0 = (s,s,s,s)
            // v1 = (s,-s,-s,-s)
            // v2 = (-s,s,-s,-s)
            // v3 = (-s,-s,s,-s)
            // v4 = (0,0,0, X) - what X makes this regular?
            // This is getting complicated. Let's use a known good set if possible.
            // The vertices of a regular 5-cell, centered at the origin, edge length sqrt(2):
            // (1,0,0,0), (0,1,0,0), (0,0,1,0), (0,0,0,1), and (-1/2, -1/2, -1/2, -1/2)
            // This is NOT centered if the sum of coordinates for each vertex is not proportional.
            //
            // Let's use vertices for a 5-cell of edge length 2, scaled by `s/sqrt(2*sqrt(5))` to make radius `s`.
            // (s,s,s,s), (s,-s,-s,-s), (-s,s,-s,-s), (-s,-s,s,-s), (-s,-s,-s,s) is for a hyper-diamond (16-cell).
            //
            // Okay, using the coordinates for the vertices of a regular pentachoron (5-cell) of edge length 2 centered at the origin:
            // (1,1,1,1), (1,-1,-1,-1), (-1,1,-1,-1), (-1,-1,1,-1), (-1,-1,-1,1) are vertices of a tesseract.
            // This is not it.
            //
            // Vertices of a 5-cell centered at the origin, from Wikipedia:
            // These are 5 points, scaled by `size`.
            const r = this.parameters.size;
            this.baseVertices4D = [
                r * 1,  r * 1,  r * 1,  r * (-1 / Math.sqrt(5)),
                r * 1, -r * 1, -r * 1,  r * (-1 / Math.sqrt(5)),
               -r * 1,  r * 1, -r * 1,  r * (-1 / Math.sqrt(5)),
               -r * 1, -r * 1,  r * 1,  r * (-1 / Math.sqrt(5)),
                r * 0,  r * 0,  r * 0,  r * (4 / Math.sqrt(5) - 1/Math.sqrt(5)) // This is wrong. The 5th vertex is (0,0,0, s * 4/sqrt(5)) if the first four are in w = -s/sqrt(5) plane.
            ];
            // Corrected set for a 5-cell centered at origin (edge length differs based on `r` interpretation):
            // This set has the first 4 vertices forming a regular tetrahedron in the hyperplane w = -r/sqrt(5),
            // and the 5th vertex is at (0,0,0, 4r/sqrt(5)).
            // To center the whole thing at the origin, the sum of w-coordinates should be 0.
            // (4 * -r/sqrt(5)) + 4r/sqrt(5) = 0. So this set is centered.
            this.baseVertices4D = [
                 r,  r,  r, -r / Math.sqrt(5),
                 r, -r, -r, -r / Math.sqrt(5),
                -r,  r, -r, -r / Math.sqrt(5),
                -r, -r,  r, -r / Math.sqrt(5),
                 0,  0,  0,  4 * r / Math.sqrt(5)
            ].map(val => val * 0.5); // Scale down to make 'size' more like a radius. Actual scaling factor depends on definition of 'size'.
                                  // Let's assume `size` is roughly the radius.
                                  // The distance from origin to (0,0,0, 4r/sqrt(5)) is 4r/sqrt(5).
                                  // The distance from origin to (r,r,r,-r/sqrt(5)) is sqrt(3r^2 + r^2/5) = sqrt(16r^2/5) = 4r/sqrt(5).
                                  // So all vertices are equidistant from origin. This is good.
                                  // The scaling factor 0.5 is arbitrary here, to make visualization manageable if `size=1`.
                                  // Let's make `size` directly be this distance (radius of circumscribed hypersphere).
            const radiusScale = 1 / (4 / Math.sqrt(5)); // Scale such that distance to vertex is `r`.
            this.baseVertices4D = [
                 1,  1,  1, -1 / Math.sqrt(5),
                 1, -1, -1, -1 / Math.sqrt(5),
                -1,  1, -1, -1 / Math.sqrt(5),
                -1, -1,  1, -1 / Math.sqrt(5),
                 0,  0,  0,  4 / Math.sqrt(5)
            ].map(val => val * r * radiusScale);


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

        // "tetraThickness" parameter:
        // This parameter is for visualization, perhaps to "thicken" the edges or faces.
        // If rendering faces (tetrahedra), this could mean displacing vertices outwards
        // along face normals to create a shell.
        // If rendering edges as cylinders/quads, this would be the radius/width.
        // For now, this geometry primarily defines the 5 vertices and 10 edges.
        // The interpretation of tetraThickness will be up to the renderer/shader.
        // One simple approach for "thick lines" is to expand each line segment into a quad or two triangles.
        // This would require more vertices and different indexing, which is complex to do generically here.
        // Alternatively, shaders can achieve thick lines (e.g. geometry shaders, or techniques in VS/FS).
        // We will assume the shader handles line thickness based on the u_lineThickness or u_tetraThickness uniform.
    }

    get4DVertices() {
        return this.vertices; // Could be baseVertices4D if no transformations applied yet
    }

    getEdgeIndices() {
        return this.indices;
    }

    update(params) {
        let needsRegeneration = false;
        if (params.size !== undefined && params.size !== this.parameters.size) {
            this.parameters.size = params.size;

            // Re-calculate baseVertices4D based on new size
            const r = this.parameters.size;
            const radiusScale = 1 / (4 / Math.sqrt(5));
            this.baseVertices4D = [
                 1,  1,  1, -1 / Math.sqrt(5),
                 1, -1, -1, -1 / Math.sqrt(5),
                -1,  1, -1, -1 / Math.sqrt(5),
                -1, -1,  1, -1 / Math.sqrt(5),
                 0,  0,  0,  4 / Math.sqrt(5)
            ].map(val => val * r * radiusScale);
            needsRegeneration = true;
        }
        if (params.tetraThickness !== undefined && params.tetraThickness !== this.parameters.tetraThickness) {
            this.parameters.tetraThickness = params.tetraThickness;
            // This might not require regeneration of vertices/indices if thickness is a shader effect.
            // If it implies geometric change (e.g. shelling), then needsRegeneration = true.
            // For now, assume it's for shader.
        }

        if (needsRegeneration) {
            this.generate(); // This mainly copies baseVertices4D to vertices and re-generates indices (which are fixed for 5-cell)
        }

        if (params.rotations) {
            // Apply rotations if method exists (e.g., from a base class or utility)
            if (typeof this.apply4DRotations === 'function') {
                this.apply4DRotations(params.rotations);
            } else if (super.apply4DRotations) {
                super.apply4DRotations(params.rotations);
            }
        }
    }

    // apply4DRotations could be added here or inherited if it becomes common
    // It would transform `this.vertices` based on `this.baseVertices4D`.
    apply4DRotations(rotations) { // Example implementation
        const { xy = 0, xz = 0, xw = 0, yz = 0, yw = 0, zw = 0 } = rotations;
        let rotatedVertices = [...this.baseVertices4D];

        const cos = Math.cos;
        const sin = Math.sin;

        // Simplified rotation application (assumes vertices are flat array [x,y,z,w,...])
        // XY rotation
        if (xy !== 0) { const c = cos(xy), s = sin(xy); for (let i = 0; i < rotatedVertices.length; i += 4) { const x = rotatedVertices[i], y = rotatedVertices[i+1]; rotatedVertices[i] = x * c - y * s; rotatedVertices[i+1] = x * s + y * c; }}
        // XZ rotation
        if (xz !== 0) { const c = cos(xz), s = sin(xz); for (let i = 0; i < rotatedVertices.length; i += 4) { const x = rotatedVertices[i], z = rotatedVertices[i+2]; rotatedVertices[i] = x * c - z * s; rotatedVertices[i+2] = x * s + z * c; }}
        // XW rotation
        if (xw !== 0) { const c = cos(xw), s = sin(xw); for (let i = 0; i < rotatedVertices.length; i += 4) { const x = rotatedVertices[i], w = rotatedVertices[i+3]; rotatedVertices[i] = x * c - w * s; rotatedVertices[i+3] = x * s + w * c; }}
        // YZ rotation
        if (yz !== 0) { const c = cos(yz), s = sin(yz); for (let i = 0; i < rotatedVertices.length; i += 4) { const y = rotatedVertices[i+1], z = rotatedVertices[i+2]; rotatedVertices[i+1] = y * c - z * s; rotatedVertices[i+2] = y * s + z * c; }}
        // YW rotation
        if (yw !== 0) { const c = cos(yw), s = sin(yw); for (let i = 0; i < rotatedVertices.length; i += 4) { const y = rotatedVertices[i+1], w = rotatedVertices[i+3]; rotatedVertices[i+1] = y * c - w * s; rotatedVertices[i+3] = y * s + w * c; }}
        // ZW rotation
        if (zw !== 0) { const c = cos(zw), s = sin(zw); for (let i = 0; i < rotatedVertices.length; i += 4) { const z = rotatedVertices[i+2], w = rotatedVertices[i+3]; rotatedVertices[i+2] = z * c - w * s; rotatedVertices[i+3] = z * s + w * c; }}

        this.vertices = rotatedVertices;
        return this.vertices;
    }


    // Buffer methods (getVertexPositionsBuffer, getIndexBuffer, destroy)
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
const hypertetra = new HypertetrahedronGeometry({ size: 1.0, tetraThickness: 0.03 });
console.log("Hypertetrahedron 4D Vertices:", hypertetra.get4DVertices());
console.log("Hypertetrahedron Edge Indices:", hypertetra.getEdgeIndices());

hypertetra.update({ size: 1.5, rotations: { xw: Math.PI / 8 } });
console.log("Updated Hypertetrahedron Vertices:", hypertetra.getVertices());
*/
