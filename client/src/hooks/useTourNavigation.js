import { useCallback } from "react";
import { useLocation } from "wouter";
import { useTourStatus } from "@/contexts/TourContext";

export function useTourNavigation(sidebarItems) {
  const [, setLocation] = useLocation();
  const { setPendingNavigationTour } = useTourStatus();

  const navigationHandler = useCallback(
    (navigationConfig) => {
      if (!navigationConfig || !navigationConfig.path) {
        console.warn("Invalid navigation configuration: missing path");
        return;
      }

      if (navigationConfig.tourConfig) {
        setPendingNavigationTour({
          path: navigationConfig.path,
          config: navigationConfig.tourConfig,
        });
      }

      setLocation(navigationConfig.path);
    },
    [setLocation, setPendingNavigationTour]
  );

  const getNavigationForElement = useCallback(
    (elementTourId) => {
      if (!elementTourId || !sidebarItems) {
        return null;
      }

      const item = sidebarItems.find(
        (sidebarItem) => `sales-${sidebarItem.id}` === elementTourId ||
          `inventory-${sidebarItem.id}` === elementTourId ||
          `accounts-${sidebarItem.id}` === elementTourId ||
          `marketing-${sidebarItem.id}` === elementTourId ||
          `logistics-${sidebarItem.id}` === elementTourId
      );

      if (!item || !item.tourConfig) {
        return null;
      }

      return {
        path: item.path,
        tourConfig: item.tourConfig,
      };
    },
    [sidebarItems]
  );

  return {
    navigationHandler,
    getNavigationForElement,
  };
}
