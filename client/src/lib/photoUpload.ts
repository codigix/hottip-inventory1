// Photo upload utility for logistics attendance
// Follows the same two-step pattern as POD uploads

interface PhotoUploadOptions {
  file: File;
  attendanceId: string;
  photoType: 'check-in' | 'check-out';
}

interface PhotoUploadResult {
  objectPath: string;
  success: boolean;
  error?: string;
}

export const uploadAttendancePhoto = async ({ 
  file, 
  attendanceId, 
  photoType 
}: PhotoUploadOptions): Promise<PhotoUploadResult> => {
  try {
    // Step 1: Get upload URL from backend
    const uploadUrlResponse = await fetch('/logistics/attendance/photo/upload-url', {
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
    console.error('Photo upload error:', error);
    return {
      objectPath: '',
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};