import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { storage } from "./storage";
import {
  insertLogisticsShipmentSchema, insertLogisticsStatusUpdateSchema, insertLogisticsCheckpointSchema,
  updateLogisticsShipmentSchema, logisticsShipmentFilterSchema, updateLogisticsShipmentStatusSchema,
  closePodUploadSchema
} from "@shared/schema";

// Authentication and Authorization types
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    username: string;
  };
}

// Logistics Route Handlers

// ==========================================
// LOGISTICS SHIPMENTS HANDLERS
// ==========================================

export const getLogisticsShipments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = logisticsShipmentFilterSchema.parse(req.query);
    let shipments;
    const hasFilters = Object.values(filters).some(value => value !== undefined);
    
    if (filters.status) {
      shipments = await storage.getLogisticsShipmentsByStatus(filters.status);
    } else if (filters.employeeId) {
      shipments = await storage.getLogisticsShipmentsByEmployee(filters.employeeId);
    } else if (filters.clientId) {
      shipments = await storage.getLogisticsShipmentsByClient(filters.clientId);
    } else if (filters.vendorId) {
      shipments = await storage.getLogisticsShipmentsByVendor(filters.vendorId);
    } else if (filters.startDate && filters.endDate) {
      shipments = await storage.getLogisticsShipmentsByDateRange(new Date(filters.startDate), new Date(filters.endDate));
    } else {
      shipments = await storage.getLogisticsShipments();
    }
    
    res.json(shipments);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid filter parameters", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Failed to fetch logistics shipments" });
  }
};

export const getLogisticsShipment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      res.status(400).json({ error: "Invalid shipment ID format" });
      return;
    }
    
    const shipment = await storage.getLogisticsShipment(req.params.id);
    if (!shipment) {
      res.status(404).json({ error: "Shipment not found" });
      return;
    }
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch shipment" });
  }
};

export const createLogisticsShipment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const shipmentData = insertLogisticsShipmentSchema.parse(req.body);
    
    // Set current user as the creator and assignee if not specified
    if (!shipmentData.assignedTo) {
      shipmentData.assignedTo = req.user!.id;
    }
    
    const shipment = await storage.createLogisticsShipment(shipmentData);
    await storage.createActivity({
      userId: req.user!.id,
      action: "CREATE_SHIPMENT",
      entityType: "logistics_shipment",
      entityId: shipment.id,
      details: `Created shipment ${shipment.consignmentNumber}`
    });
    
    res.status(201).json(shipment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid shipment data", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Failed to create shipment" });
  }
};

export const updateLogisticsShipment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      res.status(400).json({ error: "Invalid shipment ID format" });
      return;
    }
    
    const shipmentData = updateLogisticsShipmentSchema.parse(req.body);
    const shipment = await storage.updateLogisticsShipment(req.params.id, shipmentData);
    
    await storage.createActivity({
      userId: req.user!.id,
      action: "UPDATE_SHIPMENT",
      entityType: "logistics_shipment",
      entityId: req.params.id,
      details: `Updated shipment ${shipment.consignmentNumber}`
    });
    
    res.json(shipment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid shipment data", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Failed to update shipment" });
  }
};

export const deleteLogisticsShipment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      res.status(400).json({ error: "Invalid shipment ID format" });
      return;
    }
    
    await storage.deleteLogisticsShipment(req.params.id);
    
    await storage.createActivity({
      userId: req.user!.id,
      action: "DELETE_SHIPMENT",
      entityType: "logistics_shipment",
      entityId: req.params.id,
      details: "Deleted shipment"
    });
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete shipment" });
  }
};

// Status workflow operations
export const updateShipmentStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      res.status(400).json({ error: "Invalid shipment ID format" });
      return;
    }
    
    const validatedData = updateLogisticsShipmentStatusSchema.parse(req.body);
    const statusData = {
      ...validatedData,
      updatedBy: req.user!.id
    };
    
    const shipment = await storage.updateShipmentStatus(req.params.id, statusData);
    
    await storage.createActivity({
      userId: req.user!.id,
      action: "UPDATE_SHIPMENT_STATUS",
      entityType: "logistics_shipment",
      entityId: req.params.id,
      details: `Updated shipment status to ${statusData.status}`
    });
    
    res.json(shipment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid status update data", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Failed to update shipment status" });
  }
};

