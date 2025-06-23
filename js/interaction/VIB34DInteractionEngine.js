/**
 * VIB34DInteractionEngine
 *
 * Processes raw user inputs (scroll, click, mouse move, touch) and provides structured data
 * about these interactions, including intensity, velocity, patterns, and idle state.
 * This version moves beyond a simple placeholder to implement more realistic event handling.
 *
 * Real implementation details:
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
                velocity: 0.0,          // Normalized scroll speed
                direction: 0,           // -1 for up, 1 for down, 0 for none
                intensity: 0.0,         // Normalized intensity (0-1)
                rawDeltaY: 0,           // Last raw deltaY
                isWheeling: false,      // True during a wheel event sequence
            },
            clickHold: {
                isMouseDown: false,       // Is mouse button currently pressed
                isHolding: false,         // Has it been held long enough to be a "hold"
                holdStartTime: 0,
                duration: 0.0,          // How long the click has been held (seconds)
                intensity: 0.0,         // Normalized intensity (0-1), e.g., based on duration or pressure
                clickCount: 0,          // Number of clicks in a short burst for double/triple click detection
                lastClickTime: 0,       // Timestamp of the last mousedown event
                position: { x: 0, y: 0} // Position of last mousedown
            },
            mouseMovement: {
                isActive: false,        // True if mouse is moving
                rawX: 0, rawY: 0,        // Raw coords on canvas
                normalizedX: 0.0, normalizedY: 0.0, // Position relative to canvas [0-1]
                velocityX: 0.0,         // Velocity of mouse movement in X (canvas units per second)
                velocityY: 0.0,         // Velocity of mouse movement in Y (canvas units per second)
                intensity: 0.0,         // Normalized intensity (0-1) based on velocity
                isHovering: false,      // Is mouse over the canvas
            },
            touch: { // Basic touch support, can be expanded for gestures
                isActive: false,        // True if one or more fingers are touching
                touchCount: 0,
                primaryTouch: { id: null, x:0, y:0, normalizedX:0, normalizedY:0, velocityX:0, velocityY:0, intensity:0 },
                // Potentially store all active touches in an array/map
            },
            idle: {
                isIdle: true,
                timeSinceLastActive: 0.0, // Seconds since last significant interaction
                decayFactor: 1.0,         // 1 when active, decays towards 0 when idle
            },
            pattern: { // Pattern analysis remains conceptual for now
                type: 'casual', // 'casual', 'rhythmic', 'intense', 'precise'
                confidence: 0.0,
            },
            // Derived values for direct use as u_audio* uniforms
            audioBass: 0.0,
            audioMid: 0.0,
            audioHigh: 0.0,
        };

        // Configuration
        this.idleTimeoutDuration = 3.0; // Seconds to consider idle
        this.scrollIntensityFactor = 0.01; // Adjusts sensitivity of scroll intensity
        this.scrollVelocityFactor = 0.02;
        this.mouseIntensityFactor = 0.1; // Adjusts sensitivity of mouse movement intensity (normalized speed of 10 canvas units/sec = full intensity)
        this.holdThresholdDuration = 0.3; // Seconds to consider a mousedown a "hold"
        this.multiClickThreshold = 300; // ms for detecting multiple clicks
        this.activityResetTimeout = 150; // ms to reset 'isActive' flags for mouse/scroll


        // Internal state
        this.lastActivityTime = performance.now();
        this.mouseMoveTimeoutId = null;
        this.scrollTimeoutId = null;
        this.clickHoldTimeoutId = null;

        this.prevMouseX = 0; this.prevMouseY = 0; this.prevMouseTime = 0;
        this.prevScrollTime = 0;
        this.activeTouches = new Map(); // For tracking multiple touches

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Scroll
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });

        // Mouse Click/Hold
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        document.addEventListener('mouseup', this.handleGlobalMouseUp.bind(this)); // Catch mouseup outside canvas

        // Mouse Movement & Hover
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));

        // Touch Events
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this)); // Treat cancel like end
    }

    // --- Event Handlers ---

    handleWheel(event) {
        event.preventDefault();
        this.recordActivity();
        const scrollData = this.interactionData.scroll;
        scrollData.isWheeling = true;
        scrollData.isActive = true;
        scrollData.rawDeltaY = event.deltaY;

        const currentTime = performance.now();
        const deltaTime = this.prevScrollTime ? (currentTime - this.prevScrollTime) / 1000 : 0.016; // Avoid 0 delta
        this.prevScrollTime = currentTime;

        // More robust velocity: deltaY per second
        const currentVelocity = event.deltaY / Math.max(deltaTime, 0.001); // pixels/sec
        scrollData.velocity = Math.min(Math.abs(currentVelocity) * this.scrollVelocityFactor, 1.0);
        scrollData.direction = Math.sign(event.deltaY);
        scrollData.intensity = Math.min(Math.abs(event.deltaY) * this.scrollIntensityFactor, 1.0);

        this.interactionData.audioBass = scrollData.intensity;

        clearTimeout(this.scrollTimeoutId);
        this.scrollTimeoutId = setTimeout(() => {
            scrollData.isActive = false;
            scrollData.isWheeling = false;
            scrollData.intensity = 0.0;
            scrollData.velocity = 0.0;
            this.interactionData.audioBass = 0.0;
        }, this.activityResetTimeout);
    }

    handleMouseDown(event) {
        this.recordActivity();
        const clickData = this.interactionData.clickHold;
        clickData.isMouseDown = true;
        clickData.holdStartTime = performance.now();
        clickData.position = { x: event.offsetX, y: event.offsetY };

        const now = performance.now();
        if ((now - clickData.lastClickTime) < this.multiClickThreshold) {
            clickData.clickCount++;
        } else {
            clickData.clickCount = 1;
        }
        clickData.lastClickTime = now;

        // Start a timer to check for 'hold'
        clearTimeout(this.clickHoldTimeoutId);
        this.clickHoldTimeoutId = setTimeout(() => {
            if (clickData.isMouseDown) { // Still holding
                clickData.isHolding = true;
                // Initial intensity for hold, can be updated in main `update` loop
                clickData.duration = (performance.now() - clickData.holdStartTime) / 1000;
                clickData.intensity = Math.min(clickData.duration / 2.0, 1.0); // Example: 2s for full intensity
                this.interactionData.audioMid = clickData.intensity;
            }
        }, this.holdThresholdDuration * 1000);
    }

    handleMouseUp(event) {
        const clickData = this.interactionData.clickHold;
        if (clickData.isMouseDown) {
            this.recordActivity();
            clickData.isMouseDown = false;
            clickData.duration = (performance.now() - clickData.holdStartTime) / 1000;

            if (clickData.isHolding) { // Was a hold
                // Intensity might have already been set, or finalize it here
                clickData.intensity = Math.min(clickData.duration / 2.0, 1.0);
            } else { // Was a click
                clickData.intensity = 0.5; // Arbitrary intensity for a click
                 // If you want click intensity to be brief:
                 setTimeout(() => {
                    if (!clickData.isMouseDown) { // ensure not immediately clicked again
                        clickData.intensity = 0.0;
                        this.interactionData.audioMid = 0.0;
                    }
                 }, this.activityResetTimeout/2);
            }
            this.interactionData.audioMid = clickData.intensity;

            clickData.isHolding = false;
            clearTimeout(this.clickHoldTimeoutId);

            // Decay audioMid if it's not a hold
            if(clickData.duration < this.holdThresholdDuration){
                 setTimeout(() => {
                    if (!clickData.isMouseDown) {
                        this.interactionData.audioMid = 0.0;
                        clickData.intensity = 0.0;
                    }
                }, this.activityResetTimeout);
            }
        }
    }

    handleGlobalMouseUp(event) {
        if (event.target !== this.canvas && this.interactionData.clickHold.isMouseDown) {
            this.handleMouseUp(event);
        }
    }

    handleMouseMove(event) {
        this.recordActivity();
        const moveData = this.interactionData.mouseMovement;
        moveData.isActive = true;
        moveData.isHovering = true;

        const rect = this.canvas.getBoundingClientRect();
        const currentTime = performance.now();
        // Ensure prevMouseTime is initialized for the first move event after a pause
        if (this.prevMouseTime === 0) this.prevMouseTime = currentTime - 16; // Assume 16ms before if not set

        const deltaTime = (currentTime - this.prevMouseTime) / 1000.0;

        moveData.rawX = event.clientX - rect.left;
        moveData.rawY = event.clientY - rect.top;
        moveData.normalizedX = Math.max(0, Math.min(1, moveData.rawX / this.canvas.width));
        moveData.normalizedY = 1.0 - Math.max(0, Math.min(1, moveData.rawY / this.canvas.height));


        if (deltaTime > 0.001) { // Min time delta to calculate velocity
            const dX = moveData.rawX - this.prevMouseX;
            const dY = moveData.rawY - this.prevMouseY;
            moveData.velocityX = dX / deltaTime; // px/s
            moveData.velocityY = dY / deltaTime; // px/s

            const speed = Math.sqrt(dX*dX + dY*dY) / deltaTime; // px/s
            // Normalize intensity (e.g. speed of 1000px/s = full intensity)
            moveData.intensity = Math.min(speed * this.mouseIntensityFactor / 100, 1.0);
            this.interactionData.audioHigh = moveData.intensity;
        }

        this.prevMouseX = moveData.rawX;
        this.prevMouseY = moveData.rawY;
        this.prevMouseTime = currentTime;

        clearTimeout(this.mouseMoveTimeoutId);
        this.mouseMoveTimeoutId = setTimeout(() => {
            moveData.isActive = false;
            moveData.intensity = 0.0;
            moveData.velocityX = 0.0;
            moveData.velocityY = 0.0;
            this.interactionData.audioHigh = 0.0;
            this.prevMouseTime = 0; // Reset for next movement burst
        }, this.activityResetTimeout);
    }

    handleMouseEnter(event) {
        this.recordActivity();
        this.interactionData.mouseMovement.isHovering = true;
        this.prevMouseX = event.offsetX; // Initialize mouse position on enter
        this.prevMouseY = event.offsetY;
        this.prevMouseTime = performance.now();
    }

    handleMouseLeave(event) {
        this.recordActivity(); // Leaving is an activity
        const moveData = this.interactionData.mouseMovement;
        moveData.isHovering = false;
        moveData.isActive = false; // Stop active movement
        moveData.intensity = 0.0;
        moveData.velocityX = 0.0;
        moveData.velocityY = 0.0;
        this.interactionData.audioHigh = 0.0;
        clearTimeout(this.mouseMoveTimeoutId); // Clear any pending stop
        this.prevMouseTime = 0; // Reset for next movement burst
    }

    // --- Touch Event Handlers (Basic Implementation) ---
    handleTouchStart(event) {
        event.preventDefault();
        this.recordActivity();
        this.interactionData.touch.isActive = true;

        for (let i=0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            this.activeTouches.set(touch.identifier, {
                startX: touch.clientX, startY: touch.clientY,
                prevX: touch.clientX, prevY: touch.clientY,
                prevTime: performance.now()
            });
        }
        this.interactionData.touch.touchCount = this.activeTouches.size;

        if (this.activeTouches.size === 1) {
            const firstTouch = event.changedTouches[0];
            const primary = this.interactionData.touch.primaryTouch;
            primary.id = firstTouch.identifier;
            // Simulate mousedown for the first touch
            this.handleMouseDown({ offsetX: firstTouch.clientX - this.canvas.getBoundingClientRect().left, offsetY: firstTouch.clientY - this.canvas.getBoundingClientRect().top });
        }
    }

    handleTouchMove(event) {
        event.preventDefault();
        this.recordActivity();
        if (!this.interactionData.touch.isActive) return;

        for (let i=0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            const touchState = this.activeTouches.get(touch.identifier);
            if (!touchState) continue;

            const rect = this.canvas.getBoundingClientRect();
            const currentTime = performance.now();
            const deltaTime = (currentTime - touchState.prevTime) / 1000.0;

            const currentX = touch.clientX - rect.left;
            const currentY = touch.clientY - rect.top;

            if (touch.identifier === this.interactionData.touch.primaryTouch.id) {
                const primary = this.interactionData.touch.primaryTouch;
                primary.x = currentX;
                primary.y = currentY;
                primary.normalizedX = Math.max(0, Math.min(1, currentX / this.canvas.width));
                primary.normalizedY = 1.0 - Math.max(0, Math.min(1, currentY / this.canvas.height));

                if (deltaTime > 0.001) {
                    const dX = touch.clientX - touchState.prevX; // Using clientX for delta before normalization
                    const dY = touch.clientY - touchState.prevY;
                    primary.velocityX = dX / deltaTime; // px/s
                    primary.velocityY = dY / deltaTime; // px/s
                    const speed = Math.sqrt(dX*dX + dY*dY) / deltaTime;
                    primary.intensity = Math.min(speed * this.mouseIntensityFactor / 100, 1.0); // Reuse mouse factor
                    this.interactionData.audioHigh = primary.intensity; // Map primary touch like mouse
                }
                 // Simulate mousemove for primary touch
                this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
            }
            touchState.prevX = touch.clientX;
            touchState.prevY = touch.clientY;
            touchState.prevTime = currentTime;
        }
    }

    handleTouchEnd(event) {
        // event.preventDefault(); // May not be needed or desirable for touchend/cancel
        this.recordActivity();

        for (let i=0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            if (touch.identifier === this.interactionData.touch.primaryTouch.id) {
                // Simulate mouseup for the primary touch
                this.handleMouseUp({offsetX: this.interactionData.touch.primaryTouch.x, offsetY: this.interactionData.touch.primaryTouch.y});
                this.interactionData.touch.primaryTouch = { id: null, x:0, y:0, normalizedX:0, normalizedY:0, velocityX:0, velocityY:0, intensity:0 };
                this.interactionData.audioHigh = 0.0; // Reset if primary touch ended
            }
            this.activeTouches.delete(touch.identifier);
        }

        this.interactionData.touch.touchCount = this.activeTouches.size;
        if (this.activeTouches.size === 0) {
            this.interactionData.touch.isActive = false;
        } else {
            // If primary touch ended but other touches remain, assign a new primary if desired.
            // For now, simple: if no primary, no primary-mapped interactions.
        }
    }


    // --- Core Logic ---
    recordActivity() {
        this.lastActivityTime = performance.now();
        this.interactionData.idle.isIdle = false;
        this.interactionData.idle.decayFactor = 1.0;
        // Basic pattern reset, more sophisticated logic needed for real pattern analysis
        // if (this.interactionData.pattern.type !== 'rhythmic' && this.interactionData.pattern.type !== 'intense') {
        //      this.interactionData.pattern.type = 'casual';
        //      this.interactionData.pattern.confidence = 0.5;
        // }
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
