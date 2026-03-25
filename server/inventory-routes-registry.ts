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
import { materialRequests, materialRequestItems, spareParts, vendorQuotations, insertVendorQuotationSchema, purchaseOrders, purchaseOrderItems, insertPurchaseOrderSchema, accountsPayables, logisticsShipments } from "@shared/schema";

import { v4 as uuidv4 } from "uuid";
import { sql, eq, lte, desc, and, or, isNull, like } from "drizzle-orm";
import { generatePurchaseOrderPDF, generateRFQPDF } from "./pdf-generator";
import { numberToWords } from "./utils/number-to-words";

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
          totalValue: sql`COALESCE(SUM(CASE WHEN ${products.costPrice} IS NULL THEN 0 ELSE ${products.costPrice} END * COALESCE(${products.stock}, 0)), 0)`,
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
          .leftJoin(products, eq(stockTransactions.productId, products.id))
          .orderBy(desc(stockTransactions.createdAt));
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
          costPrice: product.costPrice,
          value: (Number(product.costPrice) * product.stock).toFixed(2),
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
            Number(product.costPrice) * product.stock;
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
            .reduce((sum, p) => sum + Number(p.costPrice) * p.stock, 0)
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
          "Cost Price": product.costPrice,
          "Total Value": (Number(product.costPrice) * product.stock).toFixed(2),
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
            Number(product.costPrice) * product.stock;
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
          "Product Name,SKU,Category,Current Stock,Cost Price,Total Value,Low Stock Threshold,Status\n";

        productsData.forEach((product) => {
          const status =
            product.stock <= (product.lowStockThreshold || 10)
              ? "Low Stock"
              : "In Stock";
          csvContent += `"${product.name}","${product.sku}","${
            product.category
          }",${product.stock},${product.costPrice},${(
            Number(product.costPrice) * product.stock
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

  // --- MATERIAL REQUEST ROUTES ---

  // GET all material requests
  app.get("/api/material-requests", requireAuth, async (_req, res) => {
    try {
      const rows = await db
        .select({
          request: materialRequests,
          poNumber: purchaseOrders.poNumber
        })
        .from(materialRequests)
        .leftJoin(purchaseOrders, eq(materialRequests.purchaseOrderId, purchaseOrders.id))
        .orderBy(desc(materialRequests.createdAt));
      
      const formattedRows = await Promise.all(rows.map(async (r) => {
        if (r.request.status === 'FULFILLED') {
          return {
            ...r.request,
            poNumber: r.poNumber,
            isAvailable: true
          };
        }

        // Fetch items for each request to check availability
        const items = await db
          .select({
            quantity: materialRequestItems.quantity,
            productStock: products.stock,
            sparePartStock: spareParts.stock,
            productId: materialRequestItems.productId,
            sparePartId: materialRequestItems.sparePartId
          })
          .from(materialRequestItems)
          .leftJoin(products, eq(materialRequestItems.productId, products.id))
          .leftJoin(spareParts, eq(materialRequestItems.sparePartId, spareParts.id))
          .where(eq(materialRequestItems.requestId, r.request.id));

        let isAvailable = true;
        if (items.length === 0) {
          isAvailable = false;
        } else {
          for (const item of items) {
            const stock = item.productId ? (item.productStock ?? 0) : (item.sparePartStock ?? 0);
            if (stock < Number(item.quantity)) {
              isAvailable = false;
              break;
            }
          }
        }

        return {
          ...r.request,
          poNumber: r.poNumber,
          isAvailable
        };
      }));
      
      res.json(formattedRows);
    } catch (e) {
      console.error("Error fetching material requests:", e);
      res.status(500).json({ error: "Failed to fetch material requests" });
    }
  });

  // GET material request by ID
  app.get("/api/material-requests/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const [request] = await db
        .select({
          request: materialRequests,
          poNumber: purchaseOrders.poNumber
        })
        .from(materialRequests)
        .leftJoin(purchaseOrders, eq(materialRequests.purchaseOrderId, purchaseOrders.id))
        .where(eq(materialRequests.id, id));
      
      if (!request) {
        return res.status(404).json({ error: "Material request not found" });
      }

      const items = await db
        .select({
          id: materialRequestItems.id,
          requestId: materialRequestItems.requestId,
          productId: materialRequestItems.productId,
          sparePartId: materialRequestItems.sparePartId,
          quantity: materialRequestItems.quantity,
          unit: materialRequestItems.unit,
          status: materialRequestItems.status,
          notes: materialRequestItems.notes,
          productName: products.name,
          productSku: products.sku,
          productStock: products.stock,
          sparePartName: spareParts.name,
          sparePartNumber: spareParts.partNumber,
          sparePartStock: spareParts.stock,
        })
        .from(materialRequestItems)
        .leftJoin(products, eq(materialRequestItems.productId, products.id))
        .leftJoin(spareParts, eq(materialRequestItems.sparePartId, spareParts.id))
        .where(eq(materialRequestItems.requestId, id));

      res.json({ ...request.request, poNumber: request.poNumber, items });
    } catch (e) {
      console.error("Error fetching material request details:", e);
      res.status(500).json({ error: "Failed to fetch material request details" });
    }
  });

  // Update material request
  app.put("/api/material-requests/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const [updated] = await db
        .update(materialRequests)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(materialRequests.id, id))
        .returning();
        
      if (!updated) {
        return res.status(404).json({ error: "Material request not found" });
      }
      
      res.json(updated);
    } catch (e) {
      console.error("Error updating material request:", e);
      res.status(500).json({ error: "Failed to update material request" });
    }
  });

  // Retry linking for material request items
  app.post("/api/material-requests/:id/retry-linking", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      console.log(`🔄 Retrying linking for MR ${id}...`);

      const items = await db.select().from(materialRequestItems).where(eq(materialRequestItems.requestId, id));
      if (items.length === 0) {
        return res.status(404).json({ error: "No items found for this material request" });
      }

      // Fetch all products and spares for in-memory matching
      const [allProducts, allSpares] = await Promise.all([
        db.select({ id: products.id, name: products.name, sku: products.sku }).from(products),
        db.select({ id: spareParts.id, name: spareParts.name, partNumber: spareParts.partNumber }).from(spareParts)
      ]);

      let linkedCount = 0;
      for (const item of items) {
        // Skip if already linked
        if (item.productId || item.sparePartId) continue;

        const sName = (item.notes || "").trim().toLowerCase();
        
        // Extract names for matching: "PartName (ItemName)" -> full="partname (itemname)", item="itemname", part="partname"
        const sFullName = sName;
        let sItemOnly = "";
        let sPartOnly = sName;

        if (sName.includes('(') && sName.includes(')')) {
          const match = sName.match(/^(.*)\s*\((.*)\)/);
          if (match) {
            sPartOnly = match[1].trim();
            sItemOnly = match[2].trim();
          }
        }
        
        console.log(`   Searching for: "${sFullName}" (Part: "${sPartOnly}", Item: "${sItemOnly}")`);

        // Try to find product - Prioritize exact matches
        const foundProduct = allProducts.find(p => p.name.toLowerCase() === sFullName) ||
                             allProducts.find(p => p.sku.toLowerCase() === sFullName) ||
                             (sItemOnly && allProducts.find(p => p.name.toLowerCase() === sItemOnly)) ||
                             (sItemOnly && allProducts.find(p => p.sku.toLowerCase() === sItemOnly)) ||
                             allProducts.find(p => p.name.toLowerCase() === sPartOnly) ||
                             allProducts.find(p => p.sku.toLowerCase() === sPartOnly);
        
        if (foundProduct) {
          console.log(`   ✅ Found Product: ${foundProduct.name} (${foundProduct.id})`);
          await db.update(materialRequestItems)
            .set({ productId: foundProduct.id })
            .where(eq(materialRequestItems.id, item.id));
          linkedCount++;
        } else {
          // Try spare parts - Prioritize exact matches
          const foundSpare = allSpares.find(sp => sp.name.toLowerCase() === sFullName) ||
                             allSpares.find(sp => sp.partNumber.toLowerCase() === sFullName) ||
                             (sItemOnly && allSpares.find(sp => sp.name.toLowerCase() === sItemOnly)) ||
                             (sItemOnly && allSpares.find(sp => sp.partNumber.toLowerCase() === sItemOnly)) ||
                             allSpares.find(sp => sp.name.toLowerCase() === sPartOnly) ||
                             allSpares.find(sp => sp.partNumber.toLowerCase() === sPartOnly);
          
          if (foundSpare) {
            console.log(`   ✅ Found Spare: ${foundSpare.name} (${foundSpare.id})`);
            await db.update(materialRequestItems)
              .set({ sparePartId: foundSpare.id })
              .where(eq(materialRequestItems.id, item.id));
            linkedCount++;
          } else {
             console.log(`   ❌ No match for: "${sName}"`);
          }
        }
      }

      res.json({ message: `Successfully linked ${linkedCount} items`, linkedCount });
    } catch (e) {
      console.error("Error retrying material request linking:", e);
      res.status(500).json({ error: "Failed to retry linking" });
    }
  });

  // POST create material request
  app.post("/api/material-requests", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { items, ...requestData } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const [newRequest] = await db.insert(materialRequests).values({
        ...requestData,
        requesterId: userId,
        requestNumber: `MR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      }).returning();

      if (items && Array.isArray(items) && items.length > 0) {
        const itemValues = items.map(item => ({
          ...item,
          requestId: newRequest.id,
        }));
        await db.insert(materialRequestItems).values(itemValues);
      }

      res.status(201).json(newRequest);
    } catch (e) {
      console.error("Error creating material request:", e);
      res.status(500).json({ error: "Failed to create material request" });
    }
  });

  // DELETE material request
  app.delete("/api/material-requests/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const [deleted] = await db.delete(materialRequests).where(eq(materialRequests.id, id)).returning();
      
      if (!deleted) {
        return res.status(404).json({ error: "Material request not found" });
      }

      res.status(204).end();
    } catch (e) {
      console.error("Error deleting material request:", e);
      res.status(500).json({ error: "Failed to delete material request" });
    }
  });
  
  // Generate RFQ from Material Request
  app.post("/api/material-requests/:id/generate-rfq", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { vendorIds } = req.body; // Array of supplier IDs
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
        return res.status(400).json({ error: "No vendors selected" });
      }

      // Fetch the material request and its items
      const [request] = await db.select().from(materialRequests).where(eq(materialRequests.id, id));
      if (!request) {
        return res.status(404).json({ error: "Material request not found" });
      }

      const items = await db
        .select({
          id: materialRequestItems.id,
          productId: materialRequestItems.productId,
          sparePartId: materialRequestItems.sparePartId,
          quantity: materialRequestItems.quantity,
          unit: materialRequestItems.unit,
          notes: materialRequestItems.notes,
          productName: products.name,
          productStock: products.stock,
          sparePartName: spareParts.name,
          sparePartStock: spareParts.stock,
        })
        .from(materialRequestItems)
        .leftJoin(products, eq(materialRequestItems.productId, products.id))
        .leftJoin(spareParts, eq(materialRequestItems.sparePartId, spareParts.id))
        .where(eq(materialRequestItems.requestId, id));

      if (items.length === 0) {
        return res.status(400).json({ error: "No items found in material request" });
      }

      // Filter only items with shortage and calculate shortage quantity
      const rfqItems = items.filter(item => {
        const stock = item.productId 
          ? (item.productStock ?? 0) 
          : (item.sparePartId ? (item.sparePartStock ?? 0) : 0);
        return stock < Number(item.quantity);
      });

      if (rfqItems.length === 0) {
        return res.status(400).json({ error: "All items in this request are already available in stock." });
      }

      const quotationItems = rfqItems.map(item => {
        const stock = item.productId 
          ? (item.productStock ?? 0) 
          : (item.sparePartId ? (item.sparePartStock ?? 0) : 0);
        const shortageQty = Math.max(0, Number(item.quantity) - stock);

        return {
          id: Math.random().toString(36).substr(2, 9),
          materialName: item.productName || item.sparePartName || item.notes || "Unknown Item",
          type: item.productId ? "Product" : (item.sparePartId ? "Spare Part" : "Manual"),
          designQty: shortageQty,
          rate: 0,
          amount: 0,
        };
      });

      const createdQuotations = [];

      for (const vendorId of vendorIds) {
        const quotationNumber = `RFQ-${request.requestNumber.replace('MR-', '')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        
        const [newQuotation] = await db.insert(vendorQuotations).values({
          quotationNumber,
          quotationDate: new Date(),
          status: "rfq",
          senderId: vendorId,
          userId: userId,
          quotationItems: quotationItems,
          totalAmount: "0",
          financialBreakdown: {
            subtotal: 0,
            gst: 0,
            total: 0
          },
          materialRequestId: id,
          notes: `Auto-generated from Material Request ${request.requestNumber}`,
        }).returning();

        createdQuotations.push(newQuotation);
      }

      // Update material request status to PROCESSING
      await db.update(materialRequests)
        .set({ status: "PROCESSING", updatedAt: new Date() })
        .where(eq(materialRequests.id, id));

      res.status(201).json(createdQuotations[0]);
    } catch (e) {
      console.error("Error generating RFQ:", e);
      res.status(500).json({ error: "Failed to generate RFQ" });
    }
  });

  // Release material and update inventory
  app.post("/api/material-requests/:id/release", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { items } = req.body; // Array of { productId, quantity }
      const userId = req.user?.id;

      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const [request] = await db.select().from(materialRequests).where(eq(materialRequests.id, id));
      if (!request) return res.status(404).json({ error: "Material request not found" });

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "No items provided for release" });
      }

      await db.transaction(async (tx) => {
        for (const item of items) {
          const { productId, sparePartId, quantity, location } = item;
          
          if (productId) {
            // Create a stock transaction (OUT)
            await tx.insert(stockTransactions).values({
              userId: userId,
              productId,
              type: 'out',
              reason: 'adjustment',
              referenceNumber: request.requestNumber,
              quantity: Number(quantity),
              notes: `Released for Material Request ${request.requestNumber} from ${location || 'Main Warehouse'}`,
            });

            // Update product stock balance
            await tx
              .update(products)
              .set({
                stock: sql`${products.stock} - ${Number(quantity)}`,
                updatedAt: new Date()
              })
              .where(eq(products.id, productId));

            // Update MR item status to FULFILLED
            await tx
              .update(materialRequestItems)
              .set({ status: 'FULFILLED' })
              .where(and(
                eq(materialRequestItems.requestId, id),
                eq(materialRequestItems.productId, productId)
              ));
          } else if (sparePartId) {
            // Create a stock transaction (OUT) for spare part
            await tx.insert(stockTransactions).values({
              userId: userId,
              productId: null, // Should we add sparePartId to stockTransactions table? 
              // For now, using referenceNumber to track
              type: 'out',
              reason: 'adjustment',
              referenceNumber: request.requestNumber,
              quantity: Number(quantity),
              notes: `Spare Part Released: ${request.requestNumber} from ${location || 'Main Warehouse'}`,
            });

            // Update spare part stock balance
            await tx
              .update(spareParts)
              .set({
                stock: sql`${spareParts.stock} - ${Number(quantity)}`,
              })
              .where(eq(spareParts.id, sparePartId));

            // Update MR item status to FULFILLED
            await tx
              .update(materialRequestItems)
              .set({ status: 'FULFILLED' })
              .where(and(
                eq(materialRequestItems.requestId, id),
                eq(materialRequestItems.sparePartId, sparePartId)
              ));
          }
        }

        // Update request status to FULFILLED
        await tx.update(materialRequests)
          .set({ status: "FULFILLED", updatedAt: new Date() })
          .where(eq(materialRequests.id, id));
      });

      res.status(200).json({ message: "Materials released successfully" });
    } catch (e) {
      console.error("Error releasing materials:", e);
      res.status(500).json({ error: "Failed to release materials" });
    }
  });

  // --- VENDOR QUOTATION ROUTES ---

  // GET all vendor quotations
  app.get("/api/vendor-quotations", requireAuth, async (_req, res) => {
    try {
      const rows = await db
        .select()
        .from(vendorQuotations)
        .orderBy(sql`${vendorQuotations.createdAt} DESC`);
      res.json(rows);
    } catch (e) {
      console.error("Error fetching vendor quotations:", e);
      res.status(500).json({ error: "Failed to fetch vendor quotations" });
    }
  });

  // POST create vendor quotation (RFQ)
  app.post("/api/vendor-quotations", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const body = { ...req.body };
      
      // Coerce dates
      if (body.quotationDate) body.quotationDate = new Date(body.quotationDate);
      if (body.validUntil) body.validUntil = new Date(body.validUntil);

      const validatedData = insertVendorQuotationSchema.parse({
        ...body,
        userId: body.userId || req.user?.id,
      });

      const [newQuotation] = await db
        .insert(vendorQuotations)
        .values(validatedData)
        .returning();

      res.status(201).json(newQuotation);
    } catch (e: any) {
      console.error("❌ Error creating vendor quotation:");
      if (e instanceof Error) {
        console.error("Message:", e.message);
        console.error("Stack:", e.stack);
      } else {
        console.error(String(e));
      }
      
      if (e.errors) {
        try {
          console.error("Validation errors details:", JSON.stringify(e.errors));
        } catch (jsonErr) {
          console.error("Could not stringify validation errors");
        }
      }
      
      res.status(400).json({ 
        error: "Invalid vendor quotation data", 
        details: e.errors || (e instanceof Error ? e.message : String(e))
      });
    }
  });

  // PATCH update vendor quotation
  app.patch("/api/vendor-quotations/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const body = req.body;
      
      const [updated] = await db
        .update(vendorQuotations)
        .set({
          ...body,
          updatedAt: new Date()
        })
        .where(eq(vendorQuotations.id, id))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ error: "Vendor quotation not found" });
      }

      res.json(updated);
    } catch (e) {
      console.error("Error updating vendor quotation:", e);
      res.status(500).json({ error: "Failed to update vendor quotation" });
    }
  });

  // DELETE vendor quotation
  app.delete("/api/vendor-quotations/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const [deleted] = await db
        .delete(vendorQuotations)
        .where(eq(vendorQuotations.id, id))
        .returning();
      
      if (!deleted) {
        return res.status(404).json({ error: "Vendor quotation not found" });
      }

      res.status(204).end();
    } catch (e) {
      console.error("Error deleting vendor quotation:", e);
      res.status(500).json({ error: "Failed to delete vendor quotation" });
    }
  });

  // GET - generate RFQ PDF for vendor quotation
  app.get("/api/vendor-quotations/:id/pdf", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      // Fetch quotation with supplier
      const [quotation] = await db
        .select({
          q: vendorQuotations,
          supplier: suppliers,
        })
        .from(vendorQuotations)
        .leftJoin(suppliers, eq(vendorQuotations.senderId, suppliers.id))
        .where(eq(vendorQuotations.id, id));

      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }

      // Calculate totals
      const subtotal = parseFloat(quotation.q.totalAmount || "0") / 1.18;
      const gst = parseFloat(quotation.q.totalAmount || "0") - subtotal;
      const grandTotal = parseFloat(quotation.q.totalAmount || "0");

      const pdfData = {
        company: {
          name: "HOTTIP INDIA POLYMERS",
          address: "Gat no 209, Office No 406, Swaraj Capital Borhadewadi, Chikhali Moshi Road, Pune 412105",
          gstNo: "27AQYPM1029M1Z6",
          email: "sales@hottipindia.com",
          phone: "+91-9028018877",
          website: "www.hottipindia.com"
        },
        supplier: {
          name: quotation.supplier?.name || "N/A",
          address: quotation.supplier?.address || "N/A",
          gstNo: quotation.supplier?.gstNumber || "N/A",
          phone: quotation.supplier?.phone || "N/A",
          email: quotation.supplier?.email || "N/A"
        },
        // For compatibility with quotation-hottip.ejs if we switch, or keeping RFQ
        rfq: {
          quotationNumber: quotation.q.quotationNumber,
          date: quotation.q.quotationDate ? new Date(quotation.q.quotationDate).toLocaleDateString("en-IN") : "N/A",
          validUntil: quotation.q.validUntil ? new Date(quotation.q.validUntil).toLocaleDateString("en-IN") : "N/A",
          subject: quotation.q.subject || "Request for Quotation",
          notes: quotation.q.notes || "",
          items: (quotation.q.quotationItems as any[]) || []
        },
        // For direct quotation template use
        quotation: {
          ...quotation.q,
          customerName: quotation.supplier?.name,
          customerAddress: quotation.supplier?.address,
          customerGstNo: quotation.supplier?.gstNumber,
          customerPhone: quotation.supplier?.phone,
          customerEmail: quotation.supplier?.email,
          basicAmount: subtotal,
          gst: gst,
          grandTotal: grandTotal,
          quotationItems: (quotation.q.quotationItems as any[])?.map(item => ({
            ...item,
            partDescription: item.materialName,
            qty: item.designQty,
            amount: item.amount || (item.designQty * item.rate)
          }))
        }
      };

      // Use the professional template for Received/Approved quotes
      const isRFQ = quotation.q.status === 'rfq';
      const pdfBuffer = isRFQ 
        ? await generateRFQPDF(pdfData as any)
        : await generateRFQPDF(pdfData as any); // Default to RFQ for now, but with updated company info

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", pdfBuffer.length);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${quotation.q.status === 'rfq' ? 'RFQ' : 'QUO'}-${quotation.q.quotationNumber}.pdf`
      );
      res.end(pdfBuffer);
    } catch (error) {
      console.error("Error generating RFQ PDF:", error);
      res.status(500).json({ error: "Failed to generate RFQ PDF" });
    }
  });

  // --- PURCHASE ORDER ROUTES ---

  // GET all purchase orders
  app.get("/api/purchase-orders", requireAuth, async (_req, res) => {
    try {
      const rows = await db
        .select({
          ...purchaseOrders,
          hasInvoice: sql`EXISTS (SELECT 1 FROM accounts_payables WHERE "poId" = ${purchaseOrders.id})`,
          hasShipment: sql`EXISTS (SELECT 1 FROM logistics_shipments WHERE "poNumber" = ${purchaseOrders.poNumber})`
        })
        .from(purchaseOrders)
        .orderBy(sql`${purchaseOrders.createdAt} DESC`);
      res.json(rows);
    } catch (e) {
      console.error("Error fetching purchase orders:", e);
      res.status(500).json({ error: "Failed to fetch purchase orders" });
    }
  });

  // GET purchase order details
  app.get("/api/purchase-orders/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const [order] = await db
        .select({
          ...purchaseOrders,
          hasInvoice: sql`EXISTS (SELECT 1 FROM accounts_payables WHERE "poId" = ${purchaseOrders.id})`,
          hasShipment: sql`EXISTS (SELECT 1 FROM logistics_shipments WHERE "poNumber" = ${purchaseOrders.poNumber})`
        })
        .from(purchaseOrders)
        .where(eq(purchaseOrders.id, id));

      if (!order) {
        return res.status(404).json({ error: "Purchase order not found" });
      }

      const items = await db
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.purchaseOrderId, id));

      res.json({ ...order, items });
    } catch (e) {
      console.error("Error fetching purchase order details:", e);
      res.status(500).json({ error: "Failed to fetch purchase order details" });
    }
  });

  // POST create purchase order
  app.post("/api/purchase-orders", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { items, ...orderData } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Convert date string to Date object
      if (orderData.orderDate) {
        orderData.orderDate = new Date(orderData.orderDate);
      }

      const validatedData = insertPurchaseOrderSchema.parse({
        ...orderData,
        userId,
        items,
      });

      const { items: validatedItems, ...dbOrderData } = validatedData;

      const [newOrder] = await db
        .insert(purchaseOrders)
        .values(dbOrderData)
        .returning();

      if (validatedItems && validatedItems.length > 0) {
        const itemValues = validatedItems.map((item) => ({
          ...item,
          purchaseOrderId: newOrder.id,
          amount: String(Number(item.quantity) * Number(item.unitPrice)),
          unitPrice: String(item.unitPrice),
          quantity: Number(item.quantity),
        }));
        await db.insert(purchaseOrderItems).values(itemValues);
      }

      res.status(201).json(newOrder);
    } catch (e: any) {
      console.error("Error creating purchase order:", e);
      res.status(400).json({ 
        error: "Invalid purchase order data", 
        details: e.errors || e.message 
      });
    }
  });

  // DELETE purchase order
  app.delete("/api/purchase-orders/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const [deleted] = await db
        .delete(purchaseOrders)
        .where(eq(purchaseOrders.id, id))
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: "Purchase order not found" });
      }

      res.status(204).end();
    } catch (e) {
      console.error("Error deleting purchase order:", e);
      res.status(500).json({ error: "Failed to delete purchase order" });
    }
  });

  // GET - generate purchase order PDF
  app.get("/api/purchase-orders/:id/pdf", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      // Fetch purchase order with items and supplier
      const [order] = await db
        .select({
          po: purchaseOrders,
          supplier: suppliers,
        })
        .from(purchaseOrders)
        .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
        .where(eq(purchaseOrders.id, id));

      if (!order) {
        return res.status(404).json({ error: "Purchase order not found" });
      }

      const items = await db
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.purchaseOrderId, id));

      const totalAmount = Number(order.po.totalAmount);
      const subtotal = items.reduce((sum, item) => sum + Number(item.amount), 0);
      const taxAmount = totalAmount - subtotal;

      const pdfData = {
        company: {
          name: "HOTTIP INVENTORY SYSTEM",
          address: "Main Office, Industrial Area, Phase 1",
          gstNo: "27AAACH1234A1Z1",
          email: "procurement@hottip.com",
          phone: "+91-9876543210"
        },
        supplier: {
          name: order.supplier?.name || "N/A",
          address: order.supplier?.address || "N/A",
          gstNo: order.supplier?.gstNumber || "N/A",
          phone: order.supplier?.phone || "N/A",
          email: order.supplier?.email || "N/A"
        },
        po: {
          poNumber: order.po.poNumber,
          date: order.po.orderDate ? new Date(order.po.orderDate).toLocaleDateString() : "N/A",
          deliveryPeriod: order.po.expectedDelivery || "N/A",
          subtotal: Number(subtotal) || 0,
          gstAmount: Number(taxAmount) || 0,
          total: Number(totalAmount) || 0,
          amountInWords: numberToWords(Number(totalAmount) || 0),
          notes: order.po.notes || "",
          items: items.map(item => ({
            description: item.itemName,
            hsn: item.description || "N/A",
            quantity: Number(item.quantity) || 0,
            unit: item.unit || "pcs",
            rate: Number(item.unitPrice) || 0,
            amount: Number(item.amount) || 0
          }))
        }
      };

      const pdfBuffer = await generatePurchaseOrderPDF(pdfData as any);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", pdfBuffer.length);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=PO-${order.po.poNumber}.pdf`
      );
      res.end(pdfBuffer);
    } catch (error) {
      console.error("Error generating PO PDF:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  // POST - send purchase order to accounts payables
  app.post("/api/purchase-orders/:id/send-to-accounts", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const [order] = await db
        .select()
        .from(purchaseOrders)
        .where(eq(purchaseOrders.id, id));

      if (!order) {
        return res.status(404).json({ error: "Purchase order not found" });
      }

      // Check if already sent
      const [existing] = await db
        .select()
        .from(accountsPayables)
        .where(eq(accountsPayables.poId, id));

      if (existing) {
        return res.status(400).json({ error: "Already sent to accounts" });
      }

      // Create accounts payable entry
      await db.insert(accountsPayables).values({
        supplierId: order.supplierId,
        poId: order.id,
        amountDue: order.totalAmount,
        amountPaid: "0",
        dueDate: new Date(), // Use current as default
        status: "pending",
        notes: `Auto-generated from PO: ${order.poNumber}`,
      });

      // Update PO status
      await db
        .update(purchaseOrders)
        .set({ status: "processing" })
        .where(eq(purchaseOrders.id, id));

      res.json({ success: true, message: "Successfully sent to accounts" });
    } catch (error) {
      console.error("Error sending to accounts:", error);
      res.status(500).json({ error: "Failed to send to accounts" });
    }
  });

  // POST - create shipment for purchase order
  app.post("/api/purchase-orders/:id/create-shipment", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      const [order] = await db
        .select()
        .from(purchaseOrders)
        .where(eq(purchaseOrders.id, id));

      if (!order) {
        return res.status(404).json({ error: "Purchase order not found" });
      }

      // Check if already has a shipment
      const [existing] = await db
        .select()
        .from(logisticsShipments)
        .where(eq(logisticsShipments.poNumber, order.poNumber));

      if (existing) {
        return res.status(400).json({ error: "Shipment already exists for this PO" });
      }

      // Create shipment record
      const [newShipment] = await db.insert(logisticsShipments).values({
        consignmentNumber: `SHIP-${Math.floor(100000 + Math.random() * 900000)}`,
        poNumber: order.poNumber,
        source: "Vendor Warehouse",
        destination: "Main Warehouse",
        vendorId: order.supplierId,
        currentStatus: "created",
        createdBy: req.user?.id,
        items: [], // Could be populated from PO items
        notes: `Auto-generated from PO: ${order.poNumber}`,
      }).returning();

      // Update PO status
      await db
        .update(purchaseOrders)
        .set({ status: "shipped" })
        .where(eq(purchaseOrders.id, id));

      res.json({ success: true, shipment: newShipment });
    } catch (error) {
      console.error("Error creating shipment:", error);
      res.status(500).json({ error: "Failed to create shipment" });
    }
  });

  // POST retry linking for unlinked material request items
  app.post("/api/material-requests/:id/retry-linking", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      
      const unlinkedItems = await db.select()
        .from(materialRequestItems)
        .where(and(
          eq(materialRequestItems.requestId, id),
          isNull(materialRequestItems.productId),
          isNull(materialRequestItems.sparePartId)
        ));
      
      if (unlinkedItems.length === 0) {
        return res.json({ message: "No unlinked items found" });
      }

      let linkedCount = 0;
      for (const item of unlinkedItems) {
        const rawName = (item.notes || "").trim();
        if (!rawName) continue;

        const sName = rawName.toLowerCase();
        const sSku = rawName.includes('(') ? rawName.split('(')[0].trim().toLowerCase() : sName;
        const sPureName = rawName.includes('(') ? rawName.split('(')[1].split(')')[0].trim().toLowerCase() : sName;

        // Try to find product
        const matchedProducts = await db.select({
            id: products.id,
            name: products.name,
            sku: products.sku
          }).from(products);
        
        const foundProduct = matchedProducts.find(p => {
          const pName = p.name.toLowerCase();
          const pSku = p.sku.toLowerCase();
          return pName === sName || 
                 pSku === sName || 
                 pSku === sSku || 
                 pName === sPureName ||
                 (sName.includes(pSku) && pSku.length > 3) ||
                 (pName.includes(sPureName) && sPureName.length > 3);
        });
        
        if (foundProduct) {
          await db.update(materialRequestItems)
            .set({ productId: foundProduct.id })
            .where(eq(materialRequestItems.id, item.id));
          linkedCount++;
        } else {
          // Try spare parts
          const matchedSpares = await db.select({
              id: spareParts.id,
              name: spareParts.name,
              partNumber: spareParts.partNumber
            }).from(spareParts);
          
          const foundSpare = matchedSpares.find(sp => {
            const spName = sp.name.toLowerCase();
            const spPart = sp.partNumber.toLowerCase();
            return spName === sName || 
                   spPart === sName || 
                   spPart === sSku || 
                   spName === sPureName ||
                   (sName.includes(spPart) && spPart.length > 3) ||
                   (spName.includes(sPureName) && sPureName.length > 3);
          });
          
          if (foundSpare) {
            await db.update(materialRequestItems)
              .set({ sparePartId: foundSpare.id })
              .where(eq(materialRequestItems.id, item.id));
            linkedCount++;
          }
        }
      }

      res.json({ 
        message: `Linked ${linkedCount} out of ${unlinkedItems.length} items`,
        linkedCount
      });
    } catch (error) {
      console.error("Error retrying linking:", error);
      res.status(500).json({ error: "Failed to retry linking" });
    }
  });
}
