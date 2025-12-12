// Time and date utilities for consultation scheduling

export const addHours = (date, hours) => {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
};

export const addMinutes = (date, minutes) => {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
};

export const isInPast = (date) => {
    return new Date(date) < new Date();
};

export const isInFuture = (date) => {
    return new Date(date) > new Date();
};

export const getHoursDifference = (date1, date2) => {
    const diffMs = Math.abs(new Date(date2) - new Date(date1));
    return diffMs / (1000 * 60 * 60);
};

export const formatDateTime = (date) => {
    return new Date(date).toISOString();
};

export const isWithinTimeRange = (checkDate, startDate, endDate) => {
    const check = new Date(checkDate);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return check >= start && check <= end;
};

// Check if two time ranges overlap
export const doTimeRangesOverlap = (start1, end1, start2, end2) => {
    const s1 = new Date(start1);
    const e1 = new Date(end1);
    const s2 = new Date(start2);
    const e2 = new Date(end2);

    return s1 < e2 && s2 < e1;
};
