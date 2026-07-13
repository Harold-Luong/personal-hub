import { transactionTypeMeta } from "../constants/expenseMetadata";

const expenseCsvColumnLabels = [
    "Ngày",
    "Giờ",
    "Loại giao dịch",
    "Số tiền",
    "Nội dung",
    "Danh mục",
    "Ví",
    "Ví chuyển",
    "Ví nhận",
    "Ghi chú",
];

function escapeCsvValue(value, delimiter) {
    let text = String(value ?? "");

    if (/^[=+@]/.test(text)) {
        text = `'${text}`;
    }

    return text.includes(delimiter) || /["\r\n]/.test(text)
        ? `"${text.replace(/"/g, '""')}"`
        : text;
}

function formatCsvDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ""));
    return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

export function createExpenseCsv(transactions = []) {
    const delimiter = ";";
    const rows = transactions.map((transaction) => [
        formatCsvDate(transaction.date),
        transaction.time,
        transactionTypeMeta[transaction.type]?.label ?? transaction.type,
        transaction.amountMinor ?? Math.abs(transaction.amount ?? 0),
        transaction.title,
        transaction.categoryName ?? transaction.categoryId,
        transaction.walletName ?? transaction.walletId,
        transaction.fromWalletName ?? transaction.fromWalletId,
        transaction.toWalletName ?? transaction.toWalletId,
        transaction.note,
    ]);

    return `\uFEFFsep=${delimiter}\r\n${[expenseCsvColumnLabels, ...rows]
        .map((row) => row.map((value) => escapeCsvValue(value, delimiter)).join(delimiter))
        .join("\r\n")}`;
}

export function downloadExpenseCsv(csv, filename = "expense-transactions.csv") {
    const content = String(csv ?? "").replace(/^\uFEFF/, "");
    const bytes = new Uint8Array(2 + content.length * 2);
    bytes[0] = 0xff;
    bytes[1] = 0xfe;

    for (let index = 0; index < content.length; index += 1) {
        const codeUnit = content.charCodeAt(index);
        bytes[2 + index * 2] = codeUnit & 0xff;
        bytes[3 + index * 2] = codeUnit >> 8;
    }

    const url = URL.createObjectURL(new Blob([bytes], { type: "text/csv;charset=utf-16le" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
