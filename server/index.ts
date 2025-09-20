// import express, { Request, Response } from "express";
// import cors from "cors";
// import bodyParser from "body-parser";
// import { createServer } from "http";
// import { WebSocketServer } from "ws";
// import { db } from "./db";
// import { users, leads, fieldVisits } from "@shared/schema";
// const app = express();
// const port = 5000;

// // Middleware
// app.use(cors({
//   origin: 'http://localhost:5173', // <-- your React frontend URL
//   credentials: true                // <-- allow cookies/auth headers
// }));
// app.use(bodyParser.json());
// const shipments = [
//   {
//     id: "1",
//     consignmentNumber: "CN001",
//     source: "Warehouse A",
//     destination: "Customer X",
//     currentStatus: "in_transit",
//     updatedAt: new Date().toISOString(),
//   },
//   {
//     id: "2",
//     consignmentNumber: "CN002",
//     source: "Warehouse B",
//     destination: "Customer Y",
//     currentStatus: "delivered",
//     updatedAt: new Date().toISOString(),
//   },
//   {
//     id: "3",
//     consignmentNumber: "CN003",
//     source: "Warehouse C",
//     destination: "Customer Z",
//     currentStatus: "out_for_delivery",
//     updatedAt: new Date().toISOString(),
//   },
// ];
// // =====================
// // In-memory Mock Data
// // =====================
// let users = [
//   { id: "0", firstName: "Alice", lastName: "Smith" },
//   { id: "1", firstName: "Bob", lastName: "Johnson" },
//   { id: "2", firstName: "Carol", lastName: "Brown" },
// ];

// const dailyReports = [
//   { date: "2025-09-19", shipped: 5, delivered: 3, revenue: 5000 },
//   { date: "2025-09-18", shipped: 7, delivered: 6, revenue: 7000 },
//   { date: "2025-09-17", shipped: 6, delivered: 4, revenue: 6000 },
// ];

// let visits = Array.from({ length: 10 }, (_, i) => ({
//   id: (i + 1).toString(),
//   employee: `Employee ${i + 1}`,
//   location: `Location ${i + 1}`,
//   status: ["scheduled", "completed", "cancelled"][i % 3],
//   plannedDate: `2025-09-${15 + i}`,
// }));
// let tasks = [
//   { id: "1", title: "Email Campaign", type: "email_campaign", status: "pending", priority: "high", assignedToUser: { firstName: "Alice", lastName: "Smith" }, dueDate: new Date().toISOString(), estimatedHours: 3, createdAt: new Date().toISOString() },
//   { id: "2", title: "Client Meeting", type: "visit_client", status: "in_progress", priority: "medium", assignedToUser: { firstName: "Bob", lastName: "Brown" }, dueDate: new Date().toISOString(), estimatedHours: 2, createdAt: new Date().toISOString() },
// ];

// const metrics = {
//   pending: tasks.filter(t => t.status === "pending").length,
//   in_progress: tasks.filter(t => t.status === "in_progress").length,
//   completed: tasks.filter(t => t.status === "completed").length,
//   cancelled: tasks.filter(t => t.status === "cancelled").length,
// };
// const attendance = [
//   { id: "1", name: "Alice", status: "present", date: new Date().toISOString() },
//   { id: "2", name: "Bob", status: "absent", date: new Date().toISOString() },
//   { id: "3", name: "Charlie", status: "present", date: new Date().toISOString() },
// ];
// const marketingTasks = [
//   { id: "1", title: "Call Client", status: "pending", priority: "high", assignedToUserId: "1", createdAt: new Date().toISOString(), dueDate: new Date().toISOString() },
//   { id: "2", title: "Email Campaign", status: "in_progress", priority: "medium", assignedToUserId: "2", createdAt: new Date().toISOString() },
//   { id: "3", title: "Product Demo", status: "completed", priority: "low", assignedToUserId: "3", createdAt: new Date().toISOString() },
// ];
// const attendanceMetrics = {
//   total: 3,
//   present: 2,
//   absent: 1,
//   percentagePresent: 66.7,
// };
// const leads = [
//   { id: "1", name: "Lead A", status: "open" },
//   { id: "2", name: "Lead B", status: "contacted" },
// ];

