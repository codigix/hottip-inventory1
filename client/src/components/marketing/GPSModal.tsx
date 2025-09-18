import { useState, useEffect } from "react";
import { MapPin, Navigation, CheckCircle, AlertTriangle, Timer, Camera, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

import type { FieldVisit } from "@shared/schema";

interface VisitWithDetails extends FieldVisit {
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
    companyName?: string;
  };
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}

interface GPSModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: VisitWithDetails | null;
  action: 'check-in' | 'check-out';
  onCheckIn: (location: { latitude: number; longitude: number; location?: string; photoPath?: string }) => void;
  onCheckOut: (data: { 
    latitude: number; 
    longitude: number; 
    location?: string; 
    photoPath?: string;
    visitNotes?: string;
    outcome?: string;
    nextAction?: string;
  }) => void;
  isLoading?: boolean;
}

export default function GPSModal({ open, onOpenChange, visit, action, onCheckIn, onCheckOut, isLoading = false }: GPSModalProps) {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [address, setAddress] = useState('');
  const [visitNotes, setVisitNotes] = useState('');
  const [outcome, setOutcome] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setCurrentLocation(null);
      setLocationError('');
      setAddress('');
      setVisitNotes('');
      setOutcome('');
      setNextAction('');
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
            errorMessage = 'Location permission denied. Please enable location access.';
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

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000; // Distance in meters
  };

  // Check if current location is near visit location
  const getLocationAccuracy = (): { isNearby: boolean; distance: number | null; warning: string } => {
    if (!currentLocation || !visit?.latitude || !visit?.longitude) {
      return { isNearby: false, distance: null, warning: 'Cannot verify location without GPS coordinates' };
    }

    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      parseFloat(visit.latitude),
      parseFloat(visit.longitude)
    );

    const isNearby = distance <= 200; // Within 200 meters
    
    let warning = '';
    if (!isNearby) {
      warning = `You are ${Math.round(distance)}m away from the scheduled visit location. Please verify you are at the correct address.`;
    } else if (currentLocation.accuracy > 100) {
      warning = `GPS accuracy is low (±${Math.round(currentLocation.accuracy)}m). Consider moving to an area with better signal.`;
    }

    return { isNearby, distance, warning };
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

  // Handle form submission
  const handleSubmit = () => {
    if (!currentLocation) {
      alert('Please get your current location first');
      return;
    }

    const locationData = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      location: address,
      photoPath: uploadedPhoto ? URL.createObjectURL(uploadedPhoto) : undefined
    };

    if (action === 'check-in') {
      onCheckIn(locationData);
    } else {
      onCheckOut({
        ...locationData,
        visitNotes,
        outcome,
        nextAction
      });
    }
  };

  const locationAccuracy = getLocationAccuracy();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {action === 'check-in' ? (
              <Navigation className="h-5 w-5 text-blue-500" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            <span>
              {action === 'check-in' ? 'Check In to Visit' : 'Check Out from Visit'}
            </span>
          </DialogTitle>
          <DialogDescription>
            {visit && `${visit.visitNumber} - ${visit.lead?.firstName} ${visit.lead?.lastName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Visit Information */}
          {visit && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Visit Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Customer:</span>
                    <p className="font-light">
                      {visit.lead?.firstName} {visit.lead?.lastName}
                      {visit.lead?.companyName && ` - ${visit.lead.companyName}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Purpose:</span>
                    <p className="font-light capitalize">{visit.purpose.replace('_', ' ')}</p>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Address:</span>
                  <p className="font-light">{visit.visitAddress}</p>
                </div>
              </CardContent>
            </Card>
          )}

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
                  <Timer className="h-4 w-4 animate-spin" />
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
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Latitude:</span>
                      <p className="font-mono">{currentLocation.latitude.toFixed(6)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Longitude:</span>
                      <p className="font-mono">{currentLocation.longitude.toFixed(6)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Address:</span>
                    <p className="font-light">{address || 'Getting address...'}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">Accuracy:</span>
                    <Badge 
                      variant={currentLocation.accuracy <= 50 ? 'default' : 'secondary'}
                      className={currentLocation.accuracy <= 50 ? 'bg-green-100 text-green-800' : ''}
                    >
                      ±{Math.round(currentLocation.accuracy)}m
                    </Badge>
                  </div>

                  {/* Location Verification */}
                  {locationAccuracy.distance !== null && (
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="flex items-center space-x-2">
                        <MapPin className={`h-4 w-4 ${locationAccuracy.isNearby ? 'text-green-500' : 'text-orange-500'}`} />
                        <span className="text-sm font-light">
                          {locationAccuracy.isNearby ? 'Location Verified' : 'Location Warning'}
                        </span>
                      </div>
                      {locationAccuracy.warning && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {locationAccuracy.warning}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <Button
                variant="outline"
                onClick={getCurrentLocation}
                disabled={isLoadingLocation}
                className="w-full"
                data-testid="button-get-location"
              >
                {isLoadingLocation ? (
                  <>
                    <Timer className="h-4 w-4 mr-2 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4 mr-2" />
                    {currentLocation ? 'Refresh Location' : 'Get Current Location'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Photo Upload Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Camera className="h-4 w-4" />
                <span>Photo {action === 'check-out' ? '(Required)' : '(Optional)'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {photoPreview && (
                <div className="mt-4">
                  <img 
                    src={photoPreview} 
                    alt="Visit proof" 
                    className="w-full max-w-sm h-48 object-cover rounded-lg border"
                  />
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={capturePhoto}
                  className="flex-1"
                  data-testid="button-capture-photo"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
                
                <Label htmlFor="photo-upload" className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full"
                    asChild
                    data-testid="button-upload-photo"
                  >
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </span>
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
            </CardContent>
          </Card>

          {/* Check-out Additional Fields */}
          {action === 'check-out' && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Visit Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="visit-notes">Visit Notes</Label>
                  <Textarea
                    id="visit-notes"
                    placeholder="Describe what happened during the visit..."
                    value={visitNotes}
                    onChange={(e) => setVisitNotes(e.target.value)}
                    data-testid="textarea-visit-notes"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="outcome">Outcome</Label>
                  <Input
                    id="outcome"
                    placeholder="e.g., Deal closed, Follow-up needed, Demo completed"
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    data-testid="input-outcome"
                  />
                </div>

                <div>
                  <Label htmlFor="next-action">Next Action</Label>
                  <Input
                    id="next-action"
                    placeholder="e.g., Send proposal, Schedule demo, Follow up in 1 week"
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value)}
                    data-testid="input-next-action"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!currentLocation || isLoading || (action === 'check-out' && !uploadedPhoto)}
              data-testid="button-submit"
            >
              {isLoading ? (
                <>
                  <Timer className="h-4 w-4 mr-2 animate-spin" />
                  {action === 'check-in' ? 'Checking In...' : 'Checking Out...'}
                </>
              ) : (
                <>
                  {action === 'check-in' ? (
                    <Navigation className="h-4 w-4 mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {action === 'check-in' ? 'Check In' : 'Check Out'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}