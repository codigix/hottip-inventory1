import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { validate as isUuid } from "uuid";
import { db } from "./db";
import { sql, eq, and, gte, lt, desc, isNull } from "drizzle-orm";
import {
  insertLeadSchema,
  updateLeadSchema,
  insertFieldVisitSchema,
  insertMarketingTaskSchema,
  insertMarketingAttendanceSchema,
  updateLeadStatusSchema,
  updateFieldVisitStatusSchema,
  updateMarketingTaskStatusSchema,
  fieldVisitCheckInSchema,
  fieldVisitCheckOutSchema,
  convertLeadSchema,
  leadFilterSchema,
  fieldVisitFilterSchema,
  marketingTaskFilterSchema,
  attendancePhotoUploadSchema,
  insertLeaveRequestSchema,
  marketingTodays,
  users,
} from "@shared/schema";
import { ObjectStorageService } from "./objectStorage";

// Object storage service for photo uploads
const objectStorage = new ObjectStorageService();

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

export const getLeads = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const filters = leadFilterSchema.parse(req.query);

    // Convert query parameters to filter object
    const filterObject: any = {};

    if (filters.status && filters.status !== "all") {
      filterObject.status = filters.status;
    }

    if (filters.source && filters.source !== "all") {
      filterObject.source = filters.source;
    }

    if (filters.priority && filters.priority !== "all") {
      filterObject.priority = filters.priority;
    }

    if (filters.assignedTo && filters.assignedTo !== "all") {
      filterObject.assignedTo = filters.assignedTo;
    }

    if (filters.search && filters.search.trim().length > 0) {
      filterObject.search = filters.search.trim();
    }

    // SECURITY: Apply user-based scoping based on role
    if (req.user!.role === "admin" || req.user!.role === "manager") {
      // Admins and managers can see all leads
    } else {
      // Regular employees can only see leads they created or are assigned to
      filterObject.userScope = {
        userId: req.user!.id,
        showOnlyUserLeads: true,
      };
    }

    // Apply filters and get leads
    const leads = await storage.getLeads(
      Object.keys(filterObject).length > 0 ? filterObject : undefined
    );

    res.json(leads);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ error: "Invalid filter parameters", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Failed to fetch leads" });
  }
};

export const getLead = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        req.params.id
      )
    ) {
      res.status(400).json({ error: "Invalid lead ID format" });
      return;
    }

    const lead = await storage.getLead(req.params.id);
    if (!lead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    // SECURITY: Check if user has permission to view this lead
    if (req.user!.role !== "admin" && req.user!.role !== "manager") {
      if (lead.createdBy !== req.user!.id && lead.assignedTo !== req.user!.id) {
        res
          .status(403)
          .json({ error: "You do not have permission to view this lead" });
        return;
      }
    }

    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch lead" });
  }
};

export const createLead = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const leadData = insertLeadSchema.parse(req.body);

    // Set creator and assignment fields
    leadData.createdBy = req.user!.id;
    leadData.assignedBy = req.user!.id;
    // If no assignedTo is specified, assign to the creator
    if (!leadData.assignedTo) {
      leadData.assignedTo = req.user!.id;
    }

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
      res
        .status(400)
        .json({ error: "Invalid lead data", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Failed to create lead" });
  }
};

export const updateLead = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        req.params.id
      )
    ) {
      res.status(400).json({ error: "Invalid lead ID format" });
      return;
    }

    const existingLead = await storage.getLead(req.params.id);
    if (!existingLead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    // SECURITY: Check if user has permission to update this lead
    if (req.user!.role !== "admin" && req.user!.role !== "manager") {
      if (
        existingLead.createdBy !== req.user!.id &&
        existingLead.assignedTo !== req.user!.id
      ) {
        res
          .status(403)
          .json({ error: "You do not have permission to update this lead" });
        return;
      }
    }

    // SECURITY: Use secure update schema that omits ownership fields
    const leadData = updateLeadSchema.parse(req.body);
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
      res
        .status(400)
        .json({ error: "Invalid lead data", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Failed to update lead" });
  }
};

export const deleteLead = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        req.params.id
      )
    ) {
      res.status(400).json({ error: "Invalid lead ID format" });
      return;
    }

    const existingLead = await storage.getLead(req.params.id);
    if (!existingLead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    // SECURITY: Check if user has permission to delete this lead
    if (req.user!.role !== "admin" && req.user!.role !== "manager") {
      if (
        existingLead.createdBy !== req.user!.id &&
        existingLead.assignedTo !== req.user!.id
      ) {
        res
          .status(403)
          .json({ error: "You do not have permission to delete this lead" });
        return;
      }
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

export const updateLeadStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        req.params.id
      )
    ) {
      res.status(400).json({ error: "Invalid lead ID format" });
      return;
    }

    const existingLead = await storage.getLead(req.params.id);
    if (!existingLead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    // SECURITY: Check if user has permission to update this lead status
    if (req.user!.role !== "admin" && req.user!.role !== "manager") {
      if (
        existingLead.createdBy !== req.user!.id &&
        existingLead.assignedTo !== req.user!.id
      ) {
        res.status(403).json({
          error: "You do not have permission to update this lead status",
        });
        return;
      }
    }

    const { status, notes } = updateLeadStatusSchema.parse(req.body);

    const lead = await storage.updateLead(req.params.id, { status });
    await storage.createActivity({
      userId: req.user!.id,
      action: "UPDATE_LEAD_STATUS",
      entityType: "lead",
      entityId: lead.id,
      details: `Updated lead status to '${status}': ${lead.firstName} ${
        lead.lastName
      }${notes ? ` - ${notes}` : ""}`,
    });
    res.json(lead);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ error: "Invalid status update data", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Failed to update lead status" });
  }
};

export const convertLead = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        req.params.id
      )
    ) {
      res.status(400).json({ error: "Invalid lead ID format" });
      return;
    }

    const existingLead = await storage.getLead(req.params.id);
    if (!existingLead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    // SECURITY: Check if user has permission to convert this lead
    if (req.user!.role !== "admin" && req.user!.role !== "manager") {
      if (
        existingLead.createdBy !== req.user!.id &&
        existingLead.assignedTo !== req.user!.id
      ) {
        res
          .status(403)
          .json({ error: "You do not have permission to convert this lead" });
        return;
      }
    }

    const conversionData = convertLeadSchema.parse(req.body);

    const customer = await storage.convertLeadToCustomer(req.params.id);
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
      res
        .status(400)
        .json({ error: "Invalid conversion data", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Failed to convert lead to customer" });
  }
};

export const getLeadMetrics = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // SECURITY: Apply user-based scoping for metrics
    const metricsOptions: any = {};

    if (req.user!.role === "admin" || req.user!.role === "manager") {
      // Admins and managers can see all lead metrics
    } else {
      // Regular employees can only see metrics for their own leads
      metricsOptions.userScope = {
        userId: req.user!.id,
        showOnlyUserLeads: true,
      };
    }

    const metrics = await storage.getLeadsConversionMetrics(
      Object.keys(metricsOptions).length > 0 ? metricsOptions : undefined
    );
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leads metrics" });
  }
};

