/**
 * PDF Generator Module
 * Generates PDF documents from EJS templates using Puppeteer
 */

import puppeteer from "puppeteer";
import ejs from "ejs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Customer {
  id?: number;
  name?: string;
  company?: string;
  address?: string;
  gstNumber?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
}

interface MoldDetail {
  no: number;
  partName: string;
  mouldNo: string;
  plasticMaterial: string;
  colourChange: string;
  mfi: string;
  wallThickness: string;
  noOfCavity: number;
  gfPercent: number;
  mfPercent: number;
  partWeight: number;
  systemSuggested: string;
  noOfDrops: number;
  trialDate?: string;
}

interface QuotationItem {
  no: number;
  partName: string;
  description: string;
  uom: string;
  quantity: number;
  unitPrice: number;
}

interface QuotationData {
  // Company Information
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
  companyGstin?: string;
  companyLogo?: string;

  // Customer Information
  customer: Customer;

  // Quotation Details
  quotationNumber: string;
  quotationDate: string | Date;
  projectIncharge?: string;
  jobCardNumber?: string;

  // Items and Details
  moldDetails?: MoldDetail[];
  quotationItems?: QuotationItem[];

  // Financial
  gstPercentage?: number;

  // Terms and Conditions
  deliveryPeriod?: string;
  packaging?: string;
  paymentTerms?: string;
  validity?: string;
  bankDetails?: string;
  additionalNotes?: string;
}

/**
 * Load company logo from attached_assets folder
 */
function loadCompanyLogo(): string | null {
  try {
    const logoFormats = ["png", "jpg", "jpeg"];

    for (const format of logoFormats) {
      const logoPath = path.join(
        process.cwd(),
        "attached_assets",
        `company-logo.${format}`
      );

      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        const logoBase64 = logoBuffer.toString("base64");
        const mimeType = format === "png" ? "image/png" : "image/jpeg";
        console.log(`✅ Logo loaded successfully: company-logo.${format}`);
        return `data:${mimeType};base64,${logoBase64}`;
      }
    }

    console.log(
      "ℹ️ No logo found in attached_assets folder. Using text-only header."
    );
    return null;
  } catch (error) {
    console.error("⚠️ Error loading logo:", error);
    return null;
  }
}

/**
 * Generate PDF from quotation data using EJS template
 */
