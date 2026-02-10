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
 * Returns a URL for previewing a file.
 * - PDFs are returned as is (browser-native preview).
 * - Word documents are wrapped in Google Docs Viewer.
 */
export const getFilePreviewUrl = (url: string | undefined | null) => {
    if (!url) return "";

    const fileUrl = getImageUrl(url);
    const extension = url.split('.').pop()?.toLowerCase();

    // if (extension === 'doc' || extension === 'docx') {
    //     // Wrap in Google Docs Viewer for Word documents
    //     return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
    // }

    return fileUrl;
};
