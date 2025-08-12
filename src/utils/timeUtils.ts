// Utility functions for time formatting

export function formatTimeForDisplay(time: string): string {
    if (!time) return '';

    // Convert 24-hour format to 12-hour format with AM/PM
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

    return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function formatTimeSimple(time: string): string {
    if (!time) return '';

    // Show only hours and minutes in 24-hour format
    const [hours, minutes] = time.split(':').map(Number);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function formatDuration(startTime: string, endTime: string): string {
    if (!startTime || !endTime) return '';

    const startDisplay = formatTimeSimple(startTime);
    const endDisplay = formatTimeSimple(endTime);

    return `${startDisplay} - ${endDisplay}`;
}

export function validateTimeFormat(time: string): boolean {
    // Validate time format HH:MM
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
}

export function isEndTimeAfterStartTime(startTime: string, endTime: string): boolean {
    if (!startTime || !endTime) return false;

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);

    return end > start;
} 