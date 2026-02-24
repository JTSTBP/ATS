/**
 * Utility functions for handling candidate status and history
 */

/**
 * Returns the latest timestamp when a candidate reached a specific status.
 * If no history is found, falls back to the provided fallback date or createdAt.
 * 
 * @param candidate The candidate object
 * @param targetStatuses Single status string or array of status strings to look for
 * @param fallbackDate Optional date to return if no history match is found
 */
export const getStatusTimestamp = (
    candidate: any,
    targetStatuses: string | string[],
    fallbackDate?: string
): string | null => {
    if (!candidate) return fallbackDate || null;

    const statuses = Array.isArray(targetStatuses) ? targetStatuses : [targetStatuses];

    // Priority for Joined/Selected: use their dedicated date fields if available
    if (statuses.includes("Joined") && candidate.joiningDate) return candidate.joiningDate;
    if (statuses.includes("Selected") && candidate.selectionDate) return candidate.selectionDate;

    // Look into statusHistory
    if (candidate.statusHistory && Array.isArray(candidate.statusHistory)) {
        // Filter history for target statuses and sort by timestamp descending
        const match = candidate.statusHistory
            .filter((h: any) => statuses.includes(h.status))
            .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        if (match) return match.timestamp;
    }

    return fallbackDate || candidate.createdAt || null;
};
