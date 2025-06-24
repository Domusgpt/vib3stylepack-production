/**
 * HypercubeCore: Central coordination class for the 4D visualization.
 *
 * This class is responsible for initializing and managing the main components:
 * - WebGL context and canvas setup
 * - ShaderManager for shader program compilation and uniform management
 * - GeometryManager for handling different 4D geometries
 * - ProjectionManager for handling different projection methods
 * - Main render loop and animation timing
 * - Passing data between managers (e.g., geometry to projection, projection to shaders)
 */
class HypercubeCore {
    /**
     * @param {HTMLCanvasElement} canvas - The HTML canvas element to render into.
     * @param {object} [options={}] - Optional configuration for HypercubeCore.
     * @param {string} [options.vertexShaderSource=""] - Default vertex shader source.
     * @param {string} [options.fragmentShaderSource=""] - Default fragment shader source.
     */
    constructor(canvas, options = {}) {
        if (!canvas) {
            throw new Error("HypercubeCore: Canvas element is required.");
        }
        this.canvas = canvas;
        this.gl = this.initWebGL(canvas);

        if (!this.gl) {
            throw new Error("HypercubeCore: WebGL initialization failed. Your browser might not support it.");
        }

        this.shaderManager = new ShaderManager(this.gl);
        this.geometryManager = new GeometryManager();
        this.projectionManager = new ProjectionManager();

        // Interaction System
        this.interactionEngine = new VIB34DInteractionEngine(this.canvas);
        // Initialize baseParameters for ParameterMappingSystem. These are the defaults or UI-set values.
        // HypercubeCore.parameters will now store these "base" values.
        this.baseParameters = {
            // Core Math & Timing (some are controlled by HypercubeCore directly, others can be base values)
            u_resolution: [this.canvas.width, this.canvas.height], // Directly managed
            u_time: 0.0, // Directly managed
            u_mouse: [0.0, 0.0], // Directly managed by HypercubeCore from interactionEngine
            u_dimension: 4.0,

            // Grid & Lattice
            u_gridDensity: 10.0,
            u_lineThickness: 0.01,
            u_universeModifier: 1.0,
            u_patternIntensity: 1.0,

            // Morphing & Animation
            u_morphFactor: 0.0,
            u_rotationSpeed: 0.5,

            // Geometry-Specific
            u_shellWidth: 0.05,
            u_tetraThickness: 0.02,
            u_glitchIntensity: 0.0,

            // Color & Effects
            u_colorShift: 0.0,

            // Interaction Reactivity (these will be overwritten by interaction engine's direct output)
            u_audioBass: 0.0,
            u_audioMid: 0.0,
            u_audioHigh: 0.0,

            // Projection specific (can also be base values)
            fov: Math.PI / 4,
            near: 0.1,
            far: 100.0,
            projectionType: 'perspective',
        };
        this.parameterMapper = new ParameterMappingSystem(this.baseParameters, this.interactionEngine);
        this.effectiveParameters = { ...this.baseParameters }; // Will hold modulated values

        this.chromaticEngine = new VIB34DChromaticEngine();
        this.homeMasterBridge = new VIB3HomeMasterBridge(this);

        // Preset and Dashboard Support
        // Assumes VIB3_PRESETS_EXPANDED and PresetManager are globally available or imported
        this.presetManager = new PresetManager(this, typeof VIB3_PRESETS_EXPANDED !== 'undefined' ? VIB3_PRESETS_EXPANDED : []);
        this.presetManager.loadUserPresetsFromLocalStorage(); // Load user presets

        this.availableGeometries = ['hypercube', 'hypersphere', 'hypertetrahedron', 'torus', 'kleinbottle', 'fractal', 'wave', 'crystal'];
        this.availableProjections = ['perspective', 'orthographic', 'stereographic'];

        this.currentGeometry = null;
        this.currentProjection = null;

        this.animationFrameId = null;
        this.lastTimestamp = 0;
        this.deltaTime = 0;
        this.time = 0; // Total elapsed time for animations

        // Note: this.parameters from the original code is now this.baseParameters.
        // Shader uniforms will be sourced from this.effectiveParameters.

        this.defaultVertexShader = options.vertexShaderSource || this.getDefaultVertexShader();
        this.defaultFragmentShader = options.fragmentShaderSource || this.getDefaultFragmentShader();

        this.init();
    }

