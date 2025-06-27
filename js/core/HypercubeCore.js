/**
 * HypercubeCore: Central coordination class for the 4D visualization.
 */
class HypercubeCore {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.gl = this.initWebGL(this.canvas);
        if (!this.gl) {
            throw new Error("WebGL not supported");
        }
        
        this.shaderManager = new ShaderManager(this.gl);
        this.geometryManager = window.globalGeometryManager || new GeometryManager();
        this.projectionManager = window.globalProjectionManager || new ProjectionManager();
        
        this.interactionEngine = new VIB34DInteractionEngine(this.canvas);

        this.baseParameters = {
            u_resolution: [this.canvas.width, this.canvas.height],
            u_time: 0.0, u_mouse: [0.0, 0.0], u_dimension: 4.0,
            u_gridDensity: 10.0, u_lineThickness: 0.01, u_universeModifier: 1.0, u_patternIntensity: 1.0,
            u_morphFactor: 0.0, u_rotationSpeed: 0.5,
            u_shellWidth: 0.05, u_tetraThickness: 0.02, u_glitchIntensity: 0.0,
            u_colorShift: 0.0,
            u_audioBass: 0.0, u_audioMid: 0.0, u_audioHigh: 0.0,
            fov: Math.PI / 4, near: 0.1, far: 100.0, projectionType: 'perspective',
            u_4D_projection_type: 0, u_stereo_R: 1.0, u_stereo_pole_sign: 1.0,
            u_lightDirection: [0.577, 0.577, 0.577],
            u_specularStrength: 0.5, u_specularColor: [1.0, 1.0, 1.0], u_materialShininess: 32.0,
            u_isTorus: false, // ADDED for Torus procedural texture
        };
        // ... (rest of constructor as before, including PresetManager init) ...
        this.parameterMapper = new ParameterMappingSystem(this.baseParameters, this.interactionEngine);
        this.effectiveParameters = { ...this.baseParameters };

        this.chromaticEngine = new VIB34DChromaticEngine();
        this.homeMasterBridge = new VIB3HomeMasterBridge(this);

        this.presetManager = new PresetManager(this, typeof VIB3_PRESETS_EXPANDED !== 'undefined' ? VIB3_PRESETS_EXPANDED : []);
        this.presetManager.loadUserPresetsFromLocalStorage();

        this.availableGeometries = ['hypercube', 'hypersphere', 'hypertetrahedron', 'torus', 'kleinbottle', 'fractal', 'wave', 'crystal'];
        this.availableProjections = ['perspective', 'orthographic', 'stereographic'];

        this.currentGeometry = null; this.currentProjection = null;
        this.animationFrameId = null; this.lastTimestamp = 0; this.deltaTime = 0; this.time = 0;

        this.onStateChangeCallback = options.onStateChangeCallback || (() => {});

