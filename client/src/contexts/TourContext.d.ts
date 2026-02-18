import { ReactNode } from 'react';

export interface TourProviderProps {
  children: ReactNode;
}

export interface PendingNavigationTour {
  path: string;
  config: any;
}

export interface TourProgress {
  currentStep: number;
  totalSteps: number;
  percentage: number;
}

export interface TourContextType {
  tourStatuses: Record<string, boolean>;
  setTourStatuses: (statuses: Record<string, boolean>) => void;
  updateTourStatus: (tourName: string, completed: boolean) => void;
  resetTourStatus: (tourName: string) => void;
  getTourStatus: (tourName: string) => boolean;
  tourProgress: Record<string, TourProgress>;
  updateTourProgress: (tourName: string, currentStep: number, totalSteps: number) => void;
  getTourProgress: (tourName: string) => TourProgress;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  pendingTour: PendingNavigationTour | null;
  setPendingNavigationTour: (tour: PendingNavigationTour) => void;
  getPendingNavigationTour: () => PendingNavigationTour | null;
  clearPendingNavigationTour: () => void;
}

export function TourProvider({ children }: TourProviderProps): JSX.Element;
export function useTourStatus(): TourContextType;
