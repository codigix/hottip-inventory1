import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import {
  accountsReceivables,
  customers,
  invoices,
  accountsPayables,
  suppliers,
  inboundQuotations,
} from "../shared/schema";
import { eq, sql, gte, lt } from "drizzle-orm";
import {
  insertAccountsReceivableSchema,
  insertAccountsPayableSchema,
} from "../shared/schema";

interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string; username: string };
}

export function registerAccountsRoutes(
  app: Express,
  middleware: {
    requireAuth: (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ) => Promise<void>;
  }
) {
  const { requireAuth } = middleware;

  // Accounts dashboards minimal stubs; extend with real queries later
  app.get("/api/accounts/dashboard", requireAuth, async (_req, res) => {
    res.json({
      totalReceivables: 0,
      totalPayables: 0,
      cashFlow: { inflow: 0, outflow: 0 },
    });
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
}
