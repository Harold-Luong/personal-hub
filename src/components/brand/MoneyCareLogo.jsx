export default function MoneyCareLogo({ className = "", label = "MoneyCare", size = 48 }) {
    const accessibilityProps = label
        ? { "aria-label": label, role: "img" }
        : { "aria-hidden": true };

    return (
        <svg
            {...accessibilityProps}
            className={className || undefined}
            fill="none"
            height={size}
            viewBox="0 0 64 64"
            width={size}
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect className="money-care-logo__background" height="60" rx="17" width="60" x="2" y="2" />
            <path
                className="money-care-logo__mark"
                d="M16.5 42V26.5c0-5.8 7-8.7 11.1-4.6L32 26.3l4.4-4.4c4.1-4.1 11.1-1.2 11.1 4.6V42"
            />
            <path className="money-care-logo__base" d="M16.5 42h31" />
            <circle className="money-care-logo__coin" cx="45.5" cy="18.5" r="5.5" />
        </svg>
    );
}