export async function generateQuotationPDF(
  quotationData: QuotationData
): Promise<Buffer> {
  try {
    // Load company logo if not provided
    if (!quotationData.companyLogo) {
      quotationData.companyLogo = loadCompanyLogo() || undefined;
    }

    // Prepare template data with defaults
    const templateData = {
      companyName: quotationData.companyName || "HOTTIP INDIA POLYMERS",
      companyAddress:
        quotationData.companyAddress ||
        "123, Industrial Area, Phase-II, City - 411 001, State",
      companyEmail: quotationData.companyEmail || "info@hottipolymers.com",
      companyPhone: quotationData.companyPhone || "+91-9876543210",
      companyWebsite: quotationData.companyWebsite || "www.hottipolymers.com",
      companyGstin: quotationData.companyGstin || "27AAAAA0000A1Z5",
      companyLogo: quotationData.companyLogo,

      customer: {
        name: quotationData.customer?.name || "N/A",
        company: quotationData.customer?.company,
        address: quotationData.customer?.address || "N/A",
        gstNumber: quotationData.customer?.gstNumber || "N/A",
        phone: quotationData.customer?.phone || "N/A",
        email: quotationData.customer?.email || "N/A",
        contactPerson: quotationData.customer?.contactPerson || "N/A",
      },

      quotationNumber: quotationData.quotationNumber,
      quotationDate: quotationData.quotationDate,
      projectIncharge: quotationData.projectIncharge || "N/A",
      jobCardNumber: quotationData.jobCardNumber || "N/A",

      moldDetails: quotationData.moldDetails || [],
      quotationItems: quotationData.quotationItems || [],

      gstPercentage: quotationData.gstPercentage || 18,

      deliveryPeriod:
        quotationData.deliveryPeriod ||
        "15-20 working days from receipt of order",
      packaging: quotationData.packaging || "Standard industrial packaging",
      paymentTerms:
        quotationData.paymentTerms || "50% Advance, Balance against delivery",
      validity: quotationData.validity || "30 days from quotation date",
      bankDetails: quotationData.bankDetails,
      additionalNotes: quotationData.additionalNotes,
    };

    console.log("📄 Rendering EJS template...");

    // Render EJS template
    const templatePath = path.join(__dirname, "templates", "quotation.ejs");
    const cssPath = path.join(__dirname, "templates", "quotation.css");

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    if (!fs.existsSync(cssPath)) {
      throw new Error(`CSS file not found: ${cssPath}`);
    }

    const html = await ejs.renderFile(templatePath, templateData);
    const css = fs.readFileSync(cssPath, "utf8");

    // Inject CSS into HTML
    const htmlWithCSS = html.replace("</head>", `<style>${css}</style></head>`);

    console.log("🚀 Launching Puppeteer...");

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Set content and wait for it to load
    await page.setContent(htmlWithCSS, {
      waitUntil: ["networkidle0", "domcontentloaded"],
    });

    console.log("📝 Generating PDF...");

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
      preferCSSPageSize: false,
    });

    await browser.close();

    console.log("✅ PDF generated successfully");

    return pdfBuffer;
  } catch (error) {
    console.error("❌ Error generating PDF:", error);
    throw new Error(
      `Failed to generate PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

interface InvoiceItem {
  description: string;
  hsn: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoicePDFData {
  company: {
    name: string;
    address: string;
    gstNo: string;
    stateName: string;
    stateCode: string;
    email: string;
    bankName: string;
    accountNo: string;
    branch: string;
    ifsc: string;
  };
  buyer: {
    name: string;
    address: string;
    gstNo: string;
    stateName: string;
    stateCode: string;
  };
  invoice: {
    invoiceNumber: string;
    date: string;
    paymentTerms: string;
    orderNo: string;
    referenceNo: string;
    subtotal: number;
    discount: number;
    igstRate: number;
    igstAmount: number;
    cgstRate: number;
    cgstAmount: number;
    sgstRate: number;
    sgstAmount: number;
    total: number;
    amountInWords: string;
    items: InvoiceItem[];
  };
}

/**
 * Generate PDF from invoice data using EJS template
 */
export async function generateInvoicePDF(
  invoiceData: InvoicePDFData
): Promise<Buffer> {
  try {
    console.log("📄 Rendering invoice EJS template...");

    // Render EJS template
    const templatePath = path.join(__dirname, "templates", "invoice.ejs");

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    const html = await ejs.renderFile(templatePath, invoiceData);

    console.log("🚀 Launching Puppeteer for invoice...");

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Set content and wait for it to load
    await page.setContent(html, {
      waitUntil: ["networkidle0", "domcontentloaded"],
    });

    console.log("📝 Generating invoice PDF...");

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
      preferCSSPageSize: false,
    });

    await browser.close();

    console.log("✅ Invoice PDF generated successfully");

    return pdfBuffer;
  } catch (error) {
    console.error("❌ Error generating invoice PDF:", error);
    throw new Error(
      `Failed to generate invoice PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export interface POItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  unit: string;
}

export interface POPDFData {
  company: {
    name: string;
    address: string;
    gstNo: string;
    email: string;
    phone: string;
  };
  supplier: {
    name: string;
    address: string;
    gstNo: string;
    phone: string;
    email: string;
  };
  po: {
    poNumber: string;
    date: string;
    deliveryPeriod: string;
    subtotal: number;
    gstAmount: number;
    total: number;
    amountInWords: string;
    notes: string;
    items: POItem[];
  };
}

/**
 * Generate PDF from purchase order data using EJS template
 */
export async function generatePurchaseOrderPDF(
  poData: POPDFData
): Promise<Buffer> {
  try {
    console.log("📄 Rendering purchase order EJS template...");

    // Render EJS template
    const templatePath = path.join(__dirname, "templates", "purchase-order.ejs");

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    const html = await ejs.renderFile(templatePath, poData);

    console.log("🚀 Launching Puppeteer for purchase order...");

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Set content and wait for it to load
    await page.setContent(html, {
      waitUntil: ["networkidle0", "domcontentloaded"],
    });

    console.log("📝 Generating PO PDF...");

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
      preferCSSPageSize: false,
    });

    await browser.close();

    console.log("✅ PO PDF generated successfully");

    return pdfBuffer;
  } catch (error) {
    console.error("❌ Error generating PO PDF:", error);
    throw new Error(
      `Failed to generate PO PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export interface RFQItem {
  materialName: string;
  type: string;
  designQty: number;
  unit: string;
}

export interface RFQPDFData {
  company: {
    name: string;
    address: string;
    gstNo: string;
    email: string;
    phone: string;
  };
  supplier: {
    name: string;
    address: string;
    gstNo: string;
    phone: string;
    email: string;
  };
  rfq: {
    quotationNumber: string;
    date: string;
    validUntil: string;
    subject: string;
    notes: string;
    items: RFQItem[];
  };
}

/**
 * Generate PDF from RFQ data using EJS template
 */
export async function generateRFQPDF(
  rfqData: RFQPDFData
): Promise<Buffer> {
  try {
    console.log("📄 Rendering RFQ EJS template...");

    // Render EJS template
    const templatePath = path.join(__dirname, "templates", "rfq.ejs");

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    const html = await ejs.renderFile(templatePath, rfqData);

    console.log("🚀 Launching Puppeteer for RFQ...");

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Set content and wait for it to load
    await page.setContent(html, {
      waitUntil: ["networkidle0", "domcontentloaded"],
    });

    console.log("📝 Generating RFQ PDF...");

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
      preferCSSPageSize: false,
    });

    await browser.close();

    console.log("✅ RFQ PDF generated successfully");

    return pdfBuffer;
  } catch (error) {
    console.error("❌ Error generating RFQ PDF:", error);
    throw new Error(
      `Failed to generate RFQ PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

interface DeliveryChallanItem {
  description: string;
  hsn: string;
  quantity: number;
  unit: string;
}

interface DeliveryChallanPDFData {
  company: {
    name: string;
    address: string;
    gstNo: string;
    stateName: string;
    stateCode: string;
    email: string;
  };
  receiver: {
    name: string;
    address: string;
    gstNo: string;
    phone: string;
  };
  challan: {
    challanNumber: string;
    date: string;
    orderNo: string;
    dispatchMode: string;
    vehicleNo: string;
    importDuty?: number;
    gstPaid?: number;
    totalAmount?: number;
    items: DeliveryChallanItem[];
  };
}

/**
 * Generate PDF from delivery challan data using EJS template
 */
export async function generateDeliveryChallanPDF(
  challanData: DeliveryChallanPDFData
): Promise<Buffer> {
  try {
    console.log("📄 Rendering delivery challan EJS template...");

    // Render EJS template
    const templatePath = path.join(__dirname, "templates", "delivery-challan.ejs");

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    const html = await ejs.renderFile(templatePath, challanData);
    console.log(`📄 EJS rendered successfully, HTML length: ${html.length}`);

    console.log("🚀 Launching Puppeteer for delivery challan...");

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Set content and wait for it to load
    await page.setContent(html, {
      waitUntil: ["networkidle0", "domcontentloaded"],
    });

    console.log("📝 Generating delivery challan PDF...");

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
      preferCSSPageSize: false,
    });

    await browser.close();

    console.log(`✅ Delivery Challan PDF generated successfully, size: ${pdfBuffer.length} bytes`);

    return pdfBuffer;
  } catch (error) {
    console.error("❌ Error generating delivery challan PDF:", error);
    throw new Error(
      `Failed to generate delivery challan PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Alternative: Generate PDF using html-pdf-node (lighter alternative to Puppeteer)
 * Uncomment and install html-pdf-node if you prefer this method
 */
/*
import htmlPdf from 'html-pdf-node';

export async function generateQuotationPDFLite(quotationData: QuotationData): Promise<Buffer> {
  try {
    // Load company logo if not provided
    if (!quotationData.companyLogo) {
      quotationData.companyLogo = loadCompanyLogo() || undefined;
    }

    // Prepare template data (same as above)
    const templateData = { ... };

    // Render EJS template
    const templatePath = path.join(__dirname, 'templates', 'quotation.ejs');
    const cssPath = path.join(__dirname, 'templates', 'quotation.css');
    
    const html = await ejs.renderFile(templatePath, templateData);
    const css = fs.readFileSync(cssPath, 'utf8');
    
    // Inject CSS into HTML
    const htmlWithCSS = html.replace('</head>', `<style>${css}</style></head>`);

    // PDF options
    const options = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    };

    const file = { content: htmlWithCSS };
    
    // Generate PDF
    const pdfBuffer = await htmlPdf.generatePdf(file, options);
    
    return pdfBuffer;

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
*/

export interface AccountReportPDFData {
  company: {
    name: string;
    address: string;
    gstNo: string;
    email: string;
    phone: string;
    logo?: string;
  };
  report: {
    title: string;
    period: string;
    generatedAt: string;
    generatedBy: string;
    summary: Record<string, any>;
    headers: string[];
    rows: any[][];
  };
}

/**
 * Generate PDF for account reports using EJS template
 */
export async function generateAccountReportPDF(
  reportData: AccountReportPDFData
): Promise<Buffer> {
  try {
    console.log(`📄 Rendering account report EJS template: ${reportData.report.title}`);

    // Load company logo if not provided
    if (!reportData.company.logo) {
      reportData.company.logo = loadCompanyLogo() || undefined;
    }

    // Render EJS template
    const templatePath = path.join(process.cwd(), "server", "templates", "account-report.ejs");

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    const html = await ejs.renderFile(templatePath, reportData);

    console.log("🚀 Launching Puppeteer for account report...");

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Set content and wait for it to load
    await page.setContent(html, {
      waitUntil: ["networkidle0", "domcontentloaded"],
    });

    console.log("📝 Generating account report PDF...");

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
      preferCSSPageSize: false,
    });

    await browser.close();

    console.log(`✅ Account Report PDF generated successfully, size: ${pdfBuffer.length} bytes`);

    return pdfBuffer;
  } catch (error) {
    console.error("❌ Error generating account report PDF:", error);
    throw new Error(
      `Failed to generate account report PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
