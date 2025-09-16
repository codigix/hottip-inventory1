import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { storage } from "./storage";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { 
  insertUserSchema, insertProductSchema, insertCustomerSchema,
  insertOrderSchema, insertOrderItemSchema, insertSupplierSchema,
  insertShipmentSchema, insertTaskSchema, insertAttendanceSchema,
  insertOutboundQuotationSchema, insertQuotationItemSchema,
  insertInboundQuotationSchema, insertInboundQuotationItemSchema,
  insertInvoiceSchema, insertInvoiceItemSchema,
  insertStockTransactionSchema, insertSparePartSchema, insertBatchSchema,
  insertBarcodeSchema, insertFabricationOrderSchema, insertReorderPointSchema,
  insertVendorCommunicationSchema, insertInventoryTaskSchema,
  // Accounts schemas
  insertAccountsReceivableSchema, insertAccountsPayableSchema, insertPaymentSchema,
  insertBankAccountSchema, insertBankTransactionSchema, insertGstReturnSchema,
  insertAccountReminderSchema, insertAccountTaskSchema, insertAccountReportSchema
} from "@shared/schema";
import { z } from "zod";

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
const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // SECURITY FIX: Reject any client-supplied identity headers to prevent spoofing
    if (req.headers['x-user-id']) {
      res.status(401).json({ 
        error: "Security violation", 
        message: "Client identity headers are not allowed for security reasons" 
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
    
    // Try JWT verification first for both production and development
    if (authHeader.startsWith('Bearer ') && !authHeader.startsWith('Bearer dev-') && jwtSecret) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }) as any;
        req.user = { 
          id: decoded.sub, 
          role: decoded.role, 
          username: decoded.username 
        };
        next();
        return;
      } catch (jwtError) {
        // In production, JWT failure is final
        if (process.env.NODE_ENV === 'production') {
          res.status(401).json({ error: "Invalid JWT token" });
          return;
        }
        // In development, fall through to dev token handling
      }
    }

    // Production requires valid JWT
    if (process.env.NODE_ENV === 'production') {
      if (!jwtSecret) {
        throw new Error('JWT_SECRET required in production');
      }
      res.status(401).json({ error: "Valid JWT token required" });
      return;
    }
    
    // Development HMAC-signed tokens (dev mode fallback)
    if (process.env.NODE_ENV === 'development' && authHeader.startsWith('Bearer dev-')) {
      // SECURITY: Use HMAC-signed tokens instead of predictable userId tokens
      // Format: "Bearer dev-{userId}-{timestamp}-{hmacSignature}"
      const token = authHeader.replace('Bearer dev-', '');
      const parts = token.split('-');
      
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
          message: "DEV_TOKEN_SECRET environment variable is required for development authentication" 
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
        .createHmac('sha256', serverSecret)
        .update(`${userId}-${timestamp}`)
        .digest('hex'); // Use full HMAC signature for security
      
      if (signature !== expectedSignature) {
        res.status(401).json({ error: "Invalid token signature" });
        return;
      }
      
      // Check token age (expire after 24 hours)
      const tokenAge = Date.now() - timestampNum;
      if (tokenAge > 24 * 60 * 60 * 1000) { // 24 hours
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
        username: user.username
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
const requireAccountsAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const { role } = req.user;
  const allowedRoles = ['admin', 'manager']; // Only admin and manager can access financial reports
  
  if (!allowedRoles.includes(role)) {
    res.status(403).json({ 
      error: "Insufficient permissions", 
      message: "Access to financial reports requires admin or manager role" 
    });
    return;
  }

  next();
};

// Role-based authorization middleware for marketing metrics and admin operations
const requireMarketingAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const { role } = req.user;
  const allowedRoles = ['admin', 'manager']; // Only admin and manager can access marketing metrics
  
  if (!allowedRoles.includes(role)) {
    res.status(403).json({ 
      error: "Insufficient permissions", 
      message: "Access to marketing metrics requires admin or manager role" 
    });
    return;
  }

  next();
};

