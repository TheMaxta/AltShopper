document.getElementById('searchForm').addEventListener('submit', async (event) => {
    event.preventDefault();
  
    const queryInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('results');
    const originalQuery = queryInput.value.trim();
  
    if (!originalQuery) {
      resultsContainer.innerHTML = `<p class="text-gray-600">Please enter a search term.</p>`;
      return;
    }
  
    const { apiKey, cseId } = window.CONFIG;  
    const finalQuery = `${originalQuery} -site:amazon.com`;
    
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(finalQuery)}&key=${apiKey}&cx=${cseId}`;
  
    resultsContainer.innerHTML = `<p class="text-gray-600">Searching for "${originalQuery}" (excluding Amazon)...</p>`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
  
      if (data.error) {
        console.error('API Error:', data.error);
        resultsContainer.innerHTML = `<p class="text-red-600">Error: ${data.error.message}</p>`;
        return;
      }
  
      if (data.items && data.items.length > 0) {
        const html = data.items.map(item => `
          <div class="p-4 border-b border-gray-200">
            <a href="${item.link}" target="_blank" class="text-blue-600 font-medium hover:underline">${item.title}</a>
            <p class="text-gray-600 mt-1">${item.snippet || ''}</p>
          </div>
        `).join('');
        resultsContainer.innerHTML = html;
      } else {
        resultsContainer.innerHTML = `<p class="text-gray-600">No results found for "${originalQuery}".</p>`;
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      resultsContainer.innerHTML = `<p class="text-red-600">Error fetching results. Try again later.</p>`;
    }
  });
  