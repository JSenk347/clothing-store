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
                clearFilters(false); // reset all when clicking Browse directly
                renderBrowseView();
                switchView('browse');
            }

            // category card links
            if (e.target.closest('.cat-card')) {
                const card = e.target.closest('.cat-card');
                const cat = card.dataset.category;

                // if we are currently in a gender view, preserve that gender filter
                // if on home page, just filter by category.
                // note: if we came from Gender view, filters.gender is already set.
                // if from Home, filters.gender might be null.

                // reset other filters but keep gender if set, and add this category
                const currentGender = filters.gender;
                clearFilters(false);
                filters.gender = currentGender;
                filters.category = [cat];

                renderBrowseView();
                switchView('browse');
            }

            // clear all filters
            const btnClear = document.querySelector('#btn-clear-filters');
            if (btnClear) btnClear.addEventListener('click', () => clearFilters(true));

            const btnClearEmpty = document.querySelector('#btn-clear-filters-empty');
            if (btnClearEmpty) btnClearEmpty.addEventListener('click', () => clearFilters(true));

            // sort selector
            const sortSelect = document.querySelector('#sort-select');
            if (sortSelect) {
                sortSelect.addEventListener('change', (e) => {
                    currentSort = e.target.value;
                    applyFilters();
                });
            }

            // about dialog
            const btnAbout = document.querySelector('#btn-about');
            const dialog = document.querySelector('#about-dialog');
            const btnClose = document.querySelector('#btn-close-about');
            const btnCloseBtm = document.querySelector('#btn-close-about-bottom');

            if (btnAbout) btnAbout.addEventListener('click', () => dialog.showModal()); // https://www.w3schools.com/jsreF/met_dialog_showmodal.asp pulls dialog to the foreground
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

    function populateFilterSidebars() {
        const tmplCheckbox = document.querySelector('#tmpl-checkbox');

        function createCheckbox(type, value, label) {
            const clone = tmplCheckbox.content.cloneNode(true);
            const input = clone.querySelector('input');
            const labelEl = clone.querySelector('label');

            input.id = `${type}-${value}`;
            input.value = value;
            input.dataset.filterType = type;

            let isChecked = false;
            if (type === 'gender') isChecked = filters.gender === value;
            else if (filters[type].includes(value)) isChecked = true;

            if (isChecked) input.checked = true;

            input.addEventListener('change', (e) => handleFilterChange(e.target));
            labelEl.textContent = label;

            return clone;
        }

        // create gender filter checkbox HTML
        const genderContainer = document.querySelector('#filter-gender');
        genderContainer.innerHTML = '';
        genderContainer.appendChild(createCheckbox('gender', 'mens', 'Men'));
        genderContainer.appendChild(createCheckbox('gender', 'womens', 'Women'));

        // category filters
        // extract categories
        const allCats = [];
        for (const p of products) {
            allCats.push(p.category);
        }

        // Filter for uniqueness using array methods
        const cats = allCats.filter((item, index) => allCats.indexOf(item) === index);
        cats.sort();

        const catContainer = document.querySelector('#filter-categories');
        catContainer.innerHTML = '';
        for (const c of cats) {
            catContainer.appendChild(createCheckbox('category', c, c));
        }

        // color filters
        // extract all colors
        const allColors = [];
        for (const p of products) {
            for (const c of p.color) {
                allColors.push(c.name);
            }
        }

        // returns filter of unique colors and sorts it
        const colors = allColors.filter((item, index) => allColors.indexOf(item) === index);
        colors.sort();

        const colorContainer = document.querySelector('#filter-colors');
        colorContainer.innerHTML = '';

        for (const c of colors) {
            const btn = document.createElement('button');

            // finds the first product that matches the color
            const sampleProd = products.find(p => p.color.find(col => col.name === c));
            const hex = sampleProd ? sampleProd.color.find(col => col.name === c).hex : '#ccc';

            // populating the button
            btn.className = 'w-6 h-6 border-2 border-black mr-2 mb-2';
            btn.style.backgroundColor = hex;
            btn.title = c;

            if (filters.color.includes(c)) {
                btn.style.outline = '2px solid black';
                btn.style.outlineOffset = '2px';
            }

            btn.addEventListener('click', () => {
                if (filters.color.includes(c)) filters.color = filters.color.filter(item => item !== c);
                else filters.color.push(c);
                applyFilters();
            });

            colorContainer.appendChild(btn);
        }

        // size filters
        const sizes = ["XS", "S", "M", "L", "XL", "24", "26", "28", "30", "32"];
        const sizeContainer = document.querySelector('#filter-sizes');
        sizeContainer.innerHTML = '';

        for (const s of sizes) {
            const btn = document.createElement('button');
            btn.className = 'border-2 border-black py-1 px-2 text-xs font-bold hover:bg-black hover:text-white transition-colors';
            btn.textContent = s;

            if (filters.size.includes(s)) {
                btn.classList.add('bg-black', 'text-white');
            }

            btn.addEventListener('click', () => {
                if (filters.size.includes(s)) filters.size = filters.size.filter(item => item !== s);
                else filters.size.push(s);
                applyFilters();
            });

            sizeContainer.appendChild(btn);
        }
    };

    function updateActiveFilterTags() {
        const activeContainer = document.querySelector('#active-filters');
        activeContainer.innerHTML = '';

        function createTag(label, type) {
            const div = document.createElement('div');
            div.className = 'bg-black text-white border-2 border-black px-2 py-1 text-xs font-bold flex items-center uppercase mr-2 mb-2';
            div.textContent = label;

            const btn = document.createElement('button');
            btn.className = "ml-2 hover:text-gray-300 font-black text-lg leading-none";
            btn.innerHTML = "&times;";
            btn.addEventListener('click', () => {
                if (type === 'gender') filters.gender = null;
                else filters[type] = filters[type].filter(v => v !== label);
                renderBrowseView();
            });

            div.appendChild(btn);
            activeContainer.appendChild(div);
        }

        if (filters.gender) createTag(filters.gender, 'gender');
        filters.category.forEach(c => createTag(c, 'category'));
        filters.color.forEach(c => createTag(c, 'color'));
        filters.size.forEach(c => createTag(c, 'size'));
    }

    function handleFilterChange(input) {
        const type = input.dataset.filterType;

        if (type === 'gender') {
            if (input.checked) {
                filters.gender = input.value;
                document.querySelectorAll(`input[data-filter-type="gender"]`).forEach(el => {
                    if (el !== input) el.checked = false;
                });
            } else {
                filters.gender = null;
            }
        } else {
            // update filter JS
            if (input.checked) filters[type].push(input.value);
            else filters[type] = filters[type].filter(i => i !== input.value);
        }
        applyFilters();
    }

    function renderProductGrid(productList) {
        const grid = document.querySelector('#browse-grid');
        const noRes = document.querySelector('#no-results');

        // check if elements exist
        if (!grid || !noRes) return;

        grid.innerHTML = '';

        if (productList.length === 0) {
            noRes.classList.remove('hidden');
            noRes.classList.add('visible');
            return;
        }

        noRes.classList.add('hidden');
        noRes.classList.remove('visible');

        const template = document.querySelector('#tmpl-product-card');

        if (!template) {
            console.error("Template #tmpl-product-card not found!");
            return;
        }

        for (const p of productList) {
            const clone = template.content.cloneNode(true);
            const cardDiv = clone.querySelector('.product-card');

            // populate product card
            const placeholder = clone.querySelector('.card-placeholder');
            const title = clone.querySelector('.card-title');
            const cat = clone.querySelector('.card-category');
            const price = clone.querySelector('.card-price');

            if (placeholder) placeholder.textContent = p.name;
            if (title) title.textContent = p.name;
            if (cat) cat.textContent = p.category;
            if (price) price.textContent = `$${p.price.toFixed(2)}`;

            // NEED: click handler to bring us to product page
            if (cardDiv) {
                cardDiv.addEventListener('click', () => {
                    renderProductView(p.id);
                    switchView("product")
                });
            }

            grid.appendChild(clone);
        }
    }

    function applyFilters() {
        let result = products.filter(p => {
            // gender
            if (filters.gender && p.gender !== filters.gender) return false;

            // category
            if (filters.category.length > 0 && !filters.category.includes(p.category)) return false;

            // color
            if (filters.color.length > 0) {
                // check if product has at least one matching color
                let hasColor = false;
                for (const c of p.color) {
                    if (filters.color.includes(c.name)) {
                        hasColor = true;
                        break;
                    }
                }
                if (!hasColor) return false;
            }

            // size
            if (filters.size.length > 0) {
                // check if at product has at least 1 size
                let hasSize = false;
                for (const s of p.sizes) {
                    if (filters.size.includes(s)) {
                        hasSize = true;
                        break;
                    }
                }
                if (!hasSize) return false;
            }
            return true;
        });


        const sortMethod = (typeof currentSort !== 'undefined') ? currentSort : 'name_asc';

        if (sortMethod === 'name_asc') result.sort((a, b) => a.name.localeCompare(b.name));
        if (sortMethod === 'price_asc') result.sort((a, b) => a.price - b.price);
        if (sortMethod === 'price_desc') result.sort((a, b) => b.price - a.price);

        // update filter "results" count
        document.querySelector('#results-count').textContent = `${result.length} Results`;

        // render grid
        renderProductGrid(result);

        // update active filter HTML
        updateActiveFilterTags();
    }

    function renderProductView(productId) {
        // find product by id
        const p = products.find(i => i.id == productId);
        if (!p) return;
        

        // update details
        document.querySelector('#p-title').textContent = p.name;
        document.querySelector('#p-price').textContent = `$${p.price.toFixed(2)}`;
        document.querySelector('#p-desc').textContent = p.description;
        document.querySelector('#p-material').textContent = p.material;
        document.querySelector('#p-img-text').textContent = p.name;

        // breadcrumbs
        document.querySelector('#crumb-gender').textContent = p.gender;
        document.querySelector('#crumb-category').textContent = p.category;
        document.querySelector('#crumb-title').textContent = p.name;

        // store ID for fart
        document.querySelector('#btn-add-cart').dataset.productId = p.id;

        // color selection Logic
        const cContainer = document.querySelector('#p-colors');
        cContainer.innerHTML = '';
        const hiddenColorInput = document.querySelector('#selected-color');
        hiddenColorInput.value = '';

        for (const c of p.color) {
            const btn = document.createElement('button');
            btn.className = 'w-8 h-8 border-2 border-black mr-2';
            btn.style.backgroundColor = c.hex;
            btn.title = c.name;
            btn.addEventListener('click', () => {
                // clear styles
                Array.from(cContainer.children).forEach(b => b.style.outline = 'none');
                // set Active
                btn.style.outline = '2px solid black';
                btn.style.outlineOffset = '2px';
                hiddenColorInput.value = c.name;
            });
            cContainer.appendChild(btn);
        }

        // size selection
        const sContainer = document.querySelector('#p-sizes');
        sContainer.innerHTML = '';
        const hiddenSizeInput = document.querySelector('#selected-size');
        hiddenSizeInput.value = '';

        for (const s of p.sizes) {
            const btn = document.createElement('button');
            btn.className = 'min-w-[3rem] h-10 border-2 border-black font-bold hover:bg-black hover:text-white transition-colors mr-2';
            btn.textContent = s;
            btn.addEventListener('click', () => {
                // clear styles
                Array.from(sContainer.children).forEach(b => {
                    b.classList.remove('bg-black', 'text-white');
                    b.classList.add('hover:border-black');
                    b.classList.add('hover:bg-black');
                });
                // set as active
                btn.classList.remove('hover:bg-black');
                btn.classList.add('bg-black', 'text-white');
                // set value
                hiddenSizeInput.value = s;
            });
            sContainer.appendChild(btn);
        }

        // reset qty
        const qtyInput = document.querySelector('#p-qty');
        if (qtyInput) qtyInput.value = 1;

        // related products logiv
        const related = products.filter(item => item.category === p.category && item.id !== p.id).slice(0, 4);
        const relatedGrid = document.querySelector('#related-grid');
        relatedGrid.innerHTML = '';

        const template = document.querySelector('#tmpl-product-card');
        if (template) {
            for (const rp of related) {
                const clone = template.content.cloneNode(true);
                const cardDiv = clone.querySelector('.product-card');

                clone.querySelector('.card-placeholder').textContent = rp.name;
                clone.querySelector('.card-title').textContent = rp.name;
                clone.querySelector('.card-category').textContent = rp.category;
                clone.querySelector('.card-price').textContent = `$${rp.price.toFixed(2)}`;

                // set data-product-id for delegation in related grid as well
                if (cardDiv) {
                    cardDiv.dataset.productId = rp.id;
                }
                relatedGrid.appendChild(clone);

                cardDiv.addEventListener("click", () => {
                    renderProductView(rp.id);
                    switchView("product")
                })
            }
        }
    }

    function clearFilters(redraw = true) {
        filters = { gender: null, category: [], color: [], size: [] };
        if (redraw) renderBrowseView();
    }

    
