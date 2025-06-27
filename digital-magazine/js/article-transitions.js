// digital-magazine/js/article-transitions.js

export const PAGE_TRANSITION_DURATION = 300; // ms, should match CSS --page-transition-duration

/**
 * Initiates a simple fade-out transition and then navigates.
 * @param {string} url - The URL to navigate to.
 */
export function navigateWithSimpleFade(url) {
    document.body.classList.add('page-fade-out');
    setTimeout(() => {
        window.location.href = url;
    }, PAGE_TRANSITION_DURATION);
}

/**
 * Initializes the page by triggering a fade-in.
 * Assumes CSS sets body to opacity: 0 initially.
 */
export function fadeInPage() {
    document.body.classList.remove('page-fade-out'); // Remove if present from bfcache
    document.body.classList.add('page-fade-in'); // Add class to trigger CSS opacity transition to 1
}


/**
 * Initiates a geometric wipe transition (covering the screen) and then navigates.
 * @param {string} url - The URL to navigate to.
 */
export function geometricWipeNavigate(url) {
    let wipeElement = document.getElementById('page-wipe-overlay');
    if (!wipeElement) {
        wipeElement = document.createElement('div');
        wipeElement.id = 'page-wipe-overlay';
        document.body.appendChild(wipeElement);
    }
    wipeElement.className = 'page-wipe-overlay wipe-in'; // Start wipe-in animation

    // Store that we are using wipe for the next page load (conceptual)
    sessionStorage.setItem('Vib3PageTransitionType', 'wipe');

    setTimeout(() => {
        window.location.href = url;
    }, PAGE_TRANSITION_DURATION + 100); // Allow wipe-in to mostly complete
}

/**
 * Initializes page by playing a wipe-out animation if needed, then fading in body.
 */
export function initializePageLoadTransition() {
    const transitionType = sessionStorage.getItem('Vib3PageTransitionType');

    if (transitionType === 'wipe') {
        let wipeElement = document.getElementById('page-wipe-overlay');
        if (!wipeElement) { // If navigating to a new page, wipe element needs to exist for wipe-out
            wipeElement = document.createElement('div');
            wipeElement.id = 'page-wipe-overlay';
            document.body.appendChild(wipeElement);
            wipeElement.classList.add('page-wipe-overlay'); // Ensure base style
            wipeElement.classList.add('wipe-in'); // Assume it just finished wiping in
        }

        // Ensure body is hidden initially, then trigger wipe-out, then fade in body
        document.body.classList.remove('page-fade-in'); // Ensure body is initially hidden by CSS (opacity 0)

        requestAnimationFrame(() => { // Allow potential wipe-in to render if it's a fast back-nav
            wipeElement.className = 'page-wipe-overlay wipe-out'; // Start wipe-out animation
            setTimeout(() => {
                if (wipeElement.parentNode) wipeElement.parentNode.removeChild(wipeElement);
                fadeInPage(); // Now fade in the body content
                sessionStorage.removeItem('Vib3PageTransitionType');
            }, PAGE_TRANSITION_DURATION * 1.2 + 50); // Match wipe-out CSS duration + small buffer
        });
    } else {
        // Default to simple fade-in for direct loads or non-wipe transitions
        fadeInPage();
        sessionStorage.removeItem('Vib3PageTransitionType');
    }
}
