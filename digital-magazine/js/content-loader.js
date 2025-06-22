// digital-magazine/js/content-loader.js
import { navigateWithTransition } from './article-transitions.js';

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
import { navigateWithTransition } from './article-transitions.js';

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
                const categoryUrl = `category.html?id=${category.id}`;
                link.href = categoryUrl;
                link.textContent = category.name;
                link.dataset.vib3InteractionPreset = "category-link-pulse";
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    navigateWithTransition(categoryUrl);
                });
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
            const articleUrl = `article.html?slug=${article.slug}`;
            featuredArticlePlaceholder.innerHTML = `
                <h3 class="article-title text-glitch" data-text="${article.title}">${article.title}</h3>
                <p class="article-excerpt">${article.excerpt}</p>
                <a href="${articleUrl}" class="button-cta pulsing-glow-hover">Read More</a>
            `;
            const readMoreButton = featuredArticlePlaceholder.querySelector('.button-cta');
            if (readMoreButton) {
                readMoreButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    navigateWithTransition(articleUrl);
                });
            }
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
        // A more robust solution would involve having VIB3StyleSystem expose a method
        // to initialize new elements, e.g., window.Vib3codeApp.vib3System.initializeElements(articlesGrid.childNodes);
    }
}


/**
 * Fetches and populates a full article page.
 * @param {string} articleSlug - The slug of the article to load.
 */
export async function loadFullArticle(articleSlug) {
    if (!articleSlug) {
        console.error("No article slug provided to loadFullArticle.");
        // Potentially redirect to a 404 page or homepage
        document.getElementById('article-body').innerHTML = '<p>Error: Article not found (no slug provided).</p>';
        return;
    }

    try {
        const response = await fetch(`${CONTENT_BASE_PATH}articles/${articleSlug}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for article ${articleSlug}`);
        }
        const article = await response.json();

        // Set document title
        document.title = `${article.title} - Vib3code`;

        // Populate header elements
        const articleTitleEl = document.getElementById('article-title');
        const articleCategoryEl = document.getElementById('article-category');
        const articleAuthorEl = document.getElementById('article-author');
        const articleDateEl = document.getElementById('article-date');

        if (articleTitleEl) articleTitleEl.textContent = article.title;
        if (articleCategoryEl) { // Fetch category name from site-meta for better display
            try {
                const metaResponse = await fetch(`${CONTENT_BASE_PATH}site-meta.json`);
                const meta = await metaResponse.json();
                const category = meta.categories.find(cat => cat.id === article.categoryId);
                articleCategoryEl.textContent = category ? category.name : article.categoryId;
            } catch (e) {
                articleCategoryEl.textContent = article.categoryId;
            }
        }
        if (articleAuthorEl) { // Fetch author name
             try {
                const metaResponse = await fetch(`${CONTENT_BASE_PATH}site-meta.json`);
                const meta = await metaResponse.json();
                const author = meta.authors.find(auth => auth.id === article.authorId);
                articleAuthorEl.textContent = author ? author.name : article.authorId;
            } catch (e) {
                articleAuthorEl.textContent = article.authorId;
            }
        }
        if (articleDateEl) articleDateEl.textContent = new Date(article.publicationDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

        // Populate article body
        const articleBodyEl = document.getElementById('article-body');
        if (articleBodyEl) {
            articleBodyEl.innerHTML = ''; // Clear placeholder
            article.body.forEach(block => {
                let element;
                switch (block.type) {
                    case 'heading':
                        element = document.createElement(`h${block.level || 2}`);
                        element.textContent = block.content;
                        // Add glitch effect to headings in articles too
                        element.classList.add('text-glitch');
                        element.dataset.text = block.content;
                        break;
                    case 'paragraph':
                        element = document.createElement('p');
                        element.innerHTML = block.content; // Use innerHTML for potential inline tags if ever needed
                        break;
                    case 'blockquote':
                        element = document.createElement('blockquote');
                        const p = document.createElement('p');
                        p.textContent = block.content;
                        element.appendChild(p);
                        break;
                    case 'list': // Assuming block.items is an array of strings
                        element = document.createElement(block.ordered ? 'ol' : 'ul');
                        block.items.forEach(itemText => {
                            const listItem = document.createElement('li');
                            listItem.textContent = itemText;
                            element.appendChild(listItem);
                        });
                        break;
                    case 'image': // Assuming block.src and block.alt
                        element = document.createElement('figure');
                        const img = document.createElement('img');
                        img.src = block.src; // May need path adjustment
                        img.alt = block.alt || '';
                        element.appendChild(img);
                        if (block.caption) {
                            const figcaption = document.createElement('figcaption');
                            figcaption.textContent = block.caption;
                            element.appendChild(figcaption);
                        }
                        break;
                    case 'vib3-interactive-embed':
                        element = document.createElement('div');
                        element.classList.add('vib3-embed-placeholder');
                        if (block.preset) {
                            element.dataset.vib3Style = block.preset;
                        }
                        // You might want to pass other parameters from block.parameters
                        // as data-attributes or through a JS call if VIB3System supports it
                        element.innerHTML = `<p>VIB3 Interactive Element (${block.preset || 'default'})</p>`;
                        // This element will need VIB3 initialization if created after initial scan
                        break;
                    default:
                        element = document.createElement('p');
                        element.textContent = `Unsupported block type: ${block.type}`;
                }
                if (element) {
                    articleBodyEl.appendChild(element);
                }
            });
        }
        console.log(`Full article "${article.title}" loaded and rendered.`);

    } catch (error) {
        console.error(`Error loading full article "${articleSlug}":`, error);
        const articleBodyEl = document.getElementById('article-body');
        if (articleBodyEl) {
            articleBodyEl.innerHTML = `<p>Error: Could not load article content. Please try again later.</p>`;
        }
        document.title = "Error Loading Article - Vib3code";
    }
}

