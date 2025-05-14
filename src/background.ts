import browser from "webextension-polyfill";

browser.runtime.onInstalled.addListener(() => {
    console.log("Extension installed!");
});

browser.runtime.onMessage.addListener((request: { action: string }, sender: any, sendResponse: (arg0: { status: string; }) => void) => {
    if (request.action === "click") {
        console.log("Button clicked!");
        sendResponse({ status: "success" });
    }
    // Required to keep the sendResponse alive
    return true;
});