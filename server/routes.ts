import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import {
  //insertUserSchema,
  insertProductSchema,
  insertCustomerSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertSupplierSchema,
  //insertShipmentSchema,
  //insertTaskSchema,
  insertAttendanceSchema,
  insertOutboundQuotationSchema,
  //insertQuotationItemSchema,
  insertInboundQuotationSchema,
  //insertInboundQuotationItemSchema,
  insertInvoiceSchema,
  //insertInvoiceItemSchema,
  //insertStockTransactionSchema,
  //insertSparePartSchema,
  insertBatchSchema,
  insertFabricationOrderSchema,
  //insertReorderPointSchema,
  // insertVendorCommunicationSchema,
  insertInventoryTaskSchema,

  // Accounts schemas
  insertAccountsReceivableSchema,
  insertAccountsPayableSchema,
  insertPaymentSchema,
  insertBankAccountSchema,
  insertBankTransactionSchema,
  insertGstReturnSchema,
  insertAccountReminderSchema,
  insertAccountTaskSchema,
  insertAccountReportSchema,
  insertBarcodeSchema,
  // Marketing schemas
  insertLeadSchema,
  insertFieldVisitSchema,
  insertMarketingTaskSchema,
  insertMarketingAttendanceSchema,
  // Marketing workflow validation schemas
  updateLeadStatusSchema,
  updateFieldVisitStatusSchema,
  updateMarketingTaskStatusSchema,
  fieldVisitCheckInSchema,
  fieldVisitCheckOutSchema,
  convertLeadSchema,
  leadFilterSchema,
  fieldVisitFilterSchema,
  marketingTaskFilterSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express) {
  // Login schema
  const loginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
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
  ) => {
    try {
      // SECURITY FIX: Reject any client-supplied identity headers to prevent spoofing
      if (req.headers["x-user-id"]) {
        return res.status(401).json({
          error: "Security violation",
          message:
            "Client identity headers are not allowed for security reasons",
        });
      }

      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // JWT authentication (production and development)
      const jwtSecret = process.env.JWT_SECRET;

      // Try JWT verification first for both production and development
      if (
        authHeader.startsWith("Bearer ") &&
        !authHeader.startsWith("Bearer dev-") &&
        jwtSecret
      ) {
        try {
          const token = authHeader.replace("Bearer ", "");
          const decoded = jwt.verify(token, jwtSecret, {
            algorithms: ["HS256"],
          }) as any;
          req.user = {
            id: decoded.sub,
            role: decoded.role,
            username: decoded.username,
          };
          return next();
        } catch (jwtError) {
          // In production, JWT failure is final
          if (process.env.NODE_ENV === "production") {
            return res.status(401).json({ error: "Invalid JWT token" });
          }
          // In development, fall through to dev token handling
        }
      }

      // Production requires valid JWT
      if (process.env.NODE_ENV === "production") {
        if (!jwtSecret) {
          throw new Error("JWT_SECRET required in production");
        }
        return res.status(401).json({ error: "Valid JWT token required" });
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
          return res
            .status(401)
            .json({ error: "Invalid development token format" });
        }

        const [userId, timestamp, signature] = parts;

        // Verify HMAC signature (using a server secret)
        const serverSecret = process.env.DEV_TOKEN_SECRET;
        if (!serverSecret) {
          return res.status(401).json({
            error: "Server misconfiguration",
            message:
              "DEV_TOKEN_SECRET environment variable is required for development authentication",
          });
        }

        // Validate timestamp format
        const timestampNum = parseInt(timestamp);
        if (isNaN(timestampNum) || timestampNum <= 0) {
          return res
            .status(401)
            .json({ error: "Invalid development token timestamp" });
        }

        const expectedSignature = crypto
          .createHmac("sha256", serverSecret)
          .update(`${userId}-${timestamp}`)
          .digest("hex"); // Use full HMAC signature for security

        if (signature !== expectedSignature) {
          return res.status(401).json({ error: "Invalid token signature" });
        }

        // Check token age (expire after 24 hours)
        const tokenAge = Date.now() - timestampNum;
        if (tokenAge > 24 * 60 * 60 * 1000) {
          // 24 hours
          return res.status(401).json({ error: "Token expired" });
        }

        const user = await storage.getUser(userId);
        if (!user || !user.isActive) {
          return res.status(401).json({ error: "Invalid or inactive user" });
        }

        req.user = {
          id: user.id,
          role: user.role,
          username: user.username,
        };
        return next();
      }

      return res.status(401).json({ error: "Authentication failed" });
    } catch (error) {
      return res.status(401).json({ error: "Authentication failed" });
    }
  };

  // Role-based authorization middleware for financial/accounts access
  const requireAccountsAccess = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { role } = req.user;
    const allowedRoles = ["admin", "manager"]; // Only admin and manager can access financial reports

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        message: "Access to financial reports requires admin or manager role",
      });
    }

    next();
  };

  // Role-based authorization middleware for marketing metrics and admin operations
  const requireMarketingAccess = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { role } = req.user;
    const allowedRoles = ["admin", "manager"]; // Only admin and manager can access marketing metrics

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        message: "Access to marketing metrics requires admin or manager role",
      });
    }

    next();
  };

  // Combined middleware for reports access
  const requireReportsAccess = [requireAuth, requireAccountsAccess];
  // Authentication endpoints (public routes)
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);

      if (!user || !user.isActive) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error("JWT_SECRET is required");
      }

      const token = jwt.sign(
        { sub: user.id, role: user.role, username: user.username },
        jwtSecret,
        { expiresIn: "15m", algorithm: "HS256" }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Login failed" });
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
    ) => {
      try {
        if (!req.user) {
          return res.status(401).json({ error: "Authentication required" });
        }

        const { role } = req.user;

        // Admin and manager roles have full access
        if (role === "admin" || role === "manager") {
          return next();
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
            case "marketing_attendance":
              entity = await storage.getMarketingAttendance(req.params.id);
              break;
            default:
              return res.status(500).json({ error: "Unknown entity type" });
          }
        } catch (error) {
          return res
            .status(404)
            .json({ error: `${entityType.replace("_", " ")} not found` });
        }

        if (!entity) {
          return res
            .status(404)
            .json({ error: `${entityType.replace("_", " ")} not found` });
        }

        // Check if user owns the resource (assigned to them or created by them)
        const userId = req.user.id;
        const hasAccess =
          entity.assignedTo === userId ||
          entity.createdBy === userId ||
          entity.userId === userId;

        if (!hasAccess) {
          return res.status(403).json({
            error: "Access denied",
            message: "You can only access your own records",
          });
        }

        next();
      } catch (error) {
        return res.status(500).json({ error: "Failed to verify ownership" });
      }
    };
  };

  // Users Routes - SECURED: Only admin can access user management
  app.get("/api/users", requireAuth, requireAdminAccess, async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
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
      const userData = insertUserSchema.parse(req.body);

      // Hash password if provided
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 12);
      }

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
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.put(
    "/api/users/:id",
    requireAuth,
    requireAdminAccess,
    async (req, res) => {
      try {
        const userData = insertUserSchema.partial().parse(req.body);

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
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/low-stock", async (req, res) => {
    try {
      const products = await storage.getLowStockProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch low stock products" });
    }
  });

  app.get("/api/products/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }
      const products = await storage.searchProducts(query);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to search products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      await storage.createActivity({
        userId: null,
        action: "CREATE_PRODUCT",
        entityType: "product",
        entityId: product.id,
        details: `Created product: ${product.name}`,
      });
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid product data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, productData);
      await storage.createActivity({
        userId: null,
        action: "UPDATE_PRODUCT",
        entityType: "product",
        entityId: product.id,
        details: `Updated product: ${product.name}`,
      });
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Customers Routes
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      await storage.createActivity({
        userId: null,
        action: "CREATE_CUSTOMER",
        entityType: "customer",
        entityId: customer.id,
        details: `Created customer: ${customer.name}`,
      });
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid customer data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create customer" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(
        req.params.id,
        customerData
      );
      await storage.createActivity({
        userId: null,
        action: "UPDATE_CUSTOMER",
        entityType: "customer",
        entityId: customer.id,
        details: `Updated customer: ${customer.name}`,
      });
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      await storage.deleteCustomer(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete customer" });
    }
  });

  // Orders Routes
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      const items = await storage.getOrderItems(req.params.id);
      res.json({ ...order, items });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const { items, ...orderData } = req.body;
      const validatedOrder = insertOrderSchema.parse(orderData);
      const order = await storage.createOrder(validatedOrder);

      if (items && items.length > 0) {
        for (const item of items) {
          const validatedItem = insertOrderItemSchema.parse({
            ...item,
            orderId: order.id,
          });
          await storage.createOrderItem(validatedItem);
        }
      }

      await storage.createActivity({
        userId: order.userId,
        action: "CREATE_ORDER",
        entityType: "order",
        entityId: order.id,
        details: `Created order: ${order.orderNumber}`,
      });

      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid order data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const orderData = insertOrderSchema.partial().parse(req.body);
      const order = await storage.updateOrder(req.params.id, orderData);
      await storage.createActivity({
        userId: order.userId,
        action: "UPDATE_ORDER",
        entityType: "order",
        entityId: order.id,
        details: `Updated order: ${order.orderNumber}`,
      });
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      await storage.deleteOrder(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete order" });
    }
  });

  // Suppliers Routes
  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(supplierData);
      await storage.createActivity({
        userId: null,
        action: "CREATE_SUPPLIER",
        entityType: "supplier",
        entityId: supplier.id,
        details: `Created supplier: ${supplier.name}`,
      });
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid supplier data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create supplier" });
    }
  });

  // Shipments Routes
  app.get("/api/shipments", async (req, res) => {
    try {
      const shipments = await storage.getShipments();
      res.json(shipments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shipments" });
    }
  });

  app.post("/api/shipments", async (req, res) => {
    try {
      const shipmentData = insertShipmentSchema.parse(req.body);
      const shipment = await storage.createShipment(shipmentData);
      await storage.createActivity({
        userId: null,
        action: "CREATE_SHIPMENT",
        entityType: "shipment",
        entityId: shipment.id,
        details: `Created shipment: ${shipment.shipmentNumber}`,
      });
      res.status(201).json(shipment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid shipment data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create shipment" });
    }
  });

  // Tasks Routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      await storage.createActivity({
        userId: task.assignedBy,
        action: "CREATE_TASK",
        entityType: "task",
        entityId: task.id,
        details: `Created task: ${task.title}`,
      });
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid task data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const taskData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(req.params.id, taskData);
      await storage.createActivity({
        userId: task.assignedTo,
        action: "UPDATE_TASK",
        entityType: "task",
        entityId: task.id,
        details: `Updated task: ${task.title}`,
      });
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  // Attendance Routes
  app.get("/api/attendance/:userId", async (req, res) => {
    try {
      const attendance = await storage.getAttendanceByUser(req.params.userId);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attendance" });
    }
  });

  app.post("/api/attendance", async (req, res) => {
    try {
      const attendanceData = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.createAttendance(attendanceData);
      res.status(201).json(attendance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid attendance data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create attendance record" });
    }
  });

  app.put("/api/attendance/:id", async (req, res) => {
    try {
      const attendanceData = insertAttendanceSchema.partial().parse(req.body);
      const attendance = await storage.updateAttendance(
        req.params.id,
        attendanceData
      );
      res.json(attendance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid attendance data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update attendance record" });
    }
  });

  app.delete("/api/attendance/:id", async (req, res) => {
    try {
      await storage.deleteAttendance(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete attendance record" });
    }
  });

  // Account-specific Attendance Routes with Authentication
  app.get("/api/account-attendance", requireAuth, async (req, res) => {
    try {
      const { startDate, endDate, department } = req.query;
      const filters = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        department: department as string,
      };
      const attendance = await storage.getAccountsAttendance(filters);
      res.json(attendance);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch account attendance records" });
    }
  });

  app.get("/api/account-attendance/today", requireAuth, async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const attendance = await storage.getAccountsAttendanceByDateRange(
        today,
        tomorrow
      );
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch today's attendance" });
    }
  });

  app.get("/api/account-attendance/summary", requireAuth, async (req, res) => {
    try {
      const { period = "month" } = req.query;
      const summary = await storage.getAccountsAttendanceSummary(
        period as string
      );
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attendance summary" });
    }
  });

  app.get(
    "/api/account-attendance/user/:userId",
    requireAuth,
    async (req, res) => {
      try {
        const { startDate, endDate } = req.query;
        const filters = {
          userId: req.params.userId,
          startDate: startDate ? new Date(startDate as string) : undefined,
          endDate: endDate ? new Date(endDate as string) : undefined,
        };
        const attendance = await storage.getUserAttendanceHistory(filters);
        res.json(attendance);
      } catch (error) {
        res
          .status(500)
          .json({ error: "Failed to fetch user attendance history" });
      }
    }
  );

  app.post(
    "/api/account-attendance/clock-in",
    requireAuth,
    async (req, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ error: "Authentication required" });
        }

        const { location, notes } = req.body;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if already clocked in today
        const existingAttendance = await storage.getAttendance(
          req.user.id,
          today
        );
        if (existingAttendance && existingAttendance.checkIn) {
          return res.status(400).json({ error: "Already clocked in today" });
        }

        const attendanceData = {
          userId: req.user.id,
          date: new Date(),
          checkIn: new Date(),
          location: location || "Office",
          status: "present",
          notes: notes || "",
        };

        const attendance = await storage.createAttendance(attendanceData);
        await storage.createActivity({
          userId: req.user.id,
          action: "CLOCK_IN",
          entityType: "attendance",
          entityId: attendance.id,
          details: `Clocked in at ${attendance.checkIn?.toLocaleTimeString()}`,
        });

        res.status(201).json(attendance);
      } catch (error) {
        res.status(500).json({ error: "Failed to clock in" });
      }
    }
  );

  app.post(
    "/api/account-attendance/clock-out",
    requireAuth,
    async (req, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ error: "Authentication required" });
        }

        const { notes } = req.body;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find today's attendance record
        const existingAttendance = await storage.getAttendance(
          req.user.id,
          today
        );
        if (!existingAttendance || !existingAttendance.checkIn) {
          return res.status(400).json({ error: "Must clock in first" });
        }

        if (existingAttendance.checkOut) {
          return res.status(400).json({ error: "Already clocked out today" });
        }

        const updatedAttendance = await storage.updateAttendance(
          existingAttendance.id,
          {
            checkOut: new Date(),
            notes: notes
              ? `${existingAttendance.notes || ""}\n${notes}`
              : existingAttendance.notes,
          }
        );

        await storage.createActivity({
          userId: req.user.id,
          action: "CLOCK_OUT",
          entityType: "attendance",
          entityId: updatedAttendance.id,
          details: `Clocked out at ${updatedAttendance.checkOut?.toLocaleTimeString()}`,
        });

        res.json(updatedAttendance);
      } catch (error) {
        res.status(500).json({ error: "Failed to clock out" });
      }
    }
  );

  app.get("/api/account-attendance/metrics", requireAuth, async (req, res) => {
    try {
      const metrics = await storage.getAttendanceMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attendance metrics" });
    }
  });

  // Outbound Quotations Routes
  app.get("/api/outbound-quotations", async (req, res) => {
    try {
      const quotations = await storage.getOutboundQuotations();
      res.json(quotations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch outbound quotations" });
    }
  });

  app.get("/api/outbound-quotations/:id", async (req, res) => {
    try {
      const quotation = await storage.getOutboundQuotation(req.params.id);
      if (!quotation) {
        return res.status(404).json({ error: "Outbound quotation not found" });
      }
      res.json(quotation);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch outbound quotation" });
    }
  });

  app.post("/api/outbound-quotations", async (req, res) => {
    try {
      const quotationData = insertOutboundQuotationSchema.parse(req.body);
      const quotation = await storage.createOutboundQuotation(quotationData);
      await storage.createActivity({
        userId: quotation.userId,
        action: "CREATE_OUTBOUND_QUOTATION",
        entityType: "outbound_quotation",
        entityId: quotation.id,
        details: `Created outbound quotation: ${quotation.quotationNumber}`,
      });
      res.status(201).json(quotation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid quotation data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create outbound quotation" });
    }
  });

  app.put("/api/outbound-quotations/:id", async (req, res) => {
    try {
      const quotationData = insertOutboundQuotationSchema
        .partial()
        .parse(req.body);
      const quotation = await storage.updateOutboundQuotation(
        req.params.id,
        quotationData
      );
      await storage.createActivity({
        userId: quotation.userId,
        action: "UPDATE_OUTBOUND_QUOTATION",
        entityType: "outbound_quotation",
        entityId: quotation.id,
        details: `Updated outbound quotation: ${quotation.quotationNumber}`,
      });
      res.json(quotation);
    } catch (error) {
      res.status(500).json({ error: "Failed to update outbound quotation" });
    }
  });

  app.delete("/api/outbound-quotations/:id", async (req, res) => {
    try {
      await storage.deleteOutboundQuotation(req.params.id);
      await storage.createActivity({
        userId: null,
        action: "DELETE_OUTBOUND_QUOTATION",
        entityType: "outbound_quotation",
        entityId: req.params.id,
        details: `Deleted outbound quotation`,
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete outbound quotation" });
    }
  });

  app.post(
    "/api/outbound-quotations/:id/convert-to-invoice",
    async (req, res) => {
      try {
        const invoice = await storage.convertQuotationToInvoice(req.params.id);
        await storage.createActivity({
          userId: invoice.userId,
          action: "CONVERT_QUOTATION_TO_INVOICE",
          entityType: "invoice",
          entityId: invoice.id,
          details: `Converted quotation to invoice: ${invoice.invoiceNumber}`,
        });
        res.status(201).json(invoice);
      } catch (error) {
        res
          .status(500)
          .json({ error: "Failed to convert quotation to invoice" });
      }
    }
  );

  // Inbound Quotations Routes
  app.get("/api/inbound-quotations", async (req, res) => {
    try {
      const quotations = await storage.getInboundQuotations();
      res.json(quotations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inbound quotations" });
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

  app.post("/api/inbound-quotations", async (req, res) => {
    try {
      const quotationData = insertInboundQuotationSchema.parse(req.body);
      const quotation = await storage.createInboundQuotation(quotationData);
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
      res.status(500).json({ error: "Failed to create inbound quotation" });
    }
  });

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

  // Invoice Routes
  app.get("/api/invoices", async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
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
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });

  app.put("/api/invoices/:id", async (req, res) => {
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

  // Dashboard & Analytics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  app.get("/api/activities", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // Object Storage Routes for File Upload

  // This endpoint is used to serve private objects (quotation attachments)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // This endpoint is used to get the upload URL for an object entity
  app.post("/api/objects/upload", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Update inbound quotation with attachment info after upload
  app.put("/api/inbound-quotations/:id/attachment", async (req, res) => {
    if (!req.body.attachmentURL) {
      return res.status(400).json({ error: "attachmentURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(
        req.body.attachmentURL
      );

      // Update the inbound quotation with attachment info
      const quotation = await storage.updateInboundQuotation(req.params.id, {
        attachmentPath: objectPath,
        attachmentName: req.body.attachmentName || "uploaded-file",
      });

      res.status(200).json({
        objectPath: objectPath,
        quotation: quotation,
      });
    } catch (error) {
      console.error("Error updating quotation attachment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Stock Transactions Routes
  app.get("/api/stock-transactions", async (req, res) => {
    try {
      const transactions = await storage.getStockTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock transactions" });
    }
  });

  app.get("/api/stock-transactions/:id", async (req, res) => {
    try {
      const transaction = await storage.getStockTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ error: "Stock transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock transaction" });
    }
  });

  app.post("/api/stock-transactions", async (req, res) => {
    try {
      const transactionData = insertStockTransactionSchema.parse(req.body);
      const transaction = await storage.createStockTransaction(transactionData);
      await storage.createActivity({
        userId: transaction.userId,
        action: "CREATE_STOCK_TRANSACTION",
        entityType: "stock_transaction",
        entityId: transaction.id,
        details: `Created stock transaction: ${transaction.type} ${transaction.quantity} units`,
      });
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid transaction data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create stock transaction" });
    }
  });

  app.put("/api/stock-transactions/:id", async (req, res) => {
    try {
      const transactionData = insertStockTransactionSchema
        .partial()
        .parse(req.body);
      const transaction = await storage.updateStockTransaction(
        req.params.id,
        transactionData
      );
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to update stock transaction" });
    }
  });

  app.delete("/api/stock-transactions/:id", async (req, res) => {
    try {
      await storage.deleteStockTransaction(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete stock transaction" });
    }
  });

  // Spare Parts Routes
  app.get("/api/spare-parts", async (req, res) => {
    try {
      const spareParts = await storage.getSpareParts();
      res.json(spareParts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch spare parts" });
    }
  });

  app.get("/api/spare-parts/low-stock", async (req, res) => {
    try {
      const spareParts = await storage.getLowStockSpareParts();
      res.json(spareParts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch low stock spare parts" });
    }
  });

  app.get("/api/spare-parts/:id", async (req, res) => {
    try {
      const sparePart = await storage.getSparePart(req.params.id);
      if (!sparePart) {
        return res.status(404).json({ error: "Spare part not found" });
      }
      res.json(sparePart);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch spare part" });
    }
  });

  app.post("/api/spare-parts", async (req, res) => {
    try {
      const sparePartData = insertSparePartSchema.parse(req.body);
      const sparePart = await storage.createSparePart(sparePartData);
      await storage.createActivity({
        userId: null,
        action: "CREATE_SPARE_PART",
        entityType: "spare_part",
        entityId: sparePart.id,
        details: `Created spare part: ${sparePart.name}`,
      });
      res.status(201).json(sparePart);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid spare part data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create spare part" });
    }
  });

  app.put("/api/spare-parts/:id", async (req, res) => {
    try {
      const sparePartData = insertSparePartSchema.partial().parse(req.body);
      const sparePart = await storage.updateSparePart(
        req.params.id,
        sparePartData
      );
      res.json(sparePart);
    } catch (error) {
      res.status(500).json({ error: "Failed to update spare part" });
    }
  });

  app.delete("/api/spare-parts/:id", async (req, res) => {
    try {
      await storage.deleteSparePart(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete spare part" });
    }
  });

  // Batches Routes
  app.get("/api/batches", async (req, res) => {
    try {
      const batches = await storage.getBatches();
      res.json(batches);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch batches" });
    }
  });

  app.get("/api/batches/:id", async (req, res) => {
    try {
      const batch = await storage.getBatch(req.params.id);
      if (!batch) {
        return res.status(404).json({ error: "Batch not found" });
      }
      res.json(batch);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch batch" });
    }
  });

  app.post("/api/batches", async (req, res) => {
    try {
      const batchData = insertBatchSchema.parse(req.body);
      const batch = await storage.createBatch(batchData);
      await storage.createActivity({
        userId: null,
        action: "CREATE_BATCH",
        entityType: "batch",
        entityId: batch.id,
        details: `Created batch: ${batch.batchNumber}`,
      });
      res.status(201).json(batch);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid batch data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create batch" });
    }
  });

  app.put("/api/batches/:id", async (req, res) => {
    try {
      const batchData = insertBatchSchema.partial().parse(req.body);
      const batch = await storage.updateBatch(req.params.id, batchData);
      res.json(batch);
    } catch (error) {
      res.status(500).json({ error: "Failed to update batch" });
    }
  });

  app.delete("/api/batches/:id", async (req, res) => {
    try {
      await storage.deleteBatch(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete batch" });
    }
  });

  // Barcodes Routes
  app.get("/api/barcodes", async (req, res) => {
    try {
      const barcodes = await storage.getBarcodes();
      res.json(barcodes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch barcodes" });
    }
  });

  app.get("/api/barcodes/:id", async (req, res) => {
    try {
      const barcode = await storage.getBarcode(req.params.id);
      if (!barcode) {
        return res.status(404).json({ error: "Barcode not found" });
      }
      res.json(barcode);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch barcode" });
    }
  });

  app.get("/api/barcodes/scan/:code", async (req, res) => {
    try {
      const barcode = await storage.getBarcodeByCode(req.params.code);
      if (!barcode) {
        return res.status(404).json({ error: "Barcode not found" });
      }
      res.json(barcode);
    } catch (error) {
      res.status(500).json({ error: "Failed to scan barcode" });
    }
  });

  app.post("/api/barcodes", async (req, res) => {
    try {
      const barcodeData = insertBarcodeSchema.parse(req.body);
      const barcode = await storage.createBarcode(barcodeData);
      res.status(201).json(barcode);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid barcode data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create barcode" });
    }
  });

  app.delete("/api/barcodes/:id", async (req, res) => {
    try {
      await storage.deleteBarcode(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete barcode" });
    }
  });

  // Fabrication Orders Routes
  app.get("/api/fabrication-orders", async (req, res) => {
    try {
      const orders = await storage.getFabricationOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch fabrication orders" });
    }
  });

  app.get("/api/fabrication-orders/:id", async (req, res) => {
    try {
      const order = await storage.getFabricationOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Fabrication order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch fabrication order" });
    }
  });

  app.post("/api/fabrication-orders", async (req, res) => {
    try {
      const orderData = insertFabricationOrderSchema.parse(req.body);
      const order = await storage.createFabricationOrder(orderData);
      await storage.createActivity({
        userId: order.createdBy,
        action: "CREATE_FABRICATION_ORDER",
        entityType: "fabrication_order",
        entityId: order.id,
        details: `Created fabrication order: ${order.orderNumber}`,
      });
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid fabrication order data",
          details: error.errors,
        });
      }
      res.status(500).json({ error: "Failed to create fabrication order" });
    }
  });

  app.put("/api/fabrication-orders/:id", async (req, res) => {
    try {
      const orderData = insertFabricationOrderSchema.partial().parse(req.body);
      const order = await storage.updateFabricationOrder(
        req.params.id,
        orderData
      );
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update fabrication order" });
    }
  });

  app.delete("/api/fabrication-orders/:id", async (req, res) => {
    try {
      await storage.deleteFabricationOrder(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete fabrication order" });
    }
  });

  // Reorder Points Routes
  app.get("/api/reorder-points", async (req, res) => {
    try {
      const reorderPoints = await storage.getReorderPoints();
      res.json(reorderPoints);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reorder points" });
    }
  });

  app.get("/api/reorder-points/triggered", async (req, res) => {
    try {
      const triggeredPoints = await storage.getTriggeredReorderPoints();
      res.json(triggeredPoints);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch triggered reorder points" });
    }
  });

  app.get("/api/reorder-points/:id", async (req, res) => {
    try {
      const reorderPoint = await storage.getReorderPoint(req.params.id);
      if (!reorderPoint) {
        return res.status(404).json({ error: "Reorder point not found" });
      }
      res.json(reorderPoint);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reorder point" });
    }
  });

  app.post("/api/reorder-points", async (req, res) => {
    try {
      const reorderPointData = insertReorderPointSchema.parse(req.body);
      const reorderPoint = await storage.createReorderPoint(reorderPointData);
      res.status(201).json(reorderPoint);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid reorder point data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create reorder point" });
    }
  });

  app.put("/api/reorder-points/:id", async (req, res) => {
    try {
      const reorderPointData = insertReorderPointSchema
        .partial()
        .parse(req.body);
      const reorderPoint = await storage.updateReorderPoint(
        req.params.id,
        reorderPointData
      );
      res.json(reorderPoint);
    } catch (error) {
      res.status(500).json({ error: "Failed to update reorder point" });
    }
  });

  app.delete("/api/reorder-points/:id", async (req, res) => {
    try {
      await storage.deleteReorderPoint(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete reorder point" });
    }
  });

  // Vendor Communications Routes
  app.get("/api/vendor-communications", async (req, res) => {
    try {
      const communications = await storage.getVendorCommunications();
      res.json(communications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor communications" });
    }
  });

  app.get("/api/vendor-communications/:id", async (req, res) => {
    try {
      const communication = await storage.getVendorCommunication(req.params.id);
      if (!communication) {
        return res
          .status(404)
          .json({ error: "Vendor communication not found" });
      }
      res.json(communication);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor communication" });
    }
  });

  app.post("/api/vendor-communications", async (req, res) => {
    try {
      const communicationData = insertVendorCommunicationSchema.parse(req.body);
      const communication = await storage.createVendorCommunication(
        communicationData
      );
      await storage.createActivity({
        userId: communication.userId,
        action: "CREATE_VENDOR_COMMUNICATION",
        entityType: "vendor_communication",
        entityId: communication.id,
        details: `Created vendor communication: ${communication.subject}`,
      });
      res.status(201).json(communication);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid communication data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create vendor communication" });
    }
  });

  app.put("/api/vendor-communications/:id", async (req, res) => {
    try {
      const communicationData = insertVendorCommunicationSchema
        .partial()
        .parse(req.body);
      const communication = await storage.updateVendorCommunication(
        req.params.id,
        communicationData
      );
      res.json(communication);
    } catch (error) {
      res.status(500).json({ error: "Failed to update vendor communication" });
    }
  });

  app.delete("/api/vendor-communications/:id", async (req, res) => {
    try {
      await storage.deleteVendorCommunication(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete vendor communication" });
    }
  });

  // Inventory Tasks Routes
  app.get("/api/inventory-tasks", async (req, res) => {
    try {
      const tasks = await storage.getInventoryTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory tasks" });
    }
  });

  app.get("/api/inventory-tasks/:id", async (req, res) => {
    try {
      const task = await storage.getInventoryTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Inventory task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory task" });
    }
  });

  app.post("/api/inventory-tasks", async (req, res) => {
    try {
      const taskData = insertInventoryTaskSchema.parse(req.body);
      const task = await storage.createInventoryTask(taskData);
      await storage.createActivity({
        userId: task.assignedBy,
        action: "CREATE_INVENTORY_TASK",
        entityType: "inventory_task",
        entityId: task.id,
        details: `Created inventory task: ${task.title}`,
      });
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid task data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create inventory task" });
    }
  });

  app.put("/api/inventory-tasks/:id", async (req, res) => {
    try {
      const taskData = insertInventoryTaskSchema.partial().parse(req.body);
      const task = await storage.updateInventoryTask(req.params.id, taskData);
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to update inventory task" });
    }
  });

  app.delete("/api/inventory-tasks/:id", async (req, res) => {
    try {
      await storage.deleteInventoryTask(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete inventory task" });
    }
  });

  // ===== ACCOUNTS MODULE ROUTES =====

  // Accounts Receivables Routes
  app.get("/api/accounts-receivables", async (req, res) => {
    try {
      const receivables = await storage.getAccountsReceivables();
      res.json(receivables);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch accounts receivables" });
    }
  });

  app.get("/api/accounts-receivables/overdue", async (req, res) => {
    try {
      const receivables = await storage.getOverdueReceivables();
      res.json(receivables);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch overdue receivables" });
    }
  });

  app.get(
    "/api/accounts-receivables/customer/:customerId",
    async (req, res) => {
      try {
        const receivables = await storage.getAccountsReceivablesByCustomer(
          req.params.customerId
        );
        res.json(receivables);
      } catch (error) {
        res
          .status(500)
          .json({ error: "Failed to fetch receivables by customer" });
      }
    }
  );

  app.get("/api/accounts-receivables/:id", async (req, res) => {
    try {
      const receivable = await storage.getAccountsReceivable(req.params.id);
      if (!receivable) {
        return res.status(404).json({ error: "Accounts receivable not found" });
      }
      res.json(receivable);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch accounts receivable" });
    }
  });

  app.post("/api/accounts-receivables", async (req, res) => {
    try {
      const receivableData = insertAccountsReceivableSchema.parse(req.body);
      const receivable = await storage.createAccountsReceivable(receivableData);
      await storage.createActivity({
        userId: receivable.customerId,
        action: "CREATE_ACCOUNTS_RECEIVABLE",
        entityType: "accounts_receivable",
        entityId: receivable.id,
        details: `Created accounts receivable for amount ${receivable.amountDue}`,
      });
      res.status(201).json(receivable);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid receivable data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create accounts receivable" });
    }
  });

  app.put("/api/accounts-receivables/:id", async (req, res) => {
    try {
      const receivableData = insertAccountsReceivableSchema
        .partial()
        .parse(req.body);
      const receivable = await storage.updateAccountsReceivable(
        req.params.id,
        receivableData
      );
      res.json(receivable);
    } catch (error) {
      res.status(500).json({ error: "Failed to update accounts receivable" });
    }
  });

  app.delete("/api/accounts-receivables/:id", async (req, res) => {
    try {
      await storage.deleteAccountsReceivable(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete accounts receivable" });
    }
  });

  // Accounts Payables Routes
  app.get("/api/accounts-payables", async (req, res) => {
    try {
      const payables = await storage.getAccountsPayables();
      res.json(payables);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch accounts payables" });
    }
  });

  app.get("/api/accounts-payables/overdue", async (req, res) => {
    try {
      const payables = await storage.getOverduePayables();
      res.json(payables);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch overdue payables" });
    }
  });

  app.get("/api/accounts-payables/supplier/:supplierId", async (req, res) => {
    try {
      const payables = await storage.getAccountsPayablesBySupplier(
        req.params.supplierId
      );
      res.json(payables);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payables by supplier" });
    }
  });

  app.get("/api/accounts-payables/:id", async (req, res) => {
    try {
      const payable = await storage.getAccountsPayable(req.params.id);
      if (!payable) {
        return res.status(404).json({ error: "Accounts payable not found" });
      }
      res.json(payable);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch accounts payable" });
    }
  });

  app.post("/api/accounts-payables", async (req, res) => {
    try {
      const payableData = insertAccountsPayableSchema.parse(req.body);
      const payable = await storage.createAccountsPayable(payableData);
      await storage.createActivity({
        userId: payable.supplierId,
        action: "CREATE_ACCOUNTS_PAYABLE",
        entityType: "accounts_payable",
        entityId: payable.id,
        details: `Created accounts payable for amount ${payable.amountDue}`,
      });
      res.status(201).json(payable);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid payable data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create accounts payable" });
    }
  });

  app.put("/api/accounts-payables/:id", async (req, res) => {
    try {
      const payableData = insertAccountsPayableSchema.partial().parse(req.body);
      const payable = await storage.updateAccountsPayable(
        req.params.id,
        payableData
      );
      res.json(payable);
    } catch (error) {
      res.status(500).json({ error: "Failed to update accounts payable" });
    }
  });

  app.delete("/api/accounts-payables/:id", async (req, res) => {
    try {
      await storage.deleteAccountsPayable(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete accounts payable" });
    }
  });

  // Payments Routes
  app.get("/api/payments", async (req, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.get("/api/payments/kind/:kind", async (req, res) => {
    try {
      const payments = await storage.getPaymentsByKind(req.params.kind);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payments by kind" });
    }
  });

  app.get("/api/payments/method/:method", async (req, res) => {
    try {
      const payments = await storage.getPaymentsByMethod(req.params.method);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payments by method" });
    }
  });

  app.get("/api/payments/:id", async (req, res) => {
    try {
      const payment = await storage.getPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payment" });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(paymentData);
      await storage.createActivity({
        userId: payment.id,
        action: "CREATE_PAYMENT",
        entityType: "payment",
        entityId: payment.id,
        details: `Created ${payment.kind} payment for amount ${payment.amount}`,
      });
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid payment data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  app.put("/api/payments/:id", async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.partial().parse(req.body);
      const payment = await storage.updatePayment(req.params.id, paymentData);
      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: "Failed to update payment" });
    }
  });

  app.delete("/api/payments/:id", async (req, res) => {
    try {
      await storage.deletePayment(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete payment" });
    }
  });

  // Bank Accounts Routes
  app.get("/api/bank-accounts", async (req, res) => {
    try {
      const accounts = await storage.getBankAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bank accounts" });
    }
  });

  app.get("/api/bank-accounts/active", async (req, res) => {
    try {
      const accounts = await storage.getActiveBankAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active bank accounts" });
    }
  });

  app.get("/api/bank-accounts/default", async (req, res) => {
    try {
      const account = await storage.getDefaultBankAccount();
      if (!account) {
        return res.status(404).json({ error: "No default bank account found" });
      }
      res.json(account);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch default bank account" });
    }
  });

  app.get("/api/bank-accounts/:id", async (req, res) => {
    try {
      const account = await storage.getBankAccount(req.params.id);
      if (!account) {
        return res.status(404).json({ error: "Bank account not found" });
      }
      res.json(account);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bank account" });
    }
  });

  app.post("/api/bank-accounts", async (req, res) => {
    try {
      const accountData = insertBankAccountSchema.parse(req.body);
      const account = await storage.createBankAccount(accountData);
      await storage.createActivity({
        userId: account.id,
        action: "CREATE_BANK_ACCOUNT",
        entityType: "bank_account",
        entityId: account.id,
        details: `Created bank account: ${account.name}`,
      });
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid bank account data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create bank account" });
    }
  });

  app.put("/api/bank-accounts/:id", async (req, res) => {
    try {
      const accountData = insertBankAccountSchema.partial().parse(req.body);
      const account = await storage.updateBankAccount(
        req.params.id,
        accountData
      );
      res.json(account);
    } catch (error) {
      res.status(500).json({ error: "Failed to update bank account" });
    }
  });

  app.delete("/api/bank-accounts/:id", async (req, res) => {
    try {
      await storage.deleteBankAccount(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete bank account" });
    }
  });

  // Bank Transactions Routes
  app.get("/api/bank-transactions", async (req, res) => {
    try {
      const transactions = await storage.getBankTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bank transactions" });
    }
  });

  app.get("/api/bank-transactions/account/:accountId", async (req, res) => {
    try {
      const transactions = await storage.getBankTransactionsByAccount(
        req.params.accountId
      );
      res.json(transactions);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch transactions by account" });
    }
  });

  app.get("/api/bank-transactions/:id", async (req, res) => {
    try {
      const transaction = await storage.getBankTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ error: "Bank transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bank transaction" });
    }
  });

  app.post("/api/bank-transactions", async (req, res) => {
    try {
      const transactionData = insertBankTransactionSchema.parse(req.body);
      const transaction = await storage.createBankTransaction(transactionData);
      await storage.createActivity({
        userId: transaction.id,
        action: "CREATE_BANK_TRANSACTION",
        entityType: "bank_transaction",
        entityId: transaction.id,
        details: `Created bank transaction for amount ${transaction.amount}`,
      });
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid transaction data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create bank transaction" });
    }
  });

  app.put("/api/bank-transactions/:id", async (req, res) => {
    try {
      const transactionData = insertBankTransactionSchema
        .partial()
        .parse(req.body);
      const transaction = await storage.updateBankTransaction(
        req.params.id,
        transactionData
      );
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to update bank transaction" });
    }
  });

  app.delete("/api/bank-transactions/:id", async (req, res) => {
    try {
      await storage.deleteBankTransaction(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete bank transaction" });
    }
  });

  // GST Returns Routes
  app.get("/api/gst-returns", async (req, res) => {
    try {
      const returns = await storage.getGstReturns();
      res.json(returns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch GST returns" });
    }
  });

  app.get("/api/gst-returns/status/:status", async (req, res) => {
    try {
      const returns = await storage.getGstReturnsByStatus(req.params.status);
      res.json(returns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch GST returns by status" });
    }
  });

  app.get("/api/gst-returns/:id", async (req, res) => {
    try {
      const gstReturn = await storage.getGstReturn(req.params.id);
      if (!gstReturn) {
        return res.status(404).json({ error: "GST return not found" });
      }
      res.json(gstReturn);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch GST return" });
    }
  });

  app.post("/api/gst-returns", async (req, res) => {
    try {
      const returnData = insertGstReturnSchema.parse(req.body);
      const gstReturn = await storage.createGstReturn(returnData);
      await storage.createActivity({
        userId: gstReturn.id,
        action: "CREATE_GST_RETURN",
        entityType: "gst_return",
        entityId: gstReturn.id,
        details: `Created GST return for period ${gstReturn.periodStart} to ${gstReturn.periodEnd}`,
      });
      res.status(201).json(gstReturn);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid GST return data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create GST return" });
    }
  });

  app.put("/api/gst-returns/:id", async (req, res) => {
    try {
      const returnData = insertGstReturnSchema.partial().parse(req.body);
      const gstReturn = await storage.updateGstReturn(
        req.params.id,
        returnData
      );
      res.json(gstReturn);
    } catch (error) {
      res.status(500).json({ error: "Failed to update GST return" });
    }
  });

  app.delete("/api/gst-returns/:id", async (req, res) => {
    try {
      await storage.deleteGstReturn(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete GST return" });
    }
  });

  // Account Reminders Routes
  app.get("/api/account-reminders", async (req, res) => {
    try {
      const reminders = await storage.getAccountReminders();
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch account reminders" });
    }
  });

  app.get("/api/account-reminders/pending", async (req, res) => {
    try {
      const reminders = await storage.getPendingReminders();
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending reminders" });
    }
  });

  app.get("/api/account-reminders/target/:targetType", async (req, res) => {
    try {
      const reminders = await storage.getRemindersByTargetType(
        req.params.targetType
      );
      res.json(reminders);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch reminders by target type" });
    }
  });

  app.get("/api/account-reminders/:id", async (req, res) => {
    try {
      const reminder = await storage.getAccountReminder(req.params.id);
      if (!reminder) {
        return res.status(404).json({ error: "Account reminder not found" });
      }
      res.json(reminder);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch account reminder" });
    }
  });

  app.post("/api/account-reminders", async (req, res) => {
    try {
      const reminderData = insertAccountReminderSchema.parse(req.body);
      const reminder = await storage.createAccountReminder(reminderData);
      await storage.createActivity({
        userId: reminder.id,
        action: "CREATE_ACCOUNT_REMINDER",
        entityType: "account_reminder",
        entityId: reminder.id,
        details: `Created account reminder for ${reminder.targetType}`,
      });
      res.status(201).json(reminder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid reminder data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create account reminder" });
    }
  });

  app.put("/api/account-reminders/:id", async (req, res) => {
    try {
      const reminderData = insertAccountReminderSchema
        .partial()
        .parse(req.body);
      const reminder = await storage.updateAccountReminder(
        req.params.id,
        reminderData
      );
      res.json(reminder);
    } catch (error) {
      res.status(500).json({ error: "Failed to update account reminder" });
    }
  });

  app.delete("/api/account-reminders/:id", async (req, res) => {
    try {
      await storage.deleteAccountReminder(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete account reminder" });
    }
  });

  // Account Reports Routes - Protected with authentication and authorization
  app.get(
    "/api/reports",
    ...requireReportsAccess,
    async (req: AuthenticatedRequest, res) => {
      try {
        const reports = await storage.getAccountReports();
        res.json(reports);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch reports" });
      }
    }
  );

  app.get(
    "/api/reports/type/:type",
    ...requireReportsAccess,
    async (req: AuthenticatedRequest, res) => {
      try {
        const reports = await storage.getReportsByType(req.params.type);
        res.json(reports);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch reports by type" });
      }
    }
  );

  app.get(
    "/api/reports/status/:status",
    ...requireReportsAccess,
    async (req: AuthenticatedRequest, res) => {
      try {
        const reports = await storage.getReportsByStatus(req.params.status);
        res.json(reports);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch reports by status" });
      }
    }
  );

  app.get(
    "/api/reports/:id",
    ...requireReportsAccess,
    async (req: AuthenticatedRequest, res) => {
      try {
        const report = await storage.getAccountReport(req.params.id);
        if (!report) {
          return res.status(404).json({ error: "Report not found" });
        }
        res.json(report);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch report" });
      }
    }
  );

  app.post(
    "/api/reports",
    ...requireReportsAccess,
    async (req: AuthenticatedRequest, res) => {
      try {
        const reportData = insertAccountReportSchema.parse(req.body);
        const report = await storage.createAccountReport(reportData);
        await storage.createActivity({
          userId: report.generatedBy,
          action: "CREATE_ACCOUNT_REPORT",
          entityType: "account_report",
          entityId: report.id,
          details: `Generated ${report.reportType} report: ${report.title}`,
        });
        res.status(201).json(report);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ error: "Invalid report data", details: error.errors });
        }
        res.status(500).json({ error: "Failed to generate report" });
      }
    }
  );

  app.put(
    "/api/reports/:id",
    ...requireReportsAccess,
    async (req: AuthenticatedRequest, res) => {
      try {
        const reportData = insertAccountReportSchema.partial().parse(req.body);
        const report = await storage.updateAccountReport(
          req.params.id,
          reportData
        );
        res.json(report);
      } catch (error) {
        res.status(500).json({ error: "Failed to update report" });
      }
    }
  );

  app.delete(
    "/api/reports/:id",
    ...requireReportsAccess,
    async (req: AuthenticatedRequest, res) => {
      try {
        await storage.deleteAccountReport(req.params.id);
        res.status(204).send();
      } catch (error) {
        res.status(500).json({ error: "Failed to delete report" });
      }
    }
  );

  app.get(
    "/api/reports/:id/export",
    ...requireReportsAccess,
    async (req: AuthenticatedRequest, res) => {
      try {
        const format = (req.query.format as string) || "pdf";
        const report = await storage.getAccountReport(req.params.id);
        if (!report) {
          return res.status(404).json({ error: "Report not found" });
        }

        // Generate export file (this would typically call a service to generate PDF/Excel/CSV)
        const exportData = await storage.exportReport(req.params.id, format);

        // Track download
        await storage.incrementReportDownload(req.params.id);

        res.json({
          success: true,
          format,
          downloadUrl: exportData.url,
          fileName: exportData.fileName,
        });
      } catch (error) {
        res.status(500).json({ error: "Failed to export report" });
      }
    }
  );

  // Account Tasks Routes
  app.get("/api/account-tasks", async (req, res) => {
    try {
      const tasks = await storage.getAccountTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch account tasks" });
    }
  });

  app.get("/api/account-tasks/assignee/:assigneeId", async (req, res) => {
    try {
      const tasks = await storage.getAccountTasksByAssignee(
        req.params.assigneeId
      );
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks by assignee" });
    }
  });

  app.get("/api/account-tasks/status/:status", async (req, res) => {
    try {
      const tasks = await storage.getAccountTasksByStatus(req.params.status);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks by status" });
    }
  });

  app.get("/api/account-tasks/type/:type", async (req, res) => {
    try {
      const tasks = await storage.getAccountTasksByType(req.params.type);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks by type" });
    }
  });

  app.get("/api/account-tasks/:id", async (req, res) => {
    try {
      const task = await storage.getAccountTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Account task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch account task" });
    }
  });

  app.post("/api/account-tasks", async (req, res) => {
    try {
      const taskData = insertAccountTaskSchema.parse(req.body);
      const task = await storage.createAccountTask(taskData);
      await storage.createActivity({
        userId: task.assignedBy,
        action: "CREATE_ACCOUNT_TASK",
        entityType: "account_task",
        entityId: task.id,
        details: `Created account task: ${task.title}`,
      });
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid task data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create account task" });
    }
  });

  app.put("/api/account-tasks/:id", async (req, res) => {
    try {
      const taskData = insertAccountTaskSchema.partial().parse(req.body);
      const task = await storage.updateAccountTask(req.params.id, taskData);
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to update account task" });
    }
  });

  app.delete("/api/account-tasks/:id", async (req, res) => {
    try {
      await storage.deleteAccountTask(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete account task" });
    }
  });

  // Accounts Analytics Routes
  app.get("/api/accounts/dashboard-metrics", async (req, res) => {
    try {
      const metrics = await storage.getAccountsDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch accounts dashboard metrics" });
    }
  });

  app.get("/api/accounts/cash-flow-summary", async (req, res) => {
    try {
      const summary = await storage.getCashFlowSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cash flow summary" });
    }
  });

  app.get("/api/accounts/receivables-total", async (req, res) => {
    try {
      const total = await storage.getTotalReceivablesAmount();
      res.json({ total });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch total receivables amount" });
    }
  });

  app.get("/api/accounts/payables-total", async (req, res) => {
    try {
      const total = await storage.getTotalPayablesAmount();
      res.json({ total });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch total payables amount" });
    }
  });

  // ==========================================
  // MARKETING MODULE API ROUTES REGISTRY
  // ==========================================

  // Import marketing routes registry and register routes
  const { registerMarketingRoutes } = await import(
    "./marketing-routes-registry"
  );

  registerMarketingRoutes(app, {
    requireAuth,
    requireMarketingAccess,
    checkOwnership,
  });

  // ==========================================
  // MARKETING ROUTES REGISTRY IMPLEMENTATION COMPLETE
  // All marketing routes now handled by registry above
  // ==========================================

  // All marketing route registrations removed - handled by registry above

  app.get(
    "/api/field-visits/today",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const visits = await storage.getTodayFieldVisits();
        res.json(visits);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch today's field visits" });
      }
    }
  );

  app.get(
    "/api/field-visits/metrics",
    requireAuth,
    requireMarketingAccess,
    async (req: AuthenticatedRequest, res) => {
      try {
        const metrics = await storage.getVisitMetrics();
        res.json(metrics);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch field visit metrics" });
      }
    }
  );

  // MARKETING TASKS API ROUTES - SECURED WITH AUTHENTICATION
  app.get(
    "/api/marketing-tasks",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        // Validate query parameters using Zod schema
        const filters = marketingTaskFilterSchema.parse(req.query);

        // Combined filtering support - apply multiple filters simultaneously
        let tasks;
        const hasFilters = Object.values(filters).some(
          (value) => value !== undefined
        );

        if (hasFilters) {
          // Use combined filtering when any filters are present
          tasks = await storage.getMarketingTasksWithFilters(filters);
        } else {
          tasks = await storage.getMarketingTasks();
        }

        res.json(tasks);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            error: "Invalid filter parameters",
            details: error.errors,
          });
        }
        res.status(500).json({ error: "Failed to fetch marketing tasks" });
      }
    }
  );

  app.get(
    "/api/marketing-tasks/:id",
    requireAuth,
    checkOwnership("marketing_task"),
    async (req: AuthenticatedRequest, res) => {
      try {
        // Validate UUID format
        if (
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            req.params.id
          )
        ) {
          return res
            .status(400)
            .json({ error: "Invalid marketing task ID format" });
        }

        const task = await storage.getMarketingTask(req.params.id);
        if (!task) {
          return res.status(404).json({ error: "Marketing task not found" });
        }
        res.json(task);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch marketing task" });
      }
    }
  );

  app.post(
    "/api/marketing-tasks",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const taskData = insertMarketingTaskSchema.parse(req.body);

        // SECURITY FIX: ALWAYS set assignedBy server-side, never trust client
        taskData.assignedBy = req.user!.id;
        taskData.createdBy = req.user!.id;

        // Validate related entities exist if provided
        if (taskData.leadId) {
          const lead = await storage.getLead(taskData.leadId);
          if (!lead) {
            return res.status(400).json({ error: "Associated lead not found" });
          }
        }

        if (taskData.fieldVisitId) {
          const visit = await storage.getFieldVisit(taskData.fieldVisitId);
          if (!visit) {
            return res
              .status(400)
              .json({ error: "Associated field visit not found" });
          }
        }

        const task = await storage.createMarketingTask(taskData);
        await storage.createActivity({
          userId: req.user!.id,
          action: "CREATE_MARKETING_TASK",
          entityType: "marketing_task",
          entityId: task.id,
          details: `Created marketing task: ${task.title}`,
        });
        res.status(201).json(task);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ error: "Invalid task data", details: error.errors });
        }
        res.status(500).json({ error: "Failed to create marketing task" });
      }
    }
  );

  app.put(
    "/api/marketing-tasks/:id",
    requireAuth,
    checkOwnership("marketing_task"),
    async (req: AuthenticatedRequest, res) => {
      try {
        // Validate UUID format
        if (
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            req.params.id
          )
        ) {
          return res
            .status(400)
            .json({ error: "Invalid marketing task ID format" });
        }

        // Check if marketing task exists first
        const existingTask = await storage.getMarketingTask(req.params.id);
        if (!existingTask) {
          return res.status(404).json({ error: "Marketing task not found" });
        }

        const taskData = insertMarketingTaskSchema.partial().parse(req.body);
        const task = await storage.updateMarketingTask(req.params.id, taskData);
        await storage.createActivity({
          userId: req.user!.id,
          action: "UPDATE_MARKETING_TASK",
          entityType: "marketing_task",
          entityId: task.id,
          details: `Updated marketing task: ${task.title}`,
        });
        res.json(task);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ error: "Invalid task data", details: error.errors });
        }
        res.status(500).json({ error: "Failed to update marketing task" });
      }
    }
  );

  app.delete(
    "/api/marketing-tasks/:id",
    requireAuth,
    checkOwnership("marketing_task"),
    async (req: AuthenticatedRequest, res) => {
      try {
        // Validate UUID format
        if (
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            req.params.id
          )
        ) {
          return res
            .status(400)
            .json({ error: "Invalid marketing task ID format" });
        }

        // Check if marketing task exists first
        const existingTask = await storage.getMarketingTask(req.params.id);
        if (!existingTask) {
          return res.status(404).json({ error: "Marketing task not found" });
        }

        await storage.deleteMarketingTask(req.params.id);
        await storage.createActivity({
          userId: req.user!.id,
          action: "DELETE_MARKETING_TASK",
          entityType: "marketing_task",
          entityId: req.params.id,
          details: `Deleted marketing task: ${existingTask.title}`,
        });
        res.status(204).send();
      } catch (error) {
        res.status(500).json({ error: "Failed to delete marketing task" });
      }
    }
  );

  app.put(
    "/api/marketing-tasks/:id/status",
    requireAuth,
    checkOwnership("marketing_task"),
    async (req: AuthenticatedRequest, res) => {
      try {
        // Validate UUID format
        if (
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            req.params.id
          )
        ) {
          return res
            .status(400)
            .json({ error: "Invalid marketing task ID format" });
        }

        // Check if marketing task exists first
        const existingTask = await storage.getMarketingTask(req.params.id);
        if (!existingTask) {
          return res.status(404).json({ error: "Marketing task not found" });
        }

        // Validate status update using Zod schema
        const { status, notes } = updateMarketingTaskStatusSchema.parse(
          req.body
        );

        const task = await storage.updateTaskStatus(req.params.id, status);
        await storage.createActivity({
          userId: req.user!.id,
          action: "UPDATE_MARKETING_TASK_STATUS",
          entityType: "marketing_task",
          entityId: task.id,
          details: `Updated marketing task status to '${status}': ${
            task.title
          }${notes ? ` - ${notes}` : ""}`,
        });
        res.json(task);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            error: "Invalid status update data",
            details: error.errors,
          });
        }
        res
          .status(500)
          .json({ error: "Failed to update marketing task status" });
      }
    }
  );

  app.post(
    "/api/marketing-tasks/:id/complete",
    requireAuth,
    checkOwnership("marketing_task"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { completionNotes, outcome, nextAction, actualHours } = req.body;
        const task = await storage.updateMarketingTask(req.params.id, {
          completionNotes,
          outcome,
          nextAction,
          actualHours,
          completedDate: new Date(),
          status: "completed",
        });

        await storage.createActivity({
          userId: task.assignedTo,
          action: "COMPLETE_MARKETING_TASK",
          entityType: "marketing_task",
          entityId: task.id,
          details: `Completed marketing task: ${task.title}`,
        });

        res.json({ task, message: "Task completed successfully" });
      } catch (error) {
        res.status(500).json({ error: "Failed to complete marketing task" });
      }
    }
  );

  app.get(
    "/api/marketing-tasks/today",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const tasks = await storage.getTodayMarketingTasks();
        res.json(tasks);
      } catch (error) {
        res
          .status(500)
          .json({ error: "Failed to fetch today's marketing tasks" });
      }
    }
  );

  app.get(
    "/api/marketing-tasks/metrics",
    requireAuth,
    requireMarketingAccess,
    async (req: AuthenticatedRequest, res) => {
      try {
        const metrics = await storage.getTaskCompletionMetrics();
        res.json(metrics);
      } catch (error) {
        res
          .status(500)
          .json({ error: "Failed to fetch marketing task metrics" });
      }
    }
  );

  // MARKETING ATTENDANCE API ROUTES
  app.get(
    "/api/marketing-attendance",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const attendance = await storage.getMarketingAttendances();
        res.json(attendance);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch marketing attendance" });
      }
    }
  );

  app.get(
    "/api/marketing-attendance/:id",
    requireAuth,
    checkOwnership("marketing_attendance"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const attendance = await storage.getMarketingAttendance(req.params.id);
        if (!attendance) {
          return res.status(404).json({ error: "Attendance record not found" });
        }
        res.json(attendance);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch attendance record" });
      }
    }
  );

  app.post(
    "/api/marketing-attendance",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        // SECURITY: Strip identity fields - NEVER trust from client
        const { userId, checkedInBy, checkedOutBy, ...clientData } = req.body;
        const attendanceData = insertMarketingAttendanceSchema.parse({
          ...clientData,
          userId: req.user!.id, // ALWAYS server-controlled
          checkedInBy: null, // Set when checking in
          checkedOutBy: null, // Set when checking out
        });
        const attendance = await storage.createMarketingAttendance(
          attendanceData
        );
        res.status(201).json(attendance);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ error: "Invalid attendance data", details: error.errors });
        }
        res.status(500).json({ error: "Failed to create attendance record" });
      }
    }
  );

  app.put(
    "/api/marketing-attendance/:id",
    requireAuth,
    checkOwnership("marketing_attendance"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const attendanceData = insertMarketingAttendanceSchema
          .partial()
          .parse(req.body);
        const attendance = await storage.updateMarketingAttendance(
          req.params.id,
          attendanceData
        );
        res.json(attendance);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ error: "Invalid attendance data", details: error.errors });
        }
        res.status(500).json({ error: "Failed to update attendance record" });
      }
    }
  );

  app.delete(
    "/api/marketing-attendance/:id",
    requireAuth,
    checkOwnership("marketing_attendance"),
    async (req: AuthenticatedRequest, res) => {
      try {
        await storage.deleteMarketingAttendance(req.params.id);
        res.status(204).send();
      } catch (error) {
        res.status(500).json({ error: "Failed to delete attendance record" });
      }
    }
  );

  app.post(
    "/api/marketing-attendance/check-in",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        // SECURITY CRITICAL FIX: NEVER trust userId from client - use authenticated user
        const { latitude, longitude, location, photoPath } = req.body;
        const userId = req.user!.id; // ALWAYS server-controlled

        // Validate required GPS coordinates
        if (!latitude || !longitude) {
          return res
            .status(400)
            .json({ error: "GPS coordinates are required for check-in" });
        }

        const attendance = await storage.checkInMarketingAttendance(userId, {
          checkInTime: new Date(),
          checkInLatitude: latitude,
          checkInLongitude: longitude,
          checkInLocation: location,
          checkInPhotoPath: photoPath,
          date: new Date(),
          attendanceStatus: "present",
        });

        res.json({ attendance, message: "Successfully checked in" });
      } catch (error) {
        res.status(500).json({ error: "Failed to check in" });
      }
    }
  );

  app.post(
    "/api/marketing-attendance/check-out",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        // SECURITY CRITICAL FIX: NEVER trust userId from client - use authenticated user
        const {
          latitude,
          longitude,
          location,
          photoPath,
          workDescription,
          visitCount,
          tasksCompleted,
        } = req.body;
        const userId = req.user!.id; // ALWAYS server-controlled

        // Validate required GPS coordinates
        if (!latitude || !longitude) {
          return res
            .status(400)
            .json({ error: "GPS coordinates are required for check-out" });
        }

        const attendance = await storage.checkOutMarketingAttendance(userId, {
          checkOutTime: new Date(),
          checkOutLatitude: latitude,
          checkOutLongitude: longitude,
          checkOutLocation: location,
          checkOutPhotoPath: photoPath,
          workDescription,
          visitCount,
          tasksCompleted,
        });

        res.json({ attendance, message: "Successfully checked out" });
      } catch (error) {
        res.status(500).json({ error: "Failed to check out" });
      }
    }
  );

  app.get(
    "/api/marketing-attendance/today",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const attendance = await storage.getTodayAttendance();
        res.json(attendance);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch today's attendance" });
      }
    }
  );

  app.get(
    "/api/marketing-attendance/metrics",
    requireAuth,
    requireMarketingAccess,
    async (req: AuthenticatedRequest, res) => {
      try {
        const metrics = await storage.getAttendanceMetrics();
        res.json(metrics);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch attendance metrics" });
      }
    }
  );

  // MARKETING ANALYTICS API ROUTES
  app.get(
    "/api/marketing/dashboard",
    requireAuth,
    requireMarketingAccess,
    async (req: AuthenticatedRequest, res) => {
      try {
        const dashboard = await storage.getMarketingDashboardMetrics();
        res.json(dashboard);
      } catch (error) {
        res
          .status(500)
          .json({ error: "Failed to fetch marketing dashboard metrics" });
      }
    }
  );

  app.get(
    "/api/marketing/conversion-rates",
    requireAuth,
    requireMarketingAccess,
    async (req: AuthenticatedRequest, res) => {
      try {
        const conversionRates = await storage.getLeadConversionRates();
        res.json(conversionRates);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch conversion rates" });
      }
    }
  );

  app.get(
    "/api/marketing/team-performance",
    requireAuth,
    requireMarketingAccess,
    async (req: AuthenticatedRequest, res) => {
      try {
        const teamPerformance = await storage.getMarketingTeamPerformance();
        res.json(teamPerformance);
      } catch (error) {
        res
          .status(500)
          .json({ error: "Failed to fetch team performance metrics" });
      }
    }
  );

  app.get(
    "/api/marketing/visit-success-rates",
    requireAuth,
    requireMarketingAccess,
    async (req: AuthenticatedRequest, res) => {
      try {
        const successRates = await storage.getVisitSuccessRates();
        res.json(successRates);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch visit success rates" });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