export const getShipmentTimeline = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      res.status(400).json({ error: "Invalid shipment ID format" });
      return;
    }
    
    const timeline = await storage.getShipmentTimeline(req.params.id);
    res.json(timeline);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch shipment timeline" });
  }
};

export const closeShipment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      res.status(400).json({ error: "Invalid shipment ID format" });
      return;
    }
    
    const validatedData = closePodUploadSchema.parse(req.body);
    const podData = {
      ...validatedData,
      uploadedBy: req.user!.id
    };
    
    const shipment = await storage.closeShipment(req.params.id, podData);
    
    await storage.createActivity({
      userId: req.user!.id,
      action: "CLOSE_SHIPMENT",
      entityType: "logistics_shipment",
      entityId: req.params.id,
      details: "Closed shipment with POD"
    });
    
    res.json(shipment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid POD close data", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Failed to close shipment" });
  }
};

export const getActiveShipments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const shipments = await storage.getActiveShipments();
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch active shipments" });
  }
};

export const getOverdueShipments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const shipments = await storage.getOverdueShipments();
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch overdue shipments" });
  }
};

export const searchShipments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;
    if (!query) {
      res.status(400).json({ error: "Search query is required" });
      return;
    }
    
    const shipments = await storage.searchShipments(query);
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ error: "Failed to search shipments" });
  }
};

// ==========================================
// LOGISTICS STATUS UPDATES HANDLERS
// ==========================================

export const getLogisticsStatusUpdates = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const updates = await storage.getLogisticsStatusUpdates();
    res.json(updates);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch status updates" });
  }
};

export const createLogisticsStatusUpdate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const updateData = insertLogisticsStatusUpdateSchema.parse(req.body);
    updateData.updatedBy = req.user!.id;
    
    const statusUpdate = await storage.createLogisticsStatusUpdate(updateData);
    res.status(201).json(statusUpdate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid status update data", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Failed to create status update" });
  }
};

export const getStatusUpdatesByShipment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.shipmentId)) {
      res.status(400).json({ error: "Invalid shipment ID format" });
      return;
    }
    
    const updates = await storage.getStatusUpdatesByShipment(req.params.shipmentId);
    res.json(updates);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch status updates for shipment" });
  }
};

// ==========================================
// LOGISTICS CHECKPOINTS HANDLERS
// ==========================================

export const getLogisticsCheckpoints = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const checkpoints = await storage.getLogisticsCheckpoints();
    res.json(checkpoints);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch checkpoints" });
  }
};

export const createLogisticsCheckpoint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const checkpointData = insertLogisticsCheckpointSchema.parse(req.body);
    checkpointData.addedBy = req.user!.id;
    
    const checkpoint = await storage.createLogisticsCheckpoint(checkpointData);
    res.status(201).json(checkpoint);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid checkpoint data", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Failed to create checkpoint" });
  }
};

export const getCheckpointsByShipment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.shipmentId)) {
      res.status(400).json({ error: "Invalid shipment ID format" });
      return;
    }
    
    const checkpoints = await storage.getCheckpointsByShipment(req.params.shipmentId);
    res.json(checkpoints);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch checkpoints for shipment" });
  }
};

// ==========================================
// LOGISTICS HEALTH ENDPOINT
// ==========================================

export const getLogisticsHealth = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      services: {
        database: "connected",
        storage: "available"
      }
    };
    res.json(health);
  } catch (error) {
    res.status(500).json({ 
      status: "unhealthy", 
      error: "Health check failed",
      timestamp: new Date().toISOString()
    });
  }
};

// ==========================================
// LOGISTICS TASKS HANDLERS
// ==========================================

export const getLogisticsTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tasks = await storage.getTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch logistics tasks" });
  }
};

export const getLogisticsTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      res.status(400).json({ error: "Invalid task ID format" });
      return;
    }
    
    const task = await storage.getTask(req.params.id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch task" });
  }
};

