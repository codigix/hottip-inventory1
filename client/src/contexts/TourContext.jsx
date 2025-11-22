import { createContext, useContext, useState, useEffect } from "react";

const TourContext = createContext(undefined);

export function TourProvider({ children }) {
  const [tourStatuses, setTourStatuses] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [pendingTour, setPendingTour] = useState(null);

  const updateTourStatus = (tourName, completed) => {
    setTourStatuses((prev) => ({
      ...prev,
      [tourName]: completed,
    }));
  };

  const resetTourStatus = (tourName) => {
    setTourStatuses((prev) => ({
      ...prev,
      [tourName]: false,
    }));
  };

  const getTourStatus = (tourName) => {
    return tourStatuses[tourName] || false;
  };

  const setPendingNavigationTour = (tourConfig) => {
    setPendingTour(tourConfig);
  };

  const getPendingNavigationTour = () => {
    return pendingTour;
  };

  const clearPendingNavigationTour = () => {
    setPendingTour(null);
  };

  const value = {
    tourStatuses,
    setTourStatuses,
    updateTourStatus,
    resetTourStatus,
    getTourStatus,
    isLoading,
    setIsLoading,
    pendingTour,
    setPendingNavigationTour,
    getPendingNavigationTour,
    clearPendingNavigationTour,
  };

  return (
    <TourContext.Provider value={value}>{children}</TourContext.Provider>
  );
}

export function useTourStatus() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTourStatus must be used within TourProvider");
  }
  return context;
}
