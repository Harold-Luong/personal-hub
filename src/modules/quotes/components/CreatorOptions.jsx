import { AlignCenter, AlignLeft, AlignRight, Check, Download, ImagePlus, LoaderCircle } from "lucide-react";
import {
    creatorAlignmentOptions,
    creatorFontOptions,
    creatorRatioOptions,
} from "../constants/quoteMetadata";
import { QUOTE_BACKGROUND_ACCEPT } from "../utils/quoteImageUpload";

const alignmentIcons = {
    center: AlignCenter,
    left: AlignLeft,
    right: AlignRight,
};

export default function CreatorOptions({
    alignment,
    backgroundId,
    backgroundOptions,
    backgroundUploadError,
    color,
    fontId,
    fontScale,
    onAlignmentChange,
    onBackgroundChange,
    onBackgroundUpload,
    onColorChange,
    onFontChange,
    onFontScaleChange,
    onOverlayChange,
    onQuoteChange,
    onRatioChange,
    onSave,
    overlay,
    quoteId,
    quotes,
    ratio,
    saveStatus,
    uploadedBackgroundName,
}) {
    const isSaving = saveStatus === "saving";

    return (
        <aside className="creator-options">
            <div className="creator-options__heading">
                <span>Tùy chỉnh</span>
                <h2>Tạo khoảng lặng của bạn</h2>
                <p>Chọn một cách kể vừa đủ rồi lưu lại thành ảnh của riêng bạn.</p>
            </div>

            <label className="creator-field">
                <span>Câu nói</span>
                <select onChange={(event) => onQuoteChange(event.target.value)} value={quoteId}>
                    {quotes.map((quote) => <option key={quote.id} value={quote.id}>{quote.text}</option>)}
                </select>
            </label>

            <fieldset className="creator-field">
                <legend>Ảnh nền</legend>
                <div className="creator-backgrounds">
                    {backgroundOptions.map((backgroundOption) => (
                        <button
                            aria-label={backgroundOption.label}
                            aria-pressed={backgroundId === backgroundOption.id}
                            className={backgroundId === backgroundOption.id ? "is-active" : ""}
                            key={backgroundOption.id}
                            onClick={() => onBackgroundChange(backgroundOption.id)}
                            type="button"
                        >
                            <img alt="" src={backgroundOption.src} />
                        </button>
                    ))}
                </div>
                <label className="creator-background-upload">
                    <input
                        accept={QUOTE_BACKGROUND_ACCEPT}
                        onChange={(event) => {
                            const [file] = event.target.files;
                            if (file) onBackgroundUpload(file);
                            event.target.value = "";
                        }}
                        type="file"
                    />
                    <ImagePlus aria-hidden="true" size={18} />
                    <span>
                        <strong>{uploadedBackgroundName ? "Thay ảnh tải lên" : "Tải ảnh từ thiết bị"}</strong>
                        <small>{uploadedBackgroundName ?? "JPG, PNG hoặc WebP · tối đa 10 MB"}</small>
                    </span>
                </label>
                {backgroundUploadError && (
                    <p className="creator-background-upload__error" role="alert">{backgroundUploadError}</p>
                )}
            </fieldset>

            <div className="creator-options__row">
                <label className="creator-field">
                    <span>Font chữ</span>
                    <select onChange={(event) => onFontChange(event.target.value)} value={fontId}>
                        {creatorFontOptions.map((fontOption) => (
                            <option key={fontOption.id} value={fontOption.id}>{fontOption.label}</option>
                        ))}
                    </select>
                </label>
                <label className="creator-field creator-field--color">
                    <span>Màu chữ</span>
                    <input onChange={(event) => onColorChange(event.target.value)} type="color" value={color} />
                </label>
            </div>

            <label className="creator-field">
                <span>Cỡ chữ <b>{fontScale}%</b></span>
                <input
                    max="140"
                    min="70"
                    onChange={(event) => onFontScaleChange(event.target.value)}
                    step="5"
                    type="range"
                    value={fontScale}
                />
            </label>

            <label className="creator-field">
                <span>Độ tối ảnh <b>{Math.round(Number(overlay) * 100)}%</b></span>
                <input
                    max="0.78"
                    min="0.18"
                    onChange={(event) => onOverlayChange(event.target.value)}
                    step="0.02"
                    type="range"
                    value={overlay}
                />
            </label>

            <fieldset className="creator-field">
                <legend>Căn chữ</legend>
                <div className="creator-segmented-control">
                    {creatorAlignmentOptions.map((alignmentOption) => {
                        const AlignmentIcon = alignmentIcons[alignmentOption.id];
                        return (
                            <button
                                aria-label={alignmentOption.label}
                                aria-pressed={alignment === alignmentOption.id}
                                className={alignment === alignmentOption.id ? "is-active" : ""}
                                key={alignmentOption.id}
                                onClick={() => onAlignmentChange(alignmentOption.id)}
                                type="button"
                            >
                                <AlignmentIcon aria-hidden="true" size={17} />
                            </button>
                        );
                    })}
                </div>
            </fieldset>

            <fieldset className="creator-field">
                <legend>Tỉ lệ ảnh</legend>
                <div className="creator-ratios">
                    {creatorRatioOptions.map((ratioOption) => (
                        <button
                            aria-pressed={ratio === ratioOption.id}
                            className={ratio === ratioOption.id ? "is-active" : ""}
                            key={ratioOption.id}
                            onClick={() => onRatioChange(ratioOption.id)}
                            type="button"
                        >
                            {ratioOption.label}
                        </button>
                    ))}
                </div>
            </fieldset>

            <div className="creator-save">
                <button className="creator-save__button" disabled={isSaving} onClick={onSave} type="button">
                    {isSaving && <LoaderCircle aria-hidden="true" className="creator-save__spinner" size={18} />}
                    {saveStatus === "success" && <Check aria-hidden="true" size={18} />}
                    {saveStatus !== "saving" && saveStatus !== "success" && <Download aria-hidden="true" size={18} />}
                    <span>{isSaving ? "Đang tạo ảnh..." : saveStatus === "success" ? "Đã lưu ảnh" : "Lưu ảnh PNG"}</span>
                </button>
                {saveStatus === "error" && (
                    <p className="creator-save__error" role="alert">Không thể lưu ảnh. Vui lòng thử lại.</p>
                )}
            </div>
        </aside>
    );
}
