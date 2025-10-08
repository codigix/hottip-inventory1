# Quotation PDF Templates

This directory contains EJS templates for generating professional PDF quotations.

## Files

- **quotation.ejs** - Main HTML template with EJS templating
- **quotation.css** - Stylesheet for A4 PDF formatting
- **README.md** - This file

## Template Structure

The quotation template includes:

1. **Company Header** - Company name, logo, address, contact details, GSTIN
2. **Customer Section** - Customer name, company, address, GST, contact details
3. **Quotation Details** - Reference number, date, project incharge, job card number
4. **Section 1: Mold/Part Details** - Table with comprehensive mold specifications
5. **Section 2: Quotation Items** - Itemized list with quantities, prices, and amounts
6. **Summary** - Basic amount, GST calculation, and grand total
7. **Terms & Conditions** - Delivery, packaging, payment terms, bank details
8. **Signature Section** - Customer and authorized signatory blocks
9. **Footer** - Company website and email

## Usage with Puppeteer

### Installation

```bash
npm install puppeteer ejs
```

### Implementation Example

```javascript
import puppeteer from "puppeteer";
import ejs from "ejs";
import path from "path";
import fs from "fs";

async function generateQuotationPDF(quotationData) {
  // Prepare template data
  const templateData = {
    // Company Info
    companyName: quotationData.companyName || "HOTTIP INDIA POLYMERS",
    companyAddress: quotationData.companyAddress,
    companyEmail: quotationData.companyEmail,
    companyPhone: quotationData.companyPhone,
    companyWebsite: quotationData.companyWebsite,
    companyGstin: quotationData.companyGstin,
    companyLogo: quotationData.companyLogo, // Base64 or URL

    // Customer Info
    customer: {
      name: quotationData.customer.name,
      company: quotationData.customer.company,
      address: quotationData.customer.address,
      gstNumber: quotationData.customer.gstNumber,
      phone: quotationData.customer.phone,
      email: quotationData.customer.email,
      contactPerson: quotationData.customer.contactPerson,
    },

    // Quotation Details
    quotationNumber: quotationData.quotationNumber,
    quotationDate: quotationData.quotationDate,
    projectIncharge: quotationData.projectIncharge,
    jobCardNumber: quotationData.jobCardNumber,

    // Mold Details (Array)
    moldDetails: quotationData.moldDetails || [],

    // Quotation Items (Array)
    quotationItems: quotationData.quotationItems || [],

    // Financial
    gstPercentage: quotationData.gstPercentage || 18,

    // Terms
    deliveryPeriod: quotationData.deliveryPeriod,
    packaging: quotationData.packaging,
    paymentTerms: quotationData.paymentTerms,
    validity: quotationData.validity,
    bankDetails: quotationData.bankDetails,
    additionalNotes: quotationData.additionalNotes,
  };

  // Render EJS template
  const templatePath = path.join(__dirname, "templates", "quotation.ejs");
  const cssPath = path.join(__dirname, "templates", "quotation.css");

  const html = await ejs.renderFile(templatePath, templateData);
  const css = fs.readFileSync(cssPath, "utf8");

  // Inject CSS into HTML
  const htmlWithCSS = html.replace("</head>", `<style>${css}</style></head>`);

  // Generate PDF with Puppeteer
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(htmlWithCSS, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "10mm",
      right: "10mm",
      bottom: "10mm",
      left: "10mm",
    },
  });

  await browser.close();

  return pdfBuffer;
}

export { generateQuotationPDF };
```

## Usage with html-pdf-node

### Installation

```bash
npm install html-pdf-node ejs
```

### Implementation Example

```javascript
import htmlPdf from "html-pdf-node";
import ejs from "ejs";
import path from "path";
import fs from "fs";

async function generateQuotationPDF(quotationData) {
  // Prepare template data (same as puppeteer example)
  const templateData = {
    /* ... same as above ... */
  };

  // Render EJS template
  const templatePath = path.join(__dirname, "templates", "quotation.ejs");
  const cssPath = path.join(__dirname, "templates", "quotation.css");

  const html = await ejs.renderFile(templatePath, templateData);
  const css = fs.readFileSync(cssPath, "utf8");

  // Inject CSS into HTML
  const htmlWithCSS = html.replace("</head>", `<style>${css}</style></head>`);

  // PDF options
  const options = {
    format: "A4",
    printBackground: true,
    margin: {
      top: "10mm",
      right: "10mm",
      bottom: "10mm",
      left: "10mm",
    },
  };

  const file = { content: htmlWithCSS };

  // Generate PDF
  const pdfBuffer = await htmlPdf.generatePdf(file, options);

  return pdfBuffer;
}

export { generateQuotationPDF };
```

