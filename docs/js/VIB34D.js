/**
 * VIB34D Core Rendering Engine (Placeholder)
 * Manages an individual visualizer instance, its parameters, rendering loop,
 * and smooth parameter transitions.
 */
export class VIB34D {
    constructor(containerElement, initialParams = {}, id = null) {
        if (!containerElement) {
            console.error("VIB34D: Container element is required.");
            return;
        }
        this.containerElement = containerElement;
        this.id = id || `vib34d-${Date.now()}-${Math.random().toString(16).slice(2)}`;

        // Deep clone initialParams to avoid external mutations
        this.baseParams = JSON.parse(JSON.stringify(initialParams));
        this.currentParams = JSON.parse(JSON.stringify(initialParams));
        this.startTime = performance.now(); // Initialize startTime

        this.transition = null; // Stores active transition details

        this.gl = null;
        this.ctx = null;
        this.shaderProgram = null;
        this.vao = null;
        this.vertexBuffer = null;
        this.uniformLocations = {};
        this.isWebGLActive = false;

        this.initCanvas(); // This will now try WebGL first
        this.startRenderLoop();

        console.log(`VIB34D instance ${this.id} created for element: ${containerElement.id || containerElement.className}. WebGL Active: ${this.isWebGLActive}`);
    }

    // --- WebGL Shader Compilation Helpers ---
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error(`Error compiling shader (${type === this.gl.VERTEX_SHADER ? "VERTEX" : "FRAGMENT"}):`, this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    createProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error("Error linking shader program:", this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
            return null;
        }
        return program;
    }

    // --- Basic Shaders for holo-dark-background ---
    getHoloBackgroundVertexShader() {
        return `
            attribute vec4 a_position;
            void main() {
                gl_Position = a_position;
            }
        `;
    }

    // --- Shaders for glassPanelEffect ---
    getGlassPanelVertexShader() { // Can be the same as holoBackground's VS
        return `
            attribute vec4 a_position;
            void main() {
                gl_Position = a_position;
            }
        `;
    }

    getGlassPanelFragmentShader() {
        return `
            precision mediump float;
            uniform vec2 u_resolution;
            uniform float u_time;
            uniform float u_noiseScale; // e.g., 20.0
            uniform float u_noiseSpeed; // e.g., 0.1
            uniform float u_noiseIntensity; // e.g., 0.03 (very subtle)
            // Glass panel base color is transparent, this shader adds subtle internal noise.

            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }

            float valueNoise(vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                float a = random(i);
                float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0));
                float d = random(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
            }

            void main() {
                vec2 st = gl_FragCoord.xy / u_resolution.xy;
                float noiseVal = valueNoise(st * u_noiseScale + u_time * u_noiseSpeed);

                // Output a very subtle, slightly varying alpha based on noise
                // This will appear as a faint texture on top of the CSS glass panel background
                gl_FragColor = vec4(1.0, 1.0, 1.0, noiseVal * u_noiseIntensity); // White noise, very low alpha
            }
        `;
    }
    
    getVaporwaveGridVertexShader() {
        return `
            attribute vec4 a_position;
            void main() {
                gl_Position = a_position;
            }
        `;
    }
    
    getVaporwaveGridFragmentShader() {
        return `
            precision mediump float;
            uniform vec2 u_resolution;
            uniform float u_time;
            uniform vec4 u_gridColor;
            uniform float u_gridScale;
            uniform float u_gridSpeed;
            uniform float u_glowIntensity;
            
            float grid(vec2 st, float scale) {
                st *= scale;
                vec2 grid = abs(fract(st - 0.5) - 0.5) / fwidth(st);
                return 1.0 - min(grid.x, grid.y);
            }
            
            void main() {
                vec2 st = gl_FragCoord.xy / u_resolution.xy;
                st.x *= u_resolution.x / u_resolution.y;
                
                // Create perspective effect
                float perspective = 1.0 / (1.0 + st.y * 2.0);
                vec2 warpedSt = vec2(st.x - 0.5, st.y) * perspective + vec2(0.5, 0.0);
                
                // Animate the grid
                warpedSt.y -= u_time * u_gridSpeed;
                
                // Create the grid
                float g = grid(warpedSt, u_gridScale);
                
                // Add glow effect
                float glow = pow(g, 1.0 / u_glowIntensity);
                
                // Fade out at the top
                float fade = 1.0 - st.y;
                
                vec3 color = u_gridColor.rgb * glow * fade;
                float alpha = g * fade * u_gridColor.a;
                
                gl_FragColor = vec4(color, alpha);
            }
        `;
    }

