import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { storage } from "./storage";
import {
  insertLeadSchema, insertFieldVisitSchema, insertMarketingTaskSchema, insertMarketingAttendanceSchema,
  updateLeadStatusSchema, updateFieldVisitStatusSchema, updateMarketingTaskStatusSchema,
  fieldVisitCheckInSchema, fieldVisitCheckOutSchema, convertLeadSchema,
  leadFilterSchema, fieldVisitFilterSchema, marketingTaskFilterSchema
} from "@shared/schema";

// Authentication and Authorization types
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    username: string;
  };
}

// Marketing Route Handlers - Extracted from routes.ts

// ==========================================
// LEADS HANDLERS
// ==========================================

export const getLeads = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = leadFilterSchema.parse(req.query);
    let leads;
    const hasFilters = Object.values(filters).some(value => value !== undefined);
    
    if (hasFilters) {
      // Note: Using getLeads() for now - filtering can be added later
      leads = await storage.getLeads();
    } else {
      leads = await storage.getLeads();
    }
    
    res.json(leads);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid filter parameters", details: error.errors });
    }
    res.status(500).json({ error: "Failed to fetch leads" });
  }
};

export const getLead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid lead ID format" });
    }
    
    const lead = await storage.getLead(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch lead" });
  }
};

export const createLead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const leadData = insertLeadSchema.parse(req.body);
    
    leadData.assignedBy = req.user!.id;
    // Note: createdBy field may need to be added to schema
    
    const lead = await storage.createLead(leadData);
    await storage.createActivity({
      userId: req.user!.id,
      action: "CREATE_LEAD",
      entityType: "lead",
      entityId: lead.id,
      details: `Created lead: ${lead.firstName} ${lead.lastName}`,
    });
    res.status(201).json(lead);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid lead data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create lead" });
  }
};

export const updateLead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid lead ID format" });
    }
    
    const existingLead = await storage.getLead(req.params.id);
    if (!existingLead) {
      return res.status(404).json({ error: "Lead not found" });
    }
    
    const leadData = insertLeadSchema.partial().parse(req.body);
    const lead = await storage.updateLead(req.params.id, leadData);
    await storage.createActivity({
      userId: req.user!.id,
      action: "UPDATE_LEAD",
      entityType: "lead",
      entityId: lead.id,
      details: `Updated lead: ${lead.firstName} ${lead.lastName}`,
    });
    res.json(lead);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid lead data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update lead" });
  }
};

export const deleteLead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid lead ID format" });
    }
    
    const existingLead = await storage.getLead(req.params.id);
    if (!existingLead) {
      return res.status(404).json({ error: "Lead not found" });
    }
    
    await storage.deleteLead(req.params.id);
    await storage.createActivity({
      userId: req.user!.id,
      action: "DELETE_LEAD",
      entityType: "lead",
      entityId: req.params.id,
      details: `Deleted lead: ${existingLead.firstName} ${existingLead.lastName}`,
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete lead" });
  }
};

export const updateLeadStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid lead ID format" });
    }
    
    const existingLead = await storage.getLead(req.params.id);
    if (!existingLead) {
      return res.status(404).json({ error: "Lead not found" });
    }
    
    const { status, notes } = updateLeadStatusSchema.parse(req.body);
    
    const lead = await storage.updateLead(req.params.id, { status });
    await storage.createActivity({
      userId: req.user!.id,
      action: "UPDATE_LEAD_STATUS",
      entityType: "lead",
      entityId: lead.id,
      details: `Updated lead status to '${status}': ${lead.firstName} ${lead.lastName}${notes ? ` - ${notes}` : ''}`,
    });
    res.json(lead);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid status update data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update lead status" });
  }
};

export const convertLead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid lead ID format" });
    }
    
    const existingLead = await storage.getLead(req.params.id);
    if (!existingLead) {
      return res.status(404).json({ error: "Lead not found" });
    }
    
    const conversionData = convertLeadSchema.parse(req.body);
    
    const customer = await storage.convertLeadToCustomer(req.params.id, conversionData);
    await storage.createActivity({
      userId: req.user!.id,
      action: "CONVERT_LEAD",
      entityType: "customer",
      entityId: customer.id,
      details: `Converted lead to customer: ${customer.name}`,
    });
    res.json({ customer, message: "Lead successfully converted to customer" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid conversion data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to convert lead to customer" });
  }
};

