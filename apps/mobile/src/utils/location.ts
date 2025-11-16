import * as Location from "expo-location";

export type Coordinates = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
};

export async function fetchCurrentLocation(): Promise<Coordinates | null> {
  try {
    const lastKnown = await Location.getLastKnownPositionAsync();
    if (lastKnown) {
      return {
        latitude: lastKnown.coords.latitude,
        longitude: lastKnown.coords.longitude,
        accuracy: lastKnown.coords.accuracy,
      };
    }

    const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
    return {
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
      accuracy: current.coords.accuracy,
    };
  } catch (error) {
    console.warn("Location unavailable", error);
    return null;
  }
}