// const fieldVisits = [
//   { id: "1", client: "Client X", status: "completed" },
//   { id: "2", client: "Client Y", status: "pending" },
// ];


// // =====================
// // Users (CRUD)
// // =====================
// app.get("/api/users", (_req: Request, res: Response) => {
//   res.json(users);
// });

// app.post("/api/users", (req: Request, res: Response) => {
//   const newUser = { id: Date.now().toString(), ...req.body };
//   users.push(newUser);
//   res.status(201).json(newUser);
// });

// app.put("/api/users/:id", (req: Request, res: Response) => {
//   const { id } = req.params;
//   users = users.map((u) => (u.id === id ? { ...u, ...req.body } : u));
//   res.json({ message: "User updated" });
// });

// app.delete("/api/users/:id", (req: Request, res: Response) => {
//   const { id } = req.params;
//   users = users.filter((u) => u.id !== id);
//   res.json({ message: "User deleted" });
// });

// // =====================
// // Leads (CRUD)
// // =====================
// app.get("/api/leads", (_req: Request, res: Response) => {
//   res.json(leads);
// });

// app.post("/api/leads", (req: Request, res: Response) => {
//   const newLead = { id: Date.now().toString(), ...req.body };
//   leads.push(newLead);
//   res.status(201).json(newLead);
// });

// app.put("/api/leads/:id", (req: Request, res: Response) => {
//   const { id } = req.params;
//   leads = leads.map((l) => (l.id === id ? { ...l, ...req.body } : l));
//   res.json({ message: "Lead updated" });
// });

// app.delete("/api/leads/:id", (req: Request, res: Response) => {
//   const { id } = req.params;
//   leads = leads.filter((l) => l.id !== id);
//   res.json({ message: "Lead deleted" });
// });

// // =====================
// // Field Visits (CRUD)
// // =====================
// app.get("/api/field-visits", (_req: Request, res: Response) => {
//   res.json(visits);
// });

// app.post("/api/field-visits", (req: Request, res: Response) => {
//   const newVisit = { id: Date.now().toString(), ...req.body };
//   visits.push(newVisit);
//   res.status(201).json(newVisit);

//   // Broadcast to WebSocket clients
//   broadcast({ type: "NEW_VISIT", data: newVisit });
// });

// app.put("/api/field-visits/:id", (req: Request, res: Response) => {
//   const { id } = req.params;
//   visits = visits.map((v) => (v.id === id ? { ...v, ...req.body } : v));
//   res.json({ message: "Visit updated" });
// });

// app.delete("/api/field-visits/:id", (req: Request, res: Response) => {
//   const { id } = req.params;
//   visits = visits.filter((v) => v.id !== id);
//   res.json({ message: "Visit deleted" });
// });
// app.get("/api/marketing", (_req: Request, res: Response) => {
//   res.json({
//     leads: {
//       total: 120,
//       active: 45,
//       converted: 30,
//       conversionRate: 25.0,
//       monthlyNew: 20,
//       pendingFollowUps: 5,
//     },
//     visits: {
//       total: 50,
//       completed: 35,
//       today: 5,
//       successRate: 70.0,
//       weeklyCompleted: 25,
//     },
//     tasks: {
//       total: 40,
//       completed: 28,
//       overdue: 5,
//       today: 3,
//       completionRate: 70.0,
//     },
//     attendance: {
//       totalEmployees: 50,
//       presentToday: 35,
//     },
//   });
// });
// app.get("/api/marketing-tasks", (req, res) => res.json(tasks));

// app.get("/api/marketing-tasks/metrics", (req, res) => res.json(metrics));

// app.put("/api/marketing-tasks/:taskId/status", (req, res) => {
//   const { taskId } = req.params;
//   const { status } = req.body;
//   const task = tasks.find(t => t.id === taskId);
//   if (!task) return res.status(404).json({ error: "Task not found" });
//   task.status = status;
//   res.json(task);
// });

