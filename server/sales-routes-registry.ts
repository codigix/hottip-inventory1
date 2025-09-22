import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { customers as customersTable } from "@shared/schema";

interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string; username: string };
}

export function registerSalesRoutes(app: Express, middleware: { requireAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void> }) {
  const { requireAuth } = middleware;

  // Sales dashboard minimal endpoints
  app.get('/api/customers', requireAuth, async (_req, res) => {
    try {
      const rows = await db.select().from(customersTable);
      res.json(rows);
    } catch (e) {
      res.json([]);
    }
  });

  // Placeholder orders endpoints for UI. You can wire to real tables later.
  const orders: any[] = [];

  app.get('/api/orders', requireAuth, async (_req, res) => {
    res.json(orders);
  });

  app.post('/api/orders', requireAuth, async (req, res) => {
    try {
      const body = req.body || {};
      const newOrder = {
        id: String(Date.now()),
        orderNumber: `ORD-${Date.now()}`,
        customer: { id: body.customerId, name: (await db.select().from(customersTable)).find(c => c.id === Number(body.customerId))?.name ?? 'Customer' },
        totalAmount: body.totalAmount ?? 0,
        taxAmount: body.taxAmount ?? 0,
        discountAmount: body.discountAmount ?? 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      orders.push(newOrder);
      res.status(201).json(newOrder);
    } catch (e) {
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  app.put('/api/orders/:id', requireAuth, async (req, res) => {
    const idx = orders.findIndex(o => o.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Order not found' });
    orders[idx] = { ...orders[idx], ...req.body };
    res.json(orders[idx]);
  });
}
