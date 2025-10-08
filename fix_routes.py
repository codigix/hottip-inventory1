import re

# Read the file
with open(r'c:\Users\admin\Desktop\hottip-inventory-backend\hottip-inventory1\hottip-inventory1\hottip-inventory1\server\routes.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the specific section
old_code = '''  app.get("/api/outbound-quotations", requireAuth, async (req, res) => {
    try {
      console.log("?? [ROUTE] GET /api/outbound-quotations - Request received");

      // --- Call the new storage method ---
      const quotations = await storage.getOutboundQuotations();

      console.log(
        `?? [ROUTE] GET /api/outbound-quotations - Returning ${quotations.length} quotations`
      );'''

new_code = '''  app.get("/api/outbound-quotations", requireAuth, async (req, res) => {
    try {
      console.log("?? [ROUTE] GET /api/outbound-quotations - Request received");
      console.log("?? [ROUTE] Query parameters:", req.query);

      // --- Extract filter parameters from query string ---
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

      console.log("?? [ROUTE] Applied filters:", filters);

      // --- Call the storage method with filters ---
      const quotations = await storage.getOutboundQuotations(
        Object.keys(filters).length > 0 ? filters : undefined
      );

      console.log(
        `?? [ROUTE] GET /api/outbound-quotations - Returning ${quotations.length} quotations`
      );'''

# Replace
if old_code in content:
    content = content.replace(old_code, new_code)
    print("✓ Replacement successful")
    
    # Write back
    with open(r'c:\Users\admin\Desktop\hottip-inventory-backend\hottip-inventory1\hottip-inventory1\hottip-inventory1\server\routes.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("✓ File written successfully")
else:
    print("✗ Pattern not found in file")