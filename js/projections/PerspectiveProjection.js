/**
 * PerspectiveProjection: Extends BaseProjection to implement perspective projection.
 * Includes dynamic distance modulation based on parameters.
 */
class PerspectiveProjection extends BaseProjection {
    constructor(initialParams = {}) {
        super();
        this.parameters = {
            fov: initialParams.fov || Math.PI / 4, // Field of View in radians
            aspect: initialParams.aspect || 1.0,    // Aspect ratio (width/height)
            near: initialParams.near || 0.1,        // Near clipping plane
            far: initialParams.far || 100.0,        // Far clipping plane

            // Parameters for dynamic distance modulation
            morphFactor: initialParams.morphFactor || 0.0, // Expected range 0.0 - 1.5
            audioMid: initialParams.audioMid || 0.0,       // Expected range 0.0 - 1.0

            // Base distance or view position - can be modulated
            baseDistance: initialParams.baseDistance || 5.0, // Default distance of camera/eye from origin if not dynamic
            dynamicDistanceStrength: initialParams.dynamicDistanceStrength || 2.0, // How much morphFactor/audioMid affect distance
        };
        this.viewMatrix = mat4.create(); // For camera positioning
        this.update(this.parameters); // Initial matrix calculation
    }

    /**
     * Updates the projection and view matrices based on parameters.
     * @param {object} params - Parameters to update the projection.
     *                          Includes fov, aspect, near, far, morphFactor, audioMid, etc.
     */
    update(params = {}) {
        // Update internal parameters
        for (const key in params) {
            if (this.parameters.hasOwnProperty(key)) {
                this.parameters[key] = params[key];
            }
        }

        const { fov, aspect, near, far, morphFactor, audioMid, baseDistance, dynamicDistanceStrength } = this.parameters;

        // 1. Calculate dynamic distance for the camera
        // Dynamic distance calculation: Based on morphFactor + audioMid
        // Let's define a modulation factor. morphFactor (0-1.5), audioMid (0-1).
        // A simple approach: distance = baseDistance - (morphFactor + audioMid) * strength.
        // This means higher values bring the camera closer.
        let dynamicModulation = (morphFactor + audioMid) * dynamicDistanceStrength;
        let effectiveDistance = baseDistance - dynamicModulation;
        effectiveDistance = Math.max(effectiveDistance, near + 0.1); // Ensure camera doesn't go through near plane or to zero

        // 2. Set up the view matrix (camera position and orientation)
        // For a simple setup, camera looks from (0,0,effectiveDistance) towards origin, up is (0,1,0)
        // This is a 3D camera setup. For 4D->3D projection, this view matrix transforms the already-3D-projected points.
        // Or, if projection from 4D happens in shader, this view matrix is for the 3D part of that.
        // Let's assume we are setting up a standard 3D view matrix here.
        mat4.lookAt(this.viewMatrix,
            [0, 0, effectiveDistance], // eye position
            [0, 0, 0],                 // target (center)
            [0, 1, 0]                  // up vector
        );

        // 3. Set up the perspective projection matrix
        mat4.perspective(this.projectionMatrix, fov, aspect, near, far);

        // 4. Combine view and projection matrix if needed (often done in shader)
        // Some engines/shaders expect separate view and projection matrices, others a combined one.
        // BaseProjection.getProjectionMatrix() should return the pure projection part.
        // If a combined one is needed, a new method like getCombinedMatrix() could be added.
        // For now, this.projectionMatrix is the pure perspective matrix.
        // The view matrix is separate. HypercubeCore will likely pass both to the shader.
    }