    /**
     * Initializes WebGL context.
     * @param {HTMLCanvasElement} canvas
     * @returns {WebGLRenderingContext | null}
     */
    initWebGL(canvas) {
        let gl = null;
        try {
            gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
            if (!gl) return null;
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            // Enable alpha blending for transparency if needed
            // gl.enable(gl.BLEND);
            // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        } catch (e) {
            console.error("HypercubeCore: Error initializing WebGL context.", e);
        }
        return gl;
    }

    /**
     * Initializes shaders, managers, and default geometry/projection.
     */
    init() {
        if (!this.shaderManager.createProgram(this.defaultVertexShader, this.defaultFragmentShader)) {
            console.error("HypercubeCore: Failed to create shader program. Further initialization aborted.");
            return;
        }
        this.shaderManager.useProgram();

        // Example: Register and set a default geometry and projection
        // These would typically be registered from outside or through a config
        // For now, let's assume placeholder BaseGeometry/Projection can be "instantiated" for structure
        // if (typeof HypercubeGeometry !== 'undefined') { // Check if specific geometries are loaded
        //     this.geometryManager.registerGeometry('hypercube', HypercubeGeometry);
        //     this.setGeometry('hypercube');
        // } else {
        //     console.warn("HypercubeCore: HypercubeGeometry not defined. Placeholder will be used if set.");
        // }

        // if (typeof PerspectiveProjection !== 'undefined') {
        //     this.projectionManager.registerProjection('perspective', PerspectiveProjection);
        //     this.setProjection('perspective');
        // } else {
        //     console.warn("HypercubeCore: PerspectiveProjection not defined. Placeholder will be used if set.");
        // }

        this.setupEventListeners();
    }

    /**
     * Sets up event listeners for canvas resize and mouse movement.
     */
    setupEventListeners() {
        // Canvas resize
        window.addEventListener('resize', this.onResize.bind(this), false);
        this.onResize(); // Initial call to set size

        // Mouse movement listener in HypercubeCore is now handled by VIB34DInteractionEngine.
        // this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this), false);
    }

    onResize() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        // Update base resolution; effectiveParameters will pick this up or it's set directly.
        this.baseParameters.u_resolution = [this.canvas.width, this.canvas.height];
        if (this.effectiveParameters) { // Ensure effectiveParameters exists
             this.effectiveParameters.u_resolution = [this.canvas.width, this.canvas.height];
        }


