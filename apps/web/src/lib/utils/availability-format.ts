export const formatTimeAr = (time: string): string => {
    if (!time) return '';
    const [hourStr, minuteStr] = time.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = minuteStr;

    const period = hour >= 12 ? 'مساءً' : 'صباحًا';

    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;

    const hourAr = hour.toLocaleString('ar-SA');
    const minuteAr = parseInt(minute, 10).toLocaleString('ar-SA', { minimumIntegerDigits: 2, useGrouping: false });

    return `${hourAr}:${minuteAr} ${period}`;
};

export const formatDateAr = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

export const formatCurrencyAr = (amount: number): string => {
    // Format number first, then currency code.
    // Using standard Arabic digits.
    const numberPart = amount.toLocaleString('ar-SA');
    return `${numberPart} SDG`;
};

// Helper to convert English digits to Arabic-Indic digits if needed manually,
// though toLocaleString('ar-SA') usually handles this. 
// Added for robustness if strings come mixed.
export const toArabicNumerals = (str: string): string => {
    return str.replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
};
