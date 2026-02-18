# Tour System - Advanced Usage Guide

Advanced features and patterns for the tour system.

## Table of Contents
1. [Auto-Start Tours](#auto-start-tours)
2. [Conditional Tours](#conditional-tours)
3. [Custom Styling](#custom-styling)
4. [Tour Analytics](#tour-analytics)
5. [Onboarding Flow](#onboarding-flow)
6. [Dynamic Elements](#dynamic-elements)
7. [Tour Customization](#tour-customization)

---

## Auto-Start Tours

### Auto-Start on First Visit

Start tour automatically for users who haven't completed it:

```jsx
import { useEffect } from 'react';
import { useTour } from '@/hooks/useTour';
import { dashboardTourConfig } from '@/components/tours/dashboardTour';

const Dashboard = () => {
  const { startTour, isTourDone } = useTour();

  useEffect(() => {
    const isDone = isTourDone('dashboardTourDone');
    
    if (!isDone) {
      // Delay to allow DOM to fully render
      const timer = setTimeout(() => {
        startTour(dashboardTourConfig, 'dashboardTourDone');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  return <div>{/* content */}</div>;
};
```

### Auto-Start with Conditions

Start tour based on specific conditions:

```jsx
useEffect(() => {
  const isDone = isTourDone('dashboardTourDone');
  const isNewUser = user?.createdAt > Date.now() - 7 * 24 * 60 * 60 * 1000;
  const hasNotViewedFeature = !localStorage.getItem('featureSeen');

  if (!isDone && (isNewUser || hasNotViewedFeature)) {
    setTimeout(() => startTour(dashboardTourConfig, 'dashboardTourDone'), 1000);
  }
}, [user, isTourDone]);
```

### Defer Auto-Start with User Interaction

Show a prompt instead of auto-starting:

```jsx
const [showPrompt, setShowPrompt] = useState(true);
const { startTour, isTourDone } = useTour();

useEffect(() => {
  if (!isTourDone('dashboardTourDone') && showPrompt) {
    // Don't auto-start, just show prompt
  }
}, []);

return (
  <div>
    {showPrompt && (
      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
        <p className="text-blue-900 font-medium">Welcome to Dashboard!</p>
        <p className="text-sm text-blue-800 mt-1">Take a quick tour to learn the features.</p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => {
              startTour(dashboardTourConfig, 'dashboardTourDone');
              setShowPrompt(false);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Take Tour
          </button>
          <button
            onClick={() => setShowPrompt(false)}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            Skip
          </button>
        </div>
      </div>
    )}
  </div>
);
```

---

## Conditional Tours

### Show Tour Only for Specific Roles

```jsx
const Dashboard = () => {
  const { user } = useAuth();
  const { startTour } = useTour();

  // Only show tour for admin users
  const shouldShowTour = user?.role === 'admin';

  return (
    <div>
      {shouldShowTour && (
        <StartTourButton
          tourConfig={dashboardTourConfig}
          tourName="dashboardTourDone"
        />
      )}
    </div>
  );
};
```

### Tour Based on Feature Flags

```jsx
import { getFeatureFlag } from '@/services/featureFlags';

const Dashboard = () => {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const toursEnabled = getFeatureFlag('tours.enabled', true);
    const dashboardTourEnabled = getFeatureFlag('tours.dashboard', true);
    
    setShowTour(toursEnabled && dashboardTourEnabled);
  }, []);

  return showTour ? <StartTourButton ... /> : null;
};
```

---

## Custom Styling

### Custom Shepherd Styles

Create a custom CSS file or override styles:

```css
/* Custom tour styling */
.shepherd-element {
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.shepherd-title {
  color: #1f2937;
  font-size: 18px;
  font-weight: 700;
}

.shepherd-text {
  color: #4b5563;
  font-size: 14px;
  line-height: 1.6;
}

.shepherd-button-primary {
  background: #667eea;
  color: white;
  padding: 10px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: background 0.3s;
}

.shepherd-button-primary:hover {
  background: #5568d3;
}

.shepherd-button-secondary {
  background: #e5e7eb;
  color: #1f2937;
  padding: 10px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
}

.shepherd-highlight {
  outline: 2px solid #667eea !important;
  outline-offset: 4px;
  border-radius: 8px;
}

.shepherd-arrow {
  border-color: #667eea;
}
```

### Dynamic Styling Based on Tour

```javascript
export const customTourConfig = {
  id: 'custom-tour',
  options: {
    defaultStepOptions: {
      classes: 'custom-shepherd-theme',
      scrollToHandler: (element) => {
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  },
  steps: [
    // ... tour steps with custom styling
  ]
};
```

---

## Tour Analytics

### Track Tour Interactions

```javascript
// tourAnalytics.js
export const trackTourEvent = async (eventType, tourName, userData) => {
  try {
    await fetch('/api/analytics/tour-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: eventType,
        tour: tourName,
        userId: userData.userId,
        timestamp: new Date().toISOString(),
        metadata: {
          userAgent: navigator.userAgent,
          screenWidth: window.innerWidth,
        }
      })
    });
  } catch (error) {
    console.error('Failed to track tour event:', error);
  }
};
```

### Enhanced Tour Hook with Analytics

```jsx
export const useTourWithAnalytics = () => {
  const { user } = useAuth();
  const tour = useShepherd();
  const { updateTourStatus } = useTourStatus();

  const startTourWithAnalytics = (tourConfig, tourName) => {
    // Track tour start
    trackTourEvent('tour_started', tourName, { userId: user.id });

    tour.addSteps(tourConfig.steps);

    tour.on('complete', async () => {
      trackTourEvent('tour_completed', tourName, { userId: user.id });
      await updateTourStatus(tourName, true);
    });

    tour.on('cancel', () => {
      trackTourEvent('tour_skipped', tourName, { userId: user.id });
    });

    tour.on('show', () => {
      const currentStep = tour.getCurrentStep();
      trackTourEvent('step_viewed', tourName, { 
        userId: user.id, 
        step: currentStep?.id 
      });
    });

    tour.start();
  };

  return { startTourWithAnalytics };
};
```

---

## Onboarding Flow

### Multi-Tour Onboarding Sequence

Create an onboarding manager:

```jsx
// components/OnboardingManager.jsx
import { useTourStatus } from '@/contexts/TourContext';
import { dashboardTourConfig } from '@/components/tours/dashboardTour';
import { notesTourConfig } from '@/components/tours/notesTour';
import { useTour } from '@/hooks/useTour';

export const OnboardingManager = ({ children }) => {
  const { tourStatuses } = useTourStatus();
  const { startTour } = useTour();

  const onboardingSequence = [
    { config: dashboardTourConfig, name: 'dashboardTourDone', order: 1 },
    { config: notesTourConfig, name: 'notesTourDone', order: 2 },
  ];

  const nextIncompleteTour = onboardingSequence.find(
    t => !tourStatuses[t.name]
  );

  const handleStartOnboarding = () => {
    if (nextIncompleteTour) {
      startTour(nextIncompleteTour.config, nextIncompleteTour.name);
    }
  };

  const completionPercentage = Math.round(
    (onboardingSequence.filter(t => tourStatuses[t.name]).length / 
     onboardingSequence.length) * 100
  );

  return (
    <>
      {completionPercentage < 100 && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-blue-900">
              Complete Onboarding
            </h3>
            <span className="text-sm font-medium text-blue-700">
              {completionPercentage}% Complete
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded h-2 mb-3">
            <div
              className="bg-blue-600 h-2 rounded transition-all"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          {nextIncompleteTour && (
            <button
              onClick={handleStartOnboarding}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Next: {nextIncompleteTour.name}
            </button>
          )}
        </div>
      )}
      {children}
    </>
  );
};
```

---

## Dynamic Elements

### Wait for Dynamic Elements

```jsx
import { waitForElement } from '@/utils/tourUtils';

export const dynamicElementTourConfig = {
  id: 'dynamic-tour',
  steps: [
    {
      id: 'dynamic-step',
      title: 'Dynamic Content',
      text: 'This element loads dynamically',
      attachTo: {
        element: '[data-tour="dynamic-content"]',
        on: 'bottom'
      },
      beforeShowPromise: async function() {
        try {
          await waitForElement('[data-tour="dynamic-content"]', 5000);
        } catch (error) {
          console.error('Element did not load in time');
        }
      },
      buttons: [
        {
          text: 'Next',
          action() { return this.next(); }
        }
      ]
    }
  ]
};
```

### Observable Elements with Mutations

```jsx
export const observeElementForTour = (selector, callback) => {
  const observer = new MutationObserver((mutations) => {
    const element = document.querySelector(selector);
    if (element) {
      callback(element);
      observer.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  return observer;
};
```

---

## Tour Customization

### Custom Tour Factory

```jsx
// Create reusable tour configuration generator
export const createModuleTour = (moduleName, steps, options = {}) => {
  return {
    id: `${moduleName}-tour`,
    options: {
      useModalOverlay: true,
      scrollToHandler: (element) => {
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
      ...options
    },
    steps: steps.map((step, index) => ({
      ...step,
      highlightClass: 'shepherd-highlight',
      buttons: getStepButtons(index, steps.length)
    }))
  };
};

const getStepButtons = (index, total) => {
  const buttons = [];
  
  if (index > 0) {
    buttons.push({
      text: '← Back',
      classes: 'shepherd-button-secondary',
      action() { return this.back(); }
    });
  }
  
  if (index < total - 1) {
    buttons.push({
      text: 'Next →',
      classes: 'shepherd-button-primary',
      action() { return this.next(); }
    });
  } else {
    buttons.push({
      text: 'Complete',
      classes: 'shepherd-button-primary',
      action() { return this.complete(); }
    });
  }
  
  if (index < 2) {
    buttons.push({
      text: 'Skip',
      classes: 'shepherd-button-secondary',
      action() { return this.cancel(); }
    });
  }
  
  return buttons;
};
```

### Theme-Aware Tours

```jsx
import { useTheme } from 'next-themes';

export const ThemedTourConfig = () => {
  const { theme } = useTheme();

  const colors = theme === 'dark' 
    ? {
        primary: '#667eea',
        secondary: '#4b5563',
        text: '#f3f4f6'
      }
    : {
        primary: '#667eea',
        secondary: '#4b5563',
        text: '#1f2937'
      };

  return {
    id: 'themed-tour',
    steps: [
      {
        id: 'step-1',
        title: 'Welcome',
        text: 'Theme-aware tour',
        attachTo: { element: '[data-tour="step-1"]', on: 'bottom' },
        style: {
          '--shepherd-primary-color': colors.primary,
          '--shepherd-text-color': colors.text
        }
      }
    ]
  };
};
```

---

## Best Practices Summary

1. **Performance**
   - Lazy load tour configurations
   - Use `beforeShowPromise` for async operations
   - Cleanup event listeners on unmount

2. **UX**
   - Keep steps between 5-10 for longer tours
   - Always provide skip option
   - Test on real devices
   - Gather user feedback

3. **Accessibility**
   - Use semantic HTML
   - Ensure focus management
   - Provide keyboard navigation
   - Test with screen readers

4. **Testing**
   - Test auto-start logic
   - Verify database persistence
   - Check mobile responsiveness
   - Monitor analytics

---

For more information, see `TOUR_IMPLEMENTATION_GUIDE.md` and `TOUR_QUICK_START.md`.
