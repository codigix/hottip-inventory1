// server/inventory-routes.ts
import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
// If using Drizzle ORM schema
// If using Drizzle ORM schema
import { products } from "@shared/schema"; // make sure this path is correct
// make sure this path is correct

import { sql, eq, lte } from "drizzle-orm";

interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string; username: string };
}

// Named export to avoid import issues
export function registerInventoryRoutes(
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

  // Inventory dashboard metrics
  app.get("/api/inventory/dashboard", requireAuth, async (_req, res) => {
    try {
      const [countRow] = await db
        .select({ total: sql`COUNT(*)::integer` })
        .from(products);
      const totalProducts = Number(countRow?.total || 0);

      const [sumRow] = await db
        .select({
          totalValue: sql`COALESCE(SUM(CASE WHEN ${products.price} IS NULL THEN 0 ELSE ${products.price} END * COALESCE(${products.stock}, 0)), 0)`,
        })
        .from(products);

      // Low stock: threshold 10
      const lowStockRows = await db
        .select()
        .from(products)
        .where(lte(products.stock, 10));

      res.json({
        totalProducts,
        totalValue: Number(sumRow?.totalValue || 0),
        lowStockCount: lowStockRows.length,
      });
    } catch (e) {
      console.error("Error fetching dashboard metrics:", e);
      res.json({ totalProducts: 0, totalValue: 0, lowStockCount: 0 });
    }
  });

  // Get all products
  app.get("/api/products", requireAuth, async (_req, res) => {
    try {
      const rows = await db.select().from(products);
      res.json(rows);
    } catch (e) {
      console.error("Error fetching products:", e);
      res.json([]);
    }
  });

  // Get low stock products
  app.get("/api/products/low-stock", requireAuth, async (_req, res) => {
    try {
      const rows = await db
        .select()
        .from(products)
        .where(lte(products.stock, 10));
      res.json(rows);
    } catch (e) {
      console.error("Error fetching low-stock products:", e);
      res.json([]);
    }
  });

  // Create a new product
  app.post(
    "/api/products",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const body = req.body || {};

        const name = typeof body.name === "string" ? body.name.trim() : null;
        if (!name) return res.status(400).json({ error: "name is required" });

        const sku = typeof body.sku === "string" ? body.sku.trim() : undefined;
        const description =
          typeof body.description === "string" ? body.description : "";
        const category =
          typeof body.category === "string" ? body.category : "general";

        const stock =
          body.stock != null && !Number.isNaN(Number(body.stock))
            ? Number(body.stock)
            : 0;
        const price =
          body.price != null && !Number.isNaN(Number(body.price))
            ? Number(body.price)
            : 0;
        const costPrice =
          body.costPrice != null && !Number.isNaN(Number(body.costPrice))
            ? Number(body.costPrice)
            : 0;
        const lowStockThreshold =
          body.lowStockThreshold != null &&
          !Number.isNaN(Number(body.lowStockThreshold))
            ? Number(body.lowStockThreshold)
            : 10;
        const unit = typeof body.unit === "string" ? body.unit : "pcs";

        const [row] = await db
          .insert(products)
          .values({
            name,
            sku,
            description,
            category,
            stock,
            price,
            costPrice,
            lowStockThreshold,
            unit,
          })
          .returning();

        res.status(201).json(row);
      } catch (e) {
        console.error("Error creating product:", e);
        res.status(500).json({ error: "Failed to create product" });
      }
    }
  );

  // Update a product
  app.put(
    "/api/products/:id",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const id = req.params.id;
        const body = req.body || {};
        const update: any = {};
        if (typeof body.name === "string") update.name = body.name.trim();
        if (typeof body.sku === "string") update.sku = body.sku.trim();
        if (body.stock != null && !Number.isNaN(Number(body.stock)))
          update.stock = Number(body.stock);
        if (body.price != null && !Number.isNaN(Number(body.price)))
          update.price = Number(body.price);

        const [row] = await db
          .update(products)
          .set(update)
          .where(eq(products.id, id))
          .returning();
        if (!row) return res.status(404).json({ error: "Product not found" });

        res.json(row);
      } catch (e) {
        console.error("Error updating product:", e);
        res.status(500).json({ error: "Failed to update product" });
      }
    }
  );

  // Delete a product
  app.delete(
    "/api/products/:id",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const id = req.params.id;
        const [row] = await db
          .delete(products)
          .where(eq(products.id, id))
          .returning();
        if (!row) return res.status(404).json({ error: "Product not found" });

        res.status(204).send();
      } catch (e) {
        console.error("Error deleting product:", e);
        res.status(500).json({ error: "Failed to delete product" });
      }
    }
  );
  app.post(
    "/api/stock-transactions",
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const body = req.body || {};

        const productId: string = body.productId;
        const batchId: string | undefined = body.batchId;
        const type: "in" | "out" = body.type; // match your enum `stock_transaction_type`
        const reason: string = body.reason; // match your enum `stock_transaction_reason`
        const quantity: number = Number(body.quantity);
        const unitCost: number = Number(body.unitCost || 0);

        // Basic validation
        if (!productId || !type || !reason || !quantity || quantity <= 0) {
          return res
            .status(400)
            .json({ error: "Invalid stock transaction data" });
        }

        const [row] = await db
          .insert(stockTransactions)
          .values({
            productId,
            batchId,
            type,
            reason,
            quantity,
            unitCost,
          })
          .returning();

        res.status(201).json(row);
      } catch (error) {
        console.error("Error creating stock transaction:", error);
        res.status(500).json({ error: "Failed to create stock transaction" });
      }
    }
  );
  app.get(
    "/api/stock-transactions",
    requireAuth,
    async (_req: Request, res: Response) => {
      try {
        const rows = await db.select().from(stockTransactions);
        res.status(200).json(rows);
      } catch (error) {
        console.error("Error fetching stock transactions:", error);
        res.status(500).json({ error: "Failed to fetch stock transactions" });
      }
    }
  );

  // Optional: GET stock transactions by product
  app.get(
    "/api/stock-transactions/product/:productId",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { productId } = req.params;
        const rows = await db
          .select()
          .from(stockTransactions)
          .where({ productId });
        res.status(200).json(rows);
      } catch (error) {
        console.error("Error fetching stock transactions by product:", error);
        res.status(500).json({ error: "Failed to fetch stock transactions" });
      }
    }
  );
}
