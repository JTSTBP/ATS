import { toast } from "react-toastify";
import { isWordDocument } from "./imageUtils";

/**
 * Handles file download with a notification if it's a Word document.
 * @param url The file URL
 * @param label The label for the notification (e.g., "Resume", "Offer Letter")
 */
export const handleFileDownload = (url: string | undefined | null, label: string = "File") => {
    if (!url) return;

    if (isWordDocument(url)) {
        toast.info(`Downloading ${label}...`);
    }

    // Trigger download
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    // For Word documents, we want to force download if possible, 
    // though browsers usually do this automatically for .docx.
    if (isWordDocument(url)) {
        const filename = url.split('/').pop() || `${label.replace(/\s+/g, '_')}.docx`;
        link.download = filename;
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
