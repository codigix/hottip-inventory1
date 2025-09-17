import { useState, useEffect } from "react";
import { MapPin, Clock, Camera, Upload, AlertTriangle, CheckCircle, Navigation, Target } from "lucide-react";
import { uploadAttendancePhoto } from "@/lib/photoUpload";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}

interface CheckInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckIn: (data: {
    latitude: number;
    longitude: number;
    location?: string;
    photoPath?: string;
    workDescription?: string;
  }) => void;
  isLoading?: boolean;
  userId?: string;
  userName?: string;
}

export default function CheckInModal({ 
  open, 
  onOpenChange, 
  onCheckIn, 
  isLoading = false,
  userId,
  userName 
}: CheckInModalProps) {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [address, setAddress] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string>('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setCurrentLocation(null);
      setLocationError('');
      setAddress('');
      setWorkDescription('');
      setUploadedPhoto(null);
      setPhotoPreview('');
      setUploadStatus('idle');
      setUploadError('');
      getCurrentLocation();
    }
  }, [open]);

  // Get current GPS location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    setIsLoadingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        
        setCurrentLocation(locationData);
        setIsLoadingLocation(false);
        
        // Reverse geocoding to get address (optional)
        getAddressFromCoordinates(locationData.latitude, locationData.longitude);
      },
      (error) => {
        setIsLoadingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access was denied. Please allow location access and try again.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An unknown error occurred while retrieving location.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Get address from coordinates using reverse geocoding
  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      // Using a free geocoding service (you might want to replace with your preferred service)
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=YOUR_API_KEY`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          setAddress(data.results[0].formatted);
        }
      }
    } catch (error) {
      // Silently fail - address is optional
      console.warn('Failed to get address from coordinates:', error);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedPhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!currentLocation) {
      setLocationError('Please enable location access to check in');
      return;
    }

    let photoPath: string | undefined;

    // Upload photo to object storage if provided
    if (uploadedPhoto && userId) {
      try {
        setUploadStatus('uploading');
        const uploadResult = await uploadAttendancePhoto({
          file: uploadedPhoto,
          attendanceId: userId, // Using userId as attendanceId for now
          photoType: 'check-in',
        });

        if (!uploadResult.success) {
          setUploadError(uploadResult.error || 'Photo upload failed');
          return;
        }

        photoPath = uploadResult.objectPath;
        setUploadStatus('success');
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : 'Photo upload failed');
        return;
      }
    }

    onCheckIn({
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      location: address || `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`,
      photoPath,
      workDescription: workDescription || undefined,
    });
  };

  // Location accuracy badge
  const getAccuracyBadge = () => {
    if (!currentLocation) return null;
    
    const accuracy = currentLocation.accuracy;
    if (accuracy <= 10) return <Badge variant="default" className="bg-green-100 text-green-800">High Accuracy</Badge>;
    if (accuracy <= 50) return <Badge variant="secondary">Good Accuracy</Badge>;
    return <Badge variant="outline">Low Accuracy</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="check-in-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Navigation className="h-5 w-5" />
            <span>Check In</span>
          </DialogTitle>
          <DialogDescription>
            {userName ? `Checking in ${userName}` : 'GPS check-in for logistics attendance'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Location Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Current Location</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingLocation ? (
                <div className="flex items-center space-x-2" data-testid="location-loading">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm">Getting your location...</span>
                </div>
              ) : locationError ? (
                <Alert variant="destructive" data-testid="location-error">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{locationError}</AlertDescription>
                </Alert>
              ) : currentLocation ? (
                <div className="space-y-2" data-testid="location-success">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Location acquired</span>
                    </div>
                    {getAccuracyBadge()}
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Lat: {currentLocation.latitude.toFixed(6)}</div>
                    <div>Lng: {currentLocation.longitude.toFixed(6)}</div>
                    <div>Accuracy: ±{currentLocation.accuracy.toFixed(0)}m</div>
                  </div>
                  
                  {address && (
                    <div className="text-sm text-muted-foreground" data-testid="location-address">
                      📍 {address}
                    </div>
                  )}
                </div>
              ) : (
                <Button 
                  onClick={getCurrentLocation} 
                  variant="outline" 
                  size="sm"
                  data-testid="get-location-button"
                >
                  <Target className="mr-2 h-4 w-4" />
                  Get Location
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Work Description */}
          <div className="space-y-2">
            <Label htmlFor="work-description">Work Description (Optional)</Label>
            <Textarea
              id="work-description"
              placeholder="Describe your planned logistics activities for today..."
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              className="min-h-[80px]"
              data-testid="work-description-input"
            />
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label htmlFor="photo-upload">Photo Verification (Optional)</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  data-testid="photo-upload-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  data-testid="photo-upload-button"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {uploadedPhoto ? 'Change Photo' : 'Take Photo'}
                </Button>
                {uploadedPhoto && (
                  <span className="text-sm text-muted-foreground" data-testid="photo-filename">
                    {uploadedPhoto.name}
                  </span>
                )}
              </div>
              
              {photoPreview && (
                <div className="relative w-full h-32 bg-muted rounded border" data-testid="photo-preview">
                  <img
                    src={photoPreview}
                    alt="Check-in photo preview"
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="cancel-checkin-button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!currentLocation || isLoading || uploadStatus === 'uploading'}
              className="flex-1"
              data-testid="submit-checkin-button"
            >
              {isLoading || uploadStatus === 'uploading' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {uploadStatus === 'uploading' ? 'Uploading Photo...' : 'Checking In...'}
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Check In
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}