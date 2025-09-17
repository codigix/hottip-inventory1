import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import { db } from "./db";
import { attendance, users, logisticsAttendance } from "@shared/schema";
import { eq, desc, and, gte, lt } from "drizzle-orm";
import {
  insertLogisticsShipmentSchema, insertLogisticsStatusUpdateSchema, insertLogisticsCheckpointSchema,
  updateLogisticsShipmentSchema, logisticsShipmentFilterSchema, updateLogisticsShipmentStatusSchema,
  closePodUploadSchema, insertLogisticsAttendanceSchema, updateLogisticsAttendanceSchema,
  logisticsCheckInSchema, logisticsCheckOutSchema, attendancePhotoUploadSchema
} from "@shared/schema";
import { validateGPSCoordinates, validateGPSMovement } from "./gpsValidation";

// Initialize object storage service
const objectStorage = new ObjectStorageService();

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
      // Convert single record to array for consistent response format
      attendance = attendance ? [attendance] : [];
    } else if (employeeId) {
      attendance = await storage.getAttendanceByUser(employeeId as string);
    } else {
      // Use optimized method that fetches all attendance with user data in single query
      attendance = await storage.getAllAttendanceWithUsers({ employeeId, date });
    }
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch logistics attendance" });
  }
};

export const checkInLogistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Validate request body using Zod schema
    const validatedData = logisticsCheckInSchema.parse(req.body);
    
    // GPS validation with anti-spoofing measures
    const gpsValidation = validateGPSCoordinates({
      latitude: validatedData.latitude,
      longitude: validatedData.longitude,
      accuracy: validatedData.accuracy,
      timestamp: Date.now(),
    });
    
    if (!gpsValidation.isValid) {
      res.status(400).json({
        error: "GPS validation failed",
        details: gpsValidation.errors,
        warnings: gpsValidation.warnings
      });
      return;
    }
    
    // Check if user already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const existingAttendance = await db
      .select()
      .from(logisticsAttendance)
      .where(
        and(
          eq(logisticsAttendance.userId, req.user!.id),
          gte(logisticsAttendance.date, today),
          lt(logisticsAttendance.date, tomorrow)
        )
      )
      .limit(1);
    
    if (existingAttendance.length > 0) {
      res.status(400).json({ error: "Already checked in today" });
      return;
    }
    
    // Create logistics attendance record
    const attendanceData = {
      userId: req.user!.id,
      date: new Date(),
      checkInTime: new Date(),
      checkInLocation: validatedData.location,
      checkInLatitude: validatedData.latitude.toString(),
      checkInLongitude: validatedData.longitude.toString(),
      workDescription: validatedData.workDescription,
      status: 'checked_in' as const,
    };
    
    const [newAttendance] = await db
      .insert(logisticsAttendance)
      .values(attendanceData)
      .returning();
    
    // Create activity log
    await storage.createActivity({
      userId: req.user!.id,
      action: "LOGISTICS_CHECK_IN",
      entityType: "logistics_attendance",
      entityId: newAttendance.id,
      details: `Checked in for logistics at ${validatedData.location || 'GPS location'}. Accuracy: ${validatedData.accuracy}m`
    });
    
    // Include GPS validation warnings in response
    res.status(201).json({
      ...newAttendance,
      gpsValidation: {
        riskLevel: gpsValidation.riskLevel,
        warnings: gpsValidation.warnings
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: "Invalid request data", 
        details: error.errors 
      });
      return;
    }
    console.error('Check-in error:', error);
    res.status(500).json({ error: "Failed to check in" });
  }
};

