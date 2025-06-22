import { VIB3StyleSystem } from './VIB3StyleSystem.js';
import { loadSiteMeta, loadFeaturedArticle, loadLatestArticles } from './content-loader.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM fully loaded and parsed. Initializing Vib3code Digital Magazine Systems...");

    // Initialize VIB3StyleSystem first, as content loading might add elements
    // that need to be styled or made interactive by VIB3, or VIB3 might affect layout.
    // However, VIB3 scans on init. Dynamically added elements won't be picked up
    // without a re-scan or explicit initialization call to VIB3 system.
    // For Phase 2, we assume placeholders are styled, and newly created elements
    // by content-loader will have data-attributes but might not be fully VIB3-active yet.

    const vib3System = new VIB3StyleSystem();
    // Store it globally if content-loader needs to hint at re-scanning (conceptual for now)
    // window.Vib3codeApp = { vib3System };

    try {
        await vib3System.init('../presets.json'); // Path relative to digital-magazine/js/
        console.log("Vib3code VIB3StyleSystem initialized successfully.");

        // Load content after VIB3 system is ready (or at least its presets are loaded)
        await loadSiteMeta();
        await loadFeaturedArticle('ema-report-monolith'); // Default featured article
        await loadLatestArticles(3); // Load up to 3 latest articles

        // After content is loaded, if VIB3StyleSystem had a method to process new elements,
        // it would be called here. e.g.:
        // if (vib3System.scanNewElements) {
        //     vib3System.scanNewElements(document.getElementById('latest-articles-grid'));
        // }
        // For now, the newly created cards in loadLatestArticles have the data-attributes
        // but won't be processed by the initial VIB3 scan.

        updateFooterYear();
        console.log("Dynamic content loaded.");

    } catch (error) {
        console.error("Error during initialization or content loading:", error);
    }
});

function updateFooterYear() {
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
}
