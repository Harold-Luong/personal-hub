export const expenseUiText = Object.freeze({
    actions: Object.freeze({
        ADD_TRANSACTION: "Thêm giao dịch",
        CANCEL: "Hủy",
        CLOSE: "Đóng",
        CREATE_BUDGET: "Tạo ngân sách",
        CREATE_NEW: "Tạo mới",
        CREATE_WALLET: "Tạo ví",
        DELETE: "Xóa",
        LOGOUT: "Đăng xuất",
        MANAGE: "Quản lý",
        SAVE: "Lưu",
        SAVING: "Đang lưu...",
        DELETING: "Đang xóa...",
        TOGGLE_THEME: "Đổi giao diện",
        VIEW_ALL: "Xem tất cả",
    }),
    transaction: Object.freeze({
        LOADING: "Đang tải giao dịch...",
        NO_NOTE: "Không có ghi chú",
        NOT_FOUND: "Không tìm thấy giao dịch phù hợp.",
    }),
    status: Object.freeze({
        LOADING_DATA: "Đang tải dữ liệu...",
    }),
    report: Object.freeze({
        DAILY_VIEW: "Theo ngày",
        SELECT_WEEK_HINT: "Chọn một cột tuần để xem chi tiết từ Thứ 2 đến Chủ nhật.",
        WEEKLY_VIEW: "Theo tuần",
    }),
});

export const expenseFilterValues = Object.freeze({
    ALL: "all",
});

export const expenseSortKeys = Object.freeze({
    AMOUNT: "amount",
    BUDGET: "budget",
    DATE: "date",
    NAME: "name",
});

export const expenseSortDirections = Object.freeze({
    ASCENDING: "asc",
    DESCENDING: "desc",
});

export const expenseReportTrendViews = Object.freeze({
    DAILY: "daily",
    WEEKLY: "weekly",
});
