// server/inventory-routes.ts
import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
// If using Drizzle ORM schema
// If using Drizzle ORM schema
import { products } from "@shared/schema"; // make sure this path is correct
// make sure this path is correct
import { stockTransactions } from "@shared/schema";
import { users } from "@shared/schema"; // adjust the path
import { suppliers } from "@shared/schema";

import { v4 as uuidv4 } from "uuid";
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
  // POST - create stock transaction
  app.post("/api/stock-transactions", async (req: Request, res: Response) => {
    try {
      const {
        userId,
        productId,
        type,
        reason,
        quantity,
        unitCost,
        notes,
        referenceNumber,
      } = req.body;

      if (!productId || !type || !reason || !quantity) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // ✅ Replace "current-user" with a valid UUID from your users table
      let realUserId = userId;

      if (userId === "current-user") {
        // Use an existing UUID from your users table
        // Replace this with any UUID you have in users table
        realUserId = "b34e3723-ba42-402d-b454-88cf96340573";
      }

      // Update product stock within a transaction
      const [row] = await db.transaction(async (tx) => {
        const [transactionRow] = await tx
          .insert(stockTransactions)
          .values({
            userId: realUserId,
            productId,
            batchId: null,
            type,
            reason,
            quantity: Number(quantity),
            unitCost: Number(unitCost || 0),
            notes,
            referenceNumber,
          })
          .returning();

        // Update product stock balance
        const stockAdjustment = type === 'in' ? Number(quantity) : -Number(quantity);
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} + ${stockAdjustment}`,
            updatedAt: new Date()
          })
          .where(eq(products.id, productId));

        return [transactionRow];
      });

      res.status(201).json(row);
    } catch (error) {
      console.error("Error creating stock transaction:", error);
      res.status(500).json({ error: String(error) });
    }
  });
  // GET - all stock transactions
  app.get(
    "/api/stock-transactions",
    requireAuth,
    async (_req: Request, res: Response) => {
      try {
        const rows = await db
          .select({
            id: stockTransactions.id,
            productId: stockTransactions.productId,
            batchId: stockTransactions.batchId,
            type: stockTransactions.type,
            reason: stockTransactions.reason,
            quantity: stockTransactions.quantity,
            unitCost: stockTransactions.unitCost,
            userId: stockTransactions.userId,
            referenceNumber: stockTransactions.referenceNumber,
            notes: stockTransactions.notes,
            createdAt: stockTransactions.createdAt,
            productName: products.name,
            productSku: products.sku,
          })
          .from(stockTransactions)
          .leftJoin(products, eq(stockTransactions.productId, products.id));
        res.status(200).json(rows);
      } catch (error) {
        console.error("Error fetching stock transactions:", error);
        res.status(500).json({ error: "Failed to fetch stock transactions" });
      }
    }
  );

  // GET - stock transactions by productId
  app.get(
    "/api/stock-transactions/product/:productId",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { productId } = req.params;
        const rows = await db
          .select({
            id: stockTransactions.id,
            productId: stockTransactions.productId,
            batchId: stockTransactions.batchId,
            type: stockTransactions.type,
            reason: stockTransactions.reason,
            quantity: stockTransactions.quantity,
            unitCost: stockTransactions.unitCost,
            userId: stockTransactions.userId,
            referenceNumber: stockTransactions.referenceNumber,
            notes: stockTransactions.notes,
            createdAt: stockTransactions.createdAt,
            productName: products.name,
            productSku: products.sku,
          })
          .from(stockTransactions)
          .leftJoin(products, eq(stockTransactions.productId, products.id))
          .where(eq(stockTransactions.productId, productId));
        res.status(200).json(rows);
      } catch (error) {
        console.error("Error fetching stock transactions by product:", error);
        res.status(500).json({ error: "Failed to fetch stock transactions" });
      }
    }
  );

  // Stock Balance Report
  app.get(
    "/api/reports/stock-balance",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const rows = await db.select().from(products);

        const reportData = rows.map((product) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          currentStock: product.stock,
          price: product.price,
          value: (Number(product.price) * product.stock).toFixed(2),
          lowStockThreshold: product.lowStockThreshold,
          status:
            product.stock <= (product.lowStockThreshold || 10)
              ? "Low Stock"
              : "In Stock",
        }));

        const summary = {
          totalProducts: rows.length,
          totalValue: reportData
            .reduce((sum, item) => sum + parseFloat(item.value), 0)
            .toFixed(2),
          lowStockItems: reportData.filter(
            (item) => item.status === "Low Stock"
          ).length,
        };

        res.json({ summary, data: reportData });
      } catch (error) {
        console.error("Error generating stock balance report:", error);
        res
          .status(500)
          .json({ error: "Failed to generate stock balance report" });
      }
    }
  );

  // Vendor History Report
  app.get(
    "/api/reports/vendor-history",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const suppliersData = await db.select().from(suppliers);
        const transactions = await db.select().from(stockTransactions);

        const vendorPerformance = suppliersData.map((supplier) => {
          const supplierTransactions = transactions.filter(
            (t) =>
              // Assuming we can link via some field, for now use placeholder logic
              t.notes && t.notes.includes(supplier.name)
          );

          const totalOrders = supplierTransactions.length;
          const totalValue = supplierTransactions.reduce(
            (sum, t) => sum + t.quantity * t.unitCost,
            0
          );

          return {
            id: supplier.id,
            name: supplier.name,
            contactPerson: supplier.contactPerson,
            email: supplier.email,
            phone: supplier.phone,
            totalOrders,
            totalValue: totalValue.toFixed(2),
            onTimeDelivery: "95%", // Placeholder
            qualityRating: "A-", // Placeholder
            lastOrder:
              supplierTransactions.length > 0
                ? supplierTransactions[0].createdAt
                : null,
          };
        });

        res.json({ data: vendorPerformance });
      } catch (error) {
        console.error("Error generating vendor history report:", error);
        res
          .status(500)
          .json({ error: "Failed to generate vendor history report" });
      }
    }
  );

  // Reorder Forecast Report
  app.get(
    "/api/reports/reorder-forecast",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const productsData = await db.select().from(products);
        const transactions = await db.select().from(stockTransactions);

        const forecastData = productsData
          .map((product) => {
            const productTransactions = transactions.filter(
              (t) => t.productId === product.id
            );
            const avgMonthlyUsage =
              productTransactions.length > 0
                ? productTransactions.reduce(
                    (sum, t) => sum + Math.abs(t.quantity),
                    0
                  ) / 3 // Rough 3-month average
                : 0;

            const recommendedReorder = Math.max(
              product.lowStockThreshold || 10,
              avgMonthlyUsage * 2
            );
            const urgency =
              product.stock <= (product.lowStockThreshold || 10)
                ? "High"
                : product.stock <= (product.lowStockThreshold || 10) * 1.5
                ? "Medium"
                : "Low";

            return {
              id: product.id,
              name: product.name,
              sku: product.sku,
              currentStock: product.stock,
              lowStockThreshold: product.lowStockThreshold || 10,
              avgMonthlyUsage: avgMonthlyUsage.toFixed(1),
              recommendedReorder: Math.ceil(recommendedReorder),
              urgency,
              estimatedDaysToStockout:
                product.stock > 0
                  ? Math.floor(
                      product.stock / Math.max(avgMonthlyUsage / 30, 0.1)
                    )
                  : 0,
            };
          })
          .filter(
            (item) =>
              item.currentStock <= item.lowStockThreshold ||
              item.urgency !== "Low"
          );

        res.json({ data: forecastData });
      } catch (error) {
        console.error("Error generating reorder forecast report:", error);
        res
          .status(500)
          .json({ error: "Failed to generate reorder forecast report" });
      }
    }
  );

  // Analytics Report
  app.get(
    "/api/reports/analytics",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const productsData = await db.select().from(products);
        const transactions = await db.select().from(stockTransactions);

        // Category breakdown
        const categoryStats = {};
        productsData.forEach((product) => {
          const category = product.category || "Uncategorized";
          if (!categoryStats[category]) {
            categoryStats[category] = { items: 0, value: 0, stock: 0 };
          }
          categoryStats[category].items += 1;
          categoryStats[category].value +=
            Number(product.price) * product.stock;
          categoryStats[category].stock += product.stock;
        });

        // Stock movement trends (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentTransactions = transactions.filter(
          (t) => t.createdAt && new Date(t.createdAt) >= thirtyDaysAgo
        );

        const stockMovements = {
          inbound: recentTransactions
            .filter((t) => t.type === "inbound")
            .reduce((sum, t) => sum + t.quantity, 0),
          outbound: recentTransactions
            .filter((t) => t.type === "outbound")
            .reduce((sum, t) => sum + Math.abs(t.quantity), 0),
        };

        const analytics = {
          totalInventoryValue: productsData
            .reduce((sum, p) => sum + Number(p.price) * p.stock, 0)
            .toFixed(2),
          totalProducts: productsData.length,
          lowStockAlerts: productsData.filter(
            (p) => p.stock <= (p.lowStockThreshold || 10)
          ).length,
          categoryBreakdown: Object.entries(categoryStats).map(
            ([category, stats]: [string, any]) => ({
              category,
              items: stats.items,
              value: stats.value.toFixed(2),
              stock: stats.stock,
            })
          ),
          stockMovements,
          topSellingProducts: productsData
            .map((p) => ({
              name: p.name,
              outboundQty: recentTransactions
                .filter((t) => t.productId === p.id && t.type === "outbound")
                .reduce((sum, t) => sum + Math.abs(t.quantity), 0),
            }))
            .sort((a, b) => b.outboundQty - a.outboundQty)
            .slice(0, 5),
        };

        res.json(analytics);
      } catch (error) {
        console.error("Error generating analytics report:", error);
        res.status(500).json({ error: "Failed to generate analytics report" });
      }
    }
  );

  // Export Stock Balance Report as CSV
  app.get(
    "/api/reports/stock-balance/export",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const rows = await db.select().from(products);

        const reportData = rows.map((product) => ({
          "Product Name": product.name,
          SKU: product.sku,
          Category: product.category,
          "Current Stock": product.stock,
          Price: product.price,
          "Total Value": (Number(product.price) * product.stock).toFixed(2),
          "Low Stock Threshold": product.lowStockThreshold,
          Status:
            product.stock <= (product.lowStockThreshold || 10)
              ? "Low Stock"
              : "In Stock",
        }));

        // Generate CSV
        const csvHeaders = Object.keys(reportData[0] || {}).join(",");
        const csvRows = reportData.map((row) =>
          Object.values(row)
            .map((val) => `"${val}"`)
            .join(",")
        );
        const csvContent = [csvHeaders, ...csvRows].join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="stock-balance-report.csv"'
        );
        res.send(csvContent);
      } catch (error) {
        console.error("Error exporting stock balance report:", error);
        res
          .status(500)
          .json({ error: "Failed to export stock balance report" });
      }
    }
  );

  // Export Vendor History Report as CSV
  app.get(
    "/api/reports/vendor-history/export",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const suppliersData = await db.select().from(suppliers);
        const transactions = await db.select().from(stockTransactions);

        const vendorPerformance = suppliersData.map((supplier) => {
          const supplierTransactions = transactions.filter(
            (t) => t.notes && t.notes.includes(supplier.name)
          );

          const totalOrders = supplierTransactions.length;
          const totalValue = supplierTransactions.reduce(
            (sum, t) => sum + t.quantity * t.unitCost,
            0
          );

          return {
            "Vendor Name": supplier.name,
            "Contact Person": supplier.contactPerson || "",
            Email: supplier.email || "",
            Phone: supplier.phone || "",
            "Total Orders": totalOrders,
            "Total Value": totalValue.toFixed(2),
            "On Time Delivery": "95%",
            "Quality Rating": "A-",
            "Last Order Date":
              supplierTransactions.length > 0
                ? supplierTransactions[0].createdAt
                : "",
          };
        });

        const csvHeaders = Object.keys(vendorPerformance[0] || {}).join(",");
        const csvRows = vendorPerformance.map((row) =>
          Object.values(row)
            .map((val) => `"${val}"`)
            .join(",")
        );
        const csvContent = [csvHeaders, ...csvRows].join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="vendor-history-report.csv"'
        );
        res.send(csvContent);
      } catch (error) {
        console.error("Error exporting vendor history report:", error);
        res
          .status(500)
          .json({ error: "Failed to export vendor history report" });
      }
    }
  );

  // Export Reorder Forecast Report as CSV
  app.get(
    "/api/reports/reorder-forecast/export",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const productsData = await db.select().from(products);
        const transactions = await db.select().from(stockTransactions);

        const forecastData = productsData
          .map((product) => {
            const productTransactions = transactions.filter(
              (t) => t.productId === product.id
            );
            const avgMonthlyUsage =
              productTransactions.length > 0
                ? productTransactions.reduce(
                    (sum, t) => sum + Math.abs(t.quantity),
                    0
                  ) / 3
                : 0;

            const recommendedReorder = Math.max(
              product.lowStockThreshold || 10,
              avgMonthlyUsage * 2
            );
            const urgency =
              product.stock <= (product.lowStockThreshold || 10)
                ? "High"
                : product.stock <= (product.lowStockThreshold || 10) * 1.5
                ? "Medium"
                : "Low";

            return {
              "Product Name": product.name,
              SKU: product.sku,
              "Current Stock": product.stock,
              "Low Stock Threshold": product.lowStockThreshold || 10,
              "Avg Monthly Usage": avgMonthlyUsage.toFixed(1),
              "Recommended Reorder Qty": Math.ceil(recommendedReorder),
              Urgency: urgency,
              "Days to Stockout":
                product.stock > 0
                  ? Math.floor(
                      product.stock / Math.max(avgMonthlyUsage / 30, 0.1)
                    )
                  : 0,
            };
          })
          .filter(
            (item) =>
              item["Current Stock"] <= item["Low Stock Threshold"] ||
              item.Urgency !== "Low"
          );

        const csvHeaders = Object.keys(forecastData[0] || {}).join(",");
        const csvRows = forecastData.map((row) =>
          Object.values(row)
            .map((val) => `"${val}"`)
            .join(",")
        );
        const csvContent = [csvHeaders, ...csvRows].join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="reorder-forecast-report.csv"'
        );
        res.send(csvContent);
      } catch (error) {
        console.error("Error exporting reorder forecast report:", error);
        res
          .status(500)
          .json({ error: "Failed to export reorder forecast report" });
      }
    }
  );

  // Export Analytics Report as CSV
  app.get(
    "/api/reports/analytics/export",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const productsData = await db.select().from(products);
        const transactions = await db.select().from(stockTransactions);

        const categoryStats = {};
        productsData.forEach((product) => {
          const category = product.category || "Uncategorized";
          if (!categoryStats[category]) {
            categoryStats[category] = { items: 0, value: 0, stock: 0 };
          }
          categoryStats[category].items += 1;
          categoryStats[category].value +=
            Number(product.price) * product.stock;
          categoryStats[category].stock += product.stock;
        });

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentTransactions = transactions.filter(
          (t) => t.createdAt && new Date(t.createdAt) >= thirtyDaysAgo
        );

        const analyticsData = Object.entries(categoryStats).map(
          ([category, stats]: [string, any]) => ({
            Category: category,
            Items: stats.items,
            "Total Value": stats.value.toFixed(2),
            "Total Stock": stats.stock,
          })
        );

        const csvHeaders = Object.keys(analyticsData[0] || {}).join(",");
        const csvRows = analyticsData.map((row) =>
          Object.values(row)
            .map((val) => `"${val}"`)
            .join(",")
        );
        const csvContent = [csvHeaders, ...csvRows].join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="analytics-report.csv"'
        );
        res.send(csvContent);
      } catch (error) {
        console.error("Error exporting analytics report:", error);
        res.status(500).json({ error: "Failed to export analytics report" });
      }
    }
  );

  // Export All Reports (combined CSV)
  app.get(
    "/api/reports/export-all",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const productsData = await db.select().from(products);
        const suppliersData = await db.select().from(suppliers);
        const transactions = await db.select().from(stockTransactions);

        let csvContent = "STOCK BALANCE REPORT\n";
        csvContent +=
          "Product Name,SKU,Category,Current Stock,Price,Total Value,Low Stock Threshold,Status\n";

        productsData.forEach((product) => {
          const status =
            product.stock <= (product.lowStockThreshold || 10)
              ? "Low Stock"
              : "In Stock";
          csvContent += `"${product.name}","${product.sku}","${
            product.category
          }",${product.stock},${product.price},${(
            Number(product.price) * product.stock
          ).toFixed(2)},${product.lowStockThreshold},"${status}"\n`;
        });

        csvContent += "\n\nVENDOR HISTORY REPORT\n";
        csvContent +=
          "Vendor Name,Contact Person,Email,Phone,Total Orders,Total Value,On Time Delivery,Quality Rating\n";

        suppliersData.forEach((supplier) => {
          const supplierTransactions = transactions.filter(
            (t) => t.notes && t.notes.includes(supplier.name)
          );
          const totalOrders = supplierTransactions.length;
          const totalValue = supplierTransactions.reduce(
            (sum, t) => sum + t.quantity * t.unitCost,
            0
          );
          csvContent += `"${supplier.name}","${
            supplier.contactPerson || ""
          }","${supplier.email || ""}","${
            supplier.phone || ""
          }",${totalOrders},${totalValue.toFixed(2)},"95%","A-"\n`;
        });

        csvContent += "\n\nREORDER FORECAST REPORT\n";
        csvContent +=
          "Product Name,SKU,Current Stock,Low Stock Threshold,Avg Monthly Usage,Recommended Reorder Qty,Urgency,Days to Stockout\n";

        productsData.forEach((product) => {
          const productTransactions = transactions.filter(
            (t) => t.productId === product.id
          );
          const avgMonthlyUsage =
            productTransactions.length > 0
              ? productTransactions.reduce(
                  (sum, t) => sum + Math.abs(t.quantity),
                  0
                ) / 3
              : 0;

          const recommendedReorder = Math.max(
            product.lowStockThreshold || 10,
            avgMonthlyUsage * 2
          );
          const urgency =
            product.stock <= (product.lowStockThreshold || 10)
              ? "High"
              : product.stock <= (product.lowStockThreshold || 10) * 1.5
              ? "Medium"
              : "Low";

          if (
            product.stock <= (product.lowStockThreshold || 10) ||
            urgency !== "Low"
          ) {
            const daysToStockout =
              product.stock > 0
                ? Math.floor(
                    product.stock / Math.max(avgMonthlyUsage / 30, 0.1)
                  )
                : 0;
            csvContent += `"${product.name}","${product.sku}",${
              product.stock
            },${product.lowStockThreshold || 10},${avgMonthlyUsage.toFixed(
              1
            )},${Math.ceil(
              recommendedReorder
            )},"${urgency}",${daysToStockout}\n`;
          }
        });

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="all-reports-combined.csv"'
        );
        res.send(csvContent);
      } catch (error) {
        console.error("Error exporting all reports:", error);
        res.status(500).json({ error: "Failed to export all reports" });
      }
    }
  );
}
