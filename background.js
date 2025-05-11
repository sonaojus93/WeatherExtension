chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['visitedPages'], (result) => {
        if (!result.visitedPages) {
            chrome.storage.local.set({ visitedPages: [] });
            console.log('Initialized visitedPages storage.');
        }
    });
});

// Listen for tab updates to capture page information
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
        chrome.storage.local.get(['visitedPages'], (result) => {
            const visitedPages = result.visitedPages || [];

            const pageData = {
                url: tab.url,
                title: tab.title || 'No title found on tab', // More descriptive default
                timestamp: new Date().toISOString(),
                textContent: `Title: ${tab.title || 'No title'}. URL: ${tab.url}`
            };

            // Check if this exact URL already exists
            const existingPageIndex = visitedPages.findIndex(page => page.url === pageData.url);

            if (existingPageIndex > -1) {
                // If page exists, update its timestamp and potentially title if it changed
                visitedPages[existingPageIndex].timestamp = pageData.timestamp;
                if (visitedPages[existingPageIndex].title !== pageData.title) {
                    visitedPages[existingPageIndex].title = pageData.title;
                    visitedPages[existingPageIndex].textContent = pageData.textContent; // Update textContent too
                }
                // console.log('Page updated:', pageData.title);
            } else {
                // If page doesn't exist, add it
                visitedPages.push(pageData);
                // console.log('Page saved:', pageData.title);
            }

            // Optional: Limit the size of the history
            const MAX_HISTORY_ITEMS = 500;
            if (visitedPages.length > MAX_HISTORY_ITEMS) {
                // Sort by timestamp descending (newest first) before slicing to keep newest
                visitedPages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                visitedPages.splice(MAX_HISTORY_ITEMS);
            }

            chrome.storage.local.set({ visitedPages }, () => {
                // console.log('Visited pages list updated in storage.');
            });
        });
    }
});


// Listen for messages from other parts of the extension (popup.js, content.js)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "search") {
        const searchTerm = request.term.toLowerCase();
        chrome.storage.local.get(['visitedPages'], (result) => {
            const visitedPages = result.visitedPages || [];
            const searchResults = visitedPages.filter(page => {
                return (page.title && page.title.toLowerCase().includes(searchTerm)) ||
                    (page.textContent && page.textContent.toLowerCase().includes(searchTerm)) ||
                    (page.url && page.url.toLowerCase().includes(searchTerm));
            }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            sendResponse({ results: searchResults.slice(0, 50) });
        });
        return true; // Indicates that the response will be sent asynchronously

    } else if (request.action === "clearHistory") {
        chrome.storage.local.set({ visitedPages: [] }, () => {
            console.log('Visited pages history cleared.');
            sendResponse({ success: true, message: "History cleared." });
        });
        return true;

    } else if (request.action === "checkPageHistory") {
        // New action to check if a specific URL is in history (for contextual nudge)
        const urlToCheck = request.url;
        if (!urlToCheck) {
            sendResponse({ pageFound: false, error: "No URL provided." });
            return false; // No async response needed if error
        }
        chrome.storage.local.get(['visitedPages'], (result) => {
            const visitedPages = result.visitedPages || [];
            const foundPage = visitedPages.find(page => page.url === urlToCheck);
            if (foundPage) {
                sendResponse({ pageFound: true, pageData: foundPage });
            } else {
                sendResponse({ pageFound: false });
            }
        });
        return true; // Indicates asynchronous response

    } else if (message.action === "extractText") {
        // This is still a placeholder for more advanced content extraction
        // console.log("Received text from content script:", message.data);
        sendResponse({ status: "Text received by background script (placeholder)" });
    }

    return false; // Default for synchronous messages or unhandled actions
});