// app.post("/api/marketing-tasks/:taskId/complete", (req, res) => {
//   const { taskId } = req.params;
//   const task = tasks.find(t => t.id === taskId);
//   if (!task) return res.status(404).json({ error: "Task not found" });
//   task.status = "completed";
//   res.json(task);
// });

// // Optional: leads endpoint
// app.get("/api/marketing/leads", (req, res) => {
//   res.json([
//     { id: "1", name: "Alice", email: "alice@test.com" },
//     { id: "2", name: "Bob", email: "bob@test.com" },
//   ]);
// });
// app.get("/api/marketing-attendance", (req, res) => {
//   res.json([
//     { id: "1", userId: "1", status: "present", date: new Date() },
//     { id: "2", userId: "2", status: "absent", date: new Date() }
//   ]);
// });
// app.get("/api/marketing-attendance/today", (req, res) => {
//   const today = new Date().toISOString().slice(0, 10);
//   const todayAttendance = attendance.filter(a => a.date.slice(0, 10) === today);
//   res.json(todayAttendance);
// });

// // Attendance metrics
// app.get("/api/marketing-attendance/metrics", (req, res) => {
//   res.json(attendanceMetrics);
// });
// app.get("/api/marketing/conversion-rates", (req, res) => {
//   res.json({ conversionRate: 42 });
// });

// // Visit Success Rates
// app.get("/api/marketing/visit-success-rates", (req, res) => {
//   res.json({ successRate: 75 });
// });
// app.get("/api/marketing/team-performance", (req, res) => {
//   const teamPerformance = users.map(u => ({
//     user: u,
//     tasksCompleted: marketingTasks.filter(t => t.assignedToUserId === u.id && t.status === "completed").length
//   }));
//   res.json(teamPerformance);
// });
// app.get("/api/logistics/shipments", (req, res) => {
//   // return shipments data
//   res.json({ shipments: [] });
// });

// app.get("/api/logistics/dashboard", (req, res) => {
//   res.json({
//     totalShipments: shipments.length,
//     inTransit: shipments.filter(s => s.currentStatus === "in_transit").length,
//     outForDelivery: shipments.filter(s => s.currentStatus === "out_for_delivery").length,
//     delivered: shipments.filter(s => s.currentStatus === "delivered").length,
//   });
// });

// // Shipments list
// app.get("/api/logistics/shipments", (req, res) => {
//   res.json({ shipments });
// });

// // Daily report
// app.get("/api/logistics/reports/daily/:date", (req, res) => {
//   const { date } = req.params;

//   // Mock daily report object
//   const dailyReport = {
//     date,
//     shipped: shipments.length,
//     delivered: shipments.filter(
//       s => new Date(s.updatedAt).toDateString() === new Date(date).toDateString()
//     ).length,
//     revenue: 5000, // example mock revenue
//   };

//   res.json([dailyReport]); // ✅ return as array
// });
// app.get("/api/customers", (req, res) => {
//   res.json({
//     customers: [
//       { id: "1", name: "Alice Corp" },
//       { id: "2", name: "Beta Ltd" },
//       { id: "3", name: "Gamma Inc" },
//     ],
//   });
// });

// app.get("/api/suppliers", (req, res) => {
//   res.json({
//     suppliers: [
//       { id: "1", name: "Supplier A" },
//       { id: "2", name: "Supplier B" },
//       { id: "3", name: "Supplier C" },
//     ],
//   });
// });
// // Vendor performance


// // Volume report
// app.get("/api/logistics/reports/volume/:param", (req, res) => {
//   const { param } = req.params;

//   const report = {
//     period: param,              // rename param → period for consistency
//     volume: 1500,               // totalVolume
//     averagePerShipment: 250,    // average
//   };

//   res.json([report]); // ✅ return as array
// });

// // Performance report
// app.get("/api/logistics/reports/performance/:param", (req, res) => {
//   const { param } = req.params;

