// digital-magazine/js/article-transitions.js

const FADE_DURATION = 300; // ms, should match CSS transition duration

/**
 * Fades out the page and then navigates to the given URL.
 * @param {string} url - The URL to navigate to after fade out.
 */
export function fadeOutPageAndNavigate(url) {
    document.body.classList.add('page-fade-out');
    setTimeout(() => {
        window.location.href = url;
        // Note: The new page will need to call fadeInPage or remove the class.
        // For a true SPA, state management would handle this better.
    }, FADE_DURATION);
}

/**
 * Fades in the page by removing the fade-out class.
 * Should be called when the new page content is ready.
 */
export function fadeInPage() {
    // Ensure this is called after a slight delay if needed for rendering,
    // or ensure body starts transparent and then fades in.
    // For now, we assume the class is added before load by the previous page's fadeOut.
    // Or, if not, we add a class that makes it initially transparent then fades in.

    if (document.body.classList.contains('page-fade-out')) {
        // If navigating from a page that faded out
        document.body.classList.remove('page-fade-out'); // This will trigger CSS transition back to opacity 1
    } else {
        // If it's a direct load, ensure it starts transparent and fades in
        document.body.style.opacity = '0'; // Start transparent
        document.body.classList.add('page-fade-in-on-load'); // Add class for fade-in animation
        // Force reflow if needed, though usually not for opacity
        // void document.body.offsetWidth;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => { // Double requestAnimationFrame for some browsers
                 document.body.style.opacity = '1';
            });
        });
    }
}

/**
 * To be called from main.js on every page load to handle the fade-in.
 */
export function initializePageFadeEffect() {
    // If the page was navigated to via fadeOutPageAndNavigate,
    // the 'page-fade-out' class would still be on the body from the *previous* page's state,
    // which isn't how multi-page app transitions work.
    // A better approach for multi-page:
    // 1. Start every page with body opacity 0 (via CSS).
    // 2. JS on load fades it in.
    // 3. Link clicks fade out, then navigate.

    // Let's simplify:
    // CSS will set body to opacity 0 initially.
    // This function will just trigger the fade-in.
    document.body.classList.add('page-loaded'); // CSS will transition opacity to 1
}
