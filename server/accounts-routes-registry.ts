import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { accountsReceivables, customers, invoices } from "../shared/schema";
import { eq, sql, gte, lt } from "drizzle-orm";
import { insertAccountsReceivableSchema } from "../shared/schema";

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
}
