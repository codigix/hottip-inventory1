import { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Timer, CheckCircle, AlertCircle, Zap, Route, Target } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

import type { FieldVisit } from "@shared/schema";

interface VisitWithDetails extends FieldVisit {
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
    companyName?: string;
  };
  assignedToUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface VisitMapProps {
  visits: VisitWithDetails[];
  isLoading: boolean;
  onVisitSelect: (visit: VisitWithDetails) => void;
  onCheckIn: (visit: VisitWithDetails) => void;
  onCheckOut: (visit: VisitWithDetails) => void;
}

interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  visit: VisitWithDetails;
  status: string;
}

export default function VisitMap({ visits, isLoading, onVisitSelect, onCheckIn, onCheckOut }: VisitMapProps) {
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<VisitWithDetails | null>(null);
  const [mapError, setMapError] = useState<string>('');
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Filter visits with valid coordinates
  const visitsWithCoordinates = visits.filter(visit => 
    visit.latitude && visit.longitude
  );

  // Create markers from visits
  const markers: MapMarker[] = visitsWithCoordinates.map(visit => ({
    id: visit.id,
    latitude: parseFloat(visit.latitude!),
    longitude: parseFloat(visit.longitude!),
    visit,
    status: visit.status
  }));

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Could not get current location:', error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Get status color for markers
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '#3b82f6'; // Blue
      case 'in_progress':
        return '#f59e0b'; // Orange
      case 'completed':
        return '#10b981'; // Green
      case 'cancelled':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return Timer;
      case 'in_progress':
        return Navigation;
      case 'completed':
        return CheckCircle;
      case 'cancelled':
        return AlertCircle;
      default:
        return MapPin;
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
    return R * c;
  };

  // Open location in external map app
  const openInMaps = (visit: VisitWithDetails) => {
    if (visit.latitude && visit.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${visit.latitude},${visit.longitude}`;
      window.open(url, '_blank');
    }
  };

  // Get nearby visits
  const getNearbyVisits = (centerVisit: VisitWithDetails) => {
    if (!centerVisit.latitude || !centerVisit.longitude) return [];
    
    return visitsWithCoordinates
      .filter(visit => visit.id !== centerVisit.id)
      .map(visit => ({
        visit,
        distance: calculateDistance(
          parseFloat(centerVisit.latitude!),
          parseFloat(centerVisit.longitude!),
          parseFloat(visit.latitude!),
          parseFloat(visit.longitude!)
        )
      }))
      .filter(item => item.distance <= 10) // Within 10km
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  };

  // Simple map implementation using CSS and positioning
  const renderSimpleMap = () => {
    if (markers.length === 0) {
      return (
        <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No visits with GPS coordinates</p>
          </div>
        </div>
      );
    }

    // Calculate bounds
    const latitudes = markers.map(m => m.latitude);
    const longitudes = markers.map(m => m.longitude);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    return (
      <div className="h-96 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 rounded-lg relative overflow-hidden border">
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-10 grid-rows-10 h-full w-full">
            {[...Array(100)].map((_, i) => (
              <div key={i} className="border border-gray-300 dark:border-gray-600" />
            ))}
          </div>
        </div>

        {/* Current Location */}
        {currentLocation && (
          <div
            className="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg z-10"
            style={{
              left: `${((currentLocation.longitude - minLng) / (maxLng - minLng)) * 100}%`,
              top: `${(1 - (currentLocation.latitude - minLat) / (maxLat - minLat)) * 100}%`,
              transform: 'translate(-50%, -50%)'
            }}
            title="Your Location"
          >
            <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping" />
          </div>
        )}

        {/* Visit Markers */}
        {markers.map((marker) => {
          const StatusIcon = getStatusIcon(marker.status);
          const isSelected = selectedVisit?.id === marker.visit.id;
          
          return (
            <div
              key={marker.id}
              className={`absolute w-8 h-8 rounded-full border-2 border-white shadow-lg cursor-pointer transition-all z-20 ${
                isSelected ? 'scale-125 ring-2 ring-primary' : 'hover:scale-110'
              }`}
              style={{
                backgroundColor: getStatusColor(marker.status),
                left: `${((marker.longitude - minLng) / (maxLng - minLng)) * 100}%`,
                top: `${(1 - (marker.latitude - minLat) / (maxLat - minLat)) * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={() => setSelectedVisit(marker.visit)}
              title={`${marker.visit.lead?.firstName} ${marker.visit.lead?.lastName} - ${marker.status}`}
              data-testid={`map-marker-${marker.visit.visitNumber}`}
            >
              <StatusIcon className="w-4 h-4 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
          );
        })}

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg">
          <h4 className="text-xs font-semibold mb-2">Visit Status</h4>
          <div className="space-y-1">
            {[
              { status: 'scheduled', label: 'Scheduled', color: '#3b82f6' },
              { status: 'in_progress', label: 'In Progress', color: '#f59e0b' },
              { status: 'completed', label: 'Completed', color: '#10b981' },
              { status: 'cancelled', label: 'Cancelled', color: '#ef4444' }
            ].map(({ status, label, color }) => (
              <div key={status} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full border border-white"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Current Location Indicator */}
        {currentLocation && (
          <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-lg">
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span>Your Location</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-96 w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-1" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Map Container */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Visit Locations ({visitsWithCoordinates.length} with GPS)</span>
            </div>
            {selectedVisit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openInMaps(selectedVisit)}
                data-testid="button-open-in-maps"
              >
                <Route className="h-4 w-4 mr-2" />
                Get Directions
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mapError ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{mapError}</AlertDescription>
            </Alert>
          ) : (
            <div ref={mapContainerRef}>
              {renderSimpleMap()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Visit Details */}
      {selectedVisit && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Selected Visit</span>
              </div>
              <Badge className="capitalize">
                {selectedVisit.status.replace('_', ' ')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">
                  {selectedVisit.visitNumber} - {selectedVisit.lead?.firstName} {selectedVisit.lead?.lastName}
                </h4>
                {selectedVisit.lead?.companyName && (
                  <p className="text-sm text-muted-foreground">{selectedVisit.lead.companyName}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  Purpose: {selectedVisit.purpose.replace('_', ' ')}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Address:</p>
                <p className="text-sm font-medium">{selectedVisit.visitAddress}</p>
                {selectedVisit.visitCity && (
                  <p className="text-sm text-muted-foreground">{selectedVisit.visitCity}</p>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onVisitSelect(selectedVisit)}
                data-testid="button-view-details"
              >
                View Details
              </Button>
              
              {selectedVisit.status === 'scheduled' && !selectedVisit.actualStartTime && (
                <Button
                  size="sm"
                  onClick={() => onCheckIn(selectedVisit)}
                  data-testid="button-check-in"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Check In
                </Button>
              )}
              
              {selectedVisit.status === 'in_progress' && selectedVisit.actualStartTime && !selectedVisit.actualEndTime && (
                <Button
                  size="sm"
                  onClick={() => onCheckOut(selectedVisit)}
                  data-testid="button-check-out"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Check Out
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => openInMaps(selectedVisit)}
                data-testid="button-get-directions"
              >
                <Route className="h-4 w-4 mr-2" />
                Directions
              </Button>
            </div>

            {/* Nearby Visits */}
            {(() => {
              const nearby = getNearbyVisits(selectedVisit);
              return nearby.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2">Nearby Visits</h5>
                  <div className="space-y-2">
                    {nearby.map(({ visit, distance }) => (
                      <div 
                        key={visit.id} 
                        className="flex items-center justify-between p-2 bg-muted rounded cursor-pointer hover:bg-muted/80"
                        onClick={() => setSelectedVisit(visit)}
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {visit.lead?.firstName} {visit.lead?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {distance.toFixed(1)}km away
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {visit.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Visit List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visitsWithCoordinates.map((visit) => {
          const StatusIcon = getStatusIcon(visit.status);
          
          return (
            <Card 
              key={visit.id} 
              className={`cursor-pointer transition-all ${
                selectedVisit?.id === visit.id ? 'ring-2 ring-primary' : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedVisit(visit)}
              data-testid={`visit-card-${visit.visitNumber}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-sm">{visit.visitNumber}</h4>
                    <p className="text-xs text-muted-foreground">
                      {visit.lead?.firstName} {visit.lead?.lastName}
                    </p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className="flex items-center space-x-1"
                    style={{ color: getStatusColor(visit.status) }}
                  >
                    <StatusIcon className="h-3 w-3" />
                    <span className="capitalize text-xs">{visit.status.replace('_', ' ')}</span>
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground mb-2">
                  {visit.visitAddress}
                  {visit.visitCity && `, ${visit.visitCity}`}
                </p>
                
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>GPS</span>
                  </div>
                  {currentLocation && visit.latitude && visit.longitude && (
                    <div className="flex items-center space-x-1">
                      <Route className="h-3 w-3" />
                      <span>
                        {calculateDistance(
                          currentLocation.latitude,
                          currentLocation.longitude,
                          parseFloat(visit.latitude),
                          parseFloat(visit.longitude)
                        ).toFixed(1)}km
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* No GPS Data Alert */}
      {visits.length > visitsWithCoordinates.length && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {visits.length - visitsWithCoordinates.length} visit(s) don't have GPS coordinates and won't appear on the map.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}