export const searchLeads = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const query = req.query.q as string;
    if (!query || query.trim().length === 0) {
      res
        .status(400)
        .json({ error: "Search query is required and cannot be empty" });
      return;
    }
    if (query.length < 2) {
      res
        .status(400)
        .json({ error: "Search query must be at least 2 characters long" });
      return;
    }

    // SECURITY: Apply user-based scoping for search results
    const searchOptions: any = { query: query.trim() };

    if (req.user!.role === "admin" || req.user!.role === "manager") {
      // Admins and managers can search all leads
    } else {
      // Regular employees can only search leads they created or are assigned to
      searchOptions.userScope = {
        userId: req.user!.id,
        showOnlyUserLeads: true,
      };
    }

    const leads = await storage.searchLeads(searchOptions);
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: "Failed to search leads" });
  }
};

// ==========================================
// FIELD VISITS HANDLERS
// ==========================================

export const getFieldVisits = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const filters = fieldVisitFilterSchema.parse(req.query);

    // Convert query parameters to filter object
    const filterObject: any = {};

    if (filters.status && filters.status !== "all") {
      filterObject.status = filters.status;
    }

    if (filters.assignedTo && filters.assignedTo !== "all") {
      filterObject.assignedTo = filters.assignedTo;
    }

    if (filters.leadId) {
      filterObject.leadId = filters.leadId;
    }

    if (filters.startDate && filters.endDate) {
      filterObject.startDate = filters.startDate;
      filterObject.endDate = filters.endDate;
    }

    // SECURITY: Apply user-based scoping based on role
    if (req.user!.role === "admin" || req.user!.role === "manager") {
      // Admins and managers can see all field visits
    } else {
      // Regular employees can only see field visits they created or are assigned to
      filterObject.userScope = {
        userId: req.user!.id,
        showOnlyUserVisits: true,
      };
    }

    // Apply filters and get field visits
    const visits = await storage.getFieldVisits(
      Object.keys(filterObject).length > 0 ? filterObject : undefined
    );

    res.json(visits);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ error: "Invalid filter parameters", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Failed to fetch field visits" });
  }
};

export const getFieldVisit = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        req.params.id
      )
    ) {
      res.status(400).json({ error: "Invalid field visit ID format" });
      return;
    }

    const visit = await storage.getFieldVisit(req.params.id);
    if (!visit) {
      res.status(404).json({ error: "Field visit not found" });
      return;
    }
    res.json(visit);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch field visit" });
  }
};

export const createFieldVisit = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
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
      res
        .status(400)
        .json({ error: "Invalid visit data", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Failed to create field visit" });
  }
};

export const updateFieldVisit = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        req.params.id
      )
    ) {
      res.status(400).json({ error: "Invalid field visit ID format" });
      return;
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
      res
        .status(400)
        .json({ error: "Invalid visit data", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Failed to update field visit" });
  }
};

export const deleteFieldVisit = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        req.params.id
      )
    ) {
      res.status(400).json({ error: "Invalid field visit ID format" });
      return;
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

export const checkInFieldVisit = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        req.params.id
      )
    ) {
      res.status(400).json({ error: "Invalid field visit ID format" });
      return;
    }

    const existingVisit = await storage.getFieldVisit(req.params.id);
    if (!existingVisit) {
      return res.status(404).json({ error: "Field visit not found" });
    }

    const checkInData = fieldVisitCheckInSchema.parse(req.body);

    if (existingVisit.actualStartTime) {
      res.status(400).json({ error: "Already checked in to this field visit" });
      return;
    }

    if (
      existingVisit.assignedTo !== req.user!.id &&
      req.user!.role !== "admin" &&
      req.user!.role !== "manager"
    ) {
      res
        .status(403)
        .json({ error: "You are not assigned to this field visit" });
      return;
    }

    const visit = await storage.checkInFieldVisit(req.params.id, {
      checkInLatitude: checkInData.latitude,
      checkInLongitude: checkInData.longitude,
      checkInLocation: checkInData.location,
      checkInPhotoPath: checkInData.photoPath,
      actualStartTime: new Date(),
    });

    await storage.createActivity({
      userId: req.user!.id,
      action: "CHECK_IN_FIELD_VISIT",
      entityType: "field_visit",
      entityId: visit.id,
      details: `Checked in to field visit: ${visit.visitNumber} at ${
        checkInData.location || "GPS location"
      }`,
    });

    res.json({ visit, message: "Successfully checked in to field visit" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ error: "Invalid check-in data", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Failed to check in to field visit" });
  }
};

export const checkOutFieldVisit = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        req.params.id
      )
    ) {
      res.status(400).json({ error: "Invalid field visit ID format" });
      return;
    }

    const existingVisit = await storage.getFieldVisit(req.params.id);
    if (!existingVisit) {
      return res.status(404).json({ error: "Field visit not found" });
    }

    const checkOutData = fieldVisitCheckOutSchema.parse(req.body);

    if (existingVisit.actualEndTime) {
      res
        .status(400)
        .json({ error: "Already checked out of this field visit" });
      return;
    }

    if (!existingVisit.actualStartTime) {
      res.status(400).json({ error: "Must check in before checking out" });
      return;
    }

    if (
      existingVisit.assignedTo !== req.user!.id &&
      req.user!.role !== "admin" &&
      req.user!.role !== "manager"
    ) {
      res
        .status(403)
        .json({ error: "You are not assigned to this field visit" });
      return;
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
      status: "completed",
    });

    await storage.createActivity({
      userId: req.user!.id,
      action: "CHECK_OUT_FIELD_VISIT",
      entityType: "field_visit",
      entityId: visit.id,
      details: `Checked out of field visit: ${
        visit.visitNumber
      } with outcome: ${checkOutData.outcome || "Not specified"}`,
    });

    res.json({ visit, message: "Successfully checked out of field visit" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ error: "Invalid check-out data", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Failed to check out of field visit" });
  }
};

export const updateFieldVisitStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        req.params.id
      )
    ) {
      res.status(400).json({ error: "Invalid field visit ID format" });
      return;
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
      details: `Updated field visit status to '${status}': ${
        visit.visitNumber
      }${notes ? ` - ${notes}` : ""}`,
    });
    res.json(visit);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ error: "Invalid status update data", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Failed to update field visit status" });
  }
};

export const getTodayFieldVisits = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // SECURITY: Apply user-based scoping for today's field visits
    const filterOptions: any = {};

    if (req.user!.role === "admin" || req.user!.role === "manager") {
      // Admins and managers can see all today's field visits
    } else {
      // Regular employees can only see their own today's field visits
      filterOptions.userScope = {
        userId: req.user!.id,
        showOnlyUserVisits: true,
      };
    }

    const visits = await storage.getTodayFieldVisits(
      Object.keys(filterOptions).length > 0 ? filterOptions : undefined
    );
    res.json(visits);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch today's field visits" });
  }
};

export const getFieldVisitMetrics = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // SECURITY: Apply user-based scoping for field visit metrics
    const metricsOptions: any = {};

    if (req.user!.role === "admin" || req.user!.role === "manager") {
      // Admins and managers can see all field visit metrics
    } else {
      // Regular employees can only see metrics for their own field visits
      metricsOptions.userScope = {
        userId: req.user!.id,
        showOnlyUserVisits: true,
      };
    }

    const metrics = await storage.getVisitMetrics(
      Object.keys(metricsOptions).length > 0 ? metricsOptions : undefined
    );
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch field visit metrics" });
  }
};

