/**
 * VIB34DInteractionEngine (Placeholder)
 *
 * Simulates an interaction engine that processes raw user inputs (scroll, click, mouse move)
 * and provides structured data about these interactions, including intensity, velocity,
 * patterns, and idle state.
 *
 * In a real implementation, this engine would:
 * - Attach event listeners to the canvas or document.
 * - Track raw event data over time.
 * - Calculate velocity, intensity, and duration for different interactions.
 * - Implement logic for idle detection (e.g., using timers).
 * - Analyze sequences of interactions for patterns (e.g., rhythmic clicking, precise movements).
 */
class VIB34DInteractionEngine {
    constructor(canvas) {
        this.canvas = canvas; // Canvas might be used for relative mouse coords

        // Simulated interaction data structure
        this.interactionData = {
            scroll: {
                isActive: false,
                velocity: 0.0,      // Speed of scrolling
                direction: 0,       // -1 for up, 1 for down
                intensity: 0.0,     // Normalized intensity (0-1) based on velocity/amount
                rawDeltaY: 0,
            },
            clickHold: {
                isHolding: false,
                duration: 0.0,      // How long the click has been held (seconds)
                intensity: 0.0,     // Normalized intensity (0-1), e.g., based on duration
                clickCount: 0,      // Number of clicks in a short burst
                lastClickTime: 0,
            },
            mouseMovement: {
                isActive: false,
                rawX: 0,
                rawY: 0,
                normalizedX: 0.0,   // Position relative to canvas [0-1]
                normalizedY: 0.0,   // Position relative to canvas [0-1]
                velocityX: 0.0,     // Velocity of mouse movement in X
                velocityY: 0.0,     // Velocity of mouse movement in Y
                intensity: 0.0,     // Normalized intensity (0-1) based on velocity
            },
            idle: {
                isIdle: true,
                timeSinceLastActive: 0.0, // Seconds since last significant interaction
                decayFactor: 1.0,         // 1 when active, decays towards 0 when idle
            },
            pattern: {
                type: 'casual', // 'casual', 'rhythmic', 'intense', 'precise'
                confidence: 0.0,
            },
            // Raw values that HypercubeCore might directly use for u_audio* uniforms
            // These would be mapped from the above interaction details by this engine.
            // For example, scroll intensity -> u_audioBass
            // click/hold intensity -> u_audioMid
            // mouse movement intensity -> u_audioHigh
            // This is a simplified mapping for the placeholder.
            audioBass: 0.0, // Mapped from scroll.intensity
            audioMid: 0.0,  // Mapped from clickHold.intensity
            audioHigh: 0.0, // Mapped from mouseMovement.intensity
        };

        this.idleTimeout = 3.0; // Seconds to consider idle
        this.lastActivityTime = performance.now();
        this.mouseMoveTimeoutId = null;
        this.scrollTimeoutId = null;

        // Placeholder for previous mouse position for velocity calculation
        this.prevMouseX = 0;
        this.prevMouseY = 0;
        this.prevMouseTime = performance.now();

        this.setupEventListeners();

        // Start an update loop if continuous processing is needed (e.g., for idle decay)
        // For this placeholder, we'll make updates event-driven or rely on an external ticker.
        // setInterval(this.update.bind(this), 100); // Example internal update
    }

    setupEventListeners() {
        // Scroll
        this.canvas.addEventListener('wheel', this.handleScroll.bind(this), { passive: false });

        // Click/Hold
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        document.addEventListener('mouseup', this.handleGlobalMouseUp.bind(this)); // Catch mouseup outside canvas

        // Mouse Movement
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    }

    handleScroll(event) {
        event.preventDefault();
        this.recordActivity();
        this.interactionData.scroll.isActive = true;
        this.interactionData.scroll.rawDeltaY = event.deltaY;

        const scrollAmount = Math.abs(event.deltaY);
        this.interactionData.scroll.velocity = Math.min(scrollAmount / 50, 1.0); // Normalize somewhat
        this.interactionData.scroll.direction = Math.sign(event.deltaY);
        this.interactionData.scroll.intensity = Math.min(scrollAmount / 100, 1.0); // Normalize intensity

        this.interactionData.audioBass = this.interactionData.scroll.intensity;

        // Reset scroll activity after a short timeout
        clearTimeout(this.scrollTimeoutId);
        this.scrollTimeoutId = setTimeout(() => {
            this.interactionData.scroll.isActive = false;
            this.interactionData.scroll.intensity = 0.0;
            this.interactionData.scroll.velocity = 0.0;
            this.interactionData.audioBass = 0.0;
        }, 150);
    }

