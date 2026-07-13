const waveformHeights = [
    4, 6, 8, 11, 15, 9, 13, 18,
    11, 7, 10, 16, 22, 14, 9, 6,
    5, 8, 12, 19, 14, 10, 7, 13,
    17, 11, 8, 6, 10, 7, 5, 4,
];

export default function AmbientWaveform({ isActive }) {
    return (
        <span
            aria-hidden="true"
            className={`ambient-waveform${isActive ? " is-active" : ""}`}
        >
            {waveformHeights.map((height, index) => (
                <span
                    key={`${height}-${index}`}
                    style={{
                        "--wave-delay": `${-((index % 14) * 0.34)}s`,
                        "--wave-duration": `${4.2 + ((index % 7) * 0.2)}s`,
                        "--wave-height": `${height}px`,
                    }}
                />
            ))}
        </span>
    );
}
