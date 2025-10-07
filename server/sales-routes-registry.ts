import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import {
  customers as customersTable,
  outboundQuotations,
  insertOutboundQuotationSchema,
} from "@shared/schema";
import { storage } from "./storage";

interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string; username: string };
}

export function registerSalesRoutes(
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

  // Sales dashboard minimal endpoints
  // Customers CRUD
  app.get("/api/customers", requireAuth, async (_req, res) => {
    try {
      const rows = await storage.getCustomers();
      console.log("rows", rows);
      res.json(rows);
    } catch (e: any) {
      console.error("❌ Error in /api/customers:", e);
      res
        .status(500)
        .json({ error: "Failed to fetch customers", details: e.message });
    }
  });
  app.post("/api/customers", requireAuth, async (req, res) => {
    try {
      const customerData = req.body;
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error: any) {
      res.status(400).json({
        error: "Invalid customer data",
        details: error.errors || error.message,
      });
    }
  });

  app.put("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const updateData = req.body;
      const customer = await storage.updateCustomer(id, updateData);
      res.json(customer);
    } catch (error: any) {
      res.status(400).json({
        error: "Failed to update customer",
        details: error.errors || error.message,
      });
    }
  });

  app.delete("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteCustomer(id);
      res.status(204).end();
    } catch (error: any) {
      res.status(400).json({
        error: "Failed to delete customer",
        details: error.errors || error.message,
      });
    }
  });

  // Alias routes for /api/clients (frontend compatibility)
  app.get("/api/clients", requireAuth, async (_req, res) => {
    try {
      const rows = await storage.getCustomers();
      console.log("rows", rows);
      res.json(rows);
    } catch (e: any) {
      console.error("❌ Error in /api/clients:", e);
      res
        .status(500)
        .json({ error: "Failed to fetch clients", details: e.message });
    }
  });

  app.post("/api/clients", requireAuth, async (req, res) => {
    try {
      const customerData = req.body;
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error: any) {
      res.status(400).json({
        error: "Invalid client data",
        details: error.errors || error.message,
      });
    }
  });

  app.put("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const updateData = req.body;
      const customer = await storage.updateCustomer(id, updateData);
      res.json(customer);
    } catch (error: any) {
      res.status(400).json({
        error: "Failed to update client",
        details: error.errors || error.message,
      });
    }
  });

  app.delete("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteCustomer(id);
      res.status(204).end();
    } catch (error: any) {
      res.status(400).json({
        error: "Failed to delete client",
        details: error.errors || error.message,
      });
    }
  });

  // Placeholder orders endpoints for UI. You can wire to real tables later.
  const orders: any[] = [];

  app.get("/api/orders", requireAuth, async (_req, res) => {
    res.json(orders);
  });

  app.post("/api/orders", requireAuth, async (req, res) => {
    try {
      const body = req.body || {};
      const newOrder = {
        id: String(Date.now()),
        orderNumber: `ORD-${Date.now()}`,
        customer: {
          id: body.customerId,
          name:
            (await db.select().from(customersTable)).find(
              (c) => c.id === Number(body.customerId)
            )?.name ?? "Customer",
        },
        totalAmount: body.totalAmount ?? 0,
        taxAmount: body.taxAmount ?? 0,
        discountAmount: body.discountAmount ?? 0,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      orders.push(newOrder);
      res.status(201).json(newOrder);
    } catch (e) {
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.put("/api/orders/:id", requireAuth, async (req, res) => {
    const idx = orders.findIndex((o) => o.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Order not found" });
    orders[idx] = { ...orders[idx], ...req.body };
    res.json(orders[idx]);
  });

  // Outbound Quotations CRUD
  app.get("/api/outbound-quotations", requireAuth, async (_req, res) => {
    try {
      const quotations = await storage.getOutboundQuotations();
      res.json(quotations);
    } catch (e: any) {
      console.error("❌ Error in /api/outbound-quotations:", e);
      res.status(500).json({
        error: "Failed to fetch outbound quotations",
        details: e.message,
      });
    }
  });

  app.post("/api/outbound-quotations", requireAuth, async (req, res) => {
    try {
      const quotationData = insertOutboundQuotationSchema.parse(req.body);
      const quotation = await storage.createOutboundQuotation(quotationData);
      res.status(201).json(quotation);
    } catch (error: any) {
      console.error("❌ Error in POST /api/outbound-quotations:", error);
      res.status(400).json({
        error: "Invalid outbound quotation data",
        details: error.errors || error.message,
      });
    }
  });

  app.put("/api/outbound-quotations/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const updateData = req.body;
      const quotation = await storage.updateOutboundQuotation(id, updateData);
      res.json(quotation);
    } catch (error: any) {
      console.error("❌ Error in PUT /api/outbound-quotations/:id:", error);
      res.status(400).json({
        error: "Failed to update outbound quotation",
        details: error.errors || error.message,
      });
    }
  });

  // PDF Generation Endpoint for Outbound Quotations
  app.get("/api/outbound-quotations/:id/pdf", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const quotation = await storage.getOutboundQuotation(id);
      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }

      // Get customer details for the quotation
      const customers = await storage.getCustomers();
      const customer = customers.find((c) => c.id === quotation.customerId);

      // Calculate financial totals
      const basicAmount =
        quotation.moldDetails?.reduce((sum: number, part: any) => {
          return (
            sum +
            (part.quotation_spare_parts?.reduce(
              (partSum: number, sp: any) =>
                partSum + (sp.qty || 0) * (sp.unitPrice || 0),
              0
            ) || 0)
          );
        }, 0) ||
        quotation.subtotalAmount ||
        0;

      const gstPercentage = quotation.gstPercentage || 18;
      const gst = (basicAmount * gstPercentage) / 100;
      const grandTotal = basicAmount + gst;

      // Generate PDF using Puppeteer and EJS
      const puppeteer = await import("puppeteer");
      const ejs = await import("ejs");
      const path = await import("path");

      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();

      // Render EJS template
      const templatePath = path.join(
        process.cwd(),
        "server",
        "templates",
        "quotation-hottip.ejs"
      );
      const html = await ejs.renderFile(templatePath, {
        quotation,
        customer,
        basicAmount,
        gst,
        grandTotal,
      });

      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
      });

      await browser.close();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="quotation_${quotation.quotationNumber}.pdf"`
      );
      res.send(pdf);
    } catch (error: any) {
      console.error("❌ Error in GET /api/outbound-quotations/:id/pdf:", error);
      res
        .status(500)
        .json({ error: "Failed to generate PDF", details: error.message });
    }
  });

  // Delete Outbound Quotation
  app.delete("/api/outbound-quotations/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteOutboundQuotation(id);
      res.status(204).end();
    } catch (error: any) {
      console.error("❌ Error in DELETE /api/outbound-quotations/:id:", error);
      res.status(400).json({
        error: "Failed to delete outbound quotation",
        details: error.errors || error.message,
      });
    }
  });

  // Invoices CRUD (placeholder for future implementation)
  app.get("/api/invoices", requireAuth, async (_req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (e: any) {
      console.error("❌ Error in /api/invoices:", e);
      res.status(500).json({
        error: "Failed to fetch invoices",
        details: e.message,
      });
    }
  });
}