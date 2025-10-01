import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import { registerRoutes } from "./routes";

// Ensure development mode by default for local running to enable dev auth bypass
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}

async function start() {
  const app = express();

  // Config
  const PORT = Number(process.env.PORT || 5000);
  const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

  // Security & performance middleware
  app.use(
    helmet({
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    })
  );
  app.use(compression());

  // CORS and parsers
  const corsOptions =
    process.env.NODE_ENV === "development"
      ? { origin: true, credentials: true } // reflect request origin in dev (allows 5173/5174, etc.)
      : { origin: CLIENT_ORIGIN, credentials: true };
  app.use(cors(corsOptions));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));

  // Root route
  app.get("/", (_req, res) => {
    res.send("Server is running 🚀");
  });

  // Register all application routes (auth, marketing, logistics, etc.)
  const server = await registerRoutes(app);

  // Global error handler (fallback)
  app.use(
    (
      err: any,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      // eslint-disable-next-line no-console
      console.error("Unhandled error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  );

  // Start HTTP server
  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`✅ Server running at http://localhost:${PORT}`);
    // eslint-disable-next-line no-console
    console.log(`🌐 CORS origin: ${CLIENT_ORIGIN}`);
  });

  // Process-level safety nets
  process.on("unhandledRejection", (reason) => {
    // eslint-disable-next-line no-console
    console.error("Unhandled Rejection:", reason);
  });
  process.on("uncaughtException", (err) => {
    // eslint-disable-next-line no-console
    console.error("Uncaught Exception:", err);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", err);
  process.exit(1);
});