    getHoloBackgroundFragmentShader() {
        return `
            precision mediump float;
            uniform vec2 u_resolution;
            uniform float u_time;
            uniform vec4 u_baseColor; // e.g., [0.02, 0.02, 0.05, 1.0]
            uniform float u_noiseAmount; // e.g., 0.07
            uniform float u_intensity; // e.g., 0.25

            // Simple pseudo-random function
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }

            float noise(vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                float a = random(i);
                float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0));
                float d = random(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f); // Smoothstep
                return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.y * u.x;
            }

            void main() {
                vec2 st = gl_FragCoord.xy / u_resolution.xy;
                st.x *= u_resolution.x / u_resolution.y; // Correct aspect ratio

                // u_time is now scaled by timeScale uniform from preset via VIB34D.js
                // Base color
                vec3 color = u_baseColor.rgb;

                // Animated noise, influenced by intensity
                float n = noise(st * 5.0 + u_time * 0.5); // Base noise pattern using u_time directly
                n = mix(n, noise(st * 10.0 + u_time), u_intensity); // More complex noise with intensity

                color += n * u_noiseAmount * u_baseColor.rgb * 2.0; // Modulate base color by noise

                // Add some subtle time-based color cycling based on intensity
                color.r += sin(u_time + st.y * 2.0) * 0.05 * u_intensity;
                color.g += cos(u_time + st.x * 2.0) * 0.05 * u_intensity;

                gl_FragColor = vec4(color, u_baseColor.a);
            }
        `;
    }

    initWebGL() {
        // Try WebGL2 first, then fall back to WebGL1
        let gl = this.canvas.getContext('webgl2');
        this.isWebGL2 = true;
        
        if (!gl) {
            gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
            this.isWebGL2 = false;
            console.log(`VIB34D ${this.id}: Using WebGL1`);
        } else {
            console.log(`VIB34D ${this.id}: Using WebGL2`);
        }
        
        if (!gl) {
            console.warn(`VIB34D ${this.id}: WebGL not supported or disabled.`);
            return false;
        }
        this.gl = gl;

        let vsSource, fsSource;
        let specificUniformKeys = []; // To store keys for shader-specific uniforms

        if (this.currentParams.shader === "holoBackground") {
            vsSource = this.getHoloBackgroundVertexShader();
            fsSource = this.getHoloBackgroundFragmentShader();
            specificUniformKeys = ["baseColor", "noiseAmount", "intensity"];
            console.log(`VIB34D ${this.id}: Initializing WebGL for holoBackground shader.`);
        } else if (this.currentParams.shader === "glassPanelEffect") {
            vsSource = this.getGlassPanelVertexShader();
            fsSource = this.getGlassPanelFragmentShader();
            specificUniformKeys = ["noiseScale", "noiseSpeed", "noiseIntensity"];
            console.log(`VIB34D ${this.id}: Initializing WebGL for glassPanelEffect shader.`);
        } else if (this.currentParams.shader === "vaporwaveGrid") {
            vsSource = this.getVaporwaveGridVertexShader();
            fsSource = this.getVaporwaveGridFragmentShader();
            specificUniformKeys = ["gridColor", "gridScale", "gridSpeed", "glowIntensity"];
            console.log(`VIB34D ${this.id}: Initializing WebGL for vaporwaveGrid shader.`);
        } else {
            console.log(`VIB34D ${this.id}: No specific WebGL shader defined in preset or preset shader not recognized. Defaulting to 2D/none.`);
            this.gl = null;
            return false;
        }

        const vertexShader = this.createShader(gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fsSource);
        if (!vertexShader || !fragmentShader) {
            this.gl = null; return false; // Ensure gl is nulled if shader compilation fails
        }

        this.shaderProgram = this.createProgram(vertexShader, fragmentShader);
        if (!this.shaderProgram) {
            this.gl = null; return false;
        }

        // Common uniforms
        this.uniformLocations = {
            resolution: gl.getUniformLocation(this.shaderProgram, "u_resolution"),
            time: gl.getUniformLocation(this.shaderProgram, "u_time"),
        };
        // Shader-specific uniforms
        specificUniformKeys.forEach(key => {
            const uniformName = "u_" + key.charAt(0).toLowerCase() + key.slice(1); // e.g. baseColor -> u_baseColor
            this.uniformLocations[key] = gl.getUniformLocation(this.shaderProgram, uniformName);
        });

        // Buffer for a screen-filling quad
        const positions = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        // VAO setup - handle both WebGL1 and WebGL2
        const positionAttributeLocation = gl.getAttribLocation(this.shaderProgram, "a_position");
        
        if (this.isWebGL2) {
            // WebGL2 path with VAO
            this.vao = gl.createVertexArray();
            gl.bindVertexArray(this.vao);
            gl.enableVertexAttribArray(positionAttributeLocation);
            gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
            gl.bindVertexArray(null);
        } else {
            // WebGL1 path - no VAO, just set up attributes directly
            this.vao = null;
            gl.enableVertexAttribArray(positionAttributeLocation);
            gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
        }


        this.isWebGLActive = true;
        console.log(`VIB34D ${this.id}: WebGL initialized for holo-dark-background.`);
        return true;
    }

