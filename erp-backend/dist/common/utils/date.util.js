"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLocalDate = parseLocalDate;
exports.startOfToday = startOfToday;
exports.addMonthsClamped = addMonthsClamped;
exports.addDays = addDays;
exports.addWeeks = addWeeks;
exports.addYearsClamped = addYearsClamped;
exports.addInterval = addInterval;
function parseLocalDate(dateOnly) {
    const [year, month, day] = dateOnly.split('-').map(Number);
    return new Date(year, month - 1, day);
}
function startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
function addMonthsClamped(date, months) {
    const targetMonthIndex = date.getMonth() + months;
    const lastDayOfTargetMonth = new Date(date.getFullYear(), targetMonthIndex + 1, 0).getDate();
    const day = Math.min(date.getDate(), lastDayOfTargetMonth);
    return new Date(date.getFullYear(), targetMonthIndex, day);
}
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
function addWeeks(date, weeks) {
    return addDays(date, weeks * 7);
}
function addYearsClamped(date, years) {
    const targetYear = date.getFullYear() + years;
    const lastDayOfTargetMonth = new Date(targetYear, date.getMonth() + 1, 0).getDate();
    const day = Math.min(date.getDate(), lastDayOfTargetMonth);
    return new Date(targetYear, date.getMonth(), day);
}
function addInterval(date, frequency, count = 1) {
    if (frequency === 'WEEKLY')
        return addWeeks(date, count);
    if (frequency === 'YEARLY')
        return addYearsClamped(date, count);
    return addMonthsClamped(date, count);
}
//# sourceMappingURL=date.util.js.map