// ==========================================
// MARKETING TASKS HANDLERS
// ==========================================

export const getMarketingTasks = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const filters = marketingTaskFilterSchema.parse(req.query);

    // Convert query parameters to filter object
    const filterObject: any = {};

    if (filters.status && filters.status !== "all") {
      filterObject.status = filters.status;
    }

    if (filters.type && filters.type !== "all") {
      filterObject.type = filters.type;
    }

    if (filters.priority && filters.priority !== "all") {
      filterObject.priority = filters.priority;
    }

    if (filters.assignedTo && filters.assignedTo !== "all") {
      filterObject.assignedTo = filters.assignedTo;
    }

    if (filters.leadId) {
      filterObject.leadId = filters.leadId;
    }

    // SECURITY: Apply user-based scoping based on role
    if (req.user!.role === "admin" || req.user!.role === "manager") {
      // Admins and managers can see all marketing tasks
    } else {
      // Regular employees can only see marketing tasks they created or are assigned to
      filterObject.userScope = {
        userId: req.user!.id,
        showOnlyUserTasks: true,
      };
    }

    // Apply filters and get marketing tasks
    const tasks = await storage.getMarketingTasks(
      Object.keys(filterObject).length > 0 ? filterObject : undefined
    );

    res.json(tasks);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ error: "Invalid filter parameters", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Failed to fetch marketing tasks" });
  }
};

export const getMarketingTask = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        req.params.id
      )
    ) {
      res.status(400).json({ error: "Invalid marketing task ID format" });
      return;
    }

    const task = await storage.getMarketingTask(req.params.id);
    if (!task) {
      res.status(404).json({ error: "Marketing task not found" });
      return;
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch marketing task" });
  }
};

export const createMarketingTask = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      console.error(
        "createMarketingTask: No req.user found - authentication failed"
      );
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    console.log("createMarketingTask: Authenticated user:", req.user);

    // Parse and validate client data (without server-side fields)
    const validatedData = insertMarketingTaskSchema.parse(req.body);

    // Resolve authenticated user's actual UUID
    let authenticatedUserId = req.user.id;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(authenticatedUserId)) {
      // Not a UUID - treat as username and look up actual user
      console.log(
        "createMarketingTask: Looking up user by username:",
        req.user.username
      );
      const user = await storage.getUserByUsername(req.user.username);
      if (!user) {
        console.error(
          "createMarketingTask: User not found in database:",
          req.user.username
        );
        res
          .status(401)
          .json({ error: "Authenticated user not found in database" });
        return;
      }
      authenticatedUserId = user.id;
      console.log(
        "createMarketingTask: Resolved to UUID:",
        authenticatedUserId
      );
    }

    // Convert date strings to Date objects for Drizzle
    const taskData: any = {
      ...validatedData,
      assignedTo: validatedData.assignedTo || authenticatedUserId, // Default to authenticated user
      assignedBy: authenticatedUserId,
      createdBy: authenticatedUserId,
    };

    // Convert date strings to Date objects
    if (taskData.dueDate && typeof taskData.dueDate === "string") {
      taskData.dueDate = new Date(taskData.dueDate);
    }
    if (taskData.startedDate && typeof taskData.startedDate === "string") {
      taskData.startedDate = new Date(taskData.startedDate);
    }
    if (taskData.completedDate && typeof taskData.completedDate === "string") {
      taskData.completedDate = new Date(taskData.completedDate);
    }

    // Validate assignedTo user exists (skip for dev UUIDs in development mode)
    if (!(process.env.NODE_ENV === "development" && taskData.assignedTo === "00000000-0000-0000-0000-000000000001")) {
      const assignedUser = await storage.getUser(taskData.assignedTo);
      if (!assignedUser) {
        res.status(400).json({ error: "Assigned user not found" });
        return;
      }
    }

    // Validate associated lead if provided
    if (taskData.leadId) {
      const lead = await storage.getLead(taskData.leadId);
      if (!lead) {
        res.status(400).json({ error: "Associated lead not found" });
        return;
      }
    }

    // Validate associated field visit if provided
    if (taskData.fieldVisitId) {
      const visit = await storage.getFieldVisit(taskData.fieldVisitId);
      if (!visit) {
        res.status(400).json({ error: "Associated field visit not found" });
        return;
      }
    }

    const task = await storage.createMarketingTask(taskData);
    await storage.createActivity({
      userId: authenticatedUserId,
      action: "CREATE_MARKETING_TASK",
      entityType: "marketing_task",
      entityId: task.id,
      details: `Created marketing task: ${task.title}`,
    });
    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating marketing task:", error);
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ error: "Invalid task data", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Failed to create marketing task" });
  }
};

export const updateMarketingTask = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        req.params.id
      )
    ) {
      res.status(400).json({ error: "Invalid marketing task ID format" });
      return;
    }

    const existingTask = await storage.getMarketingTask(req.params.id);
    if (!existingTask) {
      res.status(404).json({ error: "Marketing task not found" });
      return;
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
      res
        .status(400)
        .json({ error: "Invalid task data", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Failed to update marketing task" });
  }
};

export const deleteMarketingTask = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        req.params.id
      )
    ) {
      res.status(400).json({ error: "Invalid marketing task ID format" });
      return;
    }

    const existingTask = await storage.getMarketingTask(req.params.id);
    if (!existingTask) {
      res.status(404).json({ error: "Marketing task not found" });
      return;
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

export const updateMarketingTaskStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        req.params.id
      )
    ) {
      res.status(400).json({ error: "Invalid marketing task ID format" });
      return;
    }

    const existingTask = await storage.getMarketingTask(req.params.id);
    if (!existingTask) {
      res.status(404).json({ error: "Marketing task not found" });
      return;
    }

    const { status, notes } = updateMarketingTaskStatusSchema.parse(req.body);

    const task = await storage.updateMarketingTask(req.params.id, { status });
    await storage.createActivity({
      userId: req.user!.id,
      action: "UPDATE_MARKETING_TASK_STATUS",
      entityType: "marketing_task",
      entityId: task.id,
      details: `Updated marketing task status to '${status}': ${task.title}${
        notes ? ` - ${notes}` : ""
      }`,
    });
    res.json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ error: "Invalid status update data", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Failed to update marketing task status" });
  }
};

export const completeMarketingTask = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { completionNotes, outcome, nextAction, actualHours } = req.body;
    const task = await storage.updateMarketingTask(req.params.id, {
      completionNotes,
      outcome,
      nextAction,
      actualHours,
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
};

export const getTodayMarketingTasks = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // SECURITY: Apply user-based scoping for today's marketing tasks
    const filterOptions: any = {};

    if (req.user!.role === "admin" || req.user!.role === "manager") {
      // Admins and managers can see all today's marketing tasks
    } else {
      // Regular employees can only see their own today's marketing tasks
      filterOptions.userScope = {
        userId: req.user!.id,
        showOnlyUserTasks: true,
      };
    }

    const tasks = await storage.getTodayMarketingTasks(
      Object.keys(filterOptions).length > 0 ? filterOptions : undefined
    );
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch today's marketing tasks" });
  }
};

