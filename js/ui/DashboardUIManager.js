// js/ui/DashboardUIManager.js

class DashboardUIManager {
    constructor(coreInstance, dashboardHtmlContainerId = 'hyperAVDashboardContainer') {
        this.core = coreInstance;
        if (!this.core || typeof this.core.getCoreParametersSchema !== 'function') {
            console.error("DashboardUIManager: Valid HypercubeCore instance is required.");
            this.valid = false;
            return;
        }
        this.valid = true;

        this.container = document.getElementById(dashboardHtmlContainerId);
        if (!this.container) {
            console.error(`DashboardUIManager: HTML container with ID "${dashboardHtmlContainerId}" not found.`);
            this.valid = false;
            return;
        }

        this.elements = {};
        this.parameterSchema = this.core.getCoreParametersSchema();
        this.isAdvancedModeEnabled = false;

        this._init();
    }

    _init() {
        if (!this.valid) return;
        // console.log("DashboardUIManager: Initializing...");
        this._renderFullDashboardLayout();
        this._assignElementReferences();

        this._populateStaticDropdowns();
        this._populatePresetDropdown();
        this._initControlsFromCoreState();

        this._attachCoreEventListeners();
        this._attachUiViewListeners();

        this.startRealtimeDisplay();
        this.syncDashboardToCoreState();
        // console.log("DashboardUIManager: Initialized.");
    }

