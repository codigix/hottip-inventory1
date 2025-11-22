import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { db } from "./db";
import {
  customers as customersTable,
  outboundQuotations,
  insertOutboundQuotationSchema,
  invoices,
  invoiceItems,
  insertInvoiceSchema,
  invoiceStatus,
  customers,
  users,
} from "@shared/schema";
import { storage } from "./storage";
import { ObjectNotFoundError, ObjectStorageService } from "./objectStorage";
import puppeteer from "puppeteer";
import ejs from "ejs";
import path from "path";
import * as XLSX from "xlsx";
import { generateInvoicePDF } from "./pdf-generator";
import { and, eq } from "drizzle-orm";

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
  const objectStorage = new ObjectStorageService();

  app.get("/api/inbound-quotations", requireAuth, async (_req, res) => {
    try {
      const quotations = await storage.getInboundQuotations();
      res.json(quotations);
    } catch (error) {
      console.error("❌ Error in GET /api/inbound-quotations:", error);
      res.status(500).json({ error: "Failed to fetch inbound quotations" });
    }
  });

  app.get("/api/inbound-quotations/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const quotation = await storage.getInboundQuotation(id);

      if (!quotation) {
        return res.status(404).json({ error: "Inbound quotation not found" });
      }

      if (!quotation.attachmentPath) {
        return res
          .status(404)
          .json({ error: "Quotation attachment not available" });
      }

      try {
        const file = await objectStorage.getObjectEntityFile(
          quotation.attachmentPath
        );
        const [metadata] = await file.getMetadata();

        // Set response headers for inline PDF viewing
        res.setHeader(
          "Content-Type",
          metadata.contentType || "application/pdf"
        );
        if (metadata.size) {
          res.setHeader("Content-Length", metadata.size.toString());
        }
        const filename = quotation.attachmentName || "quotation.pdf";
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${filename.replace(/"/g, "")}"`
        );

        const stream = file.createReadStream();

        stream.on("error", (error) => {
          console.error("❌ Error streaming quotation attachment:", error);
          if (!res.headersSent) {
            res
              .status(500)
              .json({ error: "Failed to stream quotation attachment" });
          }
        });

        stream.pipe(res);
      } catch (error) {
        if (error instanceof ObjectNotFoundError) {
          console.warn(
            `⚠️ Inbound quotation attachment missing for quotation ${id}`
          );
          return res
            .status(404)
            .json({ error: "Quotation attachment not found" });
        }

        console.error("❌ Unexpected error loading attachment:", error);
        return res
          .status(500)
          .json({ error: "Failed to load quotation attachment" });
      }
    } catch (error) {
      console.error("❌ Error in GET /api/inbound-quotations/:id:", error);
      res.status(500).json({ error: "Failed to fetch inbound quotation" });
    }
  });

  app.post("/api/invoices", requireAuth, async (req, res) => {
    console.log("🟢 Received POST /api/invoices");

    try {
      const payload = insertInvoiceSchema.parse(req.body);
      console.log("✅ Invoice data validated");

      const userExists = await db.query.users.findFirst({
        where: (user, { eq }) => eq(user.id, payload.userId),
      });

      if (!userExists) {
        console.error("❌ User not found:", payload.userId);
        return res.status(400).json({
          error: "Invalid user ID",
          details: `User with ID ${payload.userId} does not exist.`,
        });
      }

      const customerExists = await db.query.customers.findFirst({
        where: (customer, { eq }) => eq(customer.id, payload.customerId),
      });

      if (!customerExists) {
        console.error("❌ Customer not found:", payload.customerId);
        return res.status(400).json({
          error: "Invalid customer ID",
          details: `Customer with ID ${payload.customerId} does not exist.`,
        });
      }

      if (payload.quotationId) {
        const quotationExists = await db.query.outboundQuotations.findFirst({
          where: (quotation, { eq }) => eq(quotation.id, payload.quotationId),
        });

        if (!quotationExists) {
          console.error("❌ Quotation not found:", payload.quotationId);
          return res.status(400).json({
            error: "Invalid quotation ID",
            details: `Quotation with ID ${payload.quotationId} does not exist.`,
          });
        }
      }

      const createdInvoice = await db.transaction(async (tx) => {
        const [invoiceRow] = await tx
          .insert(invoices)
          .values({
            invoiceNumber: payload.invoiceNumber,
            quotationId: payload.quotationId ?? null,
            customerId: payload.customerId,
            userId: payload.userId,
            status: payload.status ?? "draft",
            invoiceDate: new Date(payload.invoiceDate),
            dueDate: new Date(payload.dueDate),
            subtotalAmount: payload.subtotalAmount,
            cgstRate: payload.cgstRate ?? 0,
            cgstAmount: payload.cgstAmount ?? 0,
            sgstRate: payload.sgstRate ?? 0,
            sgstAmount: payload.sgstAmount ?? 0,
            igstRate: payload.igstRate ?? 0,
            igstAmount: payload.igstAmount ?? 0,
            discountAmount: payload.discountAmount ?? 0,
            totalAmount: payload.totalAmount,
            balanceAmount: payload.balanceAmount ?? payload.totalAmount,
            billingAddress: payload.billingAddress ?? null,
            shippingAddress: payload.shippingAddress ?? null,
            billingGstNumber: payload.billingGstNumber ?? null,
            placeOfSupply: payload.placeOfSupply ?? null,
            paymentTerms: payload.paymentTerms ?? null,
            deliveryTerms: payload.deliveryTerms ?? null,
            transporterName: payload.transporterName ?? null,
            ewayBillNumber: payload.ewayBillNumber ?? null,
            amountInWords: payload.amountInWords ?? null,
            notes: payload.notes ?? null,
            packingFee: payload.packingFee ?? 0,
            shippingFee: payload.shippingFee ?? 0,
            otherCharges: payload.otherCharges ?? 0,
          })
          .returning();

        console.log("💾 Invoice created with ID:", invoiceRow.id);

        const lineItems = payload.lineItems ?? [];
        if (lineItems.length > 0) {
          const itemsToInsert = lineItems.map((item) => ({
            invoiceId: invoiceRow.id,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit ?? "pcs",
            unitPrice: item.unitPrice,
            hsnSac: item.hsnSac ?? null,
            cgstRate: item.cgstRate ?? null,
            sgstRate: item.sgstRate ?? null,
            igstRate: item.igstRate ?? null,
            amount: item.amount ?? item.unitPrice * item.quantity,
          }));

          await tx.insert(invoiceItems).values(itemsToInsert);
          console.log(`📦 ${itemsToInsert.length} line item(s) added`);
        } else {
          console.log("ℹ️ No line items provided, skipping insert");
        }

        return invoiceRow.id;
      });

      console.log("✅ Transaction committed successfully");

      const invoiceWithDetails = await db.query.invoices.findFirst({
        where: (invoice, { eq }) => eq(invoice.id, createdInvoice),
        with: {
          invoiceItems: true,
        },
      });

      if (!invoiceWithDetails) {
        throw new Error("Invoice retrieval failed after insert");
      }

      const normalizeNumber = (value: unknown) => {
        if (value === null || value === undefined) return 0;
        if (typeof value === "number") return value;
        if (typeof value === "bigint") return Number(value);
        const parsed = Number(value);
        return Number.isNaN(parsed) ? 0 : parsed;
      };

      const formatDate = (value: Date | string | null | undefined) => {
        if (!value) return "";
        const date = value instanceof Date ? value : new Date(value);
        return Number.isNaN(date.getTime())
          ? ""
          : date.toISOString().split("T")[0];
      };

      const responsePayload = {
        invoiceNumber: invoiceWithDetails.invoiceNumber,
        customerId: invoiceWithDetails.customerId,
        userId: invoiceWithDetails.userId,
        invoiceDate: formatDate(invoiceWithDetails.invoiceDate),
        dueDate: formatDate(invoiceWithDetails.dueDate),
        subtotalAmount: normalizeNumber(
          invoiceWithDetails.subtotalAmount ?? payload.subtotalAmount ?? 0
        ),
        discountAmount: normalizeNumber(
          invoiceWithDetails.discountAmount ?? payload.discountAmount ?? 0
        ),
        cgstRate: normalizeNumber(
          invoiceWithDetails.cgstRate ?? payload.cgstRate ?? 0
        ),
        cgstAmount: normalizeNumber(
          invoiceWithDetails.cgstAmount ?? payload.cgstAmount ?? 0
        ),
        sgstRate: normalizeNumber(
          invoiceWithDetails.sgstRate ?? payload.sgstRate ?? 0
        ),
        sgstAmount: normalizeNumber(
          invoiceWithDetails.sgstAmount ?? payload.sgstAmount ?? 0
        ),
        igstRate: normalizeNumber(
          invoiceWithDetails.igstRate ?? payload.igstRate ?? 0
        ),
        igstAmount: normalizeNumber(
          invoiceWithDetails.igstAmount ?? payload.igstAmount ?? 0
        ),
        totalAmount: normalizeNumber(
          invoiceWithDetails.totalAmount ?? payload.totalAmount ?? 0
        ),
        balanceAmount: normalizeNumber(
          invoiceWithDetails.balanceAmount ?? payload.balanceAmount ?? 0
        ),
        billingAddress:
          invoiceWithDetails.billingAddress ?? payload.billingAddress ?? "",
        shippingAddress:
          invoiceWithDetails.shippingAddress ?? payload.shippingAddress ?? "",
        billingGstNumber:
          invoiceWithDetails.billingGstNumber ?? payload.billingGstNumber ?? "",
        placeOfSupply:
          invoiceWithDetails.placeOfSupply ?? payload.placeOfSupply ?? "",
        paymentTerms:
          invoiceWithDetails.paymentTerms ?? payload.paymentTerms ?? "",
        deliveryTerms:
          invoiceWithDetails.deliveryTerms ?? payload.deliveryTerms ?? "",
        transporterName:
          invoiceWithDetails.transporterName ?? payload.transporterName ?? "",
        ewayBillNumber:
          invoiceWithDetails.ewayBillNumber ?? payload.ewayBillNumber ?? "",
        amountInWords:
          invoiceWithDetails.amountInWords ?? payload.amountInWords ?? "",
        notes: invoiceWithDetails.notes ?? payload.notes ?? "",
        packingFee: normalizeNumber(
          invoiceWithDetails.packingFee ?? payload.packingFee ?? 0
        ),
        shippingFee: normalizeNumber(
          invoiceWithDetails.shippingFee ?? payload.shippingFee ?? 0
        ),
        otherCharges: normalizeNumber(
          invoiceWithDetails.otherCharges ?? payload.otherCharges ?? 0
        ),
        lineItems: invoiceWithDetails.invoiceItems.map((item) => ({
          description: item.description,
          hsnSac: item.hsnSac ?? "",
          quantity: normalizeNumber(item.quantity),
          unit: item.unit ?? "pcs",
          unitPrice: normalizeNumber(item.unitPrice),
          cgstRate: normalizeNumber(item.cgstRate),
          sgstRate: normalizeNumber(item.sgstRate),
          igstRate: normalizeNumber(item.igstRate),
          amount:
            item.amount !== undefined && item.amount !== null
              ? normalizeNumber(item.amount)
              : normalizeNumber(item.unitPrice) *
                normalizeNumber(item.quantity),
        })),
      };

      res.status(201).json({
        message: "Invoice created successfully",
        invoice: responsePayload,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        console.error("❌ Validation error:", error.errors);
        res.status(400).json({
          error: "Invalid invoice data",
          details: error.errors,
        });
        return;
      }

      if (error?.code === "23505") {
        const attemptedInvoiceNumber = req.body?.invoiceNumber;
        console.error(
          "❌ Duplicate invoice number detected:",
          attemptedInvoiceNumber,
          error.detail
        );
        res.status(409).json({
          error: "Invoice number already exists",
          details: attemptedInvoiceNumber
            ? `Invoice number ${attemptedInvoiceNumber} is already in use.`
            : "Invoice number is already in use.",
        });
        return;
      }

      console.error("❌ Internal error creating invoice:", error);
      res.status(500).json({
        error: "Failed to create invoice",
        details: error.message,
      });
    }
  });

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
  app.get("/api/outbound-quotations", requireAuth, async (req, res) => {
    try {
      console.log("📋 Fetching outbound quotations with filters:", req.query);

      // Get all quotations
      let quotations = await storage.getOutboundQuotations();
      console.log(`📋 Total quotations in database: ${quotations.length}`);

      // Apply filters based on query parameters
      // Filter by customer ID
      if (req.query.customerId && req.query.customerId !== "") {
        console.log(`🔍 Filtering by customerId: ${req.query.customerId}`);
        quotations = quotations.filter(
          (q) => q.customerId === req.query.customerId
        );
        console.log(
          `   After customer filter: ${quotations.length} quotations`
        );
      }

      // Filter by status (case-insensitive)
      if (req.query.status) {
        console.log(`🔍 Filtering by status: ${req.query.status}`);
        const statusFilter = (req.query.status as string).toLowerCase();
        quotations = quotations.filter(
          (q) => q.status.toLowerCase() === statusFilter
        );
        console.log(`   After status filter: ${quotations.length} quotations`);
      }

      // Filter by date range
      if (req.query.startDate) {
        const startDate = new Date(req.query.startDate as string);
        startDate.setHours(0, 0, 0, 0); // Start of day
        console.log(`📅 Filtering by startDate: ${startDate.toISOString()}`);
        quotations = quotations.filter((q) => {
          const quotationDate = new Date(q.quotationDate);
          return quotationDate >= startDate;
        });
        console.log(
          `   After startDate filter: ${quotations.length} quotations`
        );
      }

      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate as string);
        endDate.setHours(23, 59, 59, 999); // Include the entire end date
        console.log(`📅 Filtering by endDate: ${endDate.toISOString()}`);
        quotations = quotations.filter((q) => {
          const quotationDate = new Date(q.quotationDate);
          return quotationDate <= endDate;
        });
        console.log(`   After endDate filter: ${quotations.length} quotations`);
      }

      console.log(`✅ Returning ${quotations.length} filtered quotations`);
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
    let browser;
    try {
      const id = req.params.id;
      console.log(`📄 Generating PDF for quotation: ${id}`);

      const quotation = await storage.getOutboundQuotation(id);
      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }

      // Get customer details for the quotation
      const customers = await storage.getCustomers();
      const customer = customers.find((c) => c.id === quotation.customerId);

      // Calculate financial totals from quotationItems
      const basicAmount =
        quotation.quotationItems?.reduce((sum: number, item: any) => {
          return sum + (parseFloat(item.amount) || 0);
        }, 0) ||
        parseFloat(quotation.subtotalAmount) ||
        0;

      const gstPercentage = quotation.gstPercentage || 18;
      const gst = (basicAmount * gstPercentage) / 100;
      const grandTotal = basicAmount + gst;

      // Generate PDF using Puppeteer and EJS
      console.log("🚀 Launching browser...");
      try {
        browser = await puppeteer.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--disable-gpu",
            "--disable-software-rasterizer",
            "--disable-extensions",
          ],
          timeout: 60000, // 60 second timeout for browser launch (first time may need to download Chromium)
        });
        console.log("✅ Browser launched successfully");
      } catch (launchError: any) {
        console.error("❌ Failed to launch browser:", launchError.message);
        throw new Error(`Browser launch failed: ${launchError.message}`);
      }

      const page = await browser.newPage();

      // Set a timeout for page operations
      page.setDefaultTimeout(30000); // 30 seconds

      // Render EJS template
      console.log("📝 Rendering EJS template...");
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

      console.log("🌐 Setting page content...");
      // Changed from 'networkidle0' to 'domcontentloaded' for faster, more reliable rendering
      await page.setContent(html, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      console.log("📄 Generating PDF...");
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
        timeout: 30000,
      });

      console.log("✅ PDF generated successfully");
      console.log(`📊 PDF size: ${pdf.length} bytes`);
      console.log(
        `📦 PDF buffer type: ${Buffer.isBuffer(pdf) ? "Buffer" : typeof pdf}`
      );

      // Set proper headers for PDF download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="quotation_${quotation.quotationNumber}.pdf"`
      );
      res.setHeader("Content-Length", pdf.length.toString());
      res.setHeader("Cache-Control", "no-cache");

      // Send the PDF buffer directly (no encoding parameter for binary data)
      res.end(pdf);
    } catch (error: any) {
      console.error("❌ Error in GET /api/outbound-quotations/:id/pdf:", error);
      res
        .status(500)
        .json({ error: "Failed to generate PDF", details: error.message });
    } finally {
      // Ensure browser is always closed, even if there's an error
      if (browser) {
        try {
          await browser.close();
          console.log("🔒 Browser closed");
        } catch (closeError) {
          console.error("❌ Error closing browser:", closeError);
        }
      }
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

  // Export Outbound Quotations to Excel
  app.get("/api/outbound-quotations/export", requireAuth, async (req, res) => {
    try {
      console.log("📊 Exporting outbound quotations with filters:", req.query);

      // Get all quotations
      const allQuotations = await storage.getOutboundQuotations();
      console.log(`📊 Total quotations in database: ${allQuotations.length}`);

      // Apply filters based on query parameters
      let filteredQuotations = allQuotations;

      // Filter by customer ID
      if (req.query.customerId && req.query.customerId !== "") {
        console.log(`🔍 Filtering by customerId: ${req.query.customerId}`);
        filteredQuotations = filteredQuotations.filter(
          (q) => q.customerId === req.query.customerId
        );
        console.log(
          `   After customer filter: ${filteredQuotations.length} quotations`
        );
        filteredQuotations.forEach((q) => {
          console.log(
            `     - ${q.quotationNumber}: customerId=${q.customerId}, status=${q.status}, date=${q.quotationDate}`
          );
        });
      }

      // Filter by status (case-insensitive)
      if (req.query.status) {
        console.log(`🔍 Filtering by status: ${req.query.status}`);
        const statusFilter = (req.query.status as string).toLowerCase();
        filteredQuotations = filteredQuotations.filter(
          (q) => q.status.toLowerCase() === statusFilter
        );
        console.log(
          `   After status filter: ${filteredQuotations.length} quotations`
        );
        filteredQuotations.forEach((q) => {
          console.log(
            `     - ${q.quotationNumber}: status=${q.status}, date=${q.quotationDate}`
          );
        });
      }

      // Filter by date range
      if (req.query.startDate) {
        const startDate = new Date(req.query.startDate as string);
        startDate.setHours(0, 0, 0, 0); // Start of day
        console.log(`📅 Filtering by startDate: ${startDate.toISOString()}`);
        filteredQuotations = filteredQuotations.filter((q) => {
          const quotationDate = new Date(q.quotationDate);
          console.log(
            `  Comparing quotation ${
              q.quotationNumber
            } date: ${quotationDate.toISOString()} >= ${startDate.toISOString()} = ${
              quotationDate >= startDate
            }`
          );
          return quotationDate >= startDate;
        });
      }

      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate as string);
        endDate.setHours(23, 59, 59, 999); // Include the entire end date
        console.log(`📅 Filtering by endDate: ${endDate.toISOString()}`);
        filteredQuotations = filteredQuotations.filter((q) => {
          const quotationDate = new Date(q.quotationDate);
          console.log(
            `  Comparing quotation ${
              q.quotationNumber
            } date: ${quotationDate.toISOString()} <= ${endDate.toISOString()} = ${
              quotationDate <= endDate
            }`
          );
          return quotationDate <= endDate;
        });
      }

      console.log(`📋 Found ${filteredQuotations.length} quotations to export`);

      if (filteredQuotations.length === 0) {
        return res.status(404).json({
          error: "No quotations found matching the specified filters",
        });
      }

      // Get all customers for lookup
      const customers = await storage.getCustomers();
      const customerMap = new Map(customers.map((c) => [c.id, c]));

      // Prepare data for Excel export
      const exportData = filteredQuotations.map((quotation) => {
        const customer = customerMap.get(quotation.customerId);

        // Calculate totals
        const basicAmount =
          quotation.quotationItems?.reduce(
            (sum: number, item: any) => sum + (parseFloat(item.amount) || 0),
            0
          ) ||
          parseFloat(quotation.subtotalAmount) ||
          0;

        const gstPercentage = quotation.gstPercentage || 18;
        const gst = (basicAmount * gstPercentage) / 100;
        const grandTotal = basicAmount + gst;

        return {
          "Quotation Number": quotation.quotationNumber,
          "Quotation Date": quotation.quotationDate
            ? new Date(quotation.quotationDate).toLocaleDateString("en-IN")
            : "N/A",
          "Customer Name": quotation.customerName || customer?.name || "N/A",
          "Customer Email": quotation.customerEmail || customer?.email || "N/A",
          "Customer Phone": quotation.customerPhone || customer?.phone || "N/A",
          "Customer GST":
            quotation.customerGstNo || customer?.gstNumber || "N/A",
          Status: quotation.status || "draft",
          "Project Incharge": quotation.projectIncharge || "-",
          "Job Card Number": quotation.jobCardNumber || "-",
          "Basic Amount (INR)": basicAmount.toFixed(2),
          "GST %": gstPercentage,
          "GST Amount (INR)": gst.toFixed(2),
          "Grand Total (INR)": grandTotal.toFixed(2),
          "Payment Terms": quotation.paymentTerms || "-",
          "Delivery Terms": quotation.deliveryTerms || "-",
          Validity: quotation.validity || "-",
          Notes: quotation.notes || "-",
          "Created At": quotation.createdAt
            ? new Date(quotation.createdAt).toLocaleString("en-IN")
            : "N/A",
        };
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths for better readability
      const columnWidths = [
        { wch: 20 }, // Quotation Number
        { wch: 15 }, // Quotation Date
        { wch: 25 }, // Customer Name
        { wch: 30 }, // Customer Email
        { wch: 15 }, // Customer Phone
        { wch: 20 }, // Customer GST
        { wch: 12 }, // Status
        { wch: 20 }, // Project Incharge
        { wch: 20 }, // Job Card Number
        { wch: 18 }, // Basic Amount
        { wch: 10 }, // GST %
        { wch: 18 }, // GST Amount
        { wch: 18 }, // Grand Total
        { wch: 30 }, // Payment Terms
        { wch: 30 }, // Delivery Terms
        { wch: 20 }, // Validity
        { wch: 40 }, // Notes
        { wch: 20 }, // Created At
      ];
      worksheet["!cols"] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Quotations");

      // Generate Excel file buffer
      const excelBuffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });

      console.log(`✅ Excel file generated: ${excelBuffer.length} bytes`);

      // Set headers for file download
      const filename = `Outbound_Quotations_Export_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader("Content-Length", excelBuffer.length.toString());

      // Send the Excel file
      res.end(excelBuffer);
    } catch (error: any) {
      console.error("❌ Error in GET /api/outbound-quotations/export:", error);
      res.status(500).json({
        error: "Failed to export quotations",
        details: error.message,
      });
    }
  });

  // Invoices CRUD
  app.get("/api/invoices", requireAuth, async (req, res) => {
    try {
      let invoicesList = await storage.getInvoices();

      // Apply filters
      if (req.query.customerId) {
        invoicesList = invoicesList.filter(
          (inv) => inv.customerId === req.query.customerId
        );
      }
      if (req.query.status) {
        invoicesList = invoicesList.filter(
          (inv) => inv.status === req.query.status
        );
      }
      if (req.query.startDate) {
        const startDate = new Date(req.query.startDate as string);
        invoicesList = invoicesList.filter(
          (inv) => new Date(inv.invoiceDate) >= startDate
        );
      }
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate as string);
        invoicesList = invoicesList.filter(
          (inv) => new Date(inv.invoiceDate) <= endDate
        );
      }

      res.json(invoicesList);
    } catch (e: any) {
      console.error("❌ Error in /api/invoices:", e);
      res.status(500).json({
        error: "Failed to fetch invoices",
        details: e.message,
      });
    }
  });

  app.post("/api/invoices", requireAuth, async (req, res) => {
    try {
      const invoiceData = req.body;
      const invoice = await storage.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (error: any) {
      console.error("❌ Error in POST /api/invoices:", error);
      res.status(400).json({
        error: "Invalid invoice data",
        details: error.errors || error.message,
      });
    }
  });

  app.put("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const updateData = req.body;
      const invoice = await storage.updateInvoice(id, updateData);
      res.json(invoice);
    } catch (error: any) {
      console.error("❌ Error in PUT /api/invoices/:id:", error);
      res.status(400).json({
        error: "Failed to update invoice",
        details: error.errors || error.message,
      });
    }
  });

  app.delete("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteInvoice(id);
      res.status(204).end();
    } catch (error: any) {
      console.error("❌ Error in DELETE /api/invoices/:id:", error);
      res.status(400).json({
        error: "Failed to delete invoice",
        details: error.errors || error.message,
      });
    }
  });

  // PDF Generation for Invoices
  app.get("/api/invoices/:id/pdf", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      console.log(`📄 Generating PDF for invoice: ${id}`);

      const invoice = await storage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      // Get customer details
      const customers = await storage.getCustomers();
      const customer = customers.find((c) => c.id === invoice.customerId);

      // Hardcode company details for now (can be from admin_settings later)
      const company = {
        name: "HOTTIP INDIA POLYMERS",
        address:
          "GAT NO.209, OFFICE NO-406, SWARAJ CAPITAL, BORHADEWADI, MOSHI CHIKHALI ROAD, PUNE-412105",
        gstNo: "27AQYPM1029M1Z6",
        stateName: "Maharashtra",
        stateCode: "27",
        email: "saleshottipindia@gmail.com",
        bankName: "ICICI BANK",
        accountNo: "738305000994",
        branch: "MOSHI",
        ifsc: "ICIC0007383",
      };

      // Prepare buyer data
      const buyer = {
        name: customer?.name || "N/A",
        address: invoice.billingAddress || customer?.address || "N/A",
        gstNo: invoice.billingGstNumber || customer?.gstNumber || "N/A",
        stateName: invoice.placeOfSupply?.split(",")[0] || "N/A",
        stateCode: invoice.placeOfSupply?.split(",")[1]?.trim() || "N/A",
      };

      // Fetch actual invoice items from database
      const invoiceItemsData = await db
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, id));

      // Prepare invoice items for PDF
      const items = invoiceItemsData.map((item) => ({
        description: item.description,
        hsn: item.hsnSac || "",
        quantity: item.quantity,
        unit: item.unit || "pcs",
        rate: Number(item.unitPrice) || 0,
        amount: Number(item.amount) || Number(item.unitPrice) * item.quantity,
      }));

      // If no items found, use a placeholder
      if (items.length === 0) {
        items.push({
          description: "Invoice Item",
          hsn: "",
          quantity: 1,
          unit: "pcs",
          rate: Number(invoice.subtotalAmount) || 0,
          amount: Number(invoice.subtotalAmount) || 0,
        });
      }

      // Prepare invoice data
      const invoiceData = {
        invoiceNumber: invoice.invoiceNumber,
        date: new Date(invoice.invoiceDate).toLocaleDateString("en-IN"),
        paymentTerms: invoice.paymentTerms || "100% ADVANCE",
        orderNo: invoice.quotationId || "",
        referenceNo: "",
        subtotal: Number(invoice.subtotalAmount) || 0,
        discount: Number(invoice.discountAmount) || 0,
        cgstRate: Number(invoice.cgstRate) || 0,
        cgstAmount: Number(invoice.cgstAmount) || 0,
        sgstRate: Number(invoice.sgstRate) || 0,
        sgstAmount: Number(invoice.sgstAmount) || 0,
        igstRate: Number(invoice.igstRate) || 0,
        igstAmount: Number(invoice.igstAmount) || 0,
        total: Number(invoice.totalAmount) || 0,
        amountInWords: invoice.amountInWords || "Zero",
        items: items,
      };

      // Prepare data for PDF
      const pdfData = {
        company,
        buyer,
        invoice: invoiceData,
      };

      // Generate PDF
      const pdfBuffer = await generateInvoicePDF(pdfData);

      // Send PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="invoice_${invoice.invoiceNumber}.pdf"`
      );
      res.setHeader("Content-Length", pdfBuffer.length.toString());
      res.setHeader("Cache-Control", "no-cache");
      res.end(pdfBuffer);
    } catch (error: any) {
      console.error("❌ Error in GET /api/invoices/:id/pdf:", error);
      res.status(500).json({
        error: "Failed to generate invoice PDF",
        details: error.message,
      });
    }
  });
  app.get("/api/invoices/:id", requireAuth, async (req, res) => {
    console.log("🟢 Received GET /api/invoices/:id");

    try {
      const { id } = req.params;

      // ✅ Fetch main invoice
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, id));
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      // ✅ Fetch customer name (optional)
      let customerName = "";
      try {
        const [customer] = await db
          .select({ name: customers.name })
          .from(customers)
          .where(eq(customers.id, invoice.customerId));
        customerName = customer?.name || "Unknown Customer";
      } catch {
        customerName = "Unknown Customer";
      }

      // ✅ Fetch line items
      const items = await db
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, id));

      // ✅ Format structured response
      const formattedInvoice = {
        invoiceNumber: invoice.invoiceNumber,
        customer: customerName,
        invoiceDate: invoice.invoiceDate?.toISOString().split("T")[0] || "",
        dueDate: invoice.dueDate?.toISOString().split("T")[0] || "",
        subtotalAmount: Number(invoice.subtotalAmount) || 0,
        discountAmount: Number(invoice.discountAmount) || 0,
        cgstRate: Number(invoice.cgstRate) || 0,
        cgstAmount: Number(invoice.cgstAmount) || 0,
        sgstRate: Number(invoice.sgstRate) || 0,
        sgstAmount: Number(invoice.sgstAmount) || 0,
        igstRate: Number(invoice.igstRate) || 0,
        igstAmount: Number(invoice.igstAmount) || 0,
        totalAmount: Number(invoice.totalAmount) || 0,
        balanceAmount: Number(invoice.balanceAmount) || 0,
        billingAddress: invoice.billingAddress || "",
        shippingAddress: invoice.shippingAddress || "",
        clientGSTIN: invoice.billingGstNumber || "",
        placeOfSupply: invoice.placeOfSupply || "",
        paymentTerms: invoice.paymentTerms || "",
        deliveryTerms: invoice.deliveryTerms || "",
        transporter: invoice.transporterName || "",
        ewayBillNumber: invoice.ewayBillNumber || "",
        amountInWords: invoice.amountInWords || "",
        packingCharges: Number(invoice.packingFee) || 0,
        shippingCharges: Number(invoice.shippingFee) || 0,
        otherCharges: Number(invoice.otherCharges) || 0,
        additionalNotes: invoice.notes || "",
        lineItems: items.map((item) => ({
          description: item.description,
          hsn_sac: item.hsnSac || "",
          hsnSac: item.hsnSac || "",
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: Number(item.unitPrice),
          amount: Number(item.amount) || Number(item.unitPrice) * item.quantity,
          cgstPercent: Number(invoice.cgstRate) || 0,
          sgstPercent: Number(invoice.sgstRate) || 0,
          igstPercent: Number(invoice.igstRate) || 0,
        })),
      };

      console.log(`✅ Invoice ${invoice.invoiceNumber} fetched successfully`);
      res.status(200).json({
        message: "Invoice fetched successfully",
        invoice: formattedInvoice,
      });
    } catch (error: any) {
      console.error("❌ Error fetching invoice:", error.message);
      res.status(500).json({
        error: "Failed to fetch invoice",
        details: error.message,
      });
    }
  });

  // ✅ PATCH /api/invoices/:id/status - Update invoice status
  app.patch("/api/invoices/:id/status", requireAuth, async (req, res) => {
    console.log("🟢 Received PATCH /api/invoices/:id/status");

    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validate status
      if (
        !status ||
        !["draft", "sent", "paid", "overdue", "cancelled"].includes(status)
      ) {
        return res.status(400).json({
          error: "Invalid status",
          details:
            "Status must be one of: draft, sent, paid, overdue, cancelled",
        });
      }

      // Check if invoice exists
      const [existingInvoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, id));

      if (!existingInvoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      // Update status
      await db
        .update(invoices)
        .set({ status: status as any })
        .where(eq(invoices.id, id));

      console.log(
        `✅ Invoice ${existingInvoice.invoiceNumber} status updated to ${status}`
      );
      res.status(200).json({
        message: "Invoice status updated successfully",
        status,
      });
    } catch (error: any) {
      console.error("❌ Error updating invoice status:", error.message);
      res.status(500).json({
        error: "Failed to update invoice status",
        details: error.message,
      });
    }
  });
}
