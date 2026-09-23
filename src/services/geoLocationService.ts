// Geo-Location & Geofence Perimeter Calculation Service
import { StorageEngine, STORAGE_KEYS } from '../database/storageEngine';
import { OfficeGeoLocation } from '../database/schema';

export class GeoLocationService {
  public static getAll(): OfficeGeoLocation[] {
    return StorageEngine.getList<OfficeGeoLocation>(STORAGE_KEYS.GEO_LOCATIONS);
  }

  public static getByBranch(branchId: string): OfficeGeoLocation | undefined {
    return this.getAll().find(g => g.branchId === branchId);
  }

  public static create(geo: Omit<OfficeGeoLocation, 'id'>): OfficeGeoLocation {
    const newGeo: OfficeGeoLocation = {
      ...geo,
      id: `geo-${Date.now()}`,
    };
    return StorageEngine.insert<OfficeGeoLocation>(STORAGE_KEYS.GEO_LOCATIONS, newGeo);
  }

  public static update(id: string, updates: Partial<OfficeGeoLocation>): OfficeGeoLocation | undefined {
    return StorageEngine.update<OfficeGeoLocation>(STORAGE_KEYS.GEO_LOCATIONS, id, updates);
  }

  /**
   * Calculates Haversine distance in meters between two lat/lng coordinates
   */
  public static calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Radius of the Earth in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  /**
   * Checks if user coordinate is within any authorized branch perimeter
   */
  public static verifyGeofence(userLat: number, userLng: number): {
    isAuthorized: boolean;
    nearestBranch?: OfficeGeoLocation;
    distanceMeters: number;
  } {
    const locations = this.getAll().filter(l => l.isActive);
    if (locations.length === 0) return { isAuthorized: true, distanceMeters: 0 };

    let nearest: OfficeGeoLocation = locations[0];
    let minDistance = Infinity;

    for (const loc of locations) {
      const dist = this.calculateDistanceMeters(userLat, userLng, loc.latitude, loc.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = loc;
      }
    }

    return {
      isAuthorized: minDistance <= nearest.radiusMeters,
      nearestBranch: nearest,
      distanceMeters: minDistance,
    };
  }
}
