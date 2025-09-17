/**
 * GPS Validation Utilities for Attendance System
 * Provides server-side validation for GPS coordinates with accuracy thresholds,
 * geofence validation, and anti-spoofing measures
 */

interface GPSValidationOptions {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

interface GPSValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

interface GeofenceArea {
  name: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
}

// Configuration constants
const GPS_VALIDATION_CONFIG = {
  // Accuracy thresholds
  MAX_ACCURACY_METERS: 200, // Reject if accuracy is worse than 200m
  WARNING_ACCURACY_METERS: 50, // Warning if accuracy is worse than 50m
  
  // Coordinate validation
  MIN_LATITUDE: -90,
  MAX_LATITUDE: 90,
  MIN_LONGITUDE: -180,
  MAX_LONGITUDE: 180,
  
  // Anti-spoofing measures
  MAX_TIMESTAMP_DRIFT_MS: 5 * 60 * 1000, // 5 minutes
  SUSPICIOUS_ACCURACY_THRESHOLD: 1, // Extremely high accuracy is suspicious
  
  // Rate limiting (prevent rapid location changes)
  MIN_TIME_BETWEEN_UPDATES_MS: 10 * 1000, // 10 seconds
  MAX_SPEED_KMH: 200, // Maximum reasonable speed (car/train)
};

// Example geofence areas (could be loaded from database)
const GEOFENCE_AREAS: GeofenceArea[] = [
  {
    name: "Main Office",
    centerLat: 28.6139, // Example coordinates for Delhi
    centerLng: 77.2090,
    radiusMeters: 1000,
  },
  {
    name: "Warehouse District",
    centerLat: 28.5355,
    centerLng: 77.3910,
    radiusMeters: 2000,
  },
];

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

/**
 * Calculate speed between two GPS points
 */
function calculateSpeed(
  lat1: number, lng1: number, timestamp1: number,
  lat2: number, lng2: number, timestamp2: number
): number {
  const distance = calculateDistance(lat1, lng1, lat2, lng2);
  const timeMs = Math.abs(timestamp2 - timestamp1);
  const timeHours = timeMs / (1000 * 60 * 60);
  const speedKmh = (distance / 1000) / timeHours;
  
  return speedKmh;
}

/**
 * Check if coordinates are within any defined geofence
 */
function isWithinGeofence(latitude: number, longitude: number): {
  isInside: boolean;
  area?: GeofenceArea;
} {
  for (const area of GEOFENCE_AREAS) {
    const distance = calculateDistance(latitude, longitude, area.centerLat, area.centerLng);
    if (distance <= area.radiusMeters) {
      return { isInside: true, area };
    }
  }
  return { isInside: false };
}

/**
 * Validate GPS coordinates with anti-spoofing measures
 */
export function validateGPSCoordinates(options: GPSValidationOptions): GPSValidationResult {
  const { latitude, longitude, accuracy, timestamp } = options;
  const errors: string[] = [];
  const warnings: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';

  // Basic coordinate validation
  if (latitude < GPS_VALIDATION_CONFIG.MIN_LATITUDE || latitude > GPS_VALIDATION_CONFIG.MAX_LATITUDE) {
    errors.push(`Invalid latitude: ${latitude}. Must be between -90 and 90.`);
  }

  if (longitude < GPS_VALIDATION_CONFIG.MIN_LONGITUDE || longitude > GPS_VALIDATION_CONFIG.MAX_LONGITUDE) {
    errors.push(`Invalid longitude: ${longitude}. Must be between -180 and 180.`);
  }

  // Accuracy validation
  if (accuracy !== undefined) {
    if (accuracy > GPS_VALIDATION_CONFIG.MAX_ACCURACY_METERS) {
      errors.push(`GPS accuracy too poor: ${accuracy}m. Maximum allowed: ${GPS_VALIDATION_CONFIG.MAX_ACCURACY_METERS}m.`);
      riskLevel = 'high';
    } else if (accuracy > GPS_VALIDATION_CONFIG.WARNING_ACCURACY_METERS) {
      warnings.push(`GPS accuracy is poor: ${accuracy}m. Recommended: less than ${GPS_VALIDATION_CONFIG.WARNING_ACCURACY_METERS}m.`);
      riskLevel = 'medium';
    } else if (accuracy < GPS_VALIDATION_CONFIG.SUSPICIOUS_ACCURACY_THRESHOLD) {
      warnings.push(`Suspiciously high GPS accuracy: ${accuracy}m. This may indicate spoofed location.`);
      riskLevel = 'medium';
    }
  }

  // Timestamp validation (anti-spoofing)
  if (timestamp !== undefined) {
    const now = Date.now();
    const timeDrift = Math.abs(now - timestamp);
    
    if (timeDrift > GPS_VALIDATION_CONFIG.MAX_TIMESTAMP_DRIFT_MS) {
      warnings.push(`GPS timestamp drift detected: ${Math.round(timeDrift / 1000)}s. This may indicate spoofed location.`);
      riskLevel = riskLevel === 'high' ? 'high' : 'medium';
    }
  }

  // Check for impossible coordinates (null island, etc.)
  if (latitude === 0 && longitude === 0) {
    errors.push('Invalid coordinates: (0, 0) - "Null Island" is not a valid location.');
    riskLevel = 'high';
  }

  // Geofence validation (optional - could be disabled if not needed)
  const geofenceCheck = isWithinGeofence(latitude, longitude);
  if (!geofenceCheck.isInside) {
    warnings.push('Location is outside defined work areas. Please ensure you are at an authorized location.');
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    warnings,
    riskLevel,
  };
}

/**
 * Validate GPS movement between two points (anti-spoofing)
 */
export function validateGPSMovement(
  prevLat: number, prevLng: number, prevTimestamp: number,
  newLat: number, newLng: number, newTimestamp: number
): GPSValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';

  // Check minimum time between updates
  const timeDiff = newTimestamp - prevTimestamp;
  if (timeDiff < GPS_VALIDATION_CONFIG.MIN_TIME_BETWEEN_UPDATES_MS) {
    warnings.push(`GPS updates too frequent: ${Math.round(timeDiff / 1000)}s. Minimum interval: ${GPS_VALIDATION_CONFIG.MIN_TIME_BETWEEN_UPDATES_MS / 1000}s.`);
    riskLevel = 'medium';
  }

  // Check for impossible speed
  const speed = calculateSpeed(prevLat, prevLng, prevTimestamp, newLat, newLng, newTimestamp);
  if (speed > GPS_VALIDATION_CONFIG.MAX_SPEED_KMH) {
    errors.push(`Impossible movement speed detected: ${Math.round(speed)}km/h. Maximum allowed: ${GPS_VALIDATION_CONFIG.MAX_SPEED_KMH}km/h.`);
    riskLevel = 'high';
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    warnings,
    riskLevel,
  };
}

/**
 * Get GPS validation configuration (for frontend reference)
 */
export function getGPSValidationConfig() {
  return {
    maxAccuracyMeters: GPS_VALIDATION_CONFIG.MAX_ACCURACY_METERS,
    warningAccuracyMeters: GPS_VALIDATION_CONFIG.WARNING_ACCURACY_METERS,
    maxTimestampDriftMs: GPS_VALIDATION_CONFIG.MAX_TIMESTAMP_DRIFT_MS,
    minTimeBetweenUpdatesMs: GPS_VALIDATION_CONFIG.MIN_TIME_BETWEEN_UPDATES_MS,
    maxSpeedKmh: GPS_VALIDATION_CONFIG.MAX_SPEED_KMH,
  };
}