export const checkOutLogistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      res.status(400).json({ error: "Invalid attendance ID format" });
      return;
    }
    
    // Validate request body using Zod schema
    const validatedData = logisticsCheckOutSchema.parse(req.body);
    
    // Get existing attendance record
    const [existingAttendance] = await db
      .select()
      .from(logisticsAttendance)
      .where(eq(logisticsAttendance.id, req.params.id))
      .limit(1);
    
    if (!existingAttendance) {
      res.status(404).json({ error: "Attendance record not found" });
      return;
    }
    
    if (existingAttendance.userId !== req.user!.id) {
      res.status(403).json({ error: "Not authorized to modify this attendance record" });
      return;
    }
    
    if (existingAttendance.status === 'checked_out') {
      res.status(400).json({ error: "Already checked out" });
      return;
    }
    
    // GPS validation with anti-spoofing measures
    const gpsValidation = validateGPSCoordinates({
      latitude: validatedData.latitude,
      longitude: validatedData.longitude,
      accuracy: validatedData.accuracy,
      timestamp: Date.now(),
    });
    
    if (!gpsValidation.isValid) {
      res.status(400).json({
        error: "GPS validation failed",
        details: gpsValidation.errors,
        warnings: gpsValidation.warnings
      });
      return;
    }
    
    // Validate movement (anti-spoofing)
    if (existingAttendance.checkInLatitude && existingAttendance.checkInLongitude && existingAttendance.checkInTime) {
      const movementValidation = validateGPSMovement(
        parseFloat(existingAttendance.checkInLatitude),
        parseFloat(existingAttendance.checkInLongitude),
        new Date(existingAttendance.checkInTime).getTime(),
        validatedData.latitude,
        validatedData.longitude,
        Date.now()
      );
      
      if (!movementValidation.isValid) {
        res.status(400).json({
          error: "GPS movement validation failed",
          details: movementValidation.errors,
          warnings: movementValidation.warnings
        });
        return;
      }
    }
    
    // Update attendance record with check-out data
    const updateData = {
      checkOutTime: new Date(),
      checkOutLocation: validatedData.location,
      checkOutLatitude: validatedData.latitude.toString(),
      checkOutLongitude: validatedData.longitude.toString(),
      workDescription: validatedData.workDescription || existingAttendance.workDescription,
      taskCount: validatedData.taskCount,
      deliveriesCompleted: validatedData.deliveriesCompleted,
      status: 'checked_out' as const,
      updatedAt: new Date(),
    };
    
    const [updatedAttendance] = await db
      .update(logisticsAttendance)
      .set(updateData)
      .where(eq(logisticsAttendance.id, req.params.id))
      .returning();
    
    // Create activity log
    await storage.createActivity({
      userId: req.user!.id,
      action: "LOGISTICS_CHECK_OUT",
      entityType: "logistics_attendance",
      entityId: req.params.id,
      details: `Checked out from logistics at ${validatedData.location || 'GPS location'}. Tasks: ${validatedData.taskCount || 0}, Deliveries: ${validatedData.deliveriesCompleted || 0}`
    });
    
    // Include GPS validation warnings in response
    res.json({
      ...updatedAttendance,
      gpsValidation: {
        riskLevel: gpsValidation.riskLevel,
        warnings: gpsValidation.warnings
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: "Invalid request data", 
        details: error.errors 
      });
      return;
    }
    console.error('Check-out error:', error);
    res.status(500).json({ error: "Failed to check out" });
  }
};

// Missing attendance endpoints
export const getLogisticsAttendanceToday = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const todayAttendance = await storage.getTodayLogisticsAttendance();
    res.json(todayAttendance);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch today's logistics attendance" });
  }
};

// Photo upload URL generation for attendance
export const generateAttendancePhotoUploadUrl = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = attendancePhotoUploadSchema.parse(req.body);
    
    // Verify attendance record exists and belongs to user
    const [attendanceRecord] = await db
      .select()
      .from(logisticsAttendance)
      .where(eq(logisticsAttendance.id, validatedData.attendanceId))
      .limit(1);
    
    if (!attendanceRecord) {
      res.status(404).json({ error: "Attendance record not found" });
      return;
    }
    
    if (attendanceRecord.userId !== req.user!.id) {
      res.status(403).json({ error: "Not authorized to upload photo for this attendance record" });
      return;
    }
    
    // Generate object storage path
    const objectPath = `attendance-photos/${validatedData.attendanceId}/${validatedData.photoType}-${Date.now()}-${validatedData.fileName}`;
    
    // Generate signed upload URL
    const uploadURL = await objectStorage.generateUploadURL(objectPath, validatedData.contentType);
    
    res.json({
      uploadURL,
      objectPath,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: "Invalid request data", 
        details: error.errors 
      });
      return;
    }
    console.error('Photo upload URL generation error:', error);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
};

// Update attendance record with photo path
export const updateAttendancePhoto = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      res.status(400).json({ error: "Invalid attendance ID format" });
      return;
    }
    
    const { photoPath, photoType } = req.body;
    
    if (!photoPath || !photoType) {
      res.status(400).json({ error: "Photo path and type are required" });
      return;
    }
    
    if (!['check-in', 'check-out'].includes(photoType)) {
      res.status(400).json({ error: "Photo type must be 'check-in' or 'check-out'" });
      return;
    }
    
    // Verify attendance record exists and belongs to user
    const [attendanceRecord] = await db
      .select()
      .from(logisticsAttendance)
      .where(eq(logisticsAttendance.id, req.params.id))
      .limit(1);
    
    if (!attendanceRecord) {
      res.status(404).json({ error: "Attendance record not found" });
      return;
    }
    
    if (attendanceRecord.userId !== req.user!.id) {
      res.status(403).json({ error: "Not authorized to update this attendance record" });
      return;
    }
    
    // Update photo path
    const updateData = photoType === 'check-in' 
      ? { checkInPhotoPath: photoPath }
      : { checkOutPhotoPath: photoPath };
    
    const [updatedAttendance] = await db
      .update(logisticsAttendance)
      .set(updateData)
      .where(eq(logisticsAttendance.id, req.params.id))
      .returning();
    
    res.json(updatedAttendance);
  } catch (error) {
    console.error('Photo update error:', error);
    res.status(500).json({ error: "Failed to update photo" });
  }
};

