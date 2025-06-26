/**
 * Dashboard UI Manager for HyperAV 4D Visualizer
 * Creates and manages the holographic dashboard interface
 */

class DashboardUIManager {
    constructor(core, containerId) {
        this.core = core;
        this.container = document.getElementById(containerId);
        this.isVisible = true;
        
        if (!this.container) {
            console.error(`DashboardUIManager: Container element '${containerId}' not found`);
            return;
        }
        
        this.createDashboard();
        this.bindEvents();
        this.syncDashboardToCoreState();
        
        console.log('🎛️ HyperAV Dashboard UI Manager initialized');
    }
    
    createDashboard() {
        this.container.innerHTML = `
            <div id="hyperav-dashboard" style="
                position: fixed;
                top: 20px;
                right: 20px;
                width: 320px;
                background: rgba(0, 20, 40, 0.9);
                border: 1px solid rgba(0, 255, 255, 0.5);
                border-radius: 15px;
                padding: 20px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                color: #00ffff;
                backdrop-filter: blur(10px);
                box-shadow: 
                    0 8px 32px rgba(0, 0, 0, 0.4),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
                z-index: 10000;
                transition: all 0.3s ease;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0; color: #ffffff; font-size: 14px;">HyperAV Dashboard</h3>
                    <button id="dashboard-toggle" style="
                        background: rgba(0, 255, 255, 0.2);
                        border: 1px solid #00ffff;
                        color: #00ffff;
                        padding: 4px 8px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 10px;
                    ">−</button>
                </div>
                
                <div id="dashboard-content">
                    <!-- Geometry Section -->
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #ffff00;">Geometry:</label>
                        <select id="geometry-select" style="
                            width: 100%;
                            background: rgba(0, 0, 0, 0.5);
                            border: 1px solid #00ffff;
                            color: #ffffff;
                            padding: 4px;
                            border-radius: 4px;
                        ">
                            <option value="hypercube">Hypercube</option>
                            <option value="hypersphere">Hypersphere</option>
                            <option value="hypertetrahedron">Hypertetrahedron</option>
                            <option value="torus">Torus</option>
                            <option value="kleinbottle">Klein Bottle</option>
                            <option value="fractal">Fractal</option>
                            <option value="wave">Wave</option>
                            <option value="crystal">Crystal</option>
                        </select>
                    </div>
                    
                    <!-- Projection Section -->
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #ffff00;">Projection:</label>
                        <select id="projection-select" style="
                            width: 100%;
                            background: rgba(0, 0, 0, 0.5);
                            border: 1px solid #00ffff;
                            color: #ffffff;
                            padding: 4px;
                            border-radius: 4px;
                        ">
                            <option value="perspective">Perspective</option>
                            <option value="orthographic">Orthographic</option>
                            <option value="stereographic">Stereographic</option>
                        </select>
                    </div>
                    
                    <!-- Presets Section -->
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #ffff00;">Presets:</label>
                        <select id="preset-select" style="
                            width: 100%;
                            background: rgba(0, 0, 0, 0.5);
                            border: 1px solid #00ffff;
                            color: #ffffff;
                            padding: 4px;
                            border-radius: 4px;
                        ">
                            <option value="">Loading presets...</option>
                        </select>
                    </div>
                    
                    <!-- Parameters Section -->
                    <div style="margin-bottom: 15px;">
                        <h4 style="margin: 0 0 10px 0; color: #ff00ff;">Parameters</h4>
                        
                        <div style="margin-bottom: 8px;">
                            <label style="display: block; margin-bottom: 2px;">Dimension: <span id="dimension-value">4.0</span></label>
                            <input type="range" id="dimension-slider" min="2" max="6" step="0.1" value="4" style="width: 100%;">
                        </div>
                        
                        <div style="margin-bottom: 8px;">
                            <label style="display: block; margin-bottom: 2px;">Rotation Speed: <span id="rotation-value">0.5</span></label>
                            <input type="range" id="rotation-slider" min="0" max="2" step="0.01" value="0.5" style="width: 100%;">
                        </div>
                        
                        <div style="margin-bottom: 8px;">
                            <label style="display: block; margin-bottom: 2px;">Grid Density: <span id="grid-value">10</span></label>
                            <input type="range" id="grid-slider" min="1" max="50" step="1" value="10" style="width: 100%;">
                        </div>
                        
                        <div style="margin-bottom: 8px;">
                            <label style="display: block; margin-bottom: 2px;">Color Shift: <span id="color-value">0.0</span></label>
                            <input type="range" id="color-slider" min="-1" max="1" step="0.01" value="0" style="width: 100%;">
                        </div>
                    </div>
                    
                    <!-- Status Section -->
                    <div style="border-top: 1px solid rgba(0, 255, 255, 0.3); padding-top: 10px;">
                        <div style="font-size: 10px; color: #aaaaaa;">
                            <div>Status: <span id="status-text" style="color: #00ff00;">Active</span></div>
                            <div>FPS: <span id="fps-counter">60</span></div>
                            <div>Current: <span id="current-config">Hypercube/Perspective</span></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    bindEvents() {
        // Toggle dashboard visibility
        const toggleBtn = document.getElementById('dashboard-toggle');
        const content = document.getElementById('dashboard-content');
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.isVisible = !this.isVisible;
                content.style.display = this.isVisible ? 'block' : 'none';
                toggleBtn.textContent = this.isVisible ? '−' : '+';
            });
        }
        
        // Geometry selection
        const geometrySelect = document.getElementById('geometry-select');
        if (geometrySelect) {
            geometrySelect.addEventListener('change', (e) => {
                this.core.setGeometry(e.target.value);
                this.updateCurrentConfig();
            });
        }
        
        // Projection selection
        const projectionSelect = document.getElementById('projection-select');
        if (projectionSelect) {
            projectionSelect.addEventListener('change', (e) => {
                this.core.setProjection(e.target.value);
                this.updateCurrentConfig();
            });
        }
        
        // Preset selection
        const presetSelect = document.getElementById('preset-select');
        if (presetSelect) {
            this.populatePresets();
            presetSelect.addEventListener('change', (e) => {
                if (e.target.value && this.core.presetManager) {
                    this.core.presetManager.loadPresetByName(e.target.value);
                    this.syncDashboardToCoreState();
                }
            });
        }
        
        // Parameter sliders
        this.bindParameterSlider('dimension-slider', 'dimension-value', 'u_dimension');
        this.bindParameterSlider('rotation-slider', 'rotation-value', 'u_rotationSpeed');
        this.bindParameterSlider('grid-slider', 'grid-value', 'u_gridDensity');
        this.bindParameterSlider('color-slider', 'color-value', 'u_colorShift');
    }
    
    bindParameterSlider(sliderId, valueId, paramName) {
        const slider = document.getElementById(sliderId);
        const valueSpan = document.getElementById(valueId);
        
        if (slider && valueSpan) {
            slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                valueSpan.textContent = value.toFixed(2);
                
                if (this.core.currentGeometry && this.core.currentGeometry.updateParameter) {
                    this.core.currentGeometry.updateParameter(paramName, value);
                }
            });
        }
    }
    
    populatePresets() {
        const presetSelect = document.getElementById('preset-select');
        if (!presetSelect || !window.VIB3_PRESETS_EXPANDED) return;
        
        presetSelect.innerHTML = '<option value="">Select Preset...</option>';
        
        window.VIB3_PRESETS_EXPANDED.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.name;
            option.textContent = preset.name;
            presetSelect.appendChild(option);
        });
    }
    
    syncDashboardToCoreState() {
        // Update geometry selection
        const geometrySelect = document.getElementById('geometry-select');
        if (geometrySelect && this.core.currentGeometryName) {
            geometrySelect.value = this.core.currentGeometryName;
        }
        
        // Update projection selection
        const projectionSelect = document.getElementById('projection-select');
        if (projectionSelect && this.core.currentProjectionName) {
            projectionSelect.value = this.core.currentProjectionName;
        }
        
        // Update current config display
        this.updateCurrentConfig();
        
        // Update parameter values if geometry has them
        if (this.core.currentGeometry && this.core.currentGeometry.params) {
            this.updateParameterValues(this.core.currentGeometry.params);
        }
    }
    
    updateParameterValues(params) {
        const updateSlider = (sliderId, valueId, paramValue) => {
            const slider = document.getElementById(sliderId);
            const valueSpan = document.getElementById(valueId);
            if (slider && valueSpan && paramValue !== undefined) {
                slider.value = paramValue;
                valueSpan.textContent = paramValue.toFixed(2);
            }
        };
        
        updateSlider('dimension-slider', 'dimension-value', params.u_dimension);
        updateSlider('rotation-slider', 'rotation-value', params.u_rotationSpeed);
        updateSlider('grid-slider', 'grid-value', params.u_gridDensity);
        updateSlider('color-slider', 'color-value', params.u_colorShift);
    }
    
    updateCurrentConfig() {
        const configText = document.getElementById('current-config');
        if (configText) {
            const geometry = this.core.currentGeometryName || 'Unknown';
            const projection = this.core.currentProjectionName || 'Unknown';
            configText.textContent = `${geometry}/${projection}`;
        }
    }
    
    updateFPS(fps) {
        const fpsCounter = document.getElementById('fps-counter');
        if (fpsCounter) {
            fpsCounter.textContent = Math.round(fps);
        }
    }
    
    setStatus(status) {
        const statusText = document.getElementById('status-text');
        if (statusText) {
            statusText.textContent = status;
            statusText.style.color = status === 'Active' ? '#00ff00' : 
                                    status === 'Error' ? '#ff0000' : '#ffff00';
        }
    }
}

// Export for global use
if (typeof window !== 'undefined') {
    window.DashboardUIManager = DashboardUIManager;
}

console.log('✅ DashboardUIManager class loaded');