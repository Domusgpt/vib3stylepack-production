/**
 * VIB34D STYLE SYSTEM - CORE VISUALIZER
 * Extracted from working demo, enhanced for multi-instance framework
 * 
 * Provides the mathematical foundation for reactive UI design
 * where form maintains relational coherence even when scrambled
 */

console.log('🌌 VIB34D Core System Loading...');

// ===== VIB34D REACTIVE VISUALIZER CORE =====
class VIB34DCore {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            console.error('WebGL not supported for VIB34D Core');
            return;
        }
        
        // Instance configuration
        this.instanceId = options.instanceId || `vib34d-${Date.now()}`;
        this.instanceRole = options.role || 'background'; // 'header', 'content', 'background', etc.
        this.parameterModifier = options.modifier || 1.0; // Instance variation (1.0, 1.3, 0.7, etc.)
        this.colorInversion = options.colorInversion || { hue: 0, saturation: 1.0, brightness: 1.0 };
        this.parameterEnhancements = options.parameterEnhancements || {};
        
        // Core state (EXACT from working demo)
        this.startTime = Date.now();
        this.currentTheme = options.geometry || 'hypercube';
        this.interactionState = {
            type: 'idle',
            intensity: 0,
            lastActivity: Date.now(),
            holdStart: 0,
            isHolding: false,
            scrollVelocity: 0,
            mouseX: 0.5,
            mouseY: 0.5
        };
        
        // Theme configurations (EXACT from working demo with crystal included)
        this.themeConfigs = {
            hypercube: {
                baseColor: [1.0, 0.0, 1.0],      // Magenta
                gridDensity: 12.0,
                morphFactor: 0.5,
                dimension: 3.5,
                glitchIntensity: 0.3,
                rotationSpeed: 0.5,
                geometry: 'hypercube'
            },
            tetrahedron: {
                baseColor: [0.0, 1.0, 1.0],      // Cyan
                gridDensity: 8.0,
                morphFactor: 0.7,
                dimension: 3.2,
                glitchIntensity: 0.2,
                rotationSpeed: 0.7,
                geometry: 'tetrahedron'
            },
            sphere: {
                baseColor: [1.0, 1.0, 0.0],      // Yellow
                gridDensity: 15.0,
                morphFactor: 0.3,
                dimension: 3.8,
                glitchIntensity: 0.1,
                rotationSpeed: 0.3,
                geometry: 'sphere'
            },
            torus: {
                baseColor: [0.0, 1.0, 0.0],      // Green
                gridDensity: 10.0,
                morphFactor: 0.8,
                dimension: 3.6,
                glitchIntensity: 0.4,
                rotationSpeed: 0.6,
                geometry: 'torus'
            },
            klein: {
                baseColor: [1.0, 0.5, 0.0],      // Orange
                gridDensity: 14.0,
                morphFactor: 0.9,
                dimension: 3.9,
                glitchIntensity: 0.5,
                rotationSpeed: 0.4,
                geometry: 'klein'
            },
            fractal: {
                baseColor: [0.5, 0.0, 1.0],      // Purple
                gridDensity: 20.0,
                morphFactor: 0.6,
                dimension: 3.7,
                glitchIntensity: 0.6,
                rotationSpeed: 0.8,
                geometry: 'fractal'
            },
            wave: {
                baseColor: [1.0, 0.0, 0.5],      // Pink
                gridDensity: 16.0,
                morphFactor: 0.4,
                dimension: 3.3,
                glitchIntensity: 0.3,
                rotationSpeed: 0.9,
                geometry: 'wave'
            },
            crystal: {
                baseColor: [0.0, 1.0, 0.5],      // Mint - Universal UI Framework
                gridDensity: 18.0,
                morphFactor: 0.2,
                dimension: 3.1,
                glitchIntensity: 0.2,
                rotationSpeed: 0.2,
                geometry: 'crystal'
            }
        };
        
        // Current parameters (reactive) with instance modifier applied
        this.params = this.applyInstanceModifier({ ...this.themeConfigs[this.currentTheme] });
        
        this.initShaders();
        this.initBuffers();
        this.resize();
        
        // Don't auto-start animation - controlled by MultiInstanceManager
        this.isActive = false;
        
        console.log(`✅ VIB34D Core [${this.instanceId}] initialized - ${this.currentTheme} ${this.instanceRole}`);
    }
    
    applyInstanceModifier(baseParams) {
        // Apply instance variation to base parameters with enhanced differentiation
        const modifiedColor = this.applyColorInversion(baseParams.baseColor);
        const enhancements = this.parameterEnhancements;
        
        return {
            ...baseParams,
            gridDensity: baseParams.gridDensity * this.parameterModifier * (enhancements.gridScale || 1.0),
            morphFactor: baseParams.morphFactor * this.parameterModifier * (enhancements.morphScale || 1.0),
            rotationSpeed: baseParams.rotationSpeed * this.parameterModifier * (enhancements.rotationScale || 1.0),
            glitchIntensity: baseParams.glitchIntensity * (0.5 + this.parameterModifier * 0.5),
            // Enhanced dimension with role-specific boost
            dimension: baseParams.dimension + (enhancements.dimensionBoost || 0.0),
            baseColor: modifiedColor,
            interactionSensitivity: enhancements.interactionSensitivity || 1.0,
            morphingStyle: enhancements.morphingStyle || 'smooth'
        };
    }
    
    applyColorInversion(baseColor) {
        // Convert RGB to HSL, apply inversion, convert back
        const [r, g, b] = baseColor;
        const [h, s, l] = this.rgbToHsl(r, g, b);
        
        // Apply color inversion parameters
        const newH = (h + this.colorInversion.hue) % 360;
        const newS = Math.min(1.0, s * this.colorInversion.saturation);
        const newL = Math.min(1.0, l * this.colorInversion.brightness);
        
        return this.hslToRgb(newH, newS, newL);
    }
    
    rgbToHsl(r, g, b) {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        
        return [h * 360, s, l];
    }
    
    hslToRgb(h, s, l) {
        h = h / 360;
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        if (s === 0) {
            return [l, l, l];
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            return [
                hue2rgb(p, q, h + 1/3),
                hue2rgb(p, q, h),
                hue2rgb(p, q, h - 1/3)
            ];
        }
    }
    
    initShaders() {
        const vertexShaderSource = `
          attribute vec2 a_position;
          void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
          }
        `;
        
        // EXACT fragment shader from working demo
        const fragmentShaderSource = `
          precision highp float;
          
          uniform vec2 u_resolution;
          uniform float u_time;
          uniform vec2 u_mouse;
          uniform float u_morphFactor;
          uniform float u_glitchIntensity;
          uniform float u_rotationSpeed;
          uniform float u_dimension;
          uniform float u_gridDensity;
          uniform vec3 u_baseColor;
          uniform float u_interactionIntensity;
          uniform float u_geometry; // 0=hypercube, 1=tetrahedron, 2=sphere, 3=torus, 4=klein, 5=fractal, 6=wave, 7=crystal
          
          // 4D rotation matrices
          mat4 rotateXW(float theta) {
            float c = cos(theta);
            float s = sin(theta);
            return mat4(c, 0, 0, -s, 0, 1, 0, 0, 0, 0, 1, 0, s, 0, 0, c);
          }
          
          mat4 rotateYW(float theta) {
            float c = cos(theta);
            float s = sin(theta);
            return mat4(1, 0, 0, 0, 0, c, 0, -s, 0, 0, 1, 0, 0, s, 0, c);
          }
          
          mat4 rotateZW(float theta) {
            float c = cos(theta);
            float s = sin(theta);
            return mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, c, -s, 0, 0, s, c);
          }
          
          vec3 project4Dto3D(vec4 p) {
            float w = 2.0 / (2.0 + p.w);
            return vec3(p.x * w, p.y * w, p.z * w);
          }
          
          // Geometry generators (EXACT from demo)
          float hypercubeLattice(vec3 p, float gridSize) {
            vec3 grid = fract(p * gridSize);
            vec3 edges = 1.0 - smoothstep(0.0, 0.03, abs(grid - 0.5));
            return max(max(edges.x, edges.y), edges.z);
          }
          
          float tetrahedronLattice(vec3 p, float gridSize) {
            vec3 q = fract(p * gridSize) - 0.5;
            float d1 = length(q);
            float d2 = length(q - vec3(0.5, 0.0, 0.0));
            float d3 = length(q - vec3(0.0, 0.5, 0.0));
            float d4 = length(q - vec3(0.0, 0.0, 0.5));
            return 1.0 - smoothstep(0.0, 0.1, min(min(d1, d2), min(d3, d4)));
          }
          
          float sphereLattice(vec3 p, float gridSize) {
            vec3 q = fract(p * gridSize) - 0.5;
            float r = length(q);
            return 1.0 - smoothstep(0.2, 0.5, r);
          }
          
          float torusLattice(vec3 p, float gridSize) {
            vec3 q = fract(p * gridSize) - 0.5;
            float r1 = sqrt(q.x*q.x + q.y*q.y);
            float r2 = sqrt((r1 - 0.3)*(r1 - 0.3) + q.z*q.z);
            return 1.0 - smoothstep(0.0, 0.1, r2);
          }
          
          float kleinLattice(vec3 p, float gridSize) {
            vec3 q = fract(p * gridSize);
            float u = q.x * 2.0 * 3.14159;
            float v = q.y * 2.0 * 3.14159;
            float x = cos(u) * (3.0 + cos(u/2.0) * sin(v) - sin(u/2.0) * sin(2.0*v));
            float klein = length(vec2(x, q.z)) - 0.1;
            return 1.0 - smoothstep(0.0, 0.05, abs(klein));
          }
          
          float fractalLattice(vec3 p, float gridSize) {
            vec3 q = p * gridSize;
            float scale = 1.0;
            float fractal = 0.0;
            for(int i = 0; i < 4; i++) {
              q = fract(q) - 0.5;
              fractal += abs(length(q)) / scale;
              scale *= 2.0;
              q *= 2.0;
            }
            return 1.0 - smoothstep(0.0, 1.0, fractal);
          }
          
          float waveLattice(vec3 p, float gridSize) {
            vec3 q = p * gridSize;
            float wave = sin(q.x * 2.0) * sin(q.y * 2.0) * sin(q.z * 2.0 + u_time);
            return smoothstep(-0.5, 0.5, wave);
          }
          
          float crystalLattice(vec3 p, float gridSize) {
            vec3 q = fract(p * gridSize) - 0.5;
            float d = max(max(abs(q.x), abs(q.y)), abs(q.z));
            return 1.0 - smoothstep(0.3, 0.5, d);
          }
          
          float getGeometryValue(vec3 p, float gridSize, float geomType) {
            if (geomType < 0.5) return hypercubeLattice(p, gridSize);
            else if (geomType < 1.5) return tetrahedronLattice(p, gridSize);
            else if (geomType < 2.5) return sphereLattice(p, gridSize);
            else if (geomType < 3.5) return torusLattice(p, gridSize);
            else if (geomType < 4.5) return kleinLattice(p, gridSize);
            else if (geomType < 5.5) return fractalLattice(p, gridSize);
            else if (geomType < 6.5) return waveLattice(p, gridSize);
            else return crystalLattice(p, gridSize);
          }
          
          void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            float aspectRatio = u_resolution.x / u_resolution.y;
            uv.x *= aspectRatio;
            
            vec2 center = vec2(u_mouse.x * aspectRatio, u_mouse.y);
            vec3 p = vec3(uv - center, 0.0);
            
            // Interaction-driven rotation
            float timeRotation = u_time * 0.2 * u_rotationSpeed * (1.0 + u_interactionIntensity);
            mat2 rotation = mat2(cos(timeRotation), -sin(timeRotation), sin(timeRotation), cos(timeRotation));
            p.xy = rotation * p.xy;
            p.z = sin(u_time * 0.1) * 0.5;
            
            // Apply 4D transformations based on interaction
            if (u_dimension > 3.0) {
              float w = sin(length(p) * 3.0 + u_time * 0.3) * (u_dimension - 3.0) * (1.0 + u_interactionIntensity * 0.5);
              vec4 p4d = vec4(p, w);
              
              p4d = rotateXW(timeRotation * 0.31) * p4d;
              p4d = rotateYW(timeRotation * 0.27) * p4d;
              p4d = rotateZW(timeRotation * 0.23) * p4d;
              
              p = project4Dto3D(p4d);
            }
            
            // Dynamic grid density based on interaction
            float dynamicGridDensity = u_gridDensity * (1.0 + u_interactionIntensity * 0.3);
            
            // Get geometry value
            float lattice = getGeometryValue(p, dynamicGridDensity, u_geometry);
            
            // Interaction-driven glitch effects
            float glitchAmount = u_glitchIntensity * (0.1 + 0.1 * sin(u_time * 5.0)) * (1.0 + u_interactionIntensity);
            
            vec2 rOffset = vec2(glitchAmount, glitchAmount * 0.5);
            vec2 gOffset = vec2(-glitchAmount * 0.3, glitchAmount * 0.2);
            vec2 bOffset = vec2(glitchAmount * 0.1, -glitchAmount * 0.4);
            
            float r = getGeometryValue(vec3(p.xy + rOffset, p.z), dynamicGridDensity, u_geometry);
            float g = getGeometryValue(vec3(p.xy + gOffset, p.z), dynamicGridDensity, u_geometry);
            float b = getGeometryValue(vec3(p.xy + bOffset, p.z), dynamicGridDensity, u_geometry);
            
            // Base colors with theme-specific tinting
            vec3 baseColor = vec3(0.02, 0.05, 0.1);
            vec3 latticeColor = u_baseColor * (0.8 + 0.2 * u_interactionIntensity);
            
            vec3 color = mix(baseColor, latticeColor, vec3(r, g, b));
            
            // Interaction-responsive glow
            color += u_baseColor * 0.1 * (0.5 + 0.5 * sin(u_time * 0.5)) * u_interactionIntensity;
            
            // Vignette
            float vignette = 1.0 - smoothstep(0.4, 1.4, length(uv - vec2(center.x, center.y)));
            color *= vignette;
            
            gl_FragColor = vec4(color, 0.95);
          }
        `;
        
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        
        if (!vertexShader || !fragmentShader) {
            console.error('VIB34D shader compilation failed');
            return;
        }
        
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);
        
        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('VIB34D program linking failed:', this.gl.getProgramInfoLog(this.program));
            return;
        }
        
        // Get uniform locations
        this.uniforms = {
            resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
            time: this.gl.getUniformLocation(this.program, 'u_time'),
            mouse: this.gl.getUniformLocation(this.program, 'u_mouse'),
            morphFactor: this.gl.getUniformLocation(this.program, 'u_morphFactor'),
            glitchIntensity: this.gl.getUniformLocation(this.program, 'u_glitchIntensity'),
            rotationSpeed: this.gl.getUniformLocation(this.program, 'u_rotationSpeed'),
            dimension: this.gl.getUniformLocation(this.program, 'u_dimension'),
            gridDensity: this.gl.getUniformLocation(this.program, 'u_gridDensity'),
            baseColor: this.gl.getUniformLocation(this.program, 'u_baseColor'),
            interactionIntensity: this.gl.getUniformLocation(this.program, 'u_interactionIntensity'),
            geometry: this.gl.getUniformLocation(this.program, 'u_geometry')
        };
    }
    
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('VIB34D shader compilation error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    initBuffers() {
        const positions = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1
        ]);
        
        this.buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
        
        const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    }
    
    resize() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
            this.gl.viewport(0, 0, width, height);
        }
    }
    
    updateTheme(theme, derivedParams = null) {
        if (this.themeConfigs[theme]) {
            this.currentTheme = theme;
            
            // Use derived parameters from home-master or fallback to theme config
            const baseParams = derivedParams || this.themeConfigs[theme];
            this.params = this.applyInstanceModifier(baseParams);
            
            console.log(`🎨 VIB34D [${this.instanceId}] theme: ${theme} with modifier: ${this.parameterModifier}`);
        }
    }
    
    updateInteractionState(state) {
        Object.assign(this.interactionState, state);
        
        // Enhanced interaction parameter modification with sensitivity scaling
        const sensitivity = this.params.interactionSensitivity || 1.0;
        
        switch(state.type) {
            case 'scroll':
                const scrollModifier = Math.min(state.scrollVelocity / 20, 1.0) * sensitivity;
                this.params.gridDensity = (this.params.gridDensity / this.parameterModifier) * this.parameterModifier * (1.0 + scrollModifier * 0.5);
                this.params.dimension = (this.params.dimension / this.parameterModifier) * this.parameterModifier + scrollModifier * 0.3;
                this.params.rotationSpeed = (this.params.rotationSpeed / this.parameterModifier) * this.parameterModifier * (1.0 + scrollModifier * 0.2);
                break;
                
            case 'hold':
                if (state.isHolding) {
                    const holdDuration = (Date.now() - state.holdStart) / 1000;
                    const holdEffect = holdDuration * sensitivity;
                    this.params.morphFactor = Math.min((this.params.morphFactor / this.parameterModifier) * this.parameterModifier + holdEffect * 0.2, 1.0);
                    this.params.dimension = Math.min((this.params.dimension / this.parameterModifier) * this.parameterModifier + holdEffect * 0.1, 4.0);
                }
                break;
                
            case 'mouse':
                // Enhanced mouse reactivity based on sensitivity
                this.interactionState.intensity = Math.min(state.intensity * sensitivity, 2.0);
                this.params.glitchIntensity = (this.params.glitchIntensity / this.parameterModifier) * this.parameterModifier * (1.0 + state.intensity * sensitivity * 0.1);
                break;
        }
    }
    
    // Alias for VIB3StylePack compatibility
    updateInteraction(state) {
        this.updateInteractionState(state);
    }
    
    // Missing method for VIB3StylePack compatibility
    updateGeometry(geometry, modifier) {
        this.currentTheme = geometry;
        this.modifier = modifier;
        this.updateTheme(geometry);
    }
    
    setGeometryVariations(variations) {
        this.geometryVariations = variations;
        this.updateVariationUniforms();
    }
    
    // Alias for VIB3ElementMapper compatibility
    setElementVariations(variations) {
        this.setGeometryVariations(variations);
    }
    
    updateVariationUniforms() {
        // VIB34D Core doesn't use variations uniform - this is handled by instance modifiers
        // Variations are applied through the parameterModifier system instead
        console.log(`🎨 VIB34D [${this.instanceId}] variations applied through modifier: ${this.parameterModifier}`);
    }
    
    render() {
        if (!this.program || !this.isActive) return;
        
        // Check for WebGL context loss
        if (this.gl.isContextLost()) {
            console.warn(`⚠️ WebGL context lost for [${this.instanceId}]`);
            return;
        }
        
        this.resize();
        this.gl.useProgram(this.program);
        
        const time = (Date.now() - this.startTime) / 1000;
        
        // Geometry mapping
        const geometryMap = { 
            hypercube: 0, tetrahedron: 1, sphere: 2, torus: 3, 
            klein: 4, fractal: 5, wave: 6, crystal: 7 
        };
        
        // Set uniforms
        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform1f(this.uniforms.time, time);
        this.gl.uniform2f(this.uniforms.mouse, this.interactionState.mouseX, this.interactionState.mouseY);
        this.gl.uniform1f(this.uniforms.morphFactor, this.params.morphFactor);
        this.gl.uniform1f(this.uniforms.glitchIntensity, this.params.glitchIntensity);
        this.gl.uniform1f(this.uniforms.rotationSpeed, this.params.rotationSpeed);
        this.gl.uniform1f(this.uniforms.dimension, this.params.dimension);
        this.gl.uniform1f(this.uniforms.gridDensity, this.params.gridDensity);
        this.gl.uniform3fv(this.uniforms.baseColor, new Float32Array(this.params.baseColor || [1.0, 0.0, 1.0]));
        this.gl.uniform1f(this.uniforms.interactionIntensity, this.interactionState.intensity);
        this.gl.uniform1f(this.uniforms.geometry, geometryMap[this.currentTheme] || 0);
        
        // Update variations if multi-geometry mode
        if (this.multiGeometry && this.geometryVariations.length > 0) {
            this.updateVariationUniforms();
        }
        
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        
        // Decay interaction intensity
        this.interactionState.intensity *= 0.95;
    }
    
    start() {
        this.isActive = true;
        console.log(`🎬 VIB34D [${this.instanceId}] started`);
    }
    
    pause() {
        this.isActive = false;
        console.log(`⏸️ VIB34D [${this.instanceId}] paused`);
    }
    
    destroy() {
        this.isActive = false;
        if (this.program) this.gl.deleteProgram(this.program);
        if (this.buffer) this.gl.deleteBuffer(this.buffer);
        console.log(`🗑️ VIB34D [${this.instanceId}] destroyed`);
    }
}

// Export for VIB34D Style System
window.VIB34DCore = VIB34DCore;
console.log('✅ VIB34D Core System loaded - Ready for multi-instance framework');