import React, { useState } from "react";
import browser from "webextension-polyfill";
import { createRoot } from "react-dom/client";
const container = document.getElementById("root");

const Popup = () => {
    const [status, setStatus] = useState("");

    const handleClick = async () => {
        try {
            const response = await browser.runtime.sendMessage({ action: "click" });

            if (response.status === "success") {
                setStatus("✅ Button clicked successfully!");
            } else {
                setStatus("❌ Failed to click the button.");
            }
        } catch (error) {
            console.error("Error:", error);
            setStatus("❌ An error occurred: " + error);
        }
    };

    return (
        <div style={{ padding: "1rem" }}>
            <button onClick={handleClick}>Click Me</button>
            {status && <p>{status}</p>}
        </div>
    );
};

createRoot(container!).render(<Popup />);