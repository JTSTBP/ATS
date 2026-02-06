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
