import { useRef, useState } from "react";
import { getPreviousMonthKey } from "../../utils/monthlyStatsUtils";
import { getMonthLabel, getVisibleMonthOptions } from "../../utils/monthUtils";
import ExpenseButton from "../shared/ExpenseButton";
import ExpenseDialog from "../shared/ExpenseDialog";
import ExpenseField from "../shared/ExpenseField";

export default function CopyBudgetsForm({ isDesktopMode, monthKey, monthOptions = [], onCancel, onCopy }) {
    const [sourceMonth, setSourceMonth] = useState(() => getPreviousMonthKey(monthKey));
    const sourceMonthOptions = getVisibleMonthOptions(monthOptions, getPreviousMonthKey(monthKey))
        .filter((option) => option !== monthKey);
    const [isCopying, setIsCopying] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const pending = useRef(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (pending.current || !sourceMonth || sourceMonth === monthKey) return;
        pending.current = true;
        setIsCopying(true);
        setFeedback(null);
        try {
            const { copiedCount, skippedCount, failedCount } = await onCopy(sourceMonth);
            setFeedback({
                error: failedCount > 0,
                message: copiedCount + skippedCount + failedCount === 0
                    ? "Tháng nguồn chưa có ngân sách để sao chép."
                    : `Đã sao chép ${copiedCount} ngân sách. Bỏ qua ${skippedCount} mục đã tồn tại hoặc có danh mục không còn hoạt động.${failedCount ? ` Có ${failedCount} mục chưa sao chép được. Vui lòng thử lại.` : ""}`,
            });
        } catch {
            setFeedback({ error: true, message: "Không thể tải ngân sách tháng nguồn. Kiểm tra kết nối và thử lại." });
        } finally {
            pending.current = false;
            setIsCopying(false);
        }
    };

    return (
        <ExpenseDialog
            backdropClassName={isDesktopMode ? "desktop-form-dialog__backdrop" : "mobile-budget-page__sheet-backdrop"}
            closeButtonClassName={isDesktopMode ? "desktop-form-dialog__close" : ""}
            headerClassName={isDesktopMode ? "desktop-form-dialog__header" : "mobile-budget-page__sheet-header"}
            headingId="copy-budgets-title"
            onClose={isCopying ? undefined : onCancel}
            panelClassName={isDesktopMode ? "desktop-form-dialog desktop-budget-dialog" : "mobile-budget-page__sheet"}
            title="Sao chép ngân sách"
        >
            <form className="budget-form" onSubmit={handleSubmit}>
                <div className="budget-form__content">
                    <p className="budget-form__hint">Sao chép hạn mức và ngưỡng cảnh báo vào tháng {monthKey.split("-").reverse().join("/")}. Giữ nguyên ngân sách đã có.</p>
                    <ExpenseField className="budget-form__field" label="Tháng nguồn">
                        <select
                            autoFocus
                            disabled={isCopying}
                            onChange={(event) => { setSourceMonth(event.target.value); setFeedback(null); }}
                            required
                            value={sourceMonth}
                        >
                            {sourceMonthOptions.map((option) => (
                                <option key={option} value={option}>{getMonthLabel(option)}</option>
                            ))}
                        </select>
                    </ExpenseField>
                    {sourceMonth === monthKey ? <p className="budget-form__error" role="alert">Chọn tháng nguồn khác tháng đích.</p> : null}
                    {feedback ? <p className={feedback.error ? "budget-form__error" : "budget-form__hint"} role={feedback.error ? "alert" : "status"}>{feedback.message}</p> : null}
                </div>
                <div className="budget-form__actions">
                    <ExpenseButton className="budget-form__cancel" disabled={isCopying} label="Đóng" onClick={onCancel} />
                    <ExpenseButton
                        className="budget-form__submit"
                        disabled={!sourceMonth || sourceMonth === monthKey}
                        isLoading={isCopying}
                        label="Sao chép"
                        loadingLabel="Đang sao chép…"
                        type="submit"
                    />
                </div>
            </form>
        </ExpenseDialog>
    );
}
