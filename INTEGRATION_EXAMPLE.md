# Integration Example - Adding Tours to Your Existing Modules

This guide shows how to add the tour system to your existing components.

## Example 1: Adding Tour to AdminDashboard

### Before
```jsx
// pages/AdminDashboard.tsx
import React from 'react';

export default function AdminDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-4 gap-4">
        {/* Stats cards */}
      </div>
    </div>
  );
}
```

### After
```jsx
// pages/AdminDashboard.tsx
import React, { useEffect } from 'react';
import StartTourButton from '@/components/StartTourButton';
import { useTour } from '@/hooks/useTour';
import { dashboardTourConfig } from '@/components/tours/dashboardTour';

export default function AdminDashboard() {
  const { startTour, isTourDone } = useTour();

  // Optional: Auto-start tour for new users
  useEffect(() => {
    if (!isTourDone('dashboardTourDone')) {
      // Uncomment to enable auto-start
      // setTimeout(() => startTour(dashboardTourConfig, 'dashboardTourDone'), 1000);
    }
  }, []);

  return (
    <div className="p-6">
      {/* Header with tour button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <StartTourButton
          tourConfig={dashboardTourConfig}
          tourName="dashboardTourDone"
        />
      </div>
      
      <div data-tour="dashboard-main" className="mb-6">
        <p className="text-gray-600">Welcome to your admin dashboard</p>
      </div>

      <div data-tour="dashboard-stats" className="grid grid-cols-4 gap-4">
        {/* Stats cards */}
      </div>

      <div data-tour="dashboard-charts" className="mt-6">
        {/* Charts */}
      </div>
    </div>
  );
}
```

**Changes Made:**
1. Import `StartTourButton`, `useTour`, and tour config
2. Add `<StartTourButton>` in header with tour name
3. Wrap key sections with `data-tour="section-name"`

---

## Example 2: Adding Tour to Inventory Module

### Inventory Layout Component

```jsx
// pages/inventory/InventoryLayout.tsx
import React from 'react';
import StartTourButton from '@/components/StartTourButton';
import { inventoryTourConfig } from '@/components/tours/inventoryTour'; // New!

export default function InventoryLayout() {
  return (
    <div className="space-y-6">
      {/* Header with tour */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <StartTourButton
          tourConfig={inventoryTourConfig}
          tourName="inventoryTourDone"
        />
      </div>

      {/* Tour-enabled sections */}
      <div data-tour="inventory-overview" className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-semibold">Inventory Overview</h2>
        {/* Content */}
      </div>

      <div data-tour="inventory-search" className="mb-4">
        <input
          type="text"
          placeholder="Search inventory..."
          className="w-full px-4 py-2 border rounded"
        />
      </div>

      <div data-tour="inventory-list" className="space-y-4">
        {/* Inventory items list */}
      </div>

      <div data-tour="inventory-actions" className="flex gap-2">
        <button className="px-4 py-2 bg-blue-600 text-white rounded">
          Add Item
        </button>
        <button className="px-4 py-2 bg-green-600 text-white rounded">
          Export
        </button>
      </div>
    </div>
  );
}
```

### Create New Tour Config

```javascript
// client/src/components/tours/inventoryTour.js
export const inventoryTourConfig = {
  id: 'inventory-tour',
  steps: [
    {
      id: 'inventory-welcome',
      title: 'Welcome to Inventory',
      text: 'Manage your inventory items, track stock levels, and monitor supplies.',
      attachTo: {
        element: '[data-tour="inventory-overview"]',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Next',
          action() { return this.next(); }
        }
      ]
    },
    {
      id: 'inventory-search',
      title: 'Search Items',
      text: 'Use the search bar to quickly find items by name or SKU.',
      attachTo: {
        element: '[data-tour="inventory-search"]',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Back',
          action() { return this.back(); }
        },
        {
          text: 'Next',
          action() { return this.next(); }
        }
      ]
    },
    {
      id: 'inventory-list',
      title: 'View Inventory',
      text: 'See all your inventory items with quantities and status.',
      attachTo: {
        element: '[data-tour="inventory-list"]',
        on: 'right'
      },
      buttons: [
        {
          text: 'Back',
          action() { return this.back(); }
        },
        {
          text: 'Next',
          action() { return this.next(); }
        }
      ]
    },
    {
      id: 'inventory-actions',
      title: 'Take Action',
      text: 'Use these buttons to add new items or export your inventory data.',
      attachTo: {
        element: '[data-tour="inventory-actions"]',
        on: 'top'
      },
      buttons: [
        {
          text: 'Back',
          action() { return this.back(); }
        },
        {
          text: 'Finish',
          action() { return this.complete(); }
        }
      ]
    }
  ]
};
```

### Update Database Schema (Optional)

If you want to track this new tour:

```typescript
// shared/schema.ts
export const tourTracking = pgTable("tour_tracking", {
  // ... existing fields ...
  inventoryTourDone: boolean("inventory_tour_done").default(false).notNull(),
});
```

---

## Example 3: Marketing Module with Auto-Start