## Integration with Express Route

Update your `sales-routes-registry.ts` to use the template:

```javascript
import { generateQuotationPDF } from "./pdf-generator";

app.get("/api/outbound-quotations/:id/pdf", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const quotation = await storage.getOutboundQuotation(id);

    if (!quotation) {
      return res.status(404).json({ error: "Quotation not found" });
    }

    // Get customer details
    const customers = await storage.getCustomers();
    const customer = customers.find((c) => c.id === quotation.customerId);

    // Prepare data for template
    const quotationData = {
      ...quotation,
      customer: customer || {},
    };

    // Generate PDF
    const pdfBuffer = await generateQuotationPDF(quotationData);

    // Send PDF response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Quotation-${quotation.quotationNumber}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("❌ Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});
```

## Template Variables

### Required Variables

- `companyName` - Company name
- `quotationNumber` - Quotation reference number
- `quotationDate` - Date of quotation
- `customer` - Customer object with name, address, etc.
- `quotationItems` - Array of quotation line items

### Optional Variables

- `companyLogo` - Logo image (base64 or URL)
- `moldDetails` - Array of mold specifications
- `projectIncharge` - Name of project manager
- `jobCardNumber` - Job card reference
- `gstPercentage` - GST rate (default: 18%)
- `deliveryPeriod` - Delivery timeframe
- `packaging` - Packaging details
- `paymentTerms` - Payment conditions
- `validity` - Quotation validity period
- `bankDetails` - Bank account information
- `additionalNotes` - Any additional notes

## Data Structure Examples

### Mold Details Item

```javascript
{
  no: 1,
  partName: "Housing Cover",
  mouldNo: "MD-2024-001",
  plasticMaterial: "ABS",
  colourChange: "Black",
  mfi: "15",
  wallThickness: "2.5mm",
  noOfCavity: 4,
  gfPercent: 30,
  mfPercent: 5,
  partWeight: 125,
  systemSuggested: "Hot Runner",
  noOfDrops: 2,
  trialDate: "2024-01-15"
}
```

### Quotation Item

```javascript
{
  no: 1,
  partName: "Housing Cover",
  description: "ABS plastic housing cover with black finish",
  uom: "PCS",
  quantity: 1000,
  unitPrice: 45.50
}
```

## Logo Usage

Place your company logo in the `attached_assets` folder:

- Supported formats: PNG, JPG, JPEG
- Recommended size: 200x80 pixels
- File name: `company-logo.png` (or .jpg)

To use base64 logo in template data:

```javascript
const logoPath = path.join(
  process.cwd(),
  "attached_assets",
  "company-logo.png"
);
const logoBase64 = fs.readFileSync(logoPath).toString("base64");
const companyLogo = `data:image/png;base64,${logoBase64}`;
```

## Customization

### Styling

Edit `quotation.css` to customize:

- Colors (company brand colors)
- Fonts (change font-family)
- Spacing and layout
- Table styling

### Content

Edit `quotation.ejs` to:

- Add/remove sections
- Modify table columns
- Change text and labels
- Add additional fields

## Troubleshooting

### PDF not generating colors

Ensure print backgrounds are enabled:

```javascript
printBackground: true;
```

### Layout issues

Check page size settings:

```javascript
format: 'A4',
margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
```

### Logo not displaying

- Verify logo file exists in `attached_assets` folder
- Check file format (PNG, JPG, JPEG)
- Ensure correct path resolution
- Try using base64 encoding

### Long content causing page breaks

Adjust CSS page-break properties:

```css
page-break-inside: avoid;
page-break-after: auto;
```

## License

Internal use only - HotTip Inventory System