export const getLeadMetrics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const metrics = await storage.getLeadsConversionMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leads metrics" });
  }
};

export const searchLeads = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Search query is required and cannot be empty" });
    }
    if (query.length < 2) {
      return res.status(400).json({ error: "Search query must be at least 2 characters long" });
    }
    const leads = await storage.searchLeads(query);
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: "Failed to search leads" });
  }
};

// ==========================================
// FIELD VISITS HANDLERS
// ==========================================

export const getFieldVisits = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = fieldVisitFilterSchema.parse(req.query);
    let visits;
    const hasFilters = Object.values(filters).some(value => value !== undefined);
    
    if (hasFilters) {
      // Note: Using getFieldVisits() for now - filtering can be added later
      visits = await storage.getFieldVisits();
    } else {
      visits = await storage.getFieldVisits();
    }
    
    res.json(visits);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid filter parameters", details: error.errors });
    }
    res.status(500).json({ error: "Failed to fetch field visits" });
  }
};

export const getFieldVisit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid field visit ID format" });
    }
    
    const visit = await storage.getFieldVisit(req.params.id);
    if (!visit) {
      return res.status(404).json({ error: "Field visit not found" });
    }
    res.json(visit);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch field visit" });
  }
};

export const createFieldVisit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const visitData = insertFieldVisitSchema.parse(req.body);
    
    visitData.assignedBy = req.user!.id;
    // Note: createdBy field may need to be added to schema
    
    const lead = await storage.getLead(visitData.leadId);
    if (!lead) {
      return res.status(400).json({ error: "Associated lead not found" });
    }
    
    const visit = await storage.createFieldVisit(visitData);
    await storage.createActivity({
      userId: req.user!.id,
      action: "CREATE_FIELD_VISIT",
      entityType: "field_visit",
      entityId: visit.id,
      details: `Scheduled field visit: ${visit.visitNumber}`,
    });
    res.status(201).json(visit);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid visit data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create field visit" });
  }
};

export const updateFieldVisit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid field visit ID format" });
    }
    
    const existingVisit = await storage.getFieldVisit(req.params.id);
    if (!existingVisit) {
      return res.status(404).json({ error: "Field visit not found" });
    }
    
    const visitData = insertFieldVisitSchema.partial().parse(req.body);
    const visit = await storage.updateFieldVisit(req.params.id, visitData);
    await storage.createActivity({
      userId: req.user!.id,
      action: "UPDATE_FIELD_VISIT",
      entityType: "field_visit",
      entityId: visit.id,
      details: `Updated field visit: ${visit.visitNumber}`,
    });
    res.json(visit);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid visit data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update field visit" });
  }
};

export const deleteFieldVisit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid field visit ID format" });
    }
    
    const existingVisit = await storage.getFieldVisit(req.params.id);
    if (!existingVisit) {
      return res.status(404).json({ error: "Field visit not found" });
    }
    
    await storage.deleteFieldVisit(req.params.id);
    await storage.createActivity({
      userId: req.user!.id,
      action: "DELETE_FIELD_VISIT",
      entityType: "field_visit",
      entityId: req.params.id,
      details: `Deleted field visit: ${existingVisit.visitNumber}`,
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete field visit" });
  }
};