//   const report = {
//     period: param,
//     avgDeliveryTimeHours: 48,
//     onTimePercentage: 92,
//   };

//   res.json([report]); // ✅ always return an array
// });

// app.get("/api/logistics/tasks", (req, res) => {
//   // Mock tasks data
//   const tasks = [
//     { id: 1, title: "Load truck #12", status: "pending", assignedTo: "John" },
//     { id: 2, title: "Deliver consignment #45", status: "in_progress", assignedTo: "Alice" },
//     { id: 3, title: "Return empty container", status: "completed", assignedTo: "Bob" },
//   ];

//   res.json(tasks);
// });

// app.get("/api/logistics/attendance", (req, res) => {
//   res.json([
//     { id: 1, employee: "Alice", status: "present" },
//     { id: 2, employee: "Bob", status: "absent" }
//   ]);
// });

// // Get today's attendance
// app.get("/api/logistics/attendance/today", (req, res) => {
//   res.json([
//     { id: 1, employee: "Alice", status: "present" },
//     { id: 2, employee: "Bob", status: "absent" }
//   ]);
// });

// // Get attendance metrics
// app.get("/api/logistics/attendance/metrics", (req, res) => {
//   res.json({
//     totalEmployees: 10,
//     presentToday: 8,
//     absentToday: 2,
//   });
// });
// // =====================
// // HTTP + WebSocket Setup
// // =====================
// const server = createServer(app);
// const wss = new WebSocketServer({ server });

// function broadcast(message: any) {
//   const data = JSON.stringify(message);
//   wss.clients.forEach((client) => {
//     if (client.readyState === 1) {
//       client.send(data);
//     }
//   });
// }

// wss.on("connection", (ws) => {
//   console.log("🔌 WebSocket client connected");

//   ws.on("message", (msg) => {
//     console.log("Received:", msg.toString());
//   });

//   ws.on("close", () => {
//     console.log("❌ WebSocket client disconnected");
//   });
// });

// // =====================
// // Start Server
// // =====================
// server.listen(port, () => {
//   console.log(`🚀 Server running at http://localhost:${port}`);
// });









// server/index.ts
import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
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
// Marketing Dashboard → REAL DB
// =====================

