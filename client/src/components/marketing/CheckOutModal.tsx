import { useState, useEffect } from "react";
import { MapPin, Clock, Camera, Upload, AlertTriangle, CheckCircle, LogOut, Target, FileText } from "lucide-react";
import { uploadMarketingAttendancePhoto } from "@/lib/marketingPhotoUpload";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}

interface WorkSummary {
  visitCount: number;
  tasksCompleted: number;
  workDescription: string;
  outcome: string;
  nextAction: string;
}

interface CheckOutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckOut: (data: {
    latitude: number;
    longitude: number;
    location?: string;
    workDescription?: string;
    visitCount?: number;
    tasksCompleted?: number;
    outcome?: string;
    nextAction?: string;
  }) => Promise<{ attendanceId: string; success: boolean; error?: string }>;
  isLoading?: boolean;
  userId?: string;
  userName?: string;
  checkInTime?: string;
}

const outcomeOptions = [
  { value: 'productive', label: 'Productive Day' },
  { value: 'challenging', label: 'Challenging Day' },
  { value: 'normal', label: 'Normal Day' },
  { value: 'exceptional', label: 'Exceptional Day' },
  { value: 'needs_improvement', label: 'Needs Improvement' }
];

export default function CheckOutModal({ 
  open, 
  onOpenChange, 
  onCheckOut, 
  isLoading = false,
  userId,
  userName,
  checkInTime 
}: CheckOutModalProps) {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [address, setAddress] = useState('');
  
  // Work summary states
  const [workDescription, setWorkDescription] = useState('');
  const [visitCount, setVisitCount] = useState<number>(0);
  const [tasksCompleted, setTasksCompleted] = useState<number>(0);
  const [outcome, setOutcome] = useState<string>('');
  const [nextAction, setNextAction] = useState('');
  
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string>('');
  const [uploadedPhotoPath, setUploadedPhotoPath] = useState<string>('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setCurrentLocation(null);
      setLocationError('');
      setAddress('');
      setWorkDescription('');
      setVisitCount(0);
      setTasksCompleted(0);
      setOutcome('');
      setNextAction('');
      setUploadedPhoto(null);
      setPhotoPreview('');
      setIsUploadingPhoto(false);
      setPhotoUploadError('');
      setUploadedPhotoPath('');
      getCurrentLocation();
    }
  }, [open]);

  // Calculate work duration
  const getWorkDuration = () => {
    if (!checkInTime) return 'Unknown duration';
    
    const startTime = new Date(checkInTime);
    const endTime = new Date();
    
    const diffMs = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

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

  // Handle form submission - FIXED: Create attendance record first, then upload photo
  const handleSubmit = async () => {
    if (!currentLocation) {
      alert('Please get your current location first');
      return;
    }

    try {
      // Step 1: Create attendance record first (without photo)
      const checkOutData = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        location: address,
        workDescription: workDescription.trim() || undefined,
        visitCount: visitCount > 0 ? visitCount : undefined,
        tasksCompleted: tasksCompleted > 0 ? tasksCompleted : undefined,
        outcome: outcome || undefined,
        nextAction: nextAction.trim() || undefined
      };

      const result = await onCheckOut(checkOutData);
      
      if (!result.success) {
        alert(result.error || 'Failed to check out. Please try again.');
        return;
      }

      // Step 2: Upload photo if one is selected, using the real attendanceId
      if (uploadedPhoto && !uploadedPhotoPath) {
        setIsUploadingPhoto(true);
        setPhotoUploadError('');
        
        try {
          const photoResult = await uploadMarketingAttendancePhoto({
            file: uploadedPhoto,
            attendanceId: result.attendanceId,
            photoType: 'check-out'
          });

          if (photoResult.success) {
            setUploadedPhotoPath(photoResult.objectPath);
            
            // Step 3: Update attendance record with photo path
            const updateResponse = await fetch(`/api/marketing-attendance/${result.attendanceId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ checkOutPhotoPath: photoResult.objectPath })
            });
            
            if (!updateResponse.ok) {
              console.warn('Photo uploaded but failed to update attendance record');
              setPhotoUploadError('Photo uploaded but failed to link to record');
            }
          } else {
            setPhotoUploadError(photoResult.error || 'Photo upload failed');
          }
        } catch (error) {
          console.error('Photo upload error:', error);
          setPhotoUploadError('Photo upload failed. Please try again.');
        }
        
        setIsUploadingPhoto(false);
      }

      // Success - close modal after brief delay to show any photo upload status
      setTimeout(() => {
        onOpenChange(false);
      }, uploadedPhoto ? 1500 : 500);
      
    } catch (error) {
      console.error('Check-out error:', error);
      alert('Check-out failed. Please try again.');
    }
  };

  const locationAccuracy = getLocationAccuracy();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <LogOut className="h-5 w-5 text-red-500" />
            <span>Check Out from Work</span>
          </DialogTitle>
          <DialogDescription>
            {userName ? `Checking out ${userName}` : 'Complete your attendance with work summary'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Work Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Work Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Check-in Time</p>
                  <p className="font-medium" data-testid="checkin-time-display">
                    {checkInTime 
                      ? new Date(checkInTime).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: false 
                        })
                      : '--:--'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Work Duration</p>
                  <p className="font-medium text-green-600" data-testid="work-duration-display">
                    {getWorkDuration()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="visit-count" className="text-sm font-medium">Client Visits</Label>
                  <Input
                    id="visit-count"
                    type="number"
                    min="0"
                    value={visitCount}
                    onChange={(e) => setVisitCount(parseInt(e.target.value) || 0)}
                    className="mt-1"
                    data-testid="input-visit-count"
                  />
                </div>
                <div>
                  <Label htmlFor="tasks-completed" className="text-sm font-medium">Tasks Completed</Label>
                  <Input
                    id="tasks-completed"
                    type="number"
                    min="0"
                    value={tasksCompleted}
                    onChange={(e) => setTasksCompleted(parseInt(e.target.value) || 0)}
                    className="mt-1"
                    data-testid="input-tasks-completed"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="outcome" className="text-sm font-medium">Day Outcome</Label>
                <Select value={outcome} onValueChange={setOutcome}>
                  <SelectTrigger className="mt-1" data-testid="select-outcome">
                    <SelectValue placeholder="How was your day?" />
                  </SelectTrigger>
                  <SelectContent>
                    {outcomeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Work Description */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Work Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="work-description" className="text-sm font-medium">
                  What did you accomplish today?
                </Label>
                <Textarea
                  id="work-description"
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  placeholder="Summarize your work activities, achievements, and any important notes..."
                  className="mt-1 resize-none"
                  rows={4}
                  data-testid="textarea-work-description"
                />
              </div>

              <div>
                <Label htmlFor="next-action" className="text-sm font-medium">
                  Next Action Items (Optional)
                </Label>
                <Textarea
                  id="next-action"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  placeholder="What needs to be done tomorrow or next steps..."
                  className="mt-1 resize-none"
                  rows={2}
                  data-testid="textarea-next-action"
                />
              </div>
            </CardContent>
          </Card>

          {/* GPS Location Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Check-out Location</span>
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
                  <MapPin className="h-4 w-4 mr-2" />
                  Retry Getting Location
                </Button>
              )}
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
                    alt="Check-out photo" 
                    className="w-full max-w-xs rounded-lg border"
                    data-testid="photo-preview"
                  />
                  {uploadedPhotoPath && (
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Photo uploaded successfully
                    </p>
                  )}
                </div>
              )}

              {isUploadingPhoto && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Uploading photo...</span>
                </div>
              )}

              {photoUploadError && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{photoUploadError}</AlertDescription>
                </Alert>
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
              disabled={!currentLocation || isLoading || isUploadingPhoto}
              className="flex-1 bg-red-600 hover:bg-red-700"
              data-testid="button-checkout-confirm"
            >
              {isLoading || isUploadingPhoto ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{isUploadingPhoto ? 'Uploading Photo...' : 'Checking Out...'}</span>
                </div>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Check Out Now
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}