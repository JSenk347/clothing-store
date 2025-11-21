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
        window.scrollTo(0,0);
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

    // --- function calls ---
    init();
});