app.get("/api/marketing", async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      leadsMetrics,
      visitsMetrics,
      tasksMetrics,
      attendanceMetrics
    ] = await Promise.all([
      // Leads Metrics
      db
        .select({
          total: sql`COUNT(*)::integer`,
          active: sql`COUNT(CASE WHEN ${leads.status} IN ('new', 'contacted', 'in_progress') THEN 1 END)::integer`,
          converted: sql`COUNT(CASE WHEN ${leads.status} = 'converted' THEN 1 END)::integer`,
          monthlyNew: sql`COUNT(CASE WHEN EXTRACT(MONTH FROM ${leads.createdAt}) = EXTRACT(MONTH FROM NOW()) THEN 1 END)::integer`,
          pendingFollowUps: sql`COUNT(CASE WHEN ${leads.followUpDate} IS NOT NULL AND ${leads.followUpDate} > NOW() THEN 1 END)::integer`,
        })
        .from(leads),

      // Field Visits Metrics
      db
        .select({
          total: sql`COUNT(*)::integer`,
          completed: sql`COUNT(CASE WHEN ${fieldVisits.status} = 'completed' THEN 1 END)::integer`,
          today: sql`COUNT(CASE WHEN DATE(${fieldVisits.plannedDate}) = DATE(NOW()) THEN 1 END)::integer`,
          weeklyCompleted: sql`COUNT(CASE WHEN ${fieldVisits.status} = 'completed' AND ${fieldVisits.actualDate} >= NOW() - INTERVAL '7 days' THEN 1 END)::integer`,
        })
        .from(fieldVisits),

      // Marketing Tasks Metrics
      db
        .select({
          total: sql`COUNT(*)::integer`,
          completed: sql`COUNT(CASE WHEN ${marketingTasks.status} = 'completed' THEN 1 END)::integer`,
          overdue: sql`COUNT(CASE WHEN ${marketingTasks.status} != 'completed' AND ${marketingTasks.dueDate} < NOW() THEN 1 END)::integer`,
          today: sql`COUNT(CASE WHEN DATE(${marketingTasks.dueDate}) = DATE(NOW()) THEN 1 END)::integer`,
        })
        .from(marketingTasks),

      // Attendance Metrics
      db
        .select({
          totalEmployees: sql`COUNT(DISTINCT ${users.id})::integer`,
          presentToday: sql`COUNT(CASE WHEN DATE(${marketingAttendance.date}) = DATE(NOW()) AND ${marketingAttendance.attendanceStatus} = 'present' THEN 1 END)::integer`,
        })
        .from(users)
        .leftJoin(marketingAttendance, eq(users.id, marketingAttendance.userId)),
    ]);

    const totalLeads = Number(leadsMetrics[0].total) || 0;
    const convertedLeads = Number(leadsMetrics[0].converted) || 0;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    const totalTasks = Number(tasksMetrics[0].total) || 0;
    const completedTasks = Number(tasksMetrics[0].completed) || 0;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const totalVisits = Number(visitsMetrics[0].total) || 0;
    const completedVisits = Number(visitsMetrics[0].completed) || 0;
    const successRate = totalVisits > 0 ? (completedVisits / totalVisits) * 100 : 0;

    res.json({
      leads: {
        total: totalLeads,
        active: Number(leadsMetrics[0].active) || 0,
        converted: convertedLeads,
        conversionRate,
        monthlyNew: Number(leadsMetrics[0].monthlyNew) || 0,
        pendingFollowUps: Number(leadsMetrics[0].pendingFollowUps) || 0,
      },
      visits: {
        total: totalVisits,
        completed: completedVisits,
        today: Number(visitsMetrics[0].today) || 0,
        successRate,
        weeklyCompleted: Number(visitsMetrics[0].weeklyCompleted) || 0,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        overdue: Number(tasksMetrics[0].overdue) || 0,
        today: Number(tasksMetrics[0].today) || 0,
        completionRate,
      },
      attendance: {
        totalEmployees: Number(attendanceMetrics[0].totalEmployees) || 0,
        presentToday: Number(attendanceMetrics[0].presentToday) || 0,
      },
    });
  } catch (err) {
    console.error("Error in /api/marketing:", err);
    res.status(500).json({ error: "Failed to fetch marketing dashboard data" });
  }
});

// =====================
// Users (CRUD) → REAL DB
// =====================

