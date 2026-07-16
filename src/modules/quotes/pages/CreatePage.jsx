import { useEffect, useRef, useState } from "react";
import AppHeader from "../components/AppHeader";
import CreatorOptions from "../components/CreatorOptions";
import QuoteCreatorPreview from "../components/QuoteCreatorPreview";
import { creatorFontOptions } from "../constants/quoteMetadata";
import { quoteBackgrounds, quotes } from "../data/quoteData";
import { validateQuoteBackgroundFile } from "../utils/quoteImageUpload";

const uploadedBackgroundId = "uploaded";

const backgroundLabels = {
    ancient: "Núi cổ phong",
    family: "Bữa cơm gia đình",
    healing: "Đồng cỏ chữa lành",
    life: "Con đường trong rừng",
    lonely: "Đêm bên hồ",
    love: "Đồng hoa",
    motivation: "Đường lên đỉnh núi",
    peace: "Trà bên cửa sổ",
    work: "Bàn làm việc",
};

const backgroundOptions = Object.entries(quoteBackgrounds).map(([id, src]) => ({
    id,
    label: backgroundLabels[id] ?? id,
    src,
}));

export default function CreatePage({ favoriteIds, onToggleTheme, theme }) {
    const previewRef = useRef(null);
    const uploadRequestIdRef = useRef(0);
    const [quoteId, setQuoteId] = useState(quotes[0].id);
    const [backgroundId, setBackgroundId] = useState("healing");
    const [uploadedBackground, setUploadedBackground] = useState(null);
    const [backgroundUploadError, setBackgroundUploadError] = useState("");
    const [fontId, setFontId] = useState("cormorant");
    const [fontScale, setFontScale] = useState("100");
    const [color, setColor] = useState("#fffaf1");
    const [overlay, setOverlay] = useState("0.48");
    const [alignment, setAlignment] = useState("center");
    const [ratio, setRatio] = useState("portrait");
    const [saveStatus, setSaveStatus] = useState("idle");
    const availableBackgroundOptions = uploadedBackground
        ? [...backgroundOptions, uploadedBackground]
        : backgroundOptions;
    const selectedQuote = quotes.find((quote) => quote.id === quoteId) ?? quotes[0];
    const selectedBackground = availableBackgroundOptions.find((option) => option.id === backgroundId)
        ?? backgroundOptions[0];
    const selectedFont = creatorFontOptions.find((option) => option.id === fontId) ?? creatorFontOptions[0];

    useEffect(() => {
        if (saveStatus !== "success") return undefined;

        const resetTimer = window.setTimeout(() => setSaveStatus("idle"), 1600);
        return () => window.clearTimeout(resetTimer);
    }, [saveStatus]);

    useEffect(() => () => {
        uploadRequestIdRef.current += 1;
    }, []);

    const handleBackgroundChange = (nextBackgroundId) => {
        uploadRequestIdRef.current += 1;
        setBackgroundId(nextBackgroundId);
        setBackgroundUploadError("");
    };

    const handleBackgroundUpload = (file) => {
        const requestId = uploadRequestIdRef.current + 1;
        uploadRequestIdRef.current = requestId;
        const validationError = validateQuoteBackgroundFile(file);

        if (validationError) {
            setBackgroundUploadError(validationError);
            return;
        }

        const reader = new FileReader();

        reader.addEventListener("load", () => {
            if (uploadRequestIdRef.current !== requestId || typeof reader.result !== "string") return;

            setUploadedBackground({
                id: uploadedBackgroundId,
                label: `Ảnh tải lên: ${file.name}`,
                name: file.name,
                src: reader.result,
            });
            setBackgroundId(uploadedBackgroundId);
            setBackgroundUploadError("");
        });
        reader.addEventListener("error", () => {
            if (uploadRequestIdRef.current !== requestId) return;
            setBackgroundUploadError("Không thể đọc ảnh này. Vui lòng chọn ảnh khác.");
        });
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!previewRef.current || saveStatus === "saving") return;

        setSaveStatus("saving");

        try {
            await document.fonts?.ready;
            const previewImages = Array.from(previewRef.current.querySelectorAll("img"));
            await Promise.all(previewImages.map((image) => image.decode?.().catch(() => undefined)));
            const { toPng } = await import("html-to-image");

            const dataUrl = await toPng(previewRef.current, {
                cacheBust: true,
                pixelRatio: 2,
            });
            const downloadLink = document.createElement("a");
            downloadLink.download = `lang-${selectedQuote.id}-${ratio}.png`;
            downloadLink.href = dataUrl;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            downloadLink.remove();
            setSaveStatus("success");
        } catch (error) {
            console.error("Không thể lưu ảnh câu nói.", error);
            setSaveStatus("error");
        }
    };

    return (
        <main className="lang-page lang-create-page">
            <AppHeader favoriteCount={favoriteIds.length} onToggleTheme={onToggleTheme} theme={theme} />
            <div className="creator-layout">
                <QuoteCreatorPreview
                    alignment={alignment}
                    background={selectedBackground.src}
                    color={color}
                    font={selectedFont.value}
                    fontScale={fontScale}
                    overlay={overlay}
                    previewRef={previewRef}
                    quote={selectedQuote}
                    ratio={ratio}
                />
                <CreatorOptions
                    alignment={alignment}
                    backgroundId={backgroundId}
                    backgroundOptions={availableBackgroundOptions}
                    backgroundUploadError={backgroundUploadError}
                    color={color}
                    fontId={fontId}
                    fontScale={fontScale}
                    onAlignmentChange={setAlignment}
                    onBackgroundChange={handleBackgroundChange}
                    onBackgroundUpload={handleBackgroundUpload}
                    onColorChange={setColor}
                    onFontChange={setFontId}
                    onFontScaleChange={setFontScale}
                    onOverlayChange={setOverlay}
                    onQuoteChange={setQuoteId}
                    onRatioChange={setRatio}
                    onSave={handleSave}
                    overlay={overlay}
                    quoteId={quoteId}
                    quotes={quotes}
                    ratio={ratio}
                    saveStatus={saveStatus}
                    uploadedBackgroundName={uploadedBackground?.name}
                />
            </div>
        </main>
    );
}
