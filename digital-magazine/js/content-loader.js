// digital-magazine/js/content-loader.js

const CONTENT_BASE_PATH = '../content/'; // Relative to this JS file's location in digital-magazine/js/

/**
 * Fetches and populates site metadata like site title, tagline,
 * and dynamically generates primary navigation.
 */
export async function loadSiteMeta() {
    try {
        const response = await fetch(`${CONTENT_BASE_PATH}site-meta.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const meta = await response.json();

        // Populate site title and tagline
        const siteTitleElement = document.querySelector('#site-header .site-title a');
        const taglineElement = document.querySelector('#site-header .tagline');
        if (siteTitleElement) siteTitleElement.textContent = meta.siteName;
        if (taglineElement) taglineElement.textContent = meta.tagline;
        document.title = `${meta.siteName} - ${meta.tagline}`;


        // Populate primary navigation
        const navListElement = document.getElementById('nav-list');
        if (navListElement && meta.categories && Array.isArray(meta.categories)) {
            navListElement.innerHTML = ''; // Clear existing placeholders
            meta.categories.forEach(category => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                // For now, category.html is a template, actual routing would be more complex
                link.href = `category.html?id=${category.id}`;
                link.textContent = category.name;
                // Apply interaction preset for VIB3 effects on nav links
                link.dataset.vib3InteractionPreset = "category-link-pulse";
                listItem.appendChild(link);
                navListElement.appendChild(listItem);
            });
        }
        console.log("Site metadata and navigation loaded.");

    } catch (error) {
        console.error("Error loading site metadata:", error);
    }
}

/**
 * Fetches and populates the featured article section.
 * @param {string} articleSlug - The slug of the article to load (e.g., 'ema-report-monolith').
 */
export async function loadFeaturedArticle(articleSlug) {
    try {
        const response = await fetch(`${CONTENT_BASE_PATH}articles/${articleSlug}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const article = await response.json();

        const featuredArticlePlaceholder = document.getElementById('featured-article-placeholder');
        if (featuredArticlePlaceholder) {
            featuredArticlePlaceholder.innerHTML = `
                <h3 class="article-title text-glitch" data-text="${article.title}">${article.title}</h3>
                <p class="article-excerpt">${article.excerpt}</p>
                <a href="article.html?slug=${article.slug}" class="button-cta pulsing-glow-hover">Read More</a>
            `;
            // Add data-text attribute for glitch effect
            const titleElement = featuredArticlePlaceholder.querySelector('.article-title');
            if(titleElement) titleElement.dataset.text = article.title;

            console.log(`Featured article "${article.title}" loaded.`);
        }
    } catch (error) {
        console.error(`Error loading featured article "${articleSlug}":`, error);
    }
}


/**
 * Fetches and populates latest articles in the grid.
 * For now, it just loads the one sample article.
 * @param {number} limit - Max number of articles to load.
 */
export async function loadLatestArticles(limit = 3) {
    // In a real scenario, you'd fetch an index or multiple files.
    // For now, we only have one sample article.
    const sampleArticleSlugs = ['ema-report-monolith'];
    const articlesGrid = document.getElementById('latest-articles-grid');

    if (!articlesGrid) {
        console.error("Latest articles grid container not found.");
        return;
    }
    articlesGrid.innerHTML = ''; // Clear placeholders

    for (let i = 0; i < Math.min(limit, sampleArticleSlugs.length); i++) {
        const slug = sampleArticleSlugs[i];
        try {
            const response = await fetch(`${CONTENT_BASE_PATH}articles/${slug}.json`);
            if (!response.ok) {
                console.warn(`Could not load article ${slug}: ${response.status}`);
                continue;
            }
            const article = await response.json();

            const card = document.createElement('div');
            // These placeholders get VIB3 styles from index.html structure.
            // If we generate them fully here, we need to add data-attributes.
            card.className = 'article-card-placeholder'; // Use existing class for styling
            card.dataset.vib3Style = "glass-panel-primary"; // Ensure VIB3 style
            card.dataset.vib3InteractionPreset = "glass-panel-hover"; // Ensure VIB3 interaction

            card.innerHTML = `
                <h4 class="article-title text-glitch" data-text="${article.title}">${article.title}</h4>
                <p class="article-excerpt">${article.excerpt.substring(0, 100)}...</p>
                <a href="article.html?slug=${article.slug}" class="button-cta pulsing-glow-hover">Read More</a>
            `;
            // Add data-text attribute for glitch effect
            const titleElement = card.querySelector('.article-title');
            if(titleElement) titleElement.dataset.text = article.title;

            articlesGrid.appendChild(card);
            console.log(`Loaded article "${article.title}" into latest articles grid.`);

        } catch (error) {
            console.error(`Error loading article "${slug}" for latest articles grid:`, error);
        }
    }
     // If VIB3StyleSystem is available and re-initialization/update of new elements is needed:
    if (window.Vib3code && window.Vib3code.vib3System) {
        // This is a simplified assumption. Actual re-scan might be more complex.
        // For now, VIB3StyleSystem scans on init. Dynamic content needs a strategy.
        // A possible strategy: window.Vib3code.vib3System.scanAndApplyStyles(articlesGrid);
        // For now, we rely on the initial scan for placeholders having these data-attributes.
        // If we fully replace innerHTML of placeholders, VIB3 instances might be lost.
        // The current approach replaces placeholder's innerHTML, so VIB3 instance on placeholder is kept.
        // If cards are added dynamically (not replacing placeholders), they'd need VIB3 init.
        // The current `loadLatestArticles` *replaces* placeholders *if* they are fully new elements.
        // The current code *clears* the grid and adds *new* cards. These new cards will need VIB3 init.
        // This highlights a point for refinement: how VIB3StyleSystem handles dynamically added content.
        // For Phase 2, this might mean new cards don't get VIB3 effects until a full re-scan or targeted init.
        // Let's assume VIB3StyleSystem needs to be notified or re-scan.
        // For now, this is beyond "basic" content loader.
    }
}
