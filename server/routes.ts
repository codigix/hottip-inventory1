import type { Express, Request, Response, NextFunction } from "express";
import { registerAdminRoutes } from "./admin-routes-registry";
import { registerAccountsRoutes } from "./accounts-routes-registry";
import { registerMarketingRoutes } from "./marketing-routes-registry";
import { registerLogisticsRoutes } from "./logistics-routes-registry";
import { registerInventoryRoutes } from "./inventory-routes-registry";
import { registerSalesRoutes } from "./sales-routes-registry";
import { registerSalesOrderRoutes } from "./sales-order-routes";
import { registerFileUploadRoutes } from "./file-upload-routes";
import { registerTourRoutes } from "./tour-routes";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
// Removed unused schema imports from ../shared/schema to avoid runtime errors
import { z } from "zod";
import { db } from "./db";
import { validate as isUuid } from "uuid";
import { v4 as uuidv4 } from "uuid";
import {
  users,
  tasks,
  leaveRequests,
  inventoryAttendance,
  stockTransactions,
  suppliers,
  attendance,
  marketingAttendance,
  marketingTodays,
  marketingMetrics,
  products,
  spareParts,
  vendorCommunications,
  inventoryTasks,
  fabricationOrders,
  leads,
  visitNumber,
  marketingTasks,
  fieldVisits,
  logisticsShipments,
  logisticsTasks,
  deliveries,
  logisticsAttendance,
  logisticsLeaveRequests,
  outboundQuotations,
  inboundQuotations,
  invoices,
  insertOutboundQuotationSchema,
  insertInboundQuotationSchema,
  insertInvoiceSchema,
  customers,
  bank_accounts,
  insertBankAccountSchema,
  bank_transactions,
  insertBankTransactionSchema,
  account_reminders,
  insertAccountReminderSchema,
} from "../shared/schema";
import { sql, eq, and, gte, lt, aliasedTable, desc } from "drizzle-orm";
// Fabrication Orders API

// Login schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});
// Fabrication Orders API

// Local user schema used for create/update since shared insertUserSchema is not present
const userInsertSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.string().optional(),
  department: z.string().optional(),
});

// Creation schema: password required for DB NOT NULL constraint
const userCreateSchema = userInsertSchema.extend({
  password: z.string().min(6),
});

// Register schema for /api/register endpoint (fixes missing schema error)
const registerSchema = userCreateSchema;

// Zod schemas for marketing attendance responses (relaxed for better compatibility)
const marketingAttendanceSchema = z.object({
  id: z.string(), // Relaxed from uuid() to string()
  userId: z.string(), // Relaxed from uuid() to string()
  date: z.string(),
  checkInTime: z.string().nullable(),
  checkOutTime: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  location: z.string().nullable(),
  photoPath: z.string().nullable(),
  workDescription: z.string().nullable(),
  attendanceStatus: z.string(),
  visitCount: z.number().nullable(),
  tasksCompleted: z.number().nullable(),
  outcome: z.string().nullable(),
  nextAction: z.string().nullable(),
  isOnLeave: z.boolean(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }),
});

const marketingAttendanceArraySchema = z.array(marketingAttendanceSchema);

const marketingMetricsSchema = z.object({
  totalRecords: z.number(),
  presentCount: z.number(),
  absentCount: z.number(),
  leaveCount: z.number(),
  avgVisits: z.number(),
  avgTasks: z.number(),
});

// Logistics shipment creation schema
const logisticsShipmentInsertSchema = z.object({
  consignmentNumber: z.string().min(1),
  source: z.string().min(1),
  destination: z.string().min(1),
  currentStatus: z.string().optional(),
});

// Authentication and Authorization Middleware
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    username: string;
    department?: string;
  };
}

// SECURE authentication middleware - NEVER trust client-supplied identity headers
const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    console.log(`[Auth] Path: ${req.path}, Authorization: ${authHeader ? 'Present' : 'Missing'}`);

    // DEVELOPMENT MODE BYPASS: Only if NO authentication token is provided
    if (process.env.NODE_ENV === "development" && !authHeader) {
      // Set a default admin user for development
      // Map dev user to a stable UUID for database operations
      req.user = {
        id: "00000000-0000-0000-0000-000000000001",
        role: "admin",
        username: "dev_admin",
        department: "Administration",
      };
      next();
      return;
    }

    if (!authHeader) {
      console.log(`[Auth] 401 - Missing Authorization header for ${req.path}`);
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    // JWT authentication (production and development)
    const jwtSecret = process.env.JWT_SECRET;
    const devTokenSecret = process.env.DEV_TOKEN_SECRET;
    const tokenSecret = jwtSecret || devTokenSecret;

    // Try JWT verification first for both production and development
    if (
      authHeader.startsWith("Bearer ") &&
      !authHeader.startsWith("Bearer dev-") &&
      tokenSecret
    ) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const decoded = jwt.verify(token, tokenSecret, {
          algorithms: ["HS256"],
        }) as any;
        req.user = {
          id: decoded.sub,
          role: decoded.role,
          username: decoded.username,
          department: decoded.department,
        };
        next();
        return;
      } catch (jwtError: any) {
        console.error(`[Auth] JWT Verification failed for ${req.path}: ${jwtError.message}`);
        // In production, JWT failure is final
        if (process.env.NODE_ENV === "production") {
          res.status(401).json({ error: "Invalid authentication token" });
          return;
        }
        // In development, fall through to dev token handling
      }
    }

    // Production requires valid JWT or DEV_TOKEN_SECRET
    if (process.env.NODE_ENV === "production") {
      const devTokenSecret = process.env.DEV_TOKEN_SECRET;
      if (!jwtSecret && !devTokenSecret) {
        throw new Error(
          "JWT_SECRET or DEV_TOKEN_SECRET required in production"
        );
      }
      res.status(401).json({ error: "Valid authentication token required" });
      return;
    }

    // Development HMAC-signed tokens (dev mode fallback)
    if (
      process.env.NODE_ENV === "development" &&
      authHeader.startsWith("Bearer dev-")
    ) {
      // SECURITY: Use HMAC-signed tokens instead of predictable userId tokens
      // Format: "Bearer dev-{userId}-{timestamp}-{hmacSignature}"
      const token = authHeader.replace("Bearer dev-", "");
      const parts = token.split("-");

      if (parts.length !== 3) {
        res.status(401).json({ error: "Invalid development token format" });
        return;
      }

      const [userId, timestamp, signature] = parts;

      // Verify HMAC signature (using a server secret)
      const serverSecret = process.env.DEV_TOKEN_SECRET;
      if (!serverSecret) {
        res.status(401).json({
          error: "Server misconfiguration",
          message:
            "DEV_TOKEN_SECRET environment variable is required for development authentication",
        });
        return;
      }

      // Validate timestamp format
      const timestampNum = parseInt(timestamp);
      if (isNaN(timestampNum) || timestampNum <= 0) {
        res.status(401).json({ error: "Invalid development token timestamp" });
        return;
      }

      const expectedSignature = crypto
        .createHmac("sha256", serverSecret)
        .update(`${userId}-${timestamp}`)
        .digest("hex"); // Use full HMAC signature for security

      if (signature !== expectedSignature) {
        res.status(401).json({ error: "Invalid token signature" });
        return;
      }

      // Check token age (expire after 24 hours)
      const tokenAge = Date.now() - timestampNum;
      if (tokenAge > 24 * 60 * 60 * 1000) {
        // 24 hours
        res.status(401).json({ error: "Token expired" });
        return;
      }

      const user = await storage.getUser(userId);
      if (!user || !user.isActive) {
        res.status(401).json({ error: "Invalid or inactive user" });
        return;
      }

      req.user = {
        id: user.id,
        role: user.role,
        username: user.username,
        department: user.department,
      };
      next();
      return;
    }

    res.status(401).json({ error: "Authentication failed" });
  } catch (error) {
    res.status(401).json({ error: "Authentication failed" });
  }
};

// Role-based authorization middleware for financial/accounts access
const requireAccountsAccess = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const { role } = req.user;
  const allowedRoles = ["admin", "manager"]; // Only admin and manager can access financial reports

  if (!allowedRoles.includes(role)) {
    res.status(403).json({
      error: "Insufficient permissions",
      message: "Access to financial reports requires admin or manager role",
    });
    return;
  }

  next();
};

// Role-based authorization middleware for marketing metrics and admin operations
const requireMarketingAccess = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const { role } = req.user;
  const allowedRoles = ["admin", "manager"]; // Only admin and manager can access marketing metrics

  if (!allowedRoles.includes(role)) {
    res.status(403).json({
      error: "Insufficient permissions",
      message: "Access to marketing metrics requires admin or manager role",
    });
    return;
  }

  next();
};

// Combined middleware for reports access
const requireReportsAccess = [requireAuth, requireAccountsAccess];

// In-memory store to support Inventory Attendance demo flow
const inventoryAttendance: any[] = [];
const inMemoryMarketingLeaves: any[] = [];
const inMemoryInventoryLeaves: any[] = [];
const inMemoryInventoryTasks: any[] = [];
const inMemoryLogisticsShipments: any[] = [];
const inMemoryLogisticsTasks: any[] = [];

