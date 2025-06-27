import { VIB3StyleSystem } from './VIB3StyleSystem.js';
import { loadSiteMeta, loadFeaturedArticle, loadLatestArticles, loadFullArticle } from './content-loader.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM fully loaded and parsed. Initializing Vib3code Digital Magazine Systems...");

    const vib3System = new VIB3StyleSystem();
    // For potential future use if VIB3 system needs global access for re-scans
    window.Vib3codeApp = { vib3System };

    try {
        await vib3System.init('./presets.json');
        console.log("Vib3code VIB3StyleSystem initialized successfully.");

        // Common setup for all pages
        await loadSiteMeta(); // Loads site title, tagline, navigation
        updateFooterYear();

        // Page-specific content loading
        const pagePath = window.location.pathname.split("/").pop();

        if (pagePath === 'index.html' || pagePath === '') { // Homepage
            await loadFeaturedArticle('ema-report-monolith');
            await loadLatestArticles(3);
            console.log("Homepage dynamic content loaded.");
        } else if (pagePath === 'article.html') {
            const urlParams = new URLSearchParams(window.location.search);
            const articleSlug = urlParams.get('slug');
            if (articleSlug) {
                await loadFullArticle(articleSlug);
                console.log(`Article page dynamic content for "${articleSlug}" loaded.`);
            } else {
                console.error("Article slug not found in URL for article.html");
                // Optionally display an error message on the page
                const articleBodyEl = document.getElementById('article-body');
                if (articleBodyEl) articleBodyEl.innerHTML = "<p>Error: Article slug not provided in the URL.</p>";
            }
        } else if (pagePath === 'category.html') {
            const urlParams = new URLSearchParams(window.location.search);
            const categoryId = urlParams.get('id');
            if (categoryId) {
                console.log(`Loading category page for: ${categoryId}`);
                // Category page loading logic would go here
            } else {
                console.error("Category ID not found in URL for category.html");
            }
        }

        console.log("Page initialization and content loading sequence complete.");

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