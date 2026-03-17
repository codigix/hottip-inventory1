import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { apiRequest } from "./queryClient"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Fetches a PDF from an authenticated endpoint and opens it in a new tab
 * using a Blob URL. This ensures Authorization headers are included.
 */
export async function openAuthenticatedPdf(url: string) {
  try {
    const blob = await apiRequest<Blob>(url, { responseType: 'blob' });
    
    // Create a new blob with explicit PDF type to ensure browser recognizes it
    const pdfBlob = new Blob([blob], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(pdfBlob);
    
    // Open in new tab
    const newWindow = window.open(blobUrl, '_blank');
    
    // Fallback if popup blocked
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // If window.open fails, we can try to create a link and click it
      const link = document.createElement('a');
      link.href = blobUrl;
      link.target = '_blank';
      link.download = `document_${Date.now()}.pdf`; // Fallback to download if open fails
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    // Note: We don't revokeObjectURL immediately as the new tab needs it to load
  } catch (error) {
    console.error("Failed to open PDF:", error);
  }
}
