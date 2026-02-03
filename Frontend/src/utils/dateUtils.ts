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

export const formatTime = (time: string | number | Date | undefined | null): string => {
    if (!time) return '-';

    // If it's a 24-hour time string "HH:MM:SS" or "HH:MM"
    if (typeof time === 'string' && /^\d{1,2}:\d{1,2}(:\d{1,2})?$/.test(time)) {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    }

    const d = new Date(time);
    if (isNaN(d.getTime())) return '-';

    return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
};

