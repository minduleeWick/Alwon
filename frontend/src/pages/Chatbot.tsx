import React, { useState, useRef, useEffect } from "react";

const Chatbot: React.FC = () => {
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    return (
        <>
            {/* Chatbot Button */}
            <button
                onClick={() => setOpen((prev) => !prev)}
                style={{
                    position: "fixed",
                    bottom: 24,
                    right: 24,
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "#fff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    border: "none",
                    cursor: "pointer",
                    zIndex: 1000,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "box-shadow 0.2s",
                }}
                aria-label="Open chatbot"
            >
                {/* Simple robot SVG icon */}
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <circle cx="18" cy="18" r="16" fill="#1976d2" />
                    <rect x="10" y="14" width="16" height="10" rx="5" fill="#fff" />
                    <circle cx="14" cy="19" r="2" fill="#1976d2" />
                    <circle cx="22" cy="19" r="2" fill="#1976d2" />
                    <rect x="17" y="8" width="2" height="6" rx="1" fill="#fff" />
                </svg>
            </button>

            {/* Chatbot Popup */}
            {open && (
                <div
                    style={{
                        position: "fixed",
                        bottom: 100,
                        right: 24,
                        width: 320,
                        maxWidth: "90vw",
                        background: "#fff",
                        borderRadius: 16,
                        boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
                        zIndex: 1001,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        animation: "fadeIn 0.2s",
                    }}
                >
                    <div
                        style={{
                            background: "#1976d2",
                            color: "#fff",
                            padding: "16px",
                            fontWeight: 600,
                            fontSize: "1.1rem",
                        }}
                    >
                        Chatbot
                        <button
                            onClick={() => setOpen(false)}
                            style={{
                                float: "right",
                                background: "none",
                                border: "none",
                                color: "#fff",
                                fontSize: 20,
                                cursor: "pointer",
                            }}
                            aria-label="Close chatbot"
                        >
                            ×
                        </button>
                    </div>
                    <div
                        style={{
                            flex: 1,
                            padding: "16px",
                            minHeight: 120,
                            maxHeight: 240,
                            overflowY: "auto",
                            background: "#f5f5f5",
                        }}
                    >
                        <div style={{ color: "#888" }}>Hello! How can I help you?</div>
                    </div>
                    <form
                        style={{
                            display: "flex",
                            borderTop: "1px solid #eee",
                            background: "#fff",
                            padding: "8px",
                        }}
                        onSubmit={(e) => {
                            e.preventDefault();
                            // Add your send logic here
                        }}
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Type your message..."
                            style={{
                                flex: 1,
                                border: "none",
                                outline: "none",
                                padding: "8px",
                                fontSize: 16,
                                borderRadius: 4,
                                background: "#f0f0f0",
                            }}
                        />
                        <button
                            type="submit"
                            style={{
                                marginLeft: 8,
                                background: "#1976d2",
                                color: "#fff",
                                border: "none",
                                borderRadius: 4,
                                padding: "8px 16px",
                                cursor: "pointer",
                                fontWeight: 600,
                            }}
                        >
                            Send
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default Chatbot;