export const checkInFieldVisit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid field visit ID format" });
    }
    
    const existingVisit = await storage.getFieldVisit(req.params.id);
    if (!existingVisit) {
      return res.status(404).json({ error: "Field visit not found" });
    }
    
    const checkInData = fieldVisitCheckInSchema.parse(req.body);
    
    if (existingVisit.actualStartTime) {
      return res.status(400).json({ error: "Already checked in to this field visit" });
    }
    
    if (existingVisit.assignedTo !== req.user!.id && req.user!.role !== 'admin' && req.user!.role !== 'manager') {
      return res.status(403).json({ error: "You are not assigned to this field visit" });
    }

    const visit = await storage.checkInFieldVisit(req.params.id, {
      checkInLatitude: checkInData.latitude,
      checkInLongitude: checkInData.longitude,
      checkInLocation: checkInData.location,
      checkInPhotoPath: checkInData.photoPath,
      actualStartTime: new Date()
    });
    
    await storage.createActivity({
      userId: req.user!.id,
      action: "CHECK_IN_FIELD_VISIT",
      entityType: "field_visit",
      entityId: visit.id,
      details: `Checked in to field visit: ${visit.visitNumber} at ${checkInData.location || 'GPS location'}`,
    });
    
    res.json({ visit, message: "Successfully checked in to field visit" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid check-in data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to check in to field visit" });
  }
};

export const checkOutFieldVisit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid field visit ID format" });
    }
    
    const existingVisit = await storage.getFieldVisit(req.params.id);
    if (!existingVisit) {
      return res.status(404).json({ error: "Field visit not found" });
    }
    
    const checkOutData = fieldVisitCheckOutSchema.parse(req.body);
    
    if (existingVisit.actualEndTime) {
      return res.status(400).json({ error: "Already checked out of this field visit" });
    }
    
    if (!existingVisit.actualStartTime) {
      return res.status(400).json({ error: "Must check in before checking out" });
    }
    
    if (existingVisit.assignedTo !== req.user!.id && req.user!.role !== 'admin' && req.user!.role !== 'manager') {
      return res.status(403).json({ error: "You are not assigned to this field visit" });
    }

    const visit = await storage.checkOutFieldVisit(req.params.id, {
      checkOutLatitude: checkOutData.latitude,
      checkOutLongitude: checkOutData.longitude,
      checkOutLocation: checkOutData.location,
      checkOutPhotoPath: checkOutData.photoPath,
      actualEndTime: new Date(),
      visitNotes: checkOutData.visitNotes,
      outcome: checkOutData.outcome,
      nextAction: checkOutData.nextAction,
      status: 'completed'
    });
    
    await storage.createActivity({
      userId: req.user!.id,
      action: "CHECK_OUT_FIELD_VISIT",
      entityType: "field_visit",
      entityId: visit.id,
      details: `Checked out of field visit: ${visit.visitNumber} with outcome: ${checkOutData.outcome || 'Not specified'}`,
    });
    
    res.json({ visit, message: "Successfully checked out of field visit" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid check-out data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to check out of field visit" });
  }
};

export const updateFieldVisitStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid field visit ID format" });
    }
    
    const existingVisit = await storage.getFieldVisit(req.params.id);
    if (!existingVisit) {
      return res.status(404).json({ error: "Field visit not found" });
    }
    
    const { status, notes } = updateFieldVisitStatusSchema.parse(req.body);
    
    const visit = await storage.updateVisitStatus(req.params.id, status);
    await storage.createActivity({
      userId: req.user!.id,
      action: "UPDATE_FIELD_VISIT_STATUS",
      entityType: "field_visit",
      entityId: visit.id,
      details: `Updated field visit status to '${status}': ${visit.visitNumber}${notes ? ` - ${notes}` : ''}`,
    });
    res.json(visit);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid status update data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update field visit status" });
  }
};

export const getTodayFieldVisits = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const visits = await storage.getTodayFieldVisits();
    res.json(visits);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch today's field visits" });
  }
};

export const getFieldVisitMetrics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const metrics = await storage.getVisitMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch field visit metrics" });
  }
};

// ==========================================
// MARKETING TASKS HANDLERS
// ==========================================

export const getMarketingTasks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = marketingTaskFilterSchema.parse(req.query);
    let tasks;
    const hasFilters = Object.values(filters).some(value => value !== undefined);
    
    if (hasFilters) {
      // Note: Using getMarketingTasks() for now - filtering can be added later
      tasks = await storage.getMarketingTasks();
    } else {
      tasks = await storage.getMarketingTasks();
    }
    
    res.json(tasks);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid filter parameters", details: error.errors });
    }
    res.status(500).json({ error: "Failed to fetch marketing tasks" });
  }
};

