import { VIB3StyleSystem } from './VIB3StyleSystem.js';
import { loadSiteMeta, loadFeaturedArticle, loadFullArticle, loadCategoryPage } from './content-loader.js';
import { fadeInPage } from './article-transitions.js';
import { setAllArticles, setupCategoryFilters, displayArticles, setupSortControls } from './content-filter.js';

// Define CONTENT_BASE_PATH for fetching all articles, consistent with content-loader.js
const CONTENT_BASE_PATH = './content/';

async function fetchAllArticleData() {
    try {
        // First fetch the article index
        const indexResponse = await fetch(`${CONTENT_BASE_PATH}article-index.json?v=${Date.now()}`);
        if (!indexResponse.ok) {
            console.error('Could not fetch article index');
            return [];
        }
        
        const index = await indexResponse.json();
        const articles = [];
        
        // Fetch each article based on the index
        for (const articleInfo of index.articles) {
            try {
                const response = await fetch(`${CONTENT_BASE_PATH}articles/${articleInfo.slug}.json`);
                if (response.ok) {
                    const articleData = await response.json();
                    // Merge index info with article data
                    articles.push({
                        ...articleData,
                        ...articleInfo,
                        categoryId: articleInfo.category
                    });
                } else {
                    console.warn(`Could not fetch article data for slug: ${articleInfo.slug}`);
                }
            } catch (error) {
                console.error(`Error fetching article ${articleInfo.slug}:`, error);
            }
        }
        
        return articles;
    } catch (error) {
        console.error('Error fetching article index:', error);
        return [];
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM fully loaded and parsed. Initializing Vib3code Digital Magazine Systems...");

    fadeInPage();

    const vib3System = new VIB3StyleSystem();
    window.Vib3codeApp = { vib3System, allArticles: [] }; // Initialize allArticles

    try {
        await vib3System.init('./presets.json?v=' + Date.now());
        console.log("Vib3code VIB3StyleSystem initialized successfully.");

        const siteMetaData = await loadSiteMeta(); // Assuming loadSiteMeta might return categories for filter setup
        updateFooterYear();

        // Fetch all articles for filtering logic
        const allArticles = await fetchAllArticleData();
        window.Vib3codeApp.allArticles = allArticles; // Store globally for access
        setAllArticles(allArticles); // Set in content-filter module

        const pagePath = window.location.pathname.split("/").pop();

        if (pagePath === 'index.html' || pagePath === '') { // Homepage
            await loadFeaturedArticle('ema-report-monolith-eversuite-analysis');
            
            // Track currently filtered articles
            let currentFilteredArticles = allArticles;
            
            // Setup filters, which will also handle initial display of articles
            if (siteMetaData && siteMetaData.categories) { // Ensure categories are loaded
                setupCategoryFilters(allArticles, siteMetaData.categories, 'latest-articles-grid', 'filter-controls-container');
            } else { // Fallback if categories didn't load from siteMetaData, display all articles
                displayArticles(allArticles, 'latest-articles-grid');
            }
            
            // Setup sorting controls
            const { filterArticlesByCategory } = await import('./content-filter.js');
            setupSortControls('sort-by-select', 'latest-articles-grid', () => {
                // Get the current category filter
                const activeFilterBtn = document.querySelector('.filter-button.active');
                const categoryId = activeFilterBtn ? activeFilterBtn.dataset.categoryFilter : 'all';
                
                // Filter articles by category
                return filterArticlesByCategory(categoryId, allArticles);
            });
            
            console.log("Homepage dynamic content, filters, and sorting initialized.");
        } else if (pagePath === 'article.html') {
            const urlParams = new URLSearchParams(window.location.search);
            const articleSlug = urlParams.get('slug');
            if (articleSlug) {
                await loadFullArticle(articleSlug);
                console.log(`Article page dynamic content for "${articleSlug}" loaded.`);
            } else {
                console.error("Article slug not found in URL for article.html");
                const articleBodyEl = document.getElementById('article-body');
                if (articleBodyEl) articleBodyEl.innerHTML = "<p>Error: Article slug not provided in the URL.</p>";
            }
        } else if (pagePath === 'category.html') {
            const urlParamsCategory = new URLSearchParams(window.location.search);
            const categoryId = urlParamsCategory.get('id');
            if (categoryId) {
                await loadCategoryPage(categoryId); // This now also handles VIB3 background update via window.Vib3codeApp
                console.log(`Category page dynamic content for "${categoryId}" loaded.`);
            } else {
                console.error("Category ID not found in URL for category.html");
                const categoryGridEl = document.getElementById('category-articles-grid');
                if (categoryGridEl) categoryGridEl.innerHTML = "<p>Error: Category ID not provided in the URL.</p>";
            }
        }

        // VIB3StyleSystem re-scan for dynamically added elements (conceptual)
        // if (vib3System.scanNewElements) { // If such a method existed
        //    vib3System.scanNewElements(document.body); // Or more targeted elements
        // }
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
