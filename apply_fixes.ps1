# PowerShell script to apply fixes to routes.ts
$filePath = "c:\Users\admin\Desktop\hottip-inventory-backend\hottip-inventory1\hottip-inventory1\hottip-inventory1\server\routes.ts"
$content = Get-Content $filePath -Raw

# Fix 1: Add imports for path and fs
$oldImports = "import crypto from `"crypto`";
import { storage } from `"./storage`";"

$newImports = "import crypto from `"crypto`";
import path from `"path`";
import fs from `"fs`";
import { storage } from `"./storage`";"

$content = $content.Replace($oldImports, $newImports)

# Fix 2: Replace file upload endpoint
$oldUpload = @"
  // File uploads (generic upload URL) - Mocked for local development
  app.post("/api/objects/upload", requireAuth, async (_req, res) => {
    // --- START: Mocking Object Storage for Local Development ---
    if (process.env.NODE_ENV === "development") {
      // Return a dummy URL that the frontend can handle gracefully
      // In a real scenario, this would be replaced by a call to the actual ObjectStorageService
      res.json({
        uploadURL: "http://localhost:5000/mock-upload-url", // This is a fake URL
        message:
          "File upload is mocked in development mode. No actual upload occurs.",
      });
      return; // Exit early, don't proceed to ObjectStorageService
    }
    // --- END: Mocking ---

    try {
      const objectStorage = new ObjectStorageService();
      const uploadURL = await objectStorage.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (e) {
      // This will now only catch errors when NOT in development mode
      // or if the development check fails unexpectedly
      console.error("Object storage error:", e);
      res
        .status(500)
        .json({ error: "Failed to get upload URL", details: e.message });
    }
  });
"@

$newUpload = @"
  // File uploads (generic upload URL) - Local development with real file storage
  app.post("/api/objects/upload", requireAuth, async (_req, res) => {
    try {
      // Generate a unique file ID for the upload
      const fileId = crypto.randomUUID();
      
      // Return a local upload URL instead of a mock URL
      const uploadURL = ``http://localhost:5000/api/objects/upload-file/$${fileId}````;
      
      res.json({ uploadURL });
    } catch (e) {
      console.error("Object storage error:", e);
      res
        .status(500)
        .json({ error: "Failed to get upload URL", details: e.message });
    }
  });

  // Handle actual file upload with PUT method
  app.put("/api/objects/upload-file/:fileId", async (req, res) => {
    try {
      const { fileId } = req.params;
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Determine file extension from Content-Type
      const contentType = req.headers['content-type'] || 'application/octet-stream';
      const extMap: Record<string, string> = {
        'application/pdf': '.pdf',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'image/jpeg': '.jpg',
        'image/png': '.png',
      };
      const ext = extMap[contentType] || '';
      
      // Generate file path
      const filename = ``$${fileId}$${ext}````;
      const filePath = path.join(uploadsDir, filename);

      // Handle raw body upload (FileUploader sends raw file as body)
      const chunks: Buffer[] = [];
      
      req.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      req.on('end', () => {
        const fileBuffer = Buffer.concat(chunks);
        
        // Write file to disk
        fs.writeFileSync(filePath, fileBuffer);
        
        // Return the file path
        res.json({ 
          filePath: ``/uploads/$${filename}````,
          message: 'File uploaded successfully' 
        });
      });

      req.on('error', (error) => {
        console.error('Upload stream error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
      });

    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });
"@

$content = $content.Replace($oldUpload, $newUpload)

# Fix 3: Remove userId from inbound quotations
$oldInbound = @"
        // ? Convert amount from string to number
        totalAmount: parseFloat(parsedData.totalAmount),
        // ? Use a valid UUID for userId in development mode
        userId:
          process.env.NODE_ENV === "development"
            ? "79c36f2b-237a-4ba6-a4b3-a12fc8a18446" // ? Your valid user ID
            : req.user?.id || "79c36f2b-237a-4ba6-a4b3-a12fc8a18446",
      };

      const quotation = await storage.createInboundQuotation(data);
      await storage.createActivity({
        userId: quotation.userId,
        action: "CREATE_INBOUND_QUOTATION",
        entityType: "inbound_quotation",
        entityId: quotation.id,
        details: ``Created inbound quotation: $${quotation.quotationNumber}````,
      });
      res.status(201).json(quotation);
"@

$newInbound = @"
        // ? Convert amount from string to number
        totalAmount: parseFloat(parsedData.totalAmount),
      };

      const quotation = await storage.createInboundQuotation(data);
      
      // Create activity log with senderId instead of userId
      if (quotation.senderId) {
        await storage.createActivity({
          userId: quotation.senderId,
          action: "CREATE_INBOUND_QUOTATION",
          entityType: "inbound_quotation",
          entityId: quotation.id,
          details: ``Created inbound quotation: $${quotation.quotationNumber}````,
        });
      }
      
      res.status(201).json(quotation);
"@

$content = $content.Replace($oldInbound, $newInbound)

# Write the modified content back
Set-Content -Path $filePath -Value $content -NoNewline

Write-Host "Fixes applied successfully!"