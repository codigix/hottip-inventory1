// Photo upload utility for marketing attendance
// Follows the same two-step pattern as logistics uploads

interface MarketingPhotoUploadOptions {
  file: File;
  attendanceId: string;
  photoType: "check-in" | "check-out";
}

interface MarketingPhotoUploadResult {
  objectPath: string;
  success: boolean;
  error?: string;
}

import { apiRequest } from "@/lib/queryClient";

export const uploadMarketingAttendancePhoto = async ({
  file,
  attendanceId,
  photoType,
}: MarketingPhotoUploadOptions): Promise<MarketingPhotoUploadResult> => {
  try {
    // Step 1: Get upload URL from backend
    const { uploadURL, objectPath } = await apiRequest<{
      uploadURL: string;
      objectPath: string;
    }>("/api/marketing-attendance/photo/upload-url", {
      method: "POST",
      body: {
        attendanceId,
        fileName: file.name,
        contentType: file.type,
        photoType,
      },
    });

    // Step 2: Upload file directly to object storage using signed URL
    const uploadResponse = await fetch(uploadURL, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Photo upload failed: ${uploadResponse.statusText}`);
    }

    return {
      objectPath,
      success: true,
    };
  } catch (error) {
    console.error("Marketing photo upload error:", error);
    return {
      objectPath: "",
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
};