    _renderFullDashboardLayout() {
        this.container.innerHTML = '<h2 style="text-align:center; margin-top:0; margin-bottom:15px; font-size:16px; color: #61dafb;">HyperAV Dashboard</h2>';

        let globalSetupHtml = `
            <div><label for="dashboardSelectGeometry">Geometry:</label><select id="dashboardSelectGeometry"></select></div>
            <div><label for="dashboardSelectProjection">Projection:</label><select id="dashboardSelectProjection"></select></div>`;
        const dimensionParam = this.parameterSchema.find(p => p.name === 'u_dimension');
        if (dimensionParam) {
            globalSetupHtml += this._createParamControlHtml(dimensionParam);
        }
        this._addSectionToDashboardDOM("Global Setup", globalSetupHtml);

        const presetHtml = `
            <div>
                <label for="dashboardSelectPreset">Load Preset:</label>
                <select id="dashboardSelectPreset" style="width: calc(100% - 65px);"></select>
                <button id="dashboardBtnLoadPreset" style="width: 55px;">Load</button>
            </div>
            <div style="margin-top: 5px;">
                <input type="text" id="dashboardInputPresetName" placeholder="New preset name" style="width: calc(100% - 100px);">
                <button id="dashboardBtnSavePreset" style="width: 90px;">Save Current</button>
            </div>
            <div style="margin-top: 5px;">
                <button id="dashboardBtnExportPresets">Export User</button>
                <button id="dashboardBtnImportPresets">Import User</button>
                <textarea id="dashboardTextareaImportExport" placeholder="Paste JSON here..." style="width: 95%; height: 40px; margin-top: 5px; background:#222; color:#ddd; border:1px solid #555;"></textarea>
            </div>`;
        this._addSectionToDashboardDOM("Presets", presetHtml);

        this._addSectionToDashboardDOM("Settings", `
            <div>
                <label for="dashboardToggleAdvancedParams" style="display:inline-block; margin-right:5px;">Show Advanced:</label>
                <input type="checkbox" id="dashboardToggleAdvancedParams">
            </div>`);

        const paramControlsContainer = document.createElement('div');
        paramControlsContainer.id = 'dashboardParamControlsContainer';
        this.container.appendChild(paramControlsContainer);

        const paramGroups = {};
        this.parameterSchema.forEach(param => {
            if (param.name === 'u_dimension') return;
            paramGroups[param.group] = paramGroups[param.group] || '';
            if (!param.relevantToGeometries || param.relevantToGeometries.length === 0) {
                 paramGroups[param.group] += this._createParamControlHtml(param);
            }
        });

        for (const groupName in paramGroups) {
            let groupContent = paramGroups[groupName];
            if (groupName === "Appearance & Structure") {
                 groupContent += `<div id="dashboardGeometrySpecificParamsContainer" style="margin-top:10px; padding-left:10px; border-left: 1px solid #555;"><h4>Geometry-Specific:</h4></div>`;
            }
            this._addSectionToDashboardDOM(groupName, groupContent, paramControlsContainer);
        }

        const realtimeHtml = `
            <div id="dashboardRealtimeValuesDisplay" style="font-size:10px;max-height:100px;overflow-y:auto;background:#222;padding:5px;border-radius:3px; word-break: break-all;"></div>
            <h4>Interaction Indicators:</h4>
            <div>Bass: <progress id="dashboardPulseBass" value="0" max="1" style="width:100px; height:10px;"></progress></div>
            <div>Mid: <progress id="dashboardPulseMid" value="0" max="1" style="width:100px; height:10px;"></progress></div>
            <div>High: <progress id="dashboardPulseHigh" value="0" max="1" style="width:100px; height:10px;"></progress></div>`;
        this._addSectionToDashboardDOM("Real-time Data", realtimeHtml);

        const style = document.createElement('style');
        style.textContent = `
            #hyperAVDashboardContainer { position:fixed;top:10px;right:10px;width:300px;max-height:calc(100vh - 20px);background:rgba(30,32,35,0.88);color:#eee;padding:10px;border-radius:8px;font-family:Arial,sans-serif;font-size:12px;overflow-y:auto;z-index:1000; border: 1px solid #555; box-shadow: 0 0 15px rgba(0,0,0,0.5);}
            #hyperAVDashboardContainer h2 { text-align:center; margin-top:0; margin-bottom:15px; font-size:16px; color: #00bcd4;}
            #hyperAVDashboardContainer h3 { margin-top:0; margin-bottom:8px; font-size:14px; border-bottom:1px solid #555; padding-bottom:3px; color: #ccc;}
            #hyperAVDashboardContainer h4 { font-size:11px; color: #bbb; margin-top:8px; margin-bottom:3px;}
            #hyperAVDashboardContainer .dashboard-section { margin-bottom:12px; padding-bottom:8px; border-bottom:1px dotted #444; }
            #hyperAVDashboardContainer .dashboard-section:last-child { border-bottom:none; }
            #hyperAVDashboardContainer label { display:block; margin-top:6px; margin-bottom:2px; font-weight:bold; color:#bbb }
            #hyperAVDashboardContainer input[type="range"] { width:98%; margin-bottom:2px; }
            #hyperAVDashboardContainer select, #hyperAVDashboardContainer input[type="text"], #hyperAVDashboardContainer input[type="number"], #hyperAVDashboardContainer input[type="color"] { background:#2a2f34; color:#eee; border:1px solid #555; padding:4px; border-radius:3px; margin-bottom:3px; box-sizing: border-box; }
            #hyperAVDashboardContainer button { background:#4a525a; color:#eee; border:none; padding:4px 8px; border-radius:3px; cursor:pointer; margin-left:5px;}
            #hyperAVDashboardContainer button:hover { background:#5a626a; }
            #hyperAVDashboardContainer .param-control-group { margin-bottom:5px; padding:3px; border-radius:3px; }
            #hyperAVDashboardContainer .param-control-group small {color:#999; font-size:0.85em;}
            #hyperAVDashboardContainer .advanced-param-group { /* managed by JS */ }
            #hyperAVDashboardContainer progress { width:100px; height:10px; }
        `;
        this.container.appendChild(style);
    }

    _addSectionToDashboardDOM(title, contentHtml, parentElement = null) {
        const container = parentElement || this.container;
        const sectionNode = document.createElement('div');
        sectionNode.className = 'dashboard-section';
        sectionNode.innerHTML = `<h3>${title}</h3><div>${contentHtml}</div>`;
        container.appendChild(sectionNode);
    }

