import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// =====================
// Middleware
// =====================
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  cors({
    origin: "http://localhost:5173", // frontend dev server
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Generate DEV_TOKEN_SECRET if not exists
if (!process.env.DEV_TOKEN_SECRET) {
  process.env.DEV_TOKEN_SECRET = crypto.randomBytes(32).toString("hex");
  console.log("⚠️ Generated DEV_TOKEN_SECRET for development");
}

// =====================
// Marketing Dashboard
// =====================
app.get("/api/marketing/dashboard", (_req: Request, res: Response) => {
  res.json({
    leads: {
      total: 120,
      active: 45,
      converted: 30,
      conversionRate: 25.0,
      monthlyNew: 20,
      pendingFollowUps: 5,
    },
    visits: {
      total: 50,
      completed: 35,
      today: 5,
      successRate: 70.0,
      weeklyCompleted: 25,
    },
    tasks: {
      total: 40,
      completed: 28,
      overdue: 5,
      today: 3,
      completionRate: 70.0,
    },
    attendance: {
      totalEmployees: 50,
      presentToday: 35,
    },
  });
});

// =====================
// Marketing Leads
// =====================
app.get("/api/marketing/leads", (_req: Request, res: Response) => {
  res.json([
    {
      id: 1,
      firstName: "Alice",
      lastName: "Smith",
      status: "qualified",
      companyName: "Acme Corp",
      industry: "Retail",
    },
    {
      id: 2,
      firstName: "Bob",
      lastName: "Jones",
      status: "pending",
      companyName: "Globex",
      industry: "Manufacturing",
    },
    {
      id: 3,
      firstName: "Charlie",
      lastName: "Brown",
      status: "qualified",
      companyName: "Initech",
      industry: "IT",
    },
  ]);
});

// =====================
// Field Visits
// =====================
app.get("/api/field-visits", (_req, res) => {
  const visits = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    employee: `Employee ${i + 1}`,
    location: `Location ${i + 1}`,
    status: ["scheduled", "completed", "cancelled"][i % 3],
    date: `2025-09-${15 + i}`,
  }));
  res.json(visits);
});

app.get("/api/field-visits/today", (_req, res) => {
  const visits = Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    employee: `Employee ${i + 1}`,
    location: `Client Site ${i + 1}`,
    status: "completed",
    date: new Date().toISOString().split("T")[0],
  }));
  res.json(visits);
});

app.get("/api/field-visits/metrics", (_req, res) => {
  res.json({
    totalVisits: 120,
    completed: 95,
    pending: 15,
    cancelled: 10,
    avgPerDay: 6,
  });
});

// =====================
// Marketing Tasks
// =====================
app.get("/api/marketing/tasks", (_req: Request, res: Response) => {
  res.json([
    {
      id: 1,
      title: "Email Campaign",
      assignedTo: "Alice",
      dueDate: "2025-09-21",
      status: "Pending",
    },
    {
      id: 2,
      title: "Social Media Ads",
      assignedTo: "Bob",
      dueDate: "2025-09-22",
      status: "In Progress",
    },
    {
      id: 3,
      title: "Landing Page Update",
      assignedTo: "Charlie",
      dueDate: "2025-09-23",
      status: "Completed",
    },
  ]);
});

// =====================
// Marketing Attendance
// =====================
app.get('/api/marketing/attendance/today', (_req: Request, res: Response) => {
  const employees = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `Employee ${i + 1}`,
    status: i % 3 === 0 ? 'Absent' : 'Present',
  }));
  res.json(employees);
});

app.get('/api/marketing/attendance', (_req: Request, res: Response) => {
  const allAttendance = Array.from({ length: 20 }, (_, day) => ({
    date: `2025-09-${String(day + 1).padStart(2, '0')}`,
    records: Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `Employee ${i + 1}`,
      status: Math.random() > 0.2 ? 'Present' : 'Absent',
    })),
  }));
  res.json(allAttendance);
});

app.get('/api/marketing/attendance/metrics', (_req: Request, res: Response) => {
  const metrics = {
    totalEmployees: 50,
    presentToday: 36,
    absentToday: 14,
    lateToday: 5,
    onLeaveToday: 3,
    averageWorkHours: 7.5,
    attendanceRate: 72,
    monthlyStats: {
      totalDays: 20,
      presentDays: 18,
      absentDays: 2,
      leaveDays: 1,
    },
  };
  res.json(metrics);
});

// =====================
// Reports
// =====================
app.get("/api/reports", (_req: Request, res: Response) => {
  res.json([
    { id: 1, title: "Monthly Leads Report", date: "2025-09-01" },
    { id: 2, title: "Weekly Visits Summary", date: "2025-09-14" },
  ]);
});

// =====================
// Serve React Build (Production)
// =====================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../dist/public")));

// Fallback for React Router (skip API routes)
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(__dirname, "../dist/public/index.html"));
});

// =====================
// WebSocket (Live updates)
// =====================
const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("Client connected to WebSocket");

  const sendUpdate = () => {
    ws.send(
      JSON.stringify({
        tasks: [
          { id: 1, title: "Email Campaign", status: "Pending" },
          { id: 2, title: "Social Media Ads", status: "In Progress" },
        ],
        attendance: { totalEmployees: 50, presentToday: 36 },
      })
    );
  };

  const interval = setInterval(sendUpdate, 5000);
  ws.on("close", () => clearInterval(interval));
});

// =====================
// Global Error Handler
// =====================
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Global error:", err);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal Server Error" });
});

// =====================
// Start Server
// =====================
const PORT = parseInt(process.env.PORT || "5000", 10);
server.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