// Combined middleware for reports access
const requireReportsAccess = [requireAuth, requireAccountsAccess];

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication endpoints (public routes)
  app.post('/api/auth/login', async (req, res) => {
    try {
      console.log('🔐 Login attempt received:', { body: req.body });
      
      const { username, password } = loginSchema.parse(req.body);
      console.log('✅ Login data parsed successfully:', { username });
      
      const user = await storage.getUserByUsername(username);
      console.log('👤 User lookup result:', user ? `Found user: ${user.username} (${user.role})` : 'No user found');
      
      if (!user || !user.isActive) {
        console.log('❌ Login failed: Invalid user or inactive account');
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      console.log('🔑 Comparing passwords...');
      const validPassword = await bcrypt.compare(password, user.password);
      console.log('🔐 Password comparison result:', validPassword ? 'Valid' : 'Invalid');
      
      if (!validPassword) {
        console.log('❌ Login failed: Invalid password');
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const jwtSecret = process.env.JWT_SECRET;
      console.log('🔒 JWT_SECRET status:', jwtSecret ? 'Available' : 'Missing');
      
      if (!jwtSecret) {
        console.error('❌ CRITICAL: JWT_SECRET environment variable is missing');
        throw new Error('JWT_SECRET is required');
      }
      
      console.log('🎫 Generating JWT token...');
      const token = jwt.sign(
        { sub: user.id, role: user.role, username: user.username },
        jwtSecret,
        { expiresIn: '15m', algorithm: 'HS256' }
      );
      
      console.log('✅ Login successful for user:', user.username);
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role 
        } 
      });
    } catch (error) {
      console.error('💥 Login error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : typeof error
      });
      
      if (error instanceof z.ZodError) {
        console.log('📝 Validation error:', error.errors);
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      
      console.error('❌ Unexpected login error:', error);
      res.status(500).json({ error: "Login failed", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // SECURITY: Role-based authorization middleware for admin-only operations
  const requireAdminAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { role } = req.user;
    const allowedRoles = ['admin']; // Only admin can access user management
    
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ 
        error: "Insufficient permissions", 
        message: "Access to user management requires admin role" 
      });
    }

    next();
  };

  // SECURITY: Per-resource ownership authorization middleware
  const checkOwnership = (entityType: string) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          res.status(401).json({ error: "Authentication required" });
          return;
        }

        const { role } = req.user;
        
        // Admin and manager roles have full access
        if (role === 'admin' || role === 'manager') {
          next();
          return;
        }

        // For regular users, check ownership
        let entity;
        try {
          switch (entityType) {
            case 'lead':
              entity = await storage.getLead(req.params.id);
              break;
            case 'field_visit':
              entity = await storage.getFieldVisit(req.params.id);
              break;
            case 'marketing_task':
              entity = await storage.getMarketingTask(req.params.id);
              break;
            case 'marketing_attendance':
              entity = await storage.getMarketingAttendance(req.params.id);
              break;
            default:
              res.status(500).json({ error: "Unknown entity type" });
              return;
          }
        } catch (error) {
          res.status(404).json({ error: `${entityType.replace('_', ' ')} not found` });
          return;
        }

        if (!entity) {
          res.status(404).json({ error: `${entityType.replace('_', ' ')} not found` });
          return;
        }

        // Check if user owns the resource (assigned to them or created by them)
        const userId = req.user.id;
        const hasAccess = entity.assignedTo === userId || 
                         entity.createdBy === userId ||
                         entity.userId === userId;

        if (!hasAccess) {
          res.status(403).json({ 
            error: "Access denied", 
            message: "You can only access your own records" 
          });
          return;
        }

        next();
      } catch (error) {
        res.status(500).json({ error: "Failed to verify ownership" });
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

  app.get("/api/users/:id", requireAuth, requireAdminAccess, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

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
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", requireAuth, requireAdminAccess, async (req, res) => {
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
  });

  app.delete("/api/users/:id", requireAuth, requireAdminAccess, async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Products Routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Basic health check route
  app.get("/api/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });

  // Import and register marketing routes safely
  try {
    const { registerMarketingRoutes } = await import("./marketing-routes-registry");
    registerMarketingRoutes(app, { requireAuth, requireMarketingAccess, checkOwnership });
    console.log("✅ Marketing routes registered successfully");
  } catch (error) {
    console.warn("⚠️ Marketing routes registry not available:", error);
  }

  const httpServer = createServer(app);
  return httpServer;
}