        if (this.currentProjection && typeof this.currentProjection.update === 'function') {
            // Projection update should use current effective aspect if available, or base
            const aspectToUse = this.effectiveParameters ? (this.effectiveParameters.u_resolution[0] / this.effectiveParameters.u_resolution[1]) : (this.baseParameters.u_resolution[0] / this.baseParameters.u_resolution[1]);
            this.currentProjection.update({
                aspect: aspectToUse,
                fov: this.baseParameters.fov,
                near: this.baseParameters.near,
                far: this.baseParameters.far,
                // Pass other relevant params from baseParameters or effectiveParameters as needed by projection
                morphFactor: this.effectiveParameters ? this.effectiveParameters.u_morphFactor : this.baseParameters.u_morphFactor,
                audioMid: this.effectiveParameters ? this.effectiveParameters.u_audioMid : this.baseParameters.u_audioMid,
                audioHigh: this.effectiveParameters ? this.effectiveParameters.u_audioHigh : this.baseParameters.u_audioHigh,
            });
        }
        console.log(`HypercubeCore: Canvas resized to ${this.canvas.width}x${this.canvas.height}`);
    }

    // onMouseMove is now handled by VIB34DInteractionEngine.
    // HypercubeCore will get normalized mouse coords from interactionEngine.getInteractionState().mouseMovement.

    /**
     * Sets the active geometry.
     * @param {string} name - The registered name of the geometry.
     * @param {object} [initialParams={}] - Initial parameters for the geometry.
     */
    setGeometry(name, initialParams = {}) {
        // Ensure geometries are registered before trying to set them.
        // This would typically happen in an init phase or via dashboard setup.
        // For now, assume they are registered if HypercubeGeometry etc. are defined.
        if (this.geometryManager.getGeometryClass(name) || (typeof window[name.charAt(0).toUpperCase() + name.slice(1) + 'Geometry'] !== 'undefined')) {
            // If not registered, try to register it assuming global class definition
            if (!this.geometryManager.getGeometryClass(name)) {
                 try {
                    const GeomClass = window[name.charAt(0).toUpperCase() + name.slice(1) + 'Geometry'];
                    if (GeomClass) this.geometryManager.registerGeometry(name, GeomClass);
                 } catch (e) { /* ignore if class not found */ }
            }
        }


        const geometryInstance = this.geometryManager.createGeometryInstance(name, initialParams);
        if (geometryInstance) {
            // Destroy previous geometry's WebGL resources if any
            if (this.currentGeometry && typeof this.currentGeometry.destroy === 'function') {
                this.currentGeometry.destroy(this.gl);
            }
            this.currentGeometry = geometryInstance;
            console.log(`HypercubeCore: Set active geometry to "${name}".`);
            // Dashboard might want to know the current geometry name
            if (this.baseParameters) this.baseParameters.geometryName = name;
            if (this.effectiveParameters) this.effectiveParameters.geometryName = name;

        } else {
            console.error(`HypercubeCore: Failed to set geometry "${name}". Not registered or error in creation.`);
        }
    }

    /**
     * Sets the active projection.
     * @param {string} name - The registered name of the projection.
     * @param {object} [initialParams={}] - Initial parameters for the projection.
     */
    setProjection(name, initialParams = {}) {
        const currentAspect = this.baseParameters.u_resolution[0] / this.baseParameters.u_resolution[1];
        const paramsForProjection = {
            aspect: currentAspect,
            fov: this.baseParameters.fov, // Base FOV
            near: this.baseParameters.near, // Base near
            far: this.baseParameters.far,   // Base far
            // Pass relevant interaction values if projection uses them directly for its setup
            morphFactor: this.effectiveParameters.u_morphFactor,
            audioMid: this.effectiveParameters.u_audioMid,
            audioHigh: this.effectiveParameters.u_audioHigh,
            // Pass other initialParams specific to this projection type
            ...initialParams
        };

        const projectionInstance = this.projectionManager.createProjectionInstance(name, paramsForProjection);
        if (projectionInstance) {
            this.currentProjection = projectionInstance;
            this.baseParameters.projectionType = name; // Store current projection type in base
            if (this.effectiveParameters) this.effectiveParameters.projectionType = name;
            console.log(`HypercubeCore: Set active projection to "${name}".`);
        } else {
            console.error(`HypercubeCore: Failed to set projection "${name}". Not registered or error in creation.`);
        }
    }

    // Dashboard Support Methods

    /**
     * Returns a list of available geometry names.
     * Used by the dashboard to populate selection UI.
     * @returns {Array<string>}
     */
    getAvailableGeometries() {
        // Could also get from geometryManager.listGeometries() if they are pre-registered.
        return this.availableGeometries;
    }

    /**
     * Returns a list of available projection names.
     * Used by the dashboard to populate selection UI.
     * @returns {Array<string>}
     */
    getAvailableProjections() {
        // Could also get from projectionManager.listProjections() if they are pre-registered
        return this.projectionManager.listProjections().length > 0 ? this.projectionManager.listProjections() : this.availableProjections;
    }

    /**
     * Returns the current base parameters.
     * Used by the dashboard to display current static settings.
     * @returns {object}
     */
    getBaseParameters() {
        return { ...this.baseParameters };
    }

    /**
     * Returns the current effective parameters (after interaction modulation).
     * Used by the dashboard for real-time value display.
     * @returns {object}
     */
    getEffectiveParametersForDashboard() {
        // We need to ensure effectiveParameters is up-to-date if called externally
        if (this.parameterMapper && this.interactionEngine) {
            this.interactionEngine.update(); // Ensure interaction state is fresh
            return this.parameterMapper.getEffectiveParameters();
        }
        return { ...this.effectiveParameters }; // Fallback or initial state
    }

    /**
     * Loads a preset object, updating base parameters and active geometry/projection.
     * This method is typically called by PresetManager.
     * @param {object} preset - A preset object.
     *                          Example: { name: "My Preset", geometry: 'hypercube', projection: 'perspective', params: { u_gridDensity: 15, ... } }
     */
    loadPreset(preset) {
        if (!preset || !preset.params) {
            console.error("HypercubeCore: Invalid preset object passed to loadPreset.", preset);
            return;
        }
        console.log(`HypercubeCore: Loading preset "${preset.name || 'Unnamed Preset'}"...`);

        if (preset.geometry) {
            this.setGeometry(preset.geometry, preset.geometryParams || {});
        }
        if (preset.projection) {
            this.setProjection(preset.projection, preset.projectionParams || {});
        }

        // Important: Create a new object for base parameters to avoid modifying the preset object itself.
        // Only update parameters that are defined in the preset's `params`.
        const newBaseParams = { ...this.baseParameters }; // Start with current base
        for (const key in preset.params) {
            if (this.baseParameters.hasOwnProperty(key)) { // Only update known base parameters
                newBaseParams[key] = preset.params[key];
            }
        }
        this.updateBaseParameter(newBaseParams); // This will update baseParameters and notify ParameterMapper

        console.log("HypercubeCore: Loaded preset.", preset);
    }

    /**
     * Returns the current settings as a preset object.
     * @returns {object}
     */
    getCurrentSettingsAsPreset() {
        const currentGeomName = this.currentGeometry ?
            (this.currentGeometry.constructor.name.toLowerCase().replace('geometry', '')) :
            (this.baseParameters.geometryName || 'default');

        // Create a clean params object, excluding non-serializable or irrelevant stuff
        const exportableBaseParams = { ...this.baseParameters };
        delete exportableBaseParams.u_resolution; // Usually not part of a preset content
        delete exportableBaseParams.u_time;       // Runtime value
        delete exportableBaseParams.u_mouse;      // Runtime value
        // geometryName and projectionType are stored at top level of preset.
        delete exportableBaseParams.geometryName;
        // delete exportableBaseParams.projectionType; // projectionType is good to keep in params for consistency.


        return {
            // name: "Unnamed Preset", // Name should be assigned when saving via PresetManager
            geometry: currentGeomName,
            projection: this.baseParameters.projectionType || 'perspective',
            // geometryParams: this.currentGeometry && this.currentGeometry.parameters ? { ...this.currentGeometry.parameters } : {},
            // projectionParams: this.currentProjection && this.currentProjection.parameters ? { ...this.currentProjection.parameters } : {},
            params: exportableBaseParams
        };
    }
    // End Dashboard Support Methods


    /**
     * Updates a specific base parameter or a set of base parameters.
     * These are the static values before interaction modulation.
     * @param {string | object} keyOrParams - The base parameter key or an object of base parameters.
     * @param {any} [value] - The value if keyOrParams is a string.
     */
    updateBaseParameter(keyOrParams, value) {
        let changed = false;
        if (typeof keyOrParams === 'string') {
            if (this.baseParameters.hasOwnProperty(keyOrParams) && this.baseParameters[keyOrParams] !== value) {
                this.baseParameters[keyOrParams] = value;
                changed = true;
            } else if (!this.baseParameters.hasOwnProperty(keyOrParams)) {
                 this.baseParameters[keyOrParams] = value; // Allow adding new base params
                 changed = true;
            }
        } else if (typeof keyOrParams === 'object') {
            for (const key in keyOrParams) {
                if (this.baseParameters.hasOwnProperty(key) && this.baseParameters[key] !== keyOrParams[key]) {
                    this.baseParameters[key] = keyOrParams[key];
                    changed = true;
                } else if (!this.baseParameters.hasOwnProperty(key)) {
                    this.baseParameters[key] = keyOrParams[key];
                    changed = true;
                }
            }
        }

        if (changed) {
            // Inform ParameterMappingSystem about the change in base parameters
            this.parameterMapper.setBaseParameters(this.baseParameters);

            // If projection-specific base parameters were updated, update the projection
            const checkKeys = (typeof keyOrParams === 'string') ? [keyOrParams] : Object.keys(keyOrParams);
            if (this.currentProjection &&
                checkKeys.some(k => ['fov', 'near', 'far', 'projectionType'].includes(k))) {
                this.currentProjection.update({
                    aspect: this.baseParameters.u_resolution[0] / this.baseParameters.u_resolution[1],
                    fov: this.baseParameters.fov,
                    near: this.baseParameters.near,
                    far: this.baseParameters.far,
                    // Pass other relevant params
                });
            }
        }
    }

    /**
     * Main render loop.
     * @param {DOMHighResTimeStamp} timestamp - Current time from requestAnimationFrame.
     */
    render(timestamp) {
        this.deltaTime = (timestamp - this.lastTimestamp) / 1000.0; // Delta time in seconds
        this.lastTimestamp = timestamp;
        this.time += this.deltaTime; // Total elapsed time for u_time

        // Update interaction engine (e.g., for idle decay, continuous states)
        this.interactionEngine.update();

        // Get modulated parameters from the mapping system
        this.effectiveParameters = this.parameterMapper.getEffectiveParameters();

        // Ensure core dynamic parameters are correctly set in effectiveParameters
        this.effectiveParameters.u_time = this.time;
        this.effectiveParameters.u_resolution = this.baseParameters.u_resolution; // Comes from onResize
        const interactionState = this.interactionEngine.getInteractionState();
        this.effectiveParameters.u_mouse = [
            interactionState.mouseMovement.normalizedX,
            interactionState.mouseMovement.normalizedY
        ];
        // u_audioBass, Mid, High are already set by parameterMapper based on interactionEngine state.

        // Update Chromatic Engine
        const currentGeometryName = this.currentGeometry ? this.currentGeometry.constructor.name.toLowerCase().replace('geometry', '') : 'default';
        this.chromaticEngine.update(currentGeometryName, interactionState, this.time);
        const currentColors = this.chromaticEngine.getCurrentColor();

        // Update a color uniform based on chromatic engine output
        // e.g., map HSL to a color shift or a base color vector
        // For u_colorShift (-1 to 1 for hue): map currentColors.hsl.h (0-360)
        this.effectiveParameters.u_colorShift = (currentColors.hsl.h / 360.0) * 2.0 - 1.0;
        // Or, if shaders were to take a vec3 u_baseColorHSL:
        // this.effectiveParameters.u_baseColorHSL = [currentColors.hsl.h / 360.0, currentColors.hsl.s / 100.0, currentColors.hsl.l / 100.0];

        // Update CSS Custom Properties for blend modes
        if (document.documentElement) {
            document.documentElement.style.setProperty('--bg-color-hsl', this.chromaticEngine.getHslCssString(currentColors.bgHsl));
            document.documentElement.style.setProperty('--content-color-hsl', this.chromaticEngine.getHslCssString(currentColors.contentHsl));
            document.documentElement.style.setProperty('--accent-color-hsl', this.chromaticEngine.getHslCssString(currentColors.accentHsl));
        }

        // Apply changes from HomeMasterBridge (e.g., geometry/theme changes)
        if (this.homeMasterBridge) {
            this.homeMasterBridge.update(this.deltaTime); // Pass deltaTime for smooth transitions
            // Conceptual calls for other bridge functionalities:
            // this.homeMasterBridge.syncParametersToHomeMaster(this.effectiveParameters);
            // this.homeMasterBridge.registerInteractionWithHomeMaster(interactionState);
            // this.homeMasterBridge.performReactivityBridgeSync();
        }


        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if (!this.shaderManager.program) {
            console.error("HypercubeCore: No shader program available for rendering.");
            this.stop();
            return;
        }
        this.shaderManager.useProgram();

        // **Pipeline Integration Points**

        // 1. GeometryManager -> ProjectionManager (Data Flow - Conceptual)
        // Geometry data (vertices, etc.) is prepared by currentGeometry.
        // This data would be used by the projection system, often via a model-view matrix
        // that positions/orients the geometry before projection.

        // 2. ProjectionManager -> HypercubeCore (Parameter Passing)
        // Projection matrix is obtained from currentProjection.
        let projMatrix, viewMatrix;
        if (this.currentProjection) {
            // Update projection with effective parameters that might influence it (e.g. morphFactor for perspective)
            this.currentProjection.update({
                aspect: this.effectiveParameters.u_resolution[0] / this.effectiveParameters.u_resolution[1],
                fov: this.baseParameters.fov, // Base FOV, or could be effective if mapped
                near: this.baseParameters.near,
                far: this.baseParameters.far,
                // Pass relevant effective parameters
                morphFactor: this.effectiveParameters.u_morphFactor,
                audioMid: this.effectiveParameters.u_audioMid,
                audioHigh: this.effectiveParameters.u_audioHigh,
                // Projection specific params from its own parameter store if not in HypercubeCore's main list
                // e.g. for Orthographic blending:
                perspectiveBlendFactor: this.currentProjection.parameters.perspectiveBlendFactor // Assuming projection instance holds this
            });
            projMatrix = this.currentProjection.getProjectionMatrix();
            if (typeof this.currentProjection.getViewMatrix === 'function') {
                viewMatrix = this.currentProjection.getViewMatrix();
            } else {
                viewMatrix = mat4.create(); // Identity view matrix if projection doesn't provide one
                mat4.identity(viewMatrix);
            }
        } else {
            projMatrix = mat4.create(); mat4.identity(projMatrix);
            viewMatrix = mat4.create(); mat4.identity(viewMatrix);
        }

        // 3. HypercubeCore -> ShaderManager (Uniform Updates using effectiveParameters)
        for (const key in this.effectiveParameters) {
            if (key.startsWith('u_')) { // Convention: only pass parameters prefixed with u_
                const value = this.effectiveParameters[key];
                // Determine uniform type based on value or a predefined schema (simplified here)
                if (typeof value === 'number') {
                    this.shaderManager.setUniform1f(key, value);
                } else if (Array.isArray(value) && value.length === 2) {
                    this.shaderManager.setUniform2fv(key, value);
                } else if (Array.isArray(value) && value.length === 3) {
                    this.shaderManager.setUniform3fv(key, value);
                } else if (Array.isArray(value) && value.length === 4) { // Could be vec4 or mat2
                    // Assuming vec4 for simplicity here. Add mat2 handling if needed.
                    this.shaderManager.setUniform4fv(key, value);
                } else if (Array.isArray(value) && value.length === 16) { // mat4
                    // This is generic; specific matrix uniforms are set below.
                    // this.shaderManager.setUniformMatrix4fv(key, value);
                }
                // Add more type checks as needed (e.g., for integers, booleans, other vector/matrix sizes)
            }
        }

        // Set specific matrix uniforms
        this.shaderManager.setUniformMatrix4fv('u_projectionMatrix', projMatrix);
        this.shaderManager.setUniformMatrix4fv('u_modelViewMatrix', viewMatrix); // Using projection's view matrix

        // Note: A separate model matrix for the geometry itself could be introduced here too.
        // const geometryModelMatrix = mat4.create(); /* transform for currentGeometry */
        // this.shaderManager.setUniformMatrix4fv('u_geometryModelMatrix', geometryModelMatrix);


        // 4. ShaderManager -> GPU (Automatic Uniform Sync)
        // This is handled internally by ShaderManager when setUniform* methods are called.

        // Drawing the geometry
        if (this.currentGeometry) {
            // The geometry itself needs to set up its vertex buffers and draw.
            // This part will be more fleshed out when specific geometries are implemented.
            // For now, let's assume a generic draw call if the geometry provides necessary info.

            // A. Get attribute locations (should be done once after program linking, or cached by ShaderManager)
            const positionAttribLocation = this.shaderManager.getAttributeLocation('a_position'); // Example attribute name
            // const normalAttribLocation = this.shaderManager.getAttributeLocation('a_normal');
            // const uvAttribLocation = this.shaderManager.getAttributeLocation('a_texCoord');

            if (positionAttribLocation !== -1 && typeof this.currentGeometry.getVertexPositionsBuffer === 'function') {
                 // B. Bind Buffer for vertex positions
                // const vbo = this.currentGeometry.getVertexPositionsBuffer(this.gl); // Geometry needs to manage its VBOs
                // gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
                // gl.vertexAttribPointer(positionAttribLocation, 3, gl.FLOAT, false, 0, 0); // numComponents, type, normalize, stride, offset
                // gl.enableVertexAttribArray(positionAttribLocation);

                // C. Bind Index Buffer (if using indexed drawing)
                // if (typeof this.currentGeometry.getIndexBuffer === 'function') {
                //    const ibo = this.currentGeometry.getIndexBuffer(this.gl);
                //    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
                //    gl.drawElements(gl.TRIANGLES, this.currentGeometry.getIndices().length, gl.UNSIGNED_SHORT, 0);
                // } else {
                //    gl.drawArrays(gl.TRIANGLES, 0, this.currentGeometry.getVertices().length / 3); // Assuming 3 components per vertex
                // }
            } else {
                // Fallback or placeholder draw if geometry/attributes not fully set up
                // For example, draw a single point or a small triangle if nothing else is ready
                // This is useful for verifying the pipeline is running.
                 if (this.isPlaceholderRenderNeeded()) {
                    this.drawPlaceholder();
                 }
            }
        } else {
            if (this.isPlaceholderRenderNeeded()) {
                this.drawPlaceholder();
            }
        }

        this.animationFrameId = requestAnimationFrame(this.render.bind(this));
    }

    isPlaceholderRenderNeeded() {
        // Only draw placeholder if no geometry or if geometry is missing draw capabilities
        return !this.currentGeometry || typeof this.currentGeometry.getVertexPositionsBuffer !== 'function';
    }

    drawPlaceholder() {
        // Simple placeholder: draws a small triangle if no geometry is active
        // This helps verify the render loop and shaders are working at a basic level.
        const gl = this.gl;
        const positionAttribLocation = this.shaderManager.getAttributeLocation('a_position');
        if (positionAttribLocation === -1) return;

        const placeholderVertices = new Float32Array([
             0.0,  0.1,  0.0,
            -0.1, -0.1,  0.0,
             0.1, -0.1,  0.0
        ]);
        const placeholderBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, placeholderBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, placeholderVertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(positionAttribLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionAttribLocation);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.deleteBuffer(placeholderBuffer); // Clean up
    }


    /**
     * Starts the render loop.
     */
    start() {
        if (!this.animationFrameId) {
            this.lastTimestamp = performance.now();
            this.animationFrameId = requestAnimationFrame(this.render.bind(this));
            console.log("HypercubeCore: Render loop started.");
        }
    }

    /**
     * Stops the render loop.
     */
    stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            console.log("HypercubeCore: Render loop stopped.");
        }
    }

    /**
     * Cleans up resources.
     */
    destroy() {
        this.stop();
        if (this.shaderManager) {
            this.shaderManager.destroy();
        }
        // Further cleanup: remove event listeners, release WebGL resources if any directly held.
        window.removeEventListener('resize', this.onResize.bind(this));
        // Mouse listeners are managed by InteractionEngine
        // this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));

        if(this.interactionEngine) {
            this.interactionEngine.destroy();
        }

        // If geometries or projections cache WebGL resources (buffers, textures),
        // they should also have destroy methods, and HypercubeCore might need to call them.
        // e.g., if (this.currentGeometry && typeof this.currentGeometry.destroy === 'function') this.currentGeometry.destroy(this.gl);

        console.log("HypercubeCore: Destroyed.");
    }

    /**
     * Provides a default vertex shader source.
     * @returns {string}
     */
    getDefaultVertexShader() {
        return `
            precision mediump float;

            attribute vec3 a_position; // Vertex positions from buffer

            // Uniforms provided by HypercubeCore/ShaderManager
            uniform mat4 u_modelViewMatrix;    // Transforms model to view space
            uniform mat4 u_projectionMatrix; // Projects view space to clip space
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform float u_dimension; // Example of using a custom uniform

            // Varyings to pass data to fragment shader
            varying vec3 v_worldPosition;
            varying vec2 v_uv; // If you had UVs

            void main() {
                // Basic transformation
                gl_Position = u_projectionMatrix * u_modelViewMatrix * vec4(a_position, 1.0);

                // Pass some data to fragment shader
                v_worldPosition = (u_modelViewMatrix * vec4(a_position, 1.0)).xyz;
                // v_uv = a_uv; // If using texture coordinates
            }
        `;
    }

    /**
     * Provides a default fragment shader source.
     * @returns {string}
     */
    getDefaultFragmentShader() {
        return `
            precision mediump float;

            // Uniforms (must match those set in HypercubeCore and defined in VS if needed there)
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform vec2 u_mouse; // Normalized mouse coords [0-1]
            uniform float u_dimension;
            uniform float u_lineThickness;
            uniform float u_patternIntensity;
            uniform float u_colorShift;
            // ... other uniforms ...

            // Varyings received from vertex shader
            varying vec3 v_worldPosition;
            varying vec2 v_uv;

            void main() {
                vec2 st = gl_FragCoord.xy / u_resolution.xy; // Screen space UV [0-1]
                vec3 color = vec3(0.0);

                // Example: Simple color based on screen position and time
                color.r = abs(sin(st.x * 3.14 + u_time * 0.5 + u_colorShift * 3.14));
                color.g = abs(cos(st.y * 3.14 + u_time * 0.3 + u_colorShift * 2.0 * 3.14));
                color.b = abs(sin(u_dimension * 0.1 + u_time * 0.2 + u_mouse.x * 3.14));

                // Apply pattern intensity (simple brightness/contrast)
                color = pow(color, vec3(1.0 / u_patternIntensity));

                // Fake line thickness effect for placeholder
                // float distToCenter = length(st - 0.5);
                // if (distToCenter > 0.5 - u_lineThickness * 10.0 && distToCenter < 0.5) {
                //     color = vec3(1.0); // White lines
                // }


                gl_FragColor = vec4(color, 1.0);
            }
        `;
    }
}

