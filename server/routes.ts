import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
// Removed unused schema imports from @shared/schema to avoid runtime errors
import { z } from "zod";
import { db } from "./db";
import { sql, eq, and, gte, lt } from "drizzle-orm";
import { validate as isUuid } from "uuid";
import { users } from "../shared/schema";
import { tasks } from "../shared/schema"; // adjust path if needed
import { validate as isUuid } from "uuid";

// make sure users table is also imported

import {
  users as usersTable,
  leads,
  marketingTasks,
  fieldVisits,
  marketingAttendance,
  logisticsShipments,
  logisticsTasks,
  deliveries,
  suppliers,
  logisticsAttendance,
  logisticsLeaveRequests,
  vendorCommunications,
  outboundQuotations,
  inboundQuotations,
  invoices,
  leaveRequests as leaveRequestsTable,
  insertOutboundQuotationSchema,
} from "@shared/schema";
import { sql, eq, and, gte, lt } from "drizzle-orm";

// Login schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

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
  };
}

// SECURE authentication middleware - NEVER trust client-supplied identity headers
const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // DEVELOPMENT MODE BYPASS: Skip authentication completely in development
    if (process.env.NODE_ENV === "development") {
      // Set a default admin user for development
      req.user = {
        id: "dev-admin-user",
        role: "admin",
        username: "dev_admin",
      };
      next();
      return;
    }

    // SECURITY FIX: Reject any client-supplied identity headers to prevent spoofing
    if (req.headers["x-user-id"]) {
      res.status(401).json({
        error: "Security violation",
        message: "Client identity headers are not allowed for security reasons",
      });
      return;
    }

    const authHeader = req.headers.authorization;

    if (!authHeader) {
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
        };
        next();
        return;
      } catch (jwtError) {
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
      const { insertCustomerSchema } = await import("@shared/schema");
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
  // Normalize accidental double /api prefix from client (e.g., /api/api/...)
  app.use((req, _res, next) => {
    let u = req.url;
    // Fix double API prefixes and missing slash variants
    if (u.startsWith("/api/api/")) u = u.replace("/api/api/", "/api/");
    if (u === "/api/api") u = "/api";
    if (u.startsWith("/apiapi/")) u = u.replace("/apiapi/", "/api/");
    if (u.startsWith("/api%20")) u = u.replace("/api%20", "/api"); // handle stray encoded spaces
    // Strip trailing encoded spaces
    u = u.replace(/%20+$/g, "");
    req.url = u;
    next();
  });

  // Authentication endpoints (public routes)
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("🔐 Login attempt received for username:", req.body.username);

      const { username, email, password } = req.body;
      if (!username && !email) {
        return res.status(400).json({ error: "Username or email is required" });
      }
      console.log("✅ Login data parsed successfully:", { username, email });

      const user = await storage.findUserByUsernameOrEmail(
        username || "",
        email || ""
      );
      console.log(
        "👤 User lookup result:",
        user ? `Found user: ${user.username} (${user.role})` : "No user found"
      );

      if (!user || !user.isActive) {
        console.log("❌ Login failed: Invalid user or inactive account");
        return res.status(401).json({ error: "Invalid credentials" });
      }

      console.log("🔑 Comparing passwords...");
      const validPassword = await bcrypt.compare(password, user.password);
      console.log(
        "🔐 Password comparison result:",
        validPassword ? "Valid" : "Invalid"
      );

      if (!validPassword) {
        console.log("❌ Login failed: Invalid password");
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const jwtSecret = process.env.JWT_SECRET;
      const devTokenSecret = process.env.DEV_TOKEN_SECRET;
      const tokenSecret = jwtSecret || devTokenSecret;

      console.log("🔒 Authentication secret status:", {
        jwt: jwtSecret ? "Available" : "Missing",
        dev: devTokenSecret ? "Available" : "Missing",
        using: jwtSecret ? "JWT_SECRET" : "DEV_TOKEN_SECRET",
      });

      if (!tokenSecret) {
        console.error(
          "❌ CRITICAL: Neither JWT_SECRET nor DEV_TOKEN_SECRET is available"
        );
        throw new Error(
          "Authentication secret is required (JWT_SECRET or DEV_TOKEN_SECRET)"
        );
      }

      console.log("🎫 Generating JWT token...");
      const token = jwt.sign(
        { sub: user.id, role: user.role, username: user.username },
        tokenSecret,
        { expiresIn: "15m", algorithm: "HS256" }
      );

      console.log("✅ Login successful for user:", user.username);
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
      console.error("💥 Login error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : typeof error,
      });

      if (error instanceof z.ZodError) {
        console.log("📝 Validation error:", error.errors);
        return res
          .status(400)
          .json({ error: "Invalid input", details: error.errors });
      }

      console.error("❌ Unexpected login error:", error);
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
            case "marketingAttendance":
              entity = await storage.getMarketingAttendance(req.params.id);
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
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.json([]);
    }
  });

  // Suppliers CRUD
  app.get("/api/suppliers", requireAuth, async (_req, res) => {
    try {
      const rows = await storage.getSuppliers();
      res.json(rows);
    } catch (e) {
      res.json([]);
    }
  });

  app.post("/api/suppliers", requireAuth, async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error: any) {
      res.status(400).json({
        error: "Invalid supplier data",
        details: error.errors || error.message,
      });
    }
  });

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
  app.get("/api/vendor-communications", requireAuth, async (_req, res) => {
    try {
      const rows = await db.select().from(vendorCommunications);
      res.json(rows);
    } catch (e) {
      res.json([]);
    }
  });

  // Stock transactions (stubbed)
  app.get("/api/stock-transactions", requireAuth, async (_req, res) => {
    // TODO: implement when stockTransactions table is added
    res.json([]);
  });

  // Reorder points (stubbed)
  app.get("/api/reorder-points", requireAuth, async (_req, res) => {
    // TODO: implement when reorderPoints table is added
    res.json([]);
  });

  // Inventory tasks (in-memory for now)
  app.get("/api/inventory-tasks", requireAuth, async (_req, res) => {
    try {
      // Return most recent first
      const rows = [...inMemoryInventoryTasks].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      res.json(rows);
    } catch (e) {
      res.json([]);
    }
  });

  // Create inventory task
  app.post(
    "/api/inventory-tasks",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const body = req.body || {};
        const title = typeof body.title === "string" ? body.title.trim() : "";
        if (!title) {
          res.status(400).json({ error: "title is required" });
          return;
        }
        const description =
          typeof body.description === "string" ? body.description.trim() : "";
        const assignedTo =
          typeof body.assignedTo === "string" ? body.assignedTo.trim() : "";
        const priority =
          typeof body.priority === "string" ? body.priority : "medium";
        const category =
          typeof body.category === "string" ? body.category : "general";
        const dueDate = body.dueDate
          ? new Date(body.dueDate).toISOString()
          : new Date().toISOString();

        const rec = {
          id: "task-" + Date.now(),
          title,
          description,
          assignedTo,
          status: "new",
          priority,
          dueDate,
          category,
          createdAt: new Date().toISOString(),
          createdBy: req.user?.id || null,
          notes: "",
          timeSpent: null,
          completedAt: null,
        };

        inMemoryInventoryTasks.push(rec);
        res.status(201).json(rec);
      } catch (e) {
        res.status(500).json({ error: "Failed to create task" });
      }
    }
  );

  // Update inventory task status/details
  app.put(
    "/api/inventory-tasks/:id",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const id = String(req.params.id);
        const idx = inMemoryInventoryTasks.findIndex(
          (t) => String(t.id) === id
        );
        if (idx === -1) {
          res.status(404).json({ error: "Task not found" });
          return;
        }
        const body = req.body || {};
        const patch: any = {};
        if (typeof body.status === "string") patch.status = body.status;
        if (typeof body.notes === "string") patch.notes = body.notes;
        if (body.timeSpent != null && !Number.isNaN(Number(body.timeSpent)))
          patch.timeSpent = Number(body.timeSpent);
        if (body.completedAt != null)
          patch.completedAt = body.completedAt
            ? new Date(body.completedAt).toISOString()
            : null;
        patch.updatedAt = new Date().toISOString();

        inMemoryInventoryTasks[idx] = {
          ...inMemoryInventoryTasks[idx],
          ...patch,
        };
        res.json(inMemoryInventoryTasks[idx]);
      } catch (e) {
        res.status(500).json({ error: "Failed to update task" });
      }
    }
  );

  // File uploads (generic upload URL)
  app.post("/api/objects/upload", requireAuth, async (_req, res) => {
    try {
      const objectStorage = new ObjectStorageService();
      const uploadURL = await objectStorage.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (e) {
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.post("/api/outbound-quotations", requireAuth, async (req, res) => {
    try {
      const { insertOutboundQuotationSchema } = await import("@shared/schema");
      const data = insertOutboundQuotationSchema
        .partial({ customerId: true })
        .parse(req.body); // ← allow optional customerId
      const quotation = await storage.insertOutboundQuotationSchema(data);
      res.status(201).json(quotation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid quotation data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create quotation" });
    }
  });

  // Quotations and invoices lists
  app.get("/api/outbound-quotations", requireAuth, async (_req, res) => {
    try {
      const rows = await db.select().from(outboundQuotations);
      res.json(rows);
    } catch (e) {
      res.json([]);
    }
  });

  app.get("/api/inbound-quotations", requireAuth, async (_req, res) => {
    try {
      const rows = await db.select().from(inboundQuotations);
      res.json(rows);
    } catch (e) {
      res.json([]);
    }
  });

  // Alias: /api/quotations/inbound → inbound quotations
  app.get("/api/quotations/inbound", requireAuth, async (_req, res) => {
    try {
      const rows = await db.select().from(inboundQuotations);
      res.json(rows);
    } catch (e) {
      res.json([]);
    }
  });

  app.get("/api/invoices", requireAuth, async (_req, res) => {
    try {
      const rows = await db.select().from(invoices);
      res.json(rows);
    } catch (e) {
      res.json([]);
    }
  });

  // Purchase orders (stub)
  app.get("/api/purchase-orders", requireAuth, async (_req, res) => {
    res.json([]);
  });

  // Dashboard/Activities/Orders basic stubs for frontend expectations
  app.get("/api/dashboard/metrics", (_req, res) => {
    res.json({ totalUsers: 0, totalSales: 0, totalOrders: 0 });
  });

  // Marketing leave request - always available with DB fallback
  app.post(
    "/api/marketing-attendance/leave-request",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { leaveType, startDate, endDate, reason } = req.body || {};
        if (!leaveType || !startDate || !endDate || !reason) {
          res.status(400).json({ error: "Missing required fields" });
          return;
        }
        // Try DB insert first
        try {
          const userIdVal = Number(req.user!.id);
          const [row] = await db
            .insert(leaveRequestsTable)
            .values({
              userId: Number.isFinite(userIdVal) ? userIdVal : null,
              leaveType,
              startDate: new Date(startDate),
              endDate: new Date(endDate),
              reason,
              status: "pending",
            })
            .returning();
          res.status(201).json(row);
          return;
        } catch (dbErr) {
          // Fall through to in-memory fallback
          // eslint-disable-next-line no-console
          console.warn(
            "Leave request DB insert failed, using in-memory fallback:",
            dbErr
          );
        }

        const rec = {
          id: "mem-" + Date.now(),
          userId: req.user!.id,
          leaveType,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          reason,
          status: "pending",
          createdAt: new Date().toISOString(),
          _fallback: true,
        };
        inMemoryMarketingLeaves.push(rec);
        res.status(201).json(rec);
      } catch (e) {
        res.status(500).json({ error: "Failed to submit leave request" });
      }
    }
  );
  // Inventory leave request - DB first, fallback to memory
  app.post(
    "/api/inventory/leave-request",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { employeeName, leaveType, startDate, endDate, reason } =
          req.body || {};
        if (!employeeName || !leaveType || !startDate || !endDate || !reason) {
          res.status(400).json({ error: "Missing required fields" });
          return;
        }
        // Attempt DB insert into shared leaveRequests table
        try {
          const userIdVal = Number(req.user!.id);
          const [row] = await db
            .insert(leaveRequestsTable)
            .values({
              userId: Number.isFinite(userIdVal) ? userIdVal : null,
              leaveType,
              startDate: new Date(startDate),
              endDate: new Date(endDate),
              reason,
              status: "pending",
            })
            .returning();
          res.status(201).json(row);
          return;
        } catch (dbErr) {
          // eslint-disable-next-line no-console
          console.warn(
            "Inventory leave request DB insert failed, using in-memory fallback:",
            dbErr
          );
        }

        const rec = {
          id: "mem-" + Date.now(),
          employeeName,
          userId: req.user!.id,
          leaveType,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          reason,
          status: "pending",
          createdAt: new Date().toISOString(),
          _fallback: true,
        };
        inMemoryInventoryLeaves.push(rec);
        res.status(201).json(rec);
      } catch (e) {
        res.status(500).json({ error: "Failed to submit leave request" });
      }
    }
  );

  app.get("/api/activities", (_req, res) => {
    res.json([]);
  });
  app.get("/api/orders", (_req, res) => {
    res.json([]);
  });

  // Generic attendance for InventoryAttendance page (in-memory demo)
  app.get("/api/attendance", (_req, res) => {
    res.json(inventoryAttendance);
  });
  app.post("/api/attendance", (req, res) => {
    try {
      const { userId, action, location, date, timestamp, department } =
        req.body || {};
      if (!userId || !action || !location || !date) {
        res
          .status(400)
          .json({ error: "userId, action, location, date are required" });
        return;
      }
      const name = String(userId);
      const existing = inventoryAttendance
        .reverse()
        .find((r) => r.userId === userId && r.date === date);
      if (action === "check_in") {
        const rec = {
          id: String(Date.now()),
          userId,
          name,
          department: department || "Inventory",
          status: "present",
          checkIn: new Date(timestamp || Date.now()).toLocaleTimeString(),
          checkOut: null,
          date,
          location,
          hoursWorked: null,
        };
        inventoryAttendance.push(rec);
        res.status(201).json(rec);
        return;
      }
      if (action === "check_out") {
        if (!existing) {
          res.status(404).json({ error: "No check-in record found for today" });
          return;
        }
        existing.checkOut = new Date(
          timestamp || Date.now()
        ).toLocaleTimeString();
        res.json(existing);
        return;
      }
      res.status(400).json({ error: "Unknown action" });
    } catch (e) {
      res.status(500).json({ error: "Failed to record attendance" });
    }
  });

  // Accounts metrics and lists (stubs to satisfy UI)
  app.get("/api/accounts/dashboard-metrics", requireAuth, async (_req, res) => {
    res.json({
      totalReceivables: 0,
      totalPayables: 0,
      invoicesDue: 0,
      avgDaysToPay: 0,
    });
  });
  app.get("/api/accounts/cash-flow-summary", requireAuth, async (_req, res) => {
    res.json({ inflow: 0, outflow: 0, net: 0 });
  });
  app.get("/api/accounts/payables-total", requireAuth, async (_req, res) => {
    res.json({ total: 0 });
  });
  app.get("/api/accounts/receivables-total", requireAuth, async (_req, res) => {
    res.json({ total: 0 });
  });
  app.get("/api/accounts-payables", requireAuth, async (_req, res) => {
    res.json([]);
  });
  app.get("/api/accounts-payables/overdue", requireAuth, async (_req, res) => {
    res.json([]);
  });
  app.get("/api/accounts-receivables", requireAuth, async (_req, res) => {
    res.json([]);
  });
  app.get(
    "/api/accounts-receivables/overdue",
    requireAuth,
    async (_req, res) => {
      res.json([]);
    }
  );
  app.get("/api/bank-accounts", requireAuth, async (_req, res) => {
    res.json([]);
  });
  app.get("/api/bank-accounts/active", requireAuth, async (_req, res) => {
    res.json([]);
  });
  app.get("/api/bank-accounts/default", requireAuth, async (_req, res) => {
    res.json(null);
  });
  app.get("/api/bank-transactions", requireAuth, async (_req, res) => {
    res.json([]);
  });
  app.get("/api/account-reminders", requireAuth, async (_req, res) => {
    res.json([]);
  });
  app.get("/api/account-tasks", requireAuth, async (_req, res) => {
    res.json([]);
  });

  // GST returns (stubs)
  app.get("/api/gst-returns", requireAuth, async (_req, res) => {
    res.json([]);
  });
  app.get("/api/gst-returns/status/:status", requireAuth, async (_req, res) => {
    res.json([]);
  });

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

  // Generic reports list
  app.get("/api/reports", requireAuth, async (_req, res) => {
    res.json([]);
  });

  //

  // Lightweight marketing dashboard endpoints
  app.get("/api/marketing", requireAuth, async (_req, res) => {
    try {
      const [lm] = await db
        .select({
          total: sql`COUNT(*)::integer`,
          active: sql`COUNT(CASE WHEN ${leads.status} IN ('new','contacted','in_progress') THEN 1 END)::integer`,
          converted: sql`COUNT(CASE WHEN ${leads.status} = 'converted' THEN 1 END)::integer`,
        })
        .from(leads);

      const [vm] = await db
        .select({
          total: sql`COUNT(*)::integer`,
          completed: sql`COUNT(CASE WHEN ${fieldVisits.status} = 'completed' THEN 1 END)::integer`,
        })
        .from(fieldVisits);

      const [tm] = await db
        .select({
          total: sql`COUNT(*)::integer`,
          completed: sql`COUNT(CASE WHEN ${marketingTasks.status} = 'completed' THEN 1 END)::integer`,
        })
        .from(marketingTasks);

      const [am] = await db
        .select({
          presentToday: sql`COUNT(CASE WHEN DATE(${marketingAttendance.date}) = DATE(NOW()) AND ${marketingAttendance.attendanceStatus} = 'present' THEN 1 END)::integer`,
        })
        .from(marketingAttendance);

      const totalLeads = Number(lm?.total || 0);
      const converted = Number(lm?.converted || 0);
      const conversionRate =
        totalLeads > 0 ? (converted / totalLeads) * 100 : 0;

      const totalTasks = Number(tm?.total || 0);
      const completedTasks = Number(tm?.completed || 0);
      const completionRate =
        totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      const totalVisits = Number(vm?.total || 0);
      const completedVisits = Number(vm?.completed || 0);
      const successRate =
        totalVisits > 0 ? (completedVisits / totalVisits) * 100 : 0;

      res.json({
        leads: {
          total: totalLeads,
          active: Number(lm?.active || 0),
          converted,
          conversionRate,
        },
        visits: {
          total: totalVisits,
          completed: completedVisits,
          successRate,
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          completionRate,
        },
        attendance: {
          presentToday: Number(am?.presentToday || 0),
        },
      });
    } catch (e) {
      res.json({
        leads: { total: 0, active: 0, converted: 0, conversionRate: 0 },
        visits: { total: 0, completed: 0, successRate: 0 },
        tasks: { total: 0, completed: 0, completionRate: 0 },
        attendance: { presentToday: 0 },
      });
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

      // Start query
      let query = db.select().from(leads);

      // Optional filters
      if (status) query = query.where({ status });
      if (source) query = query.where({ source });
      if (priority) query = query.where({ priority });
      if (assignedTo) query = query.where({ assignedTo });
      if (search) {
        query = query.where(
          sql`firstName ILIKE ${"%" + search + "%"} OR lastName ILIKE ${
            "%" + search + "%"
          }`
        );
      }

      const rows = await query;
      res.json(rows);
    } catch (err) {
      console.error("Error fetching leads:", err);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.post("/api/marketing/leads", async (req, res) => {
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
      } = req.body;

      const validSources = [
        "other",
        "referral",
        "website",
        "email",
        "social_media",
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
        })
        .returning();

      res.status(201).json({ message: "Lead created", lead: newLead });
    } catch (err) {
      console.error("Error creating lead:", err);
      res.status(500).json({ error: "Failed to create lead" });
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

  app.get("/api/field-visits", requireAuth, async (_req, res) => {
    try {
      const rows = await db.select().from(fieldVisits);
      res.json(rows);
    } catch (e) {
      res.json([]);
    }
  });

  app.get("/api/marketing-tasks", requireAuth, async (_req, res) => {
    try {
      const rows = await db.select().from(marketingTasks);
      res.json(rows);
    } catch (e) {
      res.json([]);
    }
  });

  // Logistics dashboard endpoint
  app.get("/api/logistics/dashboard", requireAuth, async (_req, res) => {
    try {
      const rows = await db.select().from(logisticsShipments);
      res.json({
        totalShipments: rows.length,
        inTransit: rows.filter((s) => s.currentStatus === "in_transit").length,
        outForDelivery: rows.filter(
          (s) => s.currentStatus === "out_for_delivery"
        ).length,
        delivered: rows.filter((s) => s.currentStatus === "delivered").length,
      });
    } catch (e) {
      res.json({
        totalShipments: 0,
        inTransit: 0,
        outForDelivery: 0,
        delivered: 0,
      });
    }
  });

  // Logistics basic endpoints (fallbacks when full registry disabled)
  app.get("/api/logistics/shipments", requireAuth, async (_req, res) => {
    try {
      const rows = await db.select().from(logisticsShipments);
      res.json(rows);
    } catch (e) {
      // DB unavailable; serve in-memory list
      res.json(inMemoryLogisticsShipments);
    }
  });

  // Create logistics shipment
  app.post("/api/logistics/shipments", requireAuth, async (req, res) => {
    try {
      const data = logisticsShipmentInsertSchema.parse(req.body || {});
      try {
        const [row] = await db
          .insert(logisticsShipments)
          .values({
            consignmentNumber: data.consignmentNumber,
            source: data.source,
            destination: data.destination,
            currentStatus: data.currentStatus || "created",
          })
          .returning();
        res.status(201).json(row);
      } catch (dbErr) {
        // Fallback to in-memory storage if DB insert fails (e.g., column mapping mismatch)
        const rec = {
          id: "mem-" + Date.now(),
          consignmentNumber: data.consignmentNumber,
          source: data.source,
          destination: data.destination,
          currentStatus: data.currentStatus || "created",
          _fallback: true,
        } as any;
        inMemoryLogisticsShipments.push(rec);
        res.status(201).json(rec);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ error: "Invalid shipment data", details: error.errors });
        return;
      }
      res.status(500).json({ error: "Failed to create shipment" });
    }
  });

  // Logistics attendance list
  app.get("/api/logistics/attendance", requireAuth, async (_req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      const rows = await db.select().from(logisticsAttendance);
      const mapped = (rows as any[]).map((r) => ({
        ...r,
        checkIn: r.checkInTime,
        checkOut: r.checkOutTime,
        status: r.checkOutTime
          ? "checked_out"
          : r.checkInTime
          ? "checked_in"
          : "checked_out",
      }));
      res.json(mapped);
    } catch (e) {
      res.json([]);
    }
  });

  // Logistics attendance today
  app.get("/api/logistics/attendance/today", requireAuth, async (_req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const rows = await db
        .select()
        .from(logisticsAttendance)
        .where(
          and(
            gte(logisticsAttendance.date, today as any),
            lt(logisticsAttendance.date, tomorrow as any)
          )
        );
      const mapped = (rows as any[]).map((r) => ({
        ...r,
        checkIn: r.checkInTime,
        checkOut: r.checkOutTime,
        status: r.checkOutTime
          ? "checked_out"
          : r.checkInTime
          ? "checked_in"
          : "checked_out",
      }));
      res.json(mapped);
    } catch (e) {
      res.json([]);
    }
  });

  // Logistics attendance metrics
  app.get(
    "/api/logistics/attendance/metrics",
    requireAuth,
    async (_req, res) => {
      try {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        const all = await db.select().from(logisticsAttendance);
        const mappedAll = (all as any[]).map((r) => ({
          ...r,
          status: (r as any).checkOutTime
            ? "checked_out"
            : (r as any).checkInTime
            ? "checked_in"
            : "checked_out",
        }));
        const checkedIn = mappedAll.filter(
          (r) => r.status === "checked_in"
        ).length;
        const checkedOut = mappedAll.filter(
          (r) => r.status === "checked_out"
        ).length;
        const totalPresent = mappedAll.length;
        // Average hours where both checkInTime and checkOutTime exist
        const hrs = (mappedAll as any[])
          .filter((r) => (r as any).checkInTime && (r as any).checkOutTime)
          .map(
            (r) =>
              (new Date((r as any).checkOutTime).getTime() -
                new Date((r as any).checkInTime).getTime()) /
              (1000 * 60 * 60)
          );
        const averageWorkHours = hrs.length
          ? Math.round((hrs.reduce((a, b) => a + b, 0) / hrs.length) * 10) / 10
          : 0;
        // No deliveries columns in your DDL - set 0
        const totalDeliveries = 0;
        res.json({
          totalPresent,
          checkedIn,
          checkedOut,
          averageWorkHours,
          totalDeliveries,
          activeTasks: 0,
        });
      } catch (e) {
        res.json({
          totalPresent: 0,
          checkedIn: 0,
          checkedOut: 0,
          averageWorkHours: 0,
          totalDeliveries: 0,
          activeTasks: 0,
        });
      }
    }
  );

  // Logistics attendance check-in
  app.post(
    "/api/logistics/attendance/check-in",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const body = req.body || {};
        const { userId, latitude, longitude, location } = body;
        if (latitude == null || longitude == null) {
          res
            .status(400)
            .json({ error: "latitude and longitude are required" });
          return;
        }
        const isUuid = (s: string) =>
          typeof s === "string" &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            s
          );
        const userIdSafe = isUuid(userId)
          ? userId
          : isUuid(req.user?.id || "")
          ? req.user!.id
          : null;
        if (!userIdSafe) {
          res.status(400).json({ error: "Valid userId (UUID) is required" });
          return;
        }
        const [row] = await db
          .insert(logisticsAttendance)
          .values({
            userId: userIdSafe as any,
            date: new Date(),
            checkInTime: new Date(),
            checkInLatitude: latitude as any,
            checkInLocation: location,
          } as any)
          .returning();
        res.status(201).json({
          ...row,
          checkIn: (row as any).checkInTime,
          checkOut: (row as any).checkOutTime,
          status: (row as any).checkOutTime ? "checked_out" : "checked_in",
        });
      } catch (e) {
        res.status(500).json({ error: "Failed to check in" });
      }
    }
  );

  // Logistics attendance check-out
  app.put(
    "/api/logistics/attendance/:id/check-out",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const id = String(req.params.id);
        const { location } = req.body || {};
        const [row] = await db
          .update(logisticsAttendance)
          .set({
            checkOutTime: new Date(),
            checkOutLocation: location,
          } as any)
          .where(eq(logisticsAttendance.id as any, id as any))
          .returning();
        if (!row)
          return res.status(404).json({ error: "Attendance not found" });
        res.json({
          ...row,
          checkIn: (row as any).checkInTime,
          checkOut: (row as any).checkOutTime,
          status: (row as any).checkOutTime ? "checked_out" : "checked_in",
        });
      } catch (e) {
        res.status(500).json({ error: "Failed to check out" });
      }
    }
  );

  // Logistics attendance photo upload URL
  app.post(
    "/api/logistics/attendance/photo/upload-url",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { attendanceId, fileName, contentType, photoType } =
          req.body || {};
        if (!attendanceId || !fileName || !contentType || !photoType) {
          res.status(400).json({
            error:
              "attendanceId, fileName, contentType, and photoType are required",
          });
          return;
        }
        const objectStorage = new ObjectStorageService();
        const uploadURL = await objectStorage.getObjectEntityUploadURL();
        const objectPath = `attendance-photos/${attendanceId}/${photoType}-${Date.now()}-${fileName}`;
        res.json({ uploadURL, objectPath });
      } catch (e) {
        res.status(500).json({ error: "Failed to generate upload URL" });
      }
    }
  );

  // Logistics attendance update photo path
  app.put(
    "/api/logistics/attendance/:id/photo",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        // No-op for DB schema without photo columns; return 204
        res.status(204).end();
      } catch (e) {
        res.status(500).json({ error: "Failed to update photo" });
      }
    }
  );

  // Logistics tasks endpoints (DB-first with in-memory fallback)
  app.get("/api/logistics/tasks", requireAuth, async (_req, res) => {
    try {
      const rows = await db.select().from(logisticsTasks);
      const all = Array.isArray(rows) ? rows : [];
      if (inMemoryLogisticsTasks.length) {
        res.json([...all, ...inMemoryLogisticsTasks]);
      } else {
        res.json(all);
      }
    } catch (e) {
      res.json(inMemoryLogisticsTasks);
    }
  });

  app.post(
    "/api/logistics/tasks",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const body = req.body || {};
        const title = typeof body.title === "string" ? body.title.trim() : "";
        const assignedTo =
          typeof body.assignedTo === "string" ? body.assignedTo.trim() : "";
        if (!title || !assignedTo) {
          res.status(400).json({ error: "title and assignedTo are required" });
          return;
        }
        const description =
          typeof body.description === "string"
            ? body.description.trim()
            : undefined;
        const priority =
          typeof body.priority === "string" ? body.priority : "medium";
        const dueDate = body.dueDate ? new Date(body.dueDate) : null;

        try {
          const isUuid = (s: string) =>
            typeof s === "string" &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              s
            );
          const assignedByCandidate =
            typeof body.assignedBy === "string"
              ? body.assignedBy
              : req.user?.id;
          const assignedBySafe = isUuid(assignedByCandidate || "")
            ? assignedByCandidate!
            : assignedTo;
          const [row] = await db
            .insert(logisticsTasks)
            .values({
              title,
              description,
              priority,
              assignedTo,
              assignedBy: assignedBySafe,
              status: "new",
              dueDate,
            })
            .returning();
          res.status(201).json(row);
        } catch (dbErr) {
          const rec: any = {
            id: "mem-" + Date.now(),
            title,
            description: description || null,
            priority,
            assignedTo,
            assignedBy: String(req.user!.id),
            status: "new",
            dueDate: body.dueDate || null,
            startedDate: null,
            completedDate: null,
            shipmentId: body.shipmentId || undefined,
            estimatedHours: body.estimatedHours || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _fallback: true,
          };
          inMemoryLogisticsTasks.push(rec);
          res.status(201).json(rec);
        }
      } catch (e) {
        res.status(500).json({ error: "Failed to create logistics task" });
      }
    }
  );

  app.put("/api/logistics/tasks/:id", requireAuth, async (req, res) => {
    try {
      const id = String(req.params.id);
      const body = req.body || {};

      // Try DB update
      try {
        const patch: any = {};
        if (typeof body.title === "string") patch.title = body.title.trim();
        if (typeof body.description === "string")
          patch.description = body.description.trim();
        if (typeof body.status === "string") patch.status = body.status;
        if (typeof body.priority === "string") patch.priority = body.priority;
        if (body.dueDate !== undefined)
          patch.dueDate = body.dueDate ? new Date(body.dueDate) : null;
        if (Object.keys(patch).length === 0) {
          res.status(400).json({ error: "No valid fields to update" });
          return;
        }
        const [row] = await db
          .update(logisticsTasks)
          .set(patch)
          .where(eq(logisticsTasks.id, id as any))
          .returning();
        if (!row) {
          res.status(404).json({ error: "Task not found" });
          return;
        }
        res.json(row);
        return;
      } catch (dbErr) {
        // Fallback to in-memory update
      }

      const idx = inMemoryLogisticsTasks.findIndex(
        (t: any) => String(t.id) === id
      );
      if (idx === -1) {
        res.status(404).json({ error: "Task not found" });
        return;
      }
      const patch: any = {};
      if (typeof body.title === "string") patch.title = body.title.trim();
      if (typeof body.description === "string")
        patch.description = body.description.trim();
      if (typeof body.status === "string") patch.status = body.status;
      if (typeof body.priority === "string") patch.priority = body.priority;
      if (body.dueDate !== undefined) patch.dueDate = body.dueDate || null;
      patch.updatedAt = new Date().toISOString();

      inMemoryLogisticsTasks[idx] = {
        ...inMemoryLogisticsTasks[idx],
        ...patch,
      };
      res.json(inMemoryLogisticsTasks[idx]);
    } catch (e) {
      res.status(500).json({ error: "Failed to update logistics task" });
    }
  });

  app.delete("/api/logistics/tasks/:id", requireAuth, async (req, res) => {
    try {
      const id = String(req.params.id);

      // Try DB delete
      try {
        const [row] = await db
          .delete(logisticsTasks)
          .where(eq(logisticsTasks.id, id as any))
          .returning();
        if (!row) {
          res.status(404).json({ error: "Task not found" });
          return;
        }
        res.status(204).end();
        return;
      } catch (dbErr) {
        // Fallback to in-memory delete
      }

      const idx = inMemoryLogisticsTasks.findIndex(
        (t: any) => String(t.id) === id
      );
      if (idx === -1) {
        res.status(404).json({ error: "Task not found" });
        return;
      }
      inMemoryLogisticsTasks.splice(idx, 1);
      res.status(204).end();
    } catch (e) {
      res.status(500).json({ error: "Failed to delete logistics task" });
    }
  });

  // Logistics reports
  app.get("/api/logistics/reports/daily", requireAuth, async (req, res) => {
    try {
      const from = req.query.from ? new Date(String(req.query.from)) : null;
      const to = req.query.to ? new Date(String(req.query.to)) : null;
      if (!from || !to) return res.json([]);
      const toPlus = new Date(to);
      toPlus.setDate(toPlus.getDate() + 1);
      const rows = await db
        .select()
        .from(deliveries)
        .where(and(gte(deliveries.date, from), lt(deliveries.date, toPlus)));
      res.json(rows);
    } catch (e) {
      res.json([]);
    }
  });

  app.get(
    "/api/logistics/reports/vendor-performance",
    requireAuth,
    async (req, res) => {
      try {
        const from = req.query.from ? new Date(String(req.query.from)) : null;
        const to = req.query.to ? new Date(String(req.query.to)) : null;
        if (!from || !to) return res.json([]);
        const toPlus = new Date(to);
        toPlus.setDate(toPlus.getDate() + 1);
        const rows = await db
          .select({
            vendorId: deliveries.vendorId,
            vendorName: suppliers.name,
            totalDeliveries: sql`COUNT(${deliveries.id})`,
            totalVolume: sql`SUM(${deliveries.volume})`,
          })
          .from(deliveries)
          .leftJoin(suppliers, eq(deliveries.vendorId, suppliers.id))
          .where(and(gte(deliveries.date, from), lt(deliveries.date, toPlus)))
          .groupBy(deliveries.vendorId, suppliers.name);
        res.json(rows);
      } catch (e) {
        res.json([]);
      }
    }
  );

  app.get("/api/logistics/reports/volume", requireAuth, async (req, res) => {
    try {
      const from = req.query.from ? new Date(String(req.query.from)) : null;
      const to = req.query.to ? new Date(String(req.query.to)) : null;
      if (!from || !to) return res.json([]);
      const toPlus = new Date(to);
      toPlus.setDate(toPlus.getDate() + 1);
      const rows = await db
        .select({
          date: deliveries.date,
          totalVolume: sql`SUM(${deliveries.volume})`,
        })
        .from(deliveries)
        .where(and(gte(deliveries.date, from), lt(deliveries.date, toPlus)))
        .groupBy(deliveries.date)
        .orderBy(deliveries.date);
      res.json(rows);
    } catch (e) {
      res.json([]);
    }
  });

  app.get(
    "/api/logistics/reports/performance",
    requireAuth,
    async (req, res) => {
      try {
        const from = req.query.from ? new Date(String(req.query.from)) : null;
        const to = req.query.to ? new Date(String(req.query.to)) : null;
        if (!from || !to)
          return res.json({
            totalDeliveries: 0,
            totalVolume: 0,
            averageVolume: 0,
          });
        const toPlus = new Date(to);
        toPlus.setDate(toPlus.getDate() + 1);
        const [row] = await db
          .select({
            totalDeliveries: sql`COUNT(${deliveries.id})`,
            totalVolume: sql`SUM(${deliveries.volume})`,
            averageVolume: sql`AVG(${deliveries.volume})`,
          })
          .from(deliveries)
          .where(and(gte(deliveries.date, from), lt(deliveries.date, toPlus)));
        res.json({
          totalDeliveries: Number((row as any)?.totalDeliveries || 0),
          totalVolume: Number((row as any)?.totalVolume || 0),
          averageVolume: Number((row as any)?.averageVolume || 0),
        });
      } catch (e) {
        res.json({ totalDeliveries: 0, totalVolume: 0, averageVolume: 0 });
      }
    }
  );

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

  // GET /api/tasks -> fetch all tasks
  app.get("/api/tasks", async (_req: Request, res: Response) => {
    try {
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
          assignedTo: users.username, // show username instead of id
          assignedBy: users.username, // show username instead of id
        })
        .from(tasks)
        .leftJoin(users, eq(tasks.assignedTo, users.id)); // join with assignedTo user
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

      const validPriority = ["low", "medium", "high"];
      const status = "new"; // automatically set for new tasks

      if (!validPriority.includes(priority)) {
        return res.status(400).json({ error: "Invalid priority" });
      }

      const [newTask] = await db
        .insert(tasks)
        .values({
          title,
          description,
          assignedTo,
          assignedBy,
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate) : null,
        })
        .returning({
          id: tasks.id,
          title: tasks.title,
          status: tasks.status,
          priority: tasks.priority,
          assignedTo: tasks.assignedTo,
          assignedBy: tasks.assignedBy,
          dueDate: tasks.dueDate,
          createdAt: tasks.createdAt,
          updatedAt: tasks.updatedAt,
        });

      res.status(201).json({ message: "Task created", task: newTask });
    } catch (err) {
      console.error("Error creating task:", err);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  // GET /api/tasks/:id
  // app.get("/api/tasks/:id", (req: Request, res: Response) => {
  //   const { id } = req.params;
  //   res.json({ message: `Task ${id} details` });
  // });

  // // PUT /api/tasks/:id
  // app.put("/api/tasks/:id", (req: Request, res: Response) => {
  //   const { id } = req.params;
  //   const updates = req.body;
  //   res.json({ message: `Task ${id} updated`, updates });
  // });

  // DELETE /api/tasks/:id
  app.delete("/api/tasks/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    res.json({ message: `Task ${id} deleted` });
  });
  const enableRegistries = process.env.ENABLE_FULL_REGISTRIES === "1";
  // Import and register marketing routes safely
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
    console.warn("⚠️ Marketing routes registry not available:", error);

    // Fallback minimal Marketing Attendance routes (ensures UI works)
    const objectStorage = new ObjectStorageService();

    // List all attendance (basic, no filtering)
    app.get("/api/marketing-attendance", requireAuth, async (req, res) => {
      try {
        const records = await storage.getMarketingAttendances();
        res.json(records);
      } catch (e) {
        console.error("Error in /api/marketing-attendance:", e);
        res.status(500).json({ error: "Failed to fetch marketing attendance", details: e instanceof Error ? e.message : e });
      }
    });

    // Today's attendance
    app.get(
  "/api/marketing-attendance/today",
  requireAuth,
  async (req, res) => {
    try {
      const records = await getTodayMarketingAttendance();
      res.json(records);
    } catch (e) {
      console.error("Error in /api/marketing-attendance/today:", e);
      res.status(500).json({
        error: "Failed to fetch today's marketing attendance",
        details: e instanceof Error ? e.message : e,
      });
    }
  }
);

    // Attendance metrics
    app.get(
      "/api/marketing-attendance/metrics",
      requireAuth,
      requireMarketingAccess,
      async (req, res) => {
        try {
          const metrics = await storage.getMarketingAttendanceMetrics();
          res.json(metrics);
        } catch (e) {
          console.error("Error in /api/marketing-attendance/metrics:", e);
          res.status(500).json({
            error: "Failed to fetch marketing attendance metrics",
            details: e instanceof Error ? e.message : e
          });
        }
      }
    );

    // Check-in
    app.post(
      "/api/marketing-attendance/check-in",
      requireAuth,
      async (req: AuthenticatedRequest, res) => {
        try {
          const { latitude, longitude, location, photoPath, workDescription } =
            req.body || {};
          if (latitude == null || longitude == null) {
            res
              .status(400)
              .json({ error: "latitude and longitude are required" });
            return;
          }
          const attendance = await storage.checkInMarketingAttendance(
            req.user!.id,
            {
              date: new Date(),
              checkInTime: new Date(),
              latitude,
              longitude,
              location,
              photoPath,
              workDescription,
              attendanceStatus: "present",
            }
          );
          res.status(201).json(attendance);
        } catch (e) {
          res.status(500).json({ error: "Failed to check in" });
        }
      }
    );

    // Check-out
    app.post(
      "/api/marketing-attendance/check-out",
      requireAuth,
      async (req: AuthenticatedRequest, res) => {
        try {
          const {
            latitude,
            longitude,
            location,
            photoPath,
            workDescription,
            visitCount,
            tasksCompleted,
            outcome,
            nextAction,
          } = req.body || {};
          if (latitude == null || longitude == null) {
            res
              .status(400)
              .json({ error: "latitude and longitude are required" });
            return;
          }
          const attendance = await storage.checkOutMarketingAttendance(
            req.user!.id,
            {
              checkOutTime: new Date(),
              latitude,
              longitude,
              location,
              photoPath,
              workDescription,
              visitCount,
              tasksCompleted,
              outcome,
              nextAction,
            }
          );
          res.json(attendance);
        } catch (e) {
          res.status(500).json({ error: "Failed to check out" });
        }
      }
    );

    // Photo upload URL generation
    app.post(
      "/api/marketing-attendance/photo/upload-url",
      requireAuth,
      async (req: AuthenticatedRequest, res) => {
        try {
          const { attendanceId, fileName, contentType, photoType } =
            req.body || {};
          if (!attendanceId || !fileName || !contentType || !photoType) {
            res.status(400).json({
              error:
                "attendanceId, fileName, contentType, and photoType are required",
            });
            return;
          }

          const attendance = await storage.getMarketingAttendance(attendanceId);
          if (!attendance) {
            res.status(404).json({ error: "Attendance record not found" });
            return;
          }
          if (attendance.userId !== req.user!.id) {
            res.status(403).json({
              error: "Not authorized to upload photo for this record",
            });
            return;
          }

          const objectPath = `marketing-attendance-photos/${attendanceId}/${photoType}-${Date.now()}-${fileName}`;
          const uploadURL = await objectStorage.getObjectEntityUploadURL();
          res.json({ uploadURL, objectPath });
        } catch (e) {
          res.status(500).json({ error: "Failed to generate upload URL" });
        }
      }
    );

    // Leave request creation (basic)
    try {
      const { db } = await import("./db");
      const { leaveRequests } = await import("@shared/schema");
      app.post(
        "/api/marketing-attendance/leave-request",
        requireAuth,
        async (req: AuthenticatedRequest, res) => {
          try {
            const { leaveType, startDate, endDate, reason } = req.body || {};
            if (!leaveType || !startDate || !endDate || !reason) {
              res.status(400).json({ error: "Missing required fields" });
              return;
            }
            const [record] = await db
              .insert(leaveRequests)
              .values({
                userId: req.user!.id,
                leaveType,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason,
                status: "pending",
              })
              .returning();
            res.status(201).json(record);
          } catch (e) {
            res.status(500).json({ error: "Failed to submit leave request" });
          }
        }
      );
    } catch (_e) {
      // If db/schema imports fail, skip leave-request endpoint
      console.warn(
        "⚠️ Leave request endpoint not available (db/schema import failed)"
      );
    }
  }

  // Import and register logistics routes safely
  try {
    if (!enableRegistries) {
      throw new Error("Registries disabled by ENABLE_FULL_REGISTRIES");
    }
    const { registerLogisticsRoutes } = await import(
      "./logistics-routes-registry"
    );
    registerLogisticsRoutes(app, { requireAuth });
    console.log("✅ Logistics routes registered successfully");
  } catch (error) {
    console.warn("⚠️ Logistics routes registry not available:", error);
  }

  // Always register lightweight registries for dashboards
  try {
    const { registerInventoryRoutes } = await import(
      "./inventory-routes-registry"
    );
    registerInventoryRoutes(app, { requireAuth });
    console.log("✅ Inventory routes registered");
  } catch (e) {
    console.warn("⚠️ Inventory routes registry load failed", e);
  }

  try {
    const { registerSalesRoutes } = await import("./sales-routes-registry");
    registerSalesRoutes(app, { requireAuth });
    console.log("✅ Sales routes registered");
  } catch (e) {
    console.warn("⚠️ Sales routes registry load failed", e);
  }

  try {
    const { registerAccountsRoutes } = await import(
      "./accounts-routes-registry"
    );
    registerAccountsRoutes(app, { requireAuth });
    console.log("✅ Accounts routes registered");
  } catch (e) {
    console.warn("⚠️ Accounts routes registry load failed", e);
  }

  const httpServer = createServer(app);
  return httpServer;
}