app.get("/api/users", async (_req: Request, res: Response) => {
  try {
    const allUsers = await db.select().from(users);
    res.json(allUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.post("/api/users", async (req: Request, res: Response) => {
  try {
    const [newUser] = await db
      .insert(users)
      .values({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        role: req.body.role || "employee",
        department: req.body.department,
      })
      .returning();
    res.status(201).json(newUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.put("/api/users/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [updatedUser] = await db
      .update(users)
      .set(req.body)
      .where(eq(users.id, id))
      .returning();
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User updated", user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

app.delete("/api/users/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    if (result.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// =====================
// Leads (CRUD) → REAL DB
// =====================

app.get("/api/leads", async (_req: Request, res: Response) => {
  try {
    const allLeads = await db.select().from(leads);
    res.json(allLeads);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

app.post("/api/leads", async (req: Request, res: Response) => {
  try {
    const [newLead] = await db
      .insert(leads)
      .values({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        companyName: req.body.companyName,
        email: req.body.email,
        phone: req.body.phone,
        status: req.body.status || "new",
        priority: req.body.priority || "medium",
        createdBy: req.body.createdBy,
      })
      .returning();
    res.status(201).json(newLead);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create lead" });
  }
});

app.put("/api/leads/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [updatedLead] = await db
      .update(leads)
      .set(req.body)
      .where(eq(leads.id, id))
      .returning();
    if (!updatedLead) {
      return res.status(404).json({ error: "Lead not found" });
    }
    res.json({ message: "Lead updated", lead: updatedLead });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update lead" });
  }
});

app.delete("/api/leads/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.delete(leads).where(eq(leads.id, id)).returning();
    if (result.length === 0) {
      return res.status(404).json({ error: "Lead not found" });
    }
    res.json({ message: "Lead deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete lead" });
  }
});

// =====================
// Field Visits (CRUD) → REAL DB
// =====================

app.get("/api/field-visits", async (_req: Request, res: Response) => {
  try {
    const allVisits = await db.select().from(fieldVisits);
    res.json(allVisits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch field visits" });
  }
});

app.post("/api/field-visits", async (req: Request, res: Response) => {
  try {
    const [newVisit] = await db
      .insert(fieldVisits)
      .values({
        visitNumber: `VISIT-${Date.now()}`,
        leadId: req.body.leadId,
        plannedDate: req.body.plannedDate,
        assignedTo: req.body.assignedTo,
        assignedBy: req.body.assignedBy,
        createdBy: req.body.createdBy,
        visitAddress: req.body.visitAddress,
        status: req.body.status || "scheduled",
      })
      .returning();

    broadcast({ type: "NEW_VISIT", data: newVisit });
    res.status(201).json(newVisit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create field visit" });
  }
});

app.put("/api/field-visits/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [updatedVisit] = await db
      .update(fieldVisits)
      .set(req.body)
      .where(eq(fieldVisits.id, id))
      .returning();
    if (!updatedVisit) {
      return res.status(404).json({ error: "Visit not found" });
    }
    res.json({ message: "Visit updated", visit: updatedVisit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update visit" });
  }
});

app.delete("/api/field-visits/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db
      .delete(fieldVisits)
      .where(eq(fieldVisits.id, id))
      .returning();
    if (result.length === 0) {
      return res.status(404).json({ error: "Visit not found" });
    }
    res.json({ message: "Visit deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete visit" });
  }
});

// =====================
// Marketing Tasks → REAL DB
// =====================

app.get("/api/marketing-tasks", async (req: Request, res: Response) => {
  try {
    const allTasks = await db.select().from(marketingTasks);
    res.json(allTasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

app.get("/api/marketing-tasks/metrics", async (req: Request, res: Response) => {
  try {
    const result = await db
      .select({
        pending: sql`COUNT(CASE WHEN ${marketingTasks.status} = 'pending' THEN 1 END)::integer`,
        in_progress: sql`COUNT(CASE WHEN ${marketingTasks.status} = 'in_progress' THEN 1 END)::integer`,
        completed: sql`COUNT(CASE WHEN ${marketingTasks.status} = 'completed' THEN 1 END)::integer`,
        cancelled: sql`COUNT(CASE WHEN ${marketingTasks.status} = 'cancelled' THEN 1 END)::integer`,
      })
      .from(marketingTasks);

    res.json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch task metrics" });
  }
});

app.put("/api/marketing-tasks/:taskId/status", async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const [updatedTask] = await db
      .update(marketingTasks)
      .set({ 
        status, 
        completedDate: status === "completed" ? new Date() : undefined 
      })
      .where(eq(marketingTasks.id, taskId))
      .returning();

    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(updatedTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update task status" });
  }
});

app.post("/api/marketing-tasks/:taskId/complete", async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    const [updatedTask] = await db
      .update(marketingTasks)
      .set({ 
        status: "completed", 
        completedDate: new Date() 
      })
      .where(eq(marketingTasks.id, taskId))
      .returning();

    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(updatedTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to complete task" });
  }
});

// =====================
// Marketing Attendance → REAL DB
// =====================

app.get("/api/marketing-attendance", async (req: Request, res: Response) => {
  try {
    const records = await db.select().from(marketingAttendance);
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
});

app.get("/api/marketing-attendance/today", async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const records = await db
      .select()
      .from(marketingAttendance)
      .where(sql`DATE(${marketingAttendance.date}) = ${today}`);

    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch today's attendance" });
  }
});

app.get("/api/marketing-attendance/metrics", async (req: Request, res: Response) => {
  try {
    const result = await db
      .select({
        total: sql`COUNT(*)::integer`,
        present: sql`COUNT(CASE WHEN ${marketingAttendance.attendanceStatus} = 'present' THEN 1 END)::integer`,
        absent: sql`COUNT(CASE WHEN ${marketingAttendance.attendanceStatus} = 'absent' THEN 1 END)::integer`,
      })
      .from(marketingAttendance);

    const data = result[0];
    res.json({
      total: Number(data.total),
      present: Number(data.present),
      absent: Number(data.absent),
      percentagePresent: data.total > 0 ? (Number(data.present) / Number(data.total)) * 100 : 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch attendance metrics" });
  }
});

// =====================
// Logistics Shipments → REAL DB
// =====================

app.get("/api/logistics/shipments", async (req: Request, res: Response) => {
  try {
    const allShipments = await db.select().from(logisticsShipments);
    res.json({ shipments: allShipments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch shipments" });
  }
});

app.get("/api/logistics/dashboard", async (req: Request, res: Response) => {
  try {
    const shipments = await db.select().from(logisticsShipments);

    res.json({
      totalShipments: shipments.length,
      inTransit: shipments.filter((s) => s.currentStatus === "in_transit").length,
      outForDelivery: shipments.filter((s) => s.currentStatus === "out_for_delivery").length,
      delivered: shipments.filter((s) => s.currentStatus === "delivered").length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

// =====================
// Customers & Suppliers → REAL DB
// =====================

app.get("/api/customers", async (req: Request, res: Response) => {
  try {
    const allCustomers = await db.select({ id: customers.id, name: customers.name }).from(customers);
    res.json({ customers: allCustomers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

app.get("/api/suppliers", async (req: Request, res: Response) => {
  try {
    const allSuppliers = await db.select({ id: suppliers.id, name: suppliers.name }).from(suppliers);
    res.json({ suppliers: allSuppliers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch suppliers" });
  }
});
app.get("/api/health", async (req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({ status: "OK", message: "Database connected" });
  } catch (err) {
    res.status(500).json({ status: "ERROR", message: "Database connection failed" });
  }
});



app.get("/api/marketing/leads", async (req: Request, res: Response) => {
  try {
    const allLeads = await db.select().from(leads);
    res.json(allLeads);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});


app.get("/api/marketing/leads/metrics", async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;

    const result = await db
      .select({
        total: sql`COUNT(*)::integer`,
        active: sql`COUNT(CASE WHEN ${leads.status} IN ('new', 'contacted', 'in_progress') THEN 1 END)::integer`,
        converted: sql`COUNT(CASE WHEN ${leads.status} = 'converted' THEN 1 END)::integer`,
        monthlyNew: sql`COUNT(CASE WHEN EXTRACT(MONTH FROM ${leads.createdAt}) = EXTRACT(MONTH FROM NOW()) THEN 1 END)::integer`,
        pendingFollowUps: sql`COUNT(CASE WHEN ${leads.followUpDate} IS NOT NULL AND ${leads.followUpDate} > NOW() THEN 1 END)::integer`,
      })
      .from(leads)
      .where(
        and(
          from ? sql`${leads.createdAt} >= ${from}` : undefined,
          to ? sql`${leads.createdAt} <= ${to}` : undefined
        )
      );

    const data = result[0];
    const totalLeads = Number(data.total) || 0;
    const convertedLeads = Number(data.converted) || 0;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    res.json({
      total: totalLeads,
      active: Number(data.active) || 0,
      converted: convertedLeads,
      conversionRate,
      monthlyNew: Number(data.monthlyNew) || 0,
      pendingFollowUps: Number(data.pendingFollowUps) || 0,
    });
  } catch (err) {
    console.error("Error in /api/marketing/leads/metrics:", err);
    res.status(500).json({ error: "Failed to fetch lead metrics" });
  }
});
// =====================
// Start Server
// =====================

server.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
