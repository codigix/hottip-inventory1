import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createServer } from "http";
import { WebSocketServer } from "ws";

const app = express();
const port = 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // <-- your React frontend URL
  credentials: true                // <-- allow cookies/auth headers
}));
app.use(bodyParser.json());

// =====================
// In-memory Mock Data
// =====================
let users = [
  { id: "0", firstName: "Alice", lastName: "Smith" },
  { id: "1", firstName: "Bob", lastName: "Johnson" },
  { id: "2", firstName: "Carol", lastName: "Brown" },
];



let visits = Array.from({ length: 10 }, (_, i) => ({
  id: (i + 1).toString(),
  employee: `Employee ${i + 1}`,
  location: `Location ${i + 1}`,
  status: ["scheduled", "completed", "cancelled"][i % 3],
  plannedDate: `2025-09-${15 + i}`,
}));
let tasks = [
  { id: "1", title: "Email Campaign", type: "email_campaign", status: "pending", priority: "high", assignedToUser: { firstName: "Alice", lastName: "Smith" }, dueDate: new Date().toISOString(), estimatedHours: 3, createdAt: new Date().toISOString() },
  { id: "2", title: "Client Meeting", type: "visit_client", status: "in_progress", priority: "medium", assignedToUser: { firstName: "Bob", lastName: "Brown" }, dueDate: new Date().toISOString(), estimatedHours: 2, createdAt: new Date().toISOString() },
];

const metrics = {
  pending: tasks.filter(t => t.status === "pending").length,
  in_progress: tasks.filter(t => t.status === "in_progress").length,
  completed: tasks.filter(t => t.status === "completed").length,
  cancelled: tasks.filter(t => t.status === "cancelled").length,
};
const attendance = [
  { id: "1", name: "Alice", status: "present", date: new Date().toISOString() },
  { id: "2", name: "Bob", status: "absent", date: new Date().toISOString() },
  { id: "3", name: "Charlie", status: "present", date: new Date().toISOString() },
];
const marketingTasks = [
  { id: "1", title: "Call Client", status: "pending", priority: "high", assignedToUserId: "1", createdAt: new Date().toISOString(), dueDate: new Date().toISOString() },
  { id: "2", title: "Email Campaign", status: "in_progress", priority: "medium", assignedToUserId: "2", createdAt: new Date().toISOString() },
  { id: "3", title: "Product Demo", status: "completed", priority: "low", assignedToUserId: "3", createdAt: new Date().toISOString() },
];
const attendanceMetrics = {
  total: 3,
  present: 2,
  absent: 1,
  percentagePresent: 66.7,
};
const leads = [
  { id: "1", name: "Lead A", status: "open" },
  { id: "2", name: "Lead B", status: "contacted" },
];

const fieldVisits = [
  { id: "1", client: "Client X", status: "completed" },
  { id: "2", client: "Client Y", status: "pending" },
];


// =====================
// Users (CRUD)
// =====================
app.get("/api/users", (_req: Request, res: Response) => {
  res.json(users);
});

app.post("/api/users", (req: Request, res: Response) => {
  const newUser = { id: Date.now().toString(), ...req.body };
  users.push(newUser);
  res.status(201).json(newUser);
});

app.put("/api/users/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  users = users.map((u) => (u.id === id ? { ...u, ...req.body } : u));
  res.json({ message: "User updated" });
});

app.delete("/api/users/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  users = users.filter((u) => u.id !== id);
  res.json({ message: "User deleted" });
});

// =====================
// Leads (CRUD)
// =====================
app.get("/api/leads", (_req: Request, res: Response) => {
  res.json(leads);
});

app.post("/api/leads", (req: Request, res: Response) => {
  const newLead = { id: Date.now().toString(), ...req.body };
  leads.push(newLead);
  res.status(201).json(newLead);
});

app.put("/api/leads/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  leads = leads.map((l) => (l.id === id ? { ...l, ...req.body } : l));
  res.json({ message: "Lead updated" });
});

app.delete("/api/leads/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  leads = leads.filter((l) => l.id !== id);
  res.json({ message: "Lead deleted" });
});

// =====================
// Field Visits (CRUD)
// =====================
app.get("/api/field-visits", (_req: Request, res: Response) => {
  res.json(visits);
});

app.post("/api/field-visits", (req: Request, res: Response) => {
  const newVisit = { id: Date.now().toString(), ...req.body };
  visits.push(newVisit);
  res.status(201).json(newVisit);

  // Broadcast to WebSocket clients
  broadcast({ type: "NEW_VISIT", data: newVisit });
});

app.put("/api/field-visits/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  visits = visits.map((v) => (v.id === id ? { ...v, ...req.body } : v));
  res.json({ message: "Visit updated" });
});

app.delete("/api/field-visits/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  visits = visits.filter((v) => v.id !== id);
  res.json({ message: "Visit deleted" });
});
app.get("/api/marketing", (_req: Request, res: Response) => {
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
app.get("/api/marketing-tasks", (req, res) => res.json(tasks));

app.get("/api/marketing-tasks/metrics", (req, res) => res.json(metrics));

app.put("/api/marketing-tasks/:taskId/status", (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;
  const task = tasks.find(t => t.id === taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });
  task.status = status;
  res.json(task);
});

app.post("/api/marketing-tasks/:taskId/complete", (req, res) => {
  const { taskId } = req.params;
  const task = tasks.find(t => t.id === taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });
  task.status = "completed";
  res.json(task);
});

// Optional: leads endpoint
app.get("/api/marketing/leads", (req, res) => {
  res.json([
    { id: "1", name: "Alice", email: "alice@test.com" },
    { id: "2", name: "Bob", email: "bob@test.com" },
  ]);
});
app.get("/api/marketing-attendance", (req, res) => {
  res.json([
    { id: "1", userId: "1", status: "present", date: new Date() },
    { id: "2", userId: "2", status: "absent", date: new Date() }
  ]);
});
app.get("/api/marketing-attendance/today", (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const todayAttendance = attendance.filter(a => a.date.slice(0, 10) === today);
  res.json(todayAttendance);
});

// Attendance metrics
app.get("/api/marketing-attendance/metrics", (req, res) => {
  res.json(attendanceMetrics);
});
app.get("/api/marketing/conversion-rates", (req, res) => {
  res.json({ conversionRate: 42 });
});

// Visit Success Rates
app.get("/api/marketing/visit-success-rates", (req, res) => {
  res.json({ successRate: 75 });
});
app.get("/api/marketing/team-performance", (req, res) => {
  const teamPerformance = users.map(u => ({
    user: u,
    tasksCompleted: marketingTasks.filter(t => t.assignedToUserId === u.id && t.status === "completed").length
  }));
  res.json(teamPerformance);
});
// =====================
// HTTP + WebSocket Setup
// =====================
const server = createServer(app);
const wss = new WebSocketServer({ server });

function broadcast(message: any) {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(data);
    }
  });
}

wss.on("connection", (ws) => {
  console.log("🔌 WebSocket client connected");

  ws.on("message", (msg) => {
    console.log("Received:", msg.toString());
  });

  ws.on("close", () => {
    console.log("❌ WebSocket client disconnected");
  });
});

// =====================
// Start Server
// =====================
server.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