export const getMarketingTaskMetrics = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // SECURITY: Apply user-based scoping for marketing task metrics
    const metricsOptions: any = {};

    if (req.user!.role === "admin" || req.user!.role === "manager") {
      // Admins and managers can see all marketing task metrics
    } else {
      // Regular employees can only see metrics for their own marketing tasks
      metricsOptions.userScope = {
        userId: req.user!.id,
        showOnlyUserTasks: true,
      };
    }

    const metrics = await storage.getTaskMetrics(
      Object.keys(metricsOptions).length > 0 ? metricsOptions : undefined
    );
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch marketing task metrics" });
  }
};

// ==========================================
// MARKETING ATTENDANCE HANDLERS
// ==========================================

export const getMarketingAttendances = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Convert query parameters to filter object
    const filterObject: any = {};

    // Parse query parameters for filtering
    if (req.query.userId && req.query.userId !== "all") {
      filterObject.userId = req.query.userId as string;
    }

    if (req.query.startDate && req.query.endDate) {
      filterObject.startDate = req.query.startDate as string;
      filterObject.endDate = req.query.endDate as string;
    }

    // SECURITY: Apply user-based scoping based on role
    if (req.user!.role === "admin" || req.user!.role === "manager") {
      // Admins and managers can see all marketing attendance
    } else {
      // Regular employees can only see their own attendance records
      filterObject.userScope = {
        userId: req.user!.id,
        showOnlyUserAttendance: true,
      };
    }

    // Apply filters and get marketing attendance
    const attendance = await storage.getMarketingAttendances(
      Object.keys(filterObject).length > 0 ? filterObject : undefined
    );

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch marketing attendance" });
  }
};

export const getMarketingAttendance = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const attendance = await storage.getMarketingAttendance(req.params.id);
    if (!attendance) {
      res.status(404).json({ error: "Attendance record not found" });
      return;
    }
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch attendance record" });
  }
};

export const createMarketingAttendance = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
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
      return res
        .status(400)
        .json({ error: "Invalid attendance data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create attendance record" });
  }
};

export const updateMarketingAttendance = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
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
};

export const deleteMarketingAttendance = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    await storage.deleteMarketingAttendance(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete attendance record" });
  }
};

// export const checkInMarketingAttendance = async (
//   req: AuthenticatedRequest,
//   res: Response
// ): Promise<void> => {
//   try {
//     const { latitude, longitude, location, photoPath, workDescription } =
//       req.body;
//     const userId = req.user?.id;

//     // Validate UUID
//     if (!userId || !isUuid(userId)) {
//       return res.status(400).json({ error: "Invalid or missing user ID" });
//     }

//     // Validate GPS coordinates
//     if (latitude === undefined || longitude === undefined) {
//       return res
//         .status(400)
//         .json({ error: "GPS coordinates are required for check-in" });
//     }

//     // Insert into marketingTodays table
//     const attendance = await db
//       .insert(marketingTodays)
//       .values({
//         userId, // matches table column
//         date: new Date(),
//         checkInTime: new Date(),
//         latitude,
//         longitude,
//         location: location || null,
//         photoPath: photoPath || null,
//         workDescription: workDescription || null,
//         attendanceStatus: "present",
//         visitCount: 0,
//         tasksCompleted: 0,
//         isOnLeave: false,
//       })
//       .returning();

//     res.json({ attendance, message: "Successfully checked in" });
//   } catch (error) {
//     console.error("Check-in error:", error);
//     res.status(500).json({ error: "Failed to check in", details: error });
//   }
// };

export const checkInMarketingAttendance = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { latitude, longitude, location, photoPath, workDescription } =
      req.body;

    // Hardcoded user ID for testing
    const userid = "79022473-7987-4f98-aff2-8d8f743fa0b2"; // replace with an existing user ID from your DB

    if (!latitude || !longitude) {
      res
        .status(400)
        .json({ error: "GPS coordinates are required for check-in" });
      return;
    }

    const attendance = await db
      .insert(marketingTodays)
      .values({
        userid, // lowercase column in DB
        date: new Date(),
        checkintime: new Date(), // lowercase column in DB
        latitude,
        longitude,
        location,
        photopath: photoPath || null,
        workdescription: workDescription || null,
        attendancestatus: "present",
        visitcount: 0,
        taskscompleted: 0,
        isonleave: false,
      })
      .returning();

    res.json({ attendance, message: "Successfully checked in" });
  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ error: "Failed to check in", details: error });
  }
};

export const checkOutMarketingAttendance = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { latitude, longitude, location } = req.body;

    if (!latitude || !longitude) {
      return res
        .status(400)
        .json({ error: "GPS coordinates required for check-out" });
    }

    // Hardcoded userId for testing
    const userid = "79022473-7987-4f98-aff2-8d8f743fa0b2";

    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    // Get today's active check-in
    const activeAttendances = await db
      .select()
      .from(marketingTodays)
      .where(
        and(
          eq(marketingTodays.userid, userid), // lowercase column
          gte(marketingTodays.date, startOfDay),
          lt(marketingTodays.date, endOfDay),
          isNull(marketingTodays.checkouttime) // lowercase column
        )
      );

    if (activeAttendances.length === 0) {
      return res
        .status(400)
        .json({ error: "No active check-in found for today" });
    }

    const activeAttendance = activeAttendances[0];

    // Only update defined values
    const updateData: any = { checkouttime: new Date() }; // lowercase
    if (location) updateData.checkoutlocation = location; // lowercase

    const updatedAttendance = await db
      .update(marketingTodays)
      .set(updateData)
      .where(eq(marketingTodays.id, activeAttendance.id))
      .returning();

    res.json({
      attendance: updatedAttendance[0],
      message: "Successfully checked out",
    });
  } catch (error: any) {
    console.error("Check-out error:", error);
    res.status(500).json({
      error: "Failed to check out",
      details: {
        message: error.message,
        stack: error.stack,
      },
    });
  }
};

// export const checkOutMarketingAttendance = async (
//   req: AuthenticatedRequest,
//   res: Response
// ): Promise<void> => {
//   try {
//     const {
//       userId: requestUserId,
//       latitude,
//       longitude,
//       location,
//       photoPath,
//       workDescription,
//       visitCount,
//       tasksCompleted,
//       outcome,
//       nextAction,
//     } = req.body;
//     const authenticatedUserId = req.user!.id;

//     // Use authenticated user if no userId provided, otherwise check authorization
//     const targetUserId = requestUserId || authenticatedUserId;

//     if (requestUserId && requestUserId !== authenticatedUserId) {
//       // Only allow checking out own attendance unless admin
//       // For now, restrict to self-checkout
//       res.status(403).json({ error: "Can only check out your own attendance" });
//       return;
//     }

//     if (!latitude || !longitude) {
//       res
//         .status(400)
//         .json({ error: "GPS coordinates are required for check-out" });
//       return;
//     }

//     // Find active check-in for the user (no check-out time)
//     const todayAttendances = await storage.getTodayMarketingAttendance();
//     const activeCheckIn = todayAttendances.find(
//       (att) => att.userId === targetUserId && !att.checkOutTime
//     );

//     if (!activeCheckIn) {
//       res.status(400).json({ error: "No active check-in found for check-out" });
//       return;
//     }

//     const attendance = await storage.checkOutMarketingAttendanceById(
//       activeCheckIn.id,
//       {
//         checkOutTime: new Date(),
//         checkOutLocation: location,
//       }
//     );

