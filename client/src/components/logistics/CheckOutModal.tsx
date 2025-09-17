import { useState, useEffect } from "react";
import { MapPin, Clock, Camera, Upload, AlertTriangle, CheckCircle, Navigation, Target, TrendingUp, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}

interface CheckOutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckOut: (data: {
    latitude: number;
    longitude: number;
    location?: string;
    photoPath?: string;
    workDescription?: string;
    taskCount?: number;
    deliveriesCompleted?: number;
  }) => void;
  isLoading?: boolean;
  userId?: string;
  userName?: string;
  checkInTime?: string;
}

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
  const [workDescription, setWorkDescription] = useState('');
  const [taskCount, setTaskCount] = useState<number>(0);
  const [deliveriesCompleted, setDeliveriesCompleted] = useState<number>(0);
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setCurrentLocation(null);
      setLocationError('');
      setAddress('');
      setWorkDescription('');
      setTaskCount(0);
      setDeliveriesCompleted(0);
      setUploadedPhoto(null);
      setPhotoPreview('');
      getCurrentLocation();
    }
  }, [open]);

  // Calculate work duration
  const getWorkDuration = () => {
    if (!checkInTime) return null;
    
    const checkIn = new Date(checkInTime);
    const now = new Date();
    const diffMs = now.getTime() - checkIn.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
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
  const handleSubmit = () => {
    if (!currentLocation) {
      setLocationError('Please enable location access to check out');
      return;
    }

    onCheckOut({
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      location: address || `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`,
      photoPath: uploadedPhoto ? `check-out-${userId}-${Date.now()}.jpg` : undefined,
      workDescription: workDescription || undefined,
      taskCount: taskCount > 0 ? taskCount : undefined,
      deliveriesCompleted: deliveriesCompleted > 0 ? deliveriesCompleted : undefined,
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" data-testid="check-out-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Navigation className="h-5 w-5" />
            <span>Check Out</span>
          </DialogTitle>
          <DialogDescription>
            {userName ? `Checking out ${userName}` : 'GPS check-out for logistics attendance'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Work Summary */}
          {checkInTime && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Work Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Check-in time:</span> {format(new Date(checkInTime), 'HH:mm')}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Work duration:</span> {getWorkDuration()}
                </div>
              </CardContent>
            </Card>
          )}

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

          {/* Work Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-count" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Tasks Completed</span>
              </Label>
              <Input
                id="task-count"
                type="number"
                min="0"
                value={taskCount}
                onChange={(e) => setTaskCount(parseInt(e.target.value) || 0)}
                placeholder="0"
                data-testid="task-count-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveries-completed" className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Deliveries</span>
              </Label>
              <Input
                id="deliveries-completed"
                type="number"
                min="0"
                value={deliveriesCompleted}
                onChange={(e) => setDeliveriesCompleted(parseInt(e.target.value) || 0)}
                placeholder="0"
                data-testid="deliveries-completed-input"
              />
            </div>
          </div>

          {/* Work Description */}
          <div className="space-y-2">
            <Label htmlFor="work-description">Work Summary (Optional)</Label>
            <Textarea
              id="work-description"
              placeholder="Summarize your logistics activities and achievements today..."
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
                    alt="Check-out photo preview"
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
              data-testid="cancel-checkout-button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!currentLocation || isLoading}
              className="flex-1"
              data-testid="submit-checkout-button"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Checking Out...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Check Out
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}