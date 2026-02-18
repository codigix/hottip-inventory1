import { createContext, useContext, useState } from "react";

const TourContext = createContext(undefined);

export function TourProvider({ children }) {
  const [tourStatuses, setTourStatuses] = useState({});
  const [tourProgress, setTourProgress] = useState({});
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

  const updateTourProgress = (tourName, currentStep, totalSteps) => {
    setTourProgress((prev) => ({
      ...prev,
      [tourName]: {
        currentStep,
        totalSteps,
        percentage: Math.round((currentStep / totalSteps) * 100),
      },
    }));
  };

  const getTourProgress = (tourName) => {
    return tourProgress[tourName] || { currentStep: 0, totalSteps: 0, percentage: 0 };
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
    tourProgress,
    updateTourProgress,
    getTourProgress,
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