//     res.json({ id: attendance.id, message: "Successfully checked out" });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to check out" });
//   }
// };

// export const getTodayMarketingAttendance = async (
//   req: AuthenticatedRequest,
//   res: Response
// ): Promise<void> => {
//   try {
//     // Disable ETag for this route
//     res.set("Cache-Control", "no-cache");

//     // Get today's date range (current date in local timezone)
//     const today = new Date();
//     const startOfDay = new Date(
//       today.getFullYear(),
//       today.getMonth(),
//       today.getDate(),
//       0,
//       0,
//       0,
//       0
//     );
//     const endOfDay = new Date(
//       today.getFullYear(),
//       today.getMonth(),
//       today.getDate() + 1,
//       0,
//       0,
//       0,
//       0
//     );

//     console.log(
//       `🔍 [Registry] Querying marketing attendance for date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`
//     );

//     // Query using Drizzle ORM with proper join and error handling
//     const rows = await db
//       .select({
//         id: marketingTodays.id,
//         userId: marketingTodays.userId,
//         date: marketingTodays.date,
//         checkInTime: marketingTodays.checkInTime,
//         checkOutTime: marketingTodays.checkOutTime,
//         latitude: marketingTodays.latitude,
//         longitude: marketingTodays.longitude,
//         location: marketingTodays.location,
//         photoPath: marketingTodays.photoPath,
//         workDescription: marketingTodays.workDescription,
//         attendanceStatus: marketingTodays.attendanceStatus,
//         visitCount: marketingTodays.visitCount,
//         tasksCompleted: marketingTodays.tasksCompleted,
//         outcome: marketingTodays.outcome,
//         nextAction: marketingTodays.nextAction,
//         isOnLeave: marketingTodays.isOnLeave,
//         // User fields with null handling
//         userId_user: users.id,
//         userFirstName: users.firstName,
//         userLastName: users.lastName,
//         userEmail: users.email,
//       })
//       .from(marketingTodays)
//       .leftJoin(users, eq(marketingTodays.userId, users.id))
//       .where(
//         and(
//           gte(marketingTodays.date, startOfDay),
//           lt(marketingTodays.date, endOfDay),
//           // Apply user-based scoping
//           req.user!.role === "admin" || req.user!.role === "manager"
//             ? undefined
//             : eq(marketingTodays.userId, req.user!.id)
//         )
//       )
//       .orderBy(desc(marketingTodays.date));

//     console.log(
//       `📊 [Registry] Found ${rows.length} marketing attendance records for today`
//     );

//     // Transform the data to match the expected response structure
//     const attendance = rows.map((row) => ({
//       id: row.id,
//       userId: row.userId,
//       date: row.date?.toISOString() || new Date().toISOString(),
//       checkInTime: row.checkInTime?.toISOString() || null,
//       checkOutTime: row.checkOutTime?.toISOString() || null,
//       latitude: row.latitude ? parseFloat(String(row.latitude)) : null,
//       longitude: row.longitude ? parseFloat(String(row.longitude)) : null,
//       location: row.location || null,
//       photoPath: row.photoPath || null,
//       workDescription: row.workDescription || null,
//       attendanceStatus: row.attendanceStatus || "present",
//       visitCount: row.visitCount || null,
//       tasksCompleted: row.tasksCompleted || null,
//       outcome: row.outcome || null,
//       nextAction: row.nextAction || null,
//       isOnLeave: row.isOnLeave || false,
//       user: {
//         id: row.userId_user || row.userId || "",
//         name:
//           row.userFirstName && row.userLastName
//             ? `${row.userFirstName} ${row.userLastName}`
//             : "Unknown User",
//         email: row.userEmail || "",
//       },
//     }));

//     res.json(attendance);
//   } catch (error: any) {
//     console.error(
//       "❌ [Registry] GET /api/marketing-attendance/today error:",
//       error
//     );
//     console.error("Error stack:", error.stack);

//     // Return empty array instead of 500 error for better UX
//     res.json([]);
//   }
// };

export const getTodayMarketingAttendance = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Disable cache for this route
    res.set("Cache-Control", "no-cache");

    // Set today's date range
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    // Hardcoded user ID (replace with dynamic req.user!.id when ready)
    const testUserId = "79022473-7987-4f98-aff2-8d8f743fa0b2";

    // Build query
    const rows = await db
      .select({
        id: marketingTodays.id,
        userId: marketingTodays.userid, // match DB column
        date: marketingTodays.date,
        checkInTime: marketingTodays.checkintime,
        checkOutTime: marketingTodays.checkouttime,
        latitude: marketingTodays.latitude,
        longitude: marketingTodays.longitude,
        location: marketingTodays.location,
        photoPath: marketingTodays.photopath,
        workDescription: marketingTodays.workdescription,
        attendanceStatus: marketingTodays.attendancestatus,
        visitCount: marketingTodays.visitcount,
        tasksCompleted: marketingTodays.taskscompleted,
        outcome: marketingTodays.outcome,
        nextAction: marketingTodays.nextaction,
        isOnLeave: marketingTodays.isonleave,
        // User fields
        userId_user: users.id,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
      })
      .from(marketingTodays)
      .leftJoin(users, eq(marketingTodays.userid, users.id))
      .where(
        and(
          gte(marketingTodays.date, startOfDay),
          lt(marketingTodays.date, endOfDay),
          eq(marketingTodays.userid, testUserId)
        )
      )
      .orderBy(desc(marketingTodays.date));

    // Format response
    const attendance = rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      date: row.date?.toISOString() || new Date().toISOString(),
      checkInTime: row.checkInTime?.toISOString() || null,
      checkOutTime: row.checkOutTime?.toISOString() || null,
      latitude: row.latitude ? parseFloat(String(row.latitude)) : null,
      longitude: row.longitude ? parseFloat(String(row.longitude)) : null,
      location: row.location || null,
      photoPath: row.photoPath || null,
      workDescription: row.workDescription || null,
      attendanceStatus: row.attendanceStatus || "present",
      visitCount: row.visitCount ?? 0,
      tasksCompleted: row.tasksCompleted ?? 0,
      outcome: row.outcome || null,
      nextAction: row.nextAction || null,
      isOnLeave: row.isOnLeave ?? false,
      user: {
        id: row.userId_user || "",
        name:
          row.userFirstName && row.userLastName
            ? `${row.userFirstName} ${row.userLastName}`
            : "Unknown User",
        email: row.userEmail || "",
      },
    }));

    res.json(attendance);
  } catch (error: any) {
    console.error("❌ GET /api/marketing-attendance/today error:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch attendance", details: error.message });
  }
};

