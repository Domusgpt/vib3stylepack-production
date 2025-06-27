// digital-magazine/js/content-filter.js
import { navigateWithSimpleFade } from './article-transitions.js'; // Changed to simple fade

// Store all fetched articles here after initial load in main.js
export let allFetchedArticles = [];

export function setAllArticles(articles) {
    allFetchedArticles = Array.isArray(articles) ? articles : [];
}

/**
 * Displays an array of article objects into the specified container.
 * @param {Array<Object>} articles - Array of article objects to display.
 * @param {string} containerId - The ID of the container element for the articles grid.
 */
export function displayArticles(articles, containerId) {
    const containerElement = document.getElementById(containerId);
    if (!containerElement) {
        console.error(`Article container with ID "${containerId}" not found.`);
        return;
    }

    // Destroy existing VIB3 instances from the container before clearing its content.
    // This prevents memory leaks and orphaned VIB3 canvases/listeners.
    if (window.Vib3codeApp && window.Vib3codeApp.vib3System && window.Vib3codeApp.vib3System.destroyVisualizerForElement) {
        Array.from(containerElement.childNodes).forEach(child => {
            // Check if it's an element node that might have a VIB3 instance
            if (child.nodeType === 1 && (child.dataset.vib3Style || child.dataset.vib3InteractionPreset)) {
                window.Vib3codeApp.vib3System.destroyVisualizerForElement(child);
            }
        });
    }
    containerElement.innerHTML = ''; // Clear existing articles after VIB3 instances are destroyed

    if (!articles || articles.length === 0) {
        containerElement.innerHTML = '<p class="info-message">No articles match the current filter.</p>';
        return;
    }

    articles.forEach(article => {
        const card = document.createElement('div');
        card.className = 'article-card-placeholder glass-panel-shimmer'; // Add shimmer class
        card.dataset.vib3Style = "glass-panel-primary";
        card.dataset.vib3InteractionPreset = "glass-panel-hover";

        const titleText = article.title || 'Untitled Article';
        const articleUrl = `article.html?slug=${article.slug}`;
        const excerpt = article.excerpt ? article.excerpt.substring(0, 120) + '...' : 'No excerpt available.';

        card.innerHTML = `
            <h3 class="article-title text-glitch" data-text="${titleText}">${titleText}</h3>
            <p class="article-excerpt">${excerpt}</p>
            <a href="${articleUrl}" class="button-cta pulsing-glow-hover">Read More</a>
        `;

        const titleElement = card.querySelector('.article-title');
        if (titleElement) titleElement.dataset.text = titleText;

        const readMoreButton = card.querySelector('.button-cta');
        if (readMoreButton) {
            readMoreButton.addEventListener('click', (e) => {
                e.preventDefault();
                navigateWithTransition(articleUrl);
            });
        }
        containerElement.appendChild(card);
        // Trigger entry animation - slight delay to ensure it's in DOM and transition can be seen
        requestAnimationFrame(() => {
            setTimeout(() => {
                card.classList.add('animate-entry');
            }, 50); // Small delay
        });
    });

    // Notify VIB3StyleSystem to process newly added elements
    if (window.Vib3codeApp && window.Vib3codeApp.vib3System && window.Vib3codeApp.vib3System.scanAndInitializeNewElements) {
        // Call after a short delay to ensure all cards are in DOM and animations started
        const scanDelay = 500; // ms, allow time for card entry animations and page fade if any
        setTimeout(() => {
            window.Vib3codeApp.vib3System.scanAndInitializeNewElements(containerElement);
            // console.log("VIB3StyleSystem scanned new article cards in container:", containerElement.id);
        }, scanDelay);
    } else {
        console.warn("VIB3StyleSystem re-scan method not available for new article cards. VIB3 effects might not apply to new cards.");
    }
}

/**
 * Filters an array of articles by categoryId.
 * @param {string} categoryId - The category ID to filter by. 'all' returns all articles.
 * @param {Array<Object>} articles - The array of all article objects.
 * @returns {Array<Object>} Filtered array of articles.
 */
export function filterArticlesByCategory(categoryId, articles) {
    if (!categoryId || categoryId.toLowerCase() === 'all') {
        return articles;
    }
    return articles.filter(article => article.categoryId === categoryId);
}

/**
 * Sets up category filter buttons and their event listeners.
 * @param {Array<Object>} articles - Array of all article objects.
 * @param {Array<Object>} siteCategories - Array of category objects from site-meta.json.
 * @param {string} articlesContainerId - The ID of the container for the articles grid.
 * @param {string} filterControlsContainerId - The ID of the container for filter buttons.
 */
// Store current sort criteria
let currentSortBy = 'date-desc'; // Default sort

export function sortArticles(articles, sortBy) {
    const sortedArticles = [...articles]; // Create a new array to avoid mutating the original

    switch (sortBy) {
        case 'date-asc':
            sortedArticles.sort((a, b) => new Date(a.publicationDate) - new Date(b.publicationDate));
            break;
        case 'title-asc':
            sortedArticles.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
            break;
        case 'title-desc':
            sortedArticles.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
            break;
        case 'date-desc': // Fallthrough for default
        default:
            sortedArticles.sort((a, b) => new Date(b.publicationDate) - new Date(a.publicationDate));
            break;
    }
    return sortedArticles;
}


export function setupCategoryFilters(articles, siteCategories, articlesContainerId, filterControlsContainerId) {
    const filterContainer = document.getElementById(filterControlsContainerId);
    const sortSelectElement = document.getElementById('sort-by-select'); // Get sort dropdown

    if (!filterContainer) {
        console.error(`Filter controls container "${filterControlsContainerId}" not found.`);
        return;
    }

    // Populate category filter buttons (keeping the "All" button from HTML)
    siteCategories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'filter-button';
        button.dataset.categoryFilter = category.id;
        button.textContent = category.name;
        filterContainer.appendChild(button);
    });

    const filterButtons = filterContainer.querySelectorAll('.filter-button');

    function applyFiltersAndSort() {
        const activeFilterButton = filterContainer.querySelector('.filter-button.active');
        const categoryId = activeFilterButton ? activeFilterButton.dataset.categoryFilter : 'all';
        currentSortBy = sortSelectElement ? sortSelectElement.value : 'date-desc';

        let processedArticles = filterArticlesByCategory(categoryId, articles);
        processedArticles = sortArticles(processedArticles, currentSortBy);
        displayArticles(processedArticles, articlesContainerId);
    }

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            applyFiltersAndSort();
        });
    });

    if (sortSelectElement) {
        sortSelectElement.addEventListener('change', () => {
            applyFiltersAndSort();
        });
    }

    // Initial display
    applyFiltersAndSort();

    console.log("Category filters and sorting set up.");
}