export const createLogisticsTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const taskData = {
      ...req.body,
      assignedBy: req.user!.id,
      assignedTo: req.body.assignedTo || req.user!.id
    };
    
    const task = await storage.createTask(taskData);
    
    await storage.createActivity({
      userId: req.user!.id,
      action: "CREATE_LOGISTICS_TASK",
      entityType: "logistics_task",
      entityId: task.id,
      details: `Created logistics task: ${task.title}`
    });
    
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: "Failed to create logistics task" });
  }
};

export const updateLogisticsTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      res.status(400).json({ error: "Invalid task ID format" });
      return;
    }
    
    const task = await storage.updateTask(req.params.id, req.body);
    
    await storage.createActivity({
      userId: req.user!.id,
      action: "UPDATE_LOGISTICS_TASK",
      entityType: "logistics_task",
      entityId: req.params.id,
      details: `Updated logistics task: ${task.title}`
    });
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: "Failed to update logistics task" });
  }
};

export const deleteLogisticsTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      res.status(400).json({ error: "Invalid task ID format" });
      return;
    }
    
    await storage.deleteTask(req.params.id);
    
    await storage.createActivity({
      userId: req.user!.id,
      action: "DELETE_LOGISTICS_TASK",
      entityType: "logistics_task",
      entityId: req.params.id,
      details: "Deleted logistics task"
    });
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete logistics task" });
  }
};

// ==========================================
// LOGISTICS ATTENDANCE HANDLERS
// ==========================================

export const getLogisticsAttendance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { employeeId, date } = req.query;
    let attendance;
    
    if (employeeId && date) {
      attendance = await storage.getAttendance(employeeId as string, new Date(date as string));
    } else if (employeeId) {
      attendance = await storage.getAttendanceByUser(employeeId as string);
    } else {
      attendance = await storage.getAccountsAttendance({});
    }
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch logistics attendance" });
  }
};

export const checkInLogistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const checkInData = {
      userId: req.user!.id,
      checkInTime: new Date(),
      location: req.body.location,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      notes: req.body.notes
    };
    
    const attendance = await storage.createAttendance(checkInData);
    
    await storage.createActivity({
      userId: req.user!.id,
      action: "LOGISTICS_CHECK_IN",
      entityType: "logistics_attendance",
      entityId: attendance.id,
      details: `Checked in for logistics at ${checkInData.location || 'location'}`
    });
    
    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ error: "Failed to check in" });
  }
};

export const checkOutLogistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      res.status(400).json({ error: "Invalid attendance ID format" });
      return;
    }
    
    const checkOutData = {
      checkOutTime: new Date(),
      location: req.body.location,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      notes: req.body.notes
    };
    
    const attendance = await storage.updateAttendance(req.params.id, checkOutData);
    
    await storage.createActivity({
      userId: req.user!.id,
      action: "LOGISTICS_CHECK_OUT",
      entityType: "logistics_attendance",
      entityId: req.params.id,
      details: `Checked out from logistics at ${checkOutData.location || 'location'}`
    });
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: "Failed to check out" });
  }
};

// ==========================================
// LOGISTICS REPORTS & ANALYTICS HANDLERS
// ==========================================

export const getLogisticsDashboardMetrics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const metrics = await storage.getLogisticsDashboardMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch logistics dashboard metrics" });
  }
};

export const getDailyShipmentsReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const date = req.query.date as string;
    if (!date) {
      res.status(400).json({ error: "Date parameter is required" });
      return;
    }
    
    const report = await storage.getDailyShipmentsReport(new Date(date));
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch daily shipments report" });
  }
};

export const getAverageDeliveryTime = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    
    let dateRange;
    if (startDate && endDate) {
      dateRange = { start: new Date(startDate), end: new Date(endDate) };
    }
    
    const metrics = await storage.getAverageDeliveryTime(dateRange);
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch average delivery time" });
  }
};

export const getVendorPerformanceReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const vendorId = req.query.vendorId as string;
    const report = await storage.getVendorPerformanceReport(vendorId);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch vendor performance report" });
  }
};

export const getShipmentVolumeMetrics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const metrics = await storage.getShipmentVolumeMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch shipment volume metrics" });
  }
};

