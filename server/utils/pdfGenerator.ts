// utils/pdfGenerator.ts
import { Readable } from "stream";
import { jsPDF } from "jspdf";

/**
 * Generates a PDF for an outbound quotation.
 * @param quotation The outbound quotation data.
 * @returns A Readable stream containing the PDF data.
 */
export async function generateOutboundQuotationPdf(
  quotation: any
): Promise<Readable> {
  try {
    console.log(
      "📄 [PDF GENERATOR] generateOutboundQuotationPdf - Creating PDF..."
    );

    // Create a new PDF document
    const doc = new jsPDF();

    // Set font size and styles
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Outbound Quotation", 105, 20, { align: "center" });

    // Add company logo or header (if available)
    // doc.addImage(logoData, 'PNG', 10, 10, 50, 20);

    // Add quotation details
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    // Quotation information section
    doc.setFont("helvetica", "bold");
    doc.text("Quotation Information:", 20, 40);
    doc.setFont("helvetica", "normal");
    doc.text(`Quotation Number: ${quotation.quotationNumber}`, 20, 50);
    doc.text(
      `Date: ${new Date(quotation.quotationDate).toLocaleDateString()}`,
      20,
      60
    );
    doc.text(
      `Valid Until: ${
        quotation.validUntil
          ? new Date(quotation.validUntil).toLocaleDateString()
          : "N/A"
      }`,
      20,
      70
    );

    // Customer information section
    doc.setFont("helvetica", "bold");
    doc.text("Customer Information:", 120, 40);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${quotation.customer?.name || "N/A"}`, 120, 50);
    doc.text(`Email: ${quotation.customer?.email || "N/A"}`, 120, 60);
    doc.text(`Phone: ${quotation.customer?.phone || "N/A"}`, 120, 70);

    // Items section header
    doc.setFont("helvetica", "bold");
    doc.text("Items:", 20, 90);

    // Table header for items
    doc.setFillColor(240, 240, 240);
    doc.rect(20, 95, 170, 10, "F");
    doc.text("Description", 25, 102);
    doc.text("Quantity", 90, 102);
    doc.text("Unit Price", 120, 102);
    doc.text("Amount", 160, 102);

    // Items data (placeholder - would need to iterate through actual items)
    let yPos = 115;
    if (quotation.items && quotation.items.length > 0) {
      quotation.items.forEach((item: any, index: number) => {
        doc.setFont("helvetica", "normal");
        doc.text(item.description || "Product Item", 25, yPos);
        doc.text(item.quantity?.toString() || "1", 90, yPos);
        doc.text(
          `₹${parseFloat(item.unitPrice || "0").toLocaleString("en-IN")}`,
          120,
          yPos
        );
        doc.text(
          `₹${parseFloat(item.amount || "0").toLocaleString("en-IN")}`,
          160,
          yPos
        );
        yPos += 10;

        // Add a new page if we're running out of space
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
      });
    } else {
      doc.text("[No items listed]", 25, yPos);
      yPos += 10;
    }

    // Add some space after items
    yPos += 10;

    // Summary section
    doc.line(120, yPos, 190, yPos);
    yPos += 10;
    doc.text("Subtotal:", 130, yPos);
    doc.text(
      `₹${parseFloat(quotation.subtotalAmount || "0").toLocaleString("en-IN")}`,
      170,
      yPos
    );
    yPos += 10;
    doc.text("Tax:", 130, yPos);
    doc.text(
      `₹${parseFloat(quotation.taxAmount || "0").toLocaleString("en-IN")}`,
      170,
      yPos
    );
    yPos += 10;
    doc.text("Discount:", 130, yPos);
    doc.text(
      `₹${parseFloat(quotation.discountAmount || "0").toLocaleString("en-IN")}`,
      170,
      yPos
    );
    yPos += 10;
    doc.line(120, yPos, 190, yPos);
    yPos += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Total:", 130, yPos);
    doc.text(
      `₹${parseFloat(quotation.totalAmount || "0").toLocaleString("en-IN")}`,
      170,
      yPos
    );

    // Notes section
    yPos += 20;
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", 20, yPos);
    yPos += 10;
    doc.setFont("helvetica", "normal");
    doc.text(quotation.notes || "N/A", 20, yPos);

    // Status and footer
    yPos += 20;
    doc.setFont("helvetica", "bold");
    doc.text(`Status: ${quotation.status?.toUpperCase() || "DRAFT"}`, 20, yPos);

    // Footer with page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: "center" });
    }

    // Get the PDF as a buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    // Create a Readable stream from the buffer
    const stream = new Readable();
    stream.push(pdfBuffer);
    stream.push(null); // Signal end of stream

    console.log(
      "📄 [PDF GENERATOR] generateOutboundQuotationPdf - PDF created successfully"
    );
    return stream;
  } catch (error) {
    console.error(
      "💥 [PDF GENERATOR] generateOutboundQuotationPdf - Error creating PDF:",
      error
    );
    throw error; // Re-throw to be caught by the route handler
  }
}
