import { useState, useCallback, RefObject } from "react";

interface Marker {
  id: number;
  timestamp: number;
  content: string;
  type: string;
  data: Record<string, any>;
}

export const useVideoMarkers = (videoRef: RefObject<HTMLVideoElement>) => {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);

  const addMarker = useCallback(
    (content = "New interaction point", type = "text") => {
      if (videoRef.current) {
        const newMarker: Marker = {
          id: Date.now(),
          timestamp: videoRef.current.currentTime,
          content,
          type,
          data: {},
        };
        setMarkers((prev) =>
          [...prev, newMarker].sort((a, b) => a.timestamp - b.timestamp)
        );
      }
    },
    [videoRef]
  );

  const updateMarker = useCallback(
    (markerId: number, updates: Partial<Marker>) => {
      setMarkers((prev) =>
        prev.map((marker) =>
          marker.id === markerId ? { ...marker, ...updates } : marker
        )
      );
    },
    []
  );

  const deleteMarker = useCallback(
    (markerId: number) => {
      setMarkers((prev) => prev.filter((marker) => marker.id !== markerId));
      if (selectedMarker?.id === markerId) {
        setSelectedMarker(null);
      }
    },
    [selectedMarker]
  );

  const handleTimeUpdate = useCallback(
    (currentTime: number) => {
      // Find any markers that should trigger at the current timestamp
      const activeMarker = markers.find(
        (marker) =>
          Math.abs(marker.timestamp - currentTime) < 0.5 &&
          marker.id !== selectedMarker?.id
      );

      if (activeMarker) {
        setSelectedMarker(activeMarker);
        return true; // Indicates video should pause
      }
      return false;
    },
    [markers, selectedMarker]
  );

  return {
    markers,
    selectedMarker,
    setSelectedMarker,
    addMarker,
    updateMarker,
    deleteMarker,
    handleTimeUpdate,
  };
};
