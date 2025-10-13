import type { Express, Request, Response } from "express";
import express from "express";
import { v4 as uuidv4 } from "uuid";
import { ObjectStorageService } from "./objectStorage";

export function registerFileUploadRoutes(
  app: Express,
  requireAuth: (req: Request, res: Response, next: any) => void
) {
  // File uploads (generic upload URL)
  app.post("/api/objects/upload", requireAuth, async (_req, res) => {
    try {
      // Check if object storage is configured (Replit environment)
      const hasObjectStorage = process.env.PRIVATE_OBJECT_DIR;

      if (hasObjectStorage) {
        const objectStorage = new ObjectStorageService();
        const uploadURL = await objectStorage.getObjectEntityUploadURL();
        res.json({ uploadURL });
      } else {
        // Local development: generate a unique ID for the upload
        const uploadId = uuidv4();
        const uploadURL = `http://localhost:5000/api/objects/local-upload/${uploadId}`;
        res.json({ uploadURL });
      }
    } catch (e: any) {
      console.error("Object storage error:", e);
      res
        .status(500)
        .json({ error: "Failed to get upload URL", details: e.message });
    }
  });

  // Local file upload endpoint (for development without object storage)
  app.put(
    "/api/objects/local-upload/:uploadId",
    express.raw({ type: "*/*", limit: "50mb" }),
    async (req, res) => {
      try {
        const fs = await import("fs/promises");
        const path = await import("path");
        const { uploadId } = req.params;

        // Ensure uploads directory exists
        const uploadsDir = path.join(process.cwd(), "uploads");
        await fs.mkdir(uploadsDir, { recursive: true });

        // Save the file (req.body will be a Buffer thanks to express.raw())
        const filePath = path.join(uploadsDir, uploadId);

        if (!Buffer.isBuffer(req.body)) {
          return res.status(400).json({ error: "Invalid file data" });
        }

        await fs.writeFile(filePath, req.body);

        // Return the local path
        const localPath = `/objects/uploads/${uploadId}`;
        res.json({
          path: localPath,
          url: `http://localhost:5000${localPath}`,
        });
      } catch (error: any) {
        console.error("Local upload error:", error);
        res
          .status(500)
          .json({ error: "Failed to save file", details: error.message });
      }
    }
  );

  // Serve local uploaded files
  app.get("/objects/uploads/:uploadId", async (req, res) => {
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const { uploadId } = req.params;

      const uploadsDir = path.join(process.cwd(), "uploads");
      const filePath = path.join(uploadsDir, uploadId);

      // Check if file exists
      await fs.access(filePath);

      // Send the file
      res.sendFile(filePath);
    } catch (error: any) {
      if (error.code === "ENOENT") {
        res.status(404).json({ error: "File not found" });
      } else {
        console.error("File retrieval error:", error);
        res.status(500).json({ error: "Failed to retrieve file" });
      }
    }
  });
}