    /**
     * Returns the perspective projection matrix.
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
     * Applies the projection (conceptually).
     * In WebGL, this is typically handled by multiplying vertices by projection (& view) matrix in the shader.
     * This method could be used for CPU-side projection if needed.
     * @param {Array<number>} vertices4D - Flat array of 4D vertices [x,y,z,w,...].
     * @returns {Array<number>} Flat array of 3D projected vertices [x,y,z,...].
     */
    project(vertices4D) {
        // This is a simplified CPU-side projection for demonstration.
        // It's a basic perspective divide after applying a 4D->3D matrix (not fully defined here).
        // For a proper 4D perspective projection:
        // 1. Define a 4D view matrix (camera position/orientation in 4D).
        // 2. Define a 4D->3D projection matrix (e.g., perspective projection from 4D to a 3D hyperplane).
        //    x' = x * D / (w + D) or x * D / w for w-perspective
        //    y' = y * D / (w + D)
        //    z' = z * D / (w + D)
        //    where D is a projection distance or focal length.
        // This simple example will just take the XYZ components and assume W is for perspective.
        // The actual projection logic is more complex and usually in the shader for performance.

        console.warn("PerspectiveProjection.project() is a conceptual placeholder for CPU projection. Full 4D projection is complex and usually shader-based.");

        const projectedVertices = [];
        const D = this.parameters.baseDistance; // Use baseDistance as a proxy for projection depth from W.

        for (let i = 0; i < vertices4D.length; i += 4) {
            const x = vertices4D[i];
            const y = vertices4D[i+1];
            const z = vertices4D[i+2];
            const w = vertices4D[i+3];

            // Simple w-divide perspective (common for projecting 4D to 3D)
            // Assumes camera is at some distance D along the W axis from the origin, looking towards origin.
            // Points are projected onto the w=0 hyperplane.
            // If w is positive and "behind" the projection plane, or D is distance to projection plane.
            // x_proj = x / (w/D + 1) or x / (w - D_eye) * D_proj_plane etc.
            // A common form: x' = x / (w_camera_space / focal_length)
            // If we assume the 'w' coord is distance from a projection hyperplane where focal_length=1
            // and the "camera" is at w_eye, then effective_w = w - w_eye.
            // Let's use a simple perspective factor:
            let perspectiveFactor = 1.0;
            if (D > 0 && w !== -D) { // Avoid division by zero if w = -D (point is at camera's W position)
                 perspectiveFactor = D / (w + D); // Ensure w+D is not too small
                 if (Math.abs(w + D) < 0.0001) perspectiveFactor = 10000; // Clamp if too close to singularity
            } else if (D === 0 && w !== 0) {
                 perspectiveFactor = 1.0 / w; // Simpler form if D=0 (project relative to origin)
            }


            projectedVertices.push(x * perspectiveFactor, y * perspectiveFactor, z * perspectiveFactor);
        }
        // These 3D vertices would then be transformed by the view and projection matrices (this.viewMatrix, this.projectionMatrix)
        // which are standard 3D matrices.
        return projectedVertices;
    }
}

// Mock BaseProjection and mat4 if not available (e.g., for standalone testing)
if (typeof BaseProjection === 'undefined') {
    window.BaseProjection = class {
        constructor() { this.projectionMatrix = mat4.create(); }
        update(params) { throw new Error("Update method must be implemented."); }
        getProjectionMatrix() { return this.projectionMatrix; }
        project(target) { throw new Error("Project method must be implemented."); }
    };
}
if (typeof mat4 === 'undefined') {
    window.mat4 = {
        create: () => new Array(16).fill(0).map((_, i) => (i % 5 === 0 ? 1 : 0)), // Identity matrix
        perspective: (out, fovy, aspect, near, far) => { /* mock */ },
        lookAt: (out, eye, center, up) => { /* mock */ },
    };
}

// Example Usage (conceptual):
/*
const perspProj = new PerspectiveProjection({
    fov: Math.PI / 3,
    aspect: 16/9,
    near: 0.1,
    far: 200,
    baseDistance: 10,
    morphFactor: 0.5,
    audioMid: 0.2
});
perspProj.update({ aspect: window.innerWidth / window.innerHeight }); // Update aspect ratio

const projMat = perspProj.getProjectionMatrix();
const viewMat = perspProj.getViewMatrix();
console.log("Perspective Projection Matrix:", projMat);
console.log("View Matrix:", viewMat);

// Conceptual 4D points
const points4D = [
    1, 1, 1, 1,
   -1, 1, -1, 2,
    1,-1, -1, 0.5
];
// const projected3D = perspProj.project(points4D); // This CPU projection is basic
// console.log("CPU Projected 3D points:", projected3D);
*/
