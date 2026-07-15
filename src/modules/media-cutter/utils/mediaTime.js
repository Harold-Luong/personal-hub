import { MIN_SELECTION_DURATION_SECONDS } from "../constants/mediaCutterConstants";

export function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
}

export function normalizeMediaTime(value) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0;
}

export function formatMediaTime(value, forceHours = false) {
    const totalSeconds = Math.max(0, Math.round(normalizeMediaTime(value)));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [String(minutes).padStart(2, "0"), String(seconds).padStart(2, "0")];

    if (forceHours || hours > 0) {
        parts.unshift(String(hours).padStart(2, "0"));
    }

    return parts.join(":");
}

export function formatFfmpegTime(value) {
    const normalizedValue = normalizeMediaTime(value);
    const hours = Math.floor(normalizedValue / 3600);
    const minutes = Math.floor((normalizedValue % 3600) / 60);
    const seconds = (normalizedValue % 60).toFixed(3).padStart(6, "0");

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${seconds}`;
}

export function parseMediaTime(value) {
    if (typeof value !== "string") {
        return null;
    }

    const parts = value.trim().split(":");

    if (parts.length < 2 || parts.length > 3 || parts.some((part) => !/^\d{1,2}$/.test(part))) {
        return null;
    }

    const numbers = parts.map(Number);
    const seconds = numbers.at(-1);
    const minutes = numbers.at(-2);
    const hours = parts.length === 3 ? numbers[0] : 0;

    if (seconds >= 60 || minutes >= 60) {
        return null;
    }

    return (hours * 3600) + (minutes * 60) + seconds;
}

export function clampStartTime(value, endTime, duration) {
    const maximum = Math.max(0, Math.min(duration, endTime) - MIN_SELECTION_DURATION_SECONDS);
    return clamp(normalizeMediaTime(value), 0, maximum);
}

export function clampEndTime(value, startTime, duration) {
    const minimum = Math.min(duration, normalizeMediaTime(startTime) + MIN_SELECTION_DURATION_SECONDS);
    return clamp(normalizeMediaTime(value), minimum, duration);
}

export function getSelectionDuration(startTime, endTime) {
    return Math.max(0, normalizeMediaTime(endTime) - normalizeMediaTime(startTime));
}

export function validateTimeRange(startTime, endTime, duration) {
    if (![startTime, endTime, duration].every(Number.isFinite) || duration <= 0) {
        return "Không đọc được thời lượng hợp lệ của file.";
    }

    if (startTime < 0 || endTime > duration || startTime >= endTime) {
        return "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc và nằm trong file.";
    }

    return "";
}