// CART DATA MANAGEMENT

// Load cart from LocalStorage on startup
function loadCart() {
    const storedCart = localStorage.getItem("stylehub_cart");
    if (storedCart) {
        cart = JSON.parse(storedCart);
    }
    updateCartCount();
}

// Save current cart state to LocalStorage
function saveCart() {
    localStorage.setItem("stylehub_cart", JSON.stringify(cart));
    updateCartCount();
}

// Update the badge count in the header
function updateCartCount() {
    const count = cart.reduce((acc, item) => acc + item.qty, 0);
    const badge = document.querySelector('#cart-count');
    if (badge) {
        badge.textContent = count;
    }
}

// Logic to add an item to the cart array
function addToCart() {
    const btn = document.querySelector('#btn-add-cart');
    // Guard clause if button doesn't exist in current view
    if (!btn) return; 

    const productId = btn.dataset.productId;
    const colorInput = document.querySelector('#selected-color');
    const sizeInput = document.querySelector('#selected-size');
    const qtyInput = document.querySelector('#p-qty');

    // Validation
    if (!colorInput.value || !sizeInput.value) {
        showToast("Please select a color and size.", "error");
        return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    const qty = parseInt(qtyInput.value) || 1;

    // Check if exact variant exists
    const existingItem = cart.find(item => 
        item.id === productId && 
        item.color === colorInput.value && 
        item.size === sizeInput.value
    );

    if (existingItem) {
        existingItem.qty += qty;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: "IMG", 
            color: colorInput.value,
            size: sizeInput.value,
            qty: qty
        });
    }

    saveCart();
    showToast(`${product.name} added to cart!`);
}

// Logic to remove an item by index
function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCartView(); 
}

    // --- function calls ---
    init();
});