    initCanvas() {
        this.canvas = document.createElement('canvas');
        this.containerElement.appendChild(this.canvas);

        if (!this.initWebGL()) { // Try WebGL first
            // Fallback to 2D context if WebGL init failed or not applicable
            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) {
                 console.error(`VIB34D ${this.id}: Failed to get 2D context after WebGL failure.`);
                 return;
            }
            console.log(`VIB34D ${this.id}: Initialized with 2D context.`);
        }

        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '-1'; // Default to background

        this.resizeCanvas();
        // Consider a ResizeObserver for more robust dynamic resizing
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = this.containerElement.clientWidth;
        this.canvas.height = this.containerElement.clientHeight;
        // When using WebGL, viewport would also be set here.
    }

    /**
     * Updates the visualizer's parameters smoothly over a specified duration.
     * @param {object} targetParams - The target parameters to transition to.
     * @param {number} duration - The duration of the transition in milliseconds.
     */
    updateParameters(targetParams, duration = 300) {
        if (duration === 0) {
            this.currentParams = JSON.parse(JSON.stringify(targetParams));
            this.transition = null; // Cancel any ongoing transition
            return;
        }

        const startParams = JSON.parse(JSON.stringify(this.currentParams));
        const newTargetParams = JSON.parse(JSON.stringify(targetParams));

        this.transition = {
            startParams,
            targetParams: newTargetParams,
            duration,
            startTime: performance.now(),
        };
    }

    /**
     * Resets the visualizer to its base (initial) parameters smoothly.
     * @param {number} duration - The duration of the transition in milliseconds.
     */
    resetToBaseState(duration = 300) {
        this.updateParameters(this.baseParams, duration);
    }

    /**
     * The main render loop.
     */
    render() {
        const now = performance.now();

        // Handle parameter transitions
        if (this.transition) {
            const elapsedTime = now - this.transition.startTime;
            const progress = Math.min(elapsedTime / this.transition.duration, 1);

            for (const key in this.transition.targetParams) {
                if (typeof this.transition.startParams[key] === 'number' && typeof this.transition.targetParams[key] === 'number') {
                    this.currentParams[key] = this.transition.startParams[key] + (this.transition.targetParams[key] - this.transition.startParams[key]) * progress;
                } else if (Array.isArray(this.transition.startParams[key]) && Array.isArray(this.transition.targetParams[key])) {
                    // Handle color arrays (assuming RGBA or similar numeric arrays)
                    if (this.currentParams[key] === undefined || this.currentParams[key].length !== this.transition.startParams[key].length) {
                         this.currentParams[key] = [...this.transition.startParams[key]];
                    }
                    for(let i=0; i < this.transition.startParams[key].length; i++) {
                        if (typeof this.transition.startParams[key][i] === 'number' && typeof this.transition.targetParams[key][i] === 'number') {
                           this.currentParams[key][i] = this.transition.startParams[key][i] + (this.transition.targetParams[key][i] - this.transition.startParams[key][i]) * progress;
                        } else {
                             // Non-numeric array elements, snap at end
                            if(progress >= 1) this.currentParams[key][i] = this.transition.targetParams[key][i];
                        }
                    }
                }
                 else {
                    // For non-numeric parameters (e.g., strings like 'shape', 'texture', booleans)
                    // snap to target value at the end of the transition or if not present in start.
                    if (progress >= 1 || typeof this.transition.startParams[key] === 'undefined') {
                        this.currentParams[key] = this.transition.targetParams[key];
                    }
                }
            }

            if (progress >= 1) {
                this.transition = null; // Transition complete
            }
        }

        if (this.gl && this.isWebGLActive && this.shaderProgram) {
            // WebGL Rendering Path
            this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
            this.gl.clearColor(0, 0, 0, 0); // Clear to transparent or a base debug color
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

            this.gl.useProgram(this.shaderProgram);

            if (this.isWebGL2 && this.vao) {
                // WebGL2 with VAO
                this.gl.bindVertexArray(this.vao);
            } else {
                // WebGL1 - need to bind buffer and set up attributes each frame
                const positionAttributeLocation = this.gl.getAttribLocation(this.shaderProgram, "a_position");
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
                this.gl.vertexAttribPointer(positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
                this.gl.enableVertexAttribArray(positionAttributeLocation);
            }

            // Update uniforms
            const timeParam = (now - this.startTime) / 1000.0 * (this.currentParams.timeScale !== undefined ? this.currentParams.timeScale : 0.1); // Default timeScale

            this.gl.uniform2f(this.uniformLocations.resolution, this.canvas.width, this.canvas.height);
            this.gl.uniform1f(this.uniformLocations.time, timeParam);

            if (this.currentParams.shader === "holoBackground") {
                this.gl.uniform4fv(this.uniformLocations.baseColor, this.currentParams.color || [0.02, 0.02, 0.05, 1.0]);
                this.gl.uniform1f(this.uniformLocations.noiseAmount, this.currentParams.noiseAmount || 0.07);
                this.gl.uniform1f(this.uniformLocations.intensity, this.currentParams.intensity || 0.25);
            } else if (this.currentParams.shader === "glassPanelEffect") {
                this.gl.uniform1f(this.uniformLocations.noiseScale, this.currentParams.noiseScale || 20.0);
                this.gl.uniform1f(this.uniformLocations.noiseSpeed, this.currentParams.noiseSpeed || 0.1);
                this.gl.uniform1f(this.uniformLocations.noiseIntensity, this.currentParams.noiseIntensity || 0.03);
            } else if (this.currentParams.shader === "vaporwaveGrid") {
                this.gl.uniform4fv(this.uniformLocations.gridColor, this.currentParams.gridColor || [0.0, 1.0, 1.0, 0.8]);
                this.gl.uniform1f(this.uniformLocations.gridScale, this.currentParams.gridScale || 20.0);
                this.gl.uniform1f(this.uniformLocations.gridSpeed, this.currentParams.gridSpeed || 0.5);
                this.gl.uniform1f(this.uniformLocations.glowIntensity, this.currentParams.glowIntensity || 2.0);
            }

            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6); // Draw the quad (6 vertices for 2 triangles)

            if (this.isWebGL2 && this.vao) {
                // WebGL2 - unbind VAO
                this.gl.bindVertexArray(null);
            }

        } else if (this.ctx) {
            // 2D Fallback Rendering Path
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            const color = this.currentParams.color || [0.2, 0.2, 0.2, 1.0];
            let r = Math.floor((color[0] || 0) * 255);
            let g = Math.floor((color[1] || 0) * 255);
            let b = Math.floor((color[2] || 0) * 255);
            let a = color[3] === undefined ? 1 : color[3];
            this.ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
            const intensity = this.currentParams.intensity || 0.5;
            const size = (this.canvas.width / 4) * intensity * (this.currentParams.scale || 1.0);
            this.ctx.beginPath();
            if (this.currentParams.shape === 'quad' || this.currentParams.shape === 'plane' || (this.currentParams.isGlassPanel)) {
                this.ctx.fillRect(this.canvas.width / 2 - size / 2, this.canvas.height / 2 - size / 2, size, size);
            } else {
                this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, size / 2, 0, 2 * Math.PI);
            }
            this.ctx.fill();

            // Debug text for 2D
            this.ctx.fillStyle = 'white';
            this.ctx.font = '10px Arial';
            this.ctx.fillText(`ID: ${this.id} (2D Fallback)`, 5, 10);
            let yOffset = 20;
            for(const key in this.currentParams){
                if(typeof this.currentParams[key] !== 'function' && typeof this.currentParams[key] !== 'object' || Array.isArray(this.currentParams[key])){
                     this.ctx.fillText(`${key}: ${Array.isArray(this.currentParams[key]) ? JSON.stringify(this.currentParams[key].map(v => typeof v === 'number' ? v.toFixed(2) : v )) : this.currentParams[key]}`, 5, yOffset);
                     yOffset += 10;
                }
            }
        } else {
            // Neither WebGL nor 2D context available or initialized for this instance
            // console.warn(`VIB34D ${this.id}: No rendering context available.`);
        }

        requestAnimationFrame(() => this.render());
    }

    startRenderLoop() {
        requestAnimationFrame(() => this.render());
    }

    destroy() {
        // Clean up: remove canvas, event listeners, etc.
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        // In a real WebGL app, you'd also destroy buffers, textures, programs.
        // Stop the render loop if necessary (though requestAnimationFrame self-cancels if not called again)
        // For now, this is basic.
        console.log(`VIB34D instance ${this.id} destroyed.`);
    }
}
