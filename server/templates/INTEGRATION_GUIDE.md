# Integration Guide: EJS Template PDF Generation

This guide shows how to replace the existing jsPDF-based PDF generation with the new EJS template system.

## Step 1: Install Required Dependencies

```bash
npm install puppeteer ejs
# OR if you prefer a lighter alternative:
# npm install html-pdf-node ejs
```

## Step 2: Update sales-routes-registry.ts

Replace the existing `/api/outbound-quotations/:id/pdf` route with this implementation:

### Option A: Using the pdf-generator module (Recommended)

```typescript
// At the top of sales-routes-registry.ts
import { generateQuotationPDF } from "./pdf-generator";

// Replace the existing PDF endpoint
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

    // Prepare quotation data for template
    const quotationData = {
      // Company info from quotation record
      companyName: quotation.companyName,
      companyAddress: quotation.companyAddress,
      companyEmail: quotation.companyEmail,
      companyPhone: quotation.companyPhone,
      companyWebsite: quotation.companyWebsite,
      companyGstin: quotation.companyGstin,

      // Customer info
      customer: customer || {},

      // Quotation details
      quotationNumber: quotation.quotationNumber,
      quotationDate: quotation.quotationDate,
      projectIncharge: quotation.projectIncharge,
      jobCardNumber: quotation.jobCardNumber,

      // Items
      moldDetails: quotation.moldDetails,
      quotationItems: quotation.quotationItems,

      // Financial
      gstPercentage: quotation.gstPercentage || 18,

      // Terms
      deliveryPeriod: quotation.deliveryPeriod,
      packaging: quotation.packaging,
      paymentTerms: quotation.paymentTerms,
      validity: quotation.validity,
      bankDetails: quotation.bankDetails,
      additionalNotes: quotation.additionalNotes,
    };

    console.log("🔄 Generating PDF for quotation:", quotation.quotationNumber);

    // Generate PDF
    const pdfBuffer = await generateQuotationPDF(quotationData);

    // Send PDF response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Quotation-${quotation.quotationNumber}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error("❌ Error generating PDF:", error);
    res.status(500).json({
      error: "Failed to generate PDF",
      details: error.message,
    });
  }
});
```

### Option B: Inline implementation (without pdf-generator.ts)

```typescript
import puppeteer from "puppeteer";
import ejs from "ejs";
import path from "path";
import fs from "fs";

app.get("/api/outbound-quotations/:id/pdf", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const quotation = await storage.getOutboundQuotation(id);

    if (!quotation) {
      return res.status(404).json({ error: "Quotation not found" });
    }

    const customers = await storage.getCustomers();
    const customer = customers.find((c) => c.id === quotation.customerId);

    // Load company logo
    let companyLogo = null;
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
        companyLogo = `data:image/${
          format === "png" ? "png" : "jpeg"
        };base64,${logoBase64}`;
        break;
      }
    }

    // Prepare template data
    const templateData = {
      companyName: quotation.companyName || "HOTTIP INDIA POLYMERS",
      companyAddress: quotation.companyAddress,
      companyEmail: quotation.companyEmail,
      companyPhone: quotation.companyPhone,
      companyWebsite: quotation.companyWebsite,
      companyGstin: quotation.companyGstin,
      companyLogo: companyLogo,

      customer: customer || {},

      quotationNumber: quotation.quotationNumber,
      quotationDate: quotation.quotationDate,
      projectIncharge: quotation.projectIncharge,
      jobCardNumber: quotation.jobCardNumber,

      moldDetails: quotation.moldDetails || [],
      quotationItems: quotation.quotationItems || [],

      gstPercentage: quotation.gstPercentage || 18,

      deliveryPeriod: quotation.deliveryPeriod,
      packaging: quotation.packaging,
      paymentTerms: quotation.paymentTerms,
      validity: quotation.validity,
      bankDetails: quotation.bankDetails,
      additionalNotes: quotation.additionalNotes,
    };

    // Render EJS template
    const templatePath = path.join(__dirname, "templates", "quotation.ejs");
    const cssPath = path.join(__dirname, "templates", "quotation.css");

    const html = await ejs.renderFile(templatePath, templateData);
    const css = fs.readFileSync(cssPath, "utf8");
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
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    });

    await browser.close();

    // Send PDF response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Quotation-${quotation.quotationNumber}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error("❌ Error generating PDF:", error);
    res
      .status(500)
      .json({ error: "Failed to generate PDF", details: error.message });
  }
});
```

## Step 3: Remove Old jsPDF Implementation

Once you've tested the new template-based system, you can safely remove the old jsPDF code (approximately lines 230-800 in sales-routes-registry.ts).

## Step 4: Add Company Logo (Optional)

1. Place your company logo in the `attached_assets` folder
2. Supported formats: PNG, JPG, JPEG
3. Name it: `company-logo.png` (or .jpg/.jpeg)
4. Recommended size: 200x80 pixels

## Step 5: Update TypeScript Configuration

If you're using ES modules, ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

## Step 6: Update package.json Scripts

Add a test script for PDF generation:

```json
{
  "scripts": {
    "test:pdf": "node --loader ts-node/esm server/test-pdf-generation.ts"
  }
}
```