    handleMouseDown(event) {
        this.recordActivity();
        this.interactionData.clickHold.isHolding = true;
        this.interactionData.clickHold.startTime = performance.now();
        this.interactionData.clickHold.clickCount++; // Basic click counter

        // Simple rhythmic detection (e.g., multiple clicks in short succession)
        const now = performance.now();
        if (this.interactionData.clickHold.lastClickTime && (now - this.interactionData.clickHold.lastClickTime < 500)) {
            // If clicks are close, could indicate rhythmic pattern
            if (this.interactionData.clickHold.clickCount > 2) {
                this.interactionData.pattern.type = 'rhythmic';
                this.interactionData.pattern.confidence = Math.min(this.interactionData.clickHold.clickCount / 5, 1.0);
            }
        } else {
            this.interactionData.clickHold.clickCount = 1; // Reset if too much time passed
        }
        this.interactionData.clickHold.lastClickTime = now;
    }

    handleMouseUp(event) {
        if (this.interactionData.clickHold.isHolding) {
            this.recordActivity();
            this.interactionData.clickHold.isHolding = false;
            const holdDuration = (performance.now() - this.interactionData.clickHold.startTime) / 1000;
            this.interactionData.clickHold.duration = holdDuration;
            // Intensity based on hold duration, up to a max (e.g. 2 seconds for full intensity)
            this.interactionData.clickHold.intensity = Math.min(holdDuration / 2.0, 1.0);
            this.interactionData.audioMid = this.interactionData.clickHold.intensity;

            // Decay intensity after release
            setTimeout(() => {
                this.interactionData.clickHold.intensity = 0.0;
                this.interactionData.audioMid = 0.0;
            }, 200); // Decay after 200ms
        }
    }

    handleGlobalMouseUp(event) { // Ensure mouse up is caught even if outside canvas
        if (event.target !== this.canvas) {
            if (this.interactionData.clickHold.isHolding) {
                 this.handleMouseUp(event); // Call the local handler
            }
        }
    }

    handleMouseMove(event) {
        this.recordActivity();
        this.interactionData.mouseMovement.isActive = true;

        const rect = this.canvas.getBoundingClientRect();
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.prevMouseTime) / 1000; // seconds

        const currentX = event.clientX - rect.left;
        const currentY = event.clientY - rect.top;

        this.interactionData.mouseMovement.rawX = currentX;
        this.interactionData.mouseMovement.rawY = currentY;
        this.interactionData.mouseMovement.normalizedX = currentX / this.canvas.width;
        this.interactionData.mouseMovement.normalizedY = 1.0 - (currentY / this.canvas.height); // Invert Y

        if (deltaTime > 0.001) { // Avoid division by zero or stale data
            const deltaX = currentX - this.prevMouseX;
            const deltaY = currentY - this.prevMouseY;
            this.interactionData.mouseMovement.velocityX = deltaX / deltaTime / this.canvas.width; // Normalize by canvas width
            this.interactionData.mouseMovement.velocityY = deltaY / deltaTime / this.canvas.height; // Normalize by canvas height

            const speed = Math.sqrt(
                this.interactionData.mouseMovement.velocityX**2 +
                this.interactionData.mouseMovement.velocityY**2
            );
            // Intensity based on speed, normalized (e.g., speed of 1.0 full canvas width/sec = full intensity)
            this.interactionData.mouseMovement.intensity = Math.min(speed / 10.0, 1.0); // Adjust sensitivity
            this.interactionData.audioHigh = this.interactionData.mouseMovement.intensity;
        }

        this.prevMouseX = currentX;
        this.prevMouseY = currentY;
        this.prevMouseTime = currentTime;

        // Pattern detection (simplified)
        if (this.interactionData.mouseMovement.intensity > 0.7) {
            this.interactionData.pattern.type = 'intense';
            this.interactionData.pattern.confidence = this.interactionData.mouseMovement.intensity;
        } else if (this.interactionData.mouseMovement.intensity < 0.1 && this.interactionData.mouseMovement.intensity > 0.01) {
            // this.interactionData.pattern.type = 'precise'; // Could be slow, precise movement
            // this.interactionData.pattern.confidence = 1.0 - this.interactionData.mouseMovement.intensity / 0.1;
        }


