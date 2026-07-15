import { CheckCircle2, Download, RefreshCcw, Upload } from "lucide-react";
import { OUTPUT_FORMATS } from "../constants/mediaCutterConstants";
import { formatFileSize } from "../utils/mediaFile";
import { formatMediaTime } from "../utils/mediaTime";

export default function MediaResultCard({ onChooseAnother, onProcessAgain, result }) {
    const isAudio = result.format === OUTPUT_FORMATS.MP3;

    return (
        <section className="media-cutter-card media-result" aria-labelledby="media-result-title">
            <div className="media-result__heading">
                <span aria-hidden="true"><CheckCircle2 size={23} /></span>
                <div>
                    <small>Hoàn tất</small>
                    <h2 id="media-result-title">File của bạn đã sẵn sàng</h2>
                </div>
            </div>

            {isAudio ? (
                <audio controls preload="metadata" src={result.url}>Trình duyệt không hỗ trợ phát âm thanh.</audio>
            ) : (
                <video controls playsInline preload="metadata" src={result.url}>Trình duyệt không hỗ trợ phát video.</video>
            )}

            <dl className="media-result__details">
                <div><dt>Tên file</dt><dd title={result.filename}>{result.filename}</dd></div>
                <div><dt>Loại file</dt><dd>{result.mimeType}</dd></div>
                <div><dt>Dung lượng</dt><dd>{formatFileSize(result.size)}</dd></div>
                <div><dt>Thời lượng</dt><dd>{formatMediaTime(result.duration)}</dd></div>
                {result.bitrate ? <div><dt>Chất lượng</dt><dd>{result.bitrate} kbps</dd></div> : null}
            </dl>

            <div className="media-result__actions">
                <a download={result.filename} href={result.url}>
                    <Download aria-hidden="true" size={17} /> Tải xuống
                </a>
                <button onClick={onProcessAgain} type="button">
                    <RefreshCcw aria-hidden="true" size={16} /> Xử lý lại
                </button>
                <button onClick={onChooseAnother} type="button">
                    <Upload aria-hidden="true" size={16} /> Chọn file khác
                </button>
            </div>
        </section>
    );
}
