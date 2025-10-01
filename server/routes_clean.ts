import type { Express, Request, Response, NextFunction } from "express";
import { registerAdminRoutes } from "./admin-routes-registry";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
// Removed unused schema imports from ../shared/schema to avoid runtime errors
import { z } from "zod";
import { db } from "./db";
import { sql, eq, and, gte, lt } from "drizzle-orm";
import { validate as isUuid } from "uuid";
import { v4 as uuidv4 } from "uuid";
import { users } from "../shared/schema";
import { tasks } from "../shared/schema";
import { leaveRequests } from "../shared/schema";
import { inventoryAttendance } from "../shared/schema";
import { stockTransactions, suppliers } from "../shared/schema";
// adjust path as needed
import { desc } from "drizzle-orm";
import { attendance } from "../shared/schema";
import { validate as isUuid } from "uuid";
import { requireAuth } from "@/middleware/auth";
import {
  marketingAttendance,
  marketingTodays,
  marketingMetrics,
} from "../shared/schema";

// make sure users table is also imported
import { products, spareParts } from "../shared/schema"; // adjust path
import { vendorCommunications } from "../shared/schema";
import { inventoryTasks } from "../shared/schema";
import { fabricationOrders } from "../shared/schema"; // adjust path if needed
// POST attendance (check-in / check-out)
import { v4 as uuidv4 } from "uuid";
import {
  users as usersTable,
  leads,
  visitNumber,
  marketingTasks,
  fieldVisits,
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
  insertOutboundQuotationSchema,
  insertInboundQuotationSchema,
  insertInvoiceSchema,
  customers,
} from "../shared/schema";
import { sql, eq, and, gte, lt } from "drizzle-orm";
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

  // Update client
  app.put("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      // Use insertCustomerSchema for validation (from shared/schema)
      const { insertCustomerSchema } = await import("../shared/schema");
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.updateCustomer(id, customerData);
      if (!customer) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(customer);
    } catch (error) {
      if (error instanceof (await import("zod")).z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid client data", details: error.errors });
      }
      res
        .status(500)
        .json({ error: "Failed to update client", details: error.message });
    }
  });

  // Delete client
  app.delete("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteCustomer(id);
      if (!success) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.status(204).send(); // No content
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to delete client", details: error.message });
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
  registerAdminRoutes(app);

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
      const orders = await storage.getFabricationOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch fabrication orders" });
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

  app.post("/api/suppliers", async (req: Request, res: Response) => {
    try {
      const body = req.body;

      const supplierData = {
        name: body.name,
        email: body.contactEmail, // map frontend key to DB column
        phone: body.contactPhone, // map frontend key to DB column
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

  // Stock transactions (stubbed)
  app.get("/api/stock-transactions", requireAuth, async (_req, res) => {
    try {
      const rows = await db
        .select()
        .from(stockTransactions)
        .orderBy(desc(stockTransactions.id)); // order by id, or createdAt if you have
      res.json(rows);
    } catch (error) {
      console.error("Error fetching stock transactions:", error);
      res.status(500).json({ error: "Failed to fetch stock transactions" });
    }
  });

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
  // File uploads (generic upload URL) - Mocked for local development
  app.post("/api/objects/upload", requireAuth, async (_req, res) => {
    // --- START: Mocking Object Storage for Local Development ---
    if (process.env.NODE_ENV === "development") {
      // Return a dummy URL that the frontend can handle gracefully
      // In a real scenario, this would be replaced by a call to the actual ObjectStorageService
      res.json({
        uploadURL: "http://localhost:5000/mock-upload-url", // This is a fake URL
        message:
          "File upload is mocked in development mode. No actual upload occurs.",
      });
      return; // Exit early, don't proceed to ObjectStorageService
    }
    // --- END: Mocking ---

    try {
      const objectStorage = new ObjectStorageService();
      const uploadURL = await objectStorage.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (e) {
      // This will now only catch errors when NOT in development mode
      // or if the development check fails unexpectedly
      console.error("Object storage error:", e);
      res
        .status(500)
        .json({ error: "Failed to get upload URL", details: e.message });
    }
  });

  // app.post("/api/outbound-quotations", requireAuth, async (req, res) => {
  //   try {
  //     const { insertOutboundQuotationSchema } = await import("../shared/schema");
  //     const data = insertOutboundQuotationSchema
  //       .partial({ customerId: true })
  //       .parse(req.body); // ← allow optional customerId
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
  //     console.log("🐛 [DEBUG] GET /api/outbound-quotations - Request received");

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
  //       `🐛 [DEBUG] Fetched ${rows.length} raw rows from DB with JOIN`
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
  //       `🐛 [DEBUG] Transformed ${transformedRows.length} rows into nested structure`
  //     );
  //     // Send the correctly structured data (with nested customer objects) to the frontend.
  //     res.json(transformedRows);
  //   } catch (error) {
  //     // --- STEP 3: Robust Error Handling ---
  //     // Catch any unexpected errors during the JOIN or transformation process.
  //     console.error(
  //       "💥 [ERROR] Failed to fetch outbound quotations with JOIN:",
  //       error
  //     );
  //     // Fallback to a simple query to maintain API availability.
  //     try {
  //       console.log(
  //         "🐛 [DEBUG] Falling back to simple outbound_quotations fetch..."
  //       );
  //       const fallbackRows = await db.select().from(outboundQuotations);
  //       res.json(fallbackRows);
  //     } catch (fallbackError) {
  //       // Catch errors in the fallback itself.
  //       console.error("💥 [ERROR] Fallback fetch also failed:", fallbackError);
  //       res
  //         .status(500)
  //         .json({
  //           error: "Failed to fetch outbound quotations",
  //           details: error.message,
  //         });
  //     }
  //   }
  // });
  app.get("/api/outbound-quotations", requireAuth, async (req, res) => {
    try {
      console.log("🐛 [ROUTE] GET /api/outbound-quotations - Request received");

      // --- Call the new storage method ---
      const quotations = await storage.getOutboundQuotations();

      console.log(
        `🐛 [ROUTE] GET /api/outbound-quotations - Returning ${quotations.length} quotations`
      );
      // --- Send the correctly structured data ---
      res.json(quotations);
    } catch (error) {
      // --- Handle errors from storage ---
      console.error(
        "💥 [ROUTE] GET /api/outbound-quotations - Error fetching quotations:",
        error
      );
      res.status(500).json({
        error: "Failed to fetch outbound quotations",
        // Optionally include more details from the error object
        // details: error.message || "An unknown error occurred while fetching quotations.",
      });
    }
  });

  app.post("/api/outbound-quotations", requireAuth, async (req, res) => {
    try {
      console.log(
        "🐛 [DEBUG] POST /api/outbound-quotations - Request received"
      );
      console.log("🐛 [DEBUG] req.body:", req.body);
      console.log("🐛 [DEBUG] req.user:", req.user);

      const { insertOutboundQuotationSchema } = await import(
        "../shared/schema"
      );
      console.log("🐛 [DEBUG] About to parse request body with Zod schema");
      const parsedData = insertOutboundQuotationSchema
        .partial({ customerId: true })
        .parse(req.body);
      console.log("🐛 [DEBUG] Parsed data from Zod:", parsedData);

      // Convert types for database
      const data = {
        ...parsedData,
        // Remove this line:
        // customerId: parsedData.customerId ? Number(parsedData.customerId) : null,
        // Just keep customerId as the UUID string from the frontend
        customerId: parsedData.customerId || null, // Ensure it's null if empty string
        // ... (rest of your conversions for dates, amounts, userId are fine)
        quotationDate: new Date(parsedData.quotationDate),
        validUntil: parsedData.validUntil
          ? new Date(parsedData.validUntil)
          : null,
        subtotalAmount: parseFloat(parsedData.subtotalAmount),
        taxAmount: parsedData.taxAmount ? parseFloat(parsedData.taxAmount) : 0,
        discountAmount: parsedData.discountAmount
          ? parseFloat(parsedData.discountAmount)
          : 0,
        totalAmount: parseFloat(parsedData.totalAmount),
        userId:
          process.env.NODE_ENV === "development"
            ? "79c36f2b-237a-4ba6-a4b3-a12fc8a18446"
            : req.user?.id || "79c36f2b-237a-4ba6-a4b3-a12fc8a18446",
      };

      // --- LOGGING ADDED HERE ---
      console.log(
        "🐛 [DEBUG] Final 'data' object before storage call:",
        JSON.stringify(data, null, 2)
      );
      console.log(
        "🐛 [DEBUG] typeof data.userId:",
        typeof data.userId,
        "value:",
        data.userId
      );
      console.log(
        "🐛 [DEBUG] typeof data.customerId:",
        typeof data.customerId,
        "value:",
        data.customerId
      );
      // --- END LOGGING ---

      // ✅ FIXED: Call the correct method on storage
      console.log(
        "🐛 [DEBUG] Calling storage.createOutboundQuotation with data..."
      );
      const quotation = await storage.createOutboundQuotation(data);
      console.log(
        "🐛 [DEBUG] Storage call successful, returning quotation:",
        quotation
      );
      res.status(201).json(quotation);
    } catch (error) {
      console.error("💥 [ERROR] Failed to create outbound quotation:", error);
      if (error instanceof z.ZodError) {
        console.error("🐛 [ZOD ERROR] Zod validation failed:", error.errors);
        return res
          .status(400)
          .json({ error: "Invalid quotation data", details: error.errors });
      }
      console.error("🐛 [GENERIC ERROR] Non-Zod error occurred");
      res
        .status(500)
        .json({ error: "Failed to create quotation", details: error.message });
    }
  });

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

  // Alias: /api/quotations/inbound → inbound quotations
  // app.get("/api/quotations/inbound", requireAuth, async (_req, res) => {
  //   try {
  //     const rows = await db.select().from(inboundQuotations);
  //     res.json(rows);
  //   } catch (e) {
  //     res.json([]);
  //   }
  // });
  // Inbound Quotations Routes

  app.put("/api/outbound-quotations/:id", requireAuth, async (req, res) => {
    try {
      const { insertOutboundQuotationSchema } = await import(
        "../shared/schema"
      );
      const parsedData = insertOutboundQuotationSchema
        .partial()
        .parse(req.body);

      // --- PREPARE DATA FOR DATABASE UPDATE ---
      const updateData: any = {};
      // Handle Date Fields
      if (parsedData.quotationDate !== undefined) {
        updateData.quotationDate =
          parsedData.quotationDate === null
            ? null
            : parsedData.quotationDate instanceof Date
            ? parsedData.quotationDate
            : new Date(parsedData.quotationDate);
      }
      if (parsedData.validUntil !== undefined) {
        updateData.validUntil =
          parsedData.validUntil === null
            ? null
            : parsedData.validUntil instanceof Date
            ? parsedData.validUntil
            : new Date(parsedData.validUntil);
      }
      // Handle UUID/String Fields
      if (parsedData.customerId !== undefined) {
        updateData.customerId = parsedData.customerId || null;
      }
      if (parsedData.userId !== undefined) {
        updateData.userId = parsedData.userId || null; // Or derive from req.user if needed
      }
      // Handle Numeric Fields
      const numericFields = [
        "subtotalAmount",
        "taxAmount",
        "discountAmount",
        "totalAmount",
      ] as const;
      for (const field of numericFields) {
        if (parsedData[field] !== undefined) {
          updateData[field] =
            typeof parsedData[field] === "string"
              ? parseFloat(parsedData[field])
              : parsedData[field];
        }
      }
      // Handle Optional String Fields (including status)
      const optionalStringFields = [
        "quotationNumber",
        "status",
        "jobCardNumber",
        "partNumber",
        "paymentTerms",
        "deliveryTerms",
        "notes",
        "warrantyTerms",
        "specialTerms",
        "bankName",
        "accountNumber",
        "ifscCode",
      ] as const;
      for (const field of optionalStringFields) {
        if (field in parsedData) {
          // @ts-ignore - Dynamic assignment
          updateData[field] = parsedData[field];
        }
      }
      // Set updated timestamp
      updateData.updatedAt = new Date();

      // --- PERFORM THE UPDATE ---
      const updatedQuotation = await storage.updateOutboundQuotation(
        req.params.id,
        updateData
      );

      // --- CREATE ACTIVITY LOG ---
      await storage.createActivity({
        userId: updatedQuotation.userId,
        action: "UPDATE_OUTBOUND_QUOTATION",
        entityType: "outbound_quotation",
        entityId: updatedQuotation.id,
        details: `Updated outbound quotation: ${updatedQuotation.quotationNumber}`,
      });

      // --- SEND RESPONSE ---
      res.json(updatedQuotation);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid quotation data", details: error.errors });
      }
      console.error("Failed to update outbound quotation:", error);
      res.status(500).json({
        error: "Failed to update outbound quotation",
        details: error.message,
      });
    }
  });

  app.get("/api/inbound-quotations", async (req, res) => {
    try {
      const quotations = await storage.getInboundQuotations();
      res.json(quotations);
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch inbound quotations",
        details: error.message,
      });
    }
  });

  app.get("/api/inbound-quotations/:id", async (req, res) => {
    try {
      const quotation = await storage.getInboundQuotation(req.params.id);
      if (!quotation) {
        return res.status(404).json({ error: "Inbound quotation not found" });
      }
      res.json(quotation);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inbound quotation" });
    }
  });

  app.post("/api/inbound-quotations", requireAuth, async (req, res) => {
    try {
      const { insertInboundQuotationSchema } = await import("../shared/schema");

      // Pre-process req.body to remove null values for optional fields
      // This ensures Zod validation passes if fields are explicitly sent as null
      const requestBody = { ...req.body };
      if (requestBody.attachmentPath === null) {
        delete requestBody.attachmentPath; // Remove the key if value is null
      }
      if (requestBody.attachmentName === null) {
        delete requestBody.attachmentName; // Remove the key if value is null
      }

      const parsedData = insertInboundQuotationSchema.parse(requestBody); // ✅ Parse the cleaned object

      // Convert types for database
      const data = {
        ...parsedData,
        // ✅ Convert dates from string to Date object
        quotationDate: new Date(parsedData.quotationDate),
        validUntil: parsedData.validUntil
          ? new Date(parsedData.validUntil)
          : null,
        // ✅ Convert amount from string to number
        totalAmount: parseFloat(parsedData.totalAmount),
        // ✅ Use a valid UUID for userId in development mode
        userId:
          process.env.NODE_ENV === "development"
            ? "79c36f2b-237a-4ba6-a4b3-a12fc8a18446" // ← Your valid user ID
            : req.user?.id || "79c36f2b-237a-4ba6-a4b3-a12fc8a18446",
      };

      const quotation = await storage.createInboundQuotation(data);
      await storage.createActivity({
        userId: quotation.userId,
        action: "CREATE_INBOUND_QUOTATION",
        entityType: "inbound_quotation",
        entityId: quotation.id,
        details: `Created inbound quotation: ${quotation.quotationNumber}`,
      });
      res.status(201).json(quotation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid quotation data", details: error.errors });
      }
      console.error("Failed to create inbound quotation:", error);
      res.status(500).json({
        error: "Failed to create inbound quotation",
        details: error.message,
      }); // Include details
    }
  });

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
      const quotationData = insertInboundQuotationSchema
        .partial()
        .parse(req.body);
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
  app.get("/api/invoices", requireAuth, async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch invoices", details: error.message });
    }
  });

  app.get("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch invoice", details: error.message });
    }
  });

  app.post("/api/invoices", requireAuth, async (req, res) => {
    try {
      const invoiceData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(invoiceData);
      await storage.createActivity({
        userId: invoice.userId,
        action: "CREATE_INVOICE",
        entityType: "invoice",
        entityId: invoice.id,
        details: `Created invoice: ${invoice.invoiceNumber}`,
      });
      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid invoice data", details: error.errors });
      }
      console.error("Failed to create invoice:", error);
      res
        .status(500)
        .json({ error: "Failed to create invoice", details: error?.message });
    }
  });

  app.put("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      const invoiceData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, invoiceData);
      await storage.createActivity({
        userId: invoice.userId,
        action: "UPDATE_INVOICE",
        entityType: "invoice",
        entityId: invoice.id,
        details: `Updated invoice: ${invoice.invoiceNumber}`,
      });
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: "Failed to update invoice" });
    }
  });

  // Invoice PDF Generation Endpoint
  // Number to words helper function for Indian numbering system
  function numberToWords(num: number): string {
    if (num === 0) return "Zero";

    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    function convertLessThanThousand(n: number): string {
      if (n === 0) return "";
      let result = "";

      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + " Hundred ";
        n %= 100;
      }

      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + " ";
        n %= 10;
      }

      if (n > 0) {
        result += ones[n] + " ";
      }

      return result;
    }

    function convert(n: number): string {
      if (n === 0) return "";

      let result = "";
      let crore = Math.floor(n / 10000000);
      n %= 10000000;

      let lakh = Math.floor(n / 100000);
      n %= 100000;

      let thousand = Math.floor(n / 1000);
      n %= 1000;

      let hundred = n;

      if (crore > 0) {
        result += convertLessThanThousand(crore) + "Crore ";
      }
      if (lakh > 0) {
        result += convertLessThanThousand(lakh) + "Lakh ";
      }
      if (thousand > 0) {
        result += convertLessThanThousand(thousand) + "Thousand ";
      }
      if (hundred > 0) {
        result += convertLessThanThousand(hundred);
      }

      return result.trim();
    }

    const rupees = convert(Math.floor(num));
    const paise = Math.round((num % 1) * 100);

    let result = "";
    if (rupees) {
      result += rupees + " Rupees";
    }
    if (paise > 0) {
      result += " and " + convertLessThanThousand(paise) + " Paise";
    }
    result += " Only";

    return result;
  }

  app.get("/api/invoices/:id/pdf", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const invoice = await storage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      // Get customer details for the invoice
      const customers = await storage.getCustomers();
      const customer = customers.find((c) => c.id === invoice.customerId);

      // Generate PDF using jsPDF
      const { jsPDF } = await import("jspdf");

      const doc = new jsPDF();

      // Set up document properties
      doc.setProperties({
        title: `Invoice ${invoice.invoiceNumber}`,
        subject: "Tax Invoice",
        author: "HotTip Inventory System",
      });

      let yPosition = 20;

      // Company Header - Professional TallyPrime Style
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 40, "F");

      // Company Name
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("HOTTIP INDIA POLYMERS", 20, yPosition);

      yPosition += 8;
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("PLASTICS & POLYMERS MANUFACTURING", 20, yPosition);

      yPosition += 6;
      doc.setFontSize(9);
      doc.text(
        "Plot No. 123, Industrial Area, Phase-II, Pune - 411 001, Maharashtra",
        20,
        yPosition
      );

      yPosition += 4;
      doc.text(
        "Email: info@hottipindia.com | Mobile: +91-9876543210",
        20,
        yPosition
      );

      yPosition += 4;
      doc.text(
        "Website: www.hottipindia.com | GST Number: 27AAAAA0000A1Z5",
        20,
        yPosition
      );

      // Invoice Title Box
      yPosition += 10;
      doc.setFillColor(240, 240, 240);
      doc.rect(140, yPosition - 5, 50, 12, "F");
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("TAX INVOICE", 165, yPosition + 2, { align: "center" });

      // Invoice Details Table (Right side)
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Invoice No.: ${invoice.invoiceNumber}`, 140, yPosition + 15);
      doc.text(
        `Date: ${new Date(invoice.invoiceDate).toLocaleDateString("en-IN")}`,
        140,
        yPosition + 22
      );
      doc.text(
        `Due Date: ${
          invoice.dueDate
            ? new Date(invoice.dueDate).toLocaleDateString("en-IN")
            : "-"
        }`,
        140,
        yPosition + 29
      );
      doc.text(
        `Status: ${invoice.status?.toUpperCase() || "-"}`,
        140,
        yPosition + 36
      );

      yPosition += 50;

      // Bill To Section
      doc.setFillColor(245, 245, 245);
      doc.rect(20, yPosition, 85, 35, "F");

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Bill To:", 25, yPosition + 8);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(customer?.name || "-", 25, yPosition + 16);
      if (customer?.address) {
        const addressLines = customer.address.split("\n");
        let addrY = yPosition + 23;
        addressLines.forEach((line) => {
          doc.text(line, 25, addrY);
          addrY += 4;
        });
      }
      if (customer?.gstNumber) {
        doc.text(`GST: ${customer.gstNumber}`, 25, yPosition + 35);
      }

      // Ship To Section
      doc.setFillColor(245, 245, 245);
      doc.rect(105, yPosition, 85, 35, "F");

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Ship To:", 110, yPosition + 8);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(customer?.name || "-", 110, yPosition + 16);
      if (customer?.address) {
        const addressLines = customer.address.split("\n");
        let addrY = yPosition + 23;
        addressLines.forEach((line) => {
          doc.text(line, 110, addrY);
          addrY += 4;
        });
      }

      yPosition += 45;

      // Goods Table Header
      doc.setFillColor(0, 0, 0);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");

      const tableX = 20;
      doc.rect(tableX, yPosition, 170, 8, "F");
      doc.text("Sl No.", tableX + 5, yPosition + 6);
      doc.text("Description", tableX + 20, yPosition + 6);
      doc.text("HSN/SAC", tableX + 80, yPosition + 6);
      doc.text("Quantity", tableX + 105, yPosition + 6);
      doc.text("Rate", tableX + 130, yPosition + 6);
      doc.text("Per", tableX + 150, yPosition + 6);
      doc.text("Amount", tableX + 165, yPosition + 6);

      yPosition += 8;

      // Goods Table Content (simplified - showing subtotal as single consolidated item)
      doc.setFillColor(255, 255, 255);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");

      doc.rect(tableX, yPosition, 170, 8, "F");
      doc.text("1", tableX + 5, yPosition + 6);
      doc.text(
        "Plastics & Polymers Manufacturing Services",
        tableX + 20,
        yPosition + 6
      );
      doc.text("3907", tableX + 80, yPosition + 6); // Sample HSN code
      doc.text("1", tableX + 105, yPosition + 6);
      doc.text(
        `₹${parseFloat(
          invoice.subtotalAmount?.toString() || "0"
        ).toLocaleString("en-IN")}`,
        tableX + 130,
        yPosition + 6
      );
      doc.text("Nos", tableX + 150, yPosition + 6);
      doc.text(
        `₹${parseFloat(
          invoice.subtotalAmount?.toString() || "0"
        ).toLocaleString("en-IN")}`,
        tableX + 165,
        yPosition + 6
      );

      yPosition += 15;

      // Calculate amounts
      const subtotal = parseFloat(invoice.subtotalAmount?.toString() || "0");
      const discount = parseFloat(invoice.discountAmount?.toString() || "0");
      const taxableAmount = subtotal - discount;
      const cgstAmount = parseFloat(invoice.cgstAmount?.toString() || "0");
      const sgstAmount = parseFloat(invoice.sgstAmount?.toString() || "0");
      const igstAmount = parseFloat(invoice.igstAmount?.toString() || "0");
      const totalAmount = parseFloat(invoice.totalAmount?.toString() || "0");

      // Subtotal Row
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const subtotalX = 120;
      doc.text(`Subtotal:`, subtotalX, yPosition);
      doc.text(`₹${subtotal.toLocaleString("en-IN")}`, 175, yPosition, {
        align: "right",
      });

      // Discount Row (if applicable)
      if (discount > 0) {
        yPosition += 6;
        doc.text(`Discount:`, subtotalX, yPosition);
        doc.text(`-₹${discount.toLocaleString("en-IN")}`, 175, yPosition, {
          align: "right",
        });
      }

      // Tax Rows
      if (cgstAmount > 0) {
        yPosition += 6;
        doc.text(`CGST (${invoice.cgstRate || 9}%):`, subtotalX, yPosition);
        doc.text(`₹${cgstAmount.toLocaleString("en-IN")}`, 175, yPosition, {
          align: "right",
        });
      }

      if (sgstAmount > 0) {
        yPosition += 6;
        doc.text(`SGST (${invoice.sgstRate || 9}%):`, subtotalX, yPosition);
        doc.text(`₹${sgstAmount.toLocaleString("en-IN")}`, 175, yPosition, {
          align: "right",
        });
      }

      if (igstAmount > 0) {
        yPosition += 6;
        doc.text(`IGST (${invoice.igstRate || 18}%):`, subtotalX, yPosition);
        doc.text(`₹${igstAmount.toLocaleString("en-IN")}`, 175, yPosition, {
          align: "right",
        });
      }

      // Total Row
      yPosition += 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`Total Amount:`, subtotalX, yPosition);
      doc.text(`₹${totalAmount.toLocaleString("en-IN")}`, 175, yPosition, {
        align: "right",
      });

      // Amount in Words
      yPosition += 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Amount in Words: ${numberToWords(totalAmount)}`, 20, yPosition);

      // Bank Details Section
      yPosition += 15;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Bank Details:", 20, yPosition);

      yPosition += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Bank Name: ICICI Bank", 20, yPosition);
      yPosition += 5;
      doc.text("Account No: 123456789012", 20, yPosition);
      yPosition += 5;
      doc.text("IFSC Code: ICIC0001234", 20, yPosition);
      yPosition += 5;
      doc.text("Branch: Pune, Maharashtra", 20, yPosition);

      // Declaration
      yPosition += 15;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Declaration:", 20, yPosition);
      yPosition += 6;
      doc.text(
        "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.",
        20,
        yPosition
      );

      // Authorized Signature
      yPosition += 15;
      doc.text("For HOTTIP INDIA POLYMERS", 140, yPosition);
      yPosition += 15;
      doc.text("Authorized Signatory", 140, yPosition);

      // Generate PDF buffer
      const pdfBuffer = doc.output("arraybuffer");

      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="Invoice_${invoice.invoiceNumber}.pdf"`
      );

      // Send the PDF buffer
      res.send(Buffer.from(pdfBuffer));
    } catch (error) {
      console.error("Failed to generate invoice PDF:", error);
      res
        .status(500)
        .json({ error: "Failed to generate PDF", details: error.message });
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
    // Return hardcoded, realistic demo data for dashboard counters
    res.json({
      leads: {
        total: 128,
        active: 34,
        converted: 56,
        conversionRate: 43.8,
        monthlyNew: 12,
        pendingFollowUps: 7,
      },
      visits: {
        total: 42,
        completed: 28,
        today: 3,
        scheduled: 5,
        inProgress: 2,
        cancelled: 1,
        successRate: 66.7,
        weeklyCompleted: 12,
      },
      tasks: {
        total: 21,
        completed: 15,
        overdue: 2,
        today: 4,
        completionRate: 71.4,
      },
      attendance: {
        totalEmployees: 18,
        presentToday: 16,
      },
    });
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
      // Map status to lowercase/underscore for frontend compatibility
      const statusMap: Record<string, string> = {
        Scheduled: "scheduled",
        "In Progress": "in_progress",
        Completed: "completed",
        Cancelled: "cancelled",
      };
      const mappedRows = rows.map((v) => ({
        ...v,
        status:
          statusMap[v.status] ||
          v.status?.toLowerCase().replace(/\s+/g, "_") ||
          v.status,
      }));
      res.json(mappedRows);
    } catch (e) {
      res.json([]);
    }
  });
  app.post("/api/field-visits", requireAuth, async (req, res) => {
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

      res.status(201).json({ message: "Task created successfully", task: newTask });    } catch (error: any) {
      console.error("Task creation error:", error);
      res
        .status(500)
        .json({ error: "Failed to create task", details: error.message });
    }
  });

  // Create the HTTP server
  const server = createServer(app);
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });

  return server;
}