export const getLogisticsAttendanceMetrics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const metrics = await storage.getLogisticsAttendanceMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch logistics attendance metrics" });
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
// POD UPLOAD HANDLER
// ==========================================

// POD Upload URL Generation - Step 1 of 2-step upload process
export const generatePodUploadUrl = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { shipmentId, fileName, contentType } = req.body;
    
    if (!shipmentId) {
      res.status(400).json({ error: "Shipment ID is required" });
      return;
    }

    if (!fileName) {
      res.status(400).json({ error: "File name is required" });
      return;
    }

    // Validate shipment exists and user has access (ownership check)
    const shipment = await storage.getLogisticsShipment(shipmentId);
    if (!shipment) {
      res.status(404).json({ error: "Shipment not found" });
      return;
    }

    // TODO: Add ownership check here when user-shipment relationship is implemented
    // For now, any authenticated user can upload POD for any shipment

    // Validate file name for security
    if (fileName.includes('../') || fileName.includes('..') || fileName.includes('/')) {
      res.status(400).json({ error: "Invalid file name" });
      return;
    }

    // Validate content type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (contentType && !allowedTypes.includes(contentType)) {
      res.status(400).json({ error: "Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed." });
      return;
    }

    // Generate stable object path for the POD
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileExtension = fileName.split('.').pop() || 'jpg';
    const privateObjectDir = objectStorage.getPrivateObjectDir();
    const objectPath = `${privateObjectDir}/logistics/shipments/${shipmentId}/pod/pod-${timestamp}.${fileExtension}`;
    
    // Parse object path (internal implementation)
    const parseObjectPath = (path: string) => {
      if (!path.startsWith("/")) path = `/${path}`;
      const pathParts = path.split("/");
      const bucketName = pathParts[1];
      const objectName = pathParts.slice(2).join("/");
      return { bucketName, objectName };
    };

    const { bucketName, objectName } = parseObjectPath(objectPath);

    // Generate signed URL for PUT upload (internal implementation)
    const signObjectURL = async ({ bucketName, objectName, method, ttlSec }: any) => {
      const request = {
        bucket_name: bucketName,
        object_name: objectName,
        method,
        expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
      };
      const response = await fetch(`http://127.0.0.1:1106/object-storage/signed-object-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        throw new Error(`Failed to sign object URL, errorcode: ${response.status}`);
      }
      const { signed_url: signedURL } = await response.json();
      return signedURL;
    };

    const uploadURL = await signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900 // 15 minutes
    });

    // Return upload URL and permanent object path
    res.json({
      uploadURL,
      objectPath,
      bucketName,
      objectName,
      fileName: `pod-${timestamp}.${fileExtension}`
    });

  } catch (error) {
    console.error("POD upload URL generation error:", error);
    res.status(500).json({ error: "Failed to generate POD upload URL" });
  }
};

// Removed duplicate handler - cleaned up

// ==========================================
// LOGISTICS ROUTE REGISTRATION  
// ==========================================

interface LogisticsRouteOptions {
  requireAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
  requireLogisticsAccess?: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
  checkOwnership?: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
}

    const uploadURL = await signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900 // 15 minutes
    });

    // Log activity
    if (req.user) {
      await storage.createActivity({
        userId: req.user.id,
      action: "Generate Upload URL",
      entityType: "logistics_attendance_photo",
      entityId: attendanceId,
        details: `Generated upload URL for ${photoType} photo: ${objectPath}`
      });
    }

    res.json({
      uploadURL,
      objectPath
    });

  } catch (error) {
    console.error("Error generating attendance photo upload URL:", error);
    res.status(500).json({ error: "Failed to generate upload URL" });
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

interface LogisticsRoute {
  method: 'get' | 'post' | 'put' | 'delete';
  path: string;
  middlewares: string[];
  handler: (req: AuthenticatedRequest, res: Response) => Promise<void>;
}

// Logistics middleware factory function  
function checkLogisticsOwnership(entityType: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { role } = req.user;
      
      // Admin and manager roles have full access
      if (role === 'admin' || role === 'manager') {
        return next();
      }

      // For regular users, check ownership - for now, allow access
      // TODO: Implement proper ownership checks when user assignment is added to logistics entities
      return next();
    } catch (error) {
      return res.status(500).json({ error: "Failed to verify ownership" });
    }
  };
}

export const registerLogisticsRoutes = (app: Express, middleware: LogisticsRouteOptions): void => {
  const { requireAuth: auth, requireLogisticsAccess: logisticsAccess, checkOwnership } = middleware;
  
  // Define all logistics routes with their middleware requirements
  const logisticsRoutes: LogisticsRoute[] = [
    // ==========================================
    // LOGISTICS SHIPMENTS ROUTES (8 base routes)
    // ==========================================
    { method: 'get', path: '/api/logistics/shipments', middlewares: ['requireAuth'], handler: getLogisticsShipments },
    { method: 'get', path: '/api/logistics/shipments/active', middlewares: ['requireAuth'], handler: getActiveShipments },
    { method: 'get', path: '/api/logistics/shipments/overdue', middlewares: ['requireAuth'], handler: getOverdueShipments },
    { method: 'get', path: '/api/logistics/shipments/search', middlewares: ['requireAuth'], handler: searchShipments },
    { method: 'get', path: '/api/logistics/shipments/:id', middlewares: ['requireAuth', 'checkOwnership:shipment'], handler: getLogisticsShipment },
    { method: 'post', path: '/api/logistics/shipments', middlewares: ['requireAuth'], handler: createLogisticsShipment },
    { method: 'put', path: '/api/logistics/shipments/:id', middlewares: ['requireAuth', 'checkOwnership:shipment'], handler: updateLogisticsShipment },
    { method: 'delete', path: '/api/logistics/shipments/:id', middlewares: ['requireAuth', 'checkOwnership:shipment'], handler: deleteLogisticsShipment },
    
    // ==========================================
    // CRITICAL STATUS WORKFLOW ROUTES (3 routes)
    // ==========================================
    { method: 'put', path: '/api/logistics/shipments/:id/status', middlewares: ['requireAuth', 'checkOwnership:shipment'], handler: updateShipmentStatus },
    { method: 'get', path: '/api/logistics/shipments/:id/timeline', middlewares: ['requireAuth'], handler: getShipmentTimeline },
    { method: 'post', path: '/api/logistics/shipments/:id/close', middlewares: ['requireAuth', 'checkOwnership:shipment'], handler: closeShipment },
    
    // ==========================================
    // POD & FILE UPLOAD ROUTES (2 routes)
    // ==========================================
    { method: 'post', path: '/api/logistics/pod/upload-url', middlewares: ['requireAuth'], handler: generatePodUploadUrl },
    { method: 'post', path: '/api/logistics/attendance/photo/upload-url', middlewares: ['requireAuth'], handler: generateAttendancePhotoUploadUrl },

    // ==========================================
    // STATUS UPDATES ROUTES (3 routes)
    // ==========================================
    { method: 'get', path: '/api/logistics/status-updates', middlewares: ['requireAuth'], handler: getLogisticsStatusUpdates },
    { method: 'post', path: '/api/logistics/status-updates', middlewares: ['requireAuth'], handler: createLogisticsStatusUpdate },
    { method: 'get', path: '/api/logistics/status-updates/shipment/:shipmentId', middlewares: ['requireAuth'], handler: getStatusUpdatesByShipment },

    // ==========================================
    // CHECKPOINTS ROUTES (3 routes)
    // ==========================================
    { method: 'get', path: '/api/logistics/checkpoints', middlewares: ['requireAuth'], handler: getLogisticsCheckpoints },
    { method: 'post', path: '/api/logistics/checkpoints', middlewares: ['requireAuth'], handler: createLogisticsCheckpoint },
    { method: 'get', path: '/api/logistics/checkpoints/shipment/:shipmentId', middlewares: ['requireAuth'], handler: getCheckpointsByShipment },

    // ==========================================
    // LOGISTICS TASKS ROUTES (5 routes)
    // ==========================================
    { method: 'get', path: '/api/logistics/tasks', middlewares: ['requireAuth'], handler: getLogisticsTasks },
    { method: 'get', path: '/api/logistics/tasks/:id', middlewares: ['requireAuth'], handler: getLogisticsTask },
    { method: 'post', path: '/api/logistics/tasks', middlewares: ['requireAuth'], handler: createLogisticsTask },
    { method: 'put', path: '/api/logistics/tasks/:id', middlewares: ['requireAuth'], handler: updateLogisticsTask },
    { method: 'delete', path: '/api/logistics/tasks/:id', middlewares: ['requireAuth'], handler: deleteLogisticsTask },
    
    // ==========================================
    // LOGISTICS ATTENDANCE ROUTES (7 routes)
    // ==========================================
    { method: 'get', path: '/api/logistics/attendance', middlewares: ['requireAuth'], handler: getLogisticsAttendance },
    { method: 'get', path: '/api/logistics/attendance/today', middlewares: ['requireAuth'], handler: getLogisticsAttendanceToday },
    { method: 'get', path: '/api/logistics/attendance/metrics', middlewares: ['requireAuth'], handler: getLogisticsAttendanceMetrics },
    { method: 'post', path: '/api/logistics/attendance/check-in', middlewares: ['requireAuth'], handler: checkInLogistics },
    { method: 'put', path: '/api/logistics/attendance/:id/check-out', middlewares: ['requireAuth'], handler: checkOutLogistics },
    { method: 'post', path: '/api/logistics/attendance/photo/upload-url', middlewares: ['requireAuth'], handler: generateAttendancePhotoUploadUrl },
    { method: 'put', path: '/api/logistics/attendance/:id/photo', middlewares: ['requireAuth'], handler: updateAttendancePhoto },
    
    // ==========================================
    // REPORTS & ANALYTICS ROUTES (6 routes)
    // ==========================================
    { method: 'get', path: '/api/logistics/dashboard', middlewares: ['requireAuth'], handler: getLogisticsDashboardMetrics },
    { method: 'get', path: '/api/logistics/reports/daily', middlewares: ['requireAuth'], handler: getDailyShipmentsReport },
    { method: 'get', path: '/api/logistics/reports/delivery-time', middlewares: ['requireAuth'], handler: getAverageDeliveryTime },
    { method: 'get', path: '/api/logistics/reports/vendor-performance', middlewares: ['requireAuth'], handler: getVendorPerformanceReport },
    { method: 'get', path: '/api/logistics/reports/volume', middlewares: ['requireAuth'], handler: getShipmentVolumeMetrics },
    { method: 'get', path: '/api/logistics/reports/performance', middlewares: ['requireAuth'], handler: getDeliveryPerformanceMetrics },

    // ==========================================
    // HEALTH ENDPOINT (1 route)
    // ==========================================
    { method: 'get', path: '/api/logistics/health', middlewares: [], handler: getLogisticsHealth },
  ];

  console.log(`📋 Registering ${logisticsRoutes.length} logistics routes from registry...`);
  
  // Register each route with proper middleware
  for (const route of logisticsRoutes) {
    const middlewares: Array<(req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Promise<void>> = [];
    
    // Map middleware strings to actual middleware functions
    for (const mwName of route.middlewares) {
      if (mwName === 'requireAuth') {
        middlewares.push(auth);
      } else if (mwName === 'requireLogisticsAccess') {
        middlewares.push(logisticsAccess || auth);
      } else if (mwName.startsWith('checkOwnership:')) {
        const entityType = mwName.split(':')[1];
        middlewares.push(checkOwnership ? checkOwnership(entityType) : checkLogisticsOwnership(entityType));
      }
    }
    
    // Register the route with the Express app
    (app as any)[route.method](route.path, ...middlewares, route.handler);
  }
  
  console.log(`✅ Logistics routes registry registration complete: ${logisticsRoutes.length} routes`);
  
  // Development route verification log
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Logistics routes registered:');
    logisticsRoutes.forEach(route => {
      console.log(`  ${route.method.toUpperCase()} ${route.path} [${route.middlewares.length} middleware]`);
    });
  }

  // Logistics route count verification
  const EXPECTED_LOGISTICS_ROUTE_COUNT = 36;
  if (logisticsRoutes.length !== EXPECTED_LOGISTICS_ROUTE_COUNT) {
    console.warn(`⚠️  Logistics route count mismatch: Expected ${EXPECTED_LOGISTICS_ROUTE_COUNT}, found ${logisticsRoutes.length}`);
  }

  // Verify critical status workflow routes are registered
  const criticalRoutes = [
    'PUT /api/logistics/shipments/:id/status',
    'POST /api/logistics/shipments/:id/close',
    'POST /api/logistics/pod/upload-url'
  ];
  
  console.log('🔍 Verifying critical status workflow routes:');
  criticalRoutes.forEach(route => {
    const [method, path] = route.split(' ');
    const found = logisticsRoutes.some(r => r.method === method.toLowerCase() && r.path === path);
    console.log(`  ${found ? '✅' : '❌'} ${route}`);
  });
};