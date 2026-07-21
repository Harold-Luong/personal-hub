import { useState } from "react";
import { Copy, Eye, EyeOff, Trash2 } from "lucide-react";
import { TEXT_MAX_LENGTH, TEXT_WARNING_LENGTH } from "../../constants/qrPresets";
import { normalizeUrl } from "../../lib/qrPayloadBuilders";
import { SelectField, TextAreaField, TextField, ToggleField } from "./FormField";
const changeValue = (event) => event.target.value;
function FormHeader({ title, description, onClear }) {
    return (<div className="qr-form-heading">
            <div><h2>{title}</h2><p>{description}</p></div>
            <button aria-label="Xóa dữ liệu form" className="qr-icon-button" onClick={onClear} title="Xóa dữ liệu" type="button"><Trash2 aria-hidden="true" size={17}/></button>
        </div>);
}
function UrlForm({ data, errors, onChange, onClear, onCopy }) {
    return <><FormHeader title="URL" description="Tạo mã mở một địa chỉ web an toàn." onClear={onClear}/><TextField autoCapitalize="none" error={errors.url} id="qr-url" label="Địa chỉ URL" onChange={(event) => onChange({ url: changeValue(event) })} placeholder="example.com" spellCheck={false} type="url" value={data.url}/><button className="qr-secondary-button" disabled={!data.url.trim()} onClick={() => onCopy(normalizeUrl(data.url))} type="button"><Copy aria-hidden="true" size={16}/> Sao chép URL</button></>;
}
function TextForm({ data, errors, onChange, onClear }) {
    const warning = data.text.length > TEXT_WARNING_LENGTH;
    return <><FormHeader title="Văn bản" description="Unicode và tiếng Việt được hỗ trợ đầy đủ." onClear={onClear}/><TextAreaField error={errors.text} id="qr-text" label="Nội dung" maxLength={TEXT_MAX_LENGTH} onChange={(event) => onChange({ text: changeValue(event) })} placeholder="Nhập văn bản..." rows={8} value={data.text}/><div className={`qr-character-count${warning ? " is-warning" : ""}`}><span>{warning ? "QR đang trở nên dày và khó quét hơn." : "Nội dung càng ngắn, QR càng dễ quét."}</span><strong>{data.text.length}/{TEXT_MAX_LENGTH}</strong></div></>;
}
function WifiForm({ data, errors, onChange, onClear }) {
    const [showPassword, setShowPassword] = useState(false);
    return <><FormHeader title="Wi-Fi" description="Chia sẻ mạng mà không cần nhập mật khẩu thủ công." onClear={onClear}/><TextField error={errors.ssid} id="qr-wifi-ssid" label="Tên Wi-Fi / SSID" onChange={(event) => onChange({ ssid: changeValue(event) })} value={data.ssid}/><SelectField id="qr-wifi-security" label="Loại bảo mật" onChange={(event) => onChange({ security: event.target.value })} value={data.security}><option value="WPA">WPA / WPA2</option><option value="WEP">WEP</option><option value="nopass">Không mật khẩu</option></SelectField>{data.security !== "nopass" ? <div className="qr-password-field"><TextField autoComplete="new-password" error={errors.password} id="qr-wifi-password" label="Mật khẩu" onChange={(event) => onChange({ password: changeValue(event) })} type={showPassword ? "text" : "password"} value={data.password}/><button aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} className="qr-icon-button" onClick={() => setShowPassword((value) => !value)} type="button">{showPassword ? <EyeOff aria-hidden="true" size={17}/> : <Eye aria-hidden="true" size={17}/>}</button></div> : null}<ToggleField checked={data.hidden} id="qr-wifi-hidden" onChange={(hidden) => onChange({ hidden })}>Mạng Wi-Fi ẩn</ToggleField></>;
}
function ContactForm({ data, errors, onChange, onClear }) {
    return <><FormHeader title="Contact vCard" description="Tạo danh thiếp tương thích vCard 3.0." onClear={onClear}/><div className="qr-form-grid"><TextField error={errors.fullName} id="qr-contact-name" label="Họ và tên" onChange={(e) => onChange({ fullName: changeValue(e) })} value={data.fullName}/><TextField id="qr-contact-company" label="Công ty" onChange={(e) => onChange({ company: changeValue(e) })} value={data.company}/><TextField id="qr-contact-title" label="Chức vụ" onChange={(e) => onChange({ title: changeValue(e) })} value={data.title}/><TextField error={errors.phone} id="qr-contact-phone" inputMode="tel" label="Số điện thoại" onChange={(e) => onChange({ phone: changeValue(e) })} value={data.phone}/><TextField error={errors.email} id="qr-contact-email" label="Email" onChange={(e) => onChange({ email: changeValue(e) })} type="email" value={data.email}/><TextField error={errors.website} id="qr-contact-site" label="Website" onChange={(e) => onChange({ website: changeValue(e) })} value={data.website}/></div><TextField id="qr-contact-address" label="Địa chỉ" onChange={(e) => onChange({ address: changeValue(e) })} value={data.address}/><TextAreaField id="qr-contact-note" label="Ghi chú" onChange={(e) => onChange({ note: changeValue(e) })} rows={3} value={data.note}/></>;
}
function EmailForm({ data, errors, onChange, onClear }) {
    return <><FormHeader title="Email" description="Mở ứng dụng email với nội dung soạn sẵn." onClear={onClear}/><TextField error={errors.recipient} id="qr-email-recipient" label="Email người nhận" onChange={(e) => onChange({ recipient: changeValue(e) })} type="email" value={data.recipient}/><TextField id="qr-email-subject" label="Tiêu đề" onChange={(e) => onChange({ subject: changeValue(e) })} value={data.subject}/><TextAreaField id="qr-email-body" label="Nội dung email" onChange={(e) => onChange({ body: changeValue(e) })} rows={6} value={data.body}/></>;
}
function SmsForm({ data, errors, onChange, onClear }) {
    return <><FormHeader title="SMS" description="Tạo tin nhắn SMS với số điện thoại và nội dung." onClear={onClear}/><TextField error={errors.phone} id="qr-sms-phone" inputMode="tel" label="Số điện thoại" onChange={(e) => onChange({ phone: changeValue(e) })} value={data.phone}/><TextAreaField id="qr-sms-message" label="Nội dung tin nhắn" onChange={(e) => onChange({ message: changeValue(e) })} rows={6} value={data.message}/></>;
}
function EventForm({ data, errors, onChange, onClear }) {
    return <><FormHeader title="Sự kiện" description="Tạo sự kiện lịch iCalendar có múi giờ." onClear={onClear}/><TextField error={errors.title} id="qr-event-title" label="Tên sự kiện" onChange={(e) => onChange({ title: changeValue(e) })} value={data.title}/><TextField id="qr-event-location" label="Địa điểm" onChange={(e) => onChange({ location: changeValue(e) })} value={data.location}/><TextAreaField id="qr-event-description" label="Mô tả" onChange={(e) => onChange({ description: changeValue(e) })} rows={3} value={data.description}/><ToggleField checked={data.allDay} id="qr-event-all-day" onChange={(allDay) => onChange({ allDay })}>Sự kiện cả ngày</ToggleField><div className="qr-form-grid"><TextField error={errors.start} id="qr-event-start" label="Bắt đầu" onChange={(e) => onChange({ start: changeValue(e) })} type={data.allDay ? "date" : "datetime-local"} value={data.allDay ? data.start.slice(0, 10) : data.start}/><TextField error={errors.end} id="qr-event-end" label="Kết thúc" onChange={(e) => onChange({ end: changeValue(e) })} type={data.allDay ? "date" : "datetime-local"} value={data.allDay ? data.end.slice(0, 10) : data.end}/></div><TextField error={errors.timezone} id="qr-event-timezone" label="Múi giờ IANA" onChange={(e) => onChange({ timezone: changeValue(e) })} placeholder="Asia/Ho_Chi_Minh" value={data.timezone}/></>;
}
export default function QRForms(props) {
    switch (props.type) {
        case "url": return <UrlForm {...props}/>;
        case "text": return <TextForm {...props}/>;
        case "wifi": return <WifiForm {...props}/>;
        case "contact": return <ContactForm {...props}/>;
        case "email": return <EmailForm {...props}/>;
        case "sms": return <SmsForm {...props}/>;
        case "event": return <EventForm {...props}/>;
    }
}
