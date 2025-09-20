import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";

const app = express();
const port = 5000;

// =====================
// Middleware
// =====================
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(bodyParser.json());

// =====================
// In-Memory Mock Data
// =====================
interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  email?: string;
  phone?: string;
  country: string;
  source: string;
  sourceDetails?: string;
  referredBy?: string;
  priority: string;
  tags?: string[];
  followUpDate?: string;
  expectedClosingDate?: string;
  estimatedBudget?: string;
  requirementDescription?: string;
  notes?: string;
  assignedTo?: string;
}

let users = [
  { id: "0", firstName: "Alice", lastName: "Smith" },
  { id: "1", firstName: "Bob", lastName: "Johnson" },
  { id: "2", firstName: "Carol", lastName: "Brown" },
];

let leads = [
  { id: "1", name: "Lead A", status: "open" },
  { id: "2", name: "Lead B", status: "contacted" },
];

let visits = Array.from({ length: 10 }, (_, i) => ({
  id: (i + 1).toString(),
  employee: `Employee ${i + 1}`,
  location: `Location ${i + 1}`,
  status: ["scheduled", "completed", "cancelled"][i % 3],
  plannedDate: `2025-09-${15 + i}`,
}));

let marketingTasks = [
  { id: "1", title: "Call Client", status: "pending", priority: "high", assignedToUserId: "0", createdAt: new Date().toISOString(), dueDate: new Date().toISOString() },
  { id: "2", title: "Email Campaign", status: "in_progress", priority: "medium", assignedToUserId: "1", createdAt: new Date().toISOString(), dueDate: new Date().toISOString() },
  { id: "3", title: "Product Demo", status: "completed", priority: "low", assignedToUserId: "2", createdAt: new Date().toISOString(), dueDate: new Date().toISOString() },
];

const attendance = [
  { id: "1", userId: "0", status: "present", date: new Date().toISOString() },
  { id: "2", userId: "1", status: "absent", date: new Date().toISOString() },
  { id: "3", userId: "2", status: "present", date: new Date().toISOString() },
];

const shipments = [
  { id: "1", consignmentNumber: "CN001", source: "Warehouse A", destination: "Customer X", currentStatus: "in_transit", updatedAt: new Date().toISOString() },
  { id: "2", consignmentNumber: "CN002", source: "Warehouse B", destination: "Customer Y", currentStatus: "delivered", updatedAt: new Date().toISOString() },
  { id: "3", consignmentNumber: "CN003", source: "Warehouse C", destination: "Customer Z", currentStatus: "out_for_delivery", updatedAt: new Date().toISOString() },
];

// =====================
// Helper Functions
// =====================
function broadcast(message: any) {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(data);
  });
}

// =====================
// Users API
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
  users = users.map(u => u.id === id ? { ...u, ...req.body } : u);
  res.json({ message: "User updated" });
});

app.delete("/api/users/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  users = users.filter(u => u.id !== id);
  res.json({ message: "User deleted" });
});

// =====================
// Leads API
// =====================
app.get("/api/leads", (_req: Request, res: Response) => res.json(leads));

app.post("/api/leads", (req: Request, res: Response) => {
  const newLead = { id: Date.now().toString(), ...req.body };
  leads.push(newLead);
  res.status(201).json(newLead);
});

app.put("/api/leads/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  leads = leads.map(l => l.id === id ? { ...l, ...req.body } : l);
  res.json({ message: "Lead updated" });
});

app.delete("/api/leads/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  leads = leads.filter(l => l.id !== id);
  res.json({ message: "Lead deleted" });
});

// =====================
// Field Visits API
// =====================
app.get("/api/field-visits", (_req: Request, res: Response) => res.json(visits));

app.post("/api/field-visits", (req: Request, res: Response) => {
  const newVisit = { id: Date.now().toString(), ...req.body };
  visits.push(newVisit);
  broadcast({ type: "NEW_VISIT", data: newVisit });
  res.status(201).json(newVisit);
});

app.put("/api/field-visits/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  visits = visits.map(v => v.id === id ? { ...v, ...req.body } : v);
  res.json({ message: "Visit updated" });
});

app.delete("/api/field-visits/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  visits = visits.filter(v => v.id !== id);
  res.json({ message: "Visit deleted" });
});

// =====================
// Marketing API
// =====================
app.get("/api/marketing/leads/metrics", (req, res) => {
  // Return metrics data
  res.json({
    totalLeads: 100,
    monthlyLeads: 25,
    conversionRate: 0.25
  });
});
app.get("/api/tasks", (req: Request, res: Response) => {
    res.json({ message: "List of tasks", tasks: [] });
  });

  app.post("/api/tasks", (req: Request, res: Response) => {
    const task = req.body;
    res.status(201).json({ message: "Task created", task });
  });
