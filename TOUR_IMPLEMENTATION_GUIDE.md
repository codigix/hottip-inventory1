# Interactive User Onboarding Tour System - Implementation Guide

Complete implementation guide for the Shepherd.js-based interactive tour system for the Campus Management System.

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation & Setup](#installation--setup)
4. [File Structure](#file-structure)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [Creating New Tours](#creating-new-tours)
8. [Mobile Responsiveness](#mobile-responsiveness)
9. [API Reference](#api-reference)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The tour system provides an interactive guided experience for users exploring different modules of the Campus Management System. It uses Shepherd.js to highlight DOM elements and provide contextual help.

### Key Features
- ✅ Multi-module tours (Dashboard, Notes, Events, StudentMart, ChatRoom)
- ✅ User-based tour tracking in PostgreSQL
- ✅ Auto-start tours for first-time users
- ✅ Mobile-responsive tour configurations
- ✅ Skip/Back/Next/Finish buttons
- ✅ Tour status API endpoints
- ✅ Persistent tour completion tracking
- ✅ Admin dashboard for tour statistics

---

## Architecture

### Technology Stack
- **Frontend**: React + react-shepherd (Shepherd.js wrapper)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Styling**: Tailwind CSS compatible

### Data Flow
```
User Login
    ↓
Fetch Tour Status (GET /api/tour-status/:userId)
    ↓
Load Tour Contexts (TourProvider, ShepherdTourContext)
    ↓
Display StartTourButton on Module
    ↓
User Clicks "Start Tour"
    ↓
Initialize Shepherd with tour steps
    ↓
User Completes Tour
    ↓
Update Tour Status (POST /api/tour-status/update)
    ↓
Store in tourTracking table
```

---

## Installation & Setup

### 1. Install Dependencies
```bash
cd /path/to/project
npm install shepherd.js react-shepherd --legacy-peer-deps
```

### 2. Database Migration
The migration file is already created:
```
migrations/0005_add_tour_tracking.sql
```

Run the migration:
```bash
npm run db:push
# or manually run:
# psql -U username -d database_name -f migrations/0005_add_tour_tracking.sql
```

### 3. Verify Installation
Check that the following files exist:
- ✅ `server/tour-routes.ts` - Backend routes
- ✅ `client/src/contexts/TourContext.jsx` - Tour state management
- ✅ `client/src/components/tours/` - Tour configurations
- ✅ `client/src/components/StartTourButton.jsx` - UI button component
- ✅ `client/src/services/tourService.js` - API service

---

## File Structure

```
client/src/
├── components/
│   ├── TourProvider.jsx                    # Shepherd provider wrapper
│   ├── StartTourButton.jsx                 # Reusable tour button component
│   ├── tour-examples/                      # Example implementations
│   │   ├── DashboardWithTour.jsx
│   │   ├── NotesModuleWithTour.jsx
│   │   ├── EventsModuleWithTour.jsx
│   │   ├── StudentMartWithTour.jsx
│   │   └── ChatRoomWithTour.jsx
│   └── tours/                              # Tour configurations
│       ├── dashboardTour.js
│       ├── notesTour.js
│       ├── eventsTour.js
│       ├── studentMartTour.js
│       ├── chatroomTour.js
│       └── mobileResponsiveTours.js
├── contexts/
│   └── TourContext.jsx                     # Tour state & API management
├── hooks/
│   └── useTour.js                          # Custom tour hook
├── services/
│   └── tourService.js                      # API service functions
├── utils/
│   └── tourUtils.js                        # Helper utilities
└── App.tsx                                 # App root with providers

server/
├── tour-routes.ts                          # Tour API endpoints
└── routes.ts                               # Main routes (updated)

shared/
└── schema.ts                               # Database schema (updated)

migrations/
└── 0005_add_tour_tracking.sql             # Database migration
```

---

## Backend Implementation

### Database Schema

The `tour_tracking` table stores user tour completion status:

```sql
CREATE TABLE tour_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  dashboard_tour_done BOOLEAN DEFAULT FALSE,
  notes_tour_done BOOLEAN DEFAULT FALSE,
  events_tour_done BOOLEAN DEFAULT FALSE,
  studentmart_tour_done BOOLEAN DEFAULT FALSE,
  chatroom_tour_done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints

#### 1. Get Tour Status
```
GET /api/tour-status/:userId
Response:
{
  "success": true,
  "data": {
    "userId": "user-uuid",
    "dashboardTourDone": false,
    "notesTourDone": false,
    "eventsTourDone": false,
    "studentmartTourDone": false,
    "chatroomTourDone": false
  }
}
```

#### 2. Update Tour Status
```
POST /api/tour-status/update
Body:
{
  "userId": "user-uuid",
  "tourName": "dashboardTourDone",
  "completed": true
}
Response:
{
  "success": true,
  "message": "dashboardTourDone updated successfully",
  "data": { "dashboardTourDone": true }
}
```

#### 3. Bulk Update Tour Status
```
POST /api/tour-status/bulk-update
Body:
{
  "userId": "user-uuid",
  "tours": {
    "dashboardTourDone": true,
    "notesTourDone": false,
    "eventsTourDone": true
  }
}
Response:
{
  "success": true,
  "message": "Tour statuses updated successfully",
  "data": { /* updated tours */ }
}
```

#### 4. Get Tour Statistics (Admin)
```
GET /api/tour-stats
Response:
{
  "success": true,
  "data": {
    "summary": {
      "totalUsers": 50,
      "dashboardTourCompleted": 42,
      "notesTourCompleted": 35,
      ...
    },
    "details": [ /* array of all tour tracking records */ ]
  }
}
```

---

## Frontend Implementation

### 1. Setup App Root

The App.tsx already includes the required providers:

```jsx
<QueryClientProvider client={queryClient}>
  <TooltipProvider>
    <AuthProvider>
      <ShepherdTourContext>
        <TourContextProvider>
          <AppRouter />
        </TourContextProvider>
      </ShepherdTourContext>
    </AuthProvider>
  </TooltipProvider>
</QueryClientProvider>
```

### 2. Using the Tour System in a Component

```jsx
import React from 'react';
import { useTour } from '@/hooks/useTour';
import { dashboardTourConfig } from '@/components/tours/dashboardTour';
import StartTourButton from '@/components/StartTourButton';

const MyModule = () => {
  const { startTour, isTourDone } = useTour();

  return (
    <div>
      <h1>My Module</h1>
      
      {/* Add tour button */}
      <StartTourButton
        tourConfig={dashboardTourConfig}
        tourName="dashboardTourDone"
      />

      {/* Add data-tour attributes to elements you want to highlight */}
      <div data-tour="dashboard-main">
        Main content here
      </div>
    </div>
  );
};

export default MyModule;
```

### 3. Tour Context Hook

Access tour status anywhere in your app:

```jsx
import { useTourStatus } from '@/contexts/TourContext';

const MyComponent = () => {
  const { tourStatuses, updateTourStatus, isTourDone } = useTourStatus();

  // Check if a specific tour is done
  const isDashboardDone = isTourDone('dashboardTourDone');

  // Update tour status
  const markTourAsDone = async () => {
    await updateTourStatus('dashboardTourDone', true);
  };

  return (
    <div>
      {isDashboardDone ? 'Tour Completed ✓' : 'Start Tour →'}
    </div>
  );
};
```

---

## Creating New Tours

### Step 1: Create Tour Configuration

Create a new file: `client/src/components/tours/myNewTour.js`

```javascript
export const myNewTourConfig = {
  id: 'my-new-tour',
  steps: [
    {
      id: 'step-1',
      title: 'Welcome',
      text: 'This is the first step of your tour.',
      attachTo: {
        element: '[data-tour="section-1"]',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Next',
          action() {
            return this.next();
          }
        }
      ]
    },
    {
      id: 'step-2',
      title: 'Feature Overview',
      text: 'Learn about the key features.',
      attachTo: {
        element: '[data-tour="section-2"]',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Back',
          action() {
            return this.back();
          }
        },
        {
          text: 'Finish',
          action() {
            return this.complete();
          }
        }
      ]
    }
  ]
};
```

### Step 2: Add to Database Schema

Update `shared/schema.ts`:

```javascript
export const tourTracking = pgTable("tour_tracking", {
  // ... existing fields ...
  myNewTourDone: boolean("my_new_tour_done").default(false).notNull(),
  // ...
});
```

### Step 3: Update Migration

Add to `migrations/XXXX_update_tour_tracking.sql`:

```sql
ALTER TABLE tour_tracking ADD COLUMN my_new_tour_done BOOLEAN DEFAULT FALSE;
```

### Step 4: Integrate into Component

```jsx
import { myNewTourConfig } from '@/components/tours/myNewTour';
import StartTourButton from '@/components/StartTourButton';

const MyNewModule = () => {
  return (
    <div>
      <StartTourButton
        tourConfig={myNewTourConfig}
        tourName="myNewTourDone"
      />
      
      <div data-tour="section-1">
        First section
      </div>
      
      <div data-tour="section-2">
        Second section
      </div>
    </div>
  );
};
```

### Step 5: Update Tour Name Constants

Update `client/src/utils/tourUtils.js`:

```javascript
export const TOUR_NAMES = {
  DASHBOARD: 'dashboardTourDone',
  NOTES: 'notesTourDone',
  // ... add your new tour
  MY_NEW_TOUR: 'myNewTourDone',
};

export const TOUR_DISPLAY_NAMES = {
  // ... existing ...
  myNewTourDone: 'My New Module Tour',
};
```

---

## Mobile Responsiveness

### Mobile-Optimized Tours

The system includes automatic mobile detection and optimization:

```javascript
import { getResponsiveTourConfig } from '@/components/tours/mobileResponsiveTours';

const MyComponent = () => {
  const responsiveConfig = getResponsiveTourConfig(desktopTourConfig);
  
  return <StartTourButton tourConfig={responsiveConfig} tourName="myTour" />;
};
```

### Mobile Features
- ✅ Simplified button layouts (Next/Skip only)
- ✅ Larger touch targets (44px minimum)
- ✅ Adjusted positioning for small screens
- ✅ Truncated text for readability
- ✅ Optimized overlay styling

### Custom Mobile Styling

Add to your global CSS:

```css
@media (max-width: 768px) {
  .shepherd-element {
    max-width: 90vw !important;
  }

  .mobile-button {
    padding: 12px 16px !important;
    min-height: 44px !important;
  }
}
```

---

## API Reference

### Frontend Services

#### tourService.js

```javascript
// Fetch tour status
await fetchTourStatus(userId);

// Update single tour
await updateTourStatus(userId, 'dashboardTourDone', true);

// Update multiple tours
await bulkUpdateTourStatus(userId, {
  dashboardTourDone: true,
  notesTourDone: false
});

// Get statistics
await getTourStats();

// Initialize tracking
await initializeTourTracking(userId);

// Check completion
await areAllToursCompleted(userId);

// Get percentage
await getTourCompletionPercentage(userId);
```

### Hooks

#### useTour()

```javascript
const {
  startTour,           // Start a tour with config
  resetTour,           // Mark tour as incomplete
  completeTour,        // Mark tour as complete
  isTourDone,          // Check if tour is done
  tour                 // Direct Shepherd instance
} = useTour();
```

#### useTourStatus()

```javascript
const {
  tourStatuses,        // Object with all tour statuses
  isLoading,           // Loading state
  updateTourStatus,    // Update single tour
  isTourDone,          // Check if tour is done
  fetchTourStatuses    // Refresh statuses
} = useTourStatus();
```

---

## Troubleshooting

### Issue: Elements Not Highlighted

**Problem**: Tour steps don't attach to elements.

**Solution**:
1. Verify the `data-tour` attribute exists on the element
2. Check element visibility (not hidden with CSS)
3. Use the browser console to test selector: `document.querySelector('[data-tour="element-id"]')`
4. Ensure elements load before tour starts

```javascript
// Wait for element to load
import { waitForElement } from '@/utils/tourUtils';

beforeShowPromise: async function() {
  await waitForElement('[data-tour="dynamic-element"]');
}
```

### Issue: Tour Not Starting

**Problem**: StartTourButton doesn't trigger tour.

**Solution**:
1. Ensure `ShepherdTourContext` wraps your app
2. Check `useTour()` hook is called inside provider
3. Verify tour config has valid steps
4. Check browser console for errors

### Issue: API Errors

**Problem**: Tour status update fails.

**Solution**:
1. Verify user is authenticated
2. Check backend API is running
3. Ensure CORS is configured correctly
4. Verify database migration ran successfully

```bash
# Check table exists
psql -U username -d database_name -c "\d tour_tracking"

# Check user has records
SELECT * FROM tour_tracking WHERE user_id = 'uuid';
```

### Issue: Mobile Tour Looks Wrong

**Problem**: Tour not responsive on mobile.

**Solution**:
1. Use `getResponsiveTourConfig()` wrapper
2. Add mobile CSS from `mobileResponsiveTours.js`
3. Test with browser dev tools mobile mode
4. Verify touch targets are >= 44px

---

## Best Practices

1. **Keep Steps Concise**: Maximum 2-3 sentences per step
2. **Logical Flow**: Order steps by user workflow
3. **Avoid Hidden Elements**: Ensure elements are visible before highlighting
4. **Mobile First**: Test tours on mobile devices
5. **User Choice**: Never force tours; always provide skip option
6. **Persistence**: Save tour completion status for each user
7. **Analytics**: Track which tours users complete (optional)
8. **Update Regularly**: Refresh tours when UI changes significantly

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review example implementations in `tour-examples/`
3. Test with browser console
4. Verify database and API connectivity
5. Check Shepherd.js documentation: https://shepherdjs.dev

---

## License

This tour system is part of the Campus Management System project.