// Mock dependencies for standalone execution / testing if needed
if (typeof ShaderManager === 'undefined') {
    global.ShaderManager = class { constructor(gl) {this.gl = gl;} createProgram(vs, fs) {return true;} useProgram(){} getUniformLocation(name){return null;} getAttributeLocation(name){return -1;} setUniformMatrix4fv(){} setUniform1f(){} setUniform2fv(){} setUniform3fv(){} setUniform4fv(){} destroy(){} };
}
if (typeof GeometryManager === 'undefined') {
    global.GeometryManager = class { constructor(){} createGeometryInstance(name, params){return null;} };
}
if (typeof ProjectionManager === 'undefined') {
    global.ProjectionManager = class { constructor(){} createProjectionInstance(name, params){return null;} };
}
if (typeof VIB34DInteractionEngine === 'undefined') {
    global.VIB34DInteractionEngine = class { constructor(canvas){} getInteractionState(){ return { mouseMovement: { normalizedX:0, normalizedY:0}, audioBass:0, audioMid:0, audioHigh:0, idle:{decayFactor:1}, scroll:{intensity:0}, pattern:{type:'casual'}, clickHold:{intensity:0} }; } update(){} destroy(){} };
}
if (typeof ParameterMappingSystem === 'undefined') {
    global.ParameterMappingSystem = class { constructor(baseParams, interactionEng){this.baseParameters = baseParams;} setBaseParameters(p){this.baseParameters=p;} getEffectiveParameters(){ return this.baseParameters || {}; } update(){} };
}
if (typeof mat4 === 'undefined') { // Basic gl-matrix mock
    global.mat4 = {
        create: () => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1],
        identity: (out) => { out.fill(0); out[0]=out[5]=out[10]=out[15]=1; return out; },
        translate: (out, a, v) => { /* simplified */ return out; },
        multiply: (out, a, b) => { /* simplified */ return out; },
        // ... other functions if needed by mocks
    };
}