app.get('/api/marketing', (req, res) => {
  const mockDashboardData = {
    totalLeads: 120,
    conversionRate: 0.32, // 32%
    campaignsActive: 5,
    revenueGenerated: 15000,
    topPerformers: [
      { name: "Alice Johnson", dealsClosed: 15 },
      { name: "Bob Smith", dealsClosed: 12 },
      { name: "Charlie Lee", dealsClosed: 10 },
    ],
    recentActivities: [
      { name: "Alice Johnson", action: "Closed deal", date: "2025-09-19" },
      { name: "Bob Smith", action: "Followed up lead", date: "2025-09-18" },
      { name: "Charlie Lee", action: "Created campaign", date: "2025-09-18" },
    ],
  };

  res.json(mockDashboardData);
});
app.get("/api/marketing/leads", (req: Request, res: Response) => {
  res.json(leads);
});
app.post("/api/marketing/leads", (req: Request, res: Response) => {
  const newLead: Lead = {
    id: uuidv4(),
    ...req.body,
  };
  leads.push(newLead);
  res.status(201).json(newLead);
});
// Get a single lead by ID
app.get("/api/marketing/leads/:id", (req: Request, res: Response) => {
  const lead = leads.find((l) => l.id === req.params.id);
  if (!lead) return res.status(404).json({ message: "Lead not found" });
  res.json(lead);
});

// Create a new lead


// Update an existing lead
app.put("/api/marketing/leads/:id", (req: Request, res: Response) => {
  const index = leads.findIndex((l) => l.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Lead not found" });

  leads[index] = { ...leads[index], ...req.body };
  res.json(leads[index]);
});

app.get("/api/marketing/conversion-rates", (_req, res) => {
  res.json({ conversionRate: 42 });
});

app.get("/api/marketing/visit-success-rates", (_req, res) => {
  res.json({ successRate: 75 });
});

app.get("/api/marketing/team-performance", (_req, res) => {
  const performance = users.map(u => ({
    user: u,
    completedTasks: marketingTasks.filter(t => t.assignedToUserId === u.id && t.status === "completed").length
  }));
  res.json(performance);
});

app.get("/api/marketing-tasks", (_req, res) => res.json(marketingTasks));

app.get("/api/marketing-tasks/metrics", (_req, res) => {
  const metrics = {
    pending: marketingTasks.filter(t => t.status === "pending").length,
    in_progress: marketingTasks.filter(t => t.status === "in_progress").length,
    completed: marketingTasks.filter(t => t.status === "completed").length,
    cancelled: marketingTasks.filter(t => t.status === "cancelled").length,
  };
  res.json(metrics);
});

app.put("/api/marketing-tasks/:taskId/status", (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;
  const task = marketingTasks.find(t => t.id === taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });
  task.status = status;
  res.json(task);
});

app.post("/api/marketing-tasks/:taskId/complete", (req, res) => {
  const { taskId } = req.params;
  const task = marketingTasks.find(t => t.id === taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });
  task.status = "completed";
  res.json(task);
});

// Attendance
app.get("/api/marketing-attendance", (_req, res) => res.json(attendance));
app.get("/api/marketing-attendance/metrics", (_req, res) => {
  const total = attendance.length;
  const present = attendance.filter(a => a.status === "present").length;
  res.json({ total, present, absent: total - present, percentagePresent: (present / total) * 100 });
});

// =====================
// Logistics API
// =====================
app.get("/api/logistics/shipments", (_req, res) => res.json(shipments));

app.get("/api/logistics/dashboard", (_req, res) => {
  const total = shipments.length;
  const inTransit = shipments.filter(s => s.currentStatus === "in_transit").length;
  const outForDelivery = shipments.filter(s => s.currentStatus === "out_for_delivery").length;
  const delivered = shipments.filter(s => s.currentStatus === "delivered").length;
  res.json({ total, inTransit, outForDelivery, delivered });
});

app.get("/api/logistics/reports/daily/:date", (req, res) => {
  const { date } = req.params;
  const dailyReport = { date, shipped: shipments.length, delivered: shipments.filter(s => s.currentStatus === "delivered").length, revenue: 5000 };
  res.json([dailyReport]);
});

app.get("/api/logistics/reports/volume/:period", (req, res) => {
  const { period } = req.params;
  res.json([{ period, volume: 1500, averagePerShipment: 250 }]);
});

app.get("/api/logistics/reports/performance/:period", (req, res) => {
  const { period } = req.params;
  res.json([{ period, avgDeliveryTimeHours: 48, onTimePercentage: 92 }]);
});

app.get("/api/logistics/tasks", (_req, res) => {
  const tasks = [
    { id: 1, title: "Load truck #12", status: "pending", assignedTo: "John" },
    { id: 2, title: "Deliver consignment #45", status: "in_progress", assignedTo: "Alice" },
    { id: 3, title: "Return empty container", status: "completed", assignedTo: "Bob" },
  ];
  res.json(tasks);
});

app.get("/api/logistics/attendance", (_req, res) => res.json(attendance));

// =====================
// WebSocket Setup
// =====================
const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("WebSocket connected");
  ws.on("message", msg => console.log("Received:", msg.toString()));
  ws.on("close", () => console.log("WebSocket disconnected"));
});

// =====================
// Start Server
// =====================
server.listen(port, () => console.log(`Server running at http://localhost:${port}`));
