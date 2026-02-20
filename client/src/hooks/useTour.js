import { useCallback, useEffect } from "react";
import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";
import { useTourStatus } from "@/contexts/TourContext";
import { useLocation } from "wouter";

export function useTour() {
  const { updateTourStatus, getTourStatus, getPendingNavigationTour, clearPendingNavigationTour, setPendingNavigationTour } = useTourStatus();
  const [location, setLocation] = useLocation();

  const startTour = useCallback(
    (tourConfig) => {
      if (!tourConfig || !tourConfig.steps || tourConfig.steps.length === 0) {
        console.warn("Invalid tour configuration provided");
        return;
      }

      // Close any existing tours
      if (window.currentTour) {
        try {
          window.currentTour.complete();
        } catch (e) {
          console.warn('Error completing existing tour:', e);
          // Force cleanup
          window.currentTour = null;
          cleanupShepherdUI();
        }
      }

      const isMobile =
        window.innerWidth < 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      const tour = new Shepherd.Tour({
        useModalOverlay: true,
        modalOverlayOpeningPadding: 10,
        modalOverlayOpeningRadius: 5,
        defaultStepOptions: {
          classes: "shepherd-theme-custom",
          scrollTo: { 
            behavior: 'auto', 
            block: 'center',
            align: 'nearest'
          },
          cancelIcon: {
            enabled: true,
          },
          popperOptions: {
            modifiers: [
              {
                name: "offset",
                options: {
                  offset: [0, isMobile ? 20 : 15],
                },
              },
              {
                name: "preventOverflow",
                options: {
                  boundary: "viewport",
                  padding: 20,
                  altBoundary: true,
                },
              },
              {
                name: "flip",
                options: {
                  fallbackPlacements: ["top", "bottom", "left", "right", "top-start", "bottom-start", "top-end", "bottom-end"],
                  boundary: "viewport",
                  padding: 10,
                },
              },
              {
                name: "arrow",
                options: {
                  element: ".shepherd-arrow",
                  padding: 10,
                },
              },
              {
                name: "computeStyles",
                options: {
                  gpuAcceleration: false,
                },
              },
            ],
          },
        },
      });

      const steps = tourConfig.steps.map((step, index) => {
        const isLastStep = index === tourConfig.steps.length - 1;
        const isLastStepWithoutNavigation = isLastStep && !step.navigation;
        const nextStep = tourConfig.steps[index + 1];
        const hasNavigation = step.navigation || (nextStep && nextStep.element);

        const stepConfig = {
          id: `step-${tourConfig.name}-${index}`,
          title: step.title,
          text: step.text,
          attachTo: {
            element: step.element,
            on: step.position || "bottom",
          },
          buttons: [
            {
              text: index === 0 ? "Start" : "Back",
              action: index === 0 ? () => tour.next() : () => tour.back(),
              classes: "shepherd-button-secondary",
            },
            {
              text: isLastStepWithoutNavigation ? "Finish" : "Next",
              action: () => {
                if (isLastStepWithoutNavigation) {
                  tour.complete();
                } else if (step.navigation) {
                  // Navigation to next page - don't complete the tour yet
                  // The pending tour logic will handle showing the next step
                  setPendingNavigationTour({
                    path: step.navigation.path,
                    config: step.navigation.tourConfig || tourConfig,
                  });
                  // Hide current modal before navigation
                  const currentModal = document.querySelector('.shepherd-element');
                  if (currentModal) {
                    currentModal.style.display = 'none';
                  }
                  setLocation(step.navigation.path);
                  // Don't complete the tour - let the pending tour logic handle it
                } else {
                  tour.next();
                }
              },
              classes: "shepherd-button-primary",
            },
          ],
          beforeShowPromise: function() {
            return new Promise((resolve) => {
              // If this step has navigation, execute it first
              if (step.navigation && location !== step.navigation.path) {
                console.log(`Navigating to ${step.navigation.path} for tour step`);

                // Hide the current modal temporarily during navigation to prevent flickering
                const currentModal = document.querySelector('.shepherd-element');
                if (currentModal) {
                  currentModal.style.opacity = '0';
                  currentModal.style.pointerEvents = 'none';
                }

                setLocation(step.navigation.path);

                // Wait for navigation to complete and page to be ready
                let navigationAttempts = 0;
                const maxNavigationAttempts = 100; // 10 seconds max

                const checkNavigation = setInterval(() => {
                  navigationAttempts++;

                  // Check if we've navigated to the correct path
                  if (window.location.pathname === step.navigation.path || navigationAttempts >= maxNavigationAttempts) {
                    clearInterval(checkNavigation);

                    if (navigationAttempts >= maxNavigationAttempts) {
                      console.warn(`Navigation to ${step.navigation.path} timed out`);
                    }

                    // Give extra time for the page to render after navigation
                    setTimeout(() => {
                      // Restore modal visibility
                      if (currentModal) {
                        currentModal.style.opacity = '1';
                        currentModal.style.pointerEvents = 'auto';
                      }
                      waitForElement(step.element, resolve);
                    }, 500);
                  }
                }, 100);
              } else {
                // Just wait for element to appear
                waitForElement(step.element, resolve);
              }
            });
          },
        };

        return stepConfig;
      });

      // Add steps to tour
      steps.forEach((step) => {
        tour.addStep(step);
      });

      // Handle tour completion
      tour.on("complete", () => {
        console.log(`Tour ${tourConfig.name} completed`);
        updateTourStatus(tourConfig.name, true);
        cleanupTour();
      });

      tour.on("cancel", () => {
        console.log(`Tour ${tourConfig.name} cancelled`);
        cleanupTour();
      });

      // Start the tour
      window.currentTour = tour;
      tour.start();

      console.log(`Starting tour: ${tourConfig.name}`);
    },
    [updateTourStatus, location, setLocation, setPendingNavigationTour]
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
      console.log(`Continuing tour for path: ${location}`);

      // Wait for page to be fully loaded and elements to be ready
      const continueTour = () => {
        // Double-check we're still on the right page
        if (location === pendingTour.path && getPendingNavigationTour()) {
          // Add a small delay to ensure DOM is fully updated
          setTimeout(() => {
            // Instead of starting a new tour, continue with the existing one
            if (window.currentTour) {
              // Show the modal again
              const modal = document.querySelector('.shepherd-element');
              if (modal) {
                modal.style.display = 'block';
                modal.style.opacity = '1';
                modal.style.pointerEvents = 'auto';
              }
              // The tour should automatically show the next step
              window.currentTour.next();
            } else {
              // Fallback: start a new tour if no current tour exists
              startTour(pendingTour.config);
            }
            clearPendingNavigationTour();
          }, 300);
        }
      };

      // Use multiple readiness checks
      const checkPageReady = () => {
        if (document.readyState === 'complete') {
          // Check if the main content area is loaded
          const mainContent = document.querySelector('main') || document.body;
          if (mainContent) {
            continueTour();
          } else {
            // Wait a bit more for content to load
            setTimeout(continueTour, 500);
          }
        }
      };

      if (document.readyState === 'complete') {
        checkPageReady();
      } else {
        window.addEventListener('load', checkPageReady, { once: true });
      }

      // Fallback timeout - increased for more complex pages
      const fallbackTimeout = setTimeout(() => {
        const currentPendingTour = getPendingNavigationTour();
        if (currentPendingTour && location === currentPendingTour.path) {
          console.log('Using fallback timeout for pending tour');
          continueTour();
        }
      }, 2000);

      return () => clearTimeout(fallbackTimeout);
    }
  }, [location, getPendingNavigationTour, clearPendingNavigationTour, startTour]);

  return {
    startTour,
    completeTour,
    getTourStatus,
  };
}

