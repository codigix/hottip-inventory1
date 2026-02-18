import React, { useEffect, useRef, useState } from "react";
import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";
import { Play, Sparkles, ChevronRight, Check, ArrowLeft } from "lucide-react";
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
  const [isHovering, setIsHovering] = useState(false);
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

    onTourStart?.();
    updateTourProgress(tourName, 0, tourConfig.steps.length);

    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: "shepherd-theme-clean",
        scrollTo: false,
        cancelIcon: {
          enabled: true,
        },
        buttons: [
          {
            text: "Back",
            action: () => tour.back(),
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
        beforeShowPromise: () => {
          return new Promise((resolve) => {
            if (step.element) {
              const selector = step.element;
              const startTime = Date.now();
              const checkElement = () => {
                const element = document.querySelector(selector);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  setTimeout(() => {
                    if (step.navigation && navigationHandler) {
                      setTimeout(() => {
                        navigationHandler(step.navigation);
                      }, 2000);
                    }
                    resolve();
                  }, 600);
                } else if (Date.now() - startTime < 5000) {
                  setTimeout(checkElement, 100);
                } else {
                  resolve();
                }
              };
              checkElement();
            } else {
              resolve();
            }
          });
        },
        buttons: index === tourConfig.steps.length - 1 && !step.navigation
          ? [
              {
                text: "Back",
                action: () => tour.back(),
                classes: "shepherd-button-secondary",
              },
              {
                text: "Done",
                action: () => {
                  tour.complete();
                  updateTourStatus(tourName, true);
                  onTourComplete?.();
                },
                classes: "shepherd-button-primary",
              },
            ]
          : index === 0
          ? [
              {
                text: "Exit",
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
            ]
          : [
              {
                text: "Back",
                action: () => tour.back(),
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

    const style = document.createElement("style");
    style.textContent = `
      /* Modern Shepherd Theme */
      .shepherd-theme-clean .shepherd-content {
        background: #ffffff;
        border-radius: 12px;
        padding: 0;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.1);
        border: none;
        overflow: hidden;
        max-width: 450px;
      }

      .shepherd-theme-clean .shepherd-header {
        background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
        padding: 24px 28px;
        border-bottom: none;
        border-radius: 0;
      }

      .shepherd-theme-clean .shepherd-title {
        font-size: 20px;
        font-weight: 700;
        color: #ffffff;
        margin: 0;
        line-height: 1.3;
        letter-spacing: -0.4px;
      }

      .shepherd-theme-clean .shepherd-text {
        font-size: 15px;
        font-weight: 400;
        color: #4b5563;
        line-height: 1.7;
        margin: 0;
        padding: 24px 28px;
      }

      .shepherd-theme-clean .shepherd-footer {
        background: #ffffff;
        padding: 20px 28px 24px 28px;
        display: flex;
        gap: 12px;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid #f0f0f0;
        border-radius: 0 0 12px 12px;
      }

      .shepherd-theme-clean .shepherd-button {
        font-size: 13px;
        font-weight: 600;
        padding: 10px 24px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.25s ease;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        flex: 1;
        text-align: center;
      }

      .shepherd-theme-clean .shepherd-button-secondary {
        background: #e8e8e8;
        color: #4b5563;
        border: none;
      }

      .shepherd-theme-clean .shepherd-button-secondary:hover {
        background: #ddd;
      }

      .shepherd-theme-clean .shepherd-button-secondary:active {
        background: #d0d0d0;
      }

      .shepherd-theme-clean .shepherd-button-primary {
        background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
        color: #ffffff;
        border: none;
      }

      .shepherd-theme-clean .shepherd-button-primary:hover {
        background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
      }

      .shepherd-theme-clean .shepherd-button-primary:active {
        transform: translateY(0);
      }

      .shepherd-theme-clean .shepherd-arrow::before {
        background: #ffffff;
        border-right-color: #ffffff;
        border-bottom-color: #ffffff;
        filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.15));
      }

      .shepherd-modal-overlay-container {
        background: rgba(0, 0, 0, 0.45);
      }

      .shepherd-element {
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.45);
        border-radius: 8px;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      .shepherd-theme-clean.shepherd-active .shepherd-content {
        animation: fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      }
    `;
    document.head.appendChild(style);

    tour.on("show", () => {
      const currentStep = tour.steps.indexOf(tour.currentStep) + 1;
      updateTourProgress(tourName, currentStep, tourConfig.steps.length);
    });

    try {
      await tour.start();
    } catch (error) {
      console.error("Tour failed to start:", error);
    }

    tour.on("complete", () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
      updateTourStatus(tourName, true);
      onTourComplete?.();
    });

    tour.on("cancel", () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
      onTourComplete?.();
    });
  };

  const isCompleted = getTourStatus(tourName);
  const progress = getTourProgress(tourName);
  const progressPercentage = progress.totalSteps > 0 ? progress.percentage : 0;

  return (
    <div className="flex flex-col items-end gap-3">
      {progress.totalSteps > 0 && !isCompleted && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg px-4 py-3 border border-cyan-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold text-blue-900">Tour Progress</p>
              <div className="w-32 h-2.5 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 transition-all duration-500 rounded-full shadow-lg"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
            <div className="text-sm font-bold text-cyan-700 whitespace-nowrap">
              {progress.currentStep}/{progress.totalSteps}
            </div>
          </div>
        </div>
      )}
      
      <button
        onClick={startTour}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={`inline-flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform ${
          isCompleted
            ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105"
            : "bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:scale-105"
        }`}
        title={isCompleted ? "Tour completed - Click to restart" : "Start interactive system tour"}
      >
        {isCompleted ? (
          <>
            <Check className="w-5 h-5" />
            <span>Tour Done</span>
          </>
        ) : (
          <>
            <Sparkles className={`w-5 h-5 transition-transform duration-300 ${isHovering ? 'rotate-12 scale-110' : ''}`} />
            <span>Start Tour</span>
            <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isHovering ? 'translate-x-1' : ''}`} />
          </>
        )}
      </button>
    </div>
  );
}
