import * as TaskManager from 'expo-task-manager';
import type * as Location from 'expo-location';
import {
  getActiveSessionSync,
  updateActiveSessionLocation,
} from '../db/database';
import { calculateDistanceKm } from '../utils/geo';

export const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';

export interface BackgroundLocationUpdateEvent {
  deltaKm: number;
  speedKmh: number;
  latitude: number;
  longitude: number;
}

type Listener = (event: BackgroundLocationUpdateEvent) => void;
const listeners = new Set<Listener>();

export const addBackgroundLocationListener = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const notifyBackgroundLocationListeners = (event: BackgroundLocationUpdateEvent) => {
  listeners.forEach((l) => {
    try {
      l(event);
    } catch (e) {
      console.warn('Listener error:', e);
    }
  });
};

// Define task at the top level outside React component lifecycle
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('Background location task received error:', error.message);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    if (!locations || locations.length === 0) return;

    try {
      const session = getActiveSessionSync();
      if (!session || session.is_tracking !== 1 || session.is_paused === 1) {
        return;
      }

      let currentLat = session.last_lat;
      let currentLon = session.last_lon;

      for (const loc of locations) {
        const { latitude, longitude, speed } = loc.coords;
        let deltaKm = 0;

        if (currentLat !== null && currentLon !== null) {
          const calc = calculateDistanceKm(currentLat, currentLon, latitude, longitude);
          // Filter stationary jitter (must be > 2.5 meters)
          if (calc >= 0.0025) {
            deltaKm = calc;
          }
        }

        currentLat = latitude;
        currentLon = longitude;

        const nowSec = Math.max(
          session.elapsed_seconds,
          Math.floor((Date.now() - session.start_time_ms) / 1000)
        );
        const speedKmh = speed && speed > 0 ? Math.round(speed * 3.6 * 10) / 10 : 0;

        updateActiveSessionLocation(latitude, longitude, speedKmh, deltaKm, nowSec);

        notifyBackgroundLocationListeners({
          deltaKm,
          speedKmh,
          latitude,
          longitude,
        });
      }
    } catch (taskErr) {
      console.error('Error handling background location tick:', taskErr);
    }
  }
});
