// Tour Utilities - Helper functions for tour management

// Tour configurations
export const TOUR_NAMES = {
  DASHBOARD: 'dashboardTourDone',
  NOTES: 'notesTourDone',
  EVENTS: 'eventsTourDone',
  STUDENT_MART: 'studentmartTourDone',
  CHATROOM: 'chatroomTourDone',
};

// Tour display names for UI
export const TOUR_DISPLAY_NAMES = {
  dashboardTourDone: 'Dashboard Tour',
  notesTourDone: 'Notes Tour',
  eventsTourDone: 'Events Tour',
  studentmartTourDone: 'Student Mart Tour',
  chatroomTourDone: 'ChatRoom Tour',
};

// Default tour options
export const DEFAULT_TOUR_OPTIONS = {
  useModalOverlay: true,
  autoStart: false,
  scrollToHandler: (element) => {
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },
  steps: [],
};

/**
 * Create tour buttons configuration
 * @returns {Array} Array of button configurations
 */
export const getDefaultTourButtons = () => {
  return {
    next: {
      text: 'Next',
      classes: 'shepherd-button-primary',
      action() {
        return this.next();
      },
    },
    back: {
      text: 'Back',
      classes: 'shepherd-button-secondary',
      action() {
        return this.back();
      },
    },
    skip: {
      text: 'Skip Tour',
      classes: 'shepherd-button-secondary',
      action() {
        return this.cancel();
      },
    },
    finish: {
      text: 'Finish',
      classes: 'shepherd-button-primary',
      action() {
        return this.complete();
      },
    },
  };
};

/**
 * Get button combination for different tour steps
 * @param {string} type - Button type: 'start', 'middle', 'end'
 * @returns {Array} Array of button objects
 */
export const getTourButtons = (type = 'middle') => {
  const buttons = getDefaultTourButtons();

  switch (type) {
    case 'start':
      return [buttons.next, buttons.skip];
    case 'middle':
      return [buttons.back, buttons.next, buttons.skip];
    case 'end':
      return [buttons.back, buttons.finish];
    default:
      return [buttons.next, buttons.skip];
  }
};

/**
 * Format tour step with consistent styling
 * @param {Object} step - Step configuration
 * @param {string} position - Position of tooltip: 'top', 'bottom', 'left', 'right'
 * @returns {Object} Formatted step
 */
export const formatTourStep = (step, position = 'bottom') => {
  return {
    ...step,
    attachTo: {
      ...step.attachTo,
      on: step.attachTo?.on || position,
    },
    highlightClass: step.highlightClass || 'shepherd-highlight',
    cancelIcon: { enabled: true },
  };
};

/**
 * Create a complete tour configuration
 * @param {string} id - Tour ID
 * @param {Array} steps - Tour steps
 * @returns {Object} Complete tour configuration
 */
export const createTourConfig = (id, steps) => {
  return {
    id,
    steps: steps.map((step, index) => ({
      ...step,
      highlightClass: step.highlightClass || 'shepherd-highlight',
      cancelIcon: { enabled: true },
    })),
  };
};

/**
 * Check if element exists in DOM
 * @param {string} selector - CSS selector
 * @returns {boolean} True if element exists
 */
export const elementExists = (selector) => {
  return document.querySelector(selector) !== null;
};

/**
 * Wait for element to appear in DOM
 * @param {string} selector - CSS selector
 * @param {number} timeout - Max wait time in ms
 * @returns {Promise<Element>} Element promise
 */
export const waitForElement = (selector, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkElement = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error(`Element "${selector}" not found within ${timeout}ms`));
        return;
      }

      setTimeout(checkElement, 100);
    };

    checkElement();
  });
};

/**
 * Get tour status color for UI display
 * @param {boolean} isDone - Whether tour is completed
 * @returns {string} CSS color class
 */
export const getTourStatusColor = (isDone) => {
  return isDone ? 'text-green-600' : 'text-yellow-600';
};

/**
 * Get tour status badge text
 * @param {boolean} isDone - Whether tour is completed
 * @returns {string} Badge text
 */
export const getTourStatusBadge = (isDone) => {
  return isDone ? '✓ Completed' : '◯ Not Completed';
};

/**
 * Validate tour configuration
 * @param {Object} config - Tour configuration
 * @returns {Object} Validation result
 */
export const validateTourConfig = (config) => {
  const errors = [];

  if (!config.id) {
    errors.push('Tour must have an id');
  }

  if (!Array.isArray(config.steps) || config.steps.length === 0) {
    errors.push('Tour must have at least one step');
  }

  config.steps?.forEach((step, index) => {
    if (!step.id) {
      errors.push(`Step ${index} must have an id`);
    }
    if (!step.title) {
      errors.push(`Step ${index} must have a title`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Create mobile-friendly tour configuration
 * @param {Object} desktopConfig - Desktop tour configuration
 * @returns {Object} Mobile-friendly configuration
 */
export const createMobileTourConfig = (desktopConfig) => {
  return {
    ...desktopConfig,
    steps: desktopConfig.steps.map((step) => ({
      ...step,
      buttons: [
        {
          text: 'Next',
          action() {
            return this.next();
          },
        },
        {
          text: 'Skip',
          action() {
            return this.cancel();
          },
        },
      ],
    })),
  };
};

/**
 * Check if device is mobile
 * @returns {boolean} True if mobile device
 */
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};
