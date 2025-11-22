import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { db } from "./db";
import { storage } from "./storage";
import {
  accountsReceivables,
  customers,
  invoices,
  accountsPayables,
  suppliers,
  inboundQuotations,
  gstReturns,
  accountTasks,
  insertAccountTaskSchema,
  accountReports,
  users,
  insertCustomerSchema,
  attendance,
} from "../shared/schema";
import { eq, sql, gte, lt } from "drizzle-orm";
import {
  insertAccountsReceivableSchema,
  insertAccountsPayableSchema,
  insertGstReturnSchema,
  insertAccountReportSchema,
} from "../shared/schema";

interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string; username: string };
}

// In-memory storage for GST returns (fallback when database table doesn't exist)
const inMemoryGstReturns: any[] = [];

// Simple requireAuth middleware for development (bypassed in dev mode)
const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // In development mode, authentication is bypassed
  if (process.env.NODE_ENV === "development") {
    req.user = {
      id: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID for dev user
      role: "admin",
      username: "dev_admin",
    };
    next();
    return;
  }
  // For production, this would need proper JWT validation
  next();
};

export function registerAccountsRoutes(app: Express) {
  // Accounts dashboard metrics
  app.get("/api/accounts/dashboard-metrics", requireAuth, async (_req, res) => {
    try {
      // Get total outstanding receivables
      const receivablesResult = await db
        .select({
          total: sql<number>`SUM(${accountsReceivables.amountDue} - ${accountsReceivables.amountPaid})`,
        })
        .from(accountsReceivables)
        .where(sql`${accountsReceivables.status} != 'paid'`);

      const totalReceivables = receivablesResult[0]?.total || 0;

      // Get total outstanding payables
      let totalPayables = 0;
      try {
        const payablesResult = await db
          .select({
            total: sql<number>`SUM(${accountsPayables.amountDue} - ${accountsPayables.amountPaid})`,
          })
          .from(accountsPayables)
          .where(sql`${accountsPayables.status} != 'paid'`);

        totalPayables = payablesResult[0]?.total || 0;
      } catch (error) {
        console.error("Error fetching payables total:", error);
        totalPayables = 0;
      }

      // For cash flow, we could calculate based on recent transactions
      // For now, return 0 as placeholder
      const cashFlow = { inflow: 0, outflow: 0 };

      res.json({
        totalReceivables,
        totalPayables,
        cashFlow,
      });
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Generate financial reports
  app.post("/api/reports", requireAuth, async (req, res) => {
    try {
      const { reportType, dateRange, startDate, endDate } = req.body;

      if (!reportType) {
        return res.status(400).json({ message: "Report type is required" });
      }

      let reportData: any = {};
      let title = "";

      // Determine date filter
      const getDateFilter = (tableName: string) => {
        if (dateRange === "custom" && startDate && endDate) {
          return `AND ${tableName}."createdAt" >= '${startDate}' AND ${tableName}."createdAt" <= '${endDate}'`;
        } else if (dateRange === "this_month") {
          return `AND EXTRACT(MONTH FROM ${tableName}."createdAt") = EXTRACT(MONTH FROM NOW()) AND EXTRACT(YEAR FROM ${tableName}."createdAt") = EXTRACT(YEAR FROM NOW())`;
        } else if (dateRange === "last_month") {
          return `AND EXTRACT(MONTH FROM ${tableName}."createdAt") = EXTRACT(MONTH FROM NOW() - INTERVAL '1 month') AND EXTRACT(YEAR FROM ${tableName}."createdAt") = EXTRACT(YEAR FROM NOW() - INTERVAL '1 month')`;
        }
        return "";
      };

      if (
        reportType === "receivables" ||
        reportType === "Accounts Receivable"
      ) {
        title = "Accounts Receivable Report";

        const receivables = await db
          .select({
            id: accountsReceivables.id,
            invoiceId: accountsReceivables.invoiceId,
            customerId: accountsReceivables.customerId,
            amountDue: accountsReceivables.amountDue,
            amountPaid: accountsReceivables.amountPaid,
            dueDate: accountsReceivables.dueDate,
            status: accountsReceivables.status,
            createdAt: accountsReceivables.createdAt,
            customer: {
              id: customers.id,
              name: customers.name,
            },
          })
          .from(accountsReceivables)
          .leftJoin(customers, eq(accountsReceivables.customerId, customers.id))
          .where(sql`1=1 ${sql.raw(getDateFilter("accounts_receivables"))}`)
          .orderBy(accountsReceivables.createdAt);

        const totalAmount = receivables.reduce(
          (sum, r) => sum + parseFloat(r.amountDue),
          0
        );
        const totalPaid = receivables.reduce(
          (sum, r) => sum + parseFloat(r.amountPaid || 0),
          0
        );
        const totalOutstanding = totalAmount - totalPaid;

        reportData = {
          receivables,
          summary: {
            totalAmount,
            totalPaid,
            totalOutstanding,
            recordCount: receivables.length,
          },
        };
      } else if (
        reportType === "daily_collections" ||
        reportType === "Daily Collections"
      ) {
        title = "Daily Collections Report";

        // Get daily collections aggregated by date
        const dailyCollections = await db
          .select({
            date: sql<string>`${accountsReceivables.updatedAt}::date`,
            totalCollected: sql<number>`SUM(${accountsReceivables.amountPaid})`,
            transactionCount: sql<number>`COUNT(*)`,
          })
          .from(accountsReceivables)
          .where(
            sql`${accountsReceivables.amountPaid} > 0 AND ${sql.raw(
              getDateFilter("accounts_receivables")
            )}`
          )
          .groupBy(sql`${accountsReceivables.updatedAt}::date`)
          .orderBy(sql`${accountsReceivables.updatedAt}::date`);

        const totalCollected = dailyCollections.reduce(
          (sum, day) => sum + parseFloat(day.totalCollected.toString()),
          0
        );
        const totalTransactions = dailyCollections.reduce(
          (sum, day) => sum + day.transactionCount,
          0
        );

        reportData = {
          dailyCollections: dailyCollections.map((day) => ({
            date: day.date,
            totalCollected: parseFloat(day.totalCollected.toString()),
            transactionCount: day.transactionCount,
          })),
          summary: {
            totalCollected,
            totalTransactions,
            daysWithCollections: dailyCollections.length,
            averageDaily:
              dailyCollections.length > 0
                ? totalCollected / dailyCollections.length
                : 0,
          },
        };
      } else if (
        reportType === "payables" ||
        reportType === "Accounts Payable"
      ) {
        title = "Accounts Payable Report";

        try {
          const payables = await db
            .select({
              id: accountsPayables.id,
              poId: accountsPayables.poId,
              supplierId: accountsPayables.supplierId,
              amountDue: accountsPayables.amountDue,
              amountPaid: accountsPayables.amountPaid,
              dueDate: accountsPayables.dueDate,
              status: accountsPayables.status,
              createdAt: accountsPayables.createdAt,
              supplier: {
                id: suppliers.id,
                name: suppliers.name,
              },
            })
            .from(accountsPayables)
            .leftJoin(suppliers, eq(accountsPayables.supplierId, suppliers.id))
            .where(sql`1=1 ${sql.raw(getDateFilter("accounts_payables"))}`)
            .orderBy(accountsPayables.createdAt);

          const totalAmount = payables.reduce(
            (sum, p) => sum + parseFloat(p.amountDue),
            0
          );
          const totalPaid = payables.reduce(
            (sum, p) => sum + parseFloat(p.amountPaid || 0),
            0
          );
          const totalOutstanding = totalAmount - totalPaid;

          reportData = {
            payables,
            summary: {
              totalAmount,
              totalPaid,
              totalOutstanding,
              recordCount: payables.length,
            },
          };
        } catch (error) {
          console.error("Error fetching payables data:", error);
          // Return empty data if table doesn't exist
          reportData = {
            payables: [],
            summary: {
              totalAmount: 0,
              totalPaid: 0,
              totalOutstanding: 0,
              recordCount: 0,
            },
          };
        }
      } else {
        return res.status(400).json({ message: "Invalid report type" });
      }

      // Save report to database
      // Set default date range if not provided
      const now = new Date();
      const defaultStartDate =
        dateRange === "this_month"
          ? new Date(now.getFullYear(), now.getMonth(), 1)
          : dateRange === "last_month"
          ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
          : startDate
          ? new Date(startDate)
          : new Date(now.getFullYear(), now.getMonth(), 1);

      const defaultEndDate =
        dateRange === "this_month"
          ? new Date(now.getFullYear(), now.getMonth() + 1, 0)
          : dateRange === "last_month"
          ? new Date(now.getFullYear(), now.getMonth(), 0)
          : endDate
          ? new Date(endDate)
          : new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const savedReport = await db
        .insert(accountReports)
        .values({
          reportType,
          title,
          startDate: defaultStartDate,
          endDate: defaultEndDate,
          generatedBy:
            process.env.NODE_ENV === "development" ? null : req.user?.id,
          parameters: JSON.stringify({
            dateRange,
            startDate,
            endDate,
          }),
          summary: JSON.stringify(reportData.summary),
        })
        .returning();

      res.json({
        id: savedReport[0].id,
        title,
        reportType,
        dateRange,
        generatedAt: savedReport[0].generatedAt,
        data: reportData,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all saved reports
  app.get("/api/reports", requireAuth, async (req, res) => {
    try {
      const reports = await db
        .select({
          id: accountReports.id,
          reportType: accountReports.reportType,
          title: accountReports.title,
          startDate: accountReports.startDate,
          endDate: accountReports.endDate,
          status: accountReports.status,
          generatedAt: accountReports.generatedAt,
          summary: accountReports.summary,
          generatedBy: {
            id: users.id,
            username: users.username,
            firstName: users.firstName,
            lastName: users.lastName,
          },
        })
        .from(accountReports)
        .leftJoin(users, eq(accountReports.generatedBy, users.id))
        .orderBy(accountReports.generatedAt)
        .limit(100); // Limit to last 100 reports

      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all accounts receivables
  app.get("/api/accounts-receivables", requireAuth, async (req, res) => {
    try {
      const receivables = await db
        .select({
          id: accountsReceivables.id,
          invoiceId: accountsReceivables.invoiceId,
          customerId: accountsReceivables.customerId,
          amountDue: accountsReceivables.amountDue,
          amountPaid: accountsReceivables.amountPaid,
          dueDate: accountsReceivables.dueDate,
          notes: accountsReceivables.notes,
          status: accountsReceivables.status,
          createdAt: accountsReceivables.createdAt,
          updatedAt: accountsReceivables.updatedAt,
          customer: {
            id: customers.id,
            name: customers.name,
          },
        })
        .from(accountsReceivables)
        .leftJoin(customers, eq(accountsReceivables.customerId, customers.id))
        .orderBy(accountsReceivables.createdAt);

      res.json(receivables);
    } catch (error) {
      console.error("Error fetching receivables:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get overdue receivables
  app.get(
    "/api/accounts-receivables/overdue",
    requireAuth,
    async (req, res) => {
      try {
        const overdueReceivables = await db
          .select()
          .from(accountsReceivables)
          .where(
            sql`${accountsReceivables.dueDate} < NOW() AND ${accountsReceivables.status} != 'paid'`
          );

        res.json(overdueReceivables);
      } catch (error) {
        console.error("Error fetching overdue receivables:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Get receivables total
  app.get("/api/accounts/receivables-total", requireAuth, async (req, res) => {
    try {
      const result = await db
        .select({
          total: sql<number>`SUM(${accountsReceivables.amountDue} - ${accountsReceivables.amountPaid})`,
        })
        .from(accountsReceivables)
        .where(sql`${accountsReceivables.status} != 'paid'`);

      res.json({ total: result[0]?.total || 0 });
    } catch (error) {
      console.error("Error fetching receivables total:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new receivable
  app.post("/api/accounts-receivables", requireAuth, async (req, res) => {
    try {
      const validatedData = insertAccountsReceivableSchema.parse(req.body);

      const receivable = await db
        .insert(accountsReceivables)
        .values({
          invoiceId: validatedData.invoiceId || null,
          customerId: validatedData.customerId,
          amountDue: parseFloat(validatedData.amountDue),
          dueDate: new Date(validatedData.dueDate),
          notes: validatedData.notes,
        })
        .returning();

      res.status(201).json(receivable[0]);
    } catch (error) {
      console.error("Error creating receivable:", error);
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Update receivable
  app.put("/api/accounts-receivables/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertAccountsReceivableSchema.parse(req.body);

      const receivable = await db
        .update(accountsReceivables)
        .set({
          invoiceId: validatedData.invoiceId || null,
          customerId: validatedData.customerId,
          amountDue: parseFloat(validatedData.amountDue),
          dueDate: new Date(validatedData.dueDate),
          notes: validatedData.notes,
          updatedAt: new Date(),
        })
        .where(eq(accountsReceivables.id, id))
        .returning();

      if (receivable.length === 0) {
        return res.status(404).json({ message: "Receivable not found" });
      }

      res.json(receivable[0]);
    } catch (error) {
      console.error("Error updating receivable:", error);
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Delete receivable
  app.delete("/api/accounts-receivables/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db
        .delete(accountsReceivables)
        .where(eq(accountsReceivables.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ message: "Receivable not found" });
      }

      res.json({ message: "Receivable deleted successfully" });
    } catch (error) {
      console.error("Error deleting receivable:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Record payment
  app.post(
    "/api/accounts-receivables/:id/payment",
    requireAuth,
    async (req, res) => {
      try {
        const { id } = req.params;
        const { amount, notes } = req.body;

        if (!amount || isNaN(parseFloat(amount))) {
          return res.status(400).json({ message: "Valid amount is required" });
        }

        // Get current receivable
        const current = await db
          .select()
          .from(accountsReceivables)
          .where(eq(accountsReceivables.id, id))
          .limit(1);

        if (current.length === 0) {
          return res.status(404).json({ message: "Receivable not found" });
        }

        const receivable = current[0];
        const newAmountPaid =
          parseFloat(receivable.amountPaid || 0) + parseFloat(amount);
        const remainingAmount =
          parseFloat(receivable.amountDue) - newAmountPaid;

        let newStatus = "partial";
        if (remainingAmount <= 0) {
          newStatus = "paid";
        } else if (remainingAmount < parseFloat(receivable.amountDue)) {
          newStatus = "partial";
        }

        const updated = await db
          .update(accountsReceivables)
          .set({
            amountPaid: newAmountPaid,
            status: newStatus,
            notes: notes
              ? `${receivable.notes || ""}\nPayment: ${amount} (${notes})`
              : receivable.notes,
            updatedAt: new Date(),
          })
          .where(eq(accountsReceivables.id, id))
          .returning();

        res.json(updated[0]);
      } catch (error) {
        console.error("Error recording payment:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Get all accounts payables
  app.get("/api/accounts-payables", requireAuth, async (req, res) => {
    try {
      const payables = await db
        .select({
          id: accountsPayables.id,
          poId: accountsPayables.poId,
          inboundQuotationId: accountsPayables.inboundQuotationId,
          supplierId: accountsPayables.supplierId,
          amountDue: accountsPayables.amountDue,
          amountPaid: accountsPayables.amountPaid,
          dueDate: accountsPayables.dueDate,
          notes: accountsPayables.notes,
          status: accountsPayables.status,
          createdAt: accountsPayables.createdAt,
          updatedAt: accountsPayables.updatedAt,
          supplier: {
            id: suppliers.id,
            name: suppliers.name,
            email: suppliers.email,
            phone: suppliers.phone,
          },
        })
        .from(accountsPayables)
        .leftJoin(suppliers, eq(accountsPayables.supplierId, suppliers.id))
        .orderBy(accountsPayables.id);

      res.json(payables);
    } catch (error) {
      console.error("Error fetching payables:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get overdue payables
  app.get("/api/accounts-payables/overdue", requireAuth, async (req, res) => {
    try {
      const overduePayables = await db
        .select()
        .from(accountsPayables)
        .where(
          sql`${accountsPayables.dueDate} < NOW() AND ${accountsPayables.status} != 'paid'`
        );

      res.json(overduePayables);
    } catch (error) {
      console.error("Error fetching overdue payables:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get payables total
  app.get("/api/accounts/payables-total", requireAuth, async (req, res) => {
    try {
      const result = await db
        .select({
          total: sql<number>`SUM(${accountsPayables.amountDue} - ${accountsPayables.amountPaid})`,
        })
        .from(accountsPayables)
        .where(sql`${accountsPayables.status} != 'paid'`);

      res.json({ total: result[0]?.total || 0 });
    } catch (error) {
      console.error("Error fetching payables total:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new payable
  app.post("/api/accounts-payables", requireAuth, async (req, res) => {
    try {
      const validatedData = insertAccountsPayableSchema.parse(req.body);

      const payable = await db
        .insert(accountsPayables)
        .values({
          poId: validatedData.poId || null,
          inboundQuotationId: validatedData.inboundQuotationId || null,
          supplierId: validatedData.supplierId,
          amountDue: validatedData.amountDue.toString(),
          dueDate: validatedData.dueDate
            ? new Date(validatedData.dueDate)
            : null,
          notes: validatedData.notes,
        })
        .returning();

      res.status(201).json(payable[0]);
    } catch (error) {
      console.error("Error creating payable:", error);
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Update payable
  app.put("/api/accounts-payables/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertAccountsPayableSchema.parse(req.body);

      const payable = await db
        .update(accountsPayables)
        .set({
          poId: validatedData.poId || null,
          inboundQuotationId: validatedData.inboundQuotationId || null,
          supplierId: validatedData.supplierId,
          amountDue: validatedData.amountDue.toString(),
        })
        .where(eq(accountsPayables.id, id))
        .returning();

      if (payable.length === 0) {
        return res.status(404).json({ message: "Payable not found" });
      }

      res.json(payable[0]);
    } catch (error) {
      console.error("Error updating payable:", error);
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Delete payable
  app.delete("/api/accounts-payables/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db
        .delete(accountsPayables)
        .where(eq(accountsPayables.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ message: "Payable not found" });
      }

      res.json({ message: "Payable deleted successfully" });
    } catch (error) {
      console.error("Error deleting payable:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Record payment for payable
  app.post(
    "/api/accounts-payables/:id/payment",
    requireAuth,
    async (req, res) => {
      try {
        const { id } = req.params;
        const { amount, notes } = req.body;

        if (!amount || isNaN(parseFloat(amount))) {
          return res.status(400).json({ message: "Valid amount is required" });
        }

        // Get current payable
        const current = await db
          .select()
          .from(accountsPayables)
          .where(eq(accountsPayables.id, id))
          .limit(1);

        if (current.length === 0) {
          return res.status(404).json({ message: "Payable not found" });
        }

        const payable = current[0];
        const newAmountPaid =
          parseFloat(payable.amountPaid || 0) + parseFloat(amount);
        const remainingAmount = parseFloat(payable.amountDue) - newAmountPaid;

        let newStatus = "partial";
        if (remainingAmount <= 0) {
          newStatus = "paid";
        } else if (remainingAmount < parseFloat(payable.amountDue)) {
          newStatus = "partial";
        }

        const updated = await db
          .update(accountsPayables)
          .set({
            amountPaid: newAmountPaid,
            status: newStatus,
            notes: notes
              ? `${payable.notes || ""}\nPayment: ${amount} (${notes})`
              : payable.notes,
            updatedAt: new Date(),
          })
          .where(eq(accountsPayables.id, id))
          .returning();

        res.json(updated[0]);
      } catch (error) {
        console.error("Error recording payment:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Get all GST returns
  app.get("/api/gst-returns", requireAuth, async (req, res) => {
    try {
      // First check in-memory storage (primary source for now due to database schema issues)
      if (inMemoryGstReturns.length > 0) {
        res.json(inMemoryGstReturns);
        return;
      }

      // Only select columns that exist in the database table
      const returns = await db
        .select({
          id: gstReturns.id,
          periodStart: gstReturns.periodStart,
          periodEnd: gstReturns.periodEnd,
          frequency: gstReturns.frequency,
          outputTax: gstReturns.outputTax,
        })
        .from(gstReturns);

      // Add default values for missing columns to match frontend expectations
      const formattedReturns = returns.map((ret) => ({
        ...ret,
        inputTax: 0,
        liability: 0,
        status: "draft",
        notes: null,
        filedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      res.json(formattedReturns);
    } catch (error) {
      console.error("Error fetching GST returns:", error);
      // Fallback to in-memory storage
      res.json(inMemoryGstReturns);
    }
  });

  // Get overdue GST returns
  app.get("/api/gst-returns/status/overdue", requireAuth, async (req, res) => {
    try {
      // Since status column doesn't exist, we can't filter by status
      // Just return all records as "overdue" for now
      const returns = await db
        .select({
          id: gstReturns.id,
          periodStart: gstReturns.periodStart,
          periodEnd: gstReturns.periodEnd,
          frequency: gstReturns.frequency,
          outputTax: gstReturns.outputTax,
        })
        .from(gstReturns)
        .where(sql`${gstReturns.periodEnd} < NOW()`);

      // Add default values for missing columns
      const formattedReturns = returns.map((ret) => ({
        ...ret,
        inputTax: 0,
        liability: 0,
        status: "draft",
        notes: null,
        filedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      res.json(formattedReturns);
    } catch (error) {
      console.error("Error fetching overdue GST returns:", error);
      // Fallback to in-memory storage - filter for overdue returns
      const now = new Date();
      const overdueReturns = inMemoryGstReturns.filter(
        (ret) => ret.status !== "filed" && new Date(ret.periodEnd) < now
      );
      res.json(overdueReturns);
    }
  });

  // Get draft GST returns
  app.get("/api/gst-returns/status/draft", requireAuth, async (req, res) => {
    try {
      // Since status column doesn't exist, return all records as drafts
      const returns = await db
        .select({
          id: gstReturns.id,
          periodStart: gstReturns.periodStart,
          periodEnd: gstReturns.periodEnd,
          frequency: gstReturns.frequency,
          outputTax: gstReturns.outputTax,
        })
        .from(gstReturns);

      // Add default values for missing columns
      const formattedReturns = returns.map((ret) => ({
        ...ret,
        inputTax: 0,
        liability: 0,
        status: "draft",
        notes: null,
        filedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      res.json(formattedReturns);
    } catch (error) {
      console.error("Error fetching draft GST returns:", error);
      // Fallback to in-memory storage - filter for draft returns
      const draftReturns = inMemoryGstReturns.filter(
        (ret) => ret.status === "draft"
      );
      res.json(draftReturns);
    }
  });

  // Create new GST return
  app.post("/api/gst-returns", requireAuth, async (req, res) => {
    const validatedData = insertGstReturnSchema.parse(req.body);

    // Use in-memory storage for now (database connection issues)
    const newGstReturn = {
      id: `gst-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      periodStart: validatedData.periodStart,
      periodEnd: validatedData.periodEnd,
      frequency: validatedData.frequency || "quarterly",
      outputTax: validatedData.outputTax,
      inputTax: validatedData.inputTax,
      liability: validatedData.liability,
      status: validatedData.status || "draft",
      notes: validatedData.notes,
      filedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inMemoryGstReturns.push(newGstReturn);
    res.status(201).json(newGstReturn);
  });

  // Update GST return
  app.put("/api/gst-returns/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertGstReturnSchema.parse(req.body);

      // Only update columns that exist in the database table
      const gstReturn = await db
        .update(gstReturns)
        .set({
          periodStart: validatedData.periodStart
            ? new Date(validatedData.periodStart)
            : undefined,
          periodEnd: validatedData.periodEnd
            ? new Date(validatedData.periodEnd)
            : undefined,
          frequency: validatedData.frequency,
          outputTax: validatedData.outputTax
            ? validatedData.outputTax.toString()
            : undefined,
        })
        .where(eq(gstReturns.id, id))
        .returning();

      if (gstReturn.length === 0) {
        return res.status(404).json({ message: "GST return not found" });
      }

      // Return formatted response with all expected fields
      const formattedReturn = {
        ...gstReturn[0],
        inputTax: validatedData.inputTax,
        liability: validatedData.liability,
        status: validatedData.status,
        notes: validatedData.notes,
        filedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      res.json(formattedReturn);
    } catch (error) {
      console.error("Error updating GST return:", error);
      // Fallback to in-memory storage
      const { id } = req.params;
      const index = inMemoryGstReturns.findIndex((ret) => ret.id === id);
      if (index === -1) {
        return res.status(404).json({ message: "GST return not found" });
      }

      // Update the in-memory record
      const updatedReturn = {
        ...inMemoryGstReturns[index],
        ...req.body,
        updatedAt: new Date().toISOString(),
      };
      inMemoryGstReturns[index] = updatedReturn;
      res.json(updatedReturn);
    }
  });

  // Delete GST return
  app.delete("/api/gst-returns/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db
        .delete(gstReturns)
        .where(eq(gstReturns.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ message: "GST return not found" });
      }

      res.json({ message: "GST return deleted successfully" });
    } catch (error) {
      console.error("Error deleting GST return:", error);
      // Fallback to in-memory storage
      const { id } = req.params;
      const index = inMemoryGstReturns.findIndex((ret) => ret.id === id);
      if (index === -1) {
        return res.status(404).json({ message: "GST return not found" });
      }

      inMemoryGstReturns.splice(index, 1);
      res.json({ message: "GST return deleted successfully" });
    }
  });

  // Get all account tasks
  app.get("/api/account-tasks", requireAuth, async (req, res) => {
    try {
      const tasks = await db
        .select({
          id: accountTasks.id,
          title: accountTasks.title,
          description: accountTasks.description,
          type: accountTasks.type,
          assignedTo: accountTasks.assignedTo,
          assignedBy: accountTasks.assignedBy,
          status: accountTasks.status,
          priority: accountTasks.priority,
          dueDate: accountTasks.dueDate,
          completedDate: accountTasks.completedDate,
          relatedType: accountTasks.relatedType,
          relatedId: accountTasks.relatedId,
          notes: accountTasks.notes,
          createdAt: accountTasks.createdAt,
          updatedAt: accountTasks.updatedAt,
        })
        .from(accountTasks)
        .orderBy(accountTasks.createdAt);

      res.json(tasks);
    } catch (error) {
      console.error("Error fetching account tasks:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new account task
  app.post("/api/account-tasks", requireAuth, async (req, res) => {
    try {
      const validatedData = insertAccountTaskSchema.parse(req.body);

      const task = await db
        .insert(accountTasks)
        .values({
          title: validatedData.title,
          description: validatedData.description,
          type: validatedData.type,
          assignedTo: validatedData.assignedTo,
          assignedBy: validatedData.assignedBy,
          status: validatedData.status || "open",
          priority: validatedData.priority || "medium",
          dueDate: validatedData.dueDate
            ? new Date(validatedData.dueDate)
            : null,
          relatedType: validatedData.relatedType,
          relatedId: validatedData.relatedId,
          notes: validatedData.notes,
        })
        .returning();

      res.status(201).json(task[0]);
    } catch (error) {
      console.error("Error creating account task:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update account task
  app.put("/api/account-tasks/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertAccountTaskSchema.partial().parse(req.body);

      const task = await db
        .update(accountTasks)
        .set({
          title: validatedData.title,
          description: validatedData.description,
          type: validatedData.type,
          assignedTo: validatedData.assignedTo,
          assignedBy: validatedData.assignedBy,
          status: validatedData.status,
          priority: validatedData.priority,
          dueDate: validatedData.dueDate
            ? new Date(validatedData.dueDate)
            : null,
          relatedType: validatedData.relatedType,
          relatedId: validatedData.relatedId,
          notes: validatedData.notes,
          updatedAt: new Date(),
        })
        .where(eq(accountTasks.id, id))
        .returning();

      if (task.length === 0) {
        return res.status(404).json({ message: "Account task not found" });
      }

      res.json(task[0]);
    } catch (error) {
      console.error("Error updating account task:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete account task
  app.delete("/api/account-tasks/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db
        .delete(accountTasks)
        .where(eq(accountTasks.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ message: "Account task not found" });
      }

      res.json({ message: "Account task deleted successfully" });
    } catch (error) {
      console.error("Error deleting account task:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all customers
  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new customer
  app.post("/api/customers", requireAuth, async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update customer
  app.put("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertCustomerSchema.parse(req.body);

      const customer = await db
        .update(customers)
        .set(validatedData)
        .where(eq(customers.id, id))
        .returning();

      if (customer.length === 0) {
        return res.status(404).json({ message: "Customer not found" });
      }

      res.json(customer[0]);
    } catch (error) {
      console.error("Error updating customer:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete customer
  app.delete("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db
        .delete(customers)
        .where(eq(customers.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ message: "Customer not found" });
      }

      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Clock in for attendance
  app.post(
    "/api/account-attendance/clock-in",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "User not authenticated" });
        }

        const { location, notes } = req.body;

        // Check if user already has an attendance record for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existingRecord = await db
          .select()
          .from(attendance)
          .where(
            sql`${attendance.userId} = ${userId} AND ${attendance.date} >= ${today} AND ${attendance.date} < ${tomorrow}`
          )
          .limit(1);

        if (existingRecord.length > 0) {
          return res
            .status(400)
            .json({ message: "Already clocked in for today" });
        }

        // Create new attendance record with check-in time
        const [newRecord] = await db
          .insert(attendance)
          .values({
            userId,
            date: new Date(),
            checkIn: new Date(),
            location,
            notes,
            status: "present",
          })
          .returning();

        res.status(201).json({
          message: "Successfully clocked in",
          record: newRecord,
        });
      } catch (error) {
        console.error("Error clocking in:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Clock out for attendance
  app.post(
    "/api/account-attendance/clock-out",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "User not authenticated" });
        }

        const { location, notes } = req.body;

        // Find today's attendance record for the user
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existingRecord = await db
          .select()
          .from(attendance)
          .where(
            sql`${attendance.userId} = ${userId} AND ${attendance.date} >= ${today} AND ${attendance.date} < ${tomorrow}`
          )
          .limit(1);

        if (existingRecord.length === 0) {
          return res
            .status(400)
            .json({ message: "No clock-in record found for today" });
        }

        // Update the record with check-out time
        const [updatedRecord] = await db
          .update(attendance)
          .set({
            checkOut: new Date(),
            location: location || existingRecord[0].location,
            notes: notes || existingRecord[0].notes,
          })
          .where(eq(attendance.id, existingRecord[0].id))
          .returning();

        res.json({
          message: "Successfully clocked out",
          record: updatedRecord,
        });
      } catch (error) {
        console.error("Error clocking out:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Get all account tasks
  app.get("/api/account-tasks", requireAuth, async (req, res) => {
    try {
      const tasks = await db
        .select({
          id: accountTasks.id,
          title: accountTasks.title,
          description: accountTasks.description,
          type: accountTasks.type,
          status: accountTasks.status,
          priority: accountTasks.priority,
          dueDate: accountTasks.dueDate,
          completedDate: accountTasks.completedDate,
          relatedType: accountTasks.relatedType,
          relatedId: accountTasks.relatedId,
          notes: accountTasks.notes,
          createdAt: accountTasks.createdAt,
          updatedAt: accountTasks.updatedAt,
          assignedTo: accountTasks.assignedTo,
          assignedBy: accountTasks.assignedBy,
          assignee: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            department: users.department,
          },
          assigner: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
          },
        })
        .from(accountTasks)
        .leftJoin(users, eq(accountTasks.assignedTo, users.id))
        .orderBy(accountTasks.createdAt);

      res.json(tasks);
    } catch (error) {
      console.error("Error fetching account tasks:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get single account task
  app.get("/api/account-tasks/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const task = await db
        .select({
          id: accountTasks.id,
          title: accountTasks.title,
          description: accountTasks.description,
          type: accountTasks.type,
          status: accountTasks.status,
          priority: accountTasks.priority,
          dueDate: accountTasks.dueDate,
          completedDate: accountTasks.completedDate,
          relatedType: accountTasks.relatedType,
          relatedId: accountTasks.relatedId,
          notes: accountTasks.notes,
          createdAt: accountTasks.createdAt,
          updatedAt: accountTasks.updatedAt,
          assignedTo: accountTasks.assignedTo,
          assignedBy: accountTasks.assignedBy,
        })
        .from(accountTasks)
        .where(eq(accountTasks.id, id))
        .limit(1);

      if (task.length === 0) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json(task[0]);
    } catch (error) {
      console.error("Error fetching account task:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new account task
  app.post("/api/account-tasks", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertAccountTaskSchema.parse(req.body);

      // Ensure assignedBy user exists
      if (data.assignedBy) {
        const userExists = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, data.assignedBy))
          .limit(1);

        if (userExists.length === 0) {
          // Create dev user if it doesn't exist (for development only)
          if (process.env.NODE_ENV === "development" && data.assignedBy === "550e8400-e29b-41d4-a716-446655440000") {
            try {
              await db.insert(users).values({
                id: "550e8400-e29b-41d4-a716-446655440000",
                username: "dev_admin",
                email: "dev@example.com",
                password: "hashedpassword",
                firstName: "Dev",
                lastName: "Admin",
                role: "admin",
                department: "Administration",
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            } catch (insertError) {
              // User already exists, continue
            }
          } else {
            return res.status(400).json({ error: "Assigned by user does not exist" });
          }
        }
      }

      // Ensure assignedTo user exists
      if (data.assignedTo) {
        const assigneeExists = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, data.assignedTo))
          .limit(1);

        if (assigneeExists.length === 0) {
          return res.status(400).json({ error: "Assigned to user does not exist" });
        }
      }

      const [newTask] = await db
        .insert(accountTasks)
        .values({
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          relatedId: data.relatedId && data.relatedId !== "" ? data.relatedId : null,
          relatedType: data.relatedType || null,
        })
        .returning();

      res.status(201).json(newTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      console.error("Error creating account task:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update account task
  app.put("/api/account-tasks/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const data = insertAccountTaskSchema.partial().parse(req.body);

      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      };

      if (data.dueDate) {
        updateData.dueDate = new Date(data.dueDate);
      }
      
      if (data.relatedId !== undefined) {
        updateData.relatedId = data.relatedId && data.relatedId !== "" ? data.relatedId : null;
      }
      
      if (data.relatedType !== undefined) {
        updateData.relatedType = data.relatedType || null;
      }

      const [updatedTask] = await db
        .update(accountTasks)
        .set(updateData)
        .where(eq(accountTasks.id, id))
        .returning();

      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json(updatedTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      console.error("Error updating account task:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete account task
  app.delete("/api/account-tasks/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const [deletedTask] = await db
        .delete(accountTasks)
        .where(eq(accountTasks.id, id))
        .returning();

      if (!deletedTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting account task:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}
