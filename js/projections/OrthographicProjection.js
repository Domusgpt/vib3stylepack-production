/**
 * OrthographicProjection: Extends BaseProjection to implement orthographic projection.
 * Includes parameters for orthographic to perspective blending.
 */
class OrthographicProjection extends BaseProjection {
    constructor(initialParams = {}) {
        super();
        this.parameters = {
            left: initialParams.left || -1.0,
            right: initialParams.right || 1.0,
            bottom: initialParams.bottom || -1.0,
            top: initialParams.top || 1.0,
            near: initialParams.near || 0.1,
            far: initialParams.far || 100.0,

            // For orthographic to perspective blending
            // This is a conceptual parameter. True blending often requires shader support
            // or interpolating between two projection matrices.
            perspectiveBlendFactor: initialParams.perspectiveBlendFactor || 0.0, // 0.0 = fully orthographic, 1.0 = fully perspective (requires a perspective matrix too)

            // Parameters for a perspective matrix if blending is done by matrix interpolation
            fovForBlend: initialParams.fovForBlend || Math.PI / 4,
            aspectForBlend: initialParams.aspectForBlend || 1.0,

            // View matrix parameters (similar to perspective)
            distance: initialParams.distance || 5.0, // Distance for the view matrix
        };
        this.orthoMatrix = mat4.create(); // Pure orthographic matrix
        this.perspMatrixForBlend = mat4.create(); // Perspective matrix for blending
        this.viewMatrix = mat4.create(); // Camera view matrix

        this.update(this.parameters); // Initial matrix calculation
    }

    /**
     * Updates the projection matrices based on parameters.
     * @param {object} params - Parameters to update the projection.
     */
    update(params = {}) {
        // Update internal parameters
        for (const key in params) {
            if (this.parameters.hasOwnProperty(key)) {
                this.parameters[key] = params[key];
            }
        }

        const { left, right, bottom, top, near, far, perspectiveBlendFactor, fovForBlend, aspectForBlend, distance } = this.parameters;

        // 1. Update the pure orthographic matrix
        mat4.ortho(this.orthoMatrix, left, right, bottom, top, near, far);

        // 2. Update the view matrix (camera position)
        // For orthographic, view matrix still positions/orients the scene.
        // A common setup is camera at (0,0,distance) looking at origin.
        mat4.lookAt(this.viewMatrix, [0, 0, distance], [0, 0, 0], [0, 1, 0]);

        // 3. Handle orthographic-to-perspective blending
        if (perspectiveBlendFactor > 0) {
            // Calculate a perspective matrix to blend with
            mat4.perspective(this.perspMatrixForBlend, fovForBlend, aspectForBlend, near, far); // Use current near/far for consistency
        }

        // 4. Combine or select the final projection matrix
        // If blending, interpolate between orthoMatrix and perspMatrixForBlend.
        // mat4.lerp is not a standard gl-matrix function for matrices.
        // We need to interpolate component-wise or use a shader for smooth blending.
        if (perspectiveBlendFactor <= 0.001) { // Fully orthographic
            mat4.copy(this.projectionMatrix, this.orthoMatrix);
        } else if (perspectiveBlendFactor >= 0.999) { // Fully perspective (using the blend settings)
            mat4.copy(this.projectionMatrix, this.perspMatrixForBlend);
        } else {
            // Component-wise linear interpolation for the matrix
            for (let i = 0; i < 16; i++) {
                this.projectionMatrix[i] = (1 - perspectiveBlendFactor) * this.orthoMatrix[i] + perspectiveBlendFactor * this.perspMatrixForBlend[i];
            }
        }
        // BaseProjection.projectionMatrix will now hold the (potentially blended) result.
    }

    /**
     * Returns the (potentially blended) projection matrix.
     * @returns {mat4}
     */
    getProjectionMatrix() {
        return this.projectionMatrix;
    }

    /**
     * Returns the view matrix (camera transformation).
     * @returns {mat4}
     */
    getViewMatrix() {
        return this.viewMatrix;
    }

    /**
     * Conceptual projection method for CPU-side transformation (if needed).
     * For orthographic projection of 4D points, this is more complex than simple XYZ passthrough.
     * A common 4D orthographic projection might simply drop the W coordinate, or project along W.
     * x' = x, y' = y, z' = z (after 4D view transformation).
     * @param {Array<number>} vertices4D - Flat array of 4D vertices [x,y,z,w,...].
     * @returns {Array<number>} Flat array of 3D projected vertices [x,y,z,...].
     */
    project(vertices4D) {
        console.warn("OrthographicProjection.project() is a conceptual placeholder. 4D orthographic projection usually drops/selects coordinates after 4D view transformation, typically shader-based.");
        const projectedVertices = [];
        for (let i = 0; i < vertices4D.length; i += 4) {
            // Simplest orthographic: drop W (after 4D camera view transform if any)
            projectedVertices.push(vertices4D[i], vertices4D[i+1], vertices4D[i+2]);
        }
        // These 3D points would then be transformed by the view and projection matrices.
        return projectedVertices;
    }
}

// Mock BaseProjection if not available
if (typeof BaseProjection === 'undefined') {
    const mockMat4Create = (typeof mat4 !== 'undefined' && mat4.create) ? mat4.create : () => new Array(16).fill(0).map((_, i) => (i % 5 === 0 ? 1 : 0));
    global.BaseProjection = class {
        constructor() { this.projectionMatrix = mockMat4Create(); }
        update(params) { throw new Error("Update method must be implemented."); }
        getProjectionMatrix() { return this.projectionMatrix; }
        project(target) { throw new Error("Project method must be implemented."); }
    };
}
// Removed mat4 mock. Assumes gl-matrix.js is loaded globally.

// Example Usage (conceptual):
/*
const orthoProj = new OrthographicProjection({
    left: -window.innerWidth / 200, // Example: scale with window size
    right: window.innerWidth / 200,
    bottom: -window.innerHeight / 200,
    top: window.innerHeight / 200,
    near: 0.01,
    far: 100,
    distance: 10,
    perspectiveBlendFactor: 0.0, // Start fully orthographic
    aspectForBlend: window.innerWidth / window.innerHeight
});

// To blend towards perspective:
// orthoProj.update({ perspectiveBlendFactor: 0.5 });

const projMat = orthoProj.getProjectionMatrix();
const viewMat = orthoProj.getViewMatrix();
console.log("Orthographic (Blended) Projection Matrix:", projMat);
console.log("View Matrix:", viewMat);
*/
