/**
 * Manages WebGL shaders, including compilation, linking, and uniform/attribute handling.
 */
class ShaderManager {
    /**
     * @param {WebGLRenderingContext} gl - The WebGL rendering context.
     */
    constructor(gl) {
        if (!gl) {
            throw new Error("ShaderManager: WebGL context is required.");
        }
        this.gl = gl;
        this.program = null;
        this.uniformLocations = new Map();
        this.attributeLocations = new Map();
    }

    /**
     * Compiles a shader from source.
     * @param {string} source - The shader source code.
     * @param {number} type - The shader type (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER).
     * @returns {WebGLShader | null} The compiled shader, or null on failure.
     */
    compileShader(source, type) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const shaderType = type === gl.VERTEX_SHADER ? "Vertex" : "Fragment";
            console.error(`ShaderManager: Error compiling ${shaderType} shader:`, gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    /**
     * Creates and links a WebGL program from vertex and fragment shader sources.
     * @param {string} vertexSource - The vertex shader source code.
     * @param {string} fragmentSource - The fragment shader source code.
     * @returns {WebGLProgram | null} The linked WebGL program, or null on failure.
     */
    createProgram(vertexSource, fragmentSource) {
        const gl = this.gl;
        const vertexShader = this.compileShader(vertexSource, gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fragmentSource, gl.FRAGMENT_SHADER);

        if (!vertexShader || !fragmentShader) {
            return null;
        }

        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error("ShaderManager: Error linking program:", gl.getProgramInfoLog(this.program));
            gl.deleteProgram(this.program);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            this.program = null;
            return null;
        }

        // Detach and delete shaders as they are no longer needed after linking
        gl.detachShader(this.program, vertexShader);
        gl.detachShader(this.program, fragmentShader);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        console.log("ShaderManager: Program created and linked successfully.");
        return this.program;
    }

    /**
     * Uses the managed shader program.
     */
    useProgram() {
        if (this.program) {
            this.gl.useProgram(this.program);
        } else {
            console.error("ShaderManager: No program available to use.");
        }
    }

    /**
     * Gets the location of a uniform variable. Caches the location.
     * @param {string} name - The name of the uniform.
     * @returns {WebGLUniformLocation | null}
     */
    getUniformLocation(name) {
        if (!this.program) return null;
        if (this.uniformLocations.has(name)) {
            return this.uniformLocations.get(name);
        }
        const location = this.gl.getUniformLocation(this.program, name);
        if (location === null) {
            // console.warn(`ShaderManager: Uniform "${name}" not found or not active.`);
        }
        this.uniformLocations.set(name, location);
        return location;
    }

    /**
     * Gets the location of an attribute variable. Caches the location.
     * @param {string} name - The name of the attribute.
     * @returns {number} The attribute location, or -1 if not found.
     */
    getAttributeLocation(name) {
        if (!this.program) return -1;
        if (this.attributeLocations.has(name)) {
            return this.attributeLocations.get(name);
        }
        const location = this.gl.getAttribLocation(this.program, name);
        if (location === -1) {
            // console.warn(`ShaderManager: Attribute "${name}" not found or not active.`);
        }
        this.attributeLocations.set(name, location);
        return location;
    }

    /**
     * Sets a uniform value. This is a generic setter; specific type setters are below.
     * This method is more for internal use or specific cases.
     * @param {string} name - Uniform name.
     * @param {string} type - Uniform type (e.g., '1f', '2fv', 'Matrix4fv').
     * @param {any} value - Value(s) to set.
     * @param {boolean} [transpose=false] - For matrix uniforms, whether to transpose.
     */
    setUniform(name, type, value, transpose = false) {
        this.useProgram(); // Ensure program is active
        const location = this.getUniformLocation(name);
        if (location !== null) {
            const gl = this.gl;
            const uniformSetter = gl[`uniform${type}`];
            if (uniformSetter) {
                if (type.startsWith('Matrix')) {
                    uniformSetter.call(gl, location, transpose, value);
                } else if (type.endsWith('v')) {
                    // Vector types like '2fv', '3fv', '4fv' expect arrays
                    uniformSetter.call(gl, location, value);
                } else {
                    // Non-vector types like '2f', '3f', '4f' expect individual arguments
                    if (Array.isArray(value)) {
                        uniformSetter.call(gl, location, ...value);
                    } else {
                        uniformSetter.call(gl, location, value);
                    }
                }
            } else {
                console.error(`ShaderManager: Invalid uniform type "${type}".`);
            }
        }
    }

    // Convenience methods for common uniform types
    setUniform1f(name, v0) { this.setUniform(name, '1f', v0); }
    setUniform2f(name, v0, v1) { this.setUniform(name, '2f', [v0, v1]); }
    setUniform3f(name, v0, v1, v2) { this.setUniform(name, '3f', [v0, v1, v2]); }
    setUniform4f(name, v0, v1, v2, v3) { this.setUniform(name, '4f', [v0, v1, v2, v3]); }

    setUniform1i(name, v0) { this.setUniform(name, '1i', v0); }
    setUniform2i(name, v0, v1) { this.setUniform(name, '2i', [v0, v1]); }
    setUniform3i(name, v0, v1, v2) { this.setUniform(name, '3i', [v0, v1, v2]); }
    setUniform4i(name, v0, v1, v2, v3) { this.setUniform(name, '4i', [v0, v1, v2, v3]); }

    setUniform1fv(name, value) { this.setUniform(name, '1fv', value); }
    setUniform2fv(name, value) { this.setUniform(name, '2fv', value); }
    setUniform3fv(name, value) { this.setUniform(name, '3fv', value); }
    setUniform4fv(name, value) { this.setUniform(name, '4fv', value); }

    setUniformMatrix2fv(name, value, transpose = false) { this.setUniform(name, 'Matrix2fv', value, transpose); }
    setUniformMatrix3fv(name, value, transpose = false) { this.setUniform(name, 'Matrix3fv', value, transpose); }
    setUniformMatrix4fv(name, value, transpose = false) { this.setUniform(name, 'Matrix4fv', value, transpose); }

    /**
     * Clears cached locations. Useful if a new program is set.
     */
    clearCache() {
        this.uniformLocations.clear();
        this.attributeLocations.clear();
    }

    /**
     * Deletes the WebGL program and cleans up.
     */
    destroy() {
        if (this.program) {
            this.gl.deleteProgram(this.program);
            this.program = null;
        }
        this.clearCache();
    }
}

// Example Usage (requires a WebGL context):
// const canvas = document.createElement('canvas');
// const gl = canvas.getContext('webgl');
// if (gl) {
//     const shaderManager = new ShaderManager(gl);
//     const vsSource = `
//         attribute vec4 aVertexPosition;
//         uniform mat4 uModelViewMatrix;
//         uniform mat4 uProjectionMatrix;
//         void main() {
//             gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
//         }
//     `;
//     const fsSource = `
//         void main() {
//             gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // Red
//         }
//     `;
//     shaderManager.createProgram(vsSource, fsSource);
//     if (shaderManager.program) {
//         shaderManager.useProgram();
//         // shaderManager.setUniformMatrix4fv('uProjectionMatrix', projectionMatrix);
//         // shaderManager.setUniformMatrix4fv('uModelViewMatrix', modelViewMatrix);
//         // ... setup attributes and draw
//     }
// } else {
//     console.error("WebGL not supported or context creation failed.");
// }