export const getMarketingTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid marketing task ID format" });
    }
    
    const task = await storage.getMarketingTask(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Marketing task not found" });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch marketing task" });
  }
};

export const createMarketingTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const taskData = insertMarketingTaskSchema.parse(req.body);
    
    taskData.assignedBy = req.user!.id;
    // Note: createdBy field may need to be added to schema
    
    if (taskData.leadId) {
      const lead = await storage.getLead(taskData.leadId);
      if (!lead) {
        return res.status(400).json({ error: "Associated lead not found" });
      }
    }
    
    if (taskData.fieldVisitId) {
      const visit = await storage.getFieldVisit(taskData.fieldVisitId);
      if (!visit) {
        return res.status(400).json({ error: "Associated field visit not found" });
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
      return res.status(400).json({ error: "Invalid task data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create marketing task" });
  }
};

export const updateMarketingTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid marketing task ID format" });
    }
    
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
      return res.status(400).json({ error: "Invalid task data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update marketing task" });
  }
};

export const deleteMarketingTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid marketing task ID format" });
    }
    
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
};

export const updateMarketingTaskStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid marketing task ID format" });
    }
    
    const existingTask = await storage.getMarketingTask(req.params.id);
    if (!existingTask) {
      return res.status(404).json({ error: "Marketing task not found" });
    }
    
    const { status, notes } = updateMarketingTaskStatusSchema.parse(req.body);
    
    const task = await storage.updateMarketingTask(req.params.id, { status });
    await storage.createActivity({
      userId: req.user!.id,
      action: "UPDATE_MARKETING_TASK_STATUS",
      entityType: "marketing_task",
      entityId: task.id,
      details: `Updated marketing task status to '${status}': ${task.title}${notes ? ` - ${notes}` : ''}`,
    });
    res.json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid status update data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update marketing task status" });
  }
};

export const completeMarketingTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { completionNotes, outcome, nextAction, actualHours } = req.body;
    const task = await storage.updateMarketingTask(req.params.id, {
      completionNotes,
      outcome,
      nextAction,
      actualHours,
      status: 'completed'
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
};

export const getTodayMarketingTasks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tasks = await storage.getTodayMarketingTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch today's marketing tasks" });
  }
};

export const getMarketingTaskMetrics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Note: Implement getTaskCompletionMetrics in storage or use basic metrics
    const metrics = { completed: 0, pending: 0, in_progress: 0 };
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch marketing task metrics" });
  }
};

// ==========================================
// MARKETING ATTENDANCE HANDLERS
// ==========================================

export const getMarketingAttendances = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const attendance = await storage.getMarketingAttendances();
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch marketing attendance" });
  }
};

export const getMarketingAttendance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const attendance = await storage.getMarketingAttendance(req.params.id);
    if (!attendance) {
      return res.status(404).json({ error: "Attendance record not found" });
    }
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch attendance record" });
  }
};

export const createMarketingAttendance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, checkedInBy, checkedOutBy, ...clientData } = req.body;
    const attendanceData = insertMarketingAttendanceSchema.parse({
      ...clientData,
      userId: req.user!.id,
      checkedInBy: null,
      checkedOutBy: null,
    });
    const attendance = await storage.createMarketingAttendance(attendanceData);
    res.status(201).json(attendance);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid attendance data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create attendance record" });
  }
};

export const updateMarketingAttendance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const attendanceData = insertMarketingAttendanceSchema.partial().parse(req.body);
    const attendance = await storage.updateMarketingAttendance(req.params.id, attendanceData);
    res.json(attendance);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid attendance data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update attendance record" });
  }
};

export const deleteMarketingAttendance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await storage.deleteMarketingAttendance(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete attendance record" });
  }
};

