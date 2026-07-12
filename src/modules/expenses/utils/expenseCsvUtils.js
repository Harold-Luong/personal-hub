import { transactionTypeMeta, transactionTypes } from "../constants/expenseMetadata";

export const expenseCsvColumns = [
    "date",
    "time",
    "type",
    "amount",
    "title",
    "category",
    "wallet",
    "from_wallet",
    "to_wallet",
    "note",
];

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

const csvHeaderAliases = {
    date: "date",
    ngay: "date",
    time: "time",
    gio: "time",
    type: "type",
    loaigiaodich: "type",
    amount: "amount",
    sotien: "amount",
    title: "title",
    noidung: "title",
    category: "category",
    danhmuc: "category",
    wallet: "wallet",
    vi: "wallet",
    fromwallet: "from_wallet",
    vichuyen: "from_wallet",
    towallet: "to_wallet",
    vinhan: "to_wallet",
    note: "note",
    ghichu: "note",
};

function normalizeLookupValue(value) {
    return String(value ?? "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/gi, "d")
        .toLocaleLowerCase("vi")
        .replace(/[^a-z0-9]/g, "");
}

function escapeCsvValue(value, delimiter) {
    let text = String(value ?? "");

    if (/^[=+@]/.test(text)) {
        text = `'${text}`;
    }

    return text.includes(delimiter) || /["\r\n]/.test(text)
        ? `"${text.replace(/"/g, '""')}"`
        : text;
}

function parseCsvRows(content, delimiter) {
    const rows = [];
    let currentRow = [];
    let currentValue = "";
    let isQuoted = false;

    for (let index = 0; index < content.length; index += 1) {
        const character = content[index];
        const nextCharacter = content[index + 1];

        if (character === '"' && isQuoted && nextCharacter === '"') {
            currentValue += '"';
            index += 1;
        } else if (character === '"') {
            isQuoted = !isQuoted;
        } else if (character === delimiter && !isQuoted) {
            currentRow.push(currentValue);
            currentValue = "";
        } else if ((character === "\n" || character === "\r") && !isQuoted) {
            if (character === "\r" && nextCharacter === "\n") {
                index += 1;
            }

            currentRow.push(currentValue);
            if (currentRow.some((value) => value.trim())) {
                rows.push(currentRow);
            }
            currentRow = [];
            currentValue = "";
        } else {
            currentValue += character;
        }
    }

    currentRow.push(currentValue);
    if (currentRow.some((value) => value.trim())) {
        rows.push(currentRow);
    }

    return rows;
}

function findEntity(value, entities) {
    const normalizedValue = String(value ?? "").trim().toLocaleLowerCase("vi");
    return entities.find((entity) =>
        entity.id === value || String(entity.name ?? "").trim().toLocaleLowerCase("vi") === normalizedValue
    );
}

function formatCsvDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ""));
    return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

function normalizeCsvDate(value) {
    const text = String(value ?? "").trim();
    const localMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
    return localMatch ? `${localMatch[3]}-${localMatch[2]}-${localMatch[1]}` : text;
}

function normalizeTransactionType(value) {
    const normalizedValue = normalizeLookupValue(value);
    return Object.values(transactionTypes).find((type) =>
        normalizeLookupValue(type) === normalizedValue
        || normalizeLookupValue(transactionTypeMeta[type]?.label) === normalizedValue
    ) ?? "";
}

function parseCsvAmount(value) {
    const normalizedValue = String(value ?? "").trim().replace(/[^\d-]/g, "");
    return Math.round(Number(normalizedValue));
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

export async function readExpenseCsvFile(file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let content;

    if (bytes[0] === 0xff && bytes[1] === 0xfe) {
        content = new TextDecoder("utf-16le").decode(bytes.subarray(2));
    } else if (bytes[0] === 0xfe && bytes[1] === 0xff) {
        content = new TextDecoder("utf-16be").decode(bytes.subarray(2));
    } else {
        content = new TextDecoder("utf-8").decode(bytes).replace(/^\uFEFF/, "");
    }

    const separatorMatch = /^sep=(.)\r?\n/i.exec(content);
    const firstLine = content.split(/\r?\n/, 1)[0] ?? "";
    const delimiter = separatorMatch?.[1] ?? (firstLine.split(";").length > firstLine.split(",").length ? ";" : ",");

    if (separatorMatch) {
        content = content.slice(separatorMatch[0].length);
    }

    const [headerRow, ...dataRows] = parseCsvRows(content, delimiter);
    const headers = headerRow?.map((header) => csvHeaderAliases[normalizeLookupValue(header)] ?? "") ?? [];

    if (!expenseCsvColumns.every((column) => headers.includes(column))) {
        throw new Error(`CSV cần có các cột: ${expenseCsvColumnLabels.join(", ")}.`);
    }

    return dataRows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
}

export function mapExpenseCsvRows(rows, categories = [], wallets = []) {
    return rows.map((row, index) => {
        const rowNumber = index + 2;
        const type = normalizeTransactionType(row.type);
        const amount = parseCsvAmount(row.amount);
        const date = normalizeCsvDate(row.date);
        const category = findEntity(row.category, categories);
        const wallet = findEntity(row.wallet, wallets);
        const fromWallet = findEntity(row.from_wallet, wallets);
        const toWallet = findEntity(row.to_wallet, wallets);

        if (![transactionTypes.EXPENSE, transactionTypes.INCOME, transactionTypes.TRANSFER].includes(type)) {
            throw new Error(`Dòng ${rowNumber}: loại giao dịch không hợp lệ.`);
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isSafeInteger(amount) || amount <= 0 || !row.title?.trim()) {
            throw new Error(`Dòng ${rowNumber}: ngày, số tiền hoặc nội dung không hợp lệ.`);
        }

        if (type === transactionTypes.TRANSFER) {
            if (!fromWallet || !toWallet || fromWallet.id === toWallet.id) {
                throw new Error(`Dòng ${rowNumber}: ví chuyển và ví nhận không hợp lệ.`);
            }
        } else if (!category || !wallet) {
            throw new Error(`Dòng ${rowNumber}: không tìm thấy danh mục hoặc ví.`);
        }

        return {
            amount: type === transactionTypes.INCOME ? amount : -amount,
            categoryId: type === transactionTypes.TRANSFER ? null : category.id,
            date,
            fromWalletId: type === transactionTypes.TRANSFER ? fromWallet.id : null,
            note: row.note?.trim() ?? "",
            time: /^\d{2}:\d{2}$/.test(row.time) ? row.time : "12:00",
            title: row.title.trim(),
            toWalletId: type === transactionTypes.TRANSFER ? toWallet.id : null,
            type,
            walletId: type === transactionTypes.TRANSFER ? null : wallet.id,
        };
    });
}
