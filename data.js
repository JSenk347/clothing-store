const DATA_URL = 'https://gist.githubusercontent.com/rconnolly/d37a491b50203d66d043c26f33dbd798/raw/37b5b68c527ddbe824eaed12073d266d5455432a/clothing-compact.json';

/**
 * Fetches data from the specified URL and updates the UI status.
 */
async function fetchData(items) {
    console.log(`Attempting to fetch data from: ${DATA_URL}`);

    const i = 0;
    fetch(DATA_URL)
        .then(response => response.json())
        .then(data => {
            items = data;
            console.log("Data fetched");
            console.table(items.slice(0,5));
        })
        .catch(error => {
            console.error("Failed to fetch or process data:", error)
        });
}

// Start the fetching process when the page loads
const items = new Array();
document.addEventListener('DOMContentLoaded', fetchData(items));