export const getDeliveryPerformanceMetrics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const metrics = await storage.getDeliveryPerformanceMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch delivery performance metrics" });
  }
};

// ==========================================
// LOGISTICS ROUTE REGISTRATION
// ==========================================

interface LogisticsRouteOptions {
  requireAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
  requireLogisticsAccess?: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
  checkOwnership?: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
}

export const registerLogisticsRoutes = (app: Express, options: LogisticsRouteOptions): void => {
  const { requireAuth, requireLogisticsAccess, checkOwnership } = options;
  
  // Default logistics access middleware (use generic auth for now)
  const logisticsAuth = requireLogisticsAccess || requireAuth;
  const ownershipCheck = checkOwnership || ((req, res, next) => next());

  console.log("📋 Registering logistics routes...");

  // Logistics Shipments routes
  app.get("/api/logistics/shipments", requireAuth, getLogisticsShipments);
  app.get("/api/logistics/shipments/active", requireAuth, getActiveShipments);
  app.get("/api/logistics/shipments/overdue", requireAuth, getOverdueShipments);
  app.get("/api/logistics/shipments/search", requireAuth, searchShipments);
  app.get("/api/logistics/shipments/:id", requireAuth, ownershipCheck, getLogisticsShipment);
  app.post("/api/logistics/shipments", requireAuth, createLogisticsShipment);
  app.put("/api/logistics/shipments/:id", requireAuth, ownershipCheck, updateLogisticsShipment);
  app.delete("/api/logistics/shipments/:id", requireAuth, ownershipCheck, deleteLogisticsShipment);
  
  // Shipment workflow operations
  app.put("/api/logistics/shipments/:id/status", requireAuth, ownershipCheck, updateShipmentStatus);
  app.get("/api/logistics/shipments/:id/timeline", requireAuth, getShipmentTimeline);
  app.post("/api/logistics/shipments/:id/close", requireAuth, ownershipCheck, closeShipment);

  // Status Updates routes
  app.get("/api/logistics/status-updates", requireAuth, getLogisticsStatusUpdates);
  app.post("/api/logistics/status-updates", requireAuth, createLogisticsStatusUpdate);
  app.get("/api/logistics/status-updates/shipment/:shipmentId", requireAuth, getStatusUpdatesByShipment);

  // Checkpoints routes
  app.get("/api/logistics/checkpoints", requireAuth, getLogisticsCheckpoints);
  app.post("/api/logistics/checkpoints", requireAuth, createLogisticsCheckpoint);
  app.get("/api/logistics/checkpoints/shipment/:shipmentId", requireAuth, getCheckpointsByShipment);

  // Health endpoint
  app.get("/api/logistics/health", getLogisticsHealth);
  
  // Logistics Tasks routes
  app.get("/api/logistics/tasks", requireAuth, getLogisticsTasks);
  app.get("/api/logistics/tasks/:id", requireAuth, getLogisticsTask);
  app.post("/api/logistics/tasks", requireAuth, createLogisticsTask);
  app.put("/api/logistics/tasks/:id", requireAuth, updateLogisticsTask);
  app.delete("/api/logistics/tasks/:id", requireAuth, deleteLogisticsTask);
  
  // Logistics Attendance routes
  app.get("/api/logistics/attendance", requireAuth, getLogisticsAttendance);
  app.post("/api/logistics/attendance/check-in", requireAuth, checkInLogistics);
  app.put("/api/logistics/attendance/:id/check-out", requireAuth, checkOutLogistics);
  
  // Reports & Analytics routes
  app.get("/api/logistics/dashboard", requireAuth, getLogisticsDashboardMetrics);
  app.get("/api/logistics/reports/daily", requireAuth, getDailyShipmentsReport);
  app.get("/api/logistics/reports/delivery-time", requireAuth, getAverageDeliveryTime);
  app.get("/api/logistics/reports/vendor-performance", requireAuth, getVendorPerformanceReport);
  app.get("/api/logistics/reports/volume", requireAuth, getShipmentVolumeMetrics);
  app.get("/api/logistics/reports/performance", requireAuth, getDeliveryPerformanceMetrics);

  console.log("✅ Logistics routes registered successfully");
};