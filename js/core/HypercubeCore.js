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

    getCoreParametersSchema() {
        // Provides metadata for dashboard UI generation.
        // 'group' suggests a dashboard section.
        // 'relevantToGeometries' (optional): array of geometry constructor names (lowercase, no "geometry" suffix)
        // if this parameter is primarily specific to them. Dashboard can use this to show/hide controls.
        return [
            // Global Setup
            { name: 'u_dimension', label: '4D Dimension', type: 'slider', min: 3.0, max: 5.0, step: 0.01, defaultValue: 4.0, group: 'Global Setup' },

            // Appearance & Structure
            { name: 'u_gridDensity', label: 'Grid Density / Divisions', type: 'slider', min: 1.0, max: 30.0, step: 0.5, defaultValue: 10.0, group: 'Appearance & Structure',
              description: "Controls divisions for most geometries. For Fractal, maps to iterations. For Crystal, maps to lattice points per axis." },
            { name: 'u_lineThickness', label: 'Line/Point Size', type: 'slider', min: 0.001, max: 0.1, step: 0.001, defaultValue: 0.01, group: 'Appearance & Structure' },
            { name: 'u_shellWidth', label: 'Shell Width', type: 'slider', min: 0.001, max: 0.25, step: 0.001, defaultValue: 0.05, group: 'Appearance & Structure', relevantToGeometries: ['hypersphere'] },
            { name: 'u_tetraThickness', label: 'Tetra Plane Thickness', type: 'slider', min: 0.001, max: 0.15, step: 0.001, defaultValue: 0.02, group: 'Appearance & Structure', relevantToGeometries: ['hypertetrahedron'] },

            // Animation & Morphing
            { name: 'u_rotationSpeed', label: 'Rotation Speed', type: 'slider', min: 0.0, max: 3.0, step: 0.01, defaultValue: 0.5, group: 'Animation & Morphing' },
            { name: 'u_morphFactor', label: 'Morph Factor', type: 'slider', min: 0.0, max: 1.5, step: 0.01, defaultValue: 0.0, group: 'Animation & Morphing', isAdvanced: true },

            // Visual Effects
            { name: 'u_colorShift', label: 'Color Shift (Hue)', type: 'slider', min: -1.0, max: 1.0, step: 0.01, defaultValue: 0.0, group: 'Visual Effects' },
            { name: 'u_patternIntensity', label: 'Pattern Intensity', type: 'slider', min: 0.1, max: 3.0, step: 0.01, defaultValue: 1.0, group: 'Visual Effects', isAdvanced: true },
            { name: 'u_universeModifier', label: 'Universe Modifier (Scale)', type: 'slider', min: 0.3, max: 2.5, step: 0.01, defaultValue: 1.0, group: 'Visual Effects', isAdvanced: true },
            { name: 'u_glitchIntensity', label: 'Glitch Intensity', type: 'slider', min: 0.0, max: 0.15, step: 0.001, defaultValue: 0.0, group: 'Visual Effects', isAdvanced: true },

            // Note: Parameters like fov, near, far for projections could also be added here if they are to be user-controllable
            // For example:
            // { name: 'fov', label: 'Field of View (Persp)', type: 'slider', min: 0.1, max: Math.PI * 0.9, step: 0.01, defaultValue: Math.PI / 4, group: 'Projection', relevantToProjections: ['perspective', 'orthographic_blend_perspective'] },

            // Audio reactivity base levels (usually these are outputs, but base levels could be set)
            // { name: 'u_audioBass', label: 'Audio Bass Base', type: 'slider', min: 0.0, max: 1.0, step: 0.01, defaultValue: 0.0, group: 'Interaction Reactivity' },
            // { name: 'u_audioMid', label: 'Audio Mid Base', type: 'slider', min: 0.0, max: 1.0, step: 0.01, defaultValue: 0.0, group: 'Interaction Reactivity' },
            // { name: 'u_audioHigh', label: 'Audio High Base', type: 'slider', min: 0.0, max: 1.0, step: 0.01, defaultValue: 0.0, group: 'Interaction Reactivity' },
        ];
    }

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

            // A. Get attribute locations
            const positionAttribLocation = this.shaderManager.getAttributeLocation('a_position4D');
            // const uvAttribLocation = this.shaderManager.getAttributeLocation('a_uv'); // If using UVs from geometry

            if (positionAttribLocation !== -1 && this.currentGeometry.getVertexPositionsBuffer) {
                // B. Bind Vertex Buffer (VBO)
                const vbo = this.currentGeometry.getVertexPositionsBuffer(this.gl);
                gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
                gl.vertexAttribPointer(
                    positionAttribLocation, // attributeLocation
                    4,                      // numComponents (x,y,z,w)
                    gl.FLOAT,               // type
                    false,                  // normalize
                    0,                      // stride
                    0                       // offset
                );
                gl.enableVertexAttribArray(positionAttribLocation);

                // Optional: Setup UVs if current geometry provides them
                // if (uvAttribLocation !== -1 && typeof this.currentGeometry.getUVBuffer === 'function') {
                //     const uvBuffer = this.currentGeometry.getUVBuffer(this.gl);
                //     gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
                //     gl.vertexAttribPointer(uvAttribLocation, 2, gl.FLOAT, false, 0, 0); // Assuming 2D UVs
                //     gl.enableVertexAttribArray(uvAttribLocation);
                // }

                // C. Draw Logic
                if (typeof this.currentGeometry.getEdgeIndices === 'function' && this.currentGeometry.getEdgeIndices().length > 0) {
                    // Render as lines if edge indices are available (e.g., Hypercube, Hypertetrahedron, Crystal)
                    const ibo = this.currentGeometry.getIndexBuffer(this.gl); // getIndexBuffer should provide edge indices
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
                    gl.drawElements(gl.LINES, this.currentGeometry.getEdgeIndices().length, gl.UNSIGNED_SHORT, 0);
                } else if (this.currentGeometry.constructor.name === "FractalGeometry" || this.currentGeometry.constructor.name === "WaveGeometry" ) {
                    // Render FractalGeometry or WaveGeometry as points
                    // WaveGeometry's current indices are for cells, point rendering might be better for some wave viz
                    const numPoints = this.currentGeometry.getVertices().length / 4; // 4 components per vertex
                    gl.drawArrays(gl.POINTS, 0, numPoints);
                } else if (typeof this.currentGeometry.getIndices === 'function' && this.currentGeometry.getIndices().length > 0) {
                    // Fallback to triangles if general indices are available (e.g., Hypersphere, Torus, KleinBottle)
                    const ibo = this.currentGeometry.getIndexBuffer(this.gl);
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
                    gl.drawElements(gl.TRIANGLES, this.currentGeometry.getIndices().length, gl.UNSIGNED_SHORT, 0);
                } else {
                    // Fallback for geometries without specific indices (draw as points)
                    const numVertices = this.currentGeometry.getVertices().length / 4;
                    gl.drawArrays(gl.POINTS, 0, numVertices);
                }
            } else {
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
        const gl = this.gl;
        const positionAttribLocation = this.shaderManager.getAttributeLocation('a_position4D');
        if (positionAttribLocation === -1) return;

        // Draw a few points as placeholder
        const placeholderVertices = new Float32Array([
             0.0,  0.1,  0.0, 1.0, // x,y,z,w
            -0.1, -0.1,  0.0, 1.0,
             0.1, -0.1,  0.0, 1.0,
             0.0,  0.0,  0.1, 1.0
        ]);
        const placeholderBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, placeholderBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, placeholderVertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(positionAttribLocation, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionAttribLocation);
        gl.drawArrays(gl.POINTS, 0, 4); // Draw 4 points
        gl.deleteBuffer(placeholderBuffer);
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

            attribute vec4 a_position4D; // Input: 4D vertex position (x,y,z,w)

            // --- Standard 3D Matrices (applied AFTER 4D->3D projection) ---
            uniform mat4 u_modelViewMatrix;  // 3D View Matrix (camera position in 3D space)
            uniform mat4 u_projectionMatrix; // 3D Projection Matrix (perspective or orthographic)

            // --- 4D Visualization Uniforms ---
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform float u_dimension;       // Controls the 4D projection (e.g., w-depth, focal length)
            uniform float u_morphFactor;     // Can be used to alter projection or positions
            uniform float u_lineThickness;   // For point size

            // --- Varyings to Fragment Shader ---
            varying vec4 v_position4D_world; // Pass original 4D position (or world-transformed 4D)
            varying vec3 v_position3D_projected; // Pass the intermediate 3D position
            varying float v_w_component; // Pass the original w component for effects

            void main() {
                vec4 P = a_position4D;

                // Optional: Apply morphFactor to P.w or P.xyz for dynamic effects before projection
                // P.w += u_morphFactor * sin(P.x * P.y + u_time * 0.1); // Example morph

                v_position4D_world = P;
                v_w_component = P.w;

                // --- 4D to 3D Projection ---
                float w_divisor = (P.w / u_dimension) + 1.0;

                if (abs(w_divisor) < 0.0001) {
                    w_divisor = sign(w_divisor) * 0.0001;
                }
                // To prevent points "behind" the view from flipping, you might clamp or discard.
                // For instance, if w_divisor becomes negative, points are behind the 4D "camera".
                // if (w_divisor <= 0.0) w_divisor = 0.0001; // Or handle differently (e.g. large value for gl_Position.w)


                vec3 pos3D = P.xyz / w_divisor;
                v_position3D_projected = pos3D;

                gl_Position = u_projectionMatrix * u_modelViewMatrix * vec4(pos3D, 1.0);

                // Set point size - make it smaller for points "further away"
                // and use u_lineThickness as a base size multiplier.
                float pointDistance = length(gl_Position.xyz);
                float basePointSize = u_lineThickness * 500.0;
                // Adjust 500.0 to scale u_lineThickness (0.002-0.1) to pixel sizes (1-50)
                // The perspective effect on point size is naturally handled by gl_Position.w
                // So, a simpler gl_PointSize might be:
                gl_PointSize = clamp(basePointSize, 1.0, 50.0);
                 // For distance-based attenuation:
                 // gl_PointSize = clamp(basePointSize / (1.0 + pointDistance * 0.1), 1.0, 50.0);
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

            // --- Uniforms ---
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform vec2 u_mouse;
            uniform float u_dimension;
            // uniform float u_lineThickness; // Not directly used in FS for this basic version if VS handles point size
            uniform float u_patternIntensity;
            uniform float u_colorShift;
            uniform float u_morphFactor;
            uniform float u_glitchIntensity;
            uniform float u_gridDensity; // Added for potential use

            // --- Varyings from Vertex Shader ---
            varying vec4 v_position4D_world;
            varying vec3 v_position3D_projected;
            varying float v_w_component;

            // Helper function for HSL to RGB conversion
            vec3 hsl2rgb(vec3 c) {
                vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0);
                return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
            }

            void main() {
                vec3 finalColor;

                // 1. Base Color from 4D position ("4D Rainbow")
                vec4 normPos4D = normalize(v_position4D_world);
                // If geometry is centered and has typical size of ~1, normPos4D will be direction.
                // Otherwise, consider (v_position4D_world / expectedMaxExtent)

                float hue = mod((normPos4D.x - normPos4D.y + normPos4D.z - normPos4D.w) * 0.15 /*sens*/ + u_time * 0.03, 1.0);
                hue = mod(hue + u_colorShift, 1.0); // Apply u_colorShift to hue (0-1 range)

                float saturation = clamp(0.7 + normPos4D.w * 0.3, 0.5, 1.0);

                // 2. Depth Cueing using v_w_component
                float w_depth_factor = clamp(1.0 - abs(v_w_component) / (u_dimension * 1.5), 0.2, 1.0);

                float luminance = clamp(0.25 + w_depth_factor * 0.6 + u_morphFactor * 0.05, 0.15, 0.85);
                luminance = pow(luminance, 1.0 / clamp(u_patternIntensity, 0.1, 3.0));

                finalColor = hsl2rgb(vec3(hue, saturation, luminance));

                // 3. Alpha based on point Z depth (closer points more opaque)
                // gl_FragCoord.z is depth from 0 (near) to 1 (far)
                float alpha = clamp(1.0 - gl_FragCoord.z * 0.7, 0.2, 1.0);


                // 4. Glitch Effect
                if (u_glitchIntensity > 0.0) {
                    float glitchRand = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + u_time * 5.0) * 43758.5453);
                    if (glitchRand < u_glitchIntensity) {
                        finalColor.rgb = finalColor.grb;
                        finalColor.r *= (1.0 + sin(u_time * 10.0 + v_position4D_world.x * 5.0) * 0.5); // Pulsate R
                    }
                    if (glitchRand < u_glitchIntensity * 0.3) {
                         finalColor *= (1.0 - glitchRand * 3.0);
                         alpha *= 0.5;
                    }
                }

                // Conceptual: If rendering lines/tris, u_lineThickness could be used for fake edge highlighting
                // For gl.POINTS, point size is set in vertex shader.
                // For gl.LINES, this is harder without geometry shaders or complex line mesh generation.
                // One simple trick for points is to use `gl_PointCoord` for rounded points.
                // float dist_to_center = length(gl_PointCoord - vec2(0.5));
                // if (dist_to_center > 0.5) discard; // Makes points circular

                gl_FragColor = vec4(finalColor, alpha);
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