export const getMarketingAttendanceMetrics = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Disable ETag for this route
    res.set("Cache-Control", "no-cache");

    console.log("🔍 [Registry] Querying marketing attendance metrics...");

    // Build query with user-based scoping
    let query = db
      .select({
        totalRecords: sql<number>`COUNT(*)`,
        presentCount: sql<number>`COUNT(CASE WHEN ${marketingTodays.attendancestatus} = 'present' THEN 1 END)`,
        absentCount: sql<number>`COUNT(CASE WHEN ${marketingTodays.attendancestatus} = 'absent' THEN 1 END)`,
        leaveCount: sql<number>`COUNT(CASE WHEN ${marketingTodays.isonleave} = true THEN 1 END)`,
        avgVisits: sql<number>`COALESCE(AVG(NULLIF(${marketingTodays.visitcount}, 0)), 0)`,
        avgTasks: sql<number>`COALESCE(AVG(NULLIF(${marketingTodays.taskscompleted}, 0)), 0)`,
      })
      .from(marketingTodays);

    // Apply user-based scoping for non-admin users
    if (req.user!.role !== "admin" && req.user!.role !== "manager") {
      query = query.where(eq(marketingTodays.userid, req.user!.id));
    }

    const result = await query;
    const row = result[0];

    console.log("📊 [Registry] Raw metrics result:", row);

    // Build metrics object with safe number conversion
    const metrics = {
      totalRecords: Number(row?.totalRecords ?? 0),
      presentCount: Number(row?.presentCount ?? 0),
      absentCount: Number(row?.absentCount ?? 0),
      leaveCount: Number(row?.leaveCount ?? 0),
      avgVisits: Math.round(Number(row?.avgVisits ?? 0) * 100) / 100, // Round to 2 decimal places
      avgTasks: Math.round(Number(row?.avgTasks ?? 0) * 100) / 100, // Round to 2 decimal places
    };

    console.log("📈 [Registry] Processed metrics:", metrics);
    res.json(metrics);
  } catch (error: any) {
    console.error(
      "❌ [Registry] GET /api/marketing-attendance/metrics error:",
      error
    );
    console.error("Error stack:", error.stack);

    // Return default metrics instead of 500 error for better UX
    const defaultMetrics = {
      totalRecords: 0,
      presentCount: 0,
      absentCount: 0,
      leaveCount: 0,
      avgVisits: 0,
      avgTasks: 0,
    };

    res.json(defaultMetrics);
  }
};

// ==========================================
// MARKETING ATTENDANCE PHOTO UPLOAD HANDLERS
// ==========================================

// Generate signed upload URL for marketing attendance photos
export const generateMarketingAttendancePhotoUploadUrl = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Validate request body
    const validatedData = attendancePhotoUploadSchema.parse(req.body);

    // Verify attendance record exists and belongs to user
    const attendanceRecord = await storage.getMarketingAttendance(
      validatedData.attendanceId
    );

    if (!attendanceRecord) {
      res.status(404).json({ error: "Marketing attendance record not found" });
      return;
    }

    if (attendanceRecord.userId !== req.user!.id) {
      res.status(403).json({
        error: "Not authorized to upload photo for this attendance record",
      });
      return;
    }

    // Generate object storage path
    const objectPath = `marketing-attendance-photos/${
      validatedData.attendanceId
    }/${validatedData.photoType}-${Date.now()}-${validatedData.fileName}`;

    // Generate signed upload URL
    const uploadURL = await objectStorage.getObjectEntityUploadURL();

    res.json({
      uploadURL,
      objectPath,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Invalid request data",
        details: error.errors,
      });
      return;
    }
    console.error(
      "Marketing attendance photo upload URL generation error:",
      error
    );
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
};

// ==========================================
// LEAVE REQUEST HANDLERS
// ==========================================

export const getLeaveRequests = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Admin can see all, users see their own
    const leaveRequests =
      req.user!.role === "admin"
        ? await storage.getLeaveRequests()
        : await storage.getLeaveRequestsByUser(req.user!.id);

    res.json(leaveRequests);
  } catch (error) {
    console.error("Get leave requests error:", error);
    res.status(500).json({ error: "Failed to fetch leave requests" });
  }
};

export const getLeaveRequest = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const leaveRequest = await storage.getLeaveRequest(id);

    if (!leaveRequest) {
      res.status(404).json({ error: "Leave request not found" });
      return;
    }

    // Users can only see their own requests unless admin
    if (req.user!.role !== "admin" && leaveRequest.userId !== req.user!.id) {
      res
        .status(403)
        .json({ error: "Not authorized to view this leave request" });
      return;
    }

    res.json(leaveRequest);
  } catch (error) {
    console.error("Get leave request error:", error);
    res.status(500).json({ error: "Failed to fetch leave request" });
  }
};

export const createLeaveRequest = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Hardcoded user ID (replace with dynamic req.user!.id when ready)
    const testUserId = "79022473-7987-4f98-aff2-8d8f743fa0b2";

    const requestData = {
      ...req.body,
      userId: testUserId, // Always use the hardcoded user
    };

    const validatedData = insertLeaveRequestSchema.parse(requestData);

    // Calculate total_days
    const start = new Date(validatedData.startDate);
    const end = new Date(validatedData.endDate);
    const totalDays =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const leaveRequest = await storage.createLeaveRequest({
      ...validatedData,
      totalDays: totalDays,
    });
    res.status(201).json(leaveRequest);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Invalid request data",
        details: error.errors,
      });
      return;
    }
    console.error("Create leave request error:", error);
    res.status(500).json({ error: "Failed to create leave request" });
  }
};

export const updateLeaveRequest = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const validatedData = insertLeaveRequestSchema.partial().parse(req.body);

    // Check if leave request exists and user has permission
    const existingRequest = await storage.getLeaveRequest(id);
    if (!existingRequest) {
      res.status(404).json({ error: "Leave request not found" });
      return;
    }

    // Users can only update their own requests unless admin
    if (req.user!.role !== "admin" && existingRequest.userId !== req.user!.id) {
      res
        .status(403)
        .json({ error: "Not authorized to update this leave request" });
      return;
    }

    // Calculate total_days if dates are being updated
    let updateData = { ...validatedData };
    if (validatedData.startDate || validatedData.endDate) {
      const startDate = validatedData.startDate || existingRequest.startDate;
      const endDate = validatedData.endDate || existingRequest.endDate;
      const start = new Date(startDate);
      const end = new Date(endDate);
      const totalDays =
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
        1;
      updateData.totalDays = totalDays;
    }

    const leaveRequest = await storage.updateLeaveRequest(id, updateData);
    res.json(leaveRequest);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Invalid request data",
        details: error.errors,
      });
      return;
    }
    console.error("Update leave request error:", error);
    res.status(500).json({ error: "Failed to update leave request" });
  }
};

export const deleteLeaveRequest = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if leave request exists and user has permission
    const existingRequest = await storage.getLeaveRequest(id);
    if (!existingRequest) {
      res.status(404).json({ error: "Leave request not found" });
      return;
    }

    // Users can only delete their own requests unless admin
    if (req.user!.role !== "admin" && existingRequest.userId !== req.user!.id) {
      res
        .status(403)
        .json({ error: "Not authorized to delete this leave request" });
      return;
    }

    await storage.deleteLeaveRequest(id);
    res.status(204).send();
  } catch (error) {
    console.error("Delete leave request error:", error);
    res.status(500).json({ error: "Failed to delete leave request" });
  }
};

export const getLeaveRequestsByStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { status } = req.params;

    // Admin can see all, users see their own
    const leaveRequests =
      req.user!.role === "admin"
        ? await storage.getLeaveRequestsByStatus(status)
        : await storage.getLeaveRequestsByUser(req.user!.id);

    // Filter by status for non-admin users
    const filteredRequests =
      req.user!.role === "admin"
        ? leaveRequests
        : leaveRequests.filter((request) => request.status === status);

    res.json(filteredRequests);
  } catch (error) {
    console.error("Get leave requests by status error:", error);
    res.status(500).json({ error: "Failed to fetch leave requests" });
  }
};

