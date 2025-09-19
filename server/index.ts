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

let leads = [
  { id: "0", firstName: "John", lastName: "Doe", companyName: "Acme Corp" },
  { id: "1", firstName: "Jane", lastName: "Williams", companyName: "Globex" },
];

let visits = Array.from({ length: 10 }, (_, i) => ({
  id: (i + 1).toString(),
  employee: `Employee ${i + 1}`,
  location: `Location ${i + 1}`,
  status: ["scheduled", "completed", "cancelled"][i % 3],
  plannedDate: `2025-09-${15 + i}`,
}));

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
app.get("/api/marketing-tasks/metrics", (_req: Request, res: Response) => {
  res.json({
    totalTasks: 40,
    completed: 28,
    overdue: 5,
    today: 3,
    completionRate: 70.0,
    monthlyStats: {
      total: 120,
      completed: 85,
      overdue: 10,
    },
  });
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
