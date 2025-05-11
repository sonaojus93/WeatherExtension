document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const resultsContainer = document.getElementById('resultsContainer');
    const clearHistoryButton = document.getElementById('clearHistoryButton');
    const contextualNudgeMessageDiv = document.getElementById('contextualNudgeMessage');

    // Function to display search results
    function displayResults(results) {
        resultsContainer.innerHTML = '';

        if (!results || results.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">No matching pages found in your history.</p>';
            return;
        }

        const ul = document.createElement('ul');
        ul.className = 'results-list';

        results.forEach(page => {
            const li = document.createElement('li');
            li.className = 'result-item';

            const a = document.createElement('a');
            a.href = page.url;
            a.textContent = page.title || 'No Title';
            a.title = `${page.title || 'Untitled Page'}\n${page.url}\nVisited: ${new Date(page.timestamp).toLocaleString()}`;
            a.target = '_blank';

            const urlSnippet = document.createElement('div');
            urlSnippet.className = 'url-snippet';
            urlSnippet.textContent = page.url.length > 50 ? page.url.substring(0, 47) + '...' : page.url;

            li.appendChild(a);
            li.appendChild(urlSnippet);
            ul.appendChild(li);
        });
        resultsContainer.appendChild(ul);
    }

    // Perform search
    function performSearch() {
        const searchTerm = searchInput.value.trim();
        if (searchTerm === "") {
            resultsContainer.innerHTML = '<p class="no-results">Type something to search.</p>';
            return;
        }
        chrome.runtime.sendMessage({ action: "search", term: searchTerm }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Search error:", chrome.runtime.lastError.message);
                resultsContainer.innerHTML = '<p class="no-results">Error performing search.</p>';
                return;
            }
            if (response && response.results) {
                displayResults(response.results);
            } else {
                displayResults([]);
            }
        });
    }

    // Check for contextual nudge on popup open
    function checkContextualNudge() {
        // Query for the active tab in the current window
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError) {
                console.error("Error getting active tab:", chrome.runtime.lastError.message);
                return;
            }
            if (tabs && tabs.length > 0) {
                const currentUrl = tabs[0].url;
                if (currentUrl && currentUrl.startsWith('http')) { // Only check http/https URLs
                    // Send message to background script to check this URL
                    chrome.runtime.sendMessage({ action: "checkPageHistory", url: currentUrl }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error("Nudge check error:", chrome.runtime.lastError.message);
                            contextualNudgeMessageDiv.style.display = 'none';
                            return;
                        }
                        if (response && response.pageFound && response.pageData) {
                            const lastVisitedDate = new Date(response.pageData.timestamp).toLocaleDateString(undefined, {
                                year: 'numeric', month: 'long', day: 'numeric'
                            });
                            const lastVisitedTime = new Date(response.pageData.timestamp).toLocaleTimeString(undefined, {
                                hour: '2-digit', minute: '2-digit'
                            });
                            contextualNudgeMessageDiv.textContent = `You last visited this page on ${lastVisitedDate} at ${lastVisitedTime}.`;
                            contextualNudgeMessageDiv.style.display = 'block';
                        } else {
                            contextualNudgeMessageDiv.style.display = 'none';
                        }
                    });
                } else {
                    contextualNudgeMessageDiv.style.display = 'none'; // Not a web page
                }
            } else {
                contextualNudgeMessageDiv.style.display = 'none'; // No active tab found
            }
        });
    }

    // Event listener for search button
    searchButton.addEventListener('click', performSearch);

    // Event listener for Enter key in search input
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    // Event listener for clear history button
    clearHistoryButton.addEventListener('click', () => {
        if (confirm("Are you sure you want to clear all your visited page history for this extension? This cannot be undone.")) {
            chrome.runtime.sendMessage({ action: "clearHistory" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Clear history error:", chrome.runtime.lastError.message);
                    alert("Error clearing history.");
                    return;
                }
                if (response && response.success) {
                    resultsContainer.innerHTML = '<p class="no-results">History cleared.</p>';
                    searchInput.value = '';
                    contextualNudgeMessageDiv.style.display = 'none'; // Hide nudge after clearing
                    alert(response.message);
                } else {
                    alert("Failed to clear history.");
                }
            });
        }
    });

    // Initial actions when popup opens
    checkContextualNudge(); // Check and display nudge if applicable
    searchInput.focus();
});