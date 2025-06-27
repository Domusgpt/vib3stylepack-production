// digital-magazine/js/content-loader.js
import { navigateWithSimpleFade, geometricWipeNavigate } from './article-transitions.js'; // Updated imports

const CONTENT_BASE_PATH = './content/'; // Relative to the HTML file in digital-magazine/

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
                    geometricWipeNavigate(categoryUrl); // Use geometric wipe for main nav
                });
                listItem.appendChild(link);
                navListElement.appendChild(listItem);
            });
        }
        console.log("Site metadata and navigation loaded.");
        return meta; // Return the loaded metadata

    } catch (error) {
        console.error("Error loading site metadata:", error);
        return null; // Return null or throw error on failure
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
                    navigateWithSimpleFade(articleUrl); // Keep simple fade for these
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
 * @param {number} limit - Max number of articles to load.
 */
export async function loadLatestArticles(limit = 3) {
    // Sample articles - in real app would fetch from index
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
            card.className = 'article-card-placeholder';
            card.dataset.vib3Style = "glass-panel-primary";
            card.dataset.vib3InteractionPreset = "glass-panel-hover";

            card.innerHTML = `
                <h4 class="article-title text-glitch" data-text="${article.title}">${article.title}</h4>
                <p class="article-excerpt">${article.excerpt.substring(0, 100)}...</p>
                <a href="article.html?slug=${article.slug}" class="button-cta pulsing-glow-hover">Read More</a>
            `;
            const titleElement = card.querySelector('.article-title');
            if(titleElement) titleElement.dataset.text = article.title;

            articlesGrid.appendChild(card);
            console.log(`Loaded article "${article.title}" into latest articles grid.`);

        } catch (error) {
            console.error(`Error loading article "${slug}" for latest articles grid:`, error);
        }
    }
}

/**
 * Fetches and populates a full article page.
 * @param {string} articleSlug - The slug of the article to load.
 */
export async function loadFullArticle(articleSlug) {
    if (!articleSlug) {
        console.error("No article slug provided to loadFullArticle.");
        const articleBodyEl = document.getElementById('article-body');
        if (articleBodyEl) {
            articleBodyEl.innerHTML = '<p>Error: Article not found (no slug provided).</p>';
        }
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
        if (articleCategoryEl) articleCategoryEl.textContent = article.categoryId;
        if (articleAuthorEl) articleAuthorEl.textContent = article.authorId;
        if (articleDateEl) {
            articleDateEl.textContent = new Date(article.publicationDate).toLocaleDateString(undefined, { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }

        // Populate article body
        const articleBodyEl = document.getElementById('article-body');
        if (articleBodyEl) {
            articleBodyEl.innerHTML = ''; // Clear placeholder

            if (article.body && Array.isArray(article.body)) {
                article.body.forEach(block => {
                    let element;
                    switch (block.type) {
                        case 'heading':
                            element = document.createElement(`h${block.level || 2}`);
                            element.textContent = block.content;
                            element.classList.add('text-glitch');
                            element.dataset.text = block.content;
                            break;
                        case 'paragraph':
                            element = document.createElement('p');
                            element.innerHTML = block.content;
                            break;
                        case 'blockquote':
                            element = document.createElement('blockquote');
                            const p = document.createElement('p');
                            p.textContent = block.content;
                            element.appendChild(p);
                            break;
                        case 'list':
                            element = document.createElement(block.ordered ? 'ol' : 'ul');
                            if (block.items && Array.isArray(block.items)) {
                                block.items.forEach(itemText => {
                                    const listItem = document.createElement('li');
                                    listItem.textContent = itemText;
                                    element.appendChild(listItem);
                                });
                            }
                            break;
                        default:
                            element = document.createElement('p');
                            element.textContent = `Unsupported block type: ${block.type}`;
                    }
                    if (element) {
                        articleBodyEl.appendChild(element);
                    }
                });
            } else {
                // Fallback for simple text content
                const p = document.createElement('p');
                p.textContent = article.content || 'No content available.';
                articleBodyEl.appendChild(p);
            }
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