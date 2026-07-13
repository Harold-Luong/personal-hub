import { useRef, useState } from "react";
import {
    expenseAmountFormatOptions,
    expenseCurrencyLabels,
    expenseDateFormatOptions,
} from "../../constants/expenseMetadata";
import { ChevronIcon, DownloadIcon, EyeIcon, StarIcon, UploadIcon } from "../../icon/ExpenseIcons";
import ExpenseIcon from "./ExpenseIcon";
import SectionCard from "./SectionCard";

function PreferenceSelect({ description, label, onChange, options, value }) {
    return (
        <label className="settings-content__preference">
            <span><strong>{label}</strong><small>{description}</small></span>
            <select onChange={(event) => onChange(event.target.value)} value={value}>
                {options.map((option) => (
                    <option key={option.id ?? option} value={option.id ?? option}>
                        {option.label ? `${option.label} (${option.example})` : option}
                    </option>
                ))}
            </select>
        </label>
    );
}

function EntityRow({
    canMoveDown,
    canMoveUp,
    entity,
    isDefault,
    isHidden,
    onMove,
    onSetDefault,
    onToggleHidden,
    type,
}) {
    const canSetDefault = type === "wallet" || entity.type === "expense";

    return (
        <li className={isHidden ? "is-hidden" : ""}>
            <span className="settings-content__entity-icon" style={{ "--entity-color": entity.color }}>
                <ExpenseIcon icon={entity.icon} />
            </span>
            <span className="settings-content__entity-copy">
                <strong>{entity.name}</strong>
                <small>{isDefault ? "Mặc định" : isHidden ? "Đang ẩn" : type === "wallet" ? "Đang sử dụng" : entity.type === "income" ? "Thu nhập" : "Chi tiêu"}</small>
            </span>
            <span className="settings-content__entity-actions">
                <button aria-label={`Đưa ${entity.name} lên`} disabled={!canMoveUp} onClick={() => onMove(-1)} title="Đưa lên" type="button">
                    <ChevronIcon direction="up" />
                </button>
                <button aria-label={`Đưa ${entity.name} xuống`} disabled={!canMoveDown} onClick={() => onMove(1)} title="Đưa xuống" type="button">
                    <ChevronIcon direction="down" />
                </button>
                <button aria-label={`${isHidden ? "Hiện" : "Ẩn"} ${entity.name}`} disabled={isDefault} onClick={onToggleHidden} title={isDefault ? "Không thể ẩn mục mặc định" : isHidden ? "Hiện" : "Ẩn"} type="button">
                    <EyeIcon off={isHidden} />
                </button>
                <button aria-label={`Chọn ${entity.name} làm mặc định`} className={isDefault ? "is-active" : ""} disabled={!canSetDefault || isHidden} onClick={onSetDefault} title={canSetDefault ? "Chọn mặc định" : "Chỉ áp dụng cho danh mục chi tiêu"} type="button">
                    <StarIcon filled={isDefault} />
                </button>
            </span>
        </li>
    );
}

