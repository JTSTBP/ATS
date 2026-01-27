export const formatDate = (date: string | number | Date | undefined | null): string => {
    if (!date) return 'Not provided';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';

    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
    };

    // Format using en-GB to get "12 Dec 2025" structure
    const formatted = new Intl.DateTimeFormat('en-GB', options).format(d);

    // Replace spaces with hyphens to get "12-Dec-2025"
    return formatted.replace(/ /g, '-');
};
