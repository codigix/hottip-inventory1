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
