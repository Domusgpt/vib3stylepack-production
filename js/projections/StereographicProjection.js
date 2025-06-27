/**
 * StereographicProjection: Extends BaseProjection to implement stereographic projection from 4D (S^3) to 3D (R^3).
 * This projection maps points from a hypersphere (3-sphere) to a 3D hyperplane.
 *
 * Formula for stereographic projection from S^n to R^n:
 * For a point X = (x_1, ..., x_{n+1}) on S^n (unit n-sphere in R^{n+1}),
 * projecting from a pole P (e.g., North Pole N = (0,...,0,1) for S^n),
 * the image Y = (y_1, ..., y_n) in R^n (hyperplane x_{n+1}=0) is:
 * y_i = x_i / (1 - x_{n+1})  (projecting from North Pole N)
 * OR
 * y_i = x_i / (1 + x_{n+1})  (projecting from South Pole S = (0,...,0,-1))
 *
 * For our case, S^3 in R^4 to R^3:
 * Point on S^3: (x, y, z, w) where x^2+y^2+z^2+w^2 = R^2 (or 1 if unit hypersphere).
 * Pole P: e.g., (0,0,0,R) (North Pole in W direction).
 * Projected point (x',y',z') in R^3 (the w=0 hyperplane):
 * x' = x * R / (R - w)
 * y' = y * R / (R - w)
 * z' = z * R / (R - w)
 * (This projects from the pole (0,0,0,R) onto the hyperplane w=0. R is radius of hypersphere)
 * If projecting from (0,0,0,-R), then denominator is (R + w).
 *
 * This class will primarily provide the logic for this transformation,
 * which would typically be implemented within a vertex shader for performance.
 * The "projectionMatrix" from BaseProjection might not be a traditional matrix here,
 * or it could be an identity if the shader handles the non-linear mapping.
 * Alternatively, the projection can be approximated by a perspective matrix under certain conditions.
 *
 * We will also include pole position modulation by audioHigh.
 */
class StereographicProjection extends BaseProjection {
    constructor(initialParams = {}) {
        super();
        this.parameters = {
            hypersphereRadius: initialParams.hypersphereRadius || 1.0, // Radius of the S^3 from which we project
            poleSign: initialParams.poleSign || 1, // +1 for North Pole (0,0,0,R), -1 for South Pole (0,0,0,-R) in W

            // Pole position modulation by audioHigh
            audioHigh: initialParams.audioHigh || 0.0, // Expected range 0.0 - 1.0
            poleModulationStrength: initialParams.poleModulationStrength || 0.5, // How much audioHigh affects pole (e.g., shifting it slightly off-axis or changing effective R)

            // Standard 3D view/projection parameters for the resulting R^3 space
            fov: initialParams.fov || Math.PI / 4,
            aspect: initialParams.aspect || 1.0,
            near: initialParams.near || 0.1,
            far: initialParams.far || 100.0,
            cameraDistance: initialParams.cameraDistance || 5.0, // For the 3D view matrix
        };

        // The main "projectionMatrix" from BaseProjection will be a standard 3D perspective matrix
        // for viewing the R^3 space that results from the stereographic mapping.
        // The stereographic mapping itself is a non-linear transformation usually done per-vertex in a shader.
        this.initializeViewMatrix();
        this.update(this.parameters);
    }
    
    initializeViewMatrix() {
        let attempts = 0;
        const maxAttempts = 100;
        
        const tryInit = () => {
            attempts++;
            
            if (typeof mat4 !== 'undefined' && typeof mat4.create === 'function') {
                this.viewMatrix = mat4.create();
                console.log('✅ StereographicProjection view matrix initialized');
            } else if (attempts < maxAttempts) {
                setTimeout(tryInit, 10);
            } else {
                console.error('❌ CRITICAL: mat4 not available for StereographicProjection after max attempts');
                // Fallback to identity matrix
                this.viewMatrix = new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
            }
        };
        
        tryInit();
    }

