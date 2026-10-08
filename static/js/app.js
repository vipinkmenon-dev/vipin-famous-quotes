/**
 * QuoteVault - Vanilla JavaScript Client
 * Manages random quote generation, instant search, category/author filtering, and clipboard interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Spotlight
    const spotlightCard = document.getElementById('spotlight-card');
    const spotlightQuote = document.getElementById('spotlight-quote');
    const spotlightAuthor = document.getElementById('spotlight-author');
    const spotlightCategory = document.getElementById('spotlight-category');
    const btnRandom = document.getElementById('btn-random');
    const btnCopySpotlight = document.getElementById('btn-copy-spotlight');
    const btnShareSpotlight = document.getElementById('btn-share-spotlight');

    // DOM Elements - Search & Filters
    const searchInput = document.getElementById('search-input');
    const btnClearSearch = document.getElementById('btn-clear-search');
    const categorySelect = document.getElementById('category-select');
    const authorSelect = document.getElementById('author-select');
    const categoryPillsContainer = document.getElementById('category-pills');
    const btnResetFilters = document.getElementById('btn-reset-filters');
    const btnEmptyReset = document.getElementById('btn-empty-reset');
    const btnShowAll = document.getElementById('btn-show-all');

    // DOM Elements - Results Grid & Status
    const quotesGrid = document.getElementById('quotes-grid');
    const resultsCount = document.getElementById('results-count');
    const emptyState = document.getElementById('empty-state');
    const toast = document.getElementById('toast');
    const totalCountBadge = document.getElementById('total-count-badge');

    // State Variables
    let currentSpotlight = null;
    let selectedCategory = '';
    let selectedAuthor = '';
    let searchDebounceTimer = null;
    let toastTimer = null;

    /* ==========================================================================
       API Functions
       ========================================================================== */

    /**
     * Fetch a random quote from the server.
     */
    async function fetchRandomQuote(category = '', author = '') {
        try {
            const params = new URLSearchParams();
            if (category) params.append('category', category);
            if (author) params.append('author', author);

            const url = `/api/quotes/random?${params.toString()}`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.success && data.data) {
                updateSpotlightUI(data.data);
            }
        } catch (err) {
            console.error('Error fetching random quote:', err);
        }
    }

    /**
     * Load distinct categories and populate dropdown & quick pills.
     */
    async function loadCategories() {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();

            if (data.success && data.data) {
                // Populate category select dropdown
                categorySelect.innerHTML = '<option value="">All Categories</option>';
                
                // Populate quick pills container
                categoryPillsContainer.innerHTML = '';

                // Add 'All' pill
                const allPill = document.createElement('button');
                allPill.className = 'pill-btn active';
                allPill.dataset.category = '';
                allPill.innerHTML = `All <span class="pill-count">100</span>`;
                allPill.addEventListener('click', () => handlePillClick(''));
                categoryPillsContainer.appendChild(allPill);

                data.data.forEach(cat => {
                    // Dropdown option
                    const opt = document.createElement('option');
                    opt.value = cat.name.toLowerCase();
                    opt.textContent = `${cat.name} (${cat.count})`;
                    categorySelect.appendChild(opt);

                    // Pill button
                    const pill = document.createElement('button');
                    pill.className = 'pill-btn';
                    pill.dataset.category = cat.name.toLowerCase();
                    pill.innerHTML = `${cat.name} <span class="pill-count">${cat.count}</span>`;
                    pill.addEventListener('click', () => handlePillClick(cat.name.toLowerCase()));
                    categoryPillsContainer.appendChild(pill);
                });
            }
        } catch (err) {
            console.error('Error loading categories:', err);
        }
    }

    /**
     * Load distinct authors and populate dropdown.
     */
    async function loadAuthors() {
        try {
            const res = await fetch('/api/authors');
            const data = await res.json();

            if (data.success && data.data) {
                authorSelect.innerHTML = '<option value="">All Authors</option>';
                data.data.forEach(auth => {
                    const opt = document.createElement('option');
                    opt.value = auth.name.toLowerCase();
                    opt.textContent = `${auth.name} (${auth.count})`;
                    authorSelect.appendChild(opt);
                });
            }
        } catch (err) {
            console.error('Error loading authors:', err);
        }
    }

    /**
     * Search quotes matching all active filter criteria.
     */
    async function searchQuotes() {
        try {
            const query = searchInput.value.trim();
            const params = new URLSearchParams();

            if (query) params.append('q', query);
            if (selectedCategory) params.append('category', selectedCategory);
            if (selectedAuthor) params.append('author', selectedAuthor);

            const res = await fetch(`/api/quotes/search?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                renderQuotesGrid(data.data, query || selectedCategory || selectedAuthor);
            }
        } catch (err) {
            console.error('Error searching quotes:', err);
        }
    }

    /* ==========================================================================
       UI Render & Update Functions
       ========================================================================== */

    /**
     * Updates the Spotlight Hero card with smooth opacity animation.
     */
    function updateSpotlightUI(quoteObj) {
        currentSpotlight = quoteObj;

        // Smooth fade out
        spotlightQuote.style.opacity = '0';
        spotlightAuthor.style.opacity = '0';
        spotlightCategory.style.opacity = '0';

        setTimeout(() => {
            spotlightQuote.textContent = `“${quoteObj.quote}”`;
            spotlightAuthor.textContent = `— ${quoteObj.author}`;
            spotlightCategory.textContent = quoteObj.category;

            // Fade back in
            spotlightQuote.style.opacity = '1';
            spotlightAuthor.style.opacity = '1';
            spotlightCategory.style.opacity = '1';
        }, 150);
    }

    /**
     * Renders quote cards in the grid.
     */
    function renderQuotesGrid(quotes, isFiltered) {
        quotesGrid.innerHTML = '';

        if (!quotes || quotes.length === 0) {
            quotesGrid.style.display = 'none';
            emptyState.style.display = 'block';
            resultsCount.textContent = 'No quotes found';
            return;
        }

        quotesGrid.style.display = 'grid';
        emptyState.style.display = 'none';

        resultsCount.textContent = isFiltered 
            ? `Found ${quotes.length} ${quotes.length === 1 ? 'quote' : 'quotes'}`
            : `Showing all ${quotes.length} quotes`;

        quotes.forEach(quote => {
            const card = document.createElement('div');
            card.className = 'quote-grid-card';
            card.innerHTML = `
                <p class="card-quote-text">“${escapeHtml(quote.quote)}”</p>
                <div class="card-footer">
                    <div class="card-author-info">
                        <span class="card-author">— ${escapeHtml(quote.author)}</span>
                        <span class="card-category">${escapeHtml(quote.category)}</span>
                    </div>
                    <button class="card-copy-btn" title="Copy quote" data-quote="${escapeHtml(quote.quote)}" data-author="${escapeHtml(quote.author)}">
                        📋
                    </button>
                </div>
            `;

            // Event listener for card copy button
            const copyBtn = card.querySelector('.card-copy-btn');
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                copyTextToClipboard(`"${quote.quote}" — ${quote.author}`);
            });

            quotesGrid.appendChild(card);
        });
    }

    /**
     * Handles category pill clicking.
     */
    function handlePillClick(category) {
        selectedCategory = category;
        categorySelect.value = category;

        // Update active class on pills
        const pills = categoryPillsContainer.querySelectorAll('.pill-btn');
        pills.forEach(pill => {
            if (pill.dataset.category === category) {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }
        });

        searchQuotes();
    }

    /**
     * Resets all search and filter fields.
     */
    function resetAllFilters() {
        searchInput.value = '';
        btnClearSearch.style.display = 'none';
        selectedCategory = '';
        selectedAuthor = '';
        categorySelect.value = '';
        authorSelect.value = '';

        const pills = categoryPillsContainer.querySelectorAll('.pill-btn');
        pills.forEach(pill => {
            if (pill.dataset.category === '') {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }
        });

        searchQuotes();
    }

    /**
     * Copy text to clipboard and display toast.
     */
    async function copyTextToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for older/non-HTTPS environments
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                textArea.remove();
            }
            showToast('Quote copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy: ', err);
            showToast('Failed to copy quote');
        }
    }

    /**
     * Show transient toast notification.
     */
    function showToast(message) {
        if (toastTimer) clearTimeout(toastTimer);
        toast.textContent = message;
        toast.classList.add('show');
        toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, 2200);
    }

    /**
     * Escape HTML string helper.
     */
    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /* ==========================================================================
       Event Listeners
       ========================================================================== */

    // New Random Quote button
    btnRandom.addEventListener('click', () => {
        fetchRandomQuote(selectedCategory, selectedAuthor);
    });

    // Copy Spotlight Quote
    btnCopySpotlight.addEventListener('click', () => {
        if (currentSpotlight) {
            copyTextToClipboard(`"${currentSpotlight.quote}" — ${currentSpotlight.author}`);
        }
    });

    // Share Spotlight Quote to X (Twitter)
    btnShareSpotlight.addEventListener('click', () => {
        if (currentSpotlight) {
            const tweetText = `"${currentSpotlight.quote}" — ${currentSpotlight.author} #quotes`;
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
            window.open(twitterUrl, '_blank', 'noopener,noreferrer');
        }
    });

    // Search input with debounce & clear button toggle
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();
        btnClearSearch.style.display = query ? 'block' : 'none';

        if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            searchQuotes();
        }, 200);
    });

    // Clear search button
    btnClearSearch.addEventListener('click', () => {
        searchInput.value = '';
        btnClearSearch.style.display = 'none';
        searchQuotes();
    });

    // Category dropdown change
    categorySelect.addEventListener('change', (e) => {
        handlePillClick(e.target.value);
    });

    // Author dropdown change
    authorSelect.addEventListener('change', (e) => {
        selectedAuthor = e.target.value;
        searchQuotes();
    });

    // Reset filters buttons
    btnResetFilters.addEventListener('click', resetAllFilters);
    btnEmptyReset.addEventListener('click', resetAllFilters);
    btnShowAll.addEventListener('click', resetAllFilters);

    /* ==========================================================================
       Initialization
       ========================================================================== */
    async function init() {
        await Promise.all([
            loadCategories(),
            loadAuthors(),
            fetchRandomQuote(),
            searchQuotes()
        ]);
    }

    init();
});
