import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { insertSalesOrderSchema } from "@shared/schema";
import { z } from "zod";

interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string; username: string };
}

export function registerSalesOrderRoutes(
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

  // GET /api/sales-orders
  app.get("/api/sales-orders", requireAuth, async (_req, res) => {
    try {
      console.log("📦 [SALES ORDER ROUTES] GET /api/sales-orders hit!");
      const orders = await storage.getSalesOrders();
      res.json(orders);
    } catch (error) {
      console.error("❌ Error in GET /api/sales-orders:", error);
      res.status(500).json({ error: "Failed to fetch sales orders" });
    }
  });

  // GET /api/sales-orders/:id
  app.get("/api/sales-orders/:id", requireAuth, async (req, res) => {
    try {
      console.log(`📦 [SALES ORDER ROUTES] GET /api/sales-orders/${req.params.id} hit!`);
      const order = await storage.getSalesOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Sales order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("❌ Error in GET /api/sales-orders/:id:", error);
      res.status(500).json({ error: "Failed to fetch sales order" });
    }
  });

  // POST /api/sales-orders
  app.post("/api/sales-orders", requireAuth, async (req, res) => {
    console.log("📦 [SALES ORDER ROUTES] POST /api/sales-orders hit!", JSON.stringify(req.body, null, 2));
    try {
      const orderData = insertSalesOrderSchema.parse(req.body);
      const newOrder = await storage.createSalesOrder(orderData);
      console.log("✅ [SALES ORDER ROUTES] Order created successfully:", newOrder.id);
      res.status(201).json(newOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.warn("⚠️ [SALES ORDER ROUTES] Validation error:", error.errors);
        return res
          .status(400)
          .json({ error: "Invalid sales order data", details: error.errors });
      }
      console.error("❌ Error in POST /api/sales-orders:", error);
      res.status(500).json({ error: "Failed to create sales order" });
    }
  });

  // PUT /api/sales-orders/:id/status
  app.put("/api/sales-orders/:id/status", requireAuth, async (req, res) => {
    try {
      const { status } = req.body;
      console.log(`📦 [SALES ORDER ROUTES] PUT /api/sales-orders/${req.params.id}/status hit! Status: ${status}`);
      const updatedOrder = await storage.updateSalesOrderStatus(
        req.params.id,
        status
      );
      res.json(updatedOrder);
    } catch (error) {
      console.error("❌ Error in PUT /api/sales-orders/:id/status:", error);
      res.status(500).json({ error: "Failed to update sales order status" });
    }
  });
}
