import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import {
  customers as customersTable,
  outboundQuotations,
  insertOutboundQuotationSchema,
} from "@shared/schema";
import { storage } from "./storage";
import puppeteer from "puppeteer";
import ejs from "ejs";
import path from "path";
import * as XLSX from "xlsx";

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
