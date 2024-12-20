document.getElementById('searchForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const queryInput = document.getElementById('searchInput');
    const originalQuery = queryInput.value.trim();

    if (!originalQuery) {
        showMessage('Please enter a search term.', 'text-gray-600', 'results');
        return;
    }

    showMessage(`Searching for "${originalQuery}" (excluding Amazon)...`, 'text-gray-600', 'results');

    try {
        const results = await performSearch(originalQuery);
        renderResults(results, originalQuery);

        // After we have the results, call OpenAI to process them
        await performOpenAICall(originalQuery, results);
    } catch (error) {
        console.error('Fetch Error:', error);
        showMessage('Error fetching results. Try again later.', 'text-red-600', 'results');
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
     * @param {Object[]} results - Array of search result items returned by Google API.
     * @param {string} query - The original query for user reference.
     */
    function renderResults(results, query) {
        const resultsContainer = document.getElementById('results');
        if (!results.length) {
            showMessage(`No results found for "${query}".`, 'text-gray-600', 'results');
            return;
        }

        const html = results.map(item => `
            <div class="p-4 border-b border-gray-200">
            <a href="${item.link}" target="_blank" class="text-blue-600 font-medium hover:underline">${item.title}</a>
            <p class="text-gray-600 mt-1">${item.snippet || ''}</p>
            </div>
        `).join('');

        resultsContainer.innerHTML = html;
    }

    /**
     * Displays a message in a specified container.
     * @param {string} message - The message text.
     * @param {string} classes - Tailwind classes for styling.
     * @param {string} containerId - ID of the container to show the message.
     */
    function showMessage(message, classes = 'text-gray-600', containerId = 'results') {
        const container = document.getElementById(containerId);
        container.innerHTML = `<p class="${classes}">${message}</p>`;
    }

    /**
     * Loads prompts from the prompts.yaml file.
     * @returns {Promise<{system: string, user: string}>} - The prompts object.
     */
    async function loadPrompts() {
        try {
        const response = await fetch('prompts.yaml');
        if (!response.ok) {
            throw new Error('Failed to load prompts');
        }
        const yamlText = await response.text();
        // We need to load js-yaml from CDN since this is browser-side
        const yaml = window.jsyaml;
        if (!yaml) {
            throw new Error('YAML parser not loaded');
        }
        return yaml.load(yamlText);
        } catch (error) {
        console.error('Error loading prompts:', error);
        throw error;
        }
    }

    /**
     * Calls the OpenAI API to process the top search results as context.
     * @param {string} query - The original user query.
     * @param {Object[]} results - The search results from Google Custom Search.
     */
    async function performOpenAICall(query, results) {
        // Load system and user prompts
        const prompts = await loadPrompts();

        // We will serialize the top results into a friendly format
        const contextJson = JSON.stringify(results.slice(0, 5), null, 2);

        // Construct messages for the OpenAI chat completion
        const messages = [
            { role: "system", content: prompts.system },
            { role: "user", content: `${prompts.user}\n\nQuery: "${query}"\n\nTop Search Results:\n${contextJson}` }
        ];

        showMessage('Processing your request with AI...', 'text-gray-600', 'aiResponse');

        try {
            // Example using fetch and OpenAI API (replace MODEL with your chosen model):
            const { openAIApiKey } = window.CONFIG;
            const openAIUrl = "https://api.openai.com/v1/chat/completions";

            const response = await fetch(openAIUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${openAIApiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: messages
            })
            });

            if (!response.ok) {
            throw new Error(`OpenAI API Error: ${response.statusText}`);
            }

            const data = await response.json();
            const aiResponse = data.choices && data.choices.length > 0 
            ? data.choices[0].message.content 
            : "No response from AI.";

            showMessage(aiResponse, 'text-gray-800', 'aiResponse');
        } catch (error) {
            console.error('OpenAI Error:', error);
            showMessage('Error processing AI request. Try again later.', 'text-red-600', 'aiResponse');
        }
    }