    _createParamControlHtml(param) {
        const coreBaseParams = this.core.getBaseParameters();
        let currentValue = param.defaultValue;
        if (coreBaseParams.hasOwnProperty(param.name) && coreBaseParams[param.name] !== undefined) {
            currentValue = coreBaseParams[param.name];
        }

        const isAdvancedClass = param.isAdvanced ? 'advanced-param-group' : '';
        const initialDisplay = param.isAdvanced ? 'style="display:none;"' : '';
        const relevantGeosData = param.relevantToGeometries ? `data-relevant-geos="${param.relevantToGeometries.join(',')}"` : '';
        let controlHtml = '';
        let displayValue = '';
        const stepStr = param.step ? param.step.toString() : (param.type === 'slider' ? "0.01" : "1");


        if (param.type === 'slider') {
            const valuePrecision = stepStr.includes('.') ? stepStr.split('.')[1].length : 0;
            displayValue = parseFloat(currentValue).toFixed(valuePrecision);
            controlHtml = `<input type="range" id="dashboard_${param.name}" class="param-slider" data-uniform="${param.name}"
                               min="${param.min}" max="${param.max}" step="${stepStr}" value="${currentValue}">`;
        } else if (param.type === 'vec3') {
            const componentStep = param.step || 0.01;
            const currentVec = Array.isArray(currentValue) && currentValue.length === 3 ? currentValue : (param.defaultValue || [0,0,0]);
            controlHtml = ['X', 'Y', 'Z'].map((comp, i) => `
                <label for="dashboard_${param.name}_${comp}" style="font-size:0.9em;display:inline-block;width:20px;">${comp}:</label>
                <input type="number" id="dashboard_${param.name}_${comp}" class="param-vec3-component" data-uniform="${param.name}" data-component-index="${i}"
                       step="${componentStep}" value="${currentVec[i]}" style="width:60px; margin-right:5px;">
            `).join('');
            displayValue = `[${currentVec.map(v=>parseFloat(v).toFixed(2)).join(',')}]`;
        } else if (param.type === 'color') {
             const currentColorArr = Array.isArray(currentValue) && currentValue.length === 3 ? currentValue : (param.defaultValue || [1,1,1]);
             const hexColor = this._rgbArrayToHex(currentColorArr);
             controlHtml = `<input type="color" id="dashboard_${param.name}" class="param-color-picker" data-uniform="${param.name}" value="${hexColor}">`;
             displayValue = hexColor;
        }

        return `
            <div class="param-control-group ${isAdvancedClass}" ${initialDisplay} ${relevantGeosData} data-param-name="${param.name}">
                <label for="dashboard_${param.name}">${param.label}: <span id="dashboard_${param.name}_value">${displayValue}</span></label>
                ${controlHtml}
                ${param.description ? `<small style="display:block;">${param.description}</small>` : ''}
            </div>`;
    }

    _rgbArrayToHex(rgbArray) {
        return "#" + (rgbArray || [1,1,1]).map(c => {
            const hex = Math.max(0, Math.min(255, Math.round(c * 255))).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }).join('');
    }

