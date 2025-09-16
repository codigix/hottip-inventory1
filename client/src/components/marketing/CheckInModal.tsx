import { useState, useEffect } from "react";
import { MapPin, Clock, Camera, Upload, AlertTriangle, CheckCircle, Navigation, Target } from "lucide-react";

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

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setCurrentLocation(null);
      setLocationError('');
      setAddress('');
      setWorkDescription('');
      setUploadedPhoto(null);
      setPhotoPreview('');
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
      async (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        };

        setCurrentLocation(locationData);
        setIsLoadingLocation(false);

        // Try to get address from coordinates
        try {
          const addressText = await reverseGeocode(locationData.latitude, locationData.longitude);
          setAddress(addressText);
        } catch (error) {
          console.warn('Failed to get address:', error);
          setAddress(`Lat: ${locationData.latitude.toFixed(6)}, Lng: ${locationData.longitude.toFixed(6)}`);
        }
      },
      (error) => {
        setIsLoadingLocation(false);
        let errorMessage = 'Failed to get location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access and refresh the page.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please try again.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
        }
        
        setLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  };

  // Simple reverse geocoding using a free service
  const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }
      
      const data = await response.json();
      
      if (data.locality || data.city) {
        return `${data.locality || data.city}, ${data.principalSubdivision || ''}, ${data.countryName || ''}`.replace(/,\s*,/g, ',').replace(/,\s*$/, '');
      }
      
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch (error) {
      throw new Error('Failed to get address');
    }
  };

  // Handle photo upload
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Photo size must be less than 5MB');
        return;
      }

      setUploadedPhoto(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle camera capture
  const capturePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera
      });
      
      // Create video element to show camera feed
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      // This is a simplified implementation
      // In a real app, you'd show a camera interface
      alert('Camera feature requires additional implementation. Please use the upload button to select a photo.');
      
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      alert('Camera access denied or not available');
    }
  };

  // Get location accuracy status
  const getLocationAccuracy = (): { status: 'good' | 'fair' | 'poor'; message: string } => {
    if (!currentLocation) {
      return { status: 'poor', message: 'Location not available' };
    }

    if (currentLocation.accuracy <= 10) {
      return { status: 'good', message: `Excellent accuracy (±${Math.round(currentLocation.accuracy)}m)` };
    } else if (currentLocation.accuracy <= 50) {
      return { status: 'fair', message: `Good accuracy (±${Math.round(currentLocation.accuracy)}m)` };
    } else {
      return { status: 'poor', message: `Low accuracy (±${Math.round(currentLocation.accuracy)}m). Consider moving to an area with better signal.` };
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!currentLocation) {
      alert('Please get your current location first');
      return;
    }

    const checkInData = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      location: address,
      photoPath: uploadedPhoto ? URL.createObjectURL(uploadedPhoto) : undefined,
      workDescription: workDescription.trim() || undefined
    };

    onCheckIn(checkInData);
  };

  const locationAccuracy = getLocationAccuracy();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Navigation className="h-5 w-5 text-green-500" />
            <span>Check In to Work</span>
          </DialogTitle>
          <DialogDescription>
            {userName ? `Checking in ${userName}` : 'Record your attendance with GPS verification'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Time */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Check-in Time</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600" data-testid="checkin-current-time">
                {new Date().toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                })}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </CardContent>
          </Card>

          {/* GPS Location Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>GPS Location</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingLocation && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Getting your location...</span>
                </div>
              )}

              {locationError && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{locationError}</AlertDescription>
                </Alert>
              )}

              {currentLocation && (
                <div className="space-y-3">
                  {/* Location Status */}
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Location acquired</span>
                    <Badge 
                      variant={locationAccuracy.status === 'good' ? 'default' : 
                               locationAccuracy.status === 'fair' ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {locationAccuracy.status.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Location Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Latitude:</span>
                      <p className="font-medium" data-testid="location-latitude">
                        {currentLocation.latitude.toFixed(6)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Longitude:</span>
                      <p className="font-medium" data-testid="location-longitude">
                        {currentLocation.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <Label htmlFor="address" className="text-sm font-medium">Location Address</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Address will be auto-filled..."
                      className="mt-1"
                      data-testid="input-address"
                    />
                  </div>

                  {/* Accuracy Warning */}
                  {locationAccuracy.status !== 'good' && (
                    <Alert>
                      <Target className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {locationAccuracy.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Retry Location Button */}
              {locationError && (
                <Button 
                  variant="outline" 
                  onClick={getCurrentLocation}
                  className="w-full"
                  data-testid="button-retry-location"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Retry Getting Location
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Work Description */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Work Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="work-description" className="text-sm font-medium">
                What will you be working on today? (Optional)
              </Label>
              <Textarea
                id="work-description"
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                placeholder="Describe your work plan for today..."
                className="mt-1 resize-none"
                rows={3}
                data-testid="textarea-work-description"
              />
            </CardContent>
          </Card>

          {/* Photo Upload */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Camera className="h-4 w-4" />
                <span>Photo Verification (Optional)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  onClick={capturePhoto}
                  className="flex-1"
                  data-testid="button-camera"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
                
                <Label 
                  htmlFor="photo-upload" 
                  className="flex-1 cursor-pointer"
                >
                  <Button 
                    variant="outline" 
                    className="w-full"
                    asChild
                    data-testid="button-upload"
                  >
                    <div>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </div>
                  </Button>
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </Label>
              </div>

              {photoPreview && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-2">Photo Preview:</p>
                  <img 
                    src={photoPreview} 
                    alt="Check-in photo" 
                    className="w-full max-w-xs rounded-lg border"
                    data-testid="photo-preview"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!currentLocation || isLoading}
              className="flex-1"
              data-testid="button-checkin-confirm"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Checking In...</span>
                </div>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Check In Now
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}