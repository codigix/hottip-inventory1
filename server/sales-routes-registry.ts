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

      // Generate PDF using jsPDF
      const { jsPDF } = await import("jspdf");

      const doc = new jsPDF();

      // Set up document properties
      doc.setProperties({
        title: `Quotation ${quotation.quotationNumber}`,
        subject: "Outbound Quotation",
        author: "HotTip Inventory System",
      });

      // Company Header with Colors
      doc.setFillColor(0, 51, 102); // Dark blue background
      doc.rect(0, 0, 210, 25, "F");

      doc.setTextColor(255, 255, 255); // White text
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("CHENNUPATI PLASTICS", 20, 15);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("ENGINEERING PLASTICS & MOULDING SOLUTIONS", 20, 22);

      // Company details with colors
      doc.setFillColor(240, 248, 255); // Light blue background for details
      doc.rect(0, 25, 210, 20, "F");

      doc.setTextColor(0, 0, 0); // Black text
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(
        "123, Industrial Area, Phase-II, Pune - 411 001, Maharashtra",
        20,
        32
      );
      doc.text(
        "Email: info@chennupatiplastics.com | Mobile: +91-9876543210",
        20,
        37
      );
      doc.text(
        "Website: www.chennupatiplastics.com | GST Number: 27AAAAA0000A1Z5",
        20,
        42
      );

      // Draw a colored line under header
      doc.setDrawColor(0, 51, 102);
      doc.setLineWidth(1);
      doc.line(20, 47, 190, 47);

      // Quotation Title with Color
      doc.setFillColor(255, 215, 0); // Gold background
      doc.rect(80, 55, 50, 15, "F");

      doc.setTextColor(0, 51, 102); // Dark blue text
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("QUOTATION", 105, 65, { align: "center" });

      // Customer details (right side) with background
      doc.setFillColor(245, 245, 245); // Light gray background
      doc.rect(105, 75, 85, 65, "F");

      doc.setTextColor(0, 0, 0); // Black text
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Bill To:", 110, 85);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 51, 102); // Dark blue for customer name
      doc.setFont("helvetica", "bold");
      doc.text(`${customer?.name || "N/A"}`, 110, 95);

      if (customer?.company) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(`${customer.company}`, 110, 102);
      }

      doc.setTextColor(0, 0, 0);
      doc.text(`${customer?.address || "N/A"}`, 110, 109);
      doc.text(`GST: ${customer?.gstNumber || "N/A"}`, 110, 116);
      doc.text(`Phone: ${customer?.phone || "N/A"}`, 110, 123);
      doc.text(`Email: ${customer?.email || "N/A"}`, 110, 130);
      doc.text(`Contact: ${customer?.contactPerson || "N/A"}`, 110, 137);

      // Quotation details (right side, below customer) with styling
      doc.setFillColor(255, 255, 255); // White background
      doc.rect(105, 145, 85, 25, "F");

      doc.setTextColor(0, 51, 102); // Dark blue text
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`Ref No: ${quotation.quotationNumber}`, 110, 152);
      doc.text(
        `Date: ${new Date(quotation.quotationDate).toLocaleDateString()}`,
        110,
        158
      );
      doc.text(
        `Project Incharge: ${quotation.projectIncharge || "N/A"}`,
        110,
        164
      );
      doc.text(`Job Card: ${quotation.jobCardNumber || "N/A"}`, 110, 170);

      let yPosition = 180;

      // Mold / Part Details Table
      if (quotation.moldDetails && quotation.moldDetails.length > 0) {
        doc.setFillColor(0, 51, 102); // Dark blue background for section header
        doc.rect(20, yPosition - 2, 170, 8, "F");

        doc.setTextColor(255, 255, 255); // White text
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("SECTION 1 – MOLD / PART DETAILS", 25, yPosition + 3);
        yPosition += 10;

        // Table headers with background
        doc.setFillColor(240, 248, 255); // Light blue background
        doc.rect(20, yPosition - 2, 170, 6, "F");

        doc.setTextColor(0, 51, 102); // Dark blue text
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        const moldHeaders = [
          "No",
          "Part Name",
          "Mould No",
          "Plastic Mat.",
          "Colour",
          "MFI",
          "Wall Thick.",
          "Cavities",
          "GF%+MF%",
          "Part Wt.(g)",
          "System",
          "Drops",
          "Trial Date",
        ];
        let xPos = 20;
        moldHeaders.forEach((header) => {
          doc.text(header, xPos, yPosition + 2);
          xPos += 12; // Adjust column width
        });
        yPosition += 5;

        // Draw header line
        doc.setDrawColor(0, 51, 102);
        doc.setLineWidth(0.5);
        doc.line(20, yPosition, 190, yPosition);
        yPosition += 5;

        // Table rows
        doc.setFont("helvetica", "normal");
        quotation.moldDetails.forEach((mold: any) => {
          xPos = 20;
          const rowData = [
            mold.no.toString(),
            mold.partName,
            mold.mouldNo,
            mold.plasticMaterial,
            mold.colourChange,
            mold.mfi,
            mold.wallThickness,
            mold.noOfCavity.toString(),
            `${mold.gfPercent} + ${mold.mfPercent}`,
            mold.partWeight.toString(),
            mold.systemSuggested,
            mold.noOfDrops.toString(),
            mold.trialDate || "-",
          ];
          rowData.forEach((data) => {
            doc.text(data, xPos, yPosition);
            xPos += 12;
          });
          yPosition += 5;
        });

        yPosition += 10;
      }

      // Quotation Items Table
      if (quotation.quotationItems && quotation.quotationItems.length > 0) {
        doc.setFillColor(0, 51, 102); // Dark blue background for section header
        doc.rect(20, yPosition - 2, 170, 8, "F");

        doc.setTextColor(255, 255, 255); // White text
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("SECTION 2 – QUOTATION ITEMS", 25, yPosition + 3);
        yPosition += 10;

        // Table headers with background
        doc.setFillColor(240, 248, 255); // Light blue background
        doc.rect(20, yPosition - 2, 170, 6, "F");

        doc.setTextColor(0, 51, 102); // Dark blue text
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        const itemHeaders = [
          "No",
          "Part Name",
          "Description",
          "UOM",
          "Qty",
          "Unit Price (₹)",
          "Amount (₹)",
        ];
        let xPos = 20;
        const colWidths = [10, 25, 35, 15, 15, 30, 30];
        itemHeaders.forEach((header, index) => {
          doc.text(header, xPos, yPosition + 2);
          xPos += colWidths[index];
        });
        yPosition += 5;

        // Draw header line
        doc.setDrawColor(0, 51, 102);
        doc.setLineWidth(0.5);
        doc.line(20, yPosition, 190, yPosition);
        yPosition += 5;

        // Table rows
        doc.setFont("helvetica", "normal");
        quotation.quotationItems.forEach((item: any) => {
          xPos = 20;
          const rowData = [
            item.no.toString(),
            item.partName,
            item.partDescription,
            item.uom,
            item.qty.toString(),
            `₹${item.unitPrice.toLocaleString("en-IN")}`,
            `₹${item.amount.toLocaleString("en-IN")}`,
          ];
          rowData.forEach((data, index) => {
            doc.text(data, xPos, yPosition);
            xPos += colWidths[index];
          });
          yPosition += 5;
        });

        // Total row
        doc.setFont("helvetica", "bold");
        doc.text("TOTAL", 105, yPosition);
        doc.text(
          `₹${parseFloat(quotation.subtotalAmount).toLocaleString("en-IN")}`,
          165,
          yPosition
        );
        yPosition += 10;
      }

      // Financial Summary with styling
      yPosition += 10;
      doc.setFillColor(0, 51, 102); // Dark blue background
      doc.rect(20, yPosition - 2, 170, 8, "F");

      doc.setTextColor(255, 255, 255); // White text
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("FINANCIAL SUMMARY", 25, yPosition + 3);
      yPosition += 15;

      doc.setFillColor(245, 245, 245); // Light gray background for summary
      doc.rect(100, yPosition - 5, 90, 30, "F");

      doc.setTextColor(0, 0, 0); // Black text
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Basic Amount: ₹${parseFloat(quotation.subtotalAmount).toLocaleString(
          "en-IN"
        )}`,
        105,
        yPosition
      );
      yPosition += 5;

      if (quotation.taxAmount && parseFloat(quotation.taxAmount) > 0) {
        doc.text(
          `IGST 18%: ₹${parseFloat(quotation.taxAmount).toLocaleString(
            "en-IN"
          )}`,
          120,
          yPosition
        );
        yPosition += 5;
      }

      if (
        quotation.discountAmount &&
        parseFloat(quotation.discountAmount) > 0
      ) {
        doc.text(
          `Discount: ₹${parseFloat(quotation.discountAmount).toLocaleString(
            "en-IN"
          )}`,
          120,
          yPosition
        );
        yPosition += 5;
      }

      // Grand Total with emphasis
      doc.setFillColor(255, 215, 0); // Gold background for total
      doc.rect(100, yPosition + 2, 90, 8, "F");

      doc.setTextColor(0, 51, 102); // Dark blue text
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(
        `GRAND TOTAL: ₹${parseFloat(quotation.totalAmount).toLocaleString(
          "en-IN"
        )}`,
        105,
        yPosition + 7
      );
      yPosition += 20;

      // Terms & Conditions with styling
      doc.setFillColor(0, 51, 102); // Dark blue background
      doc.rect(20, yPosition - 2, 170, 8, "F");

      doc.setTextColor(255, 255, 255); // White text
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("TERMS & CONDITIONS", 25, yPosition + 3);
      yPosition += 12;

      doc.setTextColor(0, 0, 0); // Black text
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");

      // Terms in a bordered box
      doc.setFillColor(250, 250, 250); // Very light gray
      doc.rect(20, yPosition - 2, 170, 25, "F");

      doc.text(
        `• Delivery: ${
          quotation.deliveryTerms || "25–30 days from approval of drawings"
        }`,
        25,
        yPosition + 2
      );
      doc.text("• Packaging: Standard export packaging", 25, yPosition + 7);
      doc.text(
        `• Payment: ${
          quotation.paymentTerms || "50% advance, 50% against delivery"
        }`,
        25,
        yPosition + 12
      );
      doc.text(
        `• Warranty: ${
          quotation.termsConditions || "18 months comprehensive warranty"
        }`,
        25,
        yPosition + 17
      );
      if (quotation.specialTerms) {
        doc.text(
          `• Special Terms: ${quotation.specialTerms}`,
          25,
          yPosition + 22
        );
        yPosition += 5;
      }
      yPosition += 25;

      // Notes
      if (quotation.notes) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Notes", 20, yPosition);
        yPosition += 8;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(quotation.notes, 20, yPosition);
        yPosition += 10;
      }

      // Status
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text(
        `Status: ${quotation.status?.toUpperCase() || "DRAFT"}`,
        20,
        yPosition
      );
      yPosition += 15;

      // Footer with styling
      doc.setFillColor(0, 51, 102); // Dark blue footer background
      doc.rect(0, 275, 210, 22, "F");

      doc.setTextColor(255, 255, 255); // White text
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Thank you for your business!", 105, yPosition, {
        align: "center",
      });

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("For CHENNUPATI PLASTICS", 105, yPosition + 5, {
        align: "center",
      });
      doc.text(
        "Generated on " + new Date().toLocaleDateString(),
        105,
        yPosition + 10,
        {
          align: "center",
        }
      );
      doc.text(
        "www.chennupatiplastics.com | info@chennupatiplastics.com",
        105,
        yPosition + 15,
        {
          align: "center",
        }
      );

      // Generate PDF buffer
      const pdfBuffer = doc.output("arraybuffer");

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="Quotation_${quotation.quotationNumber}.pdf"`
      );
      res.send(Buffer.from(pdfBuffer));
    } catch (error: any) {
      console.error("❌ Error in GET /api/outbound-quotations/:id/pdf:", error);
      res
        .status(500)
        .json({ error: "Failed to generate PDF", details: error.message });
    }
  });
}
