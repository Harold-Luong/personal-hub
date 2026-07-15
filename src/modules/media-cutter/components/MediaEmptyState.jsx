import { Download, Scissors, ShieldCheck } from "lucide-react";

const steps = [
    { icon: ShieldCheck, text: "File luôn ở trên thiết bị của bạn" },
    { icon: Scissors, text: "Chọn đoạn cần cắt hoặc tách âm thanh" },
    { icon: Download, text: "Xem trước và tải kết quả xuống" },
];

export default function MediaEmptyState() {
    return (
        <aside className="media-empty-state" aria-label="Cách Media Cutter hoạt động">
            <span className="media-empty-state__eyebrow">Xử lý riêng tư</span>
            <h2>Ba bước, không cần tải media lên mạng.</h2>
            <div className="media-empty-state__steps">
                {steps.map(({ icon: Icon, text }, index) => (
                    <div key={text}>
                        <span aria-hidden="true"><Icon size={20} /></span>
                        <p><small>0{index + 1}</small>{text}</p>
                    </div>
                ))}
            </div>
            <p className="media-empty-state__note">
                Lần đầu sử dụng, trình duyệt cần tải bộ xử lý FFmpeg khoảng 32 MB.
            </p>
        </aside>
    );
}
