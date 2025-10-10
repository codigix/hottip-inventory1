$filePath = "c:\Users\admin\Desktop\hottip-inventory-backend\hottip-inventory1\hottip-inventory1\hottip-inventory1\server\routes.ts"
$content = Get-Content $filePath -Raw -Encoding UTF8

$oldCode = '      // --- Call the new storage method ---
      const quotations = await storage.getOutboundQuotations();'

$newCode = '      // --- Extract filter parameters from query string ---
      const { customerId, status, startDate, endDate } = req.query;

      // Build filters object only if filters are provided
      const filters: {
        customerId?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
      } = {};

      if (customerId && typeof customerId === "string") {
        filters.customerId = customerId;
      }
      if (status && typeof status === "string") {
        filters.status = status;
      }
      if (startDate && typeof startDate === "string") {
        filters.startDate = startDate;
      }
      if (endDate && typeof endDate === "string") {
        filters.endDate = endDate;
      }

      console.log("Query parameters:", req.query);
      console.log("Applied filters:", filters);

      // --- Call the storage method with filters ---
      const quotations = await storage.getOutboundQuotations(
        Object.keys(filters).length > 0 ? filters : undefined
      );'

$content = $content.Replace($oldCode, $newCode)
Set-Content -Path $filePath -Value $content -Encoding UTF8 -NoNewline
Write-Host "Done"