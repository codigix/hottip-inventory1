import type { Express, Request, Response } from "express";
import express from "express";
import { v4 as uuidv4 } from "uuid";
import { ObjectStorageService } from "./objectStorage";

function resolveBaseUrl(): string {
  return (
    process.env.OBJECT_BASE_URL ||
    process.env.API_BASE_URL ||
    process.env.CLIENT_ORIGIN ||
    `http://localhost:${process.env.PORT || 5000}`
  );
}

function buildAbsoluteUrl(relativePath: string): string {
  if (/^https?:\/\//i.test(relativePath)) {
    return relativePath;
  }

  const base = resolveBaseUrl();
  try {
    return new URL(relativePath, base).toString();
  } catch {
    const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    const normalizedPath = relativePath.startsWith("/")
      ? relativePath
      : `/${relativePath}`;
    return `${trimmedBase}${normalizedPath}`;
  }
}

function isLocalStorageBackend(): boolean {
  return (process.env.STORAGE_BACKEND || "").trim().toLowerCase() === "local";
}

export function registerFileUploadRoutes(
  app: Express,
  requireAuth: (req: Request, res: Response, next: any) => void
) {
  // File uploads (generic upload URL)
  app.post("/api/objects/upload", requireAuth, async (_req, res) => {
    try {
      const usingLocalStorage = isLocalStorageBackend();
      const hasObjectStorage =
        Boolean(process.env.PRIVATE_OBJECT_DIR) && !usingLocalStorage;

      if (hasObjectStorage) {
        const objectStorage = new ObjectStorageService();
        const uploadURL = await objectStorage.getObjectEntityUploadURL();
        res.json({ uploadURL });
      } else {
        // Local file system upload flow
        const uploadId = uuidv4();
        const uploadPath = `/api/objects/local-upload/${uploadId}`;
        const uploadURL = buildAbsoluteUrl(uploadPath);
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

        const envUploadsDir = process.env.PRIVATE_OBJECT_DIR;
        const uploadsDir = envUploadsDir
          ? path.isAbsolute(envUploadsDir)
            ? envUploadsDir
            : path.join(process.cwd(), envUploadsDir)
          : path.join(process.cwd(), "uploads");

        // Ensure uploads directory exists
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
          url: buildAbsoluteUrl(localPath),
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

      const envUploadsDir = process.env.PRIVATE_OBJECT_DIR;
      const uploadsDir = envUploadsDir
        ? path.isAbsolute(envUploadsDir)
          ? envUploadsDir
          : path.join(process.cwd(), envUploadsDir)
        : path.join(process.cwd(), "uploads");

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
