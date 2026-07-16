export default function HubModuleIcon({ icon }) {
    if (icon === "quotes") {
        return (
            <svg aria-hidden="true" fill="none" viewBox="0 0 32 32">
                <path d="M7 8.5h7v7H9.5c0 3.5 1.5 5.8 4.5 7.2" />
                <path d="M18 8.5h7v7h-4.5c0 3.5 1.5 5.8 4.5 7.2" />
            </svg>
        );
    }

    if (icon === "media-cutter") {
        return (
            <svg aria-hidden="true" fill="none" viewBox="0 0 32 32">
                <circle cx="9" cy="10" r="3.5" />
                <circle cx="9" cy="22" r="3.5" />
                <path d="m12 12 14 9M12 20l14-9M18.5 16 26 16" />
            </svg>
        );
    }

    if (icon === "json-toolkit") {
        return (
            <svg aria-hidden="true" fill="none" viewBox="0 0 32 32">
                <path d="M12 6.5H9.8A2.8 2.8 0 0 0 7 9.3v3.2c0 2-1 3.5-2.5 3.5C6 16 7 17.5 7 19.5v3.2a2.8 2.8 0 0 0 2.8 2.8H12" />
                <path d="M20 6.5h2.2A2.8 2.8 0 0 1 25 9.3v3.2c0 2 1 3.5 2.5 3.5-1.5 0-2.5 1.5-2.5 3.5v3.2a2.8 2.8 0 0 1-2.8 2.8H20" />
                <path d="M15.9 12v.1M15.9 19.9v.1" />
            </svg>
        );
    }

    if (icon === "qr-toolkit") {
        return (
            <svg aria-hidden="true" fill="none" viewBox="0 0 32 32">
                <path d="M6 6h8v8H6zM18 6h8v8h-8zM6 18h8v8H6z" />
                <path d="M20 19h2v2h-2zM24 18h2v4h-2zM18 24h4v2h-4zM25 25h1v1h-1z" />
            </svg>
        );
    }

    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 32 32">
            <path d="M5.5 10.5h21v14h-21z" />
            <path d="M9 10.5V8.8A2.8 2.8 0 0 1 11.8 6h9.7" />
            <path d="M20.5 16h6v4h-6a2 2 0 1 1 0-4Z" />
        </svg>
    );
}
