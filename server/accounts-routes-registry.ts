import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  accountsReceivables,
  insertAccountsReceivableSchema,
  type AccountsReceivable,
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

  // === ACCOUNTS RECEIVABLES ROUTES ===

  // GET /api/accounts-receivables - Get all accounts receivables
  app.get(
    "/api/accounts-receivables",
    requireAuth,
    async (_req: AuthenticatedRequest, res: Response) => {
      try {
        const receivables = await db
          .select()
          .from(accountsReceivables)
          .orderBy(desc(accountsReceivables.createdAt));

        res.json(receivables);
      } catch (error) {
        console.error("Error fetching accounts receivables:", error);
        res.status(500).json({ error: "Failed to fetch accounts receivables" });
      }
    }
  );

  // GET /api/accounts-receivables/:id - Get single accounts receivable
  app.get(
    "/api/accounts-receivables/:id",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { id } = req.params;

        const [receivable] = await db
          .select()
          .from(accountsReceivables)
          .where(eq(accountsReceivables.id, id))
          .limit(1);

        if (!receivable) {
          return res
            .status(404)
            .json({ error: "Accounts receivable not found" });
        }

        res.json(receivable);
      } catch (error) {
        console.error("Error fetching accounts receivable:", error);
        res.status(500).json({ error: "Failed to fetch accounts receivable" });
      }
    }
  );

  // POST /api/accounts-receivables - Create new accounts receivable
  app.post(
    "/api/accounts-receivables",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const validatedData = insertAccountsReceivableSchema.parse(req.body);

        const [newReceivable] = await db
          .insert(accountsReceivables)
          .values(validatedData)
          .returning();

        res.status(201).json(newReceivable);
      } catch (error) {
        console.error("Error creating accounts receivable:", error);
        if (error.name === "ZodError") {
          return res
            .status(400)
            .json({ error: "Invalid data", details: error.errors });
        }
        res.status(500).json({ error: "Failed to create accounts receivable" });
      }
    }
  );

  // PUT /api/accounts-receivables/:id - Update accounts receivable
  app.put(
    "/api/accounts-receivables/:id",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { id } = req.params;
        const updateData = req.body;

        // Remove id from update data if present
        delete updateData.id;

        const [updatedReceivable] = await db
          .update(accountsReceivables)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(accountsReceivables.id, id))
          .returning();

        if (!updatedReceivable) {
          return res
            .status(404)
            .json({ error: "Accounts receivable not found" });
        }

        res.json(updatedReceivable);
      } catch (error) {
        console.error("Error updating accounts receivable:", error);
        res.status(500).json({ error: "Failed to update accounts receivable" });
      }
    }
  );

  // DELETE /api/accounts-receivables/:id - Delete accounts receivable
  app.delete(
    "/api/accounts-receivables/:id",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { id } = req.params;

        const [deletedReceivable] = await db
          .delete(accountsReceivables)
          .where(eq(accountsReceivables.id, id))
          .returning();

        if (!deletedReceivable) {
          return res
            .status(404)
            .json({ error: "Accounts receivable not found" });
        }

        res.json({ message: "Accounts receivable deleted successfully" });
      } catch (error) {
        console.error("Error deleting accounts receivable:", error);
        res.status(500).json({ error: "Failed to delete accounts receivable" });
      }
    }
  );
}
