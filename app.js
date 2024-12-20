/**
 * Handles the search form submission:
 * - Prevents default form behavior
 * - Validates the input
 * - Triggers the search
 */
document.getElementById('searchForm').addEventListener('submit', async (event) => {
    event.preventDefault();
  
    const queryInput = document.getElementById('searchInput');
    const originalQuery = queryInput.value.trim();
  
    if (!originalQuery) {
      showMessage('Please enter a search term.', 'text-gray-600');
      return;
    }
  
    // Show a loading message while fetching results
    showMessage(`Searching for "${originalQuery}" (excluding Amazon)...`, 'text-gray-600');
  
    try {
      const results = await performSearch(originalQuery);
      renderResults(results, originalQuery);
    } catch (error) {
      console.error('Fetch Error:', error);
      showMessage('Error fetching results. Try again later.', 'text-red-600');
    }
  });
  
  /**
   * Performs a search request using the Google Custom Search API.
   * @param {string} query - The user query (without Amazon exclusion appended yet).
   * @returns {Promise<Object[]>} - A promise resolving to an array of search result items.
   */
  async function performSearch(query) {
    const { apiKey, cseId } = window.CONFIG;
    const finalQuery = `${query} -site:amazon.com`;
    
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(finalQuery)}&key=${apiKey}&cx=${cseId}`;
    const response = await fetch(url);
    const data = await response.json();
  
    if (data.error) {
      throw new Error(`API Error: ${data.error.message}`);
    }
  
    return data.items || [];
  }
  
  /**
   * Renders the fetched search results into the DOM.
   * If no results are found, displays a corresponding message.
   * @param {Object[]} results - Array of search result items returned by Google API.
   * @param {string} query - The original query for user reference.
   */
  function renderResults(results, query) {
    if (!results.length) {
      showMessage(`No results found for "${query}".`, 'text-gray-600');
      return;
    }
  
    const resultsContainer = document.getElementById('results');
    const html = results.map(item => `
      <div class="p-4 border-b border-gray-200">
        <a href="${item.link}" target="_blank" class="text-blue-600 font-medium hover:underline">${item.title}</a>
        <p class="text-gray-600 mt-1">${item.snippet || ''}</p>
      </div>
    `).join('');
  
    resultsContainer.innerHTML = html;
  }
  
  /**
   * Displays a simple message in the results container.
   * Useful for loading states, errors, or empty results.
   * @param {string} message - The message text to display.
   * @param {string} classes - Tailwind CSS classes for styling the message text.
   */
  function showMessage(message, classes = 'text-gray-600') {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = `<p class="${classes}">${message}</p>`;
  }
  
  /**
   * Placeholder for future OpenAI integration.
   * This function can later call OpenAI APIs, process results,
   * and update the UI accordingly.
   */
  function handleOpenAIIntegration() {
    // Documentation and logic to be added here in the next step.
    // Future: This might involve another API call, processing data,
    // and then calling `renderResults()` or `showMessage()` as needed.
  }
  