/**
 * Fetches and populates a category page.
 * @param {string} categoryId - The ID of the category to load.
 */
export async function loadCategoryPage(categoryId) {
    if (!categoryId) {
        console.error("No category ID provided to loadCategoryPage.");
        // Handle error, e.g., display message on page
        document.body.innerHTML = '<p class="page-error">Error: Category ID not specified.</p>';
        return;
    }

    try {
        // Fetch site metadata to get category details and all articles for filtering
        const metaResponse = await fetch(`${CONTENT_BASE_PATH}site-meta.json`);
        if (!metaResponse.ok) throw new Error(`HTTP error! status: ${metaResponse.status} for site-meta.json`);
        const siteMeta = await metaResponse.json();

        const category = siteMeta.categories.find(cat => cat.id === categoryId);

        if (!category) {
            console.error(`Category with ID "${categoryId}" not found.`);
            document.body.innerHTML = `<p class="page-error">Error: Category "${categoryId}" not found.</p>`;
            document.title = "Category Not Found - Vib3code";
            return;
        }

        // Set document title and populate category header
        document.title = `Category: ${category.name} - Vib3code`;
        const categoryTitleEl = document.getElementById('category-title');
        const categoryDescriptionEl = document.getElementById('category-description');

        if (categoryTitleEl) categoryTitleEl.textContent = category.name;
        if (categoryDescriptionEl) categoryDescriptionEl.textContent = category.description;

        // Filter articles for the current category
        // For now, we only have one article, so this filtering is conceptual.
        // In a real app, you'd fetch an article index or loop through all article files.
        const articlesToLoad = ['ema-report-monolith.json']; // Placeholder for actual article list
        const categoryArticles = [];

        for (const articleFile of articlesToLoad) {
            // This is inefficient for many articles; an index would be better.
            // For this phase with one article, it's acceptable.
            try {
                const articleResponse = await fetch(`${CONTENT_BASE_PATH}articles/${articleFile.replace('.json', '')}.json`);
                if (!articleResponse.ok) continue; // Skip if article fetch fails
                const articleData = await articleResponse.json();
                if (articleData.categoryId === categoryId) {
                    categoryArticles.push(articleData);
                }
            } catch (e) {
                console.warn(`Could not load or parse ${articleFile} for category filtering.`, e);
            }
        }

        // Populate articles grid
        const articlesGridEl = document.getElementById('category-articles-grid');
        if (articlesGridEl) {
            articlesGridEl.innerHTML = ''; // Clear placeholder
            if (categoryArticles.length > 0) {
                categoryArticles.forEach(article => {
                    const card = document.createElement('div');
                    card.className = 'article-card-placeholder'; // Use existing class for styling
                    card.dataset.vib3Style = "glass-panel-primary";
                    card.dataset.vib3InteractionPreset = "glass-panel-hover";

                    const titleText = article.title || 'Untitled Article';
                    const articleUrl = `article.html?slug=${article.slug}`;
                    card.innerHTML = `
                        <h3 class="article-title text-glitch" data-text="${titleText}">${titleText}</h3>
                        <p class="article-excerpt">${article.excerpt ? article.excerpt.substring(0, 100) + '...' : ''}</p>
                        <a href="${articleUrl}" class="button-cta pulsing-glow-hover">Read More</a>
                    `;
                    const readMoreButton = card.querySelector('.button-cta');
                    if (readMoreButton) {
                        readMoreButton.addEventListener('click', (e) => {
                            e.preventDefault();
                            navigateWithTransition(articleUrl);
                        });
                    }
                    const titleElement = card.querySelector('.article-title');
                    if(titleElement) titleElement.dataset.text = titleText;

                    articlesGridEl.appendChild(card);
                });
            } else {
                articlesGridEl.innerHTML = '<p>No articles found in this category yet.</p>';
            }
        }

        console.log(`Category page "${category.name}" loaded with ${categoryArticles.length} article(s).`);

        // Step 4: Apply Category-Specific VIB3 Background will be handled here or in main.js
        // For now, just logging the style name. The actual application to VIB3 instance is next.
        if (category.vib3Style) {
            console.log(`Category "${category.name}" suggests VIB3 style: "${category.vib3Style}" for background.`);

            const globalBgElement = document.getElementById('vib3-global-background');
            if (window.Vib3codeApp && window.Vib3codeApp.vib3System && globalBgElement) {
                const vib3System = window.Vib3codeApp.vib3System;
                const bgVisualizer = vib3System.getVisualizerForElement(globalBgElement);
                const newStylePreset = vib3System.presetManager.getVisualStyle(category.vib3Style);

                if (bgVisualizer && newStylePreset && newStylePreset.parameters) {
                    // Ensure the current background element has the new data-vib3-style attribute
                    // This is important if VIB3 internal logic or interactions depend on it.
                    globalBgElement.dataset.vib3Style = category.vib3Style;

                    bgVisualizer.updateParameters(newStylePreset.parameters, 500); // Smooth transition
                    console.log(`Updated VIB3 global background to style: "${category.vib3Style}" with new parameters.`);
                } else {
                    if (!bgVisualizer) console.warn("Could not find VIB3 visualizer for #vib3-global-background.");
                    if (!newStylePreset) console.warn(`Could not find VIB3 preset for style "${category.vib3Style}".`);
                }
            } else {
                console.warn("Vib3codeApp.vib3System or #vib3-global-background not available for style update.");
            }
        }


    } catch (error) {
        console.error(`Error loading category page for ID "${categoryId}":`, error);
        document.body.innerHTML = `<p class="page-error">Error: Could not load category content.</p>`;
        document.title = "Error Loading Category - Vib3code";
    }
}
