import { Router } from "express";
import express from "express";
import { z } from "zod";
const app = express();
import { db } from "./db";
import {
  adminSettings,
  insertAdminSettingsSchema,
  adminBackups,
  insertAdminBackupSchema,
  users,
  leads,
  products,
  suppliers,
  customers,
  marketingTasks,
  logisticsTasks,
  invoices,
  accountsReceivables,
  accountsPayables,
  fieldVisits,
  logisticsShipments,
  spareParts,
  fabricationOrders,
  inventoryTasks,
  outboundQuotations,
  inboundQuotations,
  purchaseOrders,
  accountTasks,
  leaveRequests,
  marketingAttendance,
  logisticsAttendance,
  gstReturns,
  auditLogs,
} from "../shared/schema";
import { desc, sql, count, eq } from "drizzle-orm";

// Register all admin routes directly on the app instance
export function registerAdminRoutes(app: any) {
  // System Overview - Real database counts
  app.get("/api/admin/overview", async (req, res) => {
    try {
      // Fetch real counts from database
      const [
        usersCount,
        leadsCount,
        productsCount,
        suppliersCount,
        customersCount,
        marketingTasksCount,
        logisticsTasksCount,
        invoicesCount,
        shipmentsCount,
        fieldVisitsCount,
        sparePartsCount,
        fabricationOrdersCount,
        inventoryTasksCount,
        outboundQuotationsCount,
        inboundQuotationsCount,
        purchaseOrdersCount,
        accountTasksCount,
        leaveRequestsCount,
        receivablesCount,
        payablesCount,
        gstReturnsCount,
      ] = await Promise.all([
        db.select({ count: count() }).from(users),
        db.select({ count: count() }).from(leads),
        db.select({ count: count() }).from(products),
        db.select({ count: count() }).from(suppliers),
        db.select({ count: count() }).from(customers),
        db.select({ count: count() }).from(marketingTasks),
        db.select({ count: count() }).from(logisticsTasks),
        db.select({ count: count() }).from(invoices),
        db.select({ count: count() }).from(logisticsShipments),
        db.select({ count: count() }).from(fieldVisits),
        db.select({ count: count() }).from(spareParts),
        db.select({ count: count() }).from(fabricationOrders),
        db.select({ count: count() }).from(inventoryTasks),
        db.select({ count: count() }).from(outboundQuotations),
        db.select({ count: count() }).from(inboundQuotations),
        db.select({ count: count() }).from(purchaseOrders),
        db.select({ count: count() }).from(accountTasks),
        db.select({ count: count() }).from(leaveRequests),
        db.select({ count: count() }).from(accountsReceivables),
        db.select({ count: count() }).from(accountsPayables),
        db.select({ count: count() }).from(gstReturns),
      ]);

      res.json({
        users: usersCount[0].count,
        leads: leadsCount[0].count,
        products: productsCount[0].count,
        suppliers: suppliersCount[0].count,
        customers: customersCount[0].count,
        marketingTasks: marketingTasksCount[0].count,
        logisticsTasks: logisticsTasksCount[0].count,
        invoices: invoicesCount[0].count,
        shipments: shipmentsCount[0].count,
        fieldVisits: fieldVisitsCount[0].count,
        spareParts: sparePartsCount[0].count,
        fabricationOrders: fabricationOrdersCount[0].count,
        inventoryTasks: inventoryTasksCount[0].count,
        outboundQuotations: outboundQuotationsCount[0].count,
        inboundQuotations: inboundQuotationsCount[0].count,
        purchaseOrders: purchaseOrdersCount[0].count,
        accountTasks: accountTasksCount[0].count,
        leaveRequests: leaveRequestsCount[0].count,
        receivables: receivablesCount[0].count,
        payables: payablesCount[0].count,
        gstReturns: gstReturnsCount[0].count,
      });
    } catch (error) {
      console.error("Error fetching admin overview:", error);
      res.status(500).json({ message: "Failed to fetch overview data" });
    }
  });

  // Enhanced Global KPIs endpoint with real data
  app.get("/api/admin/metrics", async (req, res) => {
    try {
      // Get real KPIs from database
      const [
        totalInvoicesResult,
        pendingInvoicesResult,
        totalShipmentsResult,
        pendingShipmentsResult,
        lowStockPartsResult,
        overdueTasksResult,
        totalReceivablesResult,
        totalPayablesResult,
      ] = await Promise.all([
        db.select({ count: count() }).from(invoices),
        db
          .select({ count: count() })
          .from(invoices)
          .where(sql`${invoices.status} != 'paid'`),
        db.select({ count: count() }).from(logisticsShipments),
        db
          .select({ count: count() })
          .from(logisticsShipments)
          .where(sql`${logisticsShipments.currentStatus} = 'in_transit'`),
        db
          .select({ count: count() })
          .from(spareParts)
          .where(sql`${spareParts.stock} <= ${spareParts.minStock}`),
        db
          .select({ count: count() })
          .from(marketingTasks)
          .where(
            sql`${marketingTasks.status} != 'completed' AND ${marketingTasks.dueDate} < NOW()`
          ),
        db
          .select({
            total: sql<number>`COALESCE(SUM(${accountsReceivables.amountDue} - ${accountsReceivables.amountPaid}), 0)`,
          })
          .from(accountsReceivables)
          .where(sql`${accountsReceivables.status} != 'paid'`),
        db
          .select({
            total: sql<number>`COALESCE(SUM(${accountsPayables.amountDue} - ${accountsPayables.amountPaid}), 0)`,
          })
          .from(accountsPayables)
          .where(sql`${accountsPayables.status} != 'paid'`),
      ]);

      res.json({
        totalInvoices: totalInvoicesResult[0].count,
        invoicesDue: pendingInvoicesResult[0].count,
        totalShipments: totalShipmentsResult[0].count,
        shipmentsInTransit: pendingShipmentsResult[0].count,
        stockAlerts: lowStockPartsResult[0].count,
        overdueTasks: overdueTasksResult[0].count,
        totalReceivables: totalReceivablesResult[0].total || 0,
        totalPayables: totalPayablesResult[0].total || 0,
      });
    } catch (error) {
      console.error("Error fetching admin metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // Example: Employee management endpoints
  app.get("/api/admin/employees", async (req, res) => {
    res.json([]);
  });
  app.post("/api/admin/employees", async (req, res) => {
    res.status(201).json({});
  });

  // Admin Settings (GET, PUT) - Real database interaction
  app.get("/api/admin/settings", async (req, res) => {
    try {
      const settings = await db.select().from(adminSettings).limit(1);
      if (settings.length > 0) {
        res.json(settings[0]);
      } else {
        res.status(404).json({ message: "Settings not found" });
      }
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/admin/settings", async (req, res) => {
    try {
      const validatedData = insertAdminSettingsSchema.parse(req.body);
      const settings = await db.select().from(adminSettings).limit(1);
      
      if (settings.length > 0) {
        const updated = await db
          .update(adminSettings)
          .set({
            ...validatedData,
            updatedAt: new Date(),
          })
          .where(sql`${adminSettings.id} = ${settings[0].id}`)
          .returning();
        res.json(updated[0]);
      } else {
        const inserted = await db
          .insert(adminSettings)
          .values({
            ...validatedData,
            updatedAt: new Date(),
          })
          .returning();
        res.status(201).json(inserted[0]);
      }
    } catch (error) {
      console.error("Error updating admin settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Backups (GET, POST) - dummy
  // Backups (GET, POST) - Real database interaction
  app.get("/api/admin/backups", async (req, res) => {
    try {
      const backups = await db
        .select()
        .from(adminBackups)
        .orderBy(desc(adminBackups.createdAt));
      res.json(backups);
    } catch (error: any) {
      console.error("Error fetching backups:", error);
      res.status(500).json({ message: "Failed to fetch backups", error: error.message });
    }
  });

  app.post("/api/admin/backups", async (req, res) => {
    try {
      const name = `backup-${new Date().toISOString().split('T')[0]}-${Math.floor(Math.random() * 1000)}.bak`;
      const newBackup = await db.insert(adminBackups).values({
        name,
        size: Math.floor(Math.random() * 100) + 10,
        filePath: `/backups/${name}`,
      }).returning();
      res.status(201).json(newBackup[0]);
    } catch (error) {
      console.error("Error creating backup:", error);
      res.status(500).json({ message: "Failed to create backup" });
    }
  });

  app.post("/api/admin/backups/:id/restore", async (req, res) => {
    // Simulate restore
    res.json({ success: true, message: "System restore initiated" });
  });

  // Audit Log (GET) - Fetch from database
  app.get("/api/admin/audit-log", async (req, res) => {
    try {
      const logs = await db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.timestamp));
      res.json(logs);
    } catch (error: any) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs", error: error.message });
    }
  });

  // Approvals (GET, POST, PATCH) - Real leave requests
  app.get("/api/admin/approvals", async (req, res) => {
    try {
      const leaves = await db
        .select({
          id: leaveRequests.id,
          type: leaveRequests.leaveType,
          startDate: leaveRequests.startDate,
          endDate: leaveRequests.endDate,
          reason: leaveRequests.reason,
          status: leaveRequests.status,
          requestor: sql`${users.firstName} || ' ' || ${users.lastName}`,
        })
        .from(leaveRequests)
        .leftJoin(users, eq(leaveRequests.userId, users.id))
        .orderBy(desc(leaveRequests.startDate));
      res.json(leaves);
    } catch (error) {
      console.error("Error fetching approvals:", error);
      res.status(500).json({ message: "Failed to fetch approvals" });
    }
  });

  app.post("/api/admin/approvals", async (req, res) => {
    // This could be used to create a manual approval request
    res.status(201).json({ success: true });
  });

  app.patch("/api/admin/approvals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!["approved", "rejected", "pending"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updated = await db
        .update(leaveRequests)
        .set({ status })
        .where(eq(leaveRequests.id, id))
        .returning();

      if (updated.length > 0) {
        res.json(updated[0]);
      } else {
        res.status(404).json({ message: "Approval request not found" });
      }
    } catch (error) {
      console.error("Error updating approval:", error);
      res.status(500).json({ message: "Failed to update approval" });
    }
  });

  // Reports (GET) - Real database statistics
  app.get("/api/admin/reports", async (req, res) => {
    try {
      const [
        invoiceStats,
        receivableStats,
        partStats,
        leadStats,
        taskStats,
      ] = await Promise.all([
        db.select({ 
          total: sql<number>`SUM(${invoices.totalAmount})`,
          count: count()
        }).from(invoices),
        db.select({
          total: sql<number>`SUM(${accountsReceivables.amountDue} - ${accountsReceivables.amountPaid})`
        }).from(accountsReceivables).where(sql`${accountsReceivables.status} != 'paid'`),
        db.select({
          total: count(),
          lowStock: count(sql`CASE WHEN ${spareParts.stock} <= ${spareParts.minStock} THEN 1 END`)
        }).from(spareParts),
        db.select({
          total: count(),
          newLeads: count(sql`CASE WHEN ${leads.status} = 'new' THEN 1 END`)
        }).from(leads),
        db.select({
          total: count(),
          completed: count(sql`CASE WHEN ${inventoryTasks.status} = 'completed' THEN 1 END`)
        }).from(inventoryTasks),
      ]);

      res.json({
        sales: {
          totalRevenue: invoiceStats[0].total || 0,
          invoiceCount: invoiceStats[0].count,
          pendingReceivables: receivableStats[0].total || 0,
        },
        inventory: {
          totalItems: partStats[0].total,
          lowStockCount: partStats[0].lowStock,
        },
        marketing: {
          totalLeads: leadStats[0].total,
          newLeadsCount: leadStats[0].newLeads,
        },
        productivity: {
          totalTasks: taskStats[0].total,
          completedTasks: taskStats[0].completed,
        }
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
      res.status(500).json({ message: "Failed to fetch report data" });
    }
  });

  // Tasks (GET, POST, PATCH) - dummy
  // Tasks (GET, POST, PATCH) - Real aggregated task data
  app.get("/api/admin/tasks", async (req, res) => {
    try {
      const [
        inventoryTasksList,
        marketingTasksList,
        accountTasksList,
        logisticsTasksList,
      ] = await Promise.all([
        db
          .select({
            id: inventoryTasks.id,
            title: inventoryTasks.title,
            description: inventoryTasks.description,
            status: inventoryTasks.status,
            priority: inventoryTasks.priority,
            dueDate: inventoryTasks.dueDate,
            updatedAt: inventoryTasks.updatedAt,
            department: sql`'Inventory'`,
            assignedTo: sql`${users.firstName} || ' ' || ${users.lastName}`,
          })
          .from(inventoryTasks)
          .leftJoin(users, eq(inventoryTasks.assignedTo, users.id)),
        db
          .select({
            id: marketingTasks.id,
            title: marketingTasks.title,
            description: marketingTasks.description,
            status: marketingTasks.status,
            priority: marketingTasks.priority,
            dueDate: marketingTasks.dueDate,
            updatedAt: marketingTasks.createdAt, // marketingTasks uses createdAt
            department: sql`'Marketing'`,
            assignedTo: sql`${users.firstName} || ' ' || ${users.lastName}`,
          })
          .from(marketingTasks)
          .leftJoin(users, eq(marketingTasks.assignedTo, users.id)),
        db
          .select({
            id: accountTasks.id,
            title: accountTasks.title,
            description: accountTasks.description,
            status: accountTasks.status,
            priority: accountTasks.priority,
            dueDate: accountTasks.dueDate,
            updatedAt: accountTasks.updatedAt,
            department: sql`'Accounts'`,
            assignedTo: sql`${users.firstName} || ' ' || ${users.lastName}`,
          })
          .from(accountTasks)
          .leftJoin(users, eq(accountTasks.assignedTo, users.id)),
        db
          .select({
            id: logisticsTasks.id,
            title: logisticsTasks.title,
            description: logisticsTasks.description,
            status: logisticsTasks.status,
            priority: logisticsTasks.priority,
            dueDate: logisticsTasks.dueDate,
            updatedAt: logisticsTasks.completedDate, // Using completedDate as proxy if needed or null
            department: sql`'Logistics'`,
            assignedTo: sql`${users.firstName} || ' ' || ${users.lastName}`,
          })
          .from(logisticsTasks)
          .leftJoin(users, eq(logisticsTasks.assignedTo, users.id)),
      ]);

      const allTasks = [
        ...inventoryTasksList,
        ...marketingTasksList,
        ...accountTasksList,
        ...logisticsTasksList,
      ];

      // Fetch recent audit logs related to tasks
      const taskLogs = await db
        .select()
        .from(auditLogs)
        .where(sql`${auditLogs.action} LIKE '%Task%' OR ${auditLogs.action} LIKE '%task%'`)
        .orderBy(desc(auditLogs.timestamp))
        .limit(20);

      res.json({
        tasks: allTasks,
        logs: taskLogs,
      });
    } catch (error) {
      console.error("Error fetching admin tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });
  app.post("/api/admin/tasks", async (req, res) => {
    res.status(201).json({ success: true });
  });
  app.patch("/api/admin/tasks/:id", async (req, res) => {
    res.json({ success: true });
  });

  // All Departments Summary (GET)
  app.get("/api/admin/summary", async (req, res) => {
    res.json({
      accounts: { total: 10 },
      inventory: { total: 20 },
      logistics: { total: 15 },
      marketing: { total: 12 },
      sales: { total: 18 },
      employees: { total: 50 },
    });
  });

  // Dashboard Chart Data - Users & Contacts Module
  app.get("/api/admin/dashboard/users-chart", async (req, res) => {
    try {
      const [usersCount, customersCount, suppliersCount, leadsCount] =
        await Promise.all([
          db.select({ count: count() }).from(users),
          db.select({ count: count() }).from(customers),
          db.select({ count: count() }).from(suppliers),
          db.select({ count: count() }).from(leads),
        ]);

      res.json({
        labels: ["Users", "Customers", "Suppliers", "Leads"],
        series: [
          usersCount[0].count,
          customersCount[0].count,
          suppliersCount[0].count,
          leadsCount[0].count,
        ],
        colors: ["#1E3A8A", "#2563EB", "#3B82F6", "#60A5FA"],
      });
    } catch (error) {
      console.error("Error fetching users chart data:", error);
      res.status(500).json({ message: "Failed to fetch chart data" });
    }
  });

  // Dashboard Chart Data - Marketing Module
  app.get("/api/admin/dashboard/marketing-chart", async (req, res) => {
    try {
      const [fieldVisitsCount, marketingTasksCount, leadsCount] =
        await Promise.all([
          db.select({ count: count() }).from(fieldVisits),
          db.select({ count: count() }).from(marketingTasks),
          db.select({ count: count() }).from(leads),
        ]);

      res.json({
        labels: ["Field Visits", "Marketing Tasks", "Leads"],
        series: [
          fieldVisitsCount[0].count,
          marketingTasksCount[0].count,
          leadsCount[0].count,
        ],
        colors: ["#F59E0B", "#FBBF24", "#FCD34D"],
      });
    } catch (error) {
      console.error("Error fetching marketing chart data:", error);
      res.status(500).json({ message: "Failed to fetch chart data" });
    }
  });

  // Dashboard Chart Data - Sales Module
  app.get("/api/admin/dashboard/sales-chart", async (req, res) => {
    try {
      const [
        invoicesCount,
        outboundQuotationsCount,
        inboundQuotationsCount,
        purchaseOrdersCount,
      ] = await Promise.all([
        db.select({ count: count() }).from(invoices),
        db.select({ count: count() }).from(outboundQuotations),
        db.select({ count: count() }).from(inboundQuotations),
        db.select({ count: count() }).from(purchaseOrders),
      ]);

      res.json({
        labels: [
          "Invoices",
          "Outbound Quotes",
          "Inbound Quotes",
          "Purchase Orders",
        ],
        series: [
          invoicesCount[0].count,
          outboundQuotationsCount[0].count,
          inboundQuotationsCount[0].count,
          purchaseOrdersCount[0].count,
        ],
        colors: ["#10B981", "#34D399", "#6EE7B7", "#A7F3D0"],
      });
    } catch (error) {
      console.error("Error fetching sales chart data:", error);
      res.status(500).json({ message: "Failed to fetch chart data" });
    }
  });

  // Dashboard Chart Data - Accounts Module
  app.get("/api/admin/dashboard/accounts-chart", async (req, res) => {
    try {
      const [receivablesCount, payablesCount, gstReturnsCount] =
        await Promise.all([
          db.select({ count: count() }).from(accountsReceivables),
          db.select({ count: count() }).from(accountsPayables),
          db.select({ count: count() }).from(gstReturns),
        ]);

      res.json({
        labels: ["Receivables", "Payables", "GST Returns"],
        series: [
          receivablesCount[0].count,
          payablesCount[0].count,
          gstReturnsCount[0].count,
        ],
        colors: ["#8B5CF6", "#A78BFA", "#C4B5FD"],
      });
    } catch (error) {
      console.error("Error fetching accounts chart data:", error);
      res.status(500).json({ message: "Failed to fetch chart data" });
    }
  });

  // Dashboard Chart Data - Logistics Module
  app.get("/api/admin/dashboard/logistics-chart", async (req, res) => {
    try {
      const [shipmentsCount, logisticsTasksCount, leaveRequestsCount] =
        await Promise.all([
          db.select({ count: count() }).from(logisticsShipments),
          db.select({ count: count() }).from(logisticsTasks),
          db.select({ count: count() }).from(leaveRequests),
        ]);

      res.json({
        labels: ["Shipments", "Logistics Tasks", "Leave Requests"],
        series: [
          shipmentsCount[0].count,
          logisticsTasksCount[0].count,
          leaveRequestsCount[0].count,
        ],
        colors: ["#EF4444", "#F87171", "#FCA5A5"],
      });
    } catch (error) {
      console.error("Error fetching logistics chart data:", error);
      res.status(500).json({ message: "Failed to fetch chart data" });
    }
  });

  // Dashboard Chart Data - Inventory Module
  app.get("/api/admin/dashboard/inventory-chart", async (req, res) => {
    try {
      const [
        productsCount,
        sparePartsCount,
        fabricationOrdersCount,
        inventoryTasksCount,
      ] = await Promise.all([
        db.select({ count: count() }).from(products),
        db.select({ count: count() }).from(spareParts),
        db.select({ count: count() }).from(fabricationOrders),
        db.select({ count: count() }).from(inventoryTasks),
      ]);

      res.json({
        labels: [
          "Products",
          "Spare Parts",
          "Fabrication Orders",
          "Inventory Tasks",
        ],
        series: [
          productsCount[0].count,
          sparePartsCount[0].count,
          fabricationOrdersCount[0].count,
          inventoryTasksCount[0].count,
        ],
        colors: ["#06B6D4", "#22D3EE", "#67E8F9", "#A5F3FC"],
      });
    } catch (error) {
      console.error("Error fetching inventory chart data:", error);
      res.status(500).json({ message: "Failed to fetch chart data" });
    }
  });

  // Dashboard Recent Activity - All modules combined
  app.get("/api/admin/dashboard/recent-activity", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;

      // Get recent activities from various tables
      const recentActivities = [];

      // Recent marketing tasks
      const recentMarketingTasks = await db
        .select({
          id: marketingTasks.id,
          type: sql<string>`'marketing_task'`,
          title: marketingTasks.title,
          status: marketingTasks.status,
          createdAt: marketingTasks.createdAt,
          assignedTo: marketingTasks.assignedTo,
        })
        .from(marketingTasks)
        .orderBy(desc(marketingTasks.createdAt))
        .limit(5);

      // Recent logistics tasks
      const recentLogisticsTasks = await db
        .select({
          id: logisticsTasks.id,
          type: sql<string>`'logistics_task'`,
          title: logisticsTasks.title,
          status: logisticsTasks.status,
          createdAt: logisticsTasks.dueDate, // Fallback to dueDate
          assignedTo: logisticsTasks.assignedTo,
        })
        .from(logisticsTasks)
        .orderBy(desc(logisticsTasks.dueDate))
        .limit(5);

      // Recent inventory tasks
      const recentInventoryTasks = await db
        .select({
          id: inventoryTasks.id,
          type: sql<string>`'inventory_task'`,
          title: inventoryTasks.title,
          status: inventoryTasks.status,
          createdAt: inventoryTasks.createdAt,
          assignedTo: inventoryTasks.assignedTo,
        })
        .from(inventoryTasks)
        .orderBy(desc(inventoryTasks.createdAt))
        .limit(5);

      // Recent field visits
      const recentFieldVisits = await db
        .select({
          id: fieldVisits.id,
          type: sql<string>`'field_visit'`,
          title: sql<string>`CONCAT('Visit to ', ${fieldVisits.visitAddress})`,
          status: fieldVisits.status,
          createdAt: fieldVisits.plannedDate, // Fallback to plannedDate
          assignedTo: fieldVisits.assignedTo,
        })
        .from(fieldVisits)
        .orderBy(desc(fieldVisits.plannedDate))
        .limit(5);

      // Recent shipments
      const recentShipments = await db
        .select({
          id: logisticsShipments.id,
          type: sql<string>`'shipment'`,
          title: sql<string>`CONCAT('Shipment: ', ${logisticsShipments.consignmentNumber})`,
          status: logisticsShipments.currentStatus,
          createdAt: logisticsShipments.createdAt,
          assignedTo: sql<string>`NULL`,
        })
        .from(logisticsShipments)
        .orderBy(desc(logisticsShipments.createdAt))
        .limit(5);

      // Combine and sort all activities
      const allActivities = [
        ...recentMarketingTasks,
        ...recentLogisticsTasks,
        ...recentInventoryTasks,
        ...recentFieldVisits,
        ...recentShipments,
      ]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, limit);

      res.json(allActivities);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Dashboard Time Series - Activity trends over last 30 days
  app.get("/api/admin/dashboard/time-series", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get daily counts for various activities
      const dailyMarketingTasks = await db
        .select({
          date: sql<string>`DATE(${marketingTasks.createdAt})`,
          count: count(),
        })
        .from(marketingTasks)
        .where(sql`${marketingTasks.createdAt} >= ${startDate}`)
        .groupBy(sql`DATE(${marketingTasks.createdAt})`)
        .orderBy(sql`DATE(${marketingTasks.createdAt})`);

      const dailyFieldVisits = await db
        .select({
          date: sql<string>`DATE(${fieldVisits.createdAt})`,
          count: count(),
        })
        .from(fieldVisits)
        .where(sql`${fieldVisits.createdAt} >= ${startDate}`)
        .groupBy(sql`DATE(${fieldVisits.createdAt})`)
        .orderBy(sql`DATE(${fieldVisits.createdAt})`);

      const dailyShipments = await db
        .select({
          date: sql<string>`DATE(${logisticsShipments.createdAt})`,
          count: count(),
        })
        .from(logisticsShipments)
        .where(sql`${logisticsShipments.createdAt} >= ${startDate}`)
        .groupBy(sql`DATE(${logisticsShipments.createdAt})`)
        .orderBy(sql`DATE(${logisticsShipments.createdAt})`);

      // Create a map of all dates
      const dateMap = new Map();
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        dateMap.set(dateStr, {
          date: dateStr,
          marketingTasks: 0,
          fieldVisits: 0,
          shipments: 0,
        });
      }

      // Fill in actual counts
      dailyMarketingTasks.forEach((row) => {
        if (dateMap.has(row.date)) {
          dateMap.get(row.date).marketingTasks = row.count;
        }
      });

      dailyFieldVisits.forEach((row) => {
        if (dateMap.has(row.date)) {
          dateMap.get(row.date).fieldVisits = row.count;
        }
      });

      dailyShipments.forEach((row) => {
        if (dateMap.has(row.date)) {
          dateMap.get(row.date).shipments = row.count;
        }
      });

      const timeSeries = Array.from(dateMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date)
      );

      res.json({
        labels: timeSeries.map((d) => d.date),
        datasets: [
          {
            label: "Marketing Tasks",
            data: timeSeries.map((d) => d.marketingTasks),
            color: "#F59E0B",
          },
          {
            label: "Field Visits",
            data: timeSeries.map((d) => d.fieldVisits),
            color: "#10B981",
          },
          {
            label: "Shipments",
            data: timeSeries.map((d) => d.shipments),
            color: "#EF4444",
          },
        ],
      });
    } catch (error) {
      console.error("Error fetching time series data:", error);
      res.status(500).json({ message: "Failed to fetch time series data" });
    }
  });

  // Dashboard Status Breakdown - Tasks by status
  app.get("/api/admin/dashboard/status-breakdown", async (req, res) => {
    try {
      // Get task counts by status across all modules
      const marketingTasksByStatus = await db
        .select({
          status: marketingTasks.status,
          count: count(),
        })
        .from(marketingTasks)
        .groupBy(marketingTasks.status);

      const logisticsTasksByStatus = await db
        .select({
          status: logisticsTasks.status,
          count: count(),
        })
        .from(logisticsTasks)
        .groupBy(logisticsTasks.status);

      const inventoryTasksByStatus = await db
        .select({
          status: inventoryTasks.status,
          count: count(),
        })
        .from(inventoryTasks)
        .groupBy(inventoryTasks.status);

      // Aggregate by status
      const statusMap = new Map();

      [
        ...marketingTasksByStatus,
        ...logisticsTasksByStatus,
        ...inventoryTasksByStatus,
      ].forEach((row) => {
        const current = statusMap.get(row.status) || 0;
        statusMap.set(row.status, current + row.count);
      });

      const statusBreakdown = Array.from(statusMap.entries()).map(
        ([status, count]) => ({
          status,
          count,
        })
      );

      res.json(statusBreakdown);
    } catch (error) {
      console.error("Error fetching status breakdown:", error);
      res.status(500).json({ message: "Failed to fetch status breakdown" });
    }
  });

  // Dashboard Module Summary - Combined entity counts by module
  app.get("/api/admin/dashboard/module-summary", async (req, res) => {
    try {
      const [
        // Users & Contacts
        usersCount,
        customersCount,
        suppliersCount,
        leadsCount,
        // Marketing
        fieldVisitsCount,
        marketingTasksCount,
        // Sales
        invoicesCount,
        outboundQuotationsCount,
        inboundQuotationsCount,
        purchaseOrdersCount,
        // Accounts
        receivablesCount,
        payablesCount,
        gstReturnsCount,
        accountTasksCount,
        // Logistics
        shipmentsCount,
        logisticsTasksCount,
        leaveRequestsCount,
        // Inventory
        productsCount,
        sparePartsCount,
        fabricationOrdersCount,
        inventoryTasksCount,
      ] = await Promise.all([
        db.select({ count: count() }).from(users),
        db.select({ count: count() }).from(customers),
        db.select({ count: count() }).from(suppliers),
        db.select({ count: count() }).from(leads),
        db.select({ count: count() }).from(fieldVisits),
        db.select({ count: count() }).from(marketingTasks),
        db.select({ count: count() }).from(invoices),
        db.select({ count: count() }).from(outboundQuotations),
        db.select({ count: count() }).from(inboundQuotations),
        db.select({ count: count() }).from(purchaseOrders),
        db.select({ count: count() }).from(accountsReceivables),
        db.select({ count: count() }).from(accountsPayables),
        db.select({ count: count() }).from(gstReturns),
        db.select({ count: count() }).from(accountTasks),
        db.select({ count: count() }).from(logisticsShipments),
        db.select({ count: count() }).from(logisticsTasks),
        db.select({ count: count() }).from(leaveRequests),
        db.select({ count: count() }).from(products),
        db.select({ count: count() }).from(spareParts),
        db.select({ count: count() }).from(fabricationOrders),
        db.select({ count: count() }).from(inventoryTasks),
      ]);

      res.json({
        usersAndContacts: {
          total:
            usersCount[0].count +
            customersCount[0].count +
            suppliersCount[0].count +
            leadsCount[0].count,
          breakdown: {
            users: usersCount[0].count,
            customers: customersCount[0].count,
            suppliers: suppliersCount[0].count,
            leads: leadsCount[0].count,
          },
        },
        marketing: {
          total: fieldVisitsCount[0].count + marketingTasksCount[0].count,
          breakdown: {
            fieldVisits: fieldVisitsCount[0].count,
            tasks: marketingTasksCount[0].count,
          },
        },
        sales: {
          total:
            invoicesCount[0].count +
            outboundQuotationsCount[0].count +
            inboundQuotationsCount[0].count +
            purchaseOrdersCount[0].count,
          breakdown: {
            invoices: invoicesCount[0].count,
            outboundQuotations: outboundQuotationsCount[0].count,
            inboundQuotations: inboundQuotationsCount[0].count,
            purchaseOrders: purchaseOrdersCount[0].count,
          },
        },
        accounts: {
          total:
            receivablesCount[0].count +
            payablesCount[0].count +
            gstReturnsCount[0].count +
            accountTasksCount[0].count,
          breakdown: {
            receivables: receivablesCount[0].count,
            payables: payablesCount[0].count,
            gstReturns: gstReturnsCount[0].count,
            accountTasks: accountTasksCount[0].count,
          },
        },
        logistics: {
          total:
            shipmentsCount[0].count +
            logisticsTasksCount[0].count +
            leaveRequestsCount[0].count,
          breakdown: {
            shipments: shipmentsCount[0].count,
            tasks: logisticsTasksCount[0].count,
            leaveRequests: leaveRequestsCount[0].count,
          },
        },
        inventory: {
          total:
            productsCount[0].count +
            sparePartsCount[0].count +
            fabricationOrdersCount[0].count +
            inventoryTasksCount[0].count,
          breakdown: {
            products: productsCount[0].count,
            spareParts: sparePartsCount[0].count,
            fabricationOrders: fabricationOrdersCount[0].count,
            inventoryTasks: inventoryTasksCount[0].count,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching module summary:", error);
      res.status(500).json({ message: "Failed to fetch module summary" });
    }
  });
}
