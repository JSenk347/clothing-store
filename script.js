const DATA_URL = 'https://gist.githubusercontent.com/rconnolly/d37a491b50203d66d043c26f33dbd798/raw/37b5b68c527ddbe824eaed12073d266d5455432a/clothing-compact.json';

/**
 * Fetches data from the specified URL
 */
async function fetchData() {
    console.log(`Attempting to fetch data from: ${DATA_URL}`);  

    let products = [];

    try {
        const productsStr = localStorage.getItem("products"); // attempting to get data from localStorage
        if (!productsStr) { // if projects not in localStorage
            const resp = await fetch(DATA_URL); // fetching data, getting response
            if (resp.ok) {
                const data = await resp.json(); // turning response into json
                localStorage.setItem("products", JSON.stringify(data)); // put products into localStorage
                products = data;
            } else {
                console.error("Error fetching data", error.message);
            }
        } else {
           products = JSON.parse(productsStr); // parse the products string from localStorage
        }
        // need a function to work with the data
        console.table(products.slice(0, 5));
    } catch(error) {
        console.error("Error fetching data", error.message);
    }
}

// Start the fetching process when the page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchData();
});