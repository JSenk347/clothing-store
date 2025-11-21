const DATA_URL = 'https://gist.githubusercontent.com/rconnolly/d37a491b50203d66d043c26f33dbd798/raw/37b5b68c527ddbe824eaed12073d266d5455432a/clothing-compact.json';

// start fetching when page DOM content loads. treated as "main"
document.addEventListener('DOMContentLoaded', () => {

    // --- global state ---
    let products = [];

    // --- initialization ---
    async function init() {
        await fetchData();
        setupEventListeners();
    }
    // --- function definitions ---

    /**
    * Fetches data from the specified URL or LocalStorage
    */
    async function fetchData() {
        console.log(`Attempting to fetch data...`);
        try {
            const productsStr = localStorage.getItem("products");

            if (!productsStr) {
                const resp = await fetch(DATA_URL);
                if (resp.ok) {
                    const data = await resp.json();
                    localStorage.setItem("products", JSON.stringify(data));
                    products = data;
                    console.log("Data loaded from API");
                } else {
                    console.error("Error fetching data", resp.statusText);
                }
            } else {
                products = JSON.parse(productsStr);
                console.log("Data loaded from LocalStorage");
            }
        } catch (error) {
            console.error("Error fetching data", error.message);
        }
    }

    /**
     * Sets up global event listeners (delegation)
     */
    function setupEventListeners() {
        // handle clicks for nav buttons
        document.querySelector('body').addEventListener('click', (e) => {

            // gender links
            if (e.target.matches('.nav-gender')) {
                e.preventDefault();
                const gender = e.target.dataset.filterGender; // retrieving data-filter-gender HTML property value (men/women)
                // render and switch views
                renderGenderView(gender);
                switchView('gender');
            }

            // home link
            if (e.target.dataset.view === 'home') {
                e.preventDefault();
                switchView('home');
            }

            // browse link
            if (e.target.dataset.view === 'browse') {
                e.preventDefault();
                clearFilters(false); // Reset all when clicking Browse directly
                renderBrowseView();
                switchView('browse');
            }

            // Category Cards (Delegation for Home and Gender views)
            if (e.target.closest('.cat-card')) {
                const card = e.target.closest('.cat-card');
                const cat = card.dataset.category;

                // Navigate to browse with this category pre-selected
                // If we are currently in a gender view, preserve that gender filter
                // If on home page, maybe clear gender or infer it? Simplest is to just filter by category.

                // Note: If we came from Gender view, filters.gender is already set.
                // If from Home, filters.gender might be null.

                // We need to reset OTHER filters but keep gender if set, and add this category
                const currentGender = filters.gender;
                clearFilters(false);
                filters.gender = currentGender;
                filters.category = [cat];

                renderBrowseView();
                switchView('browse');
            }

            // About Dialog
            const btnAbout = document.querySelector('#btn-about');
            const dialog = document.querySelector('#about-dialog');
            const btnClose = document.querySelector('#btn-close-about');
            const btnCloseBtm = document.querySelector('#btn-close-about-bottom');

            if (btnAbout) btnAbout.addEventListener('click', () => dialog.showModal());
            if (btnClose) btnClose.addEventListener('click', () => dialog.close());
            if (btnCloseBtm) btnCloseBtm.addEventListener('click', () => dialog.close());


        });
    }

    /**
     * Hides all views and shows the specific target view
     * @param {string} viewId - the id part after 'view-' (e.g., 'home', 'gender')
     */
    function switchView(viewId) {
        // select all view articles
        const views = document.querySelectorAll('.view-section');

        for (const view of views) {
            view.classList.add('hidden');
            view.classList.remove('visible');
        }

        const target = document.querySelector(`#view-${viewId}`);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('visible');
        }

        // scroll to top
        window.scrollTo(0, 0);
    }

    /**
     * Populates the Gender View (Women/Men)
     * @param {string} gender - 'womens' or 'mens'
     */
    function renderGenderView(gender) {
        // filter gender
        const genderProducts = products.filter(p => p.gender === gender);

        const categories = [...new Set(genderProducts.map(p => p.category))];

        // getting title element
        const titleElement = document.querySelector('#gender-title');
        titleElement.textContent = gender === 'mens' ? "Men's Collection" : "Women's Collection";


        const container = document.querySelector('#gender-categories');
        container.innerHTML = '';

        const template = document.querySelector('#tmpl-category-card');

        for (const cat of categories) {
            const clone = template.content.cloneNode(true);

            // populate clone data
            clone.querySelector('.cat-title').textContent = cat;
            clone.querySelector('.cat-title-placeholder').textContent = cat;



            container.appendChild(clone);
        }
    }

    function renderBrowseView() {
        populateFilterSidebars();
        applyFilters();
    }
    
    function populateFilterSidebars(){
        function createCheckbox(type, value, label){};
    };

    function applyFilters() {};

    function clearFilters() {};

    

    // --- function calls ---
    init();
});