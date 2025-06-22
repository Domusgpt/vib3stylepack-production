/**
 * VIB3STYLEPACK GEOMETRIC UI SYSTEM
 * Geometry IS the UI - glass morphism interactive elements
 * Multiple geometry variations become buttons, cards, navigation
 */

console.log('💎 VIB3STYLEPACK Geometric UI Loading...');

class VIB3GeometricUI {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            console.error('WebGL not supported for Geometric UI');
            return;
        }
        
        this.sectionKey = options.sectionKey || 'unknown';
        this.geometry = options.geometry || 'hypercube';
        this.modifier = options.modifier || 1.0;
        
        // UI Elements as geometric shapes
        this.uiElements = [];
        this.interactionState = {
            mouseX: 0.5,
            mouseY: 0.5,
            intensity: 1.0,
            hoveredElement: null,
            clickedElement: null
        };
        
        this.isActive = false;
        this.startTime = Date.now();
        
        this.initializeShaders();
        this.initBuffers();
        this.setupUIElements();
        
        console.log(`💎 Geometric UI initialized for section [${this.sectionKey}] with geometry: ${this.geometry}`);
    }
    
    initializeShaders() {
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
            
            // UI element data: [x, y, size, type] for each element
            uniform vec4 u_uiElements[8];
            uniform int u_elementCount;
            uniform int u_hoveredElement;
            
            // Glass morphism parameters
            uniform vec3 u_glassColor;
            uniform float u_glassOpacity;
            uniform float u_glassBlur;
            
            // 4D rotation matrices
            mat4 rotateXW(float angle) {
                float c = cos(angle), s = sin(angle);
                return mat4(c,0,0,-s, 0,1,0,0, 0,0,1,0, s,0,0,c);
            }
            
            mat4 rotateYW(float angle) {
                float c = cos(angle), s = sin(angle);
                return mat4(1,0,0,0, 0,c,0,-s, 0,0,1,0, 0,s,0,c);
            }
            
            vec3 project4Dto3D(vec4 p4d) {
                float w = p4d.w + 2.0;
                return p4d.xyz / w;
            }
            
            // Geometric UI shape functions
            float hypercubeUI(vec3 p, float size) {
                vec3 q = abs(p) - vec3(size);
                return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
            }
            
            float tetrahedronUI(vec3 p, float size) {
                vec3 q = abs(p);
                float d = max(q.x + q.y + q.z - size, max(q.x, max(q.y, q.z)) - size * 0.7);
                return d;
            }
            
            float sphereUI(vec3 p, float size) {
                return length(p) - size;
            }
            
            float torusUI(vec3 p, float size) {
                vec2 q = vec2(length(p.xy) - size * 0.8, p.z);
                return length(q) - size * 0.3;
            }
            
            float waveUI(vec3 p, float size) {
                float wave = sin(p.x * 5.0) * sin(p.y * 5.0) * 0.1;
                return length(p) - size + wave;
            }
            
            float getUIGeometry(vec3 p, float size, float geomType) {
                if (geomType < 0.5) return hypercubeUI(p, size);
                else if (geomType < 1.5) return tetrahedronUI(p, size);
                else if (geomType < 2.5) return sphereUI(p, size);
                else if (geomType < 3.5) return torusUI(p, size);
                else return waveUI(p, size);
            }
            
            // Glass morphism effect
            vec3 applyGlassMorphism(vec3 baseColor, float sdf, vec2 uv, bool isHovered) {
                // Glass blur effect
                float blur = smoothstep(0.0, 0.1, abs(sdf));
                
                // Frosted glass texture
                vec2 frostedUV = uv + sin(uv * 20.0) * 0.01;
                float frost = sin(frostedUV.x * 30.0) * sin(frostedUV.y * 30.0) * 0.1;
                
                // Edge glow for hover state
                float glow = isHovered ? exp(-abs(sdf) * 20.0) * 2.0 : 0.0;
                
                // Combine glass effects
                vec3 glassColor = u_glassColor + vec3(frost) + vec3(glow);
                float alpha = u_glassOpacity * (1.0 - blur) + glow;
                
                return mix(baseColor, glassColor, alpha);
            }
            
            void main() {
                vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                float aspect = u_resolution.x / u_resolution.y;
                uv.x *= aspect;
                
                vec2 center = vec2(u_mouse.x * aspect, u_mouse.y);
                vec3 baseColor = vec3(0.05, 0.05, 0.1); // Dark background
                
                // Render each UI element
                for (int i = 0; i < 8; i++) {
                    if (i >= u_elementCount) break;
                    
                    vec4 element = u_uiElements[i];
                    vec2 elementPos = element.xy;
                    float elementSize = element.z * u_modifier;
                    float elementType = element.w;
                    
                    // Position relative to element center
                    vec3 p = vec3(uv - elementPos, 0.0);
                    
                    // 4D transformations
                    float time = u_time * 0.5;
                    vec4 p4d = vec4(p, sin(length(p) * 8.0 + time));
                    
                    p4d = rotateXW(time * 0.2 + float(i) * 0.5) * p4d;
                    p4d = rotateYW(time * 0.3 + float(i) * 0.3) * p4d;
                    
                    p = project4Dto3D(p4d);
                    
                    // Get UI geometry SDF
                    float sdf = getUIGeometry(p, elementSize, u_geometry + elementType);
                    
                    // Create UI element
                    if (sdf < 0.05) {
                        bool isHovered = (i == u_hoveredElement);
                        
                        // Base element color based on type
                        vec3 elementColor;
                        if (elementType < 0.5) elementColor = vec3(1.0, 0.0, 1.0); // Magenta - navigation
                        else if (elementType < 1.5) elementColor = vec3(0.0, 1.0, 1.0); // Cyan - content
                        else if (elementType < 2.5) elementColor = vec3(1.0, 1.0, 0.0); // Yellow - accent
                        else elementColor = vec3(0.0, 1.0, 0.0); // Green - interactive
                        
                        // Apply glass morphism
                        baseColor = applyGlassMorphism(baseColor, sdf, uv, isHovered);
                        baseColor = mix(baseColor, elementColor, 0.3 + (isHovered ? 0.4 : 0.0));
                    }
                }
                
                // Final output
                gl_FragColor = vec4(baseColor, 0.9);
            }
        `;
        
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);
        
        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('UI Shader program linking failed:', this.gl.getProgramInfoLog(this.program));
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
            uiElements: this.gl.getUniformLocation(this.program, 'u_uiElements'),
            elementCount: this.gl.getUniformLocation(this.program, 'u_elementCount'),
            hoveredElement: this.gl.getUniformLocation(this.program, 'u_hoveredElement'),
            glassColor: this.gl.getUniformLocation(this.program, 'u_glassColor'),
            glassOpacity: this.gl.getUniformLocation(this.program, 'u_glassOpacity'),
            glassBlur: this.gl.getUniformLocation(this.program, 'u_glassBlur')
        };
    }
    
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('UI Shader compilation error:', this.gl.getShaderInfoLog(shader));
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
    
    setupUIElements() {
        // Create geometric UI elements based on section
        this.uiElements = [];
        
        if (this.sectionKey === 'home') {
            // Home: Hypercube navigation + content cards
            this.uiElements = [
                { x: 0.3, y: 0.7, size: 0.15, type: 0, role: 'navigation', content: 'Mathematical Foundation' },
                { x: 0.7, y: 0.7, size: 0.15, type: 1, role: 'content', content: 'Parameter Control' },
                { x: 0.5, y: 0.4, size: 0.12, type: 2, role: 'accent', content: 'Portal Transitions' }
            ];
        } else if (this.sectionKey === 'articles') {
            // Articles: Tetrahedron structure
            this.uiElements = [
                { x: 0.25, y: 0.6, size: 0.13, type: 0, role: 'content', content: 'Technical Articles' },
                { x: 0.75, y: 0.6, size: 0.13, type: 1, role: 'content', content: 'Documentation' }
            ];
        } else if (this.sectionKey === 'videos') {
            // Videos: Sphere media
            this.uiElements = [
                { x: 0.3, y: 0.5, size: 0.14, type: 0, role: 'content', content: 'Tutorial Videos' },
                { x: 0.7, y: 0.5, size: 0.14, type: 1, role: 'content', content: 'Demos' }
            ];
        } else if (this.sectionKey === 'podcasts') {
            // Podcasts: Torus flow
            this.uiElements = [
                { x: 0.4, y: 0.6, size: 0.12, type: 0, role: 'content', content: 'Audio Content' },
                { x: 0.6, y: 0.4, size: 0.12, type: 1, role: 'accent', content: 'Streams' }
            ];
        } else if (this.sectionKey === 'ema') {
            // EMA: Wave quantum spaces
            this.uiElements = [
                { x: 0.35, y: 0.65, size: 0.16, type: 0, role: 'content', content: 'EMA Principles' },
                { x: 0.65, y: 0.35, size: 0.16, type: 1, role: 'content', content: 'Case Studies' }
            ];
        }
        
        console.log(`💎 Created ${this.uiElements.length} geometric UI elements for [${this.sectionKey}]`);
    }
    
    updateInteraction(state) {
        Object.assign(this.interactionState, state);
        
        // Check for hover interactions with UI elements
        if (state.type === 'mouse') {
            this.checkElementHover(state.mouseX, state.mouseY);
        }
    }
    
    checkElementHover(mouseX, mouseY) {
        let hoveredIndex = -1;
        const threshold = 0.08; // Hover detection radius
        
        this.uiElements.forEach((element, index) => {
            const distance = Math.sqrt(
                Math.pow(mouseX - element.x, 2) + 
                Math.pow(mouseY - element.y, 2)
            );
            
            if (distance < threshold) {
                hoveredIndex = index;
            }
        });
        
        if (hoveredIndex !== this.interactionState.hoveredElement) {
            this.interactionState.hoveredElement = hoveredIndex;
            
            if (hoveredIndex >= 0) {
                console.log(`💎 Hovering geometric UI: ${this.uiElements[hoveredIndex].content}`);
            }
        }
    }
    
    render() {
        if (!this.isActive || !this.program) return;
        
        this.gl.useProgram(this.program);
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        const time = (Date.now() - this.startTime) / 1000;
        
        // Geometry mapping
        const geometryMap = { 
            hypercube: 0, tetrahedron: 1, sphere: 2, torus: 3, wave: 4 
        };
        
        // Set uniforms
        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform1f(this.uniforms.time, time);
        this.gl.uniform2f(this.uniforms.mouse, this.interactionState.mouseX, this.interactionState.mouseY);
        this.gl.uniform1f(this.uniforms.geometry, geometryMap[this.geometry] || 0);
        this.gl.uniform1f(this.uniforms.modifier, this.modifier);
        this.gl.uniform1f(this.uniforms.intensity, this.interactionState.intensity);
        this.gl.uniform1i(this.uniforms.hoveredElement, this.interactionState.hoveredElement || -1);
        
        // Glass morphism settings
        this.gl.uniform3f(this.uniforms.glassColor, 0.9, 0.9, 1.0); // Slight blue tint
        this.gl.uniform1f(this.uniforms.glassOpacity, 0.3);
        this.gl.uniform1f(this.uniforms.glassBlur, 0.1);
        
        // UI elements data
        const elementData = new Float32Array(32); // 8 elements × 4 params
        this.gl.uniform1i(this.uniforms.elementCount, this.uiElements.length);
        
        for (let i = 0; i < Math.min(8, this.uiElements.length); i++) {
            const element = this.uiElements[i];
            elementData[i * 4 + 0] = element.x;
            elementData[i * 4 + 1] = element.y;
            elementData[i * 4 + 2] = element.size;
            elementData[i * 4 + 3] = element.type;
        }
        this.gl.uniform4fv(this.uniforms.uiElements, elementData);
        
        // Enable blending for glass effect
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    
    start() {
        this.isActive = true;
        console.log(`💎 Geometric UI started for section [${this.sectionKey}]`);
    }
    
    pause() {
        this.isActive = false;
        console.log(`⏸️ Geometric UI paused for section [${this.sectionKey}]`);
    }
    
    resize() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
    }
    
    destroy() {
        this.isActive = false;
        if (this.program) this.gl.deleteProgram(this.program);
        if (this.buffer) this.gl.deleteBuffer(this.buffer);
        console.log(`🗑️ Geometric UI destroyed for section [${this.sectionKey}]`);
    }
}

window.VIB3GeometricUI = VIB3GeometricUI;
console.log('✅ VIB3STYLEPACK Geometric UI loaded - Geometry IS the interface ready');