import { ReactNode } from 'react';

export interface TourProviderProps {
  children: ReactNode;
}

export interface TourContextType {
  tourStatuses: Record<string, boolean>;
  setTourStatuses: (statuses: Record<string, boolean>) => void;
  updateTourStatus: (tourName: string, completed: boolean) => void;
  resetTourStatus: (tourName: string) => void;
  getTourStatus: (tourName: string) => boolean;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function TourProvider({ children }: TourProviderProps): JSX.Element;
export function useTourStatus(): TourContextType;