import { get } from "http";
import { useState, useEffect } from "react"

function IndexPopup() {
  const [url, setURL] = useState<string>();

  async function getCurrentURL() {
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })
    setURL(tab.url);
  }

  useEffect(() => {
    getCurrentURL();
  }, []);

  return (
    <div>
      <h1>You are currently at {url}</h1>
    </div>
  )
}

export default IndexPopup
