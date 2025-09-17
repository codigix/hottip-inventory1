// Photo upload utility for marketing attendance
// Follows the same two-step pattern as logistics uploads

interface MarketingPhotoUploadOptions {
  file: File;
  attendanceId: string;
  photoType: 'check-in' | 'check-out';
}

interface MarketingPhotoUploadResult {
  objectPath: string;
  success: boolean;
  error?: string;
}

export const uploadMarketingAttendancePhoto = async ({ 
  file, 
  attendanceId, 
  photoType 
}: MarketingPhotoUploadOptions): Promise<MarketingPhotoUploadResult> => {
  try {
    // Step 1: Get upload URL from backend
    const uploadUrlResponse = await fetch('/api/marketing-attendance/photo/upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        attendanceId,
        fileName: file.name,
        contentType: file.type,
        photoType,
      }),
    });

    if (!uploadUrlResponse.ok) {
      const error = await uploadUrlResponse.json();
      throw new Error(error.error || `Failed to get upload URL: ${uploadUrlResponse.statusText}`);
    }

    const { uploadURL, objectPath } = await uploadUrlResponse.json();

    // Step 2: Upload file directly to object storage using signed URL
    const uploadResponse = await fetch(uploadURL, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
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
    console.error('Marketing photo upload error:', error);
    return {
      objectPath: '',
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};