const DATA_URL = 'https://gist.githubusercontent.com/rconnolly/d37a491b50203d66d043c26f33dbd798/raw/37b5b68c527ddbe824eaed12073d266d5455432a/clothing-compact.json';

document.addEventListener('DOMContentLoaded', () => {

    // --- Global State ---
    let products = [];
    let cart = []; 
    let filters = { gender: null, category: [], color: [], size: [] };
    let currentSort = 'name_asc';

    // --- Initialization ---
    async function init() {
        await fetchData();
        loadCart(); 
        setupEventListeners();
    }

    // --- Data Fetching ---
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

    // --- Event Listeners ---
    function setupEventListeners() {
        document.querySelector('body').addEventListener('click', (e) => {

            // Gender Navigation
            if (e.target.matches('.nav-gender')) {
                e.preventDefault();
                const gender = e.target.dataset.filterGender;
                renderGenderView(gender);
                switchView('gender');
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
                const card = e.target.closest('.cat-card');
                const cat = card.dataset.category;
                const currentGender = filters.gender;
                
                clearFilters(false);
                filters.gender = currentGender;
                filters.category = [cat];

                renderBrowseView();
                switchView('browse');
            }

            // Clear Filters
            const btnClear = document.querySelector('#btn-clear-filters');
            if (btnClear && e.target === btnClear) clearFilters(true);

            const btnClearEmpty = document.querySelector('#btn-clear-filters-empty');
            if (btnClearEmpty && e.target === btnClearEmpty) clearFilters(true);

            // About Dialog
            const btnAbout = document.querySelector('#btn-about');
            const dialog = document.querySelector('#about-dialog');
            const btnClose = document.querySelector('#btn-close-about');
            const btnCloseBtm = document.querySelector('#btn-close-about-bottom');

            if (btnAbout && e.target === btnAbout) dialog.showModal();
            if (btnClose && e.target === btnClose) dialog.close();
            if (btnCloseBtm && e.target === btnCloseBtm) dialog.close();

            // --- CART HANDLERS ---
            
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

    // --- View Switching ---
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
       CART IMPLEMENTATION (Strict DOM Manipulation)
       ========================================= */

    // Load cart from LocalStorage on startup
    function loadCart() {
        const storedCart = localStorage.getItem("jdclothing_cart");
        if (storedCart) {
            cart = JSON.parse(storedCart);
        }
        updateCartCount();
    }

    // Save current cart state to LocalStorage
    function saveCart() {
        localStorage.setItem("jdclothing_cart", JSON.stringify(cart));
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

    // Logic to add an item to the cart array with Validation
    function addToCart() {
        const btn = document.querySelector('#btn-add-cart');
        if (!btn) return; 

        const productId = btn.dataset.productId;
        const colorInput = document.querySelector('#selected-color');
        const sizeInput = document.querySelector('#selected-size');
        const qtyInput = document.querySelector('#p-qty');

        // 1. Get visual references to the labels to apply red text
        const colorContainer = document.querySelector('#p-colors');
        const sizeContainer = document.querySelector('#p-sizes');
        // previousElementSibling assumes the label is directly before the container in HTML
        const colorLabel = colorContainer.previousElementSibling; 
        const sizeLabel = sizeContainer.previousElementSibling;

        // 2. Reset any previous error styles (clean slate)
        if (colorLabel) colorLabel.classList.remove('text-red-600');
        if (sizeLabel) sizeLabel.classList.remove('text-red-600');

        let hasError = false;

        // 3. Check Color
        if (!colorInput.value) {
            if (colorLabel) colorLabel.classList.add('text-red-600'); 
            hasError = true;
        }

        // 4. Check Size
        if (!sizeInput.value) {
            if (sizeLabel) sizeLabel.classList.add('text-red-600');
            hasError = true;
        }

        // 5. Stop if error
        if (hasError) {
            showToast("Please select options highlighted in red.", "error");
            return;
        }

        // --- Success Logic ---
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
                image: product.image || "IMG", 
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

    // DOM-based Toast Notification
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

    // Creates the header row for the cart list
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

    // Creates a single item row using strict DOM nodes
    function createCartItemRow(item, index) {
        const row = document.createElement('article');
        row.className = "grid grid-cols-1 md:grid-cols-6 gap-4 items-center border-b border-gray-200 py-4";

        // --- Column 1: Image & Title ---
        const col1 = document.createElement('div');
        col1.className = "col-span-2 flex gap-4 items-center";

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
        col1.appendChild(imgPlaceholder);
        col1.appendChild(titleDiv);

        // --- Column 2: Variant Info ---
        const col2 = document.createElement('div');
        col2.className = "flex md:block gap-2 text-sm font-mono uppercase";
        
        const mobileLabel2 = document.createElement('span');
        mobileLabel2.className = "md:hidden font-bold";
        mobileLabel2.textContent = "Variant: ";
        
        col2.appendChild(mobileLabel2);
        col2.appendChild(document.createTextNode(`${item.color} / ${item.size}`));

        // --- Column 3: Price ---
        const col3 = document.createElement('div');
        col3.className = "text-right font-mono";
        
        const mobileLabel3 = document.createElement('span');
        mobileLabel3.className = "md:hidden font-bold mr-2";
        mobileLabel3.textContent = "Price:";
        
        col3.appendChild(mobileLabel3);
        col3.appendChild(document.createTextNode(`$${item.price.toFixed(2)}`));

        // --- Column 4: Quantity ---
        const col4 = document.createElement('div');
        col4.className = "text-center font-mono";

        const mobileLabel4 = document.createElement('span');
        mobileLabel4.className = "md:hidden font-bold mr-2";
        mobileLabel4.textContent = "Qty:";

        col4.appendChild(mobileLabel4);
        col4.appendChild(document.createTextNode(item.qty));

        // --- Column 5: Subtotal ---
        const col5 = document.createElement('div');
        col5.className = "text-right font-bold font-mono";

        const mobileLabel5 = document.createElement('span');
        mobileLabel5.className = "md:hidden mr-2";
        mobileLabel5.textContent = "Subtotal:";

        col5.appendChild(mobileLabel5);
        col5.appendChild(document.createTextNode(`$${(item.price * item.qty).toFixed(2)}`));

        // Append all columns to row
        row.appendChild(col1);
        row.appendChild(col2);
        row.appendChild(col3);
        row.appendChild(col4);
        row.appendChild(col5);

        return row;
    }

    // Order Summary & Calculations
    function createSummaryBox() {
        const box = document.createElement('aside');
        box.className = "border-2 border-black p-6 sticky top-24 bg-gray-50";

        const h2 = document.createElement('h2');
        h2.className = "font-black uppercase text-xl mb-4 border-b-2 border-black pb-2";
        h2.textContent = "Order Summary";
        box.appendChild(h2);

        // --- Helper to create select inputs ---
        function createSelect(id, labelText, options) {
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

        // Create Destination Select
        const destWrapper = createSelect('cart-dest', 'Destination', [
            { value: 'ca', text: 'Canada' },
            { value: 'us', text: 'United States' },
            { value: 'int', text: 'International' }
        ]);
        box.appendChild(destWrapper);

        // Create Shipping Select
        const shipWrapper = createSelect('cart-ship', 'Shipping Method', [
            { value: 'standard', text: 'Standard' },
            { value: 'express', text: 'Express' },
            { value: 'priority', text: 'Priority' }
        ]);
        box.appendChild(shipWrapper);

        // --- Totals Display Area ---
        const totalsDiv = document.createElement('div');
        totalsDiv.className = "space-y-2 font-mono text-sm mb-6 border-t-2 border-black pt-4";

        function createRow(label, id, isBold = false) {
            const div = document.createElement('div');
            div.className = `flex justify-between ${isBold ? 'text-lg font-black border-t-2 border-black pt-2 mt-2' : ''}`;
            
            const lbl = document.createElement('span');
            lbl.textContent = label;
            
            const val = document.createElement('span');
            val.id = id;
            val.textContent = "$0.00";

            div.appendChild(lbl);
            div.appendChild(val);
            return div;
        }

        totalsDiv.appendChild(createRow("Merchandise", "summary-merch"));
        totalsDiv.appendChild(createRow("Shipping", "summary-ship"));
        totalsDiv.appendChild(createRow("Tax (5% CA only)", "summary-tax"));
        totalsDiv.appendChild(createRow("Total", "summary-total", true)); 

        box.appendChild(totalsDiv);

        // --- Checkout Button ---
        const checkoutBtn = document.createElement('button');
        checkoutBtn.className = "w-full bg-black text-white py-3 font-bold uppercase border-2 border-black hover:bg-white hover:text-black transition-colors";
        checkoutBtn.textContent = "Checkout";
        
        checkoutBtn.addEventListener('click', () => {
            cart = []; // Clear state
            saveCart(); // Save state
            renderCartView(); // Update view
            showToast("Order placed successfully!");
            
            // Return to home after delay
            setTimeout(() => {
                const homeView = document.querySelector('#view-home');
                if (homeView) {
                     document.querySelectorAll('.view-section').forEach(el => {
                         el.classList.remove('visible');
                         el.classList.add('hidden');
                     });
                     document.querySelector('#view-home').classList.remove('hidden');
                     document.querySelector('#view-home').classList.add('visible');
                }
            }, 1500);
        });

        box.appendChild(checkoutBtn);

        // --- Calculation Logic ---
        function updateTotals() {
            const merchTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
            
            const destSelect = box.querySelector('#cart-dest');
            const shipSelect = box.querySelector('#cart-ship');
            const dest = destSelect.value;
            const method = shipSelect.value;
            
            let shippingCost = 0;

            // Shipping Rule: Free if over $500
            if (merchTotal <= 500) {
                const rates = {
                    'standard': { 'ca': 10, 'us': 15, 'int': 20 },
                    'express':  { 'ca': 25, 'us': 25, 'int': 30 },
                    'priority': { 'ca': 35, 'us': 50, 'int': 50 }
                };
                shippingCost = rates[method][dest];
            }

            let tax = 0;
            if (dest === 'ca') {
                tax = merchTotal * 0.05;
            }

            const grandTotal = merchTotal + shippingCost + tax;

            box.querySelector('#summary-merch').textContent = `$${merchTotal.toFixed(2)}`;
            box.querySelector('#summary-ship').textContent = `$${shippingCost.toFixed(2)}`;
            box.querySelector('#summary-tax').textContent = `$${tax.toFixed(2)}`;
            box.querySelector('#summary-total').textContent = `$${grandTotal.toFixed(2)}`;
        }

        box.querySelector('#cart-dest').addEventListener('change', updateTotals);
        box.querySelector('#cart-ship').addEventListener('change', updateTotals);

        setTimeout(updateTotals, 0); 

        return box;
    }

    // Main Cart Render Function
    function renderCartView() {
        const container = document.querySelector('#view-cart');
        if (!container) return;
        
        // 1. Clear container safely
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        // 2. Render Page Title
        const headerSection = document.createElement('header');
        headerSection.className = "border-2 border-black p-8 text-center mb-8 bg-white";
        const h1 = document.createElement('h1');
        h1.className = "text-4xl font-black uppercase";
        h1.textContent = "Shopping Cart";
        headerSection.appendChild(h1);
        container.appendChild(headerSection);

        // 3. Handle Empty State
        if (cart.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = "text-center py-12 border-2 border-dashed border-black bg-gray-50";
            
            const msg = document.createElement('p');
            msg.className = "font-bold uppercase text-lg text-gray-500 mb-4";
            msg.textContent = "Your cart is empty.";
            
            const shopBtn = document.createElement('button');
            shopBtn.className = "underline font-bold uppercase hover:bg-black hover:text-white px-2 py-1";
            shopBtn.textContent = "Continue Shopping";
            shopBtn.addEventListener('click', () => {
                 // Logic to switch to browse
                 const browseLink = document.querySelector('[data-view="browse"]');
                 if(browseLink) browseLink.click();
            });

            emptyState.appendChild(msg);
            emptyState.appendChild(shopBtn);
            container.appendChild(emptyState);
            return;
        }

        // 4. Render Main Content (Grid Layout)
        const wrapper = document.createElement('div');
        wrapper.className = "flex flex-col lg:flex-row gap-8";

        // Left: Items List
        const itemsSection = document.createElement('section');
        itemsSection.className = "w-full lg:w-2/3 space-y-4";
        
        itemsSection.appendChild(createCartHeaderRow());

        cart.forEach((item, index) => {
            const itemRow = createCartItemRow(item, index);
            itemsSection.appendChild(itemRow);
        });

        wrapper.appendChild(itemsSection);

        // Right: Summary Sidebar
        const summarySection = document.createElement('div');
        summarySection.className = "w-full lg:w-1/3";
        
        const summaryBox = createSummaryBox();
        summarySection.appendChild(summaryBox);

        wrapper.appendChild(summarySection);

        container.appendChild(wrapper);
    }

    /* =========================================
       EXISTING BROWSE/PRODUCT LOGIC
       ========================================= */

    function renderGenderView(gender) {
        const genderProducts = products.filter(p => p.gender === gender);
        const categories = [...new Set(genderProducts.map(p => p.category))];

        const titleElement = document.querySelector('#gender-title');
        titleElement.textContent = gender === 'mens' ? "Men's Collection" : "Women's Collection";

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

        const genderContainer = document.querySelector('#filter-gender');
        genderContainer.innerHTML = '';
        genderContainer.appendChild(createCheckbox('gender', 'mens', 'Men'));
        genderContainer.appendChild(createCheckbox('gender', 'womens', 'Women'));

        const allCats = [];
        for (const p of products) {
            allCats.push(p.category);
        }
        const cats = allCats.filter((item, index) => allCats.indexOf(item) === index).sort();

        const catContainer = document.querySelector('#filter-categories');
        catContainer.innerHTML = '';
        for (const c of cats) {
            catContainer.appendChild(createCheckbox('category', c, c));
        }

        const allColors = [];
        for (const p of products) {
            for (const c of p.color) {
                allColors.push(c.name);
            }
        }
        const colors = allColors.filter((item, index) => allColors.indexOf(item) === index).sort();

        const colorContainer = document.querySelector('#filter-colors');
        colorContainer.innerHTML = '';

        for (const c of colors) {
            const btn = document.createElement('button');
            const sampleProd = products.find(p => p.color.find(col => col.name === c));
            const hex = sampleProd ? sampleProd.color.find(col => col.name === c).hex : '#ccc';

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
    }

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
            if (input.checked) filters[type].push(input.value);
            else filters[type] = filters[type].filter(i => i !== input.value);
        }
        applyFilters();
    }

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

        const template = document.querySelector('#tmpl-product-card');

        for (const p of productList) {
            const clone = template.content.cloneNode(true);
            const cardDiv = clone.querySelector('.product-card');

            const placeholder = clone.querySelector('.card-placeholder');
            const title = clone.querySelector('.card-title');
            const cat = clone.querySelector('.card-category');
            const price = clone.querySelector('.card-price');

            if (placeholder) placeholder.textContent = p.name;
            if (title) title.textContent = p.name;
            if (cat) cat.textContent = p.category;
            if (price) price.textContent = `$${p.price.toFixed(2)}`;

            if (cardDiv) {
                cardDiv.addEventListener('click', () => {
                    renderProductView(p.id);
                    switchView("product");
                });
            }

            grid.appendChild(clone);
        }
    }

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

    function renderProductView(productId) {
        const p = products.find(i => i.id == productId);
        if (!p) return;
        
        document.querySelector('#p-title').textContent = p.name;
        document.querySelector('#p-price').textContent = `$${p.price.toFixed(2)}`;
        document.querySelector('#p-desc').textContent = p.description;
        document.querySelector('#p-material').textContent = p.material;
        document.querySelector('#p-img-text').textContent = p.name;

        document.querySelector('#crumb-gender').textContent = p.gender;
        document.querySelector('#crumb-category').textContent = p.category;
        document.querySelector('#crumb-title').textContent = p.name;

        document.querySelector('#btn-add-cart').dataset.productId = p.id;

        const cContainer = document.querySelector('#p-colors');
        cContainer.innerHTML = '';
        const hiddenColorInput = document.querySelector('#selected-color');
        hiddenColorInput.value = '';

        // Reset any potential error state on render
        const colorLabel = cContainer.previousElementSibling;
        if(colorLabel) colorLabel.classList.remove('text-red-600');

        for (const c of p.color) {
            const btn = document.createElement('button');
            btn.className = 'w-8 h-8 border-2 border-black mr-2';
            btn.style.backgroundColor = c.hex;
            btn.title = c.name;
            btn.addEventListener('click', () => {
                Array.from(cContainer.children).forEach(b => b.style.outline = 'none');
                btn.style.outline = '2px solid black';
                btn.style.outlineOffset = '2px';
                hiddenColorInput.value = c.name;
                
                // UX Improvement: Clear error on selection
                if(colorLabel) colorLabel.classList.remove('text-red-600');
            });
            cContainer.appendChild(btn);
        }

        const sContainer = document.querySelector('#p-sizes');
        sContainer.innerHTML = '';
        const hiddenSizeInput = document.querySelector('#selected-size');
        hiddenSizeInput.value = '';

        // Reset any potential error state on render
        const sizeLabel = sContainer.previousElementSibling;
        if(sizeLabel) sizeLabel.classList.remove('text-red-600');

        for (const s of p.sizes) {
            const btn = document.createElement('button');
            btn.className = 'min-w-[3rem] h-10 border-2 border-black font-bold hover:bg-black hover:text-white transition-colors mr-2';
            btn.textContent = s;
            btn.addEventListener('click', () => {
                Array.from(sContainer.children).forEach(b => {
                    b.classList.remove('bg-black', 'text-white');
                    b.classList.add('hover:border-black');
                    b.classList.add('hover:bg-black');
                });
                btn.classList.remove('hover:bg-black');
                btn.classList.add('bg-black', 'text-white');
                hiddenSizeInput.value = s;

                // UX Improvement: Clear error on selection
                if(sizeLabel) sizeLabel.classList.remove('text-red-600');
            });
            sContainer.appendChild(btn);
        }

        const qtyInput = document.querySelector('#p-qty');
        if (qtyInput) qtyInput.value = 1;

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

                if (cardDiv) {
                    cardDiv.dataset.productId = rp.id;
                    cardDiv.addEventListener("click", () => {
                        renderProductView(rp.id);
                        switchView("product");
                    });
                }
                relatedGrid.appendChild(clone);
            }
        }
    }

    function clearFilters(redraw = true) {
        filters = { gender: null, category: [], color: [], size: [] };
        if (redraw) renderBrowseView();
    }

    // --- Start App ---
    init();
});