    _hexToRgbArray(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255
        ] : [1,1,1];
    }

    _assignElementReferences() {
        this.elements.selectGeometry = document.getElementById('dashboardSelectGeometry');
        this.elements.selectProjection = document.getElementById('dashboardSelectProjection');
        this.elements.toggleAdvancedParams = document.getElementById('dashboardToggleAdvancedParams');
        this.elements.paramControlsContainer = document.getElementById('dashboardParamControlsContainer');
        this.elements.geometrySpecificParamsContainer = document.getElementById('dashboardGeometrySpecificParamsContainer');

        this.elements.selectPreset = document.getElementById('dashboardSelectPreset');
        this.elements.btnLoadPreset = document.getElementById('dashboardBtnLoadPreset');
        this.elements.inputPresetName = document.getElementById('dashboardInputPresetName');
        this.elements.btnSavePreset = document.getElementById('dashboardBtnSavePreset');
        this.elements.btnExportPresets = document.getElementById('dashboardBtnExportPresets');
        this.elements.btnImportPresets = document.getElementById('dashboardBtnImportPresets');
        this.elements.textareaImportExport = document.getElementById('dashboardTextareaImportExport');

        this.elements.realtimeValuesDisplay = document.getElementById('dashboardRealtimeValuesDisplay');
        this.elements.pulseBass = document.getElementById('dashboardPulseBass');
        this.elements.pulseMid = document.getElementById('dashboardPulseMid');
        this.elements.pulseHigh = document.getElementById('dashboardPulseHigh');
    }

    _populateStaticDropdowns() {
        const geometries = this.core.getAvailableGeometries();
        if(this.elements.selectGeometry) this.elements.selectGeometry.innerHTML = geometries.map(g => `<option value="${g}">${g.charAt(0).toUpperCase() + g.slice(1)}</option>`).join('');

        const projections = this.core.getAvailableProjections();
        if(this.elements.selectProjection) this.elements.selectProjection.innerHTML = projections.map(p => `<option value="${p}">${p.charAt(0).toUpperCase() + p.slice(1)}</option>`).join('');
    }

    _populatePresetDropdown() {
        if (this.core.presetManager && this.elements.selectPreset) {
            const presets = this.core.presetManager.getAllPresetNames();
            this.elements.selectPreset.innerHTML = presets.map(p =>
                `<option value="${p.name}">${p.name} (${p.type.charAt(0).toUpperCase() + p.type.slice(1)})</option>`
            ).join('');
        }
    }

    _initControlsFromCoreState() {
        const baseParams = this.core.getBaseParameters();
        this.parameterSchema.forEach(paramSchema => {
            const uniformName = paramSchema.name;
            let value = paramSchema.defaultValue;
            if (baseParams.hasOwnProperty(uniformName) && baseParams[uniformName] !== undefined) {
                value = baseParams[uniformName];
            }

            const control = document.getElementById(`dashboard_${uniformName}`);
            const valueDisplay = document.getElementById(`dashboard_${uniformName}_value`);
            const stepStr = paramSchema.step ? paramSchema.step.toString() : (paramSchema.type === 'slider' ? "0.01" : "1");

            if (paramSchema.type === 'slider' && control) {
                control.value = value;
                if (valueDisplay) {
                    const precision = stepStr.includes('.') ? stepStr.split('.')[1].length : 0;
                    valueDisplay.textContent = parseFloat(value).toFixed(precision);
                }
            } else if (paramSchema.type === 'vec3') {
                const currentVec = Array.isArray(value) && value.length === 3 ? value : (paramSchema.defaultValue || [0,0,0]);
                currentVec.forEach((compVal, i) => {
                    const compInput = document.getElementById(`dashboard_${uniformName}_${['x','y','z'][i]}`);
                    if (compInput) compInput.value = parseFloat(compVal).toFixed(stepStr.includes('.') ? stepStr.split('.')[1].length : 2); // Default precision 2 for vec components
                });
                if (valueDisplay) valueDisplay.textContent = `[${currentVec.map(v=>parseFloat(v).toFixed(2)).join(',')}]`;
            } else if (paramSchema.type === 'color' && control) {
                const colorArr = Array.isArray(value) && value.length === 3 ? value : (paramSchema.defaultValue || [1,1,1]);
                control.value = this._rgbArrayToHex(colorArr);
                if (valueDisplay) valueDisplay.textContent = control.value;
            }
        });
    }

    syncDashboardToCoreState() {
        const baseParams = this.core.getBaseParameters();
        const currentGeoName = baseParams.geometryName || (this.core.currentGeometry ? this.core.currentGeometry.constructor.name.toLowerCase().replace('geometry', '') : 'hypercube');
        const currentProjName = baseParams.projectionType || (this.core.currentProjection ? this.core.currentProjection.constructor.name.toLowerCase().replace('projection', '') : 'perspective');

        if (this.elements.selectGeometry && currentGeoName) this.elements.selectGeometry.value = currentGeoName;
        if (this.elements.selectProjection && currentProjName) this.elements.selectProjection.value = currentProjName;

        this._initControlsFromCoreState();
        this.updateDynamicParamVisibility();
        this._populatePresetDropdown();
    }

    updateDynamicParamVisibility() {
        if (!this.core || !this.elements.selectGeometry || !this.parameterSchema) return;
        const currentGeoName = this.elements.selectGeometry.value;
        const showAdvanced = this.elements.toggleAdvancedParams ? this.elements.toggleAdvancedParams.checked : false;

        if (this.elements.geometrySpecificParamsContainer) {
            let currentGeoSpecificControls = Array.from(this.elements.geometrySpecificParamsContainer.querySelectorAll('.param-control-group'));
            currentGeoSpecificControls.forEach(el => el.remove());
        }

        this.parameterSchema.forEach(paramSchema => {
            let groupElement = document.querySelector(`.param-control-group[data-param-name="${paramSchema.name}"]`);
            let isGeoSpecificAndRelevant = false;

            if (paramSchema.relevantToGeometries && paramSchema.relevantToGeometries.length > 0) {
                isGeoSpecificAndRelevant = paramSchema.relevantToGeometries.includes(currentGeoName);
                if (isGeoSpecificAndRelevant) {
                    if (!groupElement && this.elements.geometrySpecificParamsContainer) {
                        this.elements.geometrySpecificParamsContainer.insertAdjacentHTML('beforeend', this._createParamControlHtml(paramSchema));
                        this._reAttachListenerForParam(paramSchema);
                        groupElement = document.querySelector(`.param-control-group[data-param-name="${paramSchema.name}"]`);
                    } else if (groupElement && this.elements.geometrySpecificParamsContainer && groupElement.parentElement !== this.elements.geometrySpecificParamsContainer) {
                         this.elements.geometrySpecificParamsContainer.appendChild(groupElement);
                    }
                } else if (groupElement && groupElement.parentElement === this.elements.geometrySpecificParamsContainer) {
                     groupElement.style.display = 'none';
                }
            }

            if (groupElement) {
                let isVisible = true;
                if (paramSchema.relevantToGeometries && paramSchema.relevantToGeometries.length > 0) {
                    isVisible = isGeoSpecificAndRelevant;
                }
                if (isVisible && paramSchema.isAdvanced) {
                    isVisible = showAdvanced;
                }
                groupElement.style.display = isVisible ? 'block' : 'none';
            }
        });
    }

    _reAttachListenerForParam(paramSchema) {
        const controlElement = document.getElementById(`dashboard_${paramSchema.name}`);
        if (controlElement) {
            this._attachControlListener(controlElement, paramSchema);
        } else if (paramSchema.type === 'vec3') {
             document.querySelectorAll(`.param-vec3-component[data-uniform="${paramSchema.name}"]`).forEach(compInput => {
                 this._attachControlListener(compInput, paramSchema);
             });
        }
    }

    _attachControlListener(controlElement, paramSchema) {
        const uniformName = paramSchema.name;
        const valueDisplay = document.getElementById(`dashboard_${uniformName}_value`);
        const stepStr = paramSchema.step ? paramSchema.step.toString() : (paramSchema.type === 'slider' ? "0.01" : "1");
        const precision = stepStr.includes('.') ? stepStr.split('.')[1].length : 0;

        // Clone to remove old listeners, then re-add
        const newControlElement = controlElement.cloneNode(true);
        controlElement.parentNode.replaceChild(newControlElement, controlElement);

        const eventType = (paramSchema.type === 'slider' || paramSchema.type === 'color') ? 'input' : 'change'; // Use 'change' for number inputs if 'input' is too frequent

        newControlElement.addEventListener(eventType, (e) => {
            let valueToUpdate;
            if (paramSchema.type === 'slider' || (paramSchema.type === 'vec3' && e.target.classList.contains('param-vec3-component'))) {
                if (paramSchema.type === 'vec3') {
                    const currentVec3 = [...(this.core.getBaseParameters()[uniformName] || paramSchema.defaultValue)];
                    currentVec3[parseInt(e.target.dataset.componentIndex)] = parseFloat(e.target.value);
                    valueToUpdate = currentVec3;
                    if (valueDisplay) valueDisplay.textContent = `[${currentVec3.map(v=>parseFloat(v).toFixed(2)).join(',')}]`;
                } else { // Slider
                    valueToUpdate = parseFloat(e.target.value);
                    if (valueDisplay) valueDisplay.textContent = valueToUpdate.toFixed(precision);
                }
            } else if (paramSchema.type === 'color') {
                valueToUpdate = this._hexToRgbArray(e.target.value);
                if (valueDisplay) valueDisplay.textContent = e.target.value;
            }
            this.core.updateBaseParameter(uniformName, valueToUpdate);
        });
    }

    _attachCoreEventListeners() {
        if(this.elements.selectGeometry) this.elements.selectGeometry.addEventListener('change', (e) => {
            this.core.setGeometry(e.target.value);
            // syncDashboardToCoreState will be called by HypercubeCore's onStateChangeCallback
        });

        if(this.elements.selectProjection) this.elements.selectProjection.addEventListener('change', (e) => {
            this.core.setProjection(e.target.value);
            // syncDashboardToCoreState will be called by HypercubeCore's onStateChangeCallback
        });

        this.parameterSchema.forEach(paramSchema => {
            this._reAttachListenerForParam(paramSchema);
        });
    }

    _attachUiViewListeners() {
        if(this.elements.toggleAdvancedParams) {
            this.elements.toggleAdvancedParams.addEventListener('change', () => {
                this.isAdvancedModeEnabled = this.elements.toggleAdvancedParams.checked;
                this.updateDynamicParamVisibility();
            });
        }
        if (this.elements.btnLoadPreset) this.elements.btnLoadPreset.addEventListener('click', () => {
            const presetName = this.elements.selectPreset.value;
            if (presetName && this.core.presetManager) this.core.presetManager.loadPresetByName(presetName);
        });
        if (this.elements.btnSavePreset) this.elements.btnSavePreset.addEventListener('click', () => {
            let presetName = this.elements.inputPresetName.value.trim();
            if (!presetName) presetName = prompt("Preset name:", `User Preset ${this.core.presetManager ? this.core.presetManager.userPresets.length + 1 : '1'}`);
            if (!presetName) return;
            if (this.core.presetManager) {
                const savedPreset = this.core.presetManager.saveCurrentSettingsAsUserPreset(presetName);
                if (savedPreset) { this.elements.inputPresetName.value = ''; this._populatePresetDropdown(); this.elements.selectPreset.value = savedPreset.name; }
            }
        });
        if(this.elements.btnExportPresets && this.elements.textareaImportExport) this.elements.btnExportPresets.addEventListener('click', () => {
            if (this.core.presetManager) this.elements.textareaImportExport.value = this.core.presetManager.exportUserPresetsToString();
        });
        if(this.elements.btnImportPresets && this.elements.textareaImportExport) this.elements.btnImportPresets.addEventListener('click', () => {
            const jsonString = this.elements.textareaImportExport.value;
            if (jsonString.trim() && this.core.presetManager) {
                this.core.presetManager.importUserPresetsFromString(jsonString);
                this._populatePresetDropdown(); this.elements.textareaImportExport.value = '';
            }
        });
    }

    startRealtimeDisplay() {
        setInterval(() => {
            if (!this.core || !this.elements.realtimeValuesDisplay || !this.valid) return;
            const effectiveParams = this.core.getEffectiveParametersForDashboard();
            let html = '<ul>';
            this.parameterSchema.forEach(paramSchema => {
                const key = paramSchema.name;
                if (effectiveParams.hasOwnProperty(key)) {
                    let value = effectiveParams[key];
                    const stepStr = paramSchema.step ? paramSchema.step.toString() : (paramSchema.type === 'slider' ? "0.01" : (paramSchema.type === 'vec3' ? "0.01" : "1"));
                    const precision = stepStr.includes('.') ? stepStr.split('.')[1].length : (paramSchema.type === 'vec3' || paramSchema.type === 'color' ? 2:0) ;

                    if (typeof value === 'number') value = value.toFixed(precision);
                    else if (Array.isArray(value)) value = `[${value.map(v => typeof v === 'number' ? v.toFixed(precision) : v).join(', ')}]`;
                    html += `<li><strong style='color:#aaa'>${paramSchema.label || key}:</strong> ${value}</li>`;
                }
            });
            if(effectiveParams.u_time !== undefined) html += `<li><strong style='color:#aaa'>u_time:</strong> ${effectiveParams.u_time.toFixed(2)}</li>`;
            if(effectiveParams.u_mouse) html += `<li><strong style='color:#aaa'>u_mouse:</strong> [${effectiveParams.u_mouse[0].toFixed(2)}, ${effectiveParams.u_mouse[1].toFixed(2)}]</li>`;
            html += '</ul>';
            this.elements.realtimeValuesDisplay.innerHTML = html;

            if (this.elements.pulseBass) this.elements.pulseBass.value = effectiveParams.u_audioBass || 0;
            if (this.elements.pulseMid) this.elements.pulseMid.value = effectiveParams.u_audioMid || 0;
            if (this.elements.pulseHigh) this.elements.pulseHigh.value = effectiveParams.u_audioHigh || 0;
        }, 333);
    }
}
