// Mobile-Responsive Tour Configuration
// This file contains utilities and configurations for making tours work on mobile devices

import { isMobileDevice } from '@/utils/tourUtils';

/**
 * Get responsive tour configuration based on device type
 * @param {Object} desktopConfig - Desktop tour configuration
 * @returns {Object} Device-optimized tour configuration
 */
export const getResponsiveTourConfig = (desktopConfig) => {
  if (isMobileDevice()) {
    return getMobileTourConfig(desktopConfig);
  }
  return desktopConfig;
};

/**
 * Convert desktop tour to mobile-optimized version
 * Mobile tours have:
 * - Simplified button layouts (only Next and Skip)
 * - Larger touch targets
 * - Adjusted positioning to avoid screen edges
 * - Simplified text for small screens
 */
export const getMobileTourConfig = (desktopConfig) => {
  return {
    ...desktopConfig,
    options: {
      ...desktopConfig.options,
      useModalOverlay: true,
      highlightPadding: 20,
      scrollToHandler: (element) => {
        if (element) {
          const rect = element.getBoundingClientRect();
          const targetScroll = window.scrollY + rect.top - (window.innerHeight / 2 - rect.height / 2);
          window.scrollTo({ top: targetScroll, behavior: 'smooth' });
        }
      },
    },
    steps: desktopConfig.steps.map((step, index) => ({
      ...step,
      // Simplify buttons for mobile
      buttons: getMobileButtons(index, desktopConfig.steps.length),
      // Adjust positioning for mobile screens
      attachTo: {
        ...step.attachTo,
        on: getMobileAttachmentPosition(step.attachTo?.on),
      },
      // Make text more concise for mobile
      title: step.title || '',
      text: truncateTextForMobile(step.text),
      // Add more padding for touch-friendly experience
      advanceOn: step.advanceOn || { selector: null, event: null },
      scrollTo: true,
    })),
  };
};

/**
 * Get mobile-optimized buttons
 * Mobile uses simplified button layout with larger touch targets
 */
export const getMobileButtons = (stepIndex, totalSteps) => {
  const buttons = [];

  // Back button (show from step 2 onwards)
  if (stepIndex > 0) {
    buttons.push({
      text: '← Back',
      classes: 'shepherd-button-secondary mobile-button',
      action() {
        return this.back();
      },
    });
  }

  // Next/Finish button
  if (stepIndex < totalSteps - 1) {
    buttons.push({
      text: 'Next →',
      classes: 'shepherd-button-primary mobile-button',
      action() {
        return this.next();
      },
    });
  } else {
    buttons.push({
      text: 'Complete',
      classes: 'shepherd-button-primary mobile-button',
      action() {
        return this.complete();
      },
    });
  }

  // Skip button on first few steps
  if (stepIndex < 2) {
    buttons.push({
      text: 'Skip',
      classes: 'shepherd-button-secondary mobile-button',
      action() {
        return this.cancel();
      },
    });
  }

  return buttons;
};

/**
 * Adjust attachment position for mobile screens
 * Mobile has limited screen space, so we prioritize top/bottom over left/right
 */
export const getMobileAttachmentPosition = (desktopPosition) => {
  const mobileFriendlyPositions = {
    left: 'bottom',
    right: 'bottom',
    top: 'bottom',
    bottom: 'bottom',
  };

  return mobileFriendlyPositions[desktopPosition] || 'bottom';
};

/**
 * Truncate text for mobile screens
 * Keeps text concise for better readability on small screens
 */
export const truncateTextForMobile = (text, maxLength = 150) => {
  if (!text) return text;
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Mobile CSS for tour styling
 * Add this to your global CSS or styled component
 */
export const mobileToursCSS = `
  /* Mobile Tour Styles */
  @media (max-width: 768px) {
    .shepherd-element {
      max-width: 90vw !important;
      margin: 0 auto;
    }

    .shepherd-content {
      padding: 20px !important;
      border-radius: 12px;
    }

    .shepherd-text {
      font-size: 14px !important;
      line-height: 1.5;
    }

    .shepherd-title {
      font-size: 16px !important;
      margin-bottom: 12px;
    }

    .mobile-button {
      padding: 12px 16px !important;
      font-size: 14px !important;
      min-width: 100px;
      border-radius: 8px;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }

    .shepherd-button-primary {
      background-color: #2563eb !important;
      color: white !important;
    }

    .shepherd-button-primary:hover {
      background-color: #1d4ed8 !important;
    }

    .shepherd-button-secondary {
      background-color: #e5e7eb !important;
      color: #1f2937 !important;
    }

    .shepherd-button-secondary:hover {
      background-color: #d1d5db !important;
    }

    .shepherd-footer {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: center;
      padding: 12px;
    }

    .shepherd-cancel-icon {
      width: 36px !important;
      height: 36px !important;
      padding: 8px !important;
    }

    /* Increase touch target size for mobile */
    .shepherd-element button {
      min-height: 44px !important; /* Apple's minimum touch target */
      cursor: pointer;
    }

    /* Improve readability on small screens */
    .shepherd-popover {
      z-index: 9999;
    }

    /* Adjust arrow positioning for mobile */
    .shepherd-arrow::before {
      border-width: 8px;
    }

    /* Full-width content for mobile */
    .shepherd-content {
      width: auto;
    }
  }

  /* Extra small devices */
  @media (max-width: 480px) {
    .shepherd-element {
      max-width: 95vw !important;
    }

    .shepherd-content {
      padding: 16px !important;
    }

    .shepherd-text {
      font-size: 13px !important;
    }

    .shepherd-title {
      font-size: 15px !important;
    }

    .mobile-button {
      padding: 10px 12px !important;
      font-size: 12px !important;
      min-width: 80px;
    }

    .shepherd-footer {
      gap: 6px;
    }
  }
`;

/**
 * Custom hook for responsive tours
 * Usage: const { tourConfig } = useResponsiveTour(desktopTourConfig)
 */
export const useResponsiveTour = (desktopConfig) => {
  const [isMobile, setIsMobile] = React.useState(isMobileDevice());

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(isMobileDevice());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const tourConfig = isMobile 
    ? getMobileTourConfig(desktopConfig)
    : desktopConfig;

  return {
    tourConfig,
    isMobile,
  };
};
