/**
 * JDClothing - Single Page Application
 * COMP 3612 - Assignment 2
 * 
 * A responsive e-commerce SPA featuring:
 * - Dynamic product browsing with filtering and sorting
 * - Persistent shopping cart using LocalStorage
 * - Gender and category-based navigation
 * 
 * @authors Darren Law, Jordan Senko
 */

const DATA_URL = 'https://gist.githubusercontent.com/rconnolly/d37a491b50203d66d043c26f33dbd798/raw/37b5b68c527ddbe824eaed12073d266d5455432a/clothing-compact.json';

document.addEventListener('DOMContentLoaded', () => {

    /* =========================================
       GLOBAL STATE
       ========================================= */
    let products = [];
    let cart = []; 
    let filters = { gender: null, category: [], color: [], size: [] };
    let currentSort = 'name_asc';

    /**
     * Initializes the application by loading data and setting up event listeners.
     */
    async function init() {
        await fetchData();
        loadCart(); 
        setupEventListeners();
        renderFeaturedProducts();
    }

    /* =========================================
       SHARED HELPER FUNCTIONS
       ========================================= */

    /**
     * Creates a product card element from a product object using the template.
     * @param {Object} product - The product data object
     * @returns {DocumentFragment} - Cloned template with product data populated
     */
    function createProductCard(product) {
        const template = document.querySelector('#tmpl-product-card');
        const clone = template.content.cloneNode(true);
        const cardDiv = clone.querySelector('.product-card');

        const placeholder = clone.querySelector('.card-placeholder');
        const title = clone.querySelector('.card-title');
        const cat = clone.querySelector('.card-category');
        const price = clone.querySelector('.card-price');

        if (placeholder) placeholder.textContent = product.name;
        if (title) title.textContent = product.name;
        if (cat) cat.textContent = product.category;
        if (price) price.textContent = `$${product.price.toFixed(2)}`;

        const quickAddBtn = clone.querySelector('.btn-quick-add');
        if (quickAddBtn) {
            quickAddBtn.addEventListener('click', (e) => {
                e.stopPropagation(); 
                quickAddToCart(product);
            });
        }

        if (cardDiv) {
            cardDiv.addEventListener('click', () => {
                renderProductView(product.id);
                switchView('product');
            });
        }

        return clone;
    }

    /**
     * Renders the first 4 products as featured items on the home page.
     */
    function renderFeaturedProducts() {
        const container = document.querySelector('#featured-products-container');
        if (!container || products.length === 0) return;

        container.innerHTML = '';
        const featuredProducts = products.slice(0, 4);

        for (const p of featuredProducts) {
            container.appendChild(createProductCard(p));
        }
    }

    /**
     * Fetches product data from API or LocalStorage cache.
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

    /* =========================================
       EVENT HANDLERS
       ========================================= */

    /**
     * Handles gender navigation clicks (Men/Women).
     * @param {Event} e - Click event
     */
    function handleGenderNavigation(e) {
        e.preventDefault();
        const gender = e.target.dataset.filterGender;
        renderGenderView(gender);
        switchView('gender');
    }

    /**
     * Handles category card clicks to filter by category.
     * @param {HTMLElement} card - The clicked category card element
     */
    function handleCategoryCardClick(card) {
        const cat = card.dataset.category;
        const currentGender = filters.gender;
        
        clearFilters(false);
        filters.gender = currentGender;
        filters.category = [cat];

        renderBrowseView();
        switchView('browse');
    }

    /**
     * Handles about dialog open/close actions.
     * @param {Event} e - Click event
     */
    function handleAboutDialog(e) {
        const dialog = document.querySelector('#about-dialog');
        const btnAbout = document.querySelector('#btn-about');
        const btnClose = document.querySelector('#btn-close-about');
        const btnCloseBtm = document.querySelector('#btn-close-about-bottom');

        if (btnAbout && e.target === btnAbout) dialog.showModal();
        if (btnClose && e.target === btnClose) dialog.close();
        if (btnCloseBtm && e.target === btnCloseBtm) dialog.close();
    }

    /**
     * Sets up all event listeners using event delegation.
     */
    function setupEventListeners() {
        document.querySelector('body').addEventListener('click', (e) => {

            // Gender Navigation
            if (e.target.matches('.nav-gender')) {
                handleGenderNavigation(e);
            }

            // Home Navigation
            if (e.target.dataset.view === 'home') {
                e.preventDefault();
                switchView('home');
            }

            // Browse Navigation
            if (e.target.dataset.view === 'browse') {
                e.preventDefault();
                clearFilters(false);
                renderBrowseView();
                switchView('browse');
            }

            // Category Card Navigation
            if (e.target.closest('.cat-card')) {
                handleCategoryCardClick(e.target.closest('.cat-card'));
            }

            // Clear Filters
            const btnClear = document.querySelector('#btn-clear-filters');
            if (btnClear && e.target === btnClear) clearFilters(true);

            const btnClearEmpty = document.querySelector('#btn-clear-filters-empty');
            if (btnClearEmpty && e.target === btnClearEmpty) clearFilters(true);

            // About Dialog
            handleAboutDialog(e);

            // Open Cart View
            if (e.target.closest('#btn-cart')) {
                e.preventDefault();
                renderCartView();
                switchView('cart');
            }

            // Add To Cart Button
            if (e.target.id === 'btn-add-cart') {
                addToCart();
            }
        });

        // Sort Selector
        const sortSelect = document.querySelector('#sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                currentSort = e.target.value;
                applyFilters();
            });
        }
    }

    /**
     * Switches the visible view section.
     * @param {string} viewId - The ID suffix of the view to display
     */
    function switchView(viewId) {
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

        window.scrollTo(0, 0);
    }

    /* =========================================
       CART IMPLEMENTATION
       ========================================= */

    /**
     * Loads cart data from LocalStorage on application startup.
     */
    function loadCart() {
        const storedCart = localStorage.getItem("jdclothing_cart");
        if (storedCart) {
            cart = JSON.parse(storedCart);
        }
        updateCartCount();
    }

    /**
     * Persists the current cart state to LocalStorage.
     */
    function saveCart() {
        localStorage.setItem("jdclothing_cart", JSON.stringify(cart));
        updateCartCount();
    }

    /**
     * Updates the cart count badge in the header.
     */
    function updateCartCount() {
        const count = cart.reduce((acc, item) => acc + item.qty, 0); // https://www.w3schools.com/jsref/jsref_reduce.asp for .reduce()
        const badge = document.querySelector('#cart-count');
        if (badge) {
            badge.textContent = count;
        }
    }

    /**
     * Validates that color and size are selected.
     * @returns {Object} - { isValid, colorInput, sizeInput, colorLabel, sizeLabel }
     */
    function validateCartSelections() {
        const colorInput = document.querySelector('#selected-color');
        const sizeInput = document.querySelector('#selected-size');
        const colorContainer = document.querySelector('#p-colors');
        const sizeContainer = document.querySelector('#p-sizes');
        const colorLabel = colorContainer.previousElementSibling;
        const sizeLabel = sizeContainer.previousElementSibling;

        // Reset previous error styles
        if (colorLabel) colorLabel.classList.remove('text-red-600');
        if (sizeLabel) sizeLabel.classList.remove('text-red-600');

        let isValid = true;

        if (!colorInput.value) {
            if (colorLabel) colorLabel.classList.add('text-red-600');
            isValid = false;
        }

        if (!sizeInput.value) {
            if (sizeLabel) sizeLabel.classList.add('text-red-600');
            isValid = false;
        }

        return { isValid, colorInput, sizeInput };
    }

    /**
     * Adds a product variant to the cart array.
     * @param {Object} product - The product object
     * @param {string} color - Selected color
     * @param {string} size - Selected size
     * @param {number} qty - Quantity to add
     */
    function addItemToCart(product, color, size, qty) {
        const existingItem = cart.find(item =>
            item.id === product.id &&
            item.color === color &&
            item.size === size
        );

        if (existingItem) {
            existingItem.qty += qty;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image || "IMG",
                color: color,
                size: size,
                qty: qty
            });
        }
    }

    /**
     * Quickly adds a product to cart with default color and size.
     * @param {Object} product - The product object to add
     */
    function quickAddToCart(product) {
        const defaultColor = product.color[0].name;
        const defaultSize = product.sizes[0];

        addItemToCart(product, defaultColor, defaultSize, 1);
        saveCart();
        showToast(`${product.name} added to cart!`);
    }

    /**
     * Validates selections and adds the current product to cart.
     */
    function addToCart() {
        const btn = document.querySelector('#btn-add-cart');
        if (!btn) return;

        const validation = validateCartSelections();

        if (!validation.isValid) {
            showToast("Please select options highlighted in red.", "error");
            return;
        }

        const productId = btn.dataset.productId;
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const qtyInput = document.querySelector('#p-qty');
        const qty = parseInt(qtyInput.value) || 1; // https://www.w3schools.com/jsref/jsref_parseint.asp

        addItemToCart(product, validation.colorInput.value, validation.sizeInput.value, qty);
        saveCart();
        showToast(`${product.name} added to cart!`);
    }

    /**
     * Removes an item from the cart by index.
     * @param {number} index - The index of the item to remove
     */
    function removeFromCart(index) {
        cart.splice(index, 1);
        saveCart();
        renderCartView(); 
    }

    /**
     * Displays a toast notification message.
     * @param {string} message - The message to display
     * @param {string} type - 'success' or 'error' for styling
     */
    function showToast(message, type = "success") {
        const container = document.querySelector('#toast-container');
        
        const toast = document.createElement('div');
        toast.className = `p-4 mb-2 text-white font-bold uppercase text-sm border-2 border-black shadow-lg transition-opacity duration-500`;
        
        if (type === 'error') {
            toast.classList.add('bg-red-600');
        } else {
            toast.classList.add('bg-black');
        }
        
        toast.textContent = message;

        container.appendChild(toast);

        // Animate out
        setTimeout(() => {
            toast.classList.add('opacity-0');
            setTimeout(() => {
                if(container.contains(toast)) container.removeChild(toast);
            }, 500);
        }, 3000);
    }

    /**
     * Updates the quantity of a cart item.
     * @param {number} index - The index of the item in the cart
     * @param {number} newQty - The new quantity value
     */
    function updateCartItemQty(index, newQty) {
        if (newQty < 1) {
            removeFromCart(index);
            return;
        }
        cart[index].qty = newQty;
        saveCart();
        renderCartView();
    }

    /**
     * Creates the header row for the cart list.
     * @returns {HTMLElement} - The header row element
     */
    function createCartHeaderRow() {
        const row = document.createElement('div');
        row.className = "hidden md:grid grid-cols-6 gap-4 border-b-2 border-black pb-2 font-bold uppercase text-sm mb-4";

        const headers = [
            { text: "Item", col: "col-span-2" },
            { text: "Color/Size", col: "" },
            { text: "Price", col: "text-right" },
            { text: "Qty", col: "text-center" },
            { text: "Subtotal", col: "text-right" }
        ];

        headers.forEach(h => {
            const div = document.createElement('div');
            div.textContent = h.text;
            if (h.col) div.className = h.col;
            row.appendChild(div);
        });
        
        return row;
    }

    /**
     * Creates a cart column with optional mobile label.
     * @param {string} className - CSS classes for the column
     * @param {string} content - Text content
     * @param {string|null} mobileLabel - Optional mobile-only label
     * @returns {HTMLElement} - The column div element
     */
    function createCartColumn(className, content, mobileLabel = null) {
        const col = document.createElement('div');
        col.className = className;

        if (mobileLabel) {
            const label = document.createElement('span');
            label.className = "md:hidden font-bold mr-2";
            label.textContent = mobileLabel;
            col.appendChild(label);
        }

        col.appendChild(document.createTextNode(content));
        return col;
    }

    /**
     * Creates the item info column (image + title + remove button).
     * @param {Object} item - Cart item
     * @param {number} index - Item index for removal
     * @returns {HTMLElement} - The column element
     */
    function createItemInfoColumn(item, index) {
        const col = document.createElement('div');
        col.className = "col-span-2 flex gap-4 items-center";

        const imgPlaceholder = document.createElement('div');
        imgPlaceholder.className = "w-16 h-16 bg-gray-200 border border-black flex items-center justify-center text-xs font-bold";
        imgPlaceholder.textContent = item.image || "IMG";

        const titleDiv = document.createElement('div');
        const h3 = document.createElement('h3');
        h3.className = "font-bold uppercase text-sm";
        h3.textContent = item.name;

        const removeBtn = document.createElement('button');
        removeBtn.className = "text-xs underline text-red-600 font-bold uppercase mt-1 hover:text-red-800";
        removeBtn.textContent = "Remove";
        removeBtn.addEventListener('click', () => removeFromCart(index));

        titleDiv.appendChild(h3);
        titleDiv.appendChild(removeBtn);
        col.appendChild(imgPlaceholder);
        col.appendChild(titleDiv);

        return col;
    }

    /**
     * Creates a quantity control with +/- buttons.
     * @param {Object} item - Cart item object
     * @param {number} index - Item index in cart
     * @returns {HTMLElement} - The quantity control element
     */
    function createQtyControl(item, index) {
        const col = document.createElement('div');
        col.className = "flex items-center justify-center gap-2";

        // Mobile label
        const mobileLabel = document.createElement('span');
        mobileLabel.className = "md:hidden font-bold mr-2";
        mobileLabel.textContent = "Qty:";
        col.appendChild(mobileLabel);

        // Decrease button
        const decreaseBtn = document.createElement('button');
        decreaseBtn.className = "w-6 h-6 font-bold text-lg hover:text-gray-500 transition-colors";
        decreaseBtn.textContent = "-";
        decreaseBtn.addEventListener('click', () => updateCartItemQty(index, item.qty - 1));

        // Quantity display
        const qtyDisplay = document.createElement('span');
        qtyDisplay.className = "w-8 text-center font-mono font-bold";
        qtyDisplay.textContent = item.qty.toString();

        // Increase button
        const increaseBtn = document.createElement('button');
        increaseBtn.className = "w-6 h-6 font-bold text-lg hover:text-gray-500 transition-colors";
        increaseBtn.textContent = "+";
        increaseBtn.addEventListener('click', () => updateCartItemQty(index, item.qty + 1));

        col.appendChild(decreaseBtn);
        col.appendChild(qtyDisplay);
        col.appendChild(increaseBtn);

        return col;
    }

    /**
     * Creates a single cart item row.
     * @param {Object} item - Cart item object
     * @param {number} index - Item index for removal
     * @returns {HTMLElement} - The row element
     */
    function createCartItemRow(item, index) {
        const row = document.createElement('article');
        row.className = "grid grid-cols-1 md:grid-cols-6 gap-4 items-center border-b border-gray-200 py-4";

        row.appendChild(createItemInfoColumn(item, index));
        row.appendChild(createCartColumn("flex md:block gap-2 text-sm font-mono uppercase", `${item.color} / ${item.size}`, "Variant: "));
        row.appendChild(createCartColumn("text-right font-mono", `$${item.price.toFixed(2)}`, "Price:"));
        row.appendChild(createQtyControl(item, index));
        row.appendChild(createCartColumn("text-right font-bold font-mono", `$${(item.price * item.qty).toFixed(2)}`, "Subtotal:"));

        return row;
    }

    /**
     * Creates a labeled select dropdown element.
     * @param {string} id - Element ID
     * @param {string} labelText - Label text
     * @param {Array} options - Array of {value, text} objects
     * @returns {HTMLElement} - Wrapper div with label and select
     */
    function createSelectInput(id, labelText, options) {
        const wrapper = document.createElement('div');
        wrapper.className = "mb-4";

        const label = document.createElement('label');
        label.className = "block font-bold uppercase text-xs mb-1";
        label.setAttribute('for', id);
        label.textContent = labelText;

        const select = document.createElement('select');
        select.id = id;
        select.className = "w-full border-2 border-black p-2 font-bold uppercase text-sm bg-white cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black";

        options.forEach(opt => {
            const optionEl = document.createElement('option');
            optionEl.value = opt.value;
            optionEl.textContent = opt.text;
            select.appendChild(optionEl);
        });

        wrapper.appendChild(label);
        wrapper.appendChild(select);
        return wrapper;
    }

    /**
     * Creates a summary row displaying a label and value.
     * @param {string} label - Row label text
     * @param {string} id - ID for the value span
     * @param {boolean} isBold - Whether row should be bold/emphasized
     * @returns {HTMLElement} - The row div
     */
    function createSummaryRow(label, id, isBold = false) {
        const div = document.createElement('div');
        let boldClasses = '';
        if (isBold) {
            boldClasses = 'text-lg font-black border-t-2 border-black pt-2 mt-2';
        }
        div.className = `flex justify-between ${boldClasses}`;

        const lbl = document.createElement('span');
        lbl.textContent = label;

        const val = document.createElement('span');
        val.id = id;
        val.textContent = "$0.00";

        div.appendChild(lbl);
        div.appendChild(val);
        return div;
    }

    /**
     * Calculates shipping cost based on destination and method.
     * @param {number} merchTotal - Merchandise subtotal
     * @param {string} dest - Destination code (ca/us/int)
     * @param {string} method - Shipping method (standard/express/priority)
     * @returns {number} - Shipping cost
     */
    function calculateShipping(merchTotal, dest, method) {
        if (merchTotal > 500) return 0;

        const rates = {
            'standard': { 'ca': 10, 'us': 15, 'int': 20 },
            'express': { 'ca': 25, 'us': 25, 'int': 30 },
            'priority': { 'ca': 35, 'us': 50, 'int': 50 }
        };
        return rates[method][dest];
    }

    /**
     * Creates the order summary sidebar box.
     * @returns {HTMLElement} - The summary box element
     */
    function createSummaryBox() {
        const box = document.createElement('aside');
        box.className = "border-2 border-black p-6 sticky top-24 bg-gray-50";

        const h2 = document.createElement('h2');
        h2.className = "font-black uppercase text-xl mb-4 border-b-2 border-black pb-2";
        h2.textContent = "Order Summary";
        box.appendChild(h2);

        // Destination Select
        box.appendChild(createSelectInput('cart-dest', 'Destination', [
            { value: 'ca', text: 'Canada' },
            { value: 'us', text: 'United States' },
            { value: 'int', text: 'International' }
        ]));

        // Shipping Select
        box.appendChild(createSelectInput('cart-ship', 'Shipping Method', [
            { value: 'standard', text: 'Standard' },
            { value: 'express', text: 'Express' },
            { value: 'priority', text: 'Priority' }
        ]));

        // Totals Display
        const totalsDiv = document.createElement('div');
        totalsDiv.className = "space-y-2 font-mono text-sm mb-6 border-t-2 border-black pt-4";
        totalsDiv.appendChild(createSummaryRow("Merchandise", "summary-merch"));
        totalsDiv.appendChild(createSummaryRow("Shipping", "summary-ship"));
        totalsDiv.appendChild(createSummaryRow("Tax (5% CA only)", "summary-tax"));
        totalsDiv.appendChild(createSummaryRow("Total", "summary-total", true));
        box.appendChild(totalsDiv);

        // Checkout Button
        const checkoutBtn = document.createElement('button');
        checkoutBtn.className = "w-full bg-black text-white py-3 font-bold uppercase border-2 border-black hover:bg-white hover:text-black transition-colors";
        checkoutBtn.textContent = "Checkout";
        checkoutBtn.addEventListener('click', handleCheckout);
        box.appendChild(checkoutBtn);

        // Update totals on change
        const updateTotals = () => {
            const merchTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
            const dest = box.querySelector('#cart-dest').value;
            const method = box.querySelector('#cart-ship').value;
            const shippingCost = calculateShipping(merchTotal, dest, method);
            let tax = 0;
            if (dest === 'ca') {
                tax = merchTotal * 0.05;
            }
            const grandTotal = merchTotal + shippingCost + tax;

            box.querySelector('#summary-merch').textContent = `$${merchTotal.toFixed(2)}`;
            box.querySelector('#summary-ship').textContent = `$${shippingCost.toFixed(2)}`;
            box.querySelector('#summary-tax').textContent = `$${tax.toFixed(2)}`;
            box.querySelector('#summary-total').textContent = `$${grandTotal.toFixed(2)}`;
        };

        box.querySelector('#cart-dest').addEventListener('change', updateTotals);
        box.querySelector('#cart-ship').addEventListener('change', updateTotals);
        updateTotals();

        return box;
    }

    /**
     * Handles checkout - clears cart and returns to home.
     */
    function handleCheckout() {
        cart = [];
        saveCart();
        renderCartView();
        showToast("Order placed successfully!");

        setTimeout(() => switchView('home'), 1500);
    }

    /**
     * Creates the cart page header.
     * @returns {HTMLElement} - Header section
     */
    function createCartHeader() {
        const headerSection = document.createElement('header');
        headerSection.className = "border-2 border-black p-8 text-center mb-8 bg-white";
        const h1 = document.createElement('h1');
        h1.className = "text-4xl font-black uppercase";
        h1.textContent = "Shopping Cart";
        headerSection.appendChild(h1);
        return headerSection;
    }

    /**
     * Creates the empty cart state element.
     * @returns {HTMLElement} - Empty state div
     */
    function createEmptyCartState() {
        const emptyState = document.createElement('div');
        emptyState.className = "text-center py-12 border-2 border-dashed border-black bg-gray-50";

        const msg = document.createElement('p');
        msg.className = "font-bold uppercase text-lg text-gray-500 mb-4";
        msg.textContent = "Your cart is empty.";

        const shopBtn = document.createElement('button');
        shopBtn.className = "underline font-bold uppercase hover:bg-black hover:text-white px-2 py-1";
        shopBtn.textContent = "Continue Shopping";
        shopBtn.addEventListener('click', () => {
            const browseLink = document.querySelector('[data-view="browse"]');
            if (browseLink) browseLink.click();
        });

        emptyState.appendChild(msg);
        emptyState.appendChild(shopBtn);
        return emptyState;
    }

    /**
     * Renders the shopping cart view.
     */
    function renderCartView() {
        const container = document.querySelector('#view-cart');
        if (!container) return;

        // Clear container
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        container.appendChild(createCartHeader());

        // Handle empty state
        if (cart.length === 0) {
            container.appendChild(createEmptyCartState());
            return;
        }

        // Render cart content
        const wrapper = document.createElement('div');
        wrapper.className = "flex flex-col lg:flex-row gap-8";

        // Items list
        const itemsSection = document.createElement('section');
        itemsSection.className = "w-full lg:w-2/3 space-y-4";
        itemsSection.appendChild(createCartHeaderRow());
        cart.forEach((item, index) => itemsSection.appendChild(createCartItemRow(item, index)));
        wrapper.appendChild(itemsSection);

        // Summary sidebar
        const summarySection = document.createElement('div');
        summarySection.className = "w-full lg:w-1/3";
        summarySection.appendChild(createSummaryBox());
        wrapper.appendChild(summarySection);

        container.appendChild(wrapper);
    }

    /* =========================================
       BROWSE & PRODUCT VIEW
       ========================================= */

    /**
     * Renders the gender-specific category view.
     * @param {string} gender - The gender filter (mens/womens)
     */
    function renderGenderView(gender) {
        const genderProducts = products.filter(p => p.gender === gender);
        const categories = [...new Set(genderProducts.map(p => p.category))];

        const titleElement = document.querySelector('#gender-title');
        if (gender === 'mens') {
            titleElement.textContent = "Men's Collection";
        } else {
            titleElement.textContent = "Women's Collection";
        }

        const container = document.querySelector('#gender-categories');
        container.innerHTML = '';

        const template = document.querySelector('#tmpl-category-card');

        for (const cat of categories) {
            const clone = template.content.cloneNode(true);
            clone.querySelector('.cat-title').textContent = cat;
            clone.querySelector('.cat-title-placeholder').textContent = cat;
            clone.querySelector('.cat-card').dataset.category = cat; 
            container.appendChild(clone);
        }
    }

    /**
     * Renders the browse view with filters and product grid.
     */
    function renderBrowseView() {
        populateFilterSidebars();
        applyFilters();
    }

    /**
     * Extracts unique values from products array.
     * @param {Function} extractor - Function to extract values from each product
     * @returns {Array} - Sorted unique values
     */
    function getUniqueValues(extractor) {
        const values = [];
        for (const p of products) {
            const extracted = extractor(p);
            if (Array.isArray(extracted)) {
                values.push(...extracted);
            } else {
                values.push(extracted);
            }
        }
        return [...new Set(values)].sort();
    }

    /**
     * Creates a filter checkbox element.
     * @param {string} type - Filter type (gender/category)
     * @param {string} value - Filter value
     * @param {string} label - Display label
     * @returns {DocumentFragment} - Cloned checkbox template
     */
    function createFilterCheckbox(type, value, label) {
        const tmplCheckbox = document.querySelector('#tmpl-checkbox');
        const clone = tmplCheckbox.content.cloneNode(true);
        const input = clone.querySelector('input');
        const labelEl = clone.querySelector('label');

        input.id = `${type}-${value}`;
        input.value = value;
        input.dataset.filterType = type;

        let isChecked = false;
        if (type === 'gender') {
            isChecked = filters.gender === value;
        } else {
            isChecked = filters[type].includes(value);
        }

        if (isChecked) input.checked = true;

        input.addEventListener('change', (e) => handleFilterChange(e.target));
        labelEl.textContent = label;

        return clone;
    }

    /**
     * Creates a color filter button.
     * @param {string} colorName - Color name
     * @param {string} hex - Hex color code
     * @returns {HTMLElement} - Color button element
     */
    function createColorFilterButton(colorName, hex) {
        const btn = document.createElement('button');
        btn.className = 'w-6 h-6 border-2 border-black mr-2 mb-2';
        btn.style.backgroundColor = hex;
        btn.title = colorName;

        if (filters.color.includes(colorName)) {
            btn.style.outline = '2px solid black';
            btn.style.outlineOffset = '2px';
        }

        btn.addEventListener('click', () => {
            if (filters.color.includes(colorName)) {
                filters.color = filters.color.filter(item => item !== colorName);
            } else {
                filters.color.push(colorName);
            }
            applyFilters();
        });

        return btn;
    }

    /**
     * Creates a size filter button.
     * @param {string} size - Size value
     * @returns {HTMLElement} - Size button element
     */
    function createSizeFilterButton(size) {
        const btn = document.createElement('button');
        btn.className = 'border-2 border-black py-1 px-2 text-xs font-bold hover:bg-black hover:text-white transition-colors';
        btn.textContent = size;

        if (filters.size.includes(size)) {
            btn.classList.add('bg-black', 'text-white');
        }

        btn.addEventListener('click', () => {
            if (filters.size.includes(size)) {
                filters.size = filters.size.filter(item => item !== size);
            } else {
                filters.size.push(size);
            }
            applyFilters();
        });

        return btn;
    }

    /**
     * Populates all filter sidebars with options.
     */
    function populateFilterSidebars() {
        // Gender filters
        const genderContainer = document.querySelector('#filter-gender');
        genderContainer.innerHTML = '';
        genderContainer.appendChild(createFilterCheckbox('gender', 'mens', 'Men'));
        genderContainer.appendChild(createFilterCheckbox('gender', 'womens', 'Women'));

        // Category filters
        const cats = getUniqueValues(p => p.category);
        const catContainer = document.querySelector('#filter-categories');
        catContainer.innerHTML = '';
        for (const c of cats) {
            catContainer.appendChild(createFilterCheckbox('category', c, c));
        }

        // Color filters
        const colorContainer = document.querySelector('#filter-colors');
        colorContainer.innerHTML = '';
        const colors = getUniqueValues(p => p.color.map(c => c.name));
        for (const c of colors) {
            const sampleProd = products.find(p => p.color.find(col => col.name === c));
            let hex = '#ccc';
            if (sampleProd) {
                hex = sampleProd.color.find(col => col.name === c).hex;
            }
            colorContainer.appendChild(createColorFilterButton(c, hex));
        }

        // Size filters
        const sizes = ["XS", "S", "M", "L", "XL", "24", "26", "28", "30", "32"];
        const sizeContainer = document.querySelector('#filter-sizes');
        sizeContainer.innerHTML = '';
        for (const s of sizes) {
            sizeContainer.appendChild(createSizeFilterButton(s));
        }
    }

    /**
     * Updates the active filter tags display.
     */
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

    /**
     * Handles filter checkbox changes.
     * @param {HTMLInputElement} input - The changed checkbox input
     */
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
            if (input.checked) filters[type].push(input.value);
            else filters[type] = filters[type].filter(i => i !== input.value);
        }
        applyFilters();
    }

    /**
     * Renders the product grid in the browse view.
     * @param {Array} productList - Array of product objects to display
     */
    function renderProductGrid(productList) {
        const grid = document.querySelector('#browse-grid');
        const noRes = document.querySelector('#no-results');

        if (!grid || !noRes) return;

        grid.innerHTML = '';

        if (productList.length === 0) {
            noRes.classList.remove('hidden');
            noRes.classList.add('visible');
            return;
        }

        noRes.classList.add('hidden');
        noRes.classList.remove('visible');

        for (const p of productList) {
            grid.appendChild(createProductCard(p));
        }
    }

    /**
     * Filters and sorts products based on current filter/sort state,
     * then updates the product grid display.
     */
    function applyFilters() {
        let result = products.filter(p => {
            if (filters.gender && p.gender !== filters.gender) return false;
            if (filters.category.length > 0 && !filters.category.includes(p.category)) return false;

            if (filters.color.length > 0) {
                let hasColor = false;
                for (const c of p.color) {
                    if (filters.color.includes(c.name)) {
                        hasColor = true;
                        break;
                    }
                }
                if (!hasColor) return false;
            }

            if (filters.size.length > 0) {
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

        const sortMethod = currentSort;

        if (sortMethod === 'name_asc') result.sort((a, b) => a.name.localeCompare(b.name));
        if (sortMethod === 'price_asc') result.sort((a, b) => a.price - b.price);
        if (sortMethod === 'price_desc') result.sort((a, b) => b.price - a.price);

        document.querySelector('#results-count').textContent = `${result.length} Results`;
        renderProductGrid(result);
        updateActiveFilterTags();
    }

    /**
     * Populates product info fields in the view.
     * @param {Object} p - Product object
     */
    function populateProductInfo(p) {
        document.querySelector('#p-title').textContent = p.name;
        document.querySelector('#p-price').textContent = `$${p.price.toFixed(2)}`;
        document.querySelector('#p-desc').textContent = p.description;
        document.querySelector('#p-material').textContent = p.material;
        document.querySelector('#p-img-text').textContent = p.name;

        document.querySelector('#crumb-gender').textContent = p.gender;
        document.querySelector('#crumb-category').textContent = p.category;
        document.querySelector('#crumb-title').textContent = p.name;

        document.querySelector('#btn-add-cart').dataset.productId = p.id;
    }

    /**
     * Renders color selection buttons for a product.
     * @param {Array} colors - Array of color objects {name, hex}
     */
    function renderColorOptions(colors) {
        const cContainer = document.querySelector('#p-colors');
        cContainer.innerHTML = '';
        const hiddenColorInput = document.querySelector('#selected-color');
        hiddenColorInput.value = '';

        const colorLabel = cContainer.previousElementSibling;
        if (colorLabel) colorLabel.classList.remove('text-red-600');

        for (const c of colors) {
            const btn = document.createElement('button');
            btn.className = 'w-8 h-8 border-2 border-black mr-2';
            btn.style.backgroundColor = c.hex;
            btn.title = c.name;
            btn.addEventListener('click', () => {
                Array.from(cContainer.children).forEach(b => b.style.outline = 'none');
                btn.style.outline = '2px solid black';
                btn.style.outlineOffset = '2px';
                hiddenColorInput.value = c.name;
                if (colorLabel) colorLabel.classList.remove('text-red-600');
            });
            cContainer.appendChild(btn);
        }

        // Auto-select the first colour
        if (cContainer.firstChild) {
            cContainer.firstChild.click();
        }
    }

    /**
     * Renders size selection buttons for a product.
     * @param {Array} sizes - Array of size strings
     */
    function renderSizeOptions(sizes) {
        const sContainer = document.querySelector('#p-sizes');
        sContainer.innerHTML = '';
        const hiddenSizeInput = document.querySelector('#selected-size');
        hiddenSizeInput.value = '';

        const sizeLabel = sContainer.previousElementSibling;
        if (sizeLabel) sizeLabel.classList.remove('text-red-600');

        for (const s of sizes) {
            const btn = document.createElement('button');
            btn.className = 'min-w-[3rem] h-10 border-2 border-black font-bold hover:bg-black hover:text-white transition-colors mr-2';
            btn.textContent = s;
            btn.addEventListener('click', () => {
                Array.from(sContainer.children).forEach(b => {
                    b.classList.remove('bg-black', 'text-white');
                    b.classList.add('hover:border-black', 'hover:bg-black');
                });
                btn.classList.remove('hover:bg-black');
                btn.classList.add('bg-black', 'text-white');
                hiddenSizeInput.value = s;
                if (sizeLabel) sizeLabel.classList.remove('text-red-600');
            });
            sContainer.appendChild(btn);
        }
    }

    /**
     * Renders related products grid.
     * @param {Object} currentProduct - The current product being viewed
     */
    function renderRelatedProducts(currentProduct) {
        const related = products
            .filter(item => item.category === currentProduct.category && item.id !== currentProduct.id)
            .slice(0, 4);
        const relatedGrid = document.querySelector('#related-grid');
        relatedGrid.innerHTML = '';

        for (const rp of related) {
            relatedGrid.appendChild(createProductCard(rp));
        }
    }

    /**
     * Renders the single product detail view.
     * @param {string} productId - The ID of the product to display
     */
    function renderProductView(productId) {
        const p = products.find(i => i.id == productId);
        if (!p) return;

        populateProductInfo(p);
        renderColorOptions(p.color);
        renderSizeOptions(p.sizes);

        const qtyInput = document.querySelector('#p-qty');
        if (qtyInput) qtyInput.value = 1;

        renderRelatedProducts(p);
    }

    /**
     * Resets all filters to default state.
     * @param {boolean} redraw - Whether to re-render the browse view
     */
    function clearFilters(redraw = true) {
        filters = { gender: null, category: [], color: [], size: [] };
        if (redraw) renderBrowseView();
    }

    /* =========================================
       APPLICATION START
       ========================================= */
    init();
});