// ==========================================
// MARKETING ANALYTICS HANDLERS
// ==========================================

export const getMarketingDashboard = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // SECURITY: Apply user-based scoping for marketing dashboard metrics
    const metricsOptions: any = {};

    if (req.user!.role === "admin" || req.user!.role === "manager") {
      // Admins and managers can see all marketing dashboard metrics
    } else {
      // Regular employees can only see dashboard metrics for their own data
      metricsOptions.userScope = {
        userId: req.user!.id,
        showOnlyUserData: true,
      };
    }

    const dashboard = await storage.getMarketingDashboardMetrics(
      Object.keys(metricsOptions).length > 0 ? metricsOptions : undefined
    );
    res.json(dashboard);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch marketing dashboard metrics" });
  }
};

export const getMarketingConversionRates = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // SECURITY: Apply user-based scoping for lead conversion rates
    const metricsOptions: any = {};

    if (req.user!.role === "admin" || req.user!.role === "manager") {
      // Admins and managers can see all lead conversion rates
    } else {
      // Regular employees can only see conversion rates for their own leads
      metricsOptions.userScope = {
        userId: req.user!.id,
        showOnlyUserLeads: true,
      };
    }

    const conversionRates = await storage.getLeadConversionRates(
      Object.keys(metricsOptions).length > 0 ? metricsOptions : undefined
    );
    res.json(conversionRates);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch conversion rates" });
  }
};

export const getMarketingTeamPerformance = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // SECURITY: Apply user-based scoping for team performance metrics
    const metricsOptions: any = {};

    if (req.user!.role === "admin" || req.user!.role === "manager") {
      // Admins and managers can see all team performance metrics
    } else {
      // Regular employees can only see their own performance metrics
      metricsOptions.userScope = {
        userId: req.user!.id,
        showOnlyUserData: true,
      };
    }

    const teamPerformance = await storage.getMarketingTeamPerformance(
      Object.keys(metricsOptions).length > 0 ? metricsOptions : undefined
    );
    res.json(teamPerformance);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch team performance metrics" });
  }
};

export const getMarketingVisitSuccessRates = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // SECURITY: Apply user-based scoping for visit success rates
    const metricsOptions: any = {};

    if (req.user!.role === "admin" || req.user!.role === "manager") {
      // Admins and managers can see all visit success rates
    } else {
      // Regular employees can only see success rates for their own visits
      metricsOptions.userScope = {
        userId: req.user!.id,
        showOnlyUserVisits: true,
      };
    }

    const successRates = await storage.getVisitSuccessRates(
      Object.keys(metricsOptions).length > 0 ? metricsOptions : undefined
    );
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
          case "marketingAttendance":
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
}

/**
 * MARKETING ROUTES REGISTRY - Complete enumeration of all 41 marketing endpoints
 * Routes are defined inside the registration function to avoid module-level middleware references
 */