export const checkInMarketingAttendance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { latitude, longitude, location, photoPath } = req.body;
    const userId = req.user!.id;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: "GPS coordinates are required for check-in" });
    }

    const attendance = await storage.checkInMarketingAttendance(userId, {
      checkInTime: new Date(),
      checkInLatitude: latitude,
      checkInLongitude: longitude,
      checkInLocation: location,
      checkInPhotoPath: photoPath,
      date: new Date(),
      attendanceStatus: 'present'
    });
    
    res.json({ attendance, message: "Successfully checked in" });
  } catch (error) {
    res.status(500).json({ error: "Failed to check in" });
  }
};

export const checkOutMarketingAttendance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { latitude, longitude, location, photoPath, workDescription, visitCount, tasksCompleted } = req.body;
    const userId = req.user!.id;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: "GPS coordinates are required for check-out" });
    }

    const attendance = await storage.checkOutMarketingAttendance(userId, {
      checkOutTime: new Date(),
      checkOutLatitude: latitude,
      checkOutLongitude: longitude,
      checkOutLocation: location,
      checkOutPhotoPath: photoPath,
      workDescription,
      visitCount,
      tasksCompleted
    });
    
    res.json({ attendance, message: "Successfully checked out" });
  } catch (error) {
    res.status(500).json({ error: "Failed to check out" });
  }
};

export const getTodayMarketingAttendance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const attendance = await storage.getTodayMarketingAttendance();
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch today's attendance" });
  }
};

export const getMarketingAttendanceMetrics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const metrics = await storage.getMarketingAttendanceMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch attendance metrics" });
  }
};

// ==========================================
// MARKETING ANALYTICS HANDLERS
// ==========================================

export const getMarketingDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const dashboard = await storage.getMarketingDashboardMetrics();
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch marketing dashboard metrics" });
  }
};

export const getMarketingConversionRates = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const conversionRates = await storage.getLeadConversionRates();
    res.json(conversionRates);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch conversion rates" });
  }
};

export const getMarketingTeamPerformance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const teamPerformance = await storage.getMarketingTeamPerformance();
    res.json(teamPerformance);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch team performance metrics" });
  }
};

export const getMarketingVisitSuccessRates = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const successRates = await storage.getVisitSuccessRates();
    res.json(successRates);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch visit success rates" });
  }
};

// ==========================================
// MARKETING ROUTES REGISTRY - CORE SOLUTION
// ==========================================

// Marketing middleware factory function
function checkOwnership(entityType: string) {
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
            return res.status(500).json({ error: "Unknown entity type" });
        }
      } catch (error) {
        return res.status(404).json({ error: `${entityType.replace('_', ' ')} not found` });
      }

      if (!entity) {
        return res.status(404).json({ error: `${entityType.replace('_', ' ')} not found` });
      }

      // Check if user owns the resource (assigned to them or created by them)
      const userId = req.user.id;
      const hasAccess = entity.assignedTo === userId || 
                       entity.createdBy === userId ||
                       entity.userId === userId;

      if (!hasAccess) {
        return res.status(403).json({ 
          error: "Access denied", 
          message: "You can only access your own records" 
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: "Failed to verify ownership" });
    }
  };
}

/**
 * MARKETING ROUTES REGISTRY - Complete enumeration of all 41 marketing endpoints
 * Routes are defined inside the registration function to avoid module-level middleware references
 */

// Type for marketing route structure
export type MarketingRoute = {
  method: 'get' | 'post' | 'put' | 'delete';
  path: string;
  middlewares: string[];
  handler: (req: AuthenticatedRequest, res: Response) => Promise<void>;
};

/**
 * SAFE MARKETING ROUTES REGISTRATION FUNCTION
 * This function registers all marketing routes with proper middleware injection
 * Called from main routes.ts to safely add marketing functionality
 */