```jsx
// pages/marketing/MarketingLayout.tsx
import React, { useEffect, useState } from 'react';
import StartTourButton from '@/components/StartTourButton';
import { useTour } from '@/hooks/useTour';
import { marketingTourConfig } from '@/components/tours/marketingTour';

export default function MarketingLayout() {
  const { startTour, isTourDone } = useTour();
  const [showAutoStartPrompt, setShowAutoStartPrompt] = useState(true);

  useEffect(() => {
    // Show prompt instead of auto-starting
    if (!isTourDone('marketingTourDone') && showAutoStartPrompt) {
      // Keep showAutoStartPrompt state for user to decide
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Auto-start prompt */}
      {!isTourDone('marketingTourDone') && showAutoStartPrompt && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4 flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-blue-900">New to Marketing Module?</h3>
            <p className="text-sm text-blue-700 mt-1">
              Take a quick tour to learn how to manage campaigns effectively.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => startTour(marketingTourConfig, 'marketingTourDone')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Take Tour
            </button>
            <button
              onClick={() => setShowAutoStartPrompt(false)}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Header with tour button */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Marketing</h1>
        <StartTourButton
          tourConfig={marketingTourConfig}
          tourName="marketingTourDone"
        />
      </div>

      {/* Content sections */}
      <div data-tour="marketing-campaigns" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Campaign cards */}
      </div>

      <div data-tour="marketing-analytics" className="bg-white rounded shadow p-6">
        {/* Analytics section */}
      </div>
    </div>
  );
}
```

---

## Example 4: Conditional Tour Display

### Role-Based Tours

```jsx
import { useAuth } from '@/contexts/AuthContext';
import StartTourButton from '@/components/StartTourButton';

export default function Dashboard() {
  const { user } = useAuth();

  // Only show tour for specific roles
  const canSeeTour = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        {canSeeTour && (
          <StartTourButton
            tourConfig={dashboardTourConfig}
            tourName="dashboardTourDone"
          />
        )}
      </div>
    </div>
  );
}
```

### Feature Flag Based Tours

```jsx
export default function Dashboard() {
  const [isTourEnabled, setIsTourEnabled] = useState(false);

  useEffect(() => {
    // Fetch feature flag
    const toursEnabled = localStorage.getItem('feature_tours') === 'true';
    setIsTourEnabled(toursEnabled);
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        {isTourEnabled && (
          <StartTourButton
            tourConfig={dashboardTourConfig}
            tourName="dashboardTourDone"
          />
        )}
      </div>
    </div>
  );
}
```

---

## Step-by-Step Integration Checklist

For any module you want to add a tour to:

### Step 1: Create Tour Configuration
- [ ] Create file: `client/src/components/tours/moduleName Tour.js`
- [ ] Define tour steps with `id`, `title`, `text`, `attachTo`
- [ ] Add buttons (Next, Back, Finish, Skip)

### Step 2: Update Component
- [ ] Import `StartTourButton` and tour config
- [ ] Import `useTour` hook if using auto-start
- [ ] Add tour button to header
- [ ] Wrap sections with `data-tour="section-name"`

### Step 3: Update Database (Optional)
- [ ] Add column to `tourTracking` table
- [ ] Update migration file
- [ ] Run migration: `npm run db:push`

### Step 4: Test
- [ ] Click "Start Tour" button
- [ ] Navigate through all steps
- [ ] Refresh page - status should persist
- [ ] Test on mobile device
- [ ] Test "Skip" and "Back" buttons

### Step 5: Customize
- [ ] Adjust tour text and titles
- [ ] Reorder steps if needed
- [ ] Add auto-start logic if desired
- [ ] Customize styling if needed

---

## Tips for Better Tours

1. **Keep It Short**: 4-6 steps is ideal
2. **Be Clear**: Use simple, user-friendly language
3. **Show Benefits**: Explain WHY users should use features
4. **Test Navigation**: Verify all buttons work
5. **Mobile First**: Test on small screens
6. **Get Feedback**: Ask users what was unclear
7. **Update Regularly**: Refresh when UI changes

---

## Common Patterns

### Pattern 1: Auto-Start with Skip Option
```jsx
useEffect(() => {
  if (!isTourDone('myTour')) {
    showAutostartPrompt = true; // Show prompt, let user decide
  }
}, []);
```

### Pattern 2: Show Tour Completion Percentage
```jsx
const { tourStatuses } = useTourStatus();
const completed = Object.values(tourStatuses).filter(Boolean).length;
const percentage = (completed / 5) * 100;
```

### Pattern 3: Guided Onboarding Flow
```jsx
const incompleteTours = tours.filter(t => !isTourDone(t.name));
if (incompleteTours.length > 0) {
  showOnboardingPrompt(incompleteTours[0]);
}
```

---

## Troubleshooting Integration

### Tour Button Not Showing
- Verify `ShepherdTourContext` in App.tsx
- Check import paths
- Verify component is inside provider

### Elements Not Highlighting
- Verify `data-tour` attribute on element
- Check element is visible (not display: none)
- Test selector in browser console

### Status Not Persisting
- Check database migration ran
- Verify user ID is correct
- Check API responses in Network tab
- Review backend logs for errors

---

## Next Steps

1. ✅ Choose which modules to add tours to
2. ✅ Create tour configurations
3. ✅ Update components with StartTourButton
4. ✅ Test and refine
5. ✅ Deploy with confidence!

See `TOUR_QUICK_START.md` for more help!
