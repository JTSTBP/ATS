export const getImageUrl = (path: string | undefined | null) => {
    if (!path) return "";

    // If it's already a full URL (Cloudinary or S3), return as is
    if (path.startsWith("http")) {
        return path;
    }

    // Otherwise, assume it's a local path and prepend the backend URL
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    // Ensure there's no double slash and normalize backslashes to forward slashes
    const normalizedPath = path.replace(/\\/g, "/").startsWith("/") ? path.replace(/\\/g, "/").substring(1) : path.replace(/\\/g, "/");
    return `${backendUrl}/${normalizedPath}`;
};

/**
 * Checks if a file URL or path refers to a Word document (.doc or .docx)
 * @param url The file URL or path
 * @returns boolean
 */
export const isWordDocument = (url: string | null | undefined): boolean => {
    if (!url) return false;
    const extension = url.split('.').pop()?.toLowerCase();
    return extension === 'doc' || extension === 'docx';
};

/**
 * Returns a URL for previewing a file.
 * - PDFs are returned as is (browser-native preview).
 * - Word documents are also returned as is, but the UI will handle download logic.
 */
export const getFilePreviewUrl = (url: string | undefined | null) => {
    if (!url) return "";

    return getImageUrl(url);
};
