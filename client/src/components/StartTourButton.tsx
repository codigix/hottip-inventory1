import React, { useEffect, useRef } from "react";
import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";
import { Play } from "lucide-react";
import { useTourStatus } from "@/contexts/TourContext";

interface StartTourButtonProps {
  tourConfig: any;
  tourName: string;
  navigationHandler?: (config: any) => void;
  onTourStart?: () => void;
  onTourComplete?: () => void;
}

export function StartTourButton({
  tourConfig,
  tourName,
  navigationHandler,
  onTourStart,
  onTourComplete,
}: StartTourButtonProps) {
  const tourRef = useRef<Shepherd.Tour | null>(null);
  const { updateTourStatus, getTourStatus, updateTourProgress, getTourProgress } = useTourStatus();

  useEffect(() => {
    return () => {
      if (tourRef.current) {
        tourRef.current.complete();
      }
    };
  }, []);

  const startTour = async () => {
    if (tourRef.current) {
      tourRef.current.complete();
    }

    // Call onTourStart callback
    onTourStart?.();

    // Initialize progress tracking
    updateTourProgress(tourName, 0, tourConfig.steps.length);

    // Create new tour instance
    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: "shepherd-theme-custom",
        scrollTo: { behavior: "smooth", block: "center" },
        cancelIcon: {
          enabled: true,
        },
        buttons: [
          {
            text: "Skip Tour",
            action: () => tour.complete(),
            classes: "shepherd-button-secondary",
          },
          {
            text: "Next",
            action: () => tour.next(),
            classes: "shepherd-button-primary",
          },
        ],
      },
      steps: tourConfig.steps.map((step: any, index: number) => ({
        ...step,
        when: {
          show: () => {
            // Handle navigation if specified
            if (step.navigation && navigationHandler) {
              // Use the delay from the step's when.show if it exists, otherwise default delay
              const delay = step.when?.show ? 2000 : 500;
              setTimeout(() => {
                navigationHandler(step.navigation);
              }, delay);
            }
            // Call step's original when.show if it exists
            if (step.when?.show && typeof step.when.show === 'function') {
              return step.when.show();
            }
          },
        },
        buttons: index === tourConfig.steps.length - 1
          ? [
              {
                text: "Finish Tour",
                action: () => {
                  tour.complete();
                  updateTourStatus(tourName, true);
                  onTourComplete?.();
                },
                classes: "shepherd-button-primary",
              },
            ]
          : [
              {
                text: "Skip Tour",
                action: () => {
                  tour.complete();
                  onTourComplete?.();
                },
                classes: "shepherd-button-secondary",
              },
              {
                text: "Next",
                action: () => tour.next(),
                classes: "shepherd-button-primary",
              },
            ],
      })),
    });

    tourRef.current = tour;

    // Add custom CSS for better styling
    const style = document.createElement("style");
    style.textContent = `
      .shepherd-theme-custom .shepherd-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 8px 8px 0 0;
      }
      .shepherd-theme-custom .shepherd-title {
        font-weight: 600;
        font-size: 18px;
      }
      .shepherd-theme-custom .shepherd-text {
        font-size: 14px;
        line-height: 1.5;
        color: #374151;
      }
      .shepherd-theme-custom .shepherd-button-primary {
        background: #667eea !important;
        border: none !important;
        border-radius: 6px !important;
        font-weight: 500 !important;
      }
      .shepherd-theme-custom .shepherd-button-primary:hover {
        background: #5a67d8 !important;
      }
      .shepherd-theme-custom .shepherd-button-secondary {
        background: #f3f4f6 !important;
        color: #374151 !important;
        border: 1px solid #d1d5db !important;
        border-radius: 6px !important;
        font-weight: 500 !important;
      }
      .shepherd-theme-custom .shepherd-button-secondary:hover {
        background: #e5e7eb !important;
      }
      .shepherd-theme-custom .shepherd-content {
        border-radius: 8px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }
      .shepherd-theme-custom .shepherd-arrow::before {
        border-color: #667eea;
      }
    `;
    document.head.appendChild(style);

    // Add progress tracking for step changes
    tour.on("show", () => {
      const currentStep = tour.steps.indexOf(tour.currentStep) + 1;
      updateTourProgress(tourName, currentStep, tourConfig.steps.length);
    });

    // Start the tour
    try {
      await tour.start();
    } catch (error) {
      console.error("Tour failed to start:", error);
    }

    // Clean up style when tour ends
    tour.on("complete", () => {
      document.head.removeChild(style);
      updateTourStatus(tourName, true);
      onTourComplete?.();
    });

    tour.on("cancel", () => {
      document.head.removeChild(style);
      onTourComplete?.();
    });
  };

  const isCompleted = getTourStatus(tourName);
  const progress = getTourProgress(tourName);

  return (
    <div className="flex flex-col items-end gap-2">
      {progress.totalSteps > 0 && !isCompleted && (
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span>Tour Progress:</span>
          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <span>{progress.currentStep}/{progress.totalSteps}</span>
        </div>
      )}
      <button
        onClick={startTour}
        className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
          isCompleted
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : "bg-indigo-600 text-white hover:bg-indigo-700"
        }`}
        title={isCompleted ? "Tour completed - Click to restart" : "Start system tour"}
      >
        <Play className="w-4 h-4" />
        {isCompleted ? "Restart Tour" : "Start Tour"}
      </button>
    </div>
  );
}