    update(params = {}) {
        for (const key in params) {
            if (this.parameters.hasOwnProperty(key)) {
                this.parameters[key] = params[key];
            }
        }

        const { fov, aspect, near, far, cameraDistance } = this.parameters;

        // 1. Update the standard 3D perspective matrix for viewing the R^3 result space.
        if (typeof mat4 !== 'undefined' && typeof mat4.perspective === 'function' && this.projectionMatrix) {
            mat4.perspective(this.projectionMatrix, fov, aspect, near, far);
        } else {
            console.warn('⚠️ mat4.perspective not available for StereographicProjection');
        }

        // 2. Update the standard 3D view matrix.
        if (typeof mat4 !== 'undefined' && typeof mat4.lookAt === 'function' && this.viewMatrix) {
            mat4.lookAt(this.viewMatrix, [0, 0, cameraDistance], [0, 0, 0], [0, 1, 0]);
        } else {
            console.warn('⚠️ mat4.lookAt not available for StereographicProjection');
        }

        // The actual stereographic projection parameters (hypersphereRadius, poleSign, audioHigh)
        // will be passed as uniforms to the shader, which will perform the per-vertex calculation.
        // For example, the shader would receive u_stereographicParams = [R, poleSign, effectivePoleW].
        // The effective pole position might be modulated by audioHigh:
        // let modulatedPoleW = this.parameters.poleSign * this.parameters.hypersphereRadius;
        // modulatedPoleW *= (1 + this.parameters.audioHigh * this.parameters.poleModulationStrength);
        // This logic should be in HypercubeCore when setting uniforms.
    }

    /**
     * Returns the 3D perspective projection matrix for viewing the R^3 space.
     * @returns {mat4}
     */
    getProjectionMatrix() {
        return this.projectionMatrix;
    }

    /**
     * Returns the 3D view matrix for the R^3 space.
     * @returns {mat4}
     */
    getViewMatrix() {
        return this.viewMatrix;
    }

    /**
     * Performs stereographic projection on CPU for a single 4D point.
     * This is primarily for demonstration or specific CPU-bound tasks.
     * @param {Array<number>} point4D - A 4D point [x, y, z, w].
     * @param {object} [currentShaderParams] - Optional parameters that would be uniforms.
     *                                         { R, poleW }
     *                                         R: hypersphereRadius
     *                                         poleW: actual W coordinate of the projection pole (e.g. R_hypersphere * poleSign)
     * @returns {Array<number> | null} Projected 3D point [x', y', z'], or null if projection is undefined (e.g. point is at the pole).
     */
    projectPointCPU(point4D, currentShaderParams) {
        const R = currentShaderParams ? currentShaderParams.R : this.parameters.hypersphereRadius;
        // Default pole is North Pole along W if poleSign is +1
        // The actual W-coordinate of the pole:
        const poleW = currentShaderParams ? currentShaderParams.poleW : (this.parameters.poleSign * R);

        const [x, y, z, w] = point4D;

        // Denominator for projection from a pole (0,0,0, poleW) to hyperplane w=0
        // is (poleW - w). We need to scale by R.
        // x' = x * R / (poleW - w) -- if projecting onto w=0 from a pole at some poleW on the w-axis.
        // More standard: project from S^n to tangent plane at antipodal point.
        // If projecting from N=(0,0,0,R) on S^3 (radius R) to plane w=0:
        // x' = x * R / (R - w)
        // y' = y * R / (R - w)
        // z' = z * R / (R - w)
        // If projecting from S=(0,0,0,-R) on S^3 (radius R) to plane w=0:
        // x' = x * R / (R + w)
        // So, the denominator is (R - poleSign * w) if pole is at (0,0,0, poleSign*R)

        let denominator = R - (this.parameters.poleSign * w);

        if (Math.abs(denominator) < 0.00001) { // Point is at or very near the projection pole
            return null; // Or return a very large vector, or handle as per application needs
        }

        // Scale factor for projection, often this is 1 if R=1, or 2R if projecting to plane at -R from pole at R.
        // For simplicity with pole at (0,0,0,poleSign*R) and projection plane w=0,
        // the "focal length" or scaling factor is effectively R.
        const scale = R;


        const x_prime = x * scale / denominator;
        const y_prime = y * scale / denominator;
        const z_prime = z * scale / denominator;

        return [x_prime, y_prime, z_prime];
    }

    /**
     * Conceptual projection method for an array of 4D vertices.
     * @param {Array<number>} vertices4D - Flat array of 4D vertices [x,y,z,w,...].
     * @returns {Array<number>} Flat array of 3D projected vertices [x',y',z',...].
     */
    project(vertices4D) {
        console.warn("StereographicProjection.project() performs CPU-side projection. This is usually handled in shaders for performance.");
        const projectedVertices = [];

        // Example shader parameters (these would be calculated based on audioHigh, etc., by HypercubeCore)
        const R_shader = this.parameters.hypersphereRadius;
        const poleSign_shader = this.parameters.poleSign;
        // Modulate pole for effect based on audioHigh
        // Example: audioHigh (0-1) shifts the effective pole along W axis or changes effective R slightly
        // This is a simplified modulation; more complex effects are possible.
        // Let's say audioHigh makes the projection "stronger" or "weaker" by adjusting R or the pole's effective distance.
        // An actual modulated pole might be (0,0,0, poleW_modulated)
        // poleW_modulated = poleSign_shader * R_shader * (1 - this.parameters.audioHigh * this.parameters.poleModulationStrength);
        // For this CPU version, we'll use the direct params.
        const poleW_shader = poleSign_shader * R_shader; // This is the w-coord of the pole we project FROM.

        const shaderParams = { R: R_shader, poleW: poleW_shader };


        for (let i = 0; i < vertices4D.length; i += 4) {
            const pt4D = [vertices4D[i], vertices4D[i+1], vertices4D[i+2], vertices4D[i+3]];
            const pt3D = this.projectPointCPU(pt4D, shaderParams);
            if (pt3D) {
                projectedVertices.push(...pt3D);
            } else {
                // Handle points that couldn't be projected (e.g., point at the pole)
                // Push a placeholder or skip. For now, push (0,0,0) or a large value.
                projectedVertices.push(0,0,0); // Or some other indicator of failure/clipping
            }
        }
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
const stereoProj = new StereographicProjection({
    hypersphereRadius: 1.0, // Projecting from unit 3-sphere
    poleSign: 1,            // Project from North Pole (0,0,0,1)
    audioHigh: 0.5,         // Example audio input
    poleModulationStrength: 0.2,
    cameraDistance: 3.0,    // Camera for the resulting 3D space
    aspect: 16/9
});

// stereoProj.update({ audioHigh: 0.8 }); // Simulate change in audio input

const projMat3D = stereoProj.getProjectionMatrix(); // This is for the 3D view of R^3
const viewMat3D = stereoProj.getViewMatrix();     // This is for the 3D view of R^3
console.log("Stereographic (3D part) Projection Matrix:", projMat3D);
console.log("Stereographic (3D part) View Matrix:", viewMat3D);

// Example 4D point on S^3 (e.g. radius 1)
// For a point (x,y,z,w) on S^3, x^2+y^2+z^2+w^2 = R^2
const pointOnS3 = [0.5, 0.5, 0.5, Math.sqrt(1 - 3*0.5*0.5)]; // Assuming R=1
// const projected3D_CPU = stereoProj.projectPointCPU(pointOnS3, {R: 1.0, poleW: 1.0});
// console.log(`Point ${pointOnS3} on S^3 projects to ${projected3D_CPU} in R^3`);

// const pointAtPole = [0,0,0,1]; // Assuming R=1, poleSign=1
// const projectedPole = stereoProj.projectPointCPU(pointAtPole, {R: 1.0, poleW: 1.0}); // Should be null or undefined
// console.log(`Point ${pointAtPole} at pole projects to ${projectedPole}`);
*/