export async function registerRoutes(app: Express): Promise<Server> {
  // Normalize accidental double /api prefix from client (e.g., /api/api/...)
  app.use((req, _res, next) => {
    let u = req.url;
    const originalUrl = u;
    // Fix double API prefixes and missing slash variants
    if (u.startsWith("/api/api/")) u = u.replace("/api/api/", "/api/");
    if (u === "/api/api") u = "/api";
    if (u.startsWith("/apiapi/")) u = u.replace("/apiapi/", "/api/");
    if (u.startsWith("/api%20")) u = u.replace("/api%20", "/api"); // handle stray encoded spaces
    // Strip trailing encoded spaces
    u = u.replace(/%20+$/g, "");
    
    if (u !== originalUrl) {
      console.log(`🌐 Normalized ${req.method} ${originalUrl} -> ${u}`);
    } else {
      console.log(`🌐 ${req.method} ${u}`);
    }
    
    req.url = u;
    next();
  });

  // TEST ENDPOINT
  app.get("/api/ping", (_req, res) => res.json({ message: "pong", time: new Date().toISOString() }));

  // User registration endpoint
  app.post("/api/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);

      const existing = await storage.findUserByUsernameOrEmail(
        data.username,
        data.email
      );
      if (existing)
        return res
          .status(400)
          .json({ error: "Username or email already exists" });

      const hashedPassword = await bcrypt.hash(data.password, 12);

      const user = await storage.createUser({
        username: data.username,
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        department: data.department,
      });

      res.status(201).json({
        message: "Account created",
        user: { id: user.id, username: user.username, email: user.email },
      });
    } catch (err: any) {
      // Enhanced error logging for debugging
      console.error("/api/register error:", err);
      if (err instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid input", details: err.errors });
      }
      // If it's a database error, try to include more info
      if (err?.code && err?.detail) {
        return res.status(500).json({
          error: "Registration failed",
          code: err.code,
          detail: err.detail,
          message: err.message,
        });
      }
      res.status(500).json({
        error: "Registration failed",
        details: err.message || String(err),
      });
    }
  });

  // Disable ETag to avoid 304 Not Modified on frequently-updated APIs
  app.set("etag", false);
  // Get all clients
  app.get("/api/clients", requireAuth, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch clients", details: error.message });
    }
  });
  // Clients CRUD
  app.post("/api/clients", requireAuth, async (req, res) => {
    try {
      // Use insertCustomerSchema for validation (from shared/schema)
      const { insertCustomerSchema } = await import("../shared/schema");
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof (await import("zod")).z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid client data", details: error.errors });
      }
      res
        .status(500)
        .json({ error: "Failed to create client", details: error.message });
    }
  });
  // Authentication endpoints (public routes)
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("?? Login attempt received for username:", req.body.username);

      const { username, email, password } = req.body;
      if (!username && !email) {
        return res.status(400).json({ error: "Username or email is required" });
      }
      console.log("? Login data parsed successfully:", { username, email });

      let user = await storage.findUserByUsernameOrEmail(
        username || "",
        email || ""
      );

      // DEMO BYPASS: Auto-create and allow specific demo users
      const demoUsernames = ["admin", "sales", "inventory", "accounts", "marketing", "logistics"];
      const lowerUsername = (username || "").toLowerCase();
      
      if (!user && demoUsernames.includes(lowerUsername)) {
        console.log(`?? Creating missing demo user: ${lowerUsername}`);
        try {
          user = await storage.createUser({
            username: lowerUsername,
            email: `${lowerUsername}@businessops.demo`,
            password: await bcrypt.hash("password123", 10),
            firstName: lowerUsername.charAt(0).toUpperCase() + lowerUsername.slice(1),
            lastName: "Demo",
            role: lowerUsername === "admin" || lowerUsername === "marketing" ? "manager" : "employee",
            department: lowerUsername === "admin" ? "Administration" : 
                       lowerUsername.charAt(0).toUpperCase() + lowerUsername.slice(1),
            isActive: true
          });
          
          // Force admin role for 'admin' username
          if (lowerUsername === "admin") {
            await storage.updateUser(user.id, { role: "admin" });
            user.role = "admin";
          }
        } catch (createErr) {
          console.error("?? Failed to auto-create demo user:", createErr);
        }
      }

      console.log(
        "?? User lookup result:",
        user ? `Found user: ${user.username} (${user.role})` : "No user found"
      );

      const isDemoUser = user && demoUsernames.includes(user.username.toLowerCase());

      if (!user || !user.isActive) {
        console.log("? Login failed: Invalid user or inactive account");
        return res.status(401).json({ error: "Invalid credentials" });
      }

      let validPassword = false;
      if (isDemoUser) {
        console.log("?? Demo user detected, bypassing password check");
        validPassword = true;
      } else {
        console.log("?? Comparing passwords...");
        validPassword = await bcrypt.compare(password, user.password);
      }
      
      console.log(
        "?? Password comparison result:",
        validPassword ? "Valid" : "Invalid"
      );

      if (!validPassword) {
        console.log("? Login failed: Invalid password");
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const jwtSecret = process.env.JWT_SECRET;
      const devTokenSecret = process.env.DEV_TOKEN_SECRET;
      const tokenSecret = jwtSecret || devTokenSecret;

      console.log("?? Authentication secret status:", {
        jwt: jwtSecret ? "Available" : "Missing",
        dev: devTokenSecret ? "Available" : "Missing",
        using: jwtSecret ? "JWT_SECRET" : "DEV_TOKEN_SECRET",
      });

      if (!tokenSecret) {
        console.error(
          "? CRITICAL: Neither JWT_SECRET nor DEV_TOKEN_SECRET is available"
        );
        throw new Error(
          "Authentication secret is required (JWT_SECRET or DEV_TOKEN_SECRET)"
        );
      }

      console.log("?? Generating JWT token...");
      const token = jwt.sign(
        { sub: user.id, role: user.role, username: user.username, department: user.department },
        tokenSecret,
        { expiresIn: "15m", algorithm: "HS256" }
      );

      console.log("? Login successful for user:", user.username);

      // AUTO-CREATE MARKETING ATTENDANCE: For users in marketing department
      if (user.department?.toLowerCase() === "marketing" || user.username.toLowerCase() === "marketing") {
        try {
          const existingAttendance = await storage.getMarketingAttendanceForUserToday(user.id);
          if (!existingAttendance) {
            console.log(`📋 Auto-creating today's attendance for marketing user: ${user.username}`);
            await storage.checkInMarketingAttendance(user.id, {
              date: new Date(),
              checkInTime: new Date(),
              location: "Login (Auto)",
              latitude: null,
              longitude: null
            });
          }
        } catch (attErr) {
          console.error("⚠️ Failed to auto-create marketing attendance during login:", attErr);
        }
      }

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          department: user.department, // Ensure department is included
        },
      });
    } catch (error) {
      console.error("?? Login error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : typeof error,
      });

      if (error instanceof z.ZodError) {
        console.log("?? Validation error:", error.errors);
        return res
          .status(400)
          .json({ error: "Invalid input", details: error.errors });
      }

      console.error("? Unexpected login error:", error);
      res.status(500).json({
        error: "Login failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // SECURITY: Role-based authorization middleware for admin-only operations
  const requireAdminAccess = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { role } = req.user;
    const allowedRoles = ["admin"]; // Only admin can access user management

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        message: "Access to user management requires admin role",
      });
    }

    next();
  };

  // SECURITY: Per-resource ownership authorization middleware
  const checkOwnership = (entityType: string) => {
    return async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        if (!req.user) {
          res.status(401).json({ error: "Authentication required" });
          return;
        }

        const { role } = req.user;

        // Admin and manager roles have full access
        if (role === "admin" || role === "manager") {
          next();
          return;
        }

        // For regular users, check ownership
        let entity;
        try {
          switch (entityType) {
            case "lead":
              entity = await storage.getLead(req.params.id);
              break;
            case "field_visit":
              entity = await storage.getFieldVisit(req.params.id);
              break;
            case "marketing_task":
              entity = await storage.getMarketingTask(req.params.id);
              break;
            default:
              res.status(500).json({ error: "Unknown entity type" });
              return;
          }
        } catch (error) {
          res
            .status(404)
            .json({ error: `${entityType.replace("_", " ")} not found` });
          return;
        }

        if (!entity) {
          res
            .status(404)
            .json({ error: `${entityType.replace("_", " ")} not found` });
          return;
        }

        // Check if user owns the resource (assigned to them or created by them)
        const userId = req.user.id;
        const hasAccess =
          entity.assignedTo === userId ||
          entity.createdBy === userId ||
          entity.userId === userId;

        if (!hasAccess) {
          res.status(403).json({
            error: "Access denied",
            message: "You can only access your own records",
          });
          return;
        }

        next();
      } catch (error) {
        res.status(500).json({ error: "Failed to verify ownership" });
      }
    };
  };

  // Admin API routes (secured, admin only)

  // Users Routes - SECURED: Role-based scoping for user access
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const userRole = req.user!.role;
      const currentUserId = req.user!.id;

      let users = await storage.getUsers();

      // Apply role-based filtering
      if (userRole === "admin") {
        // Admins can see all users with full details
        res.json(users);
      } else if (userRole === "manager") {
        // Managers can see all users but with limited details
        const filteredUsers = users.map((user) => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          email: user.email,
          role: user.role,
          department: user.department,
          isActive: user.isActive,
        }));
        res.json(filteredUsers);
      } else {
        // Regular employees can see basic user info for team assignments and views
        const filteredUsers = users.map((user) => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          role: user.role,
          department: user.department,
          isActive: user.isActive,
        }));
        res.json(filteredUsers);
      }
    } catch (error) {
      console.error("GET /api/users failed:", error);
      res.status(500).json({
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.get(
    "/api/users/:id",
    requireAuth,
    requireAdminAccess,
    async (req, res) => {
      try {
        const user = await storage.getUser(req.params.id);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch user" });
      }
    }
  );

  app.post("/api/users", requireAuth, requireAdminAccess, async (req, res) => {
    try {
      const userData = userCreateSchema.parse(req.body);

      // Hash password (required)
      userData.password = await bcrypt.hash(userData.password, 12);

      const user = await storage.createUser(userData);
      await storage.createActivity({
        userId: user.id,
        action: "CREATE_USER",
        entityType: "user",
        entityId: user.id,
        details: `Created user: ${user.firstName} ${user.lastName}`,
      });
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid user data", details: error.errors });
      }
      console.error("POST /api/users failed:", error);
      res.status(500).json({
        error: "Failed to create user",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.put(
    "/api/users/:id",
    requireAuth,
    requireAdminAccess,
    async (req, res) => {
      try {
        const userData = userInsertSchema.partial().parse(req.body);

        // Hash password if provided
        if (userData.password) {
          userData.password = await bcrypt.hash(userData.password, 12);
        }

        const user = await storage.updateUser(req.params.id, userData);
        await storage.createActivity({
          userId: user.id,
          action: "UPDATE_USER",
          entityType: "user",
          entityId: user.id,
          details: `Updated user: ${user.firstName} ${user.lastName}`,
        });
        res.json(user);
      } catch (error) {
        res.status(500).json({ error: "Failed to update user" });
      }
    }
  );

  app.delete(
    "/api/users/:id",
    requireAuth,
    requireAdminAccess,
    async (req, res) => {
      try {
        await storage.deleteUser(req.params.id);
        res.status(204).send();
      } catch (error) {
        res.status(500).json({ error: "Failed to delete user" });
      }
    }
  );

  // Products Routes
  app.get("/api/products", async (_req: Request, res: Response) => {
    try {
      const rows = await db.select().from(products);
      res.json(rows); // send DB rows as JSON
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json([]);
    }
  });

  // Add product (original, no spare part fields)
  app.post("/api/products", async (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      if (!body.sku || !body.name || !body.category) {
        return res
          .status(400)
          .json({ error: "sku, name, and category are required" });
      }
      const [product] = await db
        .insert(products)
        .values({
          id: uuidv4(),
          sku: body.sku,
          name: body.name,
          category: body.category,
          price: body.price ?? 0,
          stock: body.stock ?? 0,
          costPrice: body.costPrice ?? 0,
          lowStockThreshold: body.lowStockThreshold ?? 0,
          unit: body.unit ?? "pcs",
          description: body.description ?? "",
        })
        .returning();
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res
        .status(500)
        .json({ error: "Failed to create product", details: error.message });
    }
  });

  // Spare Parts API
  app.get("/api/fabrication-orders", async (req, res) => {
    try {
      const orders = await db
        .select({
          id: fabricationOrders.id,
          orderNumber: fabricationOrders.orderNumber,
          sparePartId: fabricationOrders.sparePartId,
          quantity: fabricationOrders.quantity,
          status: fabricationOrders.status,
          priority: fabricationOrders.priority,
          startDate: fabricationOrders.startDate,
          dueDate: fabricationOrders.dueDate,
          notes: fabricationOrders.notes,
          createdAt: fabricationOrders.createdAt,
          updatedAt: fabricationOrders.updatedAt,
        })
        .from(fabricationOrders)
        .orderBy(fabricationOrders.createdAt);

      res.json(orders);
    } catch (error: any) {
      console.error("Error fetching fabrication orders:", error);
      res.status(500).json({
        error: "Failed to fetch fabrication orders",
        details: error.message,
      });
    }
  });

  app.post("/api/fabrication-orders", async (req: Request, res: Response) => {
    try {
      const { partId, quantity, status, priority, startDate, dueDate, notes } =
        req.body;

      const orderNumber = `FO-${Date.now()}`; // auto-generate order number

      const result = await db
        .insert(fabricationOrders)
        .values({
          orderNumber,
          sparePartId: partId,
          quantity,
          status: status || "pending",
          priority: priority || "normal",
          startDate: startDate ? new Date(startDate) : null,
          dueDate: dueDate ? new Date(dueDate) : null,
          notes,
        })
        .returning();

      res.status(201).json(result);
    } catch (err: any) {
      console.error("Error creating fabrication order:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // GET all spare parts
  app.get("/api/spare-parts", async (_req: Request, res: Response) => {
    try {
      const parts = await db.select().from(spareParts);
      res.json(parts);
    } catch (err: any) {
      console.error("Error fetching spare parts:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // POST new spare part
  app.post("/api/spare-parts", async (req: Request, res: Response) => {
    try {
      const {
        partNumber,
        name,
        description,
        specifications,
        type,
        status,
        stock,
        minStock,
        maxStock,
        unitCost,
        fabricationTime,
        location,
        unit,
      } = req.body;

      const result = await db.insert(spareParts).values({
        partNumber,
        name,
        description,
        specifications,
        type,
        status: status || "available", // default if null
        stock,
        minStock,
        maxStock,
        unitCost,
        location,
        unit,
        fabricationtime: fabricationTime, // map camelCase -> lowercase DB column
      });

      res.status(201).json(result);
    } catch (err: any) {
      console.error("Error creating spare part:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Suppliers CRUD
  // Suppliers Routes
  app.get(
    "/api/suppliers",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const allSuppliers = await db.select().from(suppliers);
        res.status(200).json(allSuppliers);
      } catch (error: any) {
        console.error("Error fetching suppliers:", error);
        res
          .status(500)
          .json({ error: "Failed to fetch suppliers", details: error.message });
      }
    }
  );

  app.post(
    "/api/suppliers",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const body = req.body;

        const supplierData = {
          name: body.name,
          email: body.email || body.contactEmail || null, // map frontend key to DB column
          phone: body.phone || body.contactPhone || null, // map frontend key to DB column
          address: body.address || null,
          city: body.city || null,
          state: body.state || null,
          zipCode: body.zipCode || null,
          country: body.country || "India",
          gstNumber: body.gstNumber || null,
          panNumber: body.panNumber || null,
          companyType: body.companyType || "company",
          contactPerson: body.contactPerson || null,
          website: body.website || null,
          creditLimit: body.creditLimit || null,
          paymentTerms: body.paymentTerms || 30,
          isActive: body.isActive !== undefined ? body.isActive : true,
        };

        const [supplier] = await db
          .insert(suppliers)
          .values({
            id: uuidv4(),
            ...supplierData,
          })
          .returning();

        res.status(201).json(supplier);
      } catch (error: any) {
        console.error("Error creating supplier:", error);
        res
          .status(500)
          .json({ error: "Failed to create supplier", details: error.message });
      }
    }
  );

  app.put("/api/suppliers/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const updateData = req.body;
      const supplier = await storage.updateSupplier(id, updateData);
      res.json(supplier);
    } catch (error: any) {
      res.status(400).json({
        error: "Failed to update supplier",
        details: error.errors || error.message,
      });
    }
  });

  app.delete("/api/suppliers/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteSupplier(id);
      res.status(204).end();
    } catch (error: any) {
      res.status(400).json({
        error: "Failed to delete supplier",
        details: error.errors || error.message,
      });
    }
  });

  // Vendor communications
  // GET all vendor communications
  app.get("/api/vendor-communications", requireAuth, async (_req, res) => {
    try {
      const rows = await db.select().from(vendorCommunications);
      res.json(rows);
    } catch (e: any) {
      console.error("Error fetching communications:", e);
      res
        .status(500)
        .json({ error: "Failed to fetch communications", details: e.message });
    }
  });

  // Save vendor communication (updated)
  // Save vendor communication
  // Save vendor communication
  app.post("/api/vendor-communications", requireAuth, async (req, res) => {
    try {
      const { vendorId, message, communicationDate, followUpRequired } =
        req.body;

      if (!vendorId || !message) {
        return res
          .status(400)
          .json({ error: "vendorId and message are required" });
      }

      // Extract type and subject/notes from message
      let type: "phone" | "complaint" | "follow_up" | "general" = "general";
      let subject = "general";
      let notes = message;

      const parts = message.split(":");
      if (parts.length > 1) {
        subject = parts[0].trim().toLowerCase();
        notes = parts.slice(1).join(":").trim();
      }

      if (subject === "phone") type = "phone";
      else if (subject === "complaint") type = "complaint";
      else if (subject === "follow_up" || followUpRequired) type = "follow_up";

      // Hardcode or get a valid userId from DB
      const userId = "b7e51f78-4068-4f97-b486-6a58622268c6"; // replace with actual logged-in user id

      const [saved] = await db
        .insert(vendorCommunications)
        .values({
          supplierId: vendorId,
          type,
          status: "completed",
          subject,
          notes,
          followUpRequired: followUpRequired || false,
          communicationDate: communicationDate
            ? new Date(communicationDate)
            : new Date(),
          userId,
        })
        .returning();

      res.status(201).json(saved);
    } catch (error: any) {
      console.error("Error saving communication:", error);
      res.status(500).json({
        error: "Failed to save communication",
        details: error.message,
      });
    }
  });

  // Save vendor communication

  // Reorder points (stubbed)
  app.get("/api/reorder-points", requireAuth, async (_req, res) => {
    // TODO: implement when reorderPoints table is added
    res.json([]);
  });

  // File uploads (generic upload URL)
  // app.post("/api/objects/upload", requireAuth, async (_req, res) => {
  //   try {
  //     const objectStorage = new ObjectStorageService();
  //     const uploadURL = await objectStorage.getObjectEntityUploadURL();
  //     res.json({ uploadURL });
  //   } catch (e) {
  //     res.status(500).json({ error: "Failed to get upload URL", details: e.message});
  //   }
  // });
  // OLD ENDPOINT - REMOVED (now handled by file-upload-routes.ts)
  //   // File uploads (generic upload URL) - Mocked for local development
  //   app.post("/api/objects/upload", requireAuth, async (_req, res) => {
  //     // --- START: Mocking Object Storage for Local Development ---
  //     if (process.env.NODE_ENV === "development") {
  //       // Return a dummy URL that the frontend can handle gracefully
  //       // In a real scenario, this would be replaced by a call to the actual ObjectStorageService
  //       res.json({
  //         uploadURL: "http://localhost:5000/mock-upload-url", // This is a fake URL
  //         message:
  //           "File upload is mocked in development mode. No actual upload occurs.",
  //       });
  //       return; // Exit early, don't proceed to ObjectStorageService
  //     }
  //     // --- END: Mocking ---

  //     try {
  //       const objectStorage = new ObjectStorageService();
  //       const uploadURL = await objectStorage.getObjectEntityUploadURL();
  //       res.json({ uploadURL });
  //     } catch (e) {
  //       // This will now only catch errors when NOT in development mode
  //       // or if the development check fails unexpectedly
  //       console.error("Object storage error:", e);
  //       res
  //         .status(500)
  //         .json({ error: "Failed to get upload URL", details: e.message });
  //     }
  //   });

  // app.post("/api/outbound-quotations", requireAuth, async (req, res) => {
  //   try {
  //     const { insertOutboundQuotationSchema } = await import("../shared/schema");
  //     const data = insertOutboundQuotationSchema
  //       .partial({ customerId: true })
  //       .parse(req.body); // ? allow optional customerId
  //     const quotation = await storage.insertOutboundQuotationSchema(data);
  //     res.status(201).json(quotation);
  //   } catch (error) {
  //     if (error instanceof z.ZodError) {
  //       return res
  //         .status(400)
  //         .json({ error: "Invalid quotation data", details: error.errors });
  //     }
  //     res.status(500).json({ error: "Failed to create quotation" });
  //   }
  // });

  // Quotations and invoices lists

  // app.get("/api/outbound-quotations", requireAuth, async (req, res) => {
  //   try {
  //     console.log("?? [DEBUG] GET /api/outbound-quotations - Request received");

  //     // --- STEP 1: Perform LEFT JOIN with FLATTENED field selection ---
  //     // This avoids the Drizzle internal error caused by nested selection objects.
  //     const rows = await db
  //       .select({
  //         // --- Fields from outboundQuotations table ---
  //         id: outboundQuotations.id,
  //         quotationNumber: outboundQuotations.quotationNumber,
  //         customerId: outboundQuotations.customerId,
  //         userId: outboundQuotations.userId,
  //         status: outboundQuotations.status,
  //         quotationDate: outboundQuotations.quotationDate,
  //         validUntil: outboundQuotations.validUntil,
  //         jobCardNumber: outboundQuotations.jobCardNumber,
  //         partNumber: outboundQuotations.partNumber,
  //         subtotalAmount: outboundQuotations.subtotalAmount,
  //         taxAmount: outboundQuotations.taxamount, // Exact DB column name
  //         discountAmount: outboundQuotations.discountamount, // Exact DB column name
  //         totalAmount: outboundQuotations.totalamount, // Exact DB column name
  //         paymentTerms: outboundQuotations.paymentterms, // Exact DB column name
  //         deliveryTerms: outboundQuotations.deliveryterms, // Exact DB column name
  //         notes: outboundQuotations.notes,
  //         ifscCode: outboundQuotations.ifscCode,
  //         createdAt: outboundQuotations.createdAt,
  //         updatedAt: outboundQuotations.updatedAt,
  //         // --- Fields from customers table (joined) ---
  //         // IMPORTANT: Select these individually and alias them to prevent conflicts
  //         // and to identify them for manual nesting in the next step.
  //         _customerIdJoin: customers.id, // Aliased customer ID
  //         _customerNameJoin: customers.name, // Aliased customer name
  //         _customerEmailJoin: customers.email, // Aliased customer email
  //         _customerPhoneJoin: customers.phone, // Aliased customer phone
  //         // Add other customer fields here if needed in the future, e.g.,
  //         // _customerCityJoin: customers.city,
  //       })
  //       .from(outboundQuotations)
  //       .leftJoin(customers, eq(outboundQuotations.customerId, customers.id)); // Join condition

  //     console.log(
  //       `?? [DEBUG] Fetched ${rows.length} raw rows from DB with JOIN`
  //     );

  //     // --- STEP 2: Transform flat DB result into the NESTED structure expected by the frontend ---
  //     // Iterate through the flat rows returned by the DB query.
  //     const transformedRows = rows.map((row) => {
  //       // Determine if a customer record was successfully joined.
  //       // If joined, _customerIdJoin will hold the customer's ID; otherwise, it might be null/undefined.
  //       const hasCustomer =
  //         row._customerIdJoin !== null && row._customerIdJoin !== undefined;

  //       // Construct the final object for this quotation.
  //       return {
  //         // --- Include all fields directly from the outboundQuotations table ---
  //         id: row.id,
  //         quotationNumber: row.quotationNumber,
  //         customerId: row.customerId,
  //         userId: row.userId,
  //         status: row.status,
  //         quotationDate: row.quotationDate,
  //         validUntil: row.validUntil,
  //         jobCardNumber: row.jobCardNumber,
  //         partNumber: row.partNumber,
  //         subtotalAmount: row.subtotalAmount,
  //         taxAmount: row.taxAmount,
  //         discountAmount: row.discountAmount,
  //         totalAmount: row.totalAmount,
  //         paymentTerms: row.paymentTerms,
  //         deliveryTerms: row.deliveryTerms,
  //         notes: row.notes,
  //         ifscCode: row.ifscCode,
  //         createdAt: row.createdAt,
  //         updatedAt: row.updatedAt,
  //         // --- Conditionally build the nested 'customer' object ---
  //         // If customer data was joined, create the nested object.
  //         // If not, set customer to null (or {}).
  //         customer: hasCustomer
  //           ? {
  //               id: row._customerIdJoin, // Use the aliased customer ID
  //               name: row._customerNameJoin, // Use the aliased customer name
  //               email: row._customerEmailJoin, // Use the aliased customer email
  //               phone: row._customerPhoneJoin, // Use the aliased customer phone
  //               // Map other customer fields here if you added them to the select above.
  //             }
  //           : null, // Or {} if preferred by frontend
  //       };
  //     });

  //     console.log(
  //       `?? [DEBUG] Transformed ${transformedRows.length} rows into nested structure`
  //     );
  //     // Send the correctly structured data (with nested customer objects) to the frontend.
  //     res.json(transformedRows);
  //   } catch (error) {
  //     // --- STEP 3: Robust Error Handling ---
  //     // Catch any unexpected errors during the JOIN or transformation process.
  //     console.error(
  //       "?? [ERROR] Failed to fetch outbound quotations with JOIN:",
  //       error
  //     );
  //     // Fallback to a simple query to maintain API availability.
  //     try {
  //       console.log(
  //         "?? [DEBUG] Falling back to simple outbound_quotations fetch..."
  //       );
  //       const fallbackRows = await db.select().from(outboundQuotations);
  //       res.json(fallbackRows);
  //     } catch (fallbackError) {
  //       // Catch errors in the fallback itself.
  //       console.error("?? [ERROR] Fallback fetch also failed:", fallbackError);
  //       res
  //         .status(500)
  //         .json({
  //           error: "Failed to fetch outbound quotations",
  //           details: error.message,
  //         });
  //     }
  //   }
  // });
  // Outbound Quotations routes moved to sales-routes-registry.ts


  // app.put("/api/outbound-quotations/:id", async (req, res) => {
  //   try {
  //     // 1. Parse and validate request body
  //     const quotationData = insertOutboundQuotationSchema.partial().parse(req.body);

  //     // 2. Call the storage method to perform the update
  //     const quotation = await storage.updateOutboundQuotation(req.params.id, quotationData);

  //     // 3. Create activity log (optional)
  //     await storage.createActivity({
  //       userId: quotation.userId,
  //       action: "UPDATE_OUTBOUND_QUOTATION",
  //       entityType: "outbound_quotation",
  //       entityId: quotation.id,
  //       details: `Updated outbound quotation: ${quotation.quotationNumber}`,
  //     });

  //     // 4. Send back the updated quotation
  //     res.json(quotation);
  //   } catch (error) {
  //     // 5. Handle errors (Zod validation or storage errors)
  //     if (error instanceof z.ZodError) {
  //        return res.status(400).json({ error: "Invalid quotation data", details: error.errors });
  //     }
  //     console.error("Failed to update outbound quotation:", error);
  //     res.status(500).json({ error: "Failed to update outbound quotation", details: error.message }); // Include error details
  //   }
  // });

  // app.get("/api/outbound-quotations", requireAuth, async (_req, res) => {
  //   try {
  //     const rows = await db.select().from(outboundQuotations);
  //     res.json(rows);
  //   } catch (e) {
  //     res.status(500).json({ error: "Failed to fetch outbound quotations" });
  //   }
  // });
  // app.get("/api/inbound-quotations", requireAuth, async (_req, res) => {
  //   try {
  //     const rows = await db.select().from(inboundQuotations);
  //     res.json(rows);
  //   } catch (e) {
  //     res.json([]);
  //   }
  // });

  // Inbound Quotations routes moved to sales-routes-registry.ts

  app.put(
    "/api/inbound-quotations/:id/attachment",
    requireAuth,
    async (req, res) => {
      try {
        const { id } = req.params;
        const { attachmentPath, attachmentName } = req.body; // These come from the frontend after direct upload

        if (!attachmentPath) {
          return res.status(400).json({ error: "attachmentPath is required" });
        }

        // Validate the ID format if necessary (e.g., if it's expected to be an integer)
        // const quotationId = parseInt(id, 10);
        // if (isNaN(quotationId)) {
        //   return res.status(400).json({ error: "Invalid quotation ID format" });
        // }

        // Update the quotation record with the attachment path
        // You'll need an `updateInboundQuotation` method in your storage class
        const updatedQuotation = await storage.updateInboundQuotation(id, {
          attachmentPath: attachmentPath,
          attachmentName: attachmentName, // Optional
        });

        if (!updatedQuotation) {
          return res.status(404).json({ error: "Inbound quotation not found" });
        }

        res.json(updatedQuotation);
      } catch (error) {
        console.error(
          "Failed to update inbound quotation with attachment:",
          error
        );
        res.status(500).json({
          error: "Failed to update inbound quotation with attachment",
          details: error.message,
        });
      }
    }
  );

  app.put("/api/inbound-quotations/:id", async (req, res) => {
    try {
      const body = { ...req.body };

      // Convert date strings to Date objects to avoid TypeError: value.toISOString is not a function
      if (body.quotationDate && typeof body.quotationDate === "string") {
        body.quotationDate = new Date(body.quotationDate);
      }
      if (body.validUntil && typeof body.validUntil === "string") {
        body.validUntil = new Date(body.validUntil);
      }

      const quotationData = insertInboundQuotationSchema
        .partial()
        .parse(body);
      const quotation = await storage.updateInboundQuotation(
        req.params.id,
        quotationData
      );
      await storage.createActivity({
        userId: quotation.userId,
        action: "UPDATE_INBOUND_QUOTATION",
        entityType: "inbound_quotation",
        entityId: quotation.id,
        details: `Updated inbound quotation: ${quotation.quotationNumber}`,
      });
      res.json(quotation);
    } catch (error) {
      res.status(500).json({ error: "Failed to update inbound quotation" });
    }
  });

  // app.get("/api/invoices", requireAuth, async (_req, res) => {
  //   try {
  //     const rows = await db.select().from(invoices);
  //     res.json(rows);
  //   } catch (e) {
  //     res.json([]);
  //   }
  // });
  // Invoice Routes
  // app.get("/api/invoices", requireAuth, async (req, res) => {
  //   try {
  //     const invoices = await storage.getInvoices();
  //     res.json(invoices);
  //   } catch (error) {
  //     res
  //       .status(500)
  //       .json({ error: "Failed to fetch invoices", details: error.message });
  //   }
  // });

  // app.get("/api/invoices/:id", requireAuth, async (req, res) => {
  //   try {
  //     const invoice = await storage.getInvoice(req.params.id);
  //     if (!invoice) {
  //       return res.status(404).json({ error: "Invoice not found" });
  //     }
  //     res.json(invoice);
  //   } catch (error) {
  //     res
  //       .status(500)
  //       .json({ error: "Failed to fetch invoice", details: error.message });
  //   }
  // });

  // app.post("/api/invoices", requireAuth, async (req, res) => {
  //   try {
  //     const invoiceData = insertInvoiceSchema.parse(req.body);
  //     const invoice = await storage.createInvoice(invoiceData);
  //     await storage.createActivity({
  //       userId: invoice.userId,
  //       action: "CREATE_INVOICE",
  //       entityType: "invoice",
  //       entityId: invoice.id,
  //       details: `Created invoice: ${invoice.invoiceNumber}`,
  //     });
  //     res.status(201).json(invoice);
  //   } catch (error) {
  //     if (error instanceof z.ZodError) {
  //       return res
  //         .status(400)
  //         .json({ error: "Invalid invoice data", details: error.errors });
  //     }
  //     res
  //       .status(500)
  //       .json({ error: "Failed to create invoice", details: error.errors });
  //   }
  // });

  // app.put("/api/invoices/:id", requireAuth, async (req, res) => {
  //   try {
  //     const invoiceData = insertInvoiceSchema.partial().parse(req.body);
  //     const invoice = await storage.updateInvoice(req.params.id, invoiceData);
  //     await storage.createActivity({
  //       userId: invoice.userId,
  //       action: "UPDATE_INVOICE",
  //       entityType: "invoice",
  //       entityId: invoice.id,
  //       details: `Updated invoice: ${invoice.invoiceNumber}`,
  //     });
  //     res.json(invoice);
  //   } catch (error) {
  //     res.status(500).json({ error: "Failed to update invoice" });
  //   }
  // });

  // Purchase orders
  app.get("/api/purchase-orders", requireAuth, async (_req, res) => {
    try {
      const purchaseOrders = await storage.getPurchaseOrders();
      res.json(purchaseOrders);
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch purchase orders",
        details: error.message,
      });
    }
  });

  app.get("/api/purchase-orders/:id", requireAuth, async (req, res) => {
    try {
      const purchaseOrder = await storage.getPurchaseOrder(req.params.id);
      if (!purchaseOrder) {
        return res.status(404).json({ error: "Purchase order not found" });
      }
      res.json(purchaseOrder);
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch purchase order",
        details: error.message,
      });
    }
  });

  app.post("/api/purchase-orders", requireAuth, async (req: any, res) => {
    try {
      const { insertPurchaseOrderSchema } = await import("../shared/schema");
      // Inject user ID from session to ensure security and prevent errors if client sends empty userId
      const data = { ...req.body, userId: req.user.id };
      const parsedData = insertPurchaseOrderSchema.parse(data);
      const purchaseOrder = await storage.createPurchaseOrder(parsedData);
      res.status(201).json(purchaseOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid purchase order data",
          details: error.errors,
        });
      }
      res.status(500).json({
        error: "Failed to create purchase order",
        details: error.message,
      });
    }
  });

  app.put("/api/purchase-orders/:id", requireAuth, async (req, res) => {
    try {
      const { insertPurchaseOrderSchema } = await import("../shared/schema");
      const parsedData = insertPurchaseOrderSchema.partial().parse(req.body);
      const purchaseOrder = await storage.updatePurchaseOrder(
        req.params.id,
        parsedData
      );
      res.json(purchaseOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid purchase order data",
          details: error.errors,
        });
      }
      res.status(500).json({
        error: "Failed to update purchase order",
        details: error.message,
      });
    }
  });

  app.delete("/api/purchase-orders/:id", requireAuth, async (req, res) => {
    try {
      await storage.deletePurchaseOrder(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({
        error: "Failed to delete purchase order",
        details: error.message,
      });
    }
  });

  // CUSTOMER PURCHASE ORDERS
  app.get("/api/customer-purchase-orders", requireAuth, async (_req, res) => {
    try {
      const orders = await storage.getCustomerPurchaseOrders();
      res.json(orders);
    } catch (error) {
      console.error("❌ Error in GET /api/customer-purchase-orders:", error);
      res.status(500).json({
        error: "Failed to fetch customer purchase orders",
        details: error.message,
      });
    }
  });

  app.get("/api/customer-purchase-orders/:id", requireAuth, async (req, res) => {
    try {
      const order = await storage.getCustomerPurchaseOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Customer purchase order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("❌ Error in GET /api/customer-purchase-orders/:id:", error);
      res.status(500).json({
        error: "Failed to fetch customer purchase order",
        details: error.message,
      });
    }
  });

  app.post("/api/customer-purchase-orders", requireAuth, async (req: any, res) => {
    try {
      const { insertCustomerPurchaseOrderSchema } = await import("../shared/schema");
      const data = { ...req.body, userId: req.user.id };
      const parsedData = insertCustomerPurchaseOrderSchema.parse(data);
      const order = await storage.createCustomerPurchaseOrder(parsedData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid customer purchase order data",
          details: error.errors,
        });
      }
      console.error("❌ Error in POST /api/customer-purchase-orders:", error);
      res.status(500).json({
        error: "Failed to create customer purchase order",
        details: error.message,
      });
    }
  });

  app.put("/api/customer-purchase-orders/:id", requireAuth, async (req, res) => {
    try {
      const { insertCustomerPurchaseOrderSchema } = await import("../shared/schema");
      const parsedData = insertCustomerPurchaseOrderSchema.partial().parse(req.body);
      const order = await storage.updateCustomerPurchaseOrder(
        req.params.id,
        parsedData
      );
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid customer purchase order data",
          details: error.errors,
        });
      }
      console.error("❌ Error in PUT /api/customer-purchase-orders/:id:", error);
      res.status(500).json({
        error: "Failed to update customer purchase order",
        details: error.message,
      });
    }
  });

  app.delete("/api/customer-purchase-orders/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteCustomerPurchaseOrder(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("❌ Error in DELETE /api/customer-purchase-orders/:id:", error);
      res.status(500).json({
        error: "Failed to delete customer purchase order",
        details: error.message,
      });
    }
  });

  // Dashboard/Activities/Orders basic stubs for frontend expectations
  app.get("/api/dashboard/metrics", (_req, res) => {
    res.json({ totalUsers: 0, totalSales: 0, totalOrders: 0 });
  });

  // Marketing leave request - always available with DB fallback

  // Inventory leave request - DB first, fallback to memory

  // app.post("/api/inventory-tasks", async (req: Request, res: Response) => {
  //   try {
  //     const {
  //       title,
  //       description,
  //       assignedTo,
  //       priority,
  //       dueDate,
  //       type,
  //       productId,
  //       sparePartId,
  //       batchId,
  //       fabricationOrderId,
  //       expectedQuantity,
  //       actualQuantity,
  //       fromLocation,
  //       toLocation,
  //       notes,
  //       attachmentPath,
  //     } = req.body;

  //     // Validate assignedTo
  //     if (!isUuid(assignedTo)) {
  //       return res
  //         .status(400)
  //         .json({ error: "assignedTo must be a valid UUID" });
  //     }

  //     // Normalize enums
  //     const normalizedPriority = priority?.toLowerCase() || "medium";
  //     const normalizedStatus = "pending"; // default
  //     const normalizedType = type?.toLowerCase() || "fabrication";

  //     const validPriorities = ["low", "medium", "high"];
  //     if (!validPriorities.includes(normalizedPriority)) {
  //       return res.status(400).json({ error: "Invalid priority" });
  //     }

  //     // Hardcode assignedBy (later you can take from auth session)
  //     const assignedBy = "b34e3723-ba42-402d-b454-88cf96340573"; // Sanika

  //     const [newTask] = await db
  //       .insert(inventoryTasks)
  //       .values({
  //         title,
  //         description,
  //         type: normalizedType,
  //         status: normalizedStatus,
  //         priority: normalizedPriority,
  //         assignedTo,
  //         assignedBy,
  //         productId,
  //         sparePartId,
  //         batchId,
  //         fabricationOrderId,
  //         expectedQuantity,
  //         actualQuantity,
  //         fromLocation,
  //         toLocation,
  //         dueDate: dueDate ? new Date(dueDate) : null,
  //         notes,
  //         attachmentPath,
  //       })
  //       .returning({
  //         id: inventoryTasks.id,
  //         title: inventoryTasks.title,
  //         description: inventoryTasks.description,
  //         type: inventoryTasks.type,
  //         status: inventoryTasks.status,
  //         priority: inventoryTasks.priority,
  //         assignedTo: inventoryTasks.assignedTo,
  //         assignedBy: inventoryTasks.assignedBy,
  //         dueDate: inventoryTasks.dueDate,
  //         createdAt: inventoryTasks.createdAt,
  //         updatedAt: inventoryTasks.updatedAt,
  //       });

  //     res
  //       .status(201)
  //       .json({ message: "Inventory task created", task: newTask });
  //   } catch (err) {
  //     console.error("Error creating inventory task:", err);
  //     res.status(500).json({
  //       error: "Failed to create inventory task",
  //       details: err.message,
  //     });
  //   }
  // });
  app.post("/api/inventory-tasks", async (req: Request, res: Response) => {
    try {
      const {
        title,
        description,
        assignedTo,
        priority,
        dueDate,
        type,
        productId,
        sparePartId,
        batchId,
        fabricationOrderId,
        expectedQuantity,
        actualQuantity,
        fromLocation,
        toLocation,
        notes,
        attachmentPath,
      } = req.body;

      // Validate assignedTo
      if (!isUuid(assignedTo)) {
        return res
          .status(400)
          .json({ error: "assignedTo must be a valid UUID" });
      }

      // Normalize enums
      const normalizedPriority = priority?.toLowerCase() || "medium";
      const normalizedStatus = "pending"; // default
      const normalizedType = type?.toLowerCase() || "fabrication";

      const validPriorities = ["low", "medium", "high"];
      if (!validPriorities.includes(normalizedPriority)) {
        return res.status(400).json({ error: "Invalid priority" });
      }

      // Hardcode assignedBy (later you can take from auth session)
      const assignedBy = "b34e3723-ba42-402d-b454-88cf96340573"; // Sanika

      const [newTask] = await db
        .insert(inventoryTasks)
        .values({
          title,
          description,
          type: normalizedType,
          status: normalizedStatus,
          priority: normalizedPriority,
          assignedTo,
          assignedBy,
          productId,
          sparePartId,
          batchId,
          fabricationOrderId,
          expectedQuantity,
          actualQuantity,
          fromLocation,
          toLocation,
          dueDate: dueDate ? new Date(dueDate) : null,
          notes,
          attachmentPath,
        })
        .returning({
          id: inventoryTasks.id,
          title: inventoryTasks.title,
          description: inventoryTasks.description,
          type: inventoryTasks.type,
          status: inventoryTasks.status,
          priority: inventoryTasks.priority,
          assignedTo: inventoryTasks.assignedTo,
          assignedBy: inventoryTasks.assignedBy,
          dueDate: inventoryTasks.dueDate,
          createdAt: inventoryTasks.createdAt,
          updatedAt: inventoryTasks.updatedAt,
        });

      res
        .status(201)
        .json({ message: "Inventory task created", task: newTask });
    } catch (err) {
      console.error("Error creating inventory task:", err);
      res.status(500).json({
        error: "Failed to create inventory task",
        details: err.message,
      });
    }
  });
  app.get("/api/activities", (_req, res) => {
    res.json([]);
  });
  app.get("/api/orders", (_req, res) => {
    res.json([]);
  });

  // Generic attendance for InventoryAttendance page (in-memory demo)
  // GET all attendance records
  const insertAttendanceSchema = z.object({
    userId: z.string().uuid(),
    action: z.enum(["check_in", "check_out"]),
    location: z.string(),
    timestamp: z.string().optional(),
    notes: z.string().optional(),
    department: z.string().optional(),
  });

  // GET attendance by userId
  app.get("/api/attendance/:userId", async (req, res) => {
    try {
      const records = await db
        .select()
        .from(attendance)
        .where({ userId: req.params.userId });
      res.status(200).json(records);
    } catch (error: any) {
      res
        .status(500)
        .json({ error: "Failed to fetch attendance", details: error.message });
    }
  });

  app.post("/api/attendance", async (req, res) => {
    try {
      const { userId, username, action, location, notes } = req.body;

      if ((!userId && !username) || !action || !location) {
        return res.status(400).json({
          error: "userId or username, action, location are required",
        });
      }

      // Get user ID from users table if username is provided
      let user;
      if (userId) {
        [user] = await db.select().from(users).where(eq(users.id, userId));
      } else {
        [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username));
      }

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const resolvedUserId = user.id;
      const timestamp = new Date();

      if (action === "check_in") {
        const [record] = await db
          .insert(attendance)
          .values({
            id: uuidv4(),
            userId: resolvedUserId,
            date: timestamp,
            checkIn: timestamp,
            location,
            status: "present",
            notes: notes || null,
          })
          .returning();
        return res.status(201).json(record);
      }

      if (action === "check_out") {
        const [existing] = await db
          .select()
          .from(attendance)
          .where(eq(attendance.userId, resolvedUserId))
          .orderBy(desc(attendance.date))
          .limit(1);

        if (!existing || existing.checkOut) {
          return res.status(400).json({ error: "No active check-in found" });
        }

        const [updated] = await db
          .update(attendance)
          .set({ checkOut: timestamp })
          .where(eq(attendance.id, existing.id))
          .returning();

        return res.json(updated);
      }

      res.status(400).json({ error: "Unknown action" });
    } catch (error: any) {
      console.error("Error recording attendance:", error);
      res.status(500).json({
        error: "Failed to record attendance",
        details: error.message,
      });
    }
  });

  // GET all attendance
  app.get("/api/attendance", async (_req, res) => {
    try {
      const data = await db.select().from(attendance);
      res.json({ data });
    } catch (error: any) {
      console.error("Error fetching attendance:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch attendance", details: error.message });
    }
  });

  // PUT update attendance by ID
  app.put("/api/attendance/:id", async (req, res) => {
    try {
      const data = insertAttendanceSchema.partial().parse(req.body);
      const timestamp = data.timestamp ? new Date(data.timestamp) : undefined;

      const [updated] = await db
        .update(attendance)
        .set({
          location: data.location,
          notes: data.notes,
          checkIn: data.action === "check_in" ? timestamp : undefined,
          checkOut: data.action === "check_out" ? timestamp : undefined,
        })
        .where({ id: req.params.id })
        .returning();

      if (!updated)
        return res.status(404).json({ error: "Attendance record not found" });
      res.status(200).json(updated);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid attendance data", details: error.errors });
      }
      res
        .status(500)
        .json({ error: "Failed to update attendance", details: error.message });
    }
  });

  // DELETE attendance by ID
  app.delete("/api/attendance/:id", async (req, res) => {
    try {
      await db.delete(attendance).where({ id: req.params.id });
      res.status(204).send();
    } catch (error: any) {
      res
        .status(500)
        .json({ error: "Failed to delete attendance", details: error.message });
    }
  });

  app.post("/api/inventory/leave-request", async (req, res) => {
    try {
      const { employeeName, leaveType, startDate, endDate, reason } = req.body;

      // Validate input
      if (!employeeName) {
        return res.status(400).json({ error: "employeeName is required" });
      }
      if (!leaveType || !startDate || !endDate) {
        return res.status(400).json({
          error: "leaveType, startDate, and endDate are required",
        });
      }

      // Find the user by employeeName (case-insensitive)
      const userArray = await db
        .select()
        .from(users)
        .where(sql`LOWER(${users.username}) = LOWER(${employeeName.trim()})`)
        .limit(1)
        .execute();

      const user = userArray[0];

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Insert leave request
      const result = await db
        .insert(leaveRequests)
        .values({
          userId: user.id, // use the user's ID
          leaveType,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          reason: reason || "",
          status: "pending", // default leave status
        })
        .returning();

      res.status(201).json({ data: result });
    } catch (error: any) {
      console.error("Error creating leave request:", error);
      res.status(500).json({
        error: "Failed to create leave request",
        details: error.message,
      });
    }
  });

  app.get("/api/inventory/attendance-with-leave", async (_req, res) => {
    try {
      const data = await db.select().from(leaveRequests);
      res.json({ data });
    } catch (error: any) {
      console.error("Error fetching leave requests:", error);
      res.status(500).json({
        error: "Failed to fetch leave requests",
        details: error.message,
      });
    }
  });

  // Approve leave request
  app.put("/api/inventory/leave-request/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;

      if (!isUuid(id)) {
        return res.status(400).json({ error: "Invalid leave request ID" });
      }

      const result = await db
        .update(leaveRequests)
        .set({ status: "approved" })
        .where(eq(leaveRequests.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ error: "Leave request not found" });
      }

      res.json({
        data: result[0],
        message: "Leave request approved successfully",
      });
    } catch (error: any) {
      console.error("Error approving leave request:", error);
      res.status(500).json({
        error: "Failed to approve leave request",
        details: error.message,
      });
    }
  });

  // Reject leave request
  app.put("/api/inventory/leave-request/:id/reject", async (req, res) => {
    try {
      const { id } = req.params;

      if (!isUuid(id)) {
        return res.status(400).json({ error: "Invalid leave request ID" });
      }

      const result = await db
        .update(leaveRequests)
        .set({ status: "rejected" })
        .where(eq(leaveRequests.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ error: "Leave request not found" });
      }

      res.json({
        data: result[0],
        message: "Leave request rejected successfully",
      });
    } catch (error: any) {
      console.error("Error rejecting leave request:", error);
      res.status(500).json({
        error: "Failed to reject leave request",
        details: error.message,
      });
    }
  });

  // Account-specific Attendance with filters (requires auth)
  app.get("/api/account-attendance", requireAuth, async (req, res) => {
    try {
      const { startDate, endDate, department } = req.query;

      let query = db.select().from(attendance);

      if (startDate)
        query = query.where("date", ">=", new Date(startDate as string));
      if (endDate)
        query = query.where("date", "<=", new Date(endDate as string));
      if (department)
        query = query.where("department", "=", department as string);

      const records = await query;
      res.status(200).json(records);
    } catch (error: any) {
      res.status(500).json({
        error: "Failed to fetch account attendance records",
        details: error.message,
      });
    }
  });

  // Schema for creating account attendance records
  const createAccountAttendanceSchema = z.object({
    employeeId: z.string(), // User ID or username
    date: z.string(), // Date in YYYY-MM-DD format
    status: z.enum(["present", "absent", "leave"]),
    checkIn: z.string().optional(), // Time in HH:mm format or full datetime
    checkOut: z.string().optional(), // Time in HH:mm format or full datetime
    location: z.string().optional(),
    notes: z.string().optional(),
  });

  // POST create account attendance record
  app.post("/api/account-attendance", requireAuth, async (req, res) => {
    try {
      const data = createAccountAttendanceSchema.parse(req.body);

      // Find user by ID or username
      let user;
      if (isUuid(data.employeeId)) {
        user = await storage.getUser(data.employeeId);
      } else {
        // Assume it's a username
        user = await storage.getUserByUsername(data.employeeId);
      }

      if (!user) {
        return res.status(400).json({ error: "Employee not found" });
      }

      // Parse dates
      const attendanceDate = new Date(data.date);
      const checkIn = data.checkIn ? new Date(data.checkIn) : null;
      const checkOut = data.checkOut ? new Date(data.checkOut) : null;

      // Insert attendance record
      const [newRecord] = await db
        .insert(attendance)
        .values({
          userId: user.id,
          date: attendanceDate,
          checkIn: checkIn,
          checkOut: checkOut,
          location: data.location,
          status: data.status,
          notes: data.notes,
        })
        .returning();

      res.status(201).json({
        message: "Attendance record created successfully",
        record: newRecord,
      });
    } catch (error: any) {
      console.error("Error creating account attendance record:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input data",
          details: error.errors,
        });
      }
      res.status(500).json({
        error: "Failed to create attendance record",
        details: error.message,
      });
    }
  });
  // Accounts metrics and lists (stubs to satisfy UI)
  // app.get("/api/accounts/dashboard-metrics", requireAuth, async (_req, res) => {
  //   res.json({
  //     totalReceivables: 0,
  //     totalPayables: 0,
  //     invoicesDue: 0,
  //     avgDaysToPay: 0,
  //   });
  // });
  app.get("/api/accounts/cash-flow-summary", requireAuth, async (_req, res) => {
    res.json({ inflow: 0, outflow: 0, net: 0 });
  });
  // app.get("/api/accounts/payables-total", requireAuth, async (_req, res) => {
  //   res.json({ total: 0 });
  // });
  // app.get("/api/accounts-payables", requireAuth, async (_req, res) => {
  //   res.json([]);
  // });
  // app.get("/api/accounts-payables/overdue", requireAuth, async (_req, res) => {
  //   res.json([]);
  // });
  app.post("/api/bank-accounts", requireAuth, async (req, res) => {
    try {
      const data = insertBankAccountSchema.parse(req.body);
      const newAccount = await db
        .insert(bank_accounts)
        .values(data)
        .returning();
      res.status(201).json(newAccount[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid input", details: error.errors });
      }
      console.error("Error creating bank account:", error);
      res.status(500).json({ error: "Failed to create bank account" });
    }
  });
  app.get("/api/bank-accounts", requireAuth, async (_req, res) => {
    try {
      const accounts = await db.select().from(bank_accounts);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bank accounts" });
    }
  });
  app.get("/api/bank-accounts/active", requireAuth, async (_req, res) => {
    try {
      const accounts = await db.select().from(bank_accounts);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active bank accounts" });
    }
  });
  app.get("/api/bank-accounts/default", requireAuth, async (_req, res) => {
    try {
      const accounts = await db.select().from(bank_accounts).limit(1);
      res.json(accounts[0] || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch default bank account" });
    }
  });
  app.put("/api/bank-accounts/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertBankAccountSchema.parse(req.body);
      const updatedAccount = await db
        .update(bank_accounts)
        .set(data)
        .where(eq(bank_accounts.id, id))
        .returning();
      if (updatedAccount.length === 0) {
        return res.status(404).json({ error: "Bank account not found" });
      }
      res.json(updatedAccount[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid input", details: error.errors });
      }
      console.error("Error updating bank account:", error);
      res.status(500).json({ error: "Failed to update bank account" });
    }
  });
  app.delete("/api/bank-accounts/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deletedAccount = await db
        .delete(bank_accounts)
        .where(eq(bank_accounts.id, id))
        .returning();
      if (deletedAccount.length === 0) {
        return res.status(404).json({ error: "Bank account not found" });
      }
      res.json({ message: "Bank account deleted successfully" });
    } catch (error) {
      console.error("Error deleting bank account:", error);
      res.status(500).json({ error: "Failed to delete bank account" });
    }
  });
  app.get("/api/bank-transactions", requireAuth, async (_req, res) => {
    try {
      const transactions = await db
        .select({
          id: bank_transactions.id,
          bankAccountId: bank_transactions.bankAccountId,
          date: bank_transactions.date,
          type: bank_transactions.type,
          amount: bank_transactions.amount,
          bankAccount: {
            id: bank_accounts.id,
            name: bank_accounts.name,
            bankName: bank_accounts.bankName,
            accountNumberMasked: bank_accounts.accountNumberMasked,
          },
        })
        .from(bank_transactions)
        .leftJoin(
          bank_accounts,
          eq(bank_transactions.bankAccountId, bank_accounts.id)
        );
      // Add default empty strings for description and reference until DB migration is run
      const transactionsWithDefaults = transactions.map((t) => ({
        ...t,
        description: "",
        reference: "",
      }));
      res.json(transactionsWithDefaults);
    } catch (error) {
      console.error("Error fetching bank transactions:", error);
      res.status(500).json({ error: "Failed to fetch bank transactions" });
    }
  });
  app.post("/api/bank-transactions", requireAuth, async (req, res) => {
    try {
      const data = insertBankTransactionSchema.parse(req.body);
      // Parse date string to Date object for timestamp
      const { date, amount, type, bankAccountId } = data;
      const transactionData = {
        date: new Date(date),
        amount,
        type,
        bankAccountId,
      };
      const newTransaction = await db
        .insert(bank_transactions)
        .values(transactionData)
        .returning();
      res.status(201).json(newTransaction[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid input", details: error.errors });
      }
      console.error("Error creating bank transaction:", error);
      res.status(500).json({ error: "Failed to create bank transaction" });
    }
  });
  // app.get("/api/account-reminders", requireAuth, async (_req, res) => {
  //   res.json([]);
  // });
  // app.get("/api/account-tasks", requireAuth, async (_req, res) => {
  //   res.json([]);
  // });

  app.get("/api/account-reminders", requireAuth, async (_req, res) => {
    try {
      const reminders = await db.select().from(account_reminders);
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching account reminders:", error);
      res.status(500).json({ error: "Failed to fetch account reminders" });
    }
  });

  app.post("/api/account-reminders", requireAuth, async (req, res) => {
    try {
      const data = insertAccountReminderSchema.parse(req.body);
      // Convert string dates to Date objects for Drizzle
      const insertData = {
        ...data,
        dueDate: new Date(data.dueDate),
        nextReminderAt: new Date(data.nextReminderAt || data.dueDate),
        lastSentAt: data.lastSentAt ? new Date(data.lastSentAt) : undefined,
      };
      const newReminder = await db
        .insert(account_reminders)
        .values(insertData)
        .returning();
      res.status(201).json(newReminder[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid input", details: error.errors });
      }
      console.error("Error creating account reminder:", error);
      res.status(500).json({ error: "Failed to create account reminder" });
    }
  });

  // PUT /api/account-reminders/:id (edit)
  app.put("/api/account-reminders/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertAccountReminderSchema.parse(req.body);
      const updateData = {
        ...data,
        dueDate: new Date(data.dueDate),
        nextReminderAt: new Date(data.nextReminderAt || data.dueDate),
        lastSentAt: data.lastSentAt ? new Date(data.lastSentAt) : undefined,
      };
      const updated = await db
        .update(account_reminders)
        .set(updateData)
        .where(eq(account_reminders.id, id))
        .returning();
      if (updated.length === 0) {
        return res.status(404).json({ error: "Reminder not found" });
      }
      res.json(updated[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid input", details: error.errors });
      }
      console.error("Error updating account reminder:", error);
      res.status(500).json({ error: "Failed to update account reminder" });
    }
  });

  // DELETE /api/account-reminders/:id
  app.delete("/api/account-reminders/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await db
        .delete(account_reminders)
        .where(eq(account_reminders.id, id))
        .returning();
      if (deleted.length === 0) {
        return res.status(404).json({ error: "Reminder not found" });
      }
      res.json({ message: "Reminder deleted successfully" });
    } catch (error) {
      console.error("Error deleting account reminder:", error);
      res.status(500).json({ error: "Failed to delete account reminder" });
    }
  });

  // POST /api/account-reminders/:id/send (mark as sent)
  app.post("/api/account-reminders/:id/send", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await db
        .update(account_reminders)
        .set({
          status: "sent",
          lastSentAt: new Date(),
        })
        .where(eq(account_reminders.id, id))
        .returning();
      if (updated.length === 0) {
        return res.status(404).json({ error: "Reminder not found" });
      }
      res.json(updated[0]);
    } catch (error) {
      console.error("Error sending account reminder:", error);
      res.status(500).json({ error: "Failed to send account reminder" });
    }
    res.json([]);
  });

  // GST returns (stubs)
  // app.get("/api/gst-returns", requireAuth, async (_req, res) => {
  //   res.json([]);
  // });
  // app.get("/api/gst-returns/status/:status", requireAuth, async (_req, res) => {
  //   res.json([]);
  // });

  // Accounts Attendance (stubs to satisfy AccountsAttendance page)
  app.get("/api/account-attendance", requireAuth, async (_req, res) => {
    res.json([]);
  });
  app.get("/api/account-attendance/today", requireAuth, async (_req, res) => {
    res.json([]);
  });
  app.get("/api/account-attendance/metrics", requireAuth, async (_req, res) => {
    res.json({
      teamSize: 0,
      presentToday: 0,
      attendanceRate: 0,
      avgHours: 0,
      lateArrivalsThisWeek: 0,
    });
  });
  app.get("/api/account-attendance/summary", requireAuth, async (_req, res) => {
    res.json({});
  });

  //

  // Lightweight marketing dashboard endpoints
  app.get("/api/marketing", requireAuth, async (_req, res) => {
    try {
      // 1. Leads metrics
      const [leadsRow] = await db
        .select({
          total: sql`COUNT(*)::integer`,
          active: sql`COUNT(CASE WHEN ${leads.status} IN ('new','contacted','in_progress') THEN 1 END)::integer`,
          converted: sql`COUNT(CASE WHEN ${leads.status} = 'converted' THEN 1 END)::integer`,
          monthlyNew: sql`COUNT(CASE WHEN EXTRACT(MONTH FROM ${leads.createdAt}) = EXTRACT(MONTH FROM NOW()) THEN 1 END)::integer`,
        })
        .from(leads);
      const totalLeads = Number(leadsRow?.total || 0);
      const convertedLeads = Number(leadsRow?.converted || 0);

      // 2. Visits metrics
      const [visitsRow] = await db
        .select({
          total: sql`COUNT(*)::integer`,
          completed: sql`COUNT(CASE WHEN ${fieldVisits.status} IN ('Completed', 'completed') THEN 1 END)::integer`,
          today: sql`COUNT(CASE WHEN DATE(${fieldVisits.plannedDate}) = DATE(NOW()) THEN 1 END)::integer`,
        })
        .from(fieldVisits);
      const totalVisits = Number(visitsRow?.total || 0);
      const completedVisits = Number(visitsRow?.completed || 0);

      // 3. Tasks metrics
      const [tasksRow] = await db
        .select({
          total: sql`COUNT(*)::integer`,
          completed: sql`COUNT(CASE WHEN ${marketingTasks.status} = 'completed' THEN 1 END)::integer`,
          pending: sql`COUNT(CASE WHEN ${marketingTasks.status} = 'pending' THEN 1 END)::integer`,
          today: sql`COUNT(CASE WHEN DATE(${marketingTasks.dueDate}) = DATE(NOW()) THEN 1 END)::integer`,
          overdue: sql`COUNT(CASE WHEN ${marketingTasks.status} != 'completed' AND ${marketingTasks.dueDate} < NOW() THEN 1 END)::integer`,
        })
        .from(marketingTasks);
      const totalTasks = Number(tasksRow?.total || 0);
      const completedTasks = Number(tasksRow?.completed || 0);

      res.json({
        leads: {
          total: totalLeads,
          active: Number(leadsRow?.active || 0),
          converted: convertedLeads,
          conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
          monthlyNew: Number(leadsRow?.monthlyNew || 0),
          pendingFollowUps: 0,
        },
        visits: {
          total: totalVisits,
          completed: completedVisits,
          today: Number(visitsRow?.today || 0),
          successRate: totalVisits > 0 ? (completedVisits / totalVisits) * 100 : 0,
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          pending: Number(tasksRow?.pending || 0),
          today: Number(tasksRow?.today || 0),
          overdue: Number(tasksRow?.overdue || 0),
          completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        },
        attendance: {
          totalEmployees: 0,
          presentToday: 0,
        },
      });
    } catch (e) {
      console.error("Error fetching marketing dashboard data:", e);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  app.get("/api/marketing/leads/metrics", requireAuth, async (_req, res) => {
    try {
      const [row] = await db
        .select({
          total: sql`COUNT(*)::integer`,
          active: sql`COUNT(CASE WHEN ${leads.status} IN ('new','contacted','in_progress') THEN 1 END)::integer`,
          converted: sql`COUNT(CASE WHEN ${leads.status} = 'converted' THEN 1 END)::integer`,
          monthlyNew: sql`COUNT(CASE WHEN EXTRACT(MONTH FROM ${leads.createdAt}) = EXTRACT(MONTH FROM NOW()) THEN 1 END)::integer`,
        })
        .from(leads);
      const total = Number(row?.total || 0);
      const converted = Number(row?.converted || 0);
      res.json({
        total,
        active: Number(row?.active || 0),
        converted,
        conversionRate: total > 0 ? (converted / total) * 100 : 0,
        monthlyNew: Number(row?.monthlyNew || 0),
        pendingFollowUps: 0,
      });
    } catch (e) {
      res.json({
        total: 0,
        active: 0,
        converted: 0,
        conversionRate: 0,
        monthlyNew: 0,
        pendingFollowUps: 0,
      });
    }
  });

  app.get("/api/field-visits/metrics", requireAuth, async (_req, res) => {
    try {
      const [row] = await db
        .select({
          total: sql`COUNT(*)::integer`,
          completed: sql`COUNT(CASE WHEN ${fieldVisits.status} = 'completed' THEN 1 END)::integer`,
          today: sql`COUNT(CASE WHEN DATE(${fieldVisits.plannedDate}) = DATE(NOW()) THEN 1 END)::integer`,
        })
        .from(fieldVisits);
      res.json({
        total: Number(row?.total || 0),
        completed: Number(row?.completed || 0),
        today: Number(row?.today || 0),
      });
    } catch (e) {
      res.json({ total: 0, completed: 0, today: 0 });
    }
  });

  app.get("/api/marketing/conversion-rates", requireAuth, async (_req, res) => {
    try {
      const [row] = await db
        .select({
          total: sql`COUNT(*)::integer`,
          converted: sql`COUNT(CASE WHEN ${leads.status} = 'converted' THEN 1 END)::integer`,
        })
        .from(leads);
      const total = Number(row?.total || 0);
      const converted = Number(row?.converted || 0);
      res.json({ conversionRate: total > 0 ? (converted / total) * 100 : 0 });
    } catch (e) {
      res.json({ conversionRate: 0 });
    }
  });

  app.get(
    "/api/marketing/visit-success-rates",
    requireAuth,
    async (_req, res) => {
      try {
        const [row] = await db
          .select({
            total: sql`COUNT(*)::integer`,
            completed: sql`COUNT(CASE WHEN ${fieldVisits.status} = 'completed' THEN 1 END)::integer`,
          })
          .from(fieldVisits);
        const total = Number(row?.total || 0);
        const completed = Number(row?.completed || 0);
        res.json({ successRate: total > 0 ? (completed / total) * 100 : 0 });
      } catch (e) {
        res.json({ successRate: 0 });
      }
    }
  );

  app.get("/api/marketing/team-performance", requireAuth, async (_req, res) => {
    try {
      const rows = await db
        .select({
          userId: marketingTasks.assignedToUserId,
          completed: sql`COUNT(CASE WHEN ${marketingTasks.status} = 'completed' THEN 1 END)::integer`,
        })
        .from(marketingTasks)
        .groupBy(marketingTasks.assignedToUserId);
      res.json(rows);
    } catch (e) {
      res.json([]);
    }
  });

  app.get("/api/marketing/leads", requireAuth, async (req, res) => {
    try {
      const { status, source, priority, assignedTo, search } = req.query;

      // Start query with join to get assignee information
      let query = db
        .select({
          lead: leads,
          assignee: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
          },
        })
        .from(leads)
        .leftJoin(users, eq(leads.assignedTo, users.id));

      // Optional filters
      if (status && status !== "all") {
        query = query.where(sql`${leads.status} ILIKE ${status as string}`);
      }
      if (source && source !== "all") {
        query = query.where(eq(leads.source, source as string));
      }
      if (priority && priority !== "all") {
        query = query.where(eq(leads.priority, priority as string));
      }
      if (assignedTo && assignedTo !== "all") {
        query = query.where(eq(leads.assignedTo, assignedTo as string));
      }
      if (search) {
        query = query.where(
          sql`${leads.firstName} ILIKE ${"%" + search + "%"} OR ${
            leads.lastName
          } ILIKE ${"%" + search + "%"}`
        );
      }

      const rows = await query;

      // Format response to match LeadWithAssignee interface
      const leadsWithAssignee = rows.map((row) => ({
        ...row.lead,
        assignee: row.assignee?.id ? row.assignee : null,
      }));

      res.json(leadsWithAssignee);
    } catch (err) {
      console.error("Error fetching leads:", err);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.post("/api/marketing/leads", requireAuth, async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        companyName,
        email,
        phone,
        alternatePhone,
        address,
        city,
        state,
        zipCode,
        country,
        source,
        sourceDetails,
        referredBy,
        requirementDescription,
        estimatedBudget,
        priority,
        assignedTo,
        followUpDate,
        expectedClosingDate,
        notes,
      } = req.body;

      const validSources = [
        "other",
        "referral",
        "website",
        "email",
        "social_media",
        "advertisement",
        "trade_show",
        "cold_call",
        "email_campaign",
      ];
      const leadSource = validSources.includes(source) ? source : "other";

      const [newLead] = await db
        .insert(leads)
        .values({
          firstName,
          lastName,
          companyName: companyName || null,
          email,
          phone,
          alternatePhone: alternatePhone || null,
          address: address || null,
          city: city || null,
          state: state || null,
          zipCode: zipCode || null,
          country: country || "India",
          source: leadSource,
          sourceDetails: sourceDetails || null,
          referredBy: referredBy || null,
          requirementDescription: requirementDescription || null,
          estimatedBudget: estimatedBudget ? parseFloat(estimatedBudget) : null,
          priority: priority || "medium",
          assignedTo: assignedTo || null,
          followUpDate: followUpDate ? new Date(followUpDate) : null,
          expectedClosingDate: expectedClosingDate
            ? new Date(expectedClosingDate)
            : null,
          notes: notes || null,
          createdBy: req.user!.id,
          assignedBy: req.user!.id,
        })
        .returning();

      // AUTO-CREATE MARKETING TASK
      if (newLead.assignedTo) {
        try {
          await db.insert(marketingTasks).values({
            title: `Newly Created Lead: ${newLead.firstName} ${newLead.lastName}`,
            description: `You have been assigned a lead from ${newLead.companyName || "Unknown Company"}. Please review and initiate contact.`,
            type: "follow_up",
            assignedTo: newLead.assignedTo as string,
            assignedBy: req.user!.id,
            createdBy: req.user!.id,
            priority: (newLead.priority as any) || "medium",
            status: "pending",
            dueDate: newLead.followUpDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            leadId: newLead.id,
          });
          console.log(`✅ Auto-created assignment task for new lead ${newLead.id} assigned to ${newLead.assignedTo}`);
        } catch (taskError) {
          console.error("⚠️ Failed to auto-create assignment task for new lead:", taskError);
        }
      }

      res.status(201).json({ message: "Lead created", lead: newLead });
    } catch (err) {
      console.error("Error creating lead:", err);
      res.status(500).json({ error: "Failed to create lead" });
    }
  });

  app.put("/api/marketing/leads/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const {
        firstName,
        lastName,
        companyName,
        email,
        phone,
        alternatePhone,
        address,
        city,
        state,
        zipCode,
        country,
        source,
        sourceDetails,
        referredBy,
        requirementDescription,
        estimatedBudget,
        priority,
        assignedTo,
        followUpDate,
        expectedClosingDate,
        notes,
      } = req.body;

      const [existingLead] = await db
        .select()
        .from(leads)
        .where(eq(leads.id, id))
        .limit(1);

      if (!existingLead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      const [updatedLead] = await db
        .update(leads)
        .set({
          firstName,
          lastName,
          companyName: companyName || null,
          email,
          phone,
          alternatePhone: alternatePhone || null,
          address: address || null,
          city: city || null,
          state: state || null,
          zipCode: zipCode || null,
          country: country || "India",
          source,
          sourceDetails: sourceDetails || null,
          referredBy: referredBy || null,
          requirementDescription: requirementDescription || null,
          estimatedBudget: estimatedBudget ? parseFloat(estimatedBudget) : null,
          priority: priority || "medium",
          assignedTo: assignedTo || null,
          followUpDate: followUpDate ? new Date(followUpDate) : null,
          expectedClosingDate: expectedClosingDate
            ? new Date(expectedClosingDate)
            : null,
          notes: notes || null,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, id))
        .returning();

      // AUTO-CREATE MARKETING TASK: If lead was newly assigned or reassigned
      if (updatedLead.assignedTo && updatedLead.assignedTo !== existingLead.assignedTo) {
        try {
          await db.insert(marketingTasks).values({
            title: `Newly Assigned Lead: ${updatedLead.firstName} ${updatedLead.lastName}`,
            description: `You have been assigned a lead from ${updatedLead.companyName || "Unknown Company"}. Please review and initiate contact.`,
            type: "follow_up",
            assignedTo: updatedLead.assignedTo as string,
            assignedBy: req.user!.id,
            createdBy: req.user!.id,
            priority: (updatedLead.priority as any) || "medium",
            status: "pending",
            dueDate: updatedLead.followUpDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            leadId: updatedLead.id,
          });
          console.log(`✅ Auto-created assignment task for lead ${updatedLead.id} assigned to ${updatedLead.assignedTo}`);
        } catch (taskError) {
          console.error("⚠️ Failed to auto-create assignment task for lead:", taskError);
        }
      }

      res.json(updatedLead);
    } catch (err) {
      console.error("Error updating lead:", err);
      res.status(500).json({ error: "Failed to update lead" });
    }
  });

  app.delete("/api/marketing/leads/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      // Use a transaction to delete all related data
      const [deletedLead] = await db.transaction(async (tx) => {
        // 1. Delete related marketing tasks
        await tx
          .delete(marketingTasks)
          .where(eq(marketingTasks.leadId, id));

        // 2. Delete related field visits
        await tx
          .delete(fieldVisits)
          .where(eq(fieldVisits.leadId, id));

        // 3. Delete the lead itself
        const [result] = await tx
          .delete(leads)
          .where(eq(leads.id, id))
          .returning();

        return [result];
      });

      if (!deletedLead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      res.json({ message: "Lead deleted successfully" });
    } catch (err) {
      console.error("Error deleting lead:", err);
      res.status(500).json({ error: "Failed to delete lead" });
    }
  });

  app.put("/api/marketing/leads/:id/status", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const [updatedLead] = await db
        .update(leads)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, id))
        .returning();

      if (!updatedLead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      res.json(updatedLead);
    } catch (err) {
      console.error("Error updating lead status:", err);
      res.status(500).json({ error: "Failed to update lead status" });
    }
  });

  app.post("/api/marketing/leads/:id/convert", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      // 1. Get lead data
      const [lead] = await db.select().from(leads).where(eq(leads.id, id));

      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      if (lead.status === "converted") {
        return res.status(400).json({ error: "Lead is already converted" });
      }

      // 2. Create customer from lead data
      const [newCustomer] = await db
        .insert(customers)
        .values({
          name: `${lead.firstName} ${lead.lastName}`,
          company: lead.companyName || null,
          email: lead.email || null,
          phone: lead.phone || null,
          contactPerson: `${lead.firstName} ${lead.lastName}`,
          address: lead.address || null,
          city: lead.city || null,
          state: lead.state || null,
          zipCode: lead.zipCode || null,
          country: lead.country || "India",
        })
        .returning();

      // 3. Update lead status
      const [updatedLead] = await db
        .update(leads)
        .set({
          status: "converted",
          updatedAt: new Date(),
        })
        .where(eq(leads.id, id))
        .returning();

      res.json({
        message: "Lead converted to customer successfully",
        customer: newCustomer,
        lead: updatedLead,
      });
    } catch (err) {
      console.error("Error converting lead:", err);
      res.status(500).json({ error: "Failed to convert lead" });
    }
  });

  app.get("/api/marketing-tasks/metrics", requireAuth, async (_req, res) => {
    try {
      const [row] = await db
        .select({
          total: sql`COUNT(*)::integer`,
          completed: sql`COUNT(CASE WHEN ${marketingTasks.status} = 'completed' THEN 1 END)::integer`,
          pending: sql`COUNT(CASE WHEN ${marketingTasks.status} = 'pending' THEN 1 END)::integer`,
        })
        .from(marketingTasks);
      res.json({
        total: Number((row as any)?.total || 0),
        completed: Number((row as any)?.completed || 0),
        pending: Number((row as any)?.pending || 0),
      });
    } catch (e) {
      res.json({ total: 0, completed: 0, pending: 0 });
    }
  });

  // Lists to avoid 404s where UI expects data
  app.get("/api/leads", requireAuth, async (_req, res) => {
    try {
      const rows = await db
        .select({
          id: leads.id,
          firstName: leads.firstName,
          lastName: leads.lastName,
          companyName: leads.companyName,
          email: leads.email,
          phone: leads.phone,
          alternatePhone: leads.alternatePhone,
          address: leads.address,
          city: leads.city,
          state: leads.state,
          zipCode: leads.zipCode,
          country: leads.country,
          source: leads.source,
          sourceDetails: leads.sourceDetails,
          referredBy: leads.referredBy,
          requirementDescription: leads.requirementDescription,
          estimatedBudget: leads.estimatedBudget,
          assignedTo: leads.assignedTo,
          status: leads.status,
          priority: leads.priority,
          createdAt: leads.createdAt,
          followUpDate: leads.followUpDate,
        })
        .from(leads);

      res.json(rows);
    } catch (e) {
      console.error("Error fetching leads:", e);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.get(["/api/field-visits", "/api/marketing/field-visits"], requireAuth, async (req, res) => {
    try {
      const { leadId } = req.query;
      const assignedToAlias = aliasedTable(users, "assignedToUser");
      const assignedByAlias = aliasedTable(users, "assignedByUser");

      let query = db
        .select({
          visit: fieldVisits,
          lead: {
            id: leads.id,
            firstName: leads.firstName,
            lastName: leads.lastName,
            companyName: leads.companyName,
            status: leads.status,
            estimatedBudget: leads.estimatedBudget,
          },
          assignedToUser: {
            id: assignedToAlias.id,
            firstName: assignedToAlias.firstName,
            lastName: assignedToAlias.lastName,
          },
          assignedByUser: {
            id: assignedByAlias.id,
            firstName: assignedByAlias.firstName,
            lastName: assignedByAlias.lastName,
          },
        })
        .from(fieldVisits)
        .leftJoin(leads, eq(fieldVisits.leadId, leads.id))
        .leftJoin(assignedToAlias, eq(fieldVisits.assignedTo, assignedToAlias.id))
        .leftJoin(assignedByAlias, eq(fieldVisits.assignedBy, assignedByAlias.id));

      if (leadId && typeof leadId === "string") {
        query = query.where(eq(fieldVisits.leadId, leadId)) as any;
      }

      const rows = await query.orderBy(desc(fieldVisits.createdAt));

      // Map status to lowercase/underscore for frontend compatibility
      const statusMap: Record<string, string> = {
        Scheduled: "scheduled",
        "In Progress": "in_progress",
        Completed: "completed",
        Cancelled: "cancelled",
      };
      const mappedRows = rows.map((r) => ({
        ...r.visit,
        lead: r.lead.id ? r.lead : null,
        assignedToUser: r.assignedToUser.id ? r.assignedToUser : null,
        assignedByUser: r.assignedByUser.id ? r.assignedByUser : null,
        status:
          statusMap[r.visit.status] ||
          r.visit.status?.toLowerCase().replace(/\s+/g, "_") ||
          r.visit.status,
      }));
      res.json(mappedRows);
    } catch (e) {
      console.error("Error fetching field visits:", e);
      res.json([]);
    }
  });
  app.post(["/api/field-visits", "/api/marketing/field-visits"], requireAuth, async (req, res) => {
    try {
      const {
        leadId,
        plannedDate,
        plannedStartTime,
        plannedEndTime,
        assignedTo,
        visitAddress,
        visitCity,
        visitState,
        latitude,
        longitude,
        preVisitNotes,
        purpose,
        travelExpense,
        status,
      } = req.body;

      if (!leadId || !plannedDate || !assignedTo || !visitAddress) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Generate visitNumber dynamically
      const visitNumber = `VISIT-${Date.now()}`;

      const [newVisit] = await db
        .insert(fieldVisits)
        .values({
          visitNumber,
          leadId,
          plannedDate: new Date(plannedDate),
          plannedStartTime: plannedStartTime
            ? new Date(plannedStartTime)
            : null,
          plannedEndTime: plannedEndTime ? new Date(plannedEndTime) : null,
          assignedTo,
          assignedBy: (req as any).user.id,
          createdBy: (req as any).user.id,
          visitAddress,
          visitCity: visitCity || null,
          visitState: visitState || null,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          preVisitNotes: preVisitNotes || null,
          purpose: purpose || null,
          travelExpense: travelExpense ? parseFloat(travelExpense) : null,
          status: status || "Scheduled",
        })
        .returning();

      // Update lead budget if provided
      if (req.body.estimatedBudget !== undefined && leadId) {
        await db.update(leads)
          .set({ estimatedBudget: req.body.estimatedBudget === "" ? null : req.body.estimatedBudget })
          .where(eq(leads.id, leadId));
      }

      res.status(201).json({ message: "Field visit created", visit: newVisit });
    } catch (err) {
      console.error("Error creating field visit:", err);
      res.status(500).json({ error: "Something went wrong" });
    }
  });
  // Update Visit Status
  app.patch(
    "/api/field-visits/:visitNumber/status",
    requireAuth,
    async (req, res) => {
      try {
        const { visitNumber } = req.params;
        const { status } = req.body;

        // Allowed status values
        const allowedStatus = [
          "Scheduled",
          "In Progress",
          "Completed",
          "Cancelled",
        ];

        if (!status || !allowedStatus.includes(status)) {
          return res.status(400).json({
            error: `Invalid status. Allowed values: ${allowedStatus.join(
              ", "
            )}`,
          });
        }

        // Update the status in the DB
        const [updatedVisit] = await db
          .update(fieldVisits)
          .set({ status })
          .where(eq(fieldVisits.visitNumber, visitNumber))
          .returning();

        if (!updatedVisit) {
          return res.status(404).json({ error: "Field visit not found" });
        }

        res
          .status(200)
          .json({ message: "Visit status updated", visit: updatedVisit });
      } catch (err) {
        console.error("Error updating visit status:", err);
        res.status(500).json({ error: "Something went wrong" });
      }
    }
  );

  app.get("/api/marketing-tasks", requireAuth, async (req, res) => {
    try {
      const filters: any = req.query;
      const conditions = [];

      let query = db
        .select({
          task: marketingTasks,
          assignedToUser: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            username: users.username,
          },
          lead: {
            id: leads.id,
            firstName: leads.firstName,
            lastName: leads.lastName,
            companyName: leads.companyName,
          }
        })
        .from(marketingTasks)
        .leftJoin(users, eq(marketingTasks.assignedTo, users.id))
        .leftJoin(leads, eq(marketingTasks.leadId, leads.id));

      if (filters.status && filters.status !== "all") {
        conditions.push(eq(marketingTasks.status, filters.status));
      }

      if (filters.assignedTo && filters.assignedTo !== "all") {
        conditions.push(eq(marketingTasks.assignedTo, filters.assignedTo));
      }

      // SECURITY: Apply user-based scoping based on role
      if (req.user!.role !== "admin" && req.user!.role !== "manager") {
        conditions.push(
          sql`(${marketingTasks.createdBy} = ${req.user!.id} OR 
               ${marketingTasks.assignedTo} = ${req.user!.id})`
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const rows = await query.orderBy(desc(marketingTasks.createdAt));
      
      const tasks = rows.map(r => ({
        ...r.task,
        assignedToUser: r.assignedToUser,
        lead: r.lead
      }));

      res.json(tasks);
    } catch (e) {
      console.error("Error fetching marketing tasks:", e);
      res.json([]);
    }
  });

  // Basic health check route
  app.get("/api/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });
  // app.get("/api/tasks", (req: Request, res: Response) => {
  //   res.json({ message: "List of tasks", tasks: [] });
  // });

  // // POST /api/tasks -> create a task
  // app.post("/api/tasks", (req: Request, res: Response) => {
  //   const task = req.body;
  //   res.status(201).json({ message: "Task created", task });
  // });
  app.get("/api/inventory-tasks", async (_req: Request, res: Response) => {
    try {
      const tasks = await db.select().from(inventoryTasks);
      res.status(200).json(tasks);
    } catch (err) {
      console.error("Error fetching inventory tasks:", err);
      res.status(500).json({ error: "Failed to fetch inventory tasks" });
    }
  });

  // Create Inventory Task
  // Allowed enums
  const validStatuses = ["pending", "in_progress", "completed", "cancelled"];
  const validPriorities = ["low", "medium", "high", "urgent"];

  app.post("/api/inventory-tasks", async (req: Request, res: Response) => {
    try {
      const {
        title,
        description,
        assignedTo,
        priority,
        dueDate,
        category,
        productId,
        sparePartId,
        batchId,
        fabricationOrderId,
        expectedQuantity,
        actualQuantity,
        fromLocation,
        toLocation,
        notes,
        attachmentPath,
      } = req.body;

      // Hardcoded assignedBy (replace with logged-in user in real app)
      const assignedBy = "b34e3723-ba42-402d-b454-88cf96340573";

      // Validate required fields
      if (!title || !assignedTo || !assignedBy) {
        return res.status(400).json({
          error: "title, assignedTo, and assignedBy are required",
        });
      }

      // Validate UUIDs
      if (!isUuid(assignedTo) || !isUuid(assignedBy)) {
        return res
          .status(400)
          .json({ error: "assignedTo and assignedBy must be valid UUIDs" });
      }

      // Map API status to enum
      let status = req.body.status || "pending";
      if (status === "new") status = "pending";
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }

      // Validate priority
      const taskPriority = validPriorities.includes(priority)
        ? priority
        : "medium";

      const [newTask] = await db
        .insert("inventory_tasks")
        .values({
          title,
          description: description || null,
          assignedTo,
          assignedBy,
          status,
          priority: taskPriority,
          category: category || null,
          productId: productId || null,
          sparePartId: sparePartId || null,
          batchId: batchId || null,
          fabricationOrderId: fabricationOrderId || null,
          expectedQuantity: expectedQuantity || null,
          actualQuantity: actualQuantity || null,
          fromLocation: fromLocation || null,
          toLocation: toLocation || null,
          dueDate: dueDate ? new Date(dueDate) : null,
          completedDate: null,
          notes: notes || null,
          attachmentPath: attachmentPath || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning("*");

      res
        .status(201)
        .json({ message: "Inventory task created", task: newTask });
    } catch (err: any) {
      console.error("Error creating inventory task:", err);
      res.status(500).json({
        error: "Failed to create inventory task",
        details: err.message,
      });
    }
  });
  // GET /api/tasks -> fetch all tasks
  app.get("/api/tasks", async (_req: Request, res: Response) => {
    try {
      const assigneeAlias = aliasedTable(users, "assignee");
      const assignerAlias = aliasedTable(users, "assigner");

      const rows = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          description: tasks.description,
          status: tasks.status,
          priority: tasks.priority,
          dueDate: tasks.dueDate,
          createdAt: tasks.createdAt,
          updatedAt: tasks.updatedAt,
          assignee: {
            id: assigneeAlias.id,
            firstName: assigneeAlias.firstName,
            lastName: assigneeAlias.lastName,
            username: assigneeAlias.username,
          },
          assigner: {
            id: assignerAlias.id,
            firstName: assignerAlias.firstName,
            lastName: assignerAlias.lastName,
            username: assignerAlias.username,
          },
        })
        .from(tasks)
        .leftJoin(assigneeAlias, eq(tasks.assignedTo, assigneeAlias.id))
        .leftJoin(assignerAlias, eq(tasks.assignedBy, assignerAlias.id));
      res.json(rows);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req: Request, res: Response) => {
    try {
      const { title, description, assignedTo, priority, dueDate } = req.body;

      // Hardcode assignedBy to the logged-in user or a fixed UUID
      const assignedBy = "b34e3723-ba42-402d-b454-88cf96340573"; // Sanika

      // Validate assignedTo UUID
      if (!isUuid(assignedTo)) {
        return res
          .status(400)
          .json({ error: "assignedTo must be a valid user ID" });
      }

      // Normalize enums
      const normalizedPriority = priority?.toLowerCase() || "medium";
      const normalizedStatus = "new"; // default for tasks

      const validPriorities = ["low", "medium", "high"];
      if (!validPriorities.includes(normalizedPriority)) {
        return res.status(400).json({ error: "Invalid priority" });
      }

      const [newTask] = await db
        .insert(tasks)
        .values({
          title,
          description,
          status: normalizedStatus,
          priority: normalizedPriority,
          assignedTo,
          assignedBy,
          dueDate: dueDate ? new Date(dueDate) : null,
        })
        .returning({
          id: tasks.id,
          title: tasks.title,
          description: tasks.description,
          status: tasks.status,
          priority: tasks.priority,
          assignedTo: tasks.assignedTo,
          assignedBy: tasks.assignedBy,
          dueDate: tasks.dueDate,
          createdAt: tasks.createdAt,
          updatedAt: tasks.updatedAt,
        });

      res.status(201).json({ message: "Task created", task: newTask });
    } catch (err: any) {
      console.error("Error creating task:", err);
      res.status(500).json({
        error: "Failed to create task",
        details: err.message,
      });
    }
  });

  app.put("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, description, assignedTo, priority, status, dueDate } =
        req.body;

      const [updatedTask] = await db
        .update(tasks)
        .set({
          title,
          description,
          assignedTo,
          priority,
          status,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, id))
        .returning();

      if (!updatedTask) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.json({ message: "Task updated", task: updatedTask });
    } catch (err: any) {
      console.error("Error updating task:", err);
      res
        .status(500)
        .json({ error: "Failed to update task", details: err.message });
    }
  });

  // Register additional routes from registries
  console.log("🚀 Initializing registries...");
  registerAdminRoutes(app, { requireAuth });
  registerAccountsRoutes(app);
  registerMarketingRoutes(app, {
    requireAuth,
    requireMarketingAccess,
    checkOwnership,
  });
  registerLogisticsRoutes(app, {
    requireAuth,
  });
  registerInventoryRoutes(app, {
    requireAuth,
  });

  console.log("🛒 Initializing sales registries...");
  registerSalesRoutes(app, { requireAuth });
  registerSalesOrderRoutes(app, { requireAuth });

  registerFileUploadRoutes(app, requireAuth);
  registerTourRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