function cleanupShepherdUI() {
  try {
    document.documentElement.classList.remove("shepherd-active");
    document.body.classList.remove("shepherd-active");
    document.documentElement.style.position = "";
    document.documentElement.style.width = "";
    document.documentElement.style.height = "";
    document.body.style.position = "";
    document.body.style.width = "";
    document.body.style.height = "";
    
    const shepherdElements = document.querySelectorAll(
      '.shepherd-modal-overlay-container, .shepherd-element, .shepherd-popup'
    );
    shepherdElements.forEach(el => {
      try {
        el.remove();
      } catch (e) {
        console.warn('Error removing shepherd element:', e);
      }
    });
  } catch (e) {
    console.warn('Error cleaning up Shepherd UI:', e);
  }
}

function cleanupTour() {
  window.currentTour = null;
  cleanupShepherdUI();
}

function waitForElement(selector, resolve, maxAttempts = 25) {
  let attempts = 0;

  const checkElement = setInterval(() => {
    attempts++;
    const element = document.querySelector(selector);

    if (element && isElementReady(element)) {
      clearInterval(checkElement);
      requestAnimationFrame(() => {
        element.style.visibility = 'visible';
        resolve();
      });
      return;
    } else if (attempts >= maxAttempts) {
      clearInterval(checkElement);
      console.warn(`Element ${selector} not found after ${maxAttempts * 40}ms, proceeding anyway`);
      resolve();
    }
  }, 40);
}

function isElementReady(element) {
  // Check if element exists
  if (!element) return false;

  // Check if element is in DOM
  if (!document.contains(element)) return false;

  // Check computed style visibility
  const computedStyle = window.getComputedStyle(element);
  if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || computedStyle.opacity === '0') {
    return false;
  }

  // Check if element has dimensions
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    return false;
  }

  // Check if element is positioned (has offsetParent or is positioned)
  if (element.offsetParent === null && computedStyle.position === 'static') {
    return false;
  }

  // Additional check: ensure parent elements are also visible
  let parent = element.parentElement;
  while (parent) {
    const parentStyle = window.getComputedStyle(parent);
    if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') {
      return false;
    }
    parent = parent.parentElement;
  }

  return true;
}