function EntityManager({ categories, onMoveCategory, onMoveWallet, onSetDefaultCategory, onSetDefaultWallet, onToggleCategory, onToggleWallet, settings, wallets }) {
    const [activeTab, setActiveTab] = useState("categories");
    const entities = activeTab === "categories" ? categories : wallets;
    const hiddenIds = activeTab === "categories" ? settings.hiddenCategoryIds : settings.hiddenWalletIds;

    return (
        <SectionCard actionLabel={null} className="settings-content__manager" title="Danh mục & ví">
            <div className="settings-content__tabs" role="tablist">
                <button aria-selected={activeTab === "categories"} className={activeTab === "categories" ? "is-active" : ""} onClick={() => setActiveTab("categories")} role="tab" type="button">Danh mục ({categories.length})</button>
                <button aria-selected={activeTab === "wallets"} className={activeTab === "wallets" ? "is-active" : ""} onClick={() => setActiveTab("wallets")} role="tab" type="button">Ví ({wallets.length})</button>
            </div>
            <p className="settings-content__hint">Sắp xếp thứ tự hiển thị, ẩn mục ít dùng và chọn mục mặc định.</p>
            <ul className="settings-content__entity-list">
                {entities.map((entity) => {
                    const sameTypeEntities = activeTab === "categories"
                        ? entities.filter((item) => item.type === entity.type)
                        : entities;
                    const typeIndex = sameTypeEntities.findIndex((item) => item.id === entity.id);
                    const isDefault = activeTab === "categories"
                        ? settings.defaultCategoryId === entity.id
                        : entity.isDefault;
                    return (
                        <EntityRow
                            canMoveDown={typeIndex < sameTypeEntities.length - 1}
                            canMoveUp={typeIndex > 0}
                            entity={entity}
                            isDefault={isDefault}
                            isHidden={hiddenIds.includes(entity.id)}
                            key={entity.id}
                            onMove={(direction) => activeTab === "categories" ? onMoveCategory(entity.id, direction) : onMoveWallet(entity.id, direction)}
                            onSetDefault={() => activeTab === "categories" ? onSetDefaultCategory(entity.id) : onSetDefaultWallet(entity.id)}
                            onToggleHidden={() => activeTab === "categories" ? onToggleCategory(entity.id) : onToggleWallet(entity.id)}
                            type={activeTab === "categories" ? "category" : "wallet"}
                        />
                    );
                })}
            </ul>
        </SectionCard>
    );
}

export default function SettingsContent({ categories = [], isWorking, message, onExport, onImport, onMoveCategory, onMoveWallet, onSetDefaultCategory, onSetDefaultWallet, onSettingChange, onToggleCategory, onToggleWallet, settings, wallets = [] }) {
    const fileInputRef = useRef(null);

    return (
        <div className="settings-content">
            {message ? <p className={`settings-content__message ${message.tone === "error" ? "is-error" : "is-success"}`} role="status">{message.text}</p> : null}
            <div className="settings-content__grid">
                <SectionCard actionLabel={null} className="settings-content__general" title="Cài đặt chung">
                    <PreferenceSelect description="Đơn vị dùng khi hiển thị số tiền" label="Tiền tệ" onChange={(value) => onSettingChange("currency", value)} options={expenseCurrencyLabels} value={settings.currency} />
                    <PreferenceSelect description="Cách rút gọn số tiền trên các báo cáo" label="Định dạng số tiền" onChange={(value) => onSettingChange("amountFormat", value)} options={expenseAmountFormatOptions} value={settings.amountFormat} />
                    <PreferenceSelect description="Áp dụng cho ngày hiển thị trong ứng dụng" label="Định dạng ngày" onChange={(value) => onSettingChange("dateFormat", value)} options={expenseDateFormatOptions} value={settings.dateFormat} />
                </SectionCard>

                <SectionCard actionLabel={null} className="settings-content__data" title="Dữ liệu CSV">
                    <p>Xuất toàn bộ giao dịch hoặc nhập lại từ tệp CSV theo đúng mẫu của ứng dụng.</p>
                    <div className="settings-content__data-actions">
                        <button disabled={isWorking} onClick={onExport} type="button"><DownloadIcon /> Xuất CSV</button>
                        <button disabled={isWorking} onClick={() => fileInputRef.current?.click()} type="button"><UploadIcon /> Nhập CSV</button>
                        <input accept=".csv,text/csv" className="sr-only" onChange={(event) => { const [file] = event.target.files; if (file) onImport(file); event.target.value = ""; }} ref={fileInputRef} type="file" />
                    </div>
                    <small>{isWorking ? "Đang xử lý dữ liệu..." : "Ngày trong CSV dùng định dạng YYYY-MM-DD; số tiền là số nguyên."}</small>
                </SectionCard>
            </div>

            <EntityManager categories={categories} onMoveCategory={onMoveCategory} onMoveWallet={onMoveWallet} onSetDefaultCategory={onSetDefaultCategory} onSetDefaultWallet={onSetDefaultWallet} onToggleCategory={onToggleCategory} onToggleWallet={onToggleWallet} settings={settings} wallets={wallets} />
        </div>
    );
}
