export const getImageUrl = (path: string | undefined | null) => {
    if (!path) return "";

    // If it's already a full URL (Cloudinary or S3), return as is
    if (path.startsWith("http")) {
        return path;
    }

    // Otherwise, assume it's a local path and prepend the backend URL
    const backendUrl = import.meta.env.VITE_BACKEND_URL

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
    // Remove query parameters or fragments if any, and trim whitespace
    const pureUrl = url.trim().split(/[?#]/)[0];
    const extension = pureUrl.split('.').pop()?.toLowerCase();
    return extension === 'doc' || extension === 'docx';
};

/**
 * Returns a URL for previewing a file.
 * - PDFs are returned as is (browser-native preview).
 * - Word documents are returned using Google Docs Viewer to avoid auto-downloading.
 */
export const getFilePreviewUrl = (url: string | undefined | null) => {
    if (!url) return "";

    const fullUrl = getImageUrl(url);
    if (isWordDocument(url)) {
        return `https://docs.google.com/viewer?url=${encodeURIComponent(fullUrl)}`;
    }
    return fullUrl;
};

/**
 * Downloads a file directly to the user's browser.
 * Uses blob fetch to ensure cross-origin S3/R2 signed URLs are downloaded with the correct filename.
 */
export const downloadFile = async (url: string | undefined | null, defaultFilename = "document") => {
    if (!url) return;
    try {
        const fullUrl = getImageUrl(url);
        const response = await fetch(fullUrl);
        if (!response.ok) throw new Error("Network response was not ok");
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = defaultFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
        // Fallback for CORS or direct downloads
        const fullUrl = getImageUrl(url);
        const link = document.createElement("a");
        link.href = fullUrl;
        link.target = "_blank";
        link.download = defaultFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
