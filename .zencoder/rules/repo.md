---
description: Repository Information Overview
alwaysApply: true
---

# Marketing Attendance Feature Issue Analysis

## Root Cause

The marketing attendance feature is failing due to a mismatch between the client-side API calls and the server-side route implementations. Here's what's happening:

1. **Client-Side API Calls**: The `MarketingAttendance.tsx` component makes API calls to endpoints like:

   - `/marketing-attendance/check-in`
   - `/marketing-attendance/check-out`
   - `/marketing-attendance/today`
   - `/marketing-attendance/metrics`

2. **Server-Side Route Registration**: The server has two different ways to register marketing routes:

   - **Full Registry**: When `ENABLE_FULL_REGISTRIES=1` environment variable is set, it uses the complete route registry from `marketing-routes-registry.ts`
   - **Fallback Implementation**: When the registry is disabled, it falls back to a minimal implementation with different URL patterns

3. **Route Mismatch**: The fallback routes use different URL patterns than what the client expects:

   - Client expects: `/marketing-attendance/check-in`
   - Fallback implements: `/api/marketing-attendance` (POST)
   - Client expects: `/marketing-attendance/check-out`
   - Fallback implements: `/api/marketing-attendance/:id/checkout` (PUT)

4. **Environment Variable Control**: The `ENABLE_FULL_REGISTRIES` environment variable controls whether the full route registries are used. If this is not set to "1", the application falls back to the minimal implementation.

## Solution

To fix the marketing attendance feature, you need to:

1. **Set Environment Variable**: Ensure `ENABLE_FULL_REGISTRIES=1` is set in the environment variables for the server.

2. **Alternative Fix**: If you can't modify the environment variables, you can:

   - Update the client code to match the fallback route patterns, or
   - Update the fallback routes to match the client's expectations

3. **Check Server Logs**: Look for any errors during startup that might prevent the marketing routes registry from loading properly.

## Technical Details

### Client-Side Implementation (MarketingAttendance.tsx)

The client component uses React Query to make API calls to these endpoints:

```javascript
// Check-in mutation
apiRequest('/marketing-attendance/check-in', { method: 'POST', body: data })

// Check-out mutation
apiRequest('/marketing-attendance/check-out', { method: 'POST', body: data })

// Fetch today's attendance
useQuery<AttendanceWithUser[]>({
  queryKey: ['/marketing-attendance/today'],
})

// Fetch attendance metrics
useQuery<AttendanceMetrics>({
  queryKey: ['/marketing-attendance/metrics'],
})
```

### Server-Side Implementation (routes.ts)

The server has fallback routes with different patterns:

```javascript
// Check-in (POST)
app.post("/api/marketing-attendance", requireAuth, async (req, res) => {...})

// Check-out (PUT)
app.put("/api/marketing-attendance/:id/checkout", requireAuth, async (req, res) => {...})

// Today's attendance
app.get("/api/marketing-attendance/today", requireAuth, async (req, res) => {...})

// Metrics
app.get("/api/marketing-attendance/metrics", requireAuth, async (req, res) => {...})
```

### Registry Loading Control

```javascript
const enableRegistries = process.env.ENABLE_FULL_REGISTRIES === "1";
try {
  if (!enableRegistries) {
    throw new Error("Registries disabled by ENABLE_FULL_REGISTRIES");
  }
  const { registerMarketingRoutes } = await import(
    "./marketing-routes-registry"
  );
  registerMarketingRoutes(app, {
    requireAuth,
    requireMarketingAccess,
    checkOwnership,
  });
  console.log("✅ Marketing routes registered successfully");
} catch (error) {
  console.warn("⚠️ Marketing routes registry not loaded:", error.message);
  // Fallback routes are implemented here...
}
```