        this.defaultVertexShader = options.vertexShaderSource || this.getDefaultVertexShader();
        this.defaultFragmentShader = options.fragmentShaderSource || this.getDefaultFragmentShader();
        this.init();
    }

    // ... initWebGL, init, setupEventListeners, onResize ... (mostly unchanged)
    initWebGL(canvas) {
        let gl = null;
        try {
            gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
            if (!gl) return null;
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
            gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        } catch (e) { console.error("HypercubeCore: Error initializing WebGL context.", e); }
        return gl;
    }

    init() {
        if (!this.shaderManager.createProgram(this.defaultVertexShader, this.defaultFragmentShader)) {
            console.error("HypercubeCore: Failed to create shader program."); return;
        }
        this.shaderManager.useProgram();
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('resize', this.onResize.bind(this), false);
        this.onResize();
    }

    onResize() {
        this.canvas.width = this.canvas.clientWidth; this.canvas.height = this.canvas.clientHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.baseParameters.u_resolution = [this.canvas.width, this.canvas.height];
        if (this.effectiveParameters) this.effectiveParameters.u_resolution = [this.canvas.width, this.canvas.height];
        if (this.currentProjection && typeof this.currentProjection.update === 'function') {
            const aspectToUse = this.effectiveParameters ? (this.effectiveParameters.u_resolution[0] / this.effectiveParameters.u_resolution[1]) : (this.baseParameters.u_resolution[0] / this.baseParameters.u_resolution[1]);
            this.currentProjection.update({
                aspect: aspectToUse, fov: this.baseParameters.fov, near: this.baseParameters.near, far: this.baseParameters.far,
                morphFactor: this.effectiveParameters ? this.effectiveParameters.u_morphFactor : this.baseParameters.u_morphFactor,
                audioMid: this.effectiveParameters ? this.effectiveParameters.u_audioMid : this.baseParameters.u_audioMid,
                audioHigh: this.effectiveParameters ? this.effectiveParameters.u_audioHigh : this.baseParameters.u_audioHigh,
            });
        }
    }


    setGeometry(name, initialParams = {}) {
        // ... (geometry registration logic as before) ...
        if (this.geometryManager.getGeometryClass(name) || (typeof window[name.charAt(0).toUpperCase() + name.slice(1) + 'Geometry'] !== 'undefined')) {
            if (!this.geometryManager.getGeometryClass(name)) {
                 try {
                    const GeomClass = window[name.charAt(0).toUpperCase() + name.slice(1) + 'Geometry'];
                    if (GeomClass) this.geometryManager.registerGeometry(name, GeomClass);
                 } catch (e) { /* ignore */ }
            }
        }

        const geometryInstance = this.geometryManager.createGeometryInstance(name, initialParams);
        if (geometryInstance) {
            if (this.currentGeometry && typeof this.currentGeometry.destroy === 'function') this.currentGeometry.destroy(this.gl);
            this.currentGeometry = geometryInstance;
            if (this.baseParameters) this.baseParameters.geometryName = name;
            if (this.effectiveParameters) {
                this.effectiveParameters.geometryName = name;
                // SET u_isTorus UNIFORM
                this.effectiveParameters.u_isTorus = (name === 'torus');
            }
            this.onStateChangeCallback('geometryChanged');
        } else { console.error(`HypercubeCore: Failed to set geometry "${name}".`); }
    }

    // ... setProjection, getAvailableGeometries, getAvailableProjections, getBaseParameters, getEffectiveParametersForDashboard ... (mostly unchanged)
    setProjection(name, initialParams = {}) {
        const currentAspect = this.baseParameters.u_resolution[0] / this.baseParameters.u_resolution[1];
        const paramsForProjection = {
            aspect: currentAspect, fov: this.baseParameters.fov, near: this.baseParameters.near, far: this.baseParameters.far,
            morphFactor: this.effectiveParameters.u_morphFactor, audioMid: this.effectiveParameters.u_audioMid, audioHigh: this.effectiveParameters.u_audioHigh,
            hypersphereRadius: (name === 'stereographic' && initialParams && initialParams.hypersphereRadius !== undefined) ? initialParams.hypersphereRadius : this.baseParameters.u_stereo_R,
            poleSign: (name === 'stereographic' && initialParams && initialParams.poleSign !== undefined) ? initialParams.poleSign : this.baseParameters.u_stereo_pole_sign,
            ...initialParams
        };
        const projectionInstance = this.projectionManager.createProjectionInstance(name, paramsForProjection);
        if (projectionInstance) {
            this.currentProjection = projectionInstance;
            this.baseParameters.projectionType = name;
            if (this.effectiveParameters) {
                this.effectiveParameters.projectionType = name;
                if (name === 'stereographic') {
                    this.effectiveParameters.u_4D_projection_type = 1;
                    this.effectiveParameters.u_stereo_R = this.currentProjection.parameters.hypersphereRadius !== undefined ? this.currentProjection.parameters.hypersphereRadius : this.baseParameters.u_stereo_R;
                    this.effectiveParameters.u_stereo_pole_sign = this.currentProjection.parameters.poleSign !== undefined ? this.currentProjection.parameters.poleSign : this.baseParameters.u_stereo_pole_sign;
                    if (this.currentProjection.parameters.audioHigh !== undefined && this.currentProjection.parameters.poleModulationStrength !== undefined) {
                        const audioMod = this.currentProjection.parameters.audioHigh * this.currentProjection.parameters.poleModulationStrength;
                        this.effectiveParameters.u_stereo_R *= (1.0 - audioMod);
                    }
                } else if (name === 'orthographic') {
                    this.effectiveParameters.u_4D_projection_type = 2;
                } else { this.effectiveParameters.u_4D_projection_type = 0; }
            }
            this.onStateChangeCallback('projectionChanged');
        } else { console.error(`HypercubeCore: Failed to set 3D projection "${name}".`); }
    }

    getAvailableGeometries() { return this.availableGeometries; }
    getAvailableProjections() { return this.projectionManager.listProjections().length > 0 ? this.projectionManager.listProjections() : this.availableProjections; }
    getBaseParameters() { return { ...this.baseParameters }; }
    getEffectiveParametersForDashboard() {
        if (this.parameterMapper && this.interactionEngine) {
            this.interactionEngine.update();
            return this.parameterMapper.getEffectiveParameters();
        }
        return { ...this.effectiveParameters };
    }

    loadPreset(preset) {
        if (!preset || !preset.params) { console.error("HypercubeCore: Invalid preset.", preset); return; }
        if (preset.geometry) this.setGeometry(preset.geometry, preset.geometryParams || {});
        if (preset.projection) this.setProjection(preset.projection, preset.projectionParams || {});
        const newBaseParams = { ...this.baseParameters };
        for (const key in preset.params) {
            if (this.baseParameters.hasOwnProperty(key)) newBaseParams[key] = preset.params[key];
        }
        this.updateBaseParameter(newBaseParams);
        this.onStateChangeCallback('presetLoaded');
    }

    getCurrentSettingsAsPreset() {
        const currentGeomName = this.currentGeometry ? (this.currentGeometry.constructor.name.toLowerCase().replace('geometry', '')) : (this.baseParameters.geometryName || 'default');
        const exportableBaseParams = { ...this.baseParameters };
        delete exportableBaseParams.u_resolution; delete exportableBaseParams.u_time; delete exportableBaseParams.u_mouse; delete exportableBaseParams.geometryName;
        return { geometry: currentGeomName, projection: this.baseParameters.projectionType || 'perspective', params: exportableBaseParams };
    }


    getCoreParametersSchema() {
        return [
            // ... (previous schema entries) ...
            { name: 'u_dimension', label: '4D Dimension', type: 'slider', min: 3.0, max: 5.0, step: 0.01, defaultValue: 4.0, group: 'Global Setup' },
            { name: 'u_gridDensity', label: 'Grid Density / Divisions', type: 'slider', min: 1.0, max: 30.0, step: 0.5, defaultValue: 10.0, group: 'Appearance & Structure',
              description: "Controls divisions for most geometries. For Fractal, maps to iterations. For Crystal, maps to lattice points per axis." },
            { name: 'u_lineThickness', label: 'Line/Point Size', type: 'slider', min: 0.001, max: 0.1, step: 0.001, defaultValue: 0.01, group: 'Appearance & Structure' },
            { name: 'u_shellWidth', label: 'Shell Width', type: 'slider', min: 0.001, max: 0.25, step: 0.001, defaultValue: 0.05, group: 'Appearance & Structure', relevantToGeometries: ['hypersphere'] },
            { name: 'u_tetraThickness', label: 'Tetra Plane Thickness', type: 'slider', min: 0.001, max: 0.15, step: 0.001, defaultValue: 0.02, group: 'Appearance & Structure', relevantToGeometries: ['hypertetrahedron'] },
            { name: 'u_rotationSpeed', label: 'Rotation Speed', type: 'slider', min: 0.0, max: 3.0, step: 0.01, defaultValue: 0.5, group: 'Animation & Morphing' },
            { name: 'u_morphFactor', label: 'Morph Factor', type: 'slider', min: 0.0, max: 1.5, step: 0.01, defaultValue: 0.0, group: 'Animation & Morphing', isAdvanced: true },
            { name: 'u_colorShift', label: 'Color Shift (Hue)', type: 'slider', min: -1.0, max: 1.0, step: 0.01, defaultValue: 0.0, group: 'Visual Effects' },
            { name: 'u_patternIntensity', label: 'Pattern Intensity', type: 'slider', min: 0.1, max: 3.0, step: 0.01, defaultValue: 1.0, group: 'Visual Effects', isAdvanced: true },
            { name: 'u_universeModifier', label: 'Universe Modifier (Scale)', type: 'slider', min: 0.3, max: 2.5, step: 0.01, defaultValue: 1.0, group: 'Visual Effects', isAdvanced: true },
            { name: 'u_glitchIntensity', label: 'Glitch Intensity', type: 'slider', min: 0.0, max: 0.15, step: 0.001, defaultValue: 0.0, group: 'Visual Effects', isAdvanced: true },
            { name: 'u_lightDirection', label: 'Light Direction', type: 'vec3', defaultValue: [0.577, 0.577, 0.577], group: 'Visual Effects', description: "Normalized light direction vector." },
            { name: 'u_specularStrength', label: 'Specular Strength', type: 'slider', min: 0.0, max: 1.0, step: 0.01, defaultValue: 0.5, group: 'Visual Effects', isAdvanced: true },
            { name: 'u_specularColor', label: 'Specular Color', type: 'color', defaultValue: [1.0, 1.0, 1.0], group: 'Visual Effects', isAdvanced: true },
            { name: 'u_materialShininess', label: 'Material Shininess', type: 'slider', min: 1.0, max: 256.0, step: 1.0, defaultValue: 32.0, group: 'Visual Effects', isAdvanced: true },
            { name: 'u_isTorus', label: 'Enable Torus Pattern (Debug)', type: 'toggle', defaultValue: false, group: 'Geometry Specific', relevantToGeometries: ['torus'], isAdvanced: true } // ADDED u_isTorus to schema
        ];
    }

    // ... updateBaseParameter ... (unchanged from its last correct version)
    updateBaseParameter(keyOrParams, value) {
        let changed = false;
        if (typeof keyOrParams === 'string') {
            if (this.baseParameters.hasOwnProperty(keyOrParams) && this.baseParameters[keyOrParams] !== value) {
                this.baseParameters[keyOrParams] = value; changed = true;
            } else if (!this.baseParameters.hasOwnProperty(keyOrParams)) {
                 this.baseParameters[keyOrParams] = value; changed = true;
            }
        } else if (typeof keyOrParams === 'object') {
            for (const key in keyOrParams) {
                if (this.baseParameters.hasOwnProperty(key) && this.baseParameters[key] !== keyOrParams[key]) {
                    this.baseParameters[key] = keyOrParams[key]; changed = true;
                } else if (!this.baseParameters.hasOwnProperty(key)) {
                    this.baseParameters[key] = keyOrParams[key]; changed = true;
                }
            }
        }
        if (changed) {
            this.parameterMapper.setBaseParameters(this.baseParameters);
            const checkKeys = (typeof keyOrParams === 'string') ? [keyOrParams] : Object.keys(keyOrParams);
            if (this.currentProjection && checkKeys.some(k => ['fov', 'near', 'far', 'projectionType'].includes(k))) {
                this.currentProjection.update({
                    aspect: this.baseParameters.u_resolution[0] / this.baseParameters.u_resolution[1],
                    fov: this.baseParameters.fov, near: this.baseParameters.near, far: this.baseParameters.far,
                });
            }
            this.onStateChangeCallback('baseParamsChanged');
        }
    }


    render(timestamp) {
        // ... (delta time, interaction engine, effective params, chromatic engine updates as before) ...
        this.deltaTime = (timestamp - this.lastTimestamp) / 1000.0;
        this.lastTimestamp = timestamp; this.time += this.deltaTime;
        this.interactionEngine.update();
        this.effectiveParameters = this.parameterMapper.getEffectiveParameters();
        this.effectiveParameters.u_time = this.time;
        this.effectiveParameters.u_resolution = this.baseParameters.u_resolution;
        const interactionState = this.interactionEngine.getInteractionState();
        this.effectiveParameters.u_mouse = [interactionState.mouseMovement.normalizedX, interactionState.mouseMovement.normalizedY];
        const currentGeometryName = this.currentGeometry ? this.currentGeometry.constructor.name.toLowerCase().replace('geometry', '') : 'default';
        this.chromaticEngine.update(currentGeometryName, interactionState, this.time);
        const currentColors = this.chromaticEngine.getCurrentColor();
        this.effectiveParameters.u_colorShift = (currentColors.hsl.h / 360.0) * 2.0 - 1.0;
        if (document.documentElement) {
            document.documentElement.style.setProperty('--bg-color-hsl', this.chromaticEngine.getHslCssString(currentColors.bgHsl));
            document.documentElement.style.setProperty('--content-color-hsl', this.chromaticEngine.getHslCssString(currentColors.contentHsl));
            document.documentElement.style.setProperty('--accent-color-hsl', this.chromaticEngine.getHslCssString(currentColors.accentHsl));
        }
        if (this.homeMasterBridge) this.homeMasterBridge.update(this.deltaTime);
        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        if (!this.shaderManager.program) { this.stop(); return; }
        this.shaderManager.useProgram();
        let projMatrix, viewMatrix;
        if (this.currentProjection) {
            this.currentProjection.update({
                aspect: this.effectiveParameters.u_resolution[0] / this.effectiveParameters.u_resolution[1],
                fov: this.baseParameters.fov, near: this.baseParameters.near, far: this.baseParameters.far,
                morphFactor: this.effectiveParameters.u_morphFactor, audioMid: this.effectiveParameters.u_audioMid,
                audioHigh: this.effectiveParameters.u_audioHigh,
                perspectiveBlendFactor: this.currentProjection.parameters.perspectiveBlendFactor
            });
            projMatrix = this.currentProjection.getProjectionMatrix();
            if (typeof this.currentProjection.getViewMatrix === 'function') viewMatrix = this.currentProjection.getViewMatrix();
            else { viewMatrix = mat4.create(); mat4.identity(viewMatrix); }
        } else {
            projMatrix = mat4.create(); mat4.identity(projMatrix);
            viewMatrix = mat4.create(); mat4.identity(viewMatrix);
        }
        for (const key in this.effectiveParameters) {
            if (key.startsWith('u_')) {
                const value = this.effectiveParameters[key];
                if (typeof value === 'number') this.shaderManager.setUniform1f(key, value);
                else if (typeof value === 'boolean') this.shaderManager.setUniform1i(key, value ? 1:0); // Handle boolean for u_isTorus
                else if (Array.isArray(value) && value.length === 2) this.shaderManager.setUniform2fv(key, value);
                else if (Array.isArray(value) && value.length === 3) this.shaderManager.setUniform3fv(key, value);
                else if (Array.isArray(value) && value.length === 4) this.shaderManager.setUniform4fv(key, value);
            }
        }
        this.shaderManager.setUniformMatrix4fv('u_projectionMatrix', projMatrix);
        this.shaderManager.setUniformMatrix4fv('u_modelViewMatrix', viewMatrix);

        if (this.currentGeometry) {
            const posAttribLoc = this.shaderManager.getAttributeLocation('a_position4D');
            const normalAttribLoc = this.shaderManager.getAttributeLocation('a_normal4D');
            const uvAttribLoc = this.shaderManager.getAttributeLocation('a_uv'); // Get UV attribute location

            if (posAttribLoc !== -1 && typeof this.currentGeometry.getVertexPositionsBuffer === 'function') {
                const vbo = this.currentGeometry.getVertexPositionsBuffer(this.gl);
                gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
                gl.vertexAttribPointer(posAttribLoc, 4, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(posAttribLoc);

                if (normalAttribLoc !== -1 && typeof this.currentGeometry.getNormalsBuffer === 'function') {
                    const normalBuffer = this.currentGeometry.getNormalsBuffer(this.gl);
                    if (normalBuffer) {
                        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
                        gl.vertexAttribPointer(normalAttribLoc, 4, gl.FLOAT, false, 0, 0);
                        gl.enableVertexAttribArray(normalAttribLoc);
                    } else { gl.disableVertexAttribArray(normalAttribLoc); }
                } else if (normalAttribLoc !== -1) { gl.disableVertexAttribArray(normalAttribLoc); }

                // UV Attribute Setup
                if (uvAttribLoc !== -1 && typeof this.currentGeometry.getUVBuffer === 'function') {
                   const uvBuffer = this.currentGeometry.getUVBuffer(this.gl);
                   if (uvBuffer) {
                       gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
                       gl.vertexAttribPointer(uvAttribLoc, 2, gl.FLOAT, false, 0, 0); // Assuming 2D UVs
                       gl.enableVertexAttribArray(uvAttribLoc);
                   } else {
                       gl.disableVertexAttribArray(uvAttribLoc);
                   }
                } else if (uvAttribLoc !== -1) {
                    gl.disableVertexAttribArray(uvAttribLoc);
                }

                // ... (draw call logic as before) ...
                if (typeof this.currentGeometry.getEdgeIndices === 'function' && this.currentGeometry.getEdgeIndices().length > 0) {
                    const ibo = this.currentGeometry.getIndexBuffer(this.gl);
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
                    gl.drawElements(gl.LINES, this.currentGeometry.getEdgeIndices().length, gl.UNSIGNED_SHORT, 0);
                } else if (this.currentGeometry.constructor.name === "FractalGeometry" || this.currentGeometry.constructor.name === "WaveGeometry" ) {
                    const numPoints = this.currentGeometry.getVertices().length / 4;
                    gl.drawArrays(gl.POINTS, 0, numPoints);
                } else if (typeof this.currentGeometry.getIndices === 'function' && this.currentGeometry.getIndices().length > 0) {
                    const ibo = this.currentGeometry.getIndexBuffer(this.gl);
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
                    gl.drawElements(gl.TRIANGLES, this.currentGeometry.getIndices().length, gl.UNSIGNED_SHORT, 0);
                } else {
                    const numVertices = this.currentGeometry.getVertices().length / 4;
                    gl.drawArrays(gl.POINTS, 0, numVertices);
                }
            } else { if (this.isPlaceholderRenderNeeded()) this.drawPlaceholder(); }
        } else { if (this.isPlaceholderRenderNeeded()) this.drawPlaceholder(); }
        this.animationFrameId = requestAnimationFrame(this.render.bind(this));
    }

    // ... isPlaceholderRenderNeeded, drawPlaceholder, start, stop, destroy ... (mostly unchanged)
    isPlaceholderRenderNeeded() { return !this.currentGeometry || typeof this.currentGeometry.getVertexPositionsBuffer !== 'function'; }
    drawPlaceholder() {
        const gl = this.gl; const positionAttribLocation = this.shaderManager.getAttributeLocation('a_position4D');
        if (positionAttribLocation === -1) return;
        const placeholderVertices = new Float32Array([0.0,0.1,0.0,1.0, -0.1,-0.1,0.0,1.0, 0.1,-0.1,0.0,1.0, 0.0,0.0,0.1,1.0 ]);
        const placeholderBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, placeholderBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, placeholderVertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(positionAttribLocation, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionAttribLocation);
        gl.drawArrays(gl.POINTS, 0, 4);
        gl.deleteBuffer(placeholderBuffer);
    }
    start() { if (!this.animationFrameId) { this.lastTimestamp = performance.now(); this.animationFrameId = requestAnimationFrame(this.render.bind(this)); } }
    stop() { if (this.animationFrameId) { cancelAnimationFrame(this.animationFrameId); this.animationFrameId = null; } }
    destroy() {
        this.stop();
        if (this.shaderManager) this.shaderManager.destroy();
        window.removeEventListener('resize', this.onResize.bind(this));
        if(this.interactionEngine) this.interactionEngine.destroy();
        console.log("HypercubeCore: Destroyed.");
    }

    getDefaultVertexShader() {
        // Includes a_uv attribute and v_uv varying
        return `
            precision mediump float;
            attribute vec4 a_position4D; attribute vec4 a_normal4D; attribute vec2 a_uv;
            uniform mat4 u_modelViewMatrix; uniform mat4 u_projectionMatrix;
            uniform float u_time; uniform vec2 u_resolution; uniform float u_dimension;
            uniform float u_morphFactor; uniform float u_lineThickness;
            uniform int u_4D_projection_type; uniform float u_stereo_R; uniform float u_stereo_pole_sign;
            varying vec4 v_position4D_world; varying vec3 v_position3D_projected_raw;
            varying float v_w_component_original; varying vec3 v_normal_viewspace;
            varying vec3 v_position_viewspace; varying vec2 v_uv;
            void main() {
                vec4 P = a_position4D; vec4 N_4D = a_normal4D;
                v_position4D_world = P; v_w_component_original = P.w; v_uv = a_uv;
                vec3 pos3D_intermediate;
                if (u_4D_projection_type == 1) {
                    float stereo_denominator = u_stereo_R - (u_stereo_pole_sign * P.w);
                    if (abs(stereo_denominator) < 0.0001) stereo_denominator = sign(stereo_denominator) * 0.0001;
                    float R_safe = max(u_stereo_R, 0.001);
                    pos3D_intermediate = P.xyz * R_safe / stereo_denominator;
                } else if (u_4D_projection_type == 2) {
                    pos3D_intermediate = P.xyz / max(u_dimension, 0.001);
                } else {
                    float w_divisor = (P.w / max(u_dimension, 0.001)) + 1.0;
                    if (abs(w_divisor) < 0.0001) w_divisor = sign(w_divisor) * 0.0001;
                    pos3D_intermediate = P.xyz / w_divisor;
                }
                v_position3D_projected_raw = pos3D_intermediate;
                vec4 position_view = u_modelViewMatrix * vec4(pos3D_intermediate, 1.0);
                v_position_viewspace = position_view.xyz;
                gl_Position = u_projectionMatrix * position_view;
                // Extract 3x3 from 4x4 matrix manually
                mat3 modelView3x3 = mat3(
                    u_modelViewMatrix[0].xyz,
                    u_modelViewMatrix[1].xyz,
                    u_modelViewMatrix[2].xyz
                );
                // Simple normal transformation without inverse/transpose for now
                v_normal_viewspace = normalize(modelView3x3 * normalize(N_4D.xyz));
                float basePointSize = u_lineThickness * 500.0;
                float w_clip = max(gl_Position.w, 0.1);
                gl_PointSize = clamp(basePointSize / w_clip, 1.0, 50.0);
            }
        `;
    }

    getDefaultFragmentShader() {
        // Includes u_isTorus uniform and v_uv varying, and uses them for a pattern
        return `
            precision mediump float;
            uniform float u_time; uniform vec2 u_resolution; uniform vec2 u_mouse;
            uniform float u_dimension; uniform float u_patternIntensity; uniform float u_colorShift;
            uniform float u_morphFactor; uniform float u_glitchIntensity; uniform float u_gridDensity;
            uniform vec3 u_lightDirection;
            uniform float u_specularStrength; uniform vec3 u_specularColor; uniform float u_materialShininess;
            uniform bool u_isTorus; // ADDED
            varying vec4 v_position4D_world; varying vec3 v_position3D_projected_raw;
            varying float v_w_component_original; varying vec3 v_normal_viewspace;
            varying vec3 v_position_viewspace; varying vec2 v_uv; // ADDED
            vec3 hsl2rgb(vec3 c) {
                vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0);
                return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
            }
            void main() {
                vec3 baseColor;
                vec4 normPos4D = normalize(v_position4D_world);
                float hue = mod((normPos4D.x-normPos4D.y+normPos4D.z-normPos4D.w)*0.15+u_time*0.03,1.0);
                hue = mod(hue + u_colorShift, 1.0);
                float saturation = clamp(0.7 + normPos4D.w*0.3,0.5,1.0);
                float w_depth_factor = clamp(1.0-abs(v_w_component_original)/(max(u_dimension,0.001)*1.5),0.2,1.0);
                float luminance = clamp(0.25+w_depth_factor*0.6+u_morphFactor*0.05,0.15,0.85);
                luminance = pow(luminance,1.0/clamp(u_patternIntensity,0.1,3.0));
                baseColor = hsl2rgb(vec3(hue,saturation,luminance));
                vec3 normal_view = normalize(v_normal_viewspace);
                vec3 lightDir_viewspace = normalize(u_lightDirection);
                vec3 ambientColor = baseColor * 0.2;
                float diffuseIntensity = max(0.0, dot(normal_view, lightDir_viewspace));
                vec3 diffuseColor = baseColor * diffuseIntensity;
                vec3 viewDir_viewspace = normalize(-v_position_viewspace);
                vec3 reflectDir_viewspace = reflect(-lightDir_viewspace, normal_view);
                float specAngle = max(dot(viewDir_viewspace, reflectDir_viewspace), 0.0);
                float specularIntensity = pow(specAngle, u_materialShininess);
                vec3 specularComponent = u_specularColor * u_specularStrength * specularIntensity;
                vec3 litColor = ambientColor + diffuseColor + specularComponent;

                if (u_isTorus) {
                    float stripe_frequency = u_gridDensity * 0.5; // Adjusted for potentially better visual
                    float pattern = smoothstep(0.45, 0.55, abs(sin(v_uv.x * stripe_frequency * 3.14159 + v_uv.y * stripe_frequency * 1.57079)));
                    vec3 stripeColor = hsl2rgb(vec3(mod(hue + 0.2, 1.0), saturation, clamp(luminance * 0.6, 0.05, 0.6)));
                    litColor = mix(stripeColor, litColor, pattern);
                }

                float alpha = clamp(1.0 - gl_FragCoord.z*0.7, 0.2, 1.0);
                vec3 finalColor = litColor;
                if (u_glitchIntensity > 0.0) {
                    float glitchRand = fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233))+u_time*5.0)*43758.5453);
                    if (glitchRand < u_glitchIntensity) {
                        finalColor.rgb = finalColor.grb;
                        finalColor.r *= (1.0+sin(u_time*10.0+v_position4D_world.x*5.0)*0.5);
                    }
                    if (glitchRand < u_glitchIntensity*0.3) {
                         finalColor *= (1.0-glitchRand*3.0);
                         alpha *= (glitchRand > 0.1 ? 0.5 : 1.0) ;
                    }
                }
                gl_FragColor = vec4(finalColor, alpha);
            }
        `;
    }
}