// Type for marketing route structure
export type MarketingRoute = {
  method: "get" | "post" | "put" | "delete";
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
  middleware?: {
    requireAuth?: (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ) => Promise<void>;
    requireMarketingAccess?: (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ) => void;
    checkOwnership?: (
      entityType: string
    ) => (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ) => Promise<void>;
  }
): void {
  // Ensure middleware object exists with proper defaults
  if (!middleware) {
    throw new Error(
      "registerMarketingRoutes: middleware parameter is required"
    );
  }

  const {
    requireAuth: auth,
    requireMarketingAccess: marketingAccess,
    checkOwnership,
  } = middleware;

  // Validate that all required middleware are provided
  if (!auth) {
    throw new Error(
      "registerMarketingRoutes: requireAuth middleware is required"
    );
  }
  if (!marketingAccess) {
    throw new Error(
      "registerMarketingRoutes: requireMarketingAccess middleware is required"
    );
  }
  if (!checkOwnership) {
    throw new Error(
      "registerMarketingRoutes: checkOwnership middleware is required"
    );
  }

  // Define all marketing routes with their middleware requirements
  const marketingRoutes: MarketingRoute[] = [
    // ==========================================
    // LEADS ROUTES (9 endpoints)
    // ==========================================
    {
      method: "get",
      path: "/api/leads",
      middlewares: ["requireAuth"],
      handler: getLeads,
    },
    {
      method: "get",
      path: "/api/leads/:id",
      middlewares: ["requireAuth", "checkOwnership:lead"],
      handler: getLead,
    },
    {
      method: "post",
      path: "/api/leads",
      middlewares: ["requireAuth"],
      handler: createLead,
    },
    {
      method: "put",
      path: "/api/leads/:id",
      middlewares: ["requireAuth", "checkOwnership:lead"],
      handler: updateLead,
    },
    {
      method: "delete",
      path: "/api/leads/:id",
      middlewares: ["requireAuth", "checkOwnership:lead"],
      handler: deleteLead,
    },
    {
      method: "put",
      path: "/api/leads/:id/status",
      middlewares: ["requireAuth", "checkOwnership:lead"],
      handler: updateLeadStatus,
    },
    {
      method: "post",
      path: "/api/leads/:id/convert",
      middlewares: ["requireAuth", "checkOwnership:lead"],
      handler: convertLead,
    },
    {
      method: "get",
      path: "/api/leads/metrics",
      middlewares: ["requireAuth", "requireMarketingAccess"],
      handler: getLeadMetrics,
    },
    {
      method: "get",
      path: "/api/leads/search",
      middlewares: ["requireAuth"],
      handler: searchLeads,
    },

    // ==========================================
    // FIELD VISITS ROUTES (10 endpoints)
    // ==========================================
    {
      method: "get",
      path: "/api/field-visits",
      middlewares: ["requireAuth"],
      handler: getFieldVisits,
    },
    {
      method: "get",
      path: "/api/field-visits/:id",
      middlewares: ["requireAuth", "checkOwnership:field_visit"],
      handler: getFieldVisit,
    },
    //{ method: 'post', path: '/api/field-visits', middlewares: ['requireAuth'], handler: createFieldVisit },
    {
      method: "put",
      path: "/api/field-visits/:id",
      middlewares: ["requireAuth", "checkOwnership:field_visit"],
      handler: updateFieldVisit,
    },
    {
      method: "delete",
      path: "/api/field-visits/:id",
      middlewares: ["requireAuth", "checkOwnership:field_visit"],
      handler: deleteFieldVisit,
    },
    {
      method: "post",
      path: "/api/field-visits/:id/check-in",
      middlewares: ["requireAuth", "checkOwnership:field_visit"],
      handler: checkInFieldVisit,
    },
    {
      method: "post",
      path: "/api/field-visits/:id/check-out",
      middlewares: ["requireAuth", "checkOwnership:field_visit"],
      handler: checkOutFieldVisit,
    },
    {
      method: "put",
      path: "/api/field-visits/:id/status",
      middlewares: ["requireAuth", "checkOwnership:field_visit"],
      handler: updateFieldVisitStatus,
    },
    {
      method: "get",
      path: "/api/field-visits/today",

      middlewares: ["requireAuth"],
      handler: getTodayFieldVisits,
    },
    {
      method: "get",
      path: "/api/field-visits/metrics",
      middlewares: ["requireAuth", "requireMarketingAccess"],
      handler: getFieldVisitMetrics,
    },

    // ==========================================
    // MARKETING TASKS ROUTES (9 endpoints)
    // ==========================================
    {
      method: "get",
      path: "/api/marketing-tasks",
      middlewares: ["requireAuth"],
      handler: getMarketingTasks,
    },
    {
      method: "get",
      path: "/api/marketing-tasks/:id",
      middlewares: ["requireAuth", "checkOwnership:marketing_task"],
      handler: getMarketingTask,
    },
    {
      method: "post",
      path: "/api/marketing-tasks",
      middlewares: ["requireAuth"],
      handler: createMarketingTask,
    },
    {
      method: "put",
      path: "/api/marketing-tasks/:id",
      middlewares: ["requireAuth", "checkOwnership:marketing_task"],
      handler: updateMarketingTask,
    },
    {
      method: "delete",
      path: "/api/marketing-tasks/:id",
      middlewares: ["requireAuth", "checkOwnership:marketing_task"],
      handler: deleteMarketingTask,
    },
    {
      method: "put",
      path: "/api/marketing-tasks/:id/status",
      middlewares: ["requireAuth", "checkOwnership:marketing_task"],
      handler: updateMarketingTaskStatus,
    },
    {
      method: "post",
      path: "/api/marketing-tasks/:id/complete",
      middlewares: ["requireAuth", "checkOwnership:marketing_task"],
      handler: completeMarketingTask,
    },
    {
      method: "get",
      path: "/api/marketing-tasks/today",
      middlewares: ["requireAuth"],
      handler: getTodayMarketingTasks,
    },
    {
      method: "get",
      path: "/api/marketing-tasks/metrics",
      middlewares: ["requireAuth", "requireMarketingAccess"],
      handler: getMarketingTaskMetrics,
    },

    // ==========================================
    // MARKETING ATTENDANCE ROUTES (10 endpoints)
    // ==========================================
    // IMPORTANT: Specific routes MUST come before parameterized routes
    // to avoid Express matching "/today" and "/metrics" as ":id" parameters
    {
      method: "get",
      path: "/api/marketing-attendance/today",
      middlewares: ["requireAuth"],
      handler: getTodayMarketingAttendance,
    },
    {
      method: "get",
      path: "/api/marketing-attendance/metrics",
      middlewares: ["requireAuth", "requireMarketingAccess"],
      handler: getMarketingAttendanceMetrics,
    },
    {
      method: "post",
      path: "/api/marketing-attendance/check-in",
      middlewares: ["requireAuth"],
      handler: checkInMarketingAttendance,
    },
    {
      method: "post",
      path: "/api/marketing-attendance/check-out",
      middlewares: ["requireAuth"],
      handler: checkOutMarketingAttendance,
    },
    {
      method: "get",
      path: "/api/marketing-attendance",
      middlewares: ["requireAuth"],
      handler: getMarketingAttendances,
    },
    {
      method: "get",
      path: "/api/marketing-attendance/:id",
      middlewares: ["requireAuth", "checkOwnership:marketingAttendance"],
      handler: getMarketingAttendance,
    },
    {
      method: "post",
      path: "/api/marketing-attendance",
      middlewares: ["requireAuth"],
      handler: createMarketingAttendance,
    },
    {
      method: "put",
      path: "/api/marketing-attendance/:id",
      middlewares: ["requireAuth", "checkOwnership:marketingAttendance"],
      handler: updateMarketingAttendance,
    },
    {
      method: "delete",
      path: "/api/marketing-attendance/:id",
      middlewares: ["requireAuth", "checkOwnership:marketingAttendance"],
      handler: deleteMarketingAttendance,
    },
    {
      method: "post",
      path: "/api/marketing-attendance/photo/upload-url",
      middlewares: ["requireAuth"],
      handler: generateMarketingAttendancePhotoUploadUrl,
    },

    // ==========================================
    // LEAVE REQUEST ROUTES (6 endpoints)
    // ==========================================
    {
      method: "get",
      path: "/api/leave-requests",
      middlewares: ["requireAuth"],
      handler: getLeaveRequests,
    },
    {
      method: "get",
      path: "/api/leave-requests/:id",
      middlewares: ["requireAuth"],
      handler: getLeaveRequest,
    },
    {
      method: "post",
      path: "/api/leave-requests",
      middlewares: ["requireAuth"],
      handler: createLeaveRequest,
    },
    {
      method: "put",
      path: "/api/leave-requests/:id",
      middlewares: ["requireAuth"],
      handler: updateLeaveRequest,
    },
    {
      method: "delete",
      path: "/api/leave-requests/:id",
      middlewares: ["requireAuth"],
      handler: deleteLeaveRequest,
    },
    {
      method: "get",
      path: "/api/leave-requests/status/:status",
      middlewares: ["requireAuth"],
      handler: getLeaveRequestsByStatus,
    },

    // ==========================================
    // MARKETING ANALYTICS ROUTES (4 endpoints)
    // ==========================================
    {
      method: "get",
      path: "/api/marketing/dashboard",
      middlewares: ["requireAuth", "requireMarketingAccess"],
      handler: getMarketingDashboard,
    },
    {
      method: "get",
      path: "/api/marketing/conversion-rates",
      middlewares: ["requireAuth", "requireMarketingAccess"],
      handler: getMarketingConversionRates,
    },
    {
      method: "get",
      path: "/api/marketing/team-performance",
      middlewares: ["requireAuth", "requireMarketingAccess"],
      handler: getMarketingTeamPerformance,
    },
    {
      method: "get",
      path: "/api/marketing/visit-success-rates",
      middlewares: ["requireAuth", "requireMarketingAccess"],
      handler: getMarketingVisitSuccessRates,
    },
  ];

  console.log(
    `📋 Registering ${marketingRoutes.length} marketing routes from registry...`
  );

  // Register each route with proper middleware
  for (const route of marketingRoutes) {
    const middlewares: Array<
      (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
      ) => void | Promise<void>
    > = [];

    // Map middleware strings to actual middleware functions
    for (const mwName of route.middlewares) {
      if (mwName === "requireAuth") {
        middlewares.push(auth);
      } else if (mwName === "requireMarketingAccess") {
        middlewares.push(marketingAccess);
      } else if (mwName.startsWith("checkOwnership:")) {
        const entityType = mwName.split(":")[1];
        middlewares.push(checkOwnership(entityType));
      }
    }

    // Register the route with the Express app
    (app as any)[route.method](route.path, ...middlewares, route.handler);
  }

  console.log(
    `✅ Marketing routes registry registration complete: ${marketingRoutes.length} routes`
  );

  // Development route verification log
  if (process.env.NODE_ENV === "development") {
    console.log("📊 Marketing routes registered:");
    marketingRoutes.forEach((route) => {
      console.log(
        `  ${route.method.toUpperCase()} ${route.path} [${
          route.middlewares.length
        } middleware]`
      );
    });
  }

  // Marketing route count verification - exactly 42 routes as specified (added photo upload)
  const EXPECTED_MARKETING_ROUTE_COUNT = 42;
  if (marketingRoutes.length !== EXPECTED_MARKETING_ROUTE_COUNT) {
    console.warn(
      `⚠️  Marketing route count mismatch: Expected ${EXPECTED_MARKETING_ROUTE_COUNT}, found ${marketingRoutes.length}`
    );
  }
}
