// digital-magazine/js/content-filter.js
import { navigateWithTransition } from './article-transitions.js';

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
    containerElement.innerHTML = ''; // Clear existing articles

    if (!articles || articles.length === 0) {
        containerElement.innerHTML = '<p>No articles match the current filter.</p>';
        return;
    }

    articles.forEach(article => {
        const card = document.createElement('div');
        card.className = 'article-card-placeholder'; // Use existing class for styling
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
export function setupCategoryFilters(articles, siteCategories, articlesContainerId, filterControlsContainerId) {
    const filterContainer = document.getElementById(filterControlsContainerId);
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

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active state for buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const categoryId = button.dataset.categoryFilter;
            const filteredArticles = filterArticlesByCategory(categoryId, articles);
            displayArticles(filteredArticles, articlesContainerId);
        });
    });

    // Initially display all articles (or trigger the 'all' filter)
    const initialActiveButton = filterContainer.querySelector('.filter-button.active');
    if (initialActiveButton) {
        initialActiveButton.click(); // Programmatically click to apply initial filter
    } else if (filterButtons.length > 0) {
        filterButtons[0].click(); // Or click the first available button if no 'active' default
    }


    console.log("Category filters set up.");
}

/**
 * Sorts an array of articles based on the specified criteria.
 * @param {Array<Object>} articles - Array of article objects to sort.
 * @param {string} sortBy - Sort criteria: 'date-desc', 'date-asc', 'title-asc', 'title-desc'
 * @returns {Array<Object>} Sorted array of articles.
 */
export function sortArticles(articles, sortBy = 'date-desc') {
    const sorted = [...articles];
    
    switch(sortBy) {
        case 'date-desc':
            sorted.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
            break;
        case 'date-asc':
            sorted.sort((a, b) => new Date(a.publishDate) - new Date(b.publishDate));
            break;
        case 'title-asc':
            sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
            break;
        case 'title-desc':
            sorted.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
            break;
        default:
            console.warn(`Unknown sort criteria: ${sortBy}. Using date-desc.`);
            sorted.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
    }
    
    return sorted;
}

/**
 * Sets up sort controls and their event listeners.
 * @param {string} sortControlId - The ID of the sort select element.
 * @param {string} articlesContainerId - The ID of the container for the articles grid.
 * @param {function} getCurrentFilteredArticles - Function to get currently filtered articles.
 */
export function setupSortControls(sortControlId, articlesContainerId, getCurrentFilteredArticles) {
    const sortSelect = document.getElementById(sortControlId);
    if (!sortSelect) {
        console.error(`Sort control with ID "${sortControlId}" not found.`);
        return;
    }
    
    sortSelect.addEventListener('change', (e) => {
        const sortBy = e.target.value;
        const currentArticles = getCurrentFilteredArticles();
        const sortedArticles = sortArticles(currentArticles, sortBy);
        displayArticles(sortedArticles, articlesContainerId);
        console.log(`Articles sorted by: ${sortBy}`);
    });
    
    console.log("Sort controls set up.");
}
