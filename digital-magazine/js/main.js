import { VIB3StyleSystem } from './VIB3StyleSystem.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed. Initializing Vib3code Digital Magazine Systems...");

    const vib3System = new VIB3StyleSystem();

    vib3System.init('../presets.json') // Adjusted path relative to digital-magazine/js/
        .then(() => {
            console.log("Vib3code VIB3StyleSystem initialized successfully.");
            // Further magazine-specific JS logic can be triggered here
            // e.g., loading content, setting up navigation, etc.
            updateFooterYear();
        })
        .catch(error => {
            console.error("Error initializing VIB3StyleSystem for Vib3code:", error);
        });
});

function updateFooterYear() {
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
}
