import { useCallback, useEffect } from "react";
import Shepherd from "shepherd.js";
import { useTourStatus } from "@/contexts/TourContext";
import { useLocation } from "wouter";

export function useTour() {
  const { updateTourStatus, getTourStatus, getPendingNavigationTour, clearPendingNavigationTour } = useTourStatus();
  const [location] = useLocation();

  const startTour = useCallback(
    (tourConfig, navigationHandler = null) => {
      if (!tourConfig || !tourConfig.steps || tourConfig.steps.length === 0) {
        console.warn("Invalid tour configuration provided");
        return;
      }

      // Close any existing tours
      if (window.currentTour) {
        window.currentTour.complete();
      }

      const isMobile =
        window.innerWidth < 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
          classes: "shepherd-theme-custom",
          scrollTo: false,
          cancelIcon: {
            enabled: true,
          },
          popperOptions: {
            modifiers: [
              {
                name: "offset",
                options: {
                  offset: [0, isMobile ? 15 : 10],
                },
              },
            ],
          },
        },
      });

      const steps = tourConfig.steps.map((step, index) => {
        const stepConfig = {
          id: `step-${index}`,
          title: step.title,
          text: step.text,
          attachTo: {
            element: step.element,
            on: step.position || "bottom",
          },
          buttons: [
            {
              text: index === 0 ? "Start" : "Back",
              action: index === 0 ? tour.next : tour.back,
              classes: index === 0 ? "shepherd-button-primary" : "shepherd-button-secondary",
            },
            {
              text: index === tourConfig.steps.length - 1 ? "Finish" : "Next",
              action: index === tourConfig.steps.length - 1 ? tour.complete : tour.next,
              classes: "shepherd-button-primary",
            },
          ],
          beforeShowPromise: function() {
            return new Promise((resolve) => {
              const element = document.querySelector(step.element);
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
              }
              
              if (step.beforeShowPromise) {
                step.beforeShowPromise().then(resolve);
              } else {
                setTimeout(resolve, 300);
              }
            });
          },
        };

        if (step.navigation && navigationHandler) {
          const originalNextAction = stepConfig.buttons[1].action;
          stepConfig.buttons[1].action = () => {
            if (index === tourConfig.steps.length - 1) {
              originalNextAction();
            } else {
              navigationHandler(step.navigation);
            }
          };
        }

        return stepConfig;
      });

      // Add steps to tour
      steps.forEach((step) => {
        tour.addStep(step);
      });

      // Handle tour completion
      tour.on("complete", () => {
        updateTourStatus(tourConfig.name, true);
        window.currentTour = null;
        document.documentElement.style.position = "";
        document.documentElement.style.width = "";
        document.documentElement.style.height = "";
        document.body.style.position = "";
        document.body.style.width = "";
        document.body.style.height = "";
      });

      tour.on("cancel", () => {
        window.currentTour = null;
        document.documentElement.style.position = "";
        document.documentElement.style.width = "";
        document.documentElement.style.height = "";
        document.body.style.position = "";
        document.body.style.width = "";
        document.body.style.height = "";
      });

      // Start the tour
      window.currentTour = tour;
      tour.start();

      console.log(`Starting tour: ${tourConfig.name}`);
    },
    [updateTourStatus]
  );

  const completeTour = useCallback(
    (tourName) => {
      if (window.currentTour) {
        window.currentTour.complete();
      }
      updateTourStatus(tourName, true);
    },
    [updateTourStatus]
  );

  useEffect(() => {
    const pendingTour = getPendingNavigationTour();
    if (pendingTour && location === pendingTour.path) {
      // Restore scroll lock when arriving at new page during tour
      document.documentElement.classList.add("shepherd-active");
      document.body.classList.add("shepherd-active");
      
      setTimeout(() => {
        startTour(pendingTour.config);
        clearPendingNavigationTour();
      }, 150);
    }
  }, [location, getPendingNavigationTour, clearPendingNavigationTour, startTour]);

  return {
    startTour,
    completeTour,
    getTourStatus,
  };
}
