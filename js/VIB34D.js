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

        this.transition = null; // Stores active transition details

        this.initCanvas();
        this.startRenderLoop();

        console.log(`VIB34D instance ${this.id} created for element:`, containerElement);
    }

    initCanvas() {
        this.canvas = document.createElement('canvas');
        this.containerElement.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d'); // Placeholder for WebGL

        // Ensure canvas is styled to be behind content if necessary
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
        if (!this.ctx) return;

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

        // Placeholder 2D rendering logic:
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Use currentParams for rendering
        const color = this.currentParams.color || [0.2, 0.2, 0.2, 1.0]; // Default color
        // Ensure color is a string for 2D context fillStyle
        let r = Math.floor((color[0] || 0) * 255);
        let g = Math.floor((color[1] || 0) * 255);
        let b = Math.floor((color[2] || 0) * 255);
        let a = color[3] === undefined ? 1 : color[3];
        this.ctx.fillStyle = `rgba(${r},${g},${b},${a})`;

        const intensity = this.currentParams.intensity || 0.5; // Default intensity
        const size = (this.canvas.width / 4) * intensity * (this.currentParams.scale || 1.0);

        this.ctx.beginPath();
        // Example: render a circle or rectangle based on 'shape' param
        if (this.currentParams.shape === 'quad' || this.currentParams.shape === 'plane') {
            this.ctx.fillRect(this.canvas.width / 2 - size / 2, this.canvas.height / 2 - size / 2, size, size);
        } else { // Default to 'cube' (represented as circle here) or unknown
            this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, size / 2, 0, 2 * Math.PI);
        }
        this.ctx.fill();

        // Display current parameters for debugging
        this.ctx.fillStyle = 'white';
        this.ctx.font = '10px Arial';
        this.ctx.fillText(`ID: ${this.id}`, 5, 10);
        let yOffset = 20;
        for(const key in this.currentParams){
            if(typeof this.currentParams[key] !== 'function' && typeof this.currentParams[key] !== 'object' || Array.isArray(this.currentParams[key])){
                 this.ctx.fillText(`${key}: ${Array.isArray(this.currentParams[key]) ? JSON.stringify(this.currentParams[key].map(v => typeof v === 'number' ? v.toFixed(2) : v )) : this.currentParams[key]}`, 5, yOffset);
                 yOffset += 10;
            }
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