## Step 7: Test the Implementation

### Test Script (test-pdf-generation.ts)

```typescript
import { generateQuotationPDF } from "./server/pdf-generator";
import fs from "fs";

const testData = {
  companyName: "HOTTIP INDIA POLYMERS",
  companyAddress: "123, Industrial Area, Phase-II, Pune - 411 001, Maharashtra",
  companyEmail: "info@hottipolymers.com",
  companyPhone: "+91-9876543210",
  companyWebsite: "www.hottipolymers.com",
  companyGstin: "27AAAAA0000A1Z5",

  customer: {
    name: "Test Customer Ltd.",
    company: "Test Company",
    address: "456, Business Park, Mumbai - 400001",
    gstNumber: "27BBBBB1111B1Z5",
    phone: "+91-9999999999",
    email: "customer@example.com",
    contactPerson: "John Doe",
  },

  quotationNumber: "QT-2024-001",
  quotationDate: new Date(),
  projectIncharge: "Project Manager",
  jobCardNumber: "JC-001",

  moldDetails: [
    {
      no: 1,
      partName: "Housing Cover",
      mouldNo: "MD-001",
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
      trialDate: "2024-01-15",
    },
  ],

  quotationItems: [
    {
      no: 1,
      partName: "Housing Cover",
      description: "ABS plastic housing cover with black finish",
      uom: "PCS",
      quantity: 1000,
      unitPrice: 45.5,
    },
    {
      no: 2,
      partName: "Base Plate",
      description: "ABS base plate assembly",
      uom: "PCS",
      quantity: 500,
      unitPrice: 32.0,
    },
  ],

  gstPercentage: 18,
  deliveryPeriod: "15-20 working days",
  packaging: "Standard industrial packaging",
  paymentTerms: "50% Advance, Balance against delivery",
  validity: "30 days from quotation date",
  bankDetails: "Bank: XYZ Bank, Account: 1234567890, IFSC: XYZB0001234",
  additionalNotes: "Prices are subject to change based on raw material costs.",
};

async function test() {
  try {
    console.log("🧪 Testing PDF generation...");
    const pdfBuffer = await generateQuotationPDF(testData);

    // Save to file
    fs.writeFileSync("test-quotation.pdf", pdfBuffer);
    console.log("✅ Test PDF saved as test-quotation.pdf");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

test();
```

Run the test:

```bash
npm run test:pdf
```

## Troubleshooting

### Issue: Puppeteer not launching

**Solution:** Install Chromium dependencies (Linux):

```bash
sudo apt-get install -y \
  libnss3 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libxcomposite1 libxdamage1 \
  libxrandr2 libgbm1 libpango-1.0-0 \
  libcairo2 libasound2
```

### Issue: Colors not showing in PDF

**Solution:** Ensure `printBackground: true` is set in PDF options.

### Issue: Logo not displaying

**Solution:**

1. Verify logo file exists in `attached_assets` folder
2. Check file permissions
3. Try using absolute path
4. Ensure image is base64 encoded

### Issue: Template not found error

**Solution:** Check that templates are in the correct location:

```
server/
  └── templates/
      ├── quotation.ejs
      ├── quotation.css
      └── README.md
```

### Issue: Module resolution errors

**Solution:** Ensure proper imports:

```typescript
// CommonJS
const { generateQuotationPDF } = require("./pdf-generator");

// ES Modules
import { generateQuotationPDF } from "./pdf-generator.js";
```

## Performance Considerations

### Puppeteer Performance

- First PDF generation may take 3-5 seconds (browser launch)
- Subsequent generations: 1-2 seconds
- Consider using browser pooling for high-volume scenarios

### Memory Usage

- Puppeteer: ~200MB per instance
- Consider using `html-pdf-node` for lower memory footprint
- Close browser instances properly to avoid memory leaks

### Production Optimization

```typescript
// Reuse browser instance
let browserInstance: Browser | null = null;

async function getBrowser() {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browserInstance;
}

// Use in PDF generation
const browser = await getBrowser();
const page = await browser.newPage();
// ... generate PDF
await page.close(); // Close page, not browser
```

## Benefits of EJS Template Approach

1. ✅ **Easier Maintenance** - HTML/CSS is easier to modify than jsPDF code
2. ✅ **Better Styling** - Full CSS support with gradients, flexbox, etc.
3. ✅ **Reusable** - Same template can be used for email, print preview, etc.
4. ✅ **Designer Friendly** - Non-developers can modify templates
5. ✅ **Version Control** - Templates are easier to diff and review
6. ✅ **Internationalization** - Easy to add multi-language support

## Next Steps

- [ ] Test PDF generation with real quotation data
- [ ] Add company logo to attached_assets folder
- [ ] Customize template colors to match brand
- [ ] Test with various quotation sizes (1 item vs 50 items)
- [ ] Add email functionality to send PDFs
- [ ] Create additional templates (invoice, purchase order, etc.)
- [ ] Add PDF caching for frequently accessed quotations

## Support

For issues or questions, refer to:

- Puppeteer docs: https://pptr.dev/
- EJS docs: https://ejs.co/
- Template files: `server/templates/README.md`
