# Tour System - Quick Start Guide

Get up and running with the tour system in 5 minutes.

## Installation (1 minute)

```bash
# Install dependencies
npm install shepherd.js react-shepherd --legacy-peer-deps

# Run database migration
npm run db:push
```

## Integration into Your Module (2 minutes)

### Step 1: Import Components
```jsx
import StartTourButton from '@/components/StartTourButton';
import { dashboardTourConfig } from '@/components/tours/dashboardTour';
import { useTour } from '@/hooks/useTour';
```

### Step 2: Add Tour Button to Your Module
```jsx
const MyDashboard = () => {
  return (
    <div>
      <h1>Dashboard</h1>
      <StartTourButton
        tourConfig={dashboardTourConfig}
        tourName="dashboardTourDone"
      />
    </div>
  );
};
```

### Step 3: Add data-tour Attributes to Elements
```jsx
<div data-tour="section-name">
  Content to highlight
</div>
```

### Step 4: Create Tour Steps (Optional)
If you want to customize the tour, create: `client/src/components/tours/myTour.js`

```javascript
export const myTourConfig = {
  id: 'my-tour',
  steps: [
    {
      id: 'step-1',
      title: 'Welcome',
      text: 'This is step 1',
      attachTo: {
        element: '[data-tour="section-name"]',
        on: 'bottom'
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

## Done! ✅

Your module now has:
- ✅ Tour button in the header
- ✅ Auto-tracking of tour completion
- ✅ Persistent storage in database
- ✅ Mobile-responsive layout

## Verify It Works

1. Start the app: `npm run dev`
2. Login to your account
3. Navigate to your module
4. Click "Start Tour" button
5. Complete the tour
6. Refresh page - tour status persists! ✓

## Common Tasks

### Auto-start Tour for New Users
```jsx
import { useEffect } from 'react';
import { useTour } from '@/hooks/useTour';

const MyModule = () => {
  const { startTour, isTourDone } = useTour();

  useEffect(() => {
    if (!isTourDone('dashboardTourDone')) {
      setTimeout(() => startTour(dashboardTourConfig, 'dashboardTourDone'), 500);
    }
  }, []);

  return <div>...</div>;
};
```

### Check If Tour Is Completed
```jsx
import { useTourStatus } from '@/contexts/TourContext';

const ShowCompletionBadge = () => {
  const { isTourDone } = useTourStatus();

  return (
    <div>
      {isTourDone('dashboardTourDone') ? '✓ Completed' : '○ Not Done'}
    </div>
  );
};
```

### Update Tour Status Manually
```jsx
const { updateTourStatus } = useTourStatus();

// Mark tour as complete
await updateTourStatus('dashboardTourDone', true);

// Mark tour as incomplete
await updateTourStatus('dashboardTourDone', false);
```

### Mobile Responsive Tours
```jsx
import { getResponsiveTourConfig } from '@/components/tours/mobileResponsiveTours';

const MyComponent = () => {
  const responsiveConfig = getResponsiveTourConfig(dashboardTourConfig);
  
  return <StartTourButton tourConfig={responsiveConfig} tourName="dashboardTourDone" />;
};
```

## Tour Button States

The StartTourButton automatically shows:

**Not Completed**: 
```
🎯 Start Tour
```

**Completed**:
```
🔄 Retake Tour | [Reset]
```

## Need Help?

See `TOUR_IMPLEMENTATION_GUIDE.md` for:
- Complete API reference
- Advanced examples
- Mobile customization
- Troubleshooting

## Files Overview

| File | Purpose |
|------|---------|
| `server/tour-routes.ts` | Backend API endpoints |
| `client/src/contexts/TourContext.jsx` | Tour state management |
| `client/src/components/tours/` | Tour configurations |
| `client/src/components/StartTourButton.jsx` | Reusable button component |
| `client/src/hooks/useTour.js` | Custom hook for tours |
| `client/src/services/tourService.js` | API service |

## Next Steps

1. ✅ Add tours to all modules (follow steps above)
2. ⚪ Customize tour steps and styling
3. ⚪ Add auto-start logic for first-time users
4. ⚪ Monitor tour completion with analytics
5. ⚪ Gather user feedback on tours

Happy touring! 🚀
