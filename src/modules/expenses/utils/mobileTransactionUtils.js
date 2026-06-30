function normalizeSearchValue(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("vi")
        .replace(/đ/g, "d");
}

function formatGroupDate(date) {
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
}

function getPreviousDate(date) {
    const value = new Date(`${date}T00:00:00Z`);
    value.setUTCDate(value.getUTCDate() - 1);
    return value.toISOString().slice(0, 10);
}

export function groupTransactions(transactions, activeFilter, searchTerm) {
    const normalizedSearchTerm = normalizeSearchValue(searchTerm.trim());
    const filteredTransactions = transactions.filter((transaction) => {
        const transactionType =
            transaction.type ?? (transaction.amount > 0 ? "income" : "expense");
        const matchesFilter =
            activeFilter === "all" || transactionType === activeFilter;
        const matchesSearch =
            !normalizedSearchTerm ||
            normalizeSearchValue(transaction.title).includes(
                normalizedSearchTerm,
            );

        return matchesFilter && matchesSearch;
    });

    return filteredTransactions
        .reduce((groups, transaction) => {
            const existingGroup = groups.find(
                (group) => group.date === transaction.date,
            );

            if (existingGroup) {
                existingGroup.transactions.push(transaction);
            } else {
                groups.push({
                    date: transaction.date,
                    transactions: [transaction],
                });
            }

            return groups;
        }, [])
        .sort((first, second) => second.date.localeCompare(first.date));
}

export function getLatestTransactionDate(transactions) {
    return transactions.reduce(
        (latest, transaction) =>
            !latest || transaction.date > latest ? transaction.date : latest,
        null,
    );
}

export function getTransactionGroupLabel(date, latestDate) {
    const formattedDate = formatGroupDate(date);

    if (date === latestDate) {
        return `Hôm nay • ${formattedDate}`;
    }

    if (date === getPreviousDate(latestDate)) {
        return `Hôm qua • ${formattedDate}`;
    }

    return formattedDate;
}
