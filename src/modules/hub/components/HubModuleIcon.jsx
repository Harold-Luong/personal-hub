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

    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 32 32">
            <path d="M5.5 10.5h21v14h-21z" />
            <path d="M9 10.5V8.8A2.8 2.8 0 0 1 11.8 6h9.7" />
            <path d="M20.5 16h6v4h-6a2 2 0 1 1 0-4Z" />
        </svg>
    );
}
