/**
 * VIB3STYLEPACK CORE - Multi-Geometry Renderer
 * Single canvas renders multiple geometry variations
 * Canvas consolidation for WebGL context efficiency
 */

console.log('🌌 VIB3STYLEPACK Core Loading...');

class VIB3Core {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }
        
        this.sectionKey = options.sectionKey || 'unknown';
        this.geometry = options.geometry || 'hypercube';
        this.modifier = options.modifier || 1.0;
        
        // Multi-element variations
        this.elementVariations = [];
        
        // Interaction state
        this.interactionState = {
            mouseX: 0.5,
            mouseY: 0.5,
            scrollVelocity: 0,
            intensity: 0,
            time: 0
        };
        
        // Initialize WebGL
        this.initShaders();
        this.initBuffers();
        this.resize();
        
        this.isActive = false;
        this.startTime = Date.now();
        
        console.log(`🎨 VIB3Core initialized for section [${this.sectionKey}] with geometry: ${this.geometry}`);
    }
    
    initShaders() {
        const vertexShaderSource = `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
        
        const fragmentShaderSource = `
            precision mediump float;
            uniform vec2 u_resolution;
            uniform float u_time;
            uniform vec2 u_mouse;
            uniform float u_geometry;
            uniform float u_modifier;
            uniform float u_intensity;
            
            // Multi-element uniforms (4 elements × 4 params each)
            uniform float u_elements[16];
            
            // 4D rotation matrices
            mat4 rotateXW(float angle) {
                float c = cos(angle);
                float s = sin(angle);
                return mat4(
                    c, 0, 0, -s,
                    0, 1, 0, 0,
                    0, 0, 1, 0,
                    s, 0, 0, c
                );
            }
            
            mat4 rotateYW(float angle) {
                float c = cos(angle);
                float s = sin(angle);
                return mat4(
                    1, 0, 0, 0,
                    0, c, 0, -s,
                    0, 0, 1, 0,
                    0, s, 0, c
                );
            }
            
            vec3 project4Dto3D(vec4 p4d) {
                float w = 1.0 + p4d.w * 0.5;
                return p4d.xyz / w;
            }
            
            // Geometry functions
            float hypercubeLattice(vec3 p, float density) {
                vec3 q = fract(p * density) - 0.5;
                float d = max(max(abs(q.x), abs(q.y)), abs(q.z));
                return 1.0 - smoothstep(0.3, 0.5, d);
            }
            
            float tetrahedronLattice(vec3 p, float density) {
                vec3 q = fract(p * density) - 0.5;
                float d = max(max(abs(q.x + q.y), abs(q.y + q.z)), abs(q.z + q.x));
                return 1.0 - smoothstep(0.2, 0.4, d);
            }
            
            float sphereLattice(vec3 p, float density) {
                vec3 q = fract(p * density) - 0.5;
                float d = length(q);
                return 1.0 - smoothstep(0.2, 0.4, d);
            }
            
            float torusLattice(vec3 p, float density) {
                vec3 q = fract(p * density) - 0.5;
                float d = length(vec2(length(q.xy) - 0.3, q.z));
                return 1.0 - smoothstep(0.1, 0.3, d);
            }
            
            float waveLattice(vec3 p, float density) {
                vec3 q = fract(p * density) - 0.5;
                float wave = sin(q.x * 10.0) * sin(q.y * 10.0) * sin(q.z * 10.0);
                return smoothstep(-0.5, 0.5, wave);
            }
            
            float getGeometry(vec3 p, float density, float geomType) {
                if (geomType < 0.5) return hypercubeLattice(p, density);
                else if (geomType < 1.5) return tetrahedronLattice(p, density);
                else if (geomType < 2.5) return sphereLattice(p, density);
                else if (geomType < 3.5) return torusLattice(p, density);
                else return waveLattice(p, density);
            }
            
            void main() {
                vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                float aspect = u_resolution.x / u_resolution.y;
                uv.x *= aspect;
                
                vec2 center = vec2(u_mouse.x * aspect, u_mouse.y);
                vec3 p = vec3(uv - center, 0.0);
                
                // 4D transformations
                float time = u_time * 0.3;
                vec4 p4d = vec4(p, sin(length(p) * 3.0 + time));
                
                p4d = rotateXW(time * 0.31) * p4d;
                p4d = rotateYW(time * 0.27) * p4d;
                
                p = project4Dto3D(p4d);
                
                // Multi-element rendering
                vec3 color = vec3(0.02, 0.05, 0.1); // Background
                
                // Check if multi-element mode is enabled
                if (u_elements[0] > 0.0) {
                    // Render multiple elements with different properties
                    for (int i = 0; i < 4; i++) {
                        float elementModifier = u_elements[i * 4 + 0];
                        float elementOpacity = u_elements[i * 4 + 1];
                        float elementColorR = u_elements[i * 4 + 2];
                        float elementColorG = u_elements[i * 4 + 3];
                        
                        if (elementModifier > 0.0) {
                            float density = 12.0 * elementModifier * u_modifier;
                            float lattice = getGeometry(p * elementModifier, density, u_geometry);
                            
                            vec3 elementColor = vec3(elementColorR, elementColorG, 1.0 - elementColorR);
                            color += lattice * elementColor * elementOpacity * (1.0 + u_intensity);
                        }
                    }
                } else {
                    // Single geometry mode (fallback)
                    float density = 12.0 * u_modifier;
                    float lattice = getGeometry(p, density, u_geometry);
                    vec3 baseColor = vec3(1.0, 0.0, 1.0); // Magenta fallback
                    color += lattice * baseColor * (1.0 + u_intensity);
                }
                
                // Vignette
                float vignette = 1.0 - smoothstep(0.4, 1.4, length(uv - center));
                color *= vignette;
                
                gl_FragColor = vec4(color, 0.95);
            }
        `;
        
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);
        
        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('Shader program linking failed:', this.gl.getProgramInfoLog(this.program));
            return;
        }
        
        // Get uniform locations
        this.uniforms = {
            resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
            time: this.gl.getUniformLocation(this.program, 'u_time'),
            mouse: this.gl.getUniformLocation(this.program, 'u_mouse'),
            geometry: this.gl.getUniformLocation(this.program, 'u_geometry'),
            modifier: this.gl.getUniformLocation(this.program, 'u_modifier'),
            intensity: this.gl.getUniformLocation(this.program, 'u_intensity'),
            elements: this.gl.getUniformLocation(this.program, 'u_elements')
        };
    }
    
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
            return null;
        }
        
        return shader;
    }
    
    initBuffers() {
        const positions = new Float32Array([
            -1, -1, 1, -1, -1, 1, 1, 1
        ]);
        
        this.buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
        
        const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    }
    
    setElementVariations(variations) {
        this.elementVariations = variations;
    }
    
    updateInteraction(state) {
        Object.assign(this.interactionState, state);
    }
    
    updateGeometry(geometry, modifier) {
        this.geometry = geometry;
        this.modifier = modifier;
    }
    
    render() {
        if (!this.isActive || !this.program) return;
        
        this.gl.useProgram(this.program);
        
        const time = (Date.now() - this.startTime) / 1000;
        
        // Geometry mapping
        const geometryMap = { 
            hypercube: 0, tetrahedron: 1, sphere: 2, torus: 3, wave: 4 
        };
        
        // Set basic uniforms
        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform1f(this.uniforms.time, time);
        this.gl.uniform2f(this.uniforms.mouse, this.interactionState.mouseX, this.interactionState.mouseY);
        this.gl.uniform1f(this.uniforms.geometry, geometryMap[this.geometry] || 0);
        this.gl.uniform1f(this.uniforms.modifier, this.modifier);
        this.gl.uniform1f(this.uniforms.intensity, this.interactionState.intensity);
        
        // Set element variations
        const elementData = new Float32Array(16); // 4 elements × 4 params
        for (let i = 0; i < Math.min(4, this.elementVariations.length); i++) {
            const element = this.elementVariations[i];
            elementData[i * 4 + 0] = element.modifier || 0;
            elementData[i * 4 + 1] = element.opacity || 0;
            elementData[i * 4 + 2] = element.color ? element.color[0] : 0;
            elementData[i * 4 + 3] = element.color ? element.color[1] : 0;
        }
        this.gl.uniform1fv(this.uniforms.elements, elementData);
        
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
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
    
    start() {
        this.isActive = true;
        console.log(`🎬 VIB3Core started for section [${this.sectionKey}]`);
    }
    
    pause() {
        this.isActive = false;
        console.log(`⏸️ VIB3Core paused for section [${this.sectionKey}]`);
    }
    
    destroy() {
        this.isActive = false;
        if (this.program) this.gl.deleteProgram(this.program);
        if (this.buffer) this.gl.deleteBuffer(this.buffer);
        console.log(`🗑️ VIB3Core destroyed for section [${this.sectionKey}]`);
    }
}

window.VIB3Core = VIB3Core;
console.log('✅ VIB3STYLEPACK Core loaded - Multi-geometry rendering ready');