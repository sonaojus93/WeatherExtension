// content.js
// This script would be injected into web pages.
// For this basic version, its role is minimal as background.js captures title/URL.
// In a more advanced version, this script would extract detailed content from the page.

// console.log("Serendipity Engine: Content script loaded.");

// Function to extract meaningful text from the page
function extractPageContent() {
    const title = document.title;
    let bodyText = "";

    // Try to get main content, or fallback to body
    const mainContent = document.querySelector('main') || document.querySelector('article') || document.body;
    if (mainContent) {
        // Get paragraphs, headings
        const paragraphs = Array.from(mainContent.querySelectorAll('p')).map(p => p.textContent.trim()).join('\n');
        const headings = Array.from(mainContent.querySelectorAll('h1, h2, h3')).map(h => h.textContent.trim()).join('\n');
        bodyText = `${headings}\n${paragraphs}`.substring(0, 2000); // Limit length
    } else {
        bodyText = (document.body.innerText || "").substring(0, 2000);
    }

    return {
        title: title,
        url: window.location.href,
        textContent: bodyText.replace(/\s+/g, ' ').trim() // Clean up whitespace
    };
}

// The background.js is currently the primary mechanism for capturing page info via tabs.onUpdated.
// If content.js were to be the primary source of detailed text, background.js would need
// to listen for "storePageContent" and the logic in tabs.onUpdated might be simplified or changed
// to only trigger content script injection if needed.