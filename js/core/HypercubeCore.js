/**
 * HypercubeCore: Main application class for the Hyper-AV visualizer.
 * Manages WebGL context, geometry, projections, and the main render loop.
 */
class HypercubeCore {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('HypercubeCore: Canvas element not found.');
            return;
        }
        this.gl = this.canvas.getContext('webgl');
        if (!this.gl) {
            console.error('HypercubeCore: WebGL not supported.');
            return;
        }

        this.geometryManager = new GeometryManager();
        this.projectionManager = new ProjectionManager();
        this.shaderManager = new ShaderManager(this.gl, this.getVertexShaderSource(), this.getFragmentShaderSource());
        
        // CORRECTED: Passed the container ID to the Dashboard UI Manager
        this.dashboardUI = new DashboardUIManager(this, 'hyperAVDashboardContainer');

        this.activeGeometry = null;
        this.activeProjection = null;

        this.params = {
            size: 1.0,
            rotations: { xy: 0, xz: 0, xw: 0, yz: 0, yw: 0, zw: 0 },
            time: 0
        };

        this.isPlaying = true;
        this.lastTime = 0;

        this.init();
    }

    init() {
        this.registerGeometries();
        this.registerProjections();
        
        const presets = this.getAvailablePresets();
        this.dashboardUI.populatePresets(presets);

        const initialPresetKey = Object.keys(presets)[0];
        const initialPreset = presets[initialPresetKey];
        this.loadPreset(initialPreset);

        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();

        this.startRenderLoop();
    }

    registerGeometries() {
        // CORRECTED: Used 'registerGeometry' instead of 'register'
        this.geometryManager.registerGeometry('hypercube', HypercubeGeometry);
        this.geometryManager.registerGeometry('hypersphere', HypersphereGeometry);
        this.geometryManager.registerGeometry('hypertetrahedron', HypertetrahedronGeometry);
        this.geometryManager.registerGeometry('torus', TorusGeometry);
        this.geometryManager.registerGeometry('kleinbottle', KleinBottleGeometry);
        this.geometryManager.registerGeometry('fractal', FractalGeometry);
        this.geometryManager.registerGeometry('wave', WaveGeometry);
        this.geometryManager.registerGeometry('crystal', CrystalGeometry);
    }

    registerProjections() {
        // CORRECTED: Used 'registerProjection' instead of 'register'
        this.projectionManager.registerProjection('perspective', PerspectiveProjection);
        this.projectionManager.registerProjection('orthographic', OrthographicProjection);
        this.projectionManager.registerProjection('stereographic', StereographicProjection);
    }

    getAvailablePresets() {
        // This is a stand-in for the more complex preset system.
        // It provides the necessary data structure for the UI to populate.
        return {
            "Dimensional Blueprint (Hypercube)": {
                name: "Dimensional Blueprint (Hypercube)",
                geometry: "hypercube",
                projection: "orthographic",
                params: { size: 1.5, rotations: { xy: 0.01, zw: 0.02 } }
            },
            "Cosmic Sphere (Hypersphere)": {
                name: "Cosmic Sphere (Hypersphere)",
                geometry: "hypersphere",
                projection: "stereographic",
                params: { size: 2.0, rotations: { xw: 0.01, yz: 0.015 } }
            },
            "Tetrahedral Precision (Hypertetrahedron)": {
                name: "Tetrahedral Precision (Hypertetrahedron)",
                geometry: "hypertetrahedron",
                projection: "perspective",
                params: { size: 1.8, rotations: { xy: 0.01, xz: 0.01, xw: 0.01 } }
            }
            // Add other presets as needed
        };
    }

    resizeCanvas() {
        if (!this.canvas || !this.gl) return;
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        console.log(`HypercubeCore: Canvas resized to ${this.canvas.width}x${this.canvas.height}`);
    }

    setActiveGeometry(geometryName) {
        if (this.activeGeometry && typeof this.activeGeometry.destroy === 'function') {
            this.activeGeometry.destroy(this.gl);
        }
        // Use the manager to create a new instance
        this.activeGeometry = this.geometryManager.createGeometryInstance(geometryName);
        if (!this.activeGeometry) {
            console.error(`HypercubeCore: Geometry "${geometryName}" could not be created.`);
            return;
        }
        console.log(`HypercubeCore: Set active geometry to "${geometryName}".`);
    }

    setActiveProjection(projectionName) {
         // Use the manager to create a new instance
        this.activeProjection = this.projectionManager.createProjectionInstance(projectionName);
        if (!this.activeProjection) {
            console.error(`HypercubeCore: Projection "${projectionName}" could not be created.`);
            return;
        }
        console.log(`HypercubeCore: Set active projection to "${projectionName}".`);
    }

    updateParams(newParams) {
        if (newParams.rotations) {
            this.params.rotations = { ...this.params.rotations, ...newParams.rotations };
            delete newParams.rotations;
        }
        Object.assign(this.params, newParams);

        if (this.activeGeometry && typeof this.activeGeometry.update === 'function') {
            this.activeGeometry.update(this.params);
        }
    }

    loadPreset(preset) {
        if (!preset) {
            console.error("HypercubeCore: Attempted to load an undefined preset.");
            return;
        }
        console.log(`HypercubeCore: Loading preset "${preset.name}"...`);
        this.setActiveGeometry(preset.geometry);
        this.setActiveProjection(preset.projection);
        this.updateParams(preset.params);
        console.log(`HypercubeCore: Loaded preset.`, preset);
        
        // Sync the UI after loading a preset
        if (this.dashboardUI) {
            this.dashboardUI.syncDashboardToCoreState(this);
        }
    }

    startRenderLoop() {
        if (!this.renderLoop) {
            this.renderLoop = (time) => {
                if (this.isPlaying) {
                    this.update(time);
                    this.render();
                }
                requestAnimationFrame(this.renderLoop);
            };
            console.log('HypercubeCore: Render loop started.');
            requestAnimationFrame(this.renderLoop);
        }
    }

    update(time) {
        const deltaTime = (time - this.lastTime) * 0.001;
        this.lastTime = time;
        this.params.time = time * 0.001;

        const tempRotations = {};
        for(const key in this.params.rotations) {
            tempRotations[key] = (this.params.rotations[key] || 0) * this.params.time;
        }

        if (this.activeGeometry && typeof this.activeGeometry.apply4DRotations === 'function') {
            this.activeGeometry.apply4DRotations(tempRotations);
        }
    }

    render() {
        const gl = this.gl;
        if (!gl || !this.activeGeometry || !this.activeProjection || !this.shaderManager.program) return;

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.useProgram(this.shaderManager.program);

        const vertexBuffer = this.activeGeometry.getVertexPositionsBuffer(gl);
        const indexBuffer = this.activeGeometry.getIndexBuffer(gl);
        const indicesCount = this.activeGeometry.getEdgeIndices().length;

        if (!vertexBuffer || !indexBuffer || indicesCount === 0) {
            return;
        }

        const positionAttribLocation = gl.getAttribLocation(this.shaderManager.program, 'a_position');
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.vertexAttribPointer(positionAttribLocation, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionAttribLocation); // The rendering fix

        const projectionMatrix = this.activeProjection.getProjectionMatrix(gl.canvas.width / gl.canvas.height);
        const uProjectionMatrix = gl.getUniformLocation(this.shaderManager.program, 'u_projectionMatrix');
        gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.drawElements(gl.LINES, indicesCount, gl.UNSIGNED_SHORT, 0);
    }

    getVertexShaderSource() {
        return `
            attribute vec4 a_position;
            uniform mat4 u_projectionMatrix;
            void main() {
                gl_Position = u_projectionMatrix * a_position;
            }
        `;
    }

    getFragmentShaderSource() {
        return `
            precision mediump float;
            void main() {
                gl_FragColor = vec4(0.0, 1.0, 1.0, 1.0);
            }
        `;
    }
}