// Mock dependencies (ensure PresetManager and VIB3_PRESETS_EXPANDED are mocked correctly if presets.js isn't loaded first)
if (typeof ShaderManager === 'undefined') { global.ShaderManager = class { constructor(gl) {this.gl = gl;} createProgram(vs, fs) {return true;} useProgram(){} getUniformLocation(name){return null;} getAttributeLocation(name){return -1;} setUniformMatrix4fv(){} setUniform1f(){} setUniform2fv(){} setUniform3fv(){} setUniform4fv(){} destroy(){} }; }
if (typeof GeometryManager === 'undefined') { global.GeometryManager = class { constructor(){} createGeometryInstance(name, params){return null;} }; }
if (typeof ProjectionManager === 'undefined') { global.ProjectionManager = class { constructor(){} createProjectionInstance(name, params){return null;} }; }
if (typeof VIB34DInteractionEngine === 'undefined') { global.VIB34DInteractionEngine = class { constructor(canvas){} getInteractionState(){ return { mouseMovement: { normalizedX:0, normalizedY:0}, audioBass:0, audioMid:0, audioHigh:0, idle:{decayFactor:1}, scroll:{intensity:0}, pattern:{type:'casual'}, clickHold:{intensity:0} }; } update(){} destroy(){} }; }
if (typeof ParameterMappingSystem === 'undefined') { global.ParameterMappingSystem = class { constructor(baseParams, interactionEng){this.baseParameters = baseParams;} setBaseParameters(p){this.baseParameters=p;} getEffectiveParameters(){ return this.baseParameters || {}; } update(){} }; }
if (typeof VIB34DChromaticEngine === 'undefined') { global.VIB34DChromaticEngine = class { constructor(){} update(geom, interact, time){} getCurrentColor(){ return {hsl:{h:0,s:0,l:0}, bgHsl:{h:0,s:0,l:0}, contentHsl:{h:0,s:0,l:0}, accentHsl:{h:0,s:0,l:0}}; } getHslCssString(c){return "";} }; }
if (typeof VIB3HomeMasterBridge === 'undefined') { global.VIB3HomeMasterBridge = class { constructor(hcCore){} navigateToFace(faceId){} update(deltaTime){} }; }
if (typeof PresetManager === 'undefined') { global.PresetManager = class { constructor(core, presets){} loadUserPresetsFromLocalStorage(){} getAllPresetNames(){return [];} loadPresetByName(name){} saveCurrentSettingsAsUserPreset(name){} exportUserPresetsToString(){} importUserPresetsFromString(json){} }; }
if (typeof VIB3_PRESETS_EXPANDED === 'undefined') { global.VIB3_PRESETS_EXPANDED = []; }
// The mat4 mock previously here has been removed.
// Ensure gl-matrix.js is loaded via <script> tag in HTML before this file.
// Then, access mat4 via `glMatrix.mat4` (or destructure: `const { mat4 } = glMatrix;`).

/* HTML and script loader comments remain the same */
/* ... */