        clearTimeout(this.mouseMoveTimeoutId);
        this.mouseMoveTimeoutId = setTimeout(() => {
            this.interactionData.mouseMovement.isActive = false;
            this.interactionData.mouseMovement.intensity = 0.0;
            this.interactionData.mouseMovement.velocityX = 0.0;
            this.interactionData.mouseMovement.velocityY = 0.0;
            this.interactionData.audioHigh = 0.0;
        }, 150); // Mouse movement considered stopped after 150ms
    }

    handleMouseLeave(event) {
        // Optional: Treat mouse leave as stop of movement
        // this.interactionData.mouseMovement.isActive = false;
        // this.interactionData.mouseMovement.intensity = 0.0;
        // this.interactionData.audioHigh = 0.0;
    }

    recordActivity() {
        this.lastActivityTime = performance.now();
        this.interactionData.idle.isIdle = false;
        this.interactionData.idle.decayFactor = 1.0;
        if (this.interactionData.pattern.type !== 'rhythmic' && this.interactionData.pattern.type !== 'intense') {
             this.interactionData.pattern.type = 'casual'; // Reset pattern if not strongly typed
             this.interactionData.pattern.confidence = 0.5;
        }
    }

    /**
     * Update method, called periodically (e.g., by requestAnimationFrame in HypercubeCore or setInterval).
     * Used here mainly for idle detection and decay.
     */
    update() {
        const now = performance.now();
        const timeSinceLast = (now - this.lastActivityTime) / 1000;
        this.interactionData.idle.timeSinceLastActive = timeSinceLast;

        if (timeSinceLast > this.idleTimeout) {
            if (!this.interactionData.idle.isIdle) {
                this.interactionData.idle.isIdle = true;
                this.interactionData.pattern.type = 'casual'; // Reset pattern on idle
                this.interactionData.pattern.confidence = 0.0;
            }
        }

        if (this.interactionData.idle.isIdle) {
            // Decay factor can smoothly transition parameters affected by idle state
            this.interactionData.idle.decayFactor = Math.max(0, 1.0 - (timeSinceLast - this.idleTimeout) / (this.idleTimeout * 2));
        } else {
            this.interactionData.idle.decayFactor = 1.0;
        }

        // If click/hold is active, update its duration and intensity
        if (this.interactionData.clickHold.isHolding) {
            const holdDuration = (performance.now() - this.interactionData.clickHold.startTime) / 1000;
            this.interactionData.clickHold.duration = holdDuration;
            this.interactionData.clickHold.intensity = Math.min(holdDuration / 2.0, 1.0);
            this.interactionData.audioMid = this.interactionData.clickHold.intensity; // Keep u_audioMid high while holding
        }
    }

    /**
     * Returns the current state of all interaction data.
     * @returns {object}
     */
    getInteractionState() {
        // Call update to ensure idle state is current before returning
        this.update();
        return this.interactionData;
    }

    destroy() {
        // Remove event listeners
        this.canvas.removeEventListener('wheel', this.handleScroll);
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('mouseup', this.handleGlobalMouseUp);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);

        clearTimeout(this.mouseMoveTimeoutId);
        clearTimeout(this.scrollTimeoutId);
        // Clear any intervals if used
    }
}

// Example Usage (Conceptual - typically HypercubeCore would own and call this)
/*
let interactionEngine; // Assuming canvas is available
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('hypercubeCanvas'); // Make sure this exists
    if (canvas) {
        interactionEngine = new VIB34DInteractionEngine(canvas);

        function gameLoop() {
            // interactionEngine.update(); // Call this in your main loop if it has continuous logic
            const interactions = interactionEngine.getInteractionState();
            // console.log(interactions.mouseMovement.intensity, interactions.audioHigh);
            // console.log(interactions.scroll.intensity, interactions.audioBass);
            // console.log(interactions.clickHold.intensity, interactions.audioMid);
            // console.log("Is Idle:", interactions.idle.isIdle, "Decay:", interactions.idle.decayFactor);
            // console.log("Pattern:", interactions.pattern.type);

            // Update HypercubeCore parameters based on interactions.audioBass, .audioMid, .audioHigh
            // hypercubeCore.updateParameter('u_audioBass', interactions.audioBass);
            // hypercubeCore.updateParameter('u_audioMid', interactions.audioMid);
            // hypercubeCore.updateParameter('u_audioHigh', interactions.audioHigh);

            requestAnimationFrame(gameLoop);
        }
        // requestAnimationFrame(gameLoop); // Start if you have a game loop
    }
});
*/
