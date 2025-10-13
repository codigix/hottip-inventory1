# Marketing Tasks 500 Error - Fix Summary

## Problem

POST requests to `/api/marketing-tasks` were returning 500 Internal Server Error due to schema misalignment between the TypeScript/Drizzle schema definitions and the actual PostgreSQL database.

## Root Causes

1. **Type Mismatch**: Schema used `serial` IDs and `integer` foreign keys, but the database uses UUIDs
2. **Missing Enums**: Database uses PostgreSQL enums (`marketing_task_type`, `marketing_task_status`, `lead_priority`), but schema didn't define them
3. **Missing Fields**: Schema lacked critical fields like `description`, `estimatedHours`, `tags`, `createdBy`, etc.
4. **Incomplete Validation**: Zod schema didn't validate all required fields properly

## Changes Applied

### 1. Added Enum Definitions (`shared/schema.ts`)

```typescript
export const marketingTaskType = pgEnum("marketing_task_type", [
  "follow_up",
  "campaign",
  "call",
  "visit",
  "demo",
  "other",
]);

export const marketingTaskStatus = pgEnum("marketing_task_status", [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);

export const leadPriority = pgEnum("lead_priority", ["low", "medium", "high"]);
```

### 2. Updated `marketingTasks` Table Definition (`shared/schema.ts`)

**Before:**

- `serial` ID
- `integer` foreign keys
- Missing `createdBy`, `customerId`, `startedDate`
- Using `jsonb` for tags instead of `text[]`

**After:**

- `uuid` ID with `defaultRandom()`
- All foreign keys as UUIDs with proper references
- Added all missing fields: `createdBy`, `customerId`, `startedDate`
- Using enum types for `type`, `status`, `priority`
- Using `text().array()` for tags
- Proper camelCase field names matching database

### 3. Updated Zod Validation Schema (`shared/schema.ts`)

**Before:**

```typescript
export const insertMarketingTaskSchema = z.object({
  title: z.string(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assignedToUserId: z.any().optional(),
  // ... incomplete fields
});
```

**After:**

```typescript
export const insertMarketingTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["follow_up", "campaign", "call", "visit", "demo", "other"]),
  assignedTo: z.string().uuid("assignedTo must be a valid UUID"),
  assignedBy: z.string().uuid("assignedBy must be a valid UUID").optional(),
  createdBy: z.string().uuid("createdBy must be a valid UUID").optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  status: z
    .enum(["pending", "in_progress", "completed", "cancelled"])
    .optional(),
  dueDate: z.string().datetime().optional().or(z.string().optional()),
  startedDate: z.string().datetime().optional().or(z.string().optional()),
  completedDate: z.string().datetime().optional().or(z.string().optional()),
  leadId: z.string().uuid().optional().or(z.null()),
  fieldVisitId: z.string().uuid().optional().or(z.null()),
  customerId: z.string().uuid().optional().or(z.null()),
  estimatedHours: z.number().optional().or(z.string().optional()),
  tags: z.array(z.string()).optional(),
  isRecurring: z.boolean().optional(),
});
```

### 4. Updated Route Handler (`server/marketing-routes-registry.ts`)

**Changes:**

- Parse request with `assignedBy` and `createdBy` auto-populated from `req.user.id`
- Added validation for `assignedTo` user existence
- Added better error logging with `console.error` for debugging
- Improved validation for associated lead and field visit

**Before:**

```typescript
const taskData = insertMarketingTaskSchema.parse(req.body);
taskData.assignedBy = req.user!.id;
// Note: createdBy field may need to be added to schema
```

**After:**

```typescript
const taskData = insertMarketingTaskSchema.parse({
  ...req.body,
  assignedBy: req.user!.id,
  createdBy: req.user!.id,
});

// Validate assignedTo user exists
const assignedUser = await storage.getUser(taskData.assignedTo);
if (!assignedUser) {
  res.status(400).json({ error: "Assigned user not found" });
  return;
}
```

## Testing the Fix

### 1. Restart the Backend Server

```powershell
# Stop current server if running (Ctrl+C)
# Then restart
node "c:\Users\admin\Desktop\inventory\hottip-inventory1\server\index.ts"
```

### 2. Test POST Request

```json
POST /api/marketing-tasks
{
  "title": "Follow up with client",
  "description": "Discuss new product features",
  "type": "demo",
  "assignedTo": "<valid-user-uuid>",
  "dueDate": "2024-02-15T10:00:00Z",
  "estimatedHours": 2.5,
  "fieldVisitId": "<valid-field-visit-uuid>",
  "isRecurring": false,
  "leadId": null,
  "priority": "high",
  "tags": ["urgent", "demo"]
}
```

### 3. Expected Response

```json
{
  "id": "<generated-uuid>",
  "title": "Follow up with client",
  "type": "demo",
  "status": "pending",
  "priority": "high",
  "assignedTo": "<user-uuid>",
  "assignedBy": "<creator-uuid>",
  "createdBy": "<creator-uuid>",
  ...
}
```

## Key Improvements

1. ✅ **Type Safety**: All UUIDs properly validated
2. ✅ **Enum Validation**: Task type, status, and priority validated against database enums
3. ✅ **Complete Schema**: All database fields now represented in TypeScript
4. ✅ **Better Error Messages**: Detailed Zod validation errors + server-side logging
5. ✅ **Auto-populated Fields**: `assignedBy` and `createdBy` automatically set from authenticated user

## Notes

- The database has some column naming inconsistencies (both `isRecurring` and `is_recurring`). The schema includes both to maintain compatibility.
- Error logging now includes `console.error()` for better debugging of future issues.
- All foreign key validations are in place to prevent orphaned records.

## Files Modified

1. `shared/schema.ts` - Enums, table definition, Zod schema
2. `server/marketing-routes-registry.ts` - Route handler with validation