export function registerMarketingRoutes(
  app: Express, 
  middleware: {
    requireAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    requireMarketingAccess: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    checkOwnership: (entityType: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
  }
): void {
  const { requireAuth: auth, requireMarketingAccess: marketingAccess, checkOwnership } = middleware;
  
  // Define all marketing routes with their middleware requirements
  const marketingRoutes: MarketingRoute[] = [
    // ==========================================
    // LEADS ROUTES (9 endpoints)
    // ==========================================
    { method: 'get', path: '/api/leads', middlewares: ['requireAuth'], handler: getLeads },
    { method: 'get', path: '/api/leads/:id', middlewares: ['requireAuth', 'checkOwnership:lead'], handler: getLead },
    { method: 'post', path: '/api/leads', middlewares: ['requireAuth'], handler: createLead },
    { method: 'put', path: '/api/leads/:id', middlewares: ['requireAuth', 'checkOwnership:lead'], handler: updateLead },
    { method: 'delete', path: '/api/leads/:id', middlewares: ['requireAuth', 'checkOwnership:lead'], handler: deleteLead },
    { method: 'put', path: '/api/leads/:id/status', middlewares: ['requireAuth', 'checkOwnership:lead'], handler: updateLeadStatus },
    { method: 'post', path: '/api/leads/:id/convert', middlewares: ['requireAuth', 'checkOwnership:lead'], handler: convertLead },
    { method: 'get', path: '/api/leads/metrics', middlewares: ['requireAuth', 'requireMarketingAccess'], handler: getLeadMetrics },
    { method: 'get', path: '/api/leads/search', middlewares: ['requireAuth'], handler: searchLeads },

    // ==========================================
    // FIELD VISITS ROUTES (10 endpoints)
    // ==========================================
    { method: 'get', path: '/api/field-visits', middlewares: ['requireAuth'], handler: getFieldVisits },
    { method: 'get', path: '/api/field-visits/:id', middlewares: ['requireAuth', 'checkOwnership:field_visit'], handler: getFieldVisit },
    { method: 'post', path: '/api/field-visits', middlewares: ['requireAuth'], handler: createFieldVisit },
    { method: 'put', path: '/api/field-visits/:id', middlewares: ['requireAuth', 'checkOwnership:field_visit'], handler: updateFieldVisit },
    { method: 'delete', path: '/api/field-visits/:id', middlewares: ['requireAuth', 'checkOwnership:field_visit'], handler: deleteFieldVisit },
    { method: 'post', path: '/api/field-visits/:id/check-in', middlewares: ['requireAuth', 'checkOwnership:field_visit'], handler: checkInFieldVisit },
    { method: 'post', path: '/api/field-visits/:id/check-out', middlewares: ['requireAuth', 'checkOwnership:field_visit'], handler: checkOutFieldVisit },
    { method: 'put', path: '/api/field-visits/:id/status', middlewares: ['requireAuth', 'checkOwnership:field_visit'], handler: updateFieldVisitStatus },
    { method: 'get', path: '/api/field-visits/today', middlewares: ['requireAuth'], handler: getTodayFieldVisits },
    { method: 'get', path: '/api/field-visits/metrics', middlewares: ['requireAuth', 'requireMarketingAccess'], handler: getFieldVisitMetrics },

    // ==========================================
    // MARKETING TASKS ROUTES (9 endpoints)
    // ==========================================
    { method: 'get', path: '/api/marketing-tasks', middlewares: ['requireAuth'], handler: getMarketingTasks },
    { method: 'get', path: '/api/marketing-tasks/:id', middlewares: ['requireAuth', 'checkOwnership:marketing_task'], handler: getMarketingTask },
    { method: 'post', path: '/api/marketing-tasks', middlewares: ['requireAuth'], handler: createMarketingTask },
    { method: 'put', path: '/api/marketing-tasks/:id', middlewares: ['requireAuth', 'checkOwnership:marketing_task'], handler: updateMarketingTask },
    { method: 'delete', path: '/api/marketing-tasks/:id', middlewares: ['requireAuth', 'checkOwnership:marketing_task'], handler: deleteMarketingTask },
    { method: 'put', path: '/api/marketing-tasks/:id/status', middlewares: ['requireAuth', 'checkOwnership:marketing_task'], handler: updateMarketingTaskStatus },
    { method: 'post', path: '/api/marketing-tasks/:id/complete', middlewares: ['requireAuth', 'checkOwnership:marketing_task'], handler: completeMarketingTask },
    { method: 'get', path: '/api/marketing-tasks/today', middlewares: ['requireAuth'], handler: getTodayMarketingTasks },
    { method: 'get', path: '/api/marketing-tasks/metrics', middlewares: ['requireAuth', 'requireMarketingAccess'], handler: getMarketingTaskMetrics },

    // ==========================================
    // MARKETING ATTENDANCE ROUTES (9 endpoints)
    // ==========================================
    { method: 'get', path: '/api/marketing-attendance', middlewares: ['requireAuth'], handler: getMarketingAttendances },
    { method: 'get', path: '/api/marketing-attendance/:id', middlewares: ['requireAuth', 'checkOwnership:marketing_attendance'], handler: getMarketingAttendance },
    { method: 'post', path: '/api/marketing-attendance', middlewares: ['requireAuth'], handler: createMarketingAttendance },
    { method: 'put', path: '/api/marketing-attendance/:id', middlewares: ['requireAuth', 'checkOwnership:marketing_attendance'], handler: updateMarketingAttendance },
    { method: 'delete', path: '/api/marketing-attendance/:id', middlewares: ['requireAuth', 'checkOwnership:marketing_attendance'], handler: deleteMarketingAttendance },
    { method: 'post', path: '/api/marketing-attendance/check-in', middlewares: ['requireAuth'], handler: checkInMarketingAttendance },
    { method: 'post', path: '/api/marketing-attendance/check-out', middlewares: ['requireAuth'], handler: checkOutMarketingAttendance },
    { method: 'get', path: '/api/marketing-attendance/today', middlewares: ['requireAuth'], handler: getTodayMarketingAttendance },
    { method: 'get', path: '/api/marketing-attendance/metrics', middlewares: ['requireAuth', 'requireMarketingAccess'], handler: getMarketingAttendanceMetrics },

    // ==========================================
    // MARKETING ANALYTICS ROUTES (4 endpoints)
    // ==========================================
    { method: 'get', path: '/api/marketing/dashboard', middlewares: ['requireAuth', 'requireMarketingAccess'], handler: getMarketingDashboard },
    { method: 'get', path: '/api/marketing/conversion-rates', middlewares: ['requireAuth', 'requireMarketingAccess'], handler: getMarketingConversionRates },
    { method: 'get', path: '/api/marketing/team-performance', middlewares: ['requireAuth', 'requireMarketingAccess'], handler: getMarketingTeamPerformance },
    { method: 'get', path: '/api/marketing/visit-success-rates', middlewares: ['requireAuth', 'requireMarketingAccess'], handler: getMarketingVisitSuccessRates },
  ];

  console.log(`📋 Registering ${marketingRoutes.length} marketing routes from registry...`);
  
  // Register each route with proper middleware
  for (const route of marketingRoutes) {
    const middlewares: Array<(req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Promise<void>> = [];
    
    // Map middleware strings to actual middleware functions
    for (const mwName of route.middlewares) {
      if (mwName === 'requireAuth') {
        middlewares.push(auth);
      } else if (mwName === 'requireMarketingAccess') {
        middlewares.push(marketingAccess);
      } else if (mwName.startsWith('checkOwnership:')) {
        const entityType = mwName.split(':')[1];
        middlewares.push(checkOwnership(entityType));
      }
    }
    
    // Register the route with the Express app
    (app as any)[route.method](route.path, ...middlewares, route.handler);
  }
  
  console.log(`✅ Marketing routes registry registration complete: ${marketingRoutes.length} routes`);
  
  // Development route verification log
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Marketing routes registered:');
    marketingRoutes.forEach(route => {
      console.log(`  ${route.method.toUpperCase()} ${route.path} [${route.middlewares.length} middleware]`);
    });
  }

  // Marketing route count verification - exactly 41 routes as specified
  const EXPECTED_MARKETING_ROUTE_COUNT = 41;
  if (marketingRoutes.length !== EXPECTED_MARKETING_ROUTE_COUNT) {
    console.warn(`⚠️  Marketing route count mismatch: Expected ${EXPECTED_MARKETING_ROUTE_COUNT}, found ${marketingRoutes.length}`);
  }
}