const DATA_URL = 'https://gist.githubusercontent.com/rconnolly/d37a491b50203d66d043c26f33dbd798/raw/37b5b68c527ddbe824eaed12073d266d5455432a/clothing-compact.json';

/**
 * Fetches data from the specified URL and updates the UI status.
 */
async function fetchData() {
    console.log(`Attempting to fetch data from: ${DATA_URL}`);

    try {
        // 1. Fetch the data from the URL
        const response = await fetch(DATA_URL);

        // Check if the request was successful (status 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // 2. Parse the response body as JSON
        const data = await response.json();

        // 3. Store and process the data (in this case, logging it)
        console.log('✅ Data successfully fetched and parsed:');
        // You can now use the 'data' array in your application,
        // for example, storing it in a global variable or passing it to a function.
        console.table(data.slice(0, 5)); // Log the first 5 items as a table for readability
        console.log(`Total items received: ${data.length}`);

        // Update UI for success
        statusMessageEl.className = 'p-4 rounded-lg font-medium bg-green-100 text-green-700';
        statusMessageEl.textContent = `Success! ${data.length} clothing items loaded. Data logged to console.`;

        // Optional: Return the data for further use
        return data;

    } catch (error) {
        // Update UI for failure
        console.error('❌ Failed to fetch or process data:', error);
        statusMessageEl.className = 'p-4 rounded-lg font-medium bg-red-100 text-red-700';
        statusMessageEl.textContent = `Error: Failed to load data. See console for details. (${error.message})`;
    }
}

// Start the fetching process when the page loads
document.addEventListener('DOMContentLoaded', fetchData);