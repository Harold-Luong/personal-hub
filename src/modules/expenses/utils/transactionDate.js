// Resolve wall-clock input in its declared IANA timezone, independent of the
// server's timezone. Reject invalid dates and nonexistent DST clock times.
export function parseTransactionDate(date, time, timezone) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
        throw new Error("Ngày giờ giao dịch không hợp lệ.");
    }
    const target = Date.parse(`${date}T${time}:00Z`);
    if (!Number.isFinite(target) || new Date(target).toISOString().slice(0, 16) !== `${date}T${time}`) {
        throw new Error("Ngày giờ giao dịch không hợp lệ.");
    }
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    });
    const localValue = (epoch) => {
        const parts = Object.fromEntries(formatter.formatToParts(new Date(epoch)).map((p) => [p.type, p.value]));
        return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
    };
    let epoch = target;
    for (let attempt = 0; attempt < 4; attempt += 1) {
        const local = localValue(epoch);
        if (local === `${date}T${time}`) return new Date(epoch);
        epoch += target - Date.parse(`${local}:00Z`);
    }
    throw new Error("Giờ giao dịch không tồn tại trong múi giờ đã chọn.");
}
