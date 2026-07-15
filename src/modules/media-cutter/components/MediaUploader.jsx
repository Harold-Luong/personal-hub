import { useRef, useState } from "react";
import { FileAudio, UploadCloud } from "lucide-react";
import { MEDIA_FILE_ACCEPT } from "../constants/mediaCutterConstants";

export default function MediaUploader({ disabled = false, error = "", onSelectFile }) {
    const inputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    const openFilePicker = () => {
        if (!disabled) {
            inputRef.current?.click();
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);

        if (disabled) {
            return;
        }

        const [file] = Array.from(event.dataTransfer.files ?? []);

        if (file) {
            onSelectFile(file);
        }
    };

    return (
        <section className="media-cutter-card media-uploader-section" aria-labelledby="media-upload-title">
            <div className="media-cutter-section-heading">
                <span className="media-cutter-section-heading__icon" aria-hidden="true">
                    <FileAudio size={19} />
                </span>
                <div>
                    <span>Bước 1</span>
                    <h2 id="media-upload-title">Chọn video hoặc MP3</h2>
                </div>
            </div>

            <div
                aria-disabled={disabled}
                className={`media-uploader${isDragging ? " is-dragging" : ""}${disabled ? " is-disabled" : ""}`}
                onClick={openFilePicker}
                onDragEnter={(event) => {
                    event.preventDefault();
                    if (!disabled) setIsDragging(true);
                }}
                onDragLeave={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) setIsDragging(false);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openFilePicker();
                    }
                }}
                role="button"
                tabIndex={disabled ? -1 : 0}
            >
                <input
                    accept={MEDIA_FILE_ACCEPT}
                    aria-describedby={error ? "media-upload-error" : "media-upload-help"}
                    aria-label="Chọn một file video hoặc MP3"
                    className="media-cutter-visually-hidden"
                    disabled={disabled}
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) onSelectFile(file);
                        event.target.value = "";
                    }}
                    ref={inputRef}
                    type="file"
                />
                <span className="media-uploader__icon" aria-hidden="true">
                    <UploadCloud size={30} />
                </span>
                <strong>Kéo video hoặc MP3 vào đây</strong>
                <span>hoặc nhấn để chọn từ thiết bị</span>
                <small id="media-upload-help">MP3, MP4, WebM hoặc MOV · tối đa 200 MB trên máy tính</small>
            </div>

            {error ? <p className="media-cutter-field-error" id="media-upload-error" role="alert">{error}</p> : null}
        </section>
    );
}