// Example of how to instantiate and run (typically in an HTML file with a canvas)
/*
HTML:
<canvas id="hypercubeCanvas" style="width: 800px; height: 600px; border: 1px solid black;"></canvas>
<script src="js/gl-matrix.js"></script> <!-- Or your matrix library -->
<script src="js/core/BaseGeometry.js"></script>
<script src="js/core/BaseProjection.js"></script>
<script src="js/managers/ShaderManager.js"></script>
<script src="js/managers/GeometryManager.js"></script>
<script src="js/managers/ProjectionManager.js"></script>
<script src="js/interaction/VIB34DInteractionEngine.js"></script>
<script src="js/interaction/ParameterMappingSystem.js"></script>
// <script src="js/chromatic/VIB34DChromaticEngine.js"></script>
// <script src="js/bridge/VIB3HomeMasterBridge.js"></script>
<script src="js/core/HypercubeCore.js"></script>
// <script src="js/geometries/HypercubeGeometry.js"></script> <!-- Load actual geometries -->
// <script src="js/projections/PerspectiveProjection.js"></script> <!-- Load actual projections -->

<script>
    document.addEventListener('DOMContentLoaded', () => {
        const canvas = document.getElementById('hypercubeCanvas');
        if (canvas) {
            try {
                const core = new HypercubeCore(canvas);

                // Example: Register actual geometry and projection if they were loaded
                // core.geometryManager.registerGeometry('hypercube', HypercubeGeometry);
                // core.setGeometry('hypercube');
                // core.projectionManager.registerProjection('perspective', PerspectiveProjection);
                // core.setProjection('perspective', { fov: Math.PI / 3 });

                // Example: Set some base parameters if not using a UI yet
                // core.updateBaseParameter('u_gridDensity', 12.0);
                // core.updateBaseParameter('u_rotationSpeed', 0.2);

                core.start();

                // Example: Update base parameters after some time (simulating UI change)
                setTimeout(() => {
                    // core.updateBaseParameter('u_dimension', 3.5);
                    // core.updateBaseParameter({
                    //    u_rotationSpeed: 1.0,
                    //    u_colorShift: 0.5
                    // });
                }, 3000);

            } catch (error) {
                console.error("Failed to initialize HypercubeCore:", error);
                document.body.innerHTML = `<p>Error: ${error.message}. Please ensure your browser supports WebGL.</p>`;
            }
        } else {
            console.error("Canvas element #hypercubeCanvas not found.");
        }
    });
</script>
*/
