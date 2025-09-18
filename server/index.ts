import 'dotenv/config';
import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import cors from 'cors';
import { setupVite, serveStatic, log } from "./vite"; // Vite helpers

const app = express();

// =====================
// Middleware
// =====================

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable CORS
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });

  next();
});

// JWT / DEV_TOKEN Secret
if (!process.env.JWT_SECRET && !process.env.DEV_TOKEN_SECRET) {
  const devSecret = crypto.randomBytes(32).toString('hex');
  process.env.DEV_TOKEN_SECRET = devSecret;
  console.log('⚠️ Generated DEV_TOKEN_SECRET for development');
}

// =====================
// Mock API Endpoints
// =====================

// Marketing Dashboard
app.get('/api/marketing/dashboard', (_req: Request, res: Response) => {
  res.json({
    leads: { total: 120, active: 45, converted: 30, conversionRate: 25.0, monthlyNew: 20, pendingFollowUps: 5 },
    visits: { total: 50, completed: 35, today: 5, successRate: 70.0, weeklyCompleted: 25 },
    tasks: { total: 40, completed: 28, overdue: 5, today: 3, completionRate: 70.0 }
  });
});

// Leads
app.get('/api/leads', (req: Request, res: Response) => {
  // Optional query params
  const { status, source, priority, assignedTo, search } = req.query;
  let leads = [
    { id: 1, firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', status: 'new', companyName: 'Acme Corp', industry: 'Retail', source: 'website', priority: 'high', assignedTo: 'u1' },
    { id: 2, firstName: 'Bob', lastName: 'Jones', email: 'bob@example.com', status: 'in_progress', companyName: 'Globex', industry: 'Manufacturing', source: 'referral', priority: 'medium', assignedTo: 'u2' },
    { id: 3, firstName: 'Charlie', lastName: 'Brown', email: 'charlie@example.com', status: 'converted', companyName: 'Initech', industry: 'IT', source: 'email_campaign', priority: 'low', assignedTo: 'u3' }
  ];

  // Simple server-side filtering
  if (status) leads = leads.filter(lead => lead.status === status);
  if (source) leads = leads.filter(lead => lead.source === source);
  if (priority) leads = leads.filter(lead => lead.priority === priority);
  if (assignedTo) leads = leads.filter(lead => lead.assignedTo === assignedTo);
  if (search) {
    const s = (search as string).toLowerCase();
    leads = leads.filter(lead =>
      lead.firstName.toLowerCase().includes(s) ||
      lead.lastName.toLowerCase().includes(s) ||
      lead.companyName.toLowerCase().includes(s) ||
      lead.email.toLowerCase().includes(s)
    );
  }

  res.json(leads);
});

// Leads metrics
app.get('/api/leads/metrics', (_req: Request, res: Response) => {
  res.json({
    totalLeads: 120,
    newLeads: 25,
    inProgressLeads: 40,
    conversionRate: 30.5
  });
});

// Users
app.get('/api/users', (_req: Request, res: Response) => {
  res.json([
    { id: 'u1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com' },
    { id: 'u2', firstName: 'Bob', lastName: 'Jones', email: 'bob@example.com' },
    { id: 'u3', firstName: 'Charlie', lastName: 'Brown', email: 'charlie@example.com' }
  ]);
});

// Field Visits
app.get('/api/field-visits', (_req: Request, res: Response) => {
  res.json([
    { id: 1, visitNumber: '001', plannedDate: '2025-09-18T10:00:00Z', status: 'confirmed', purpose: 'Client meeting' },
    { id: 2, visitNumber: '002', plannedDate: '2025-09-19T14:00:00Z', status: 'scheduled', purpose: 'Site inspection' },
    { id: 3, visitNumber: '003', plannedDate: '2025-09-20T09:00:00Z', status: 'scheduled', purpose: 'Follow-up visit' }
  ]);
});

// Field Visits Today
app.get('/api/field-visits/today', (_req: Request, res: Response) => {
  res.json([
    { id: 1, visitNumber: '001', plannedDate: new Date().toISOString(), status: 'confirmed', purpose: 'Client meeting' }
  ]);
});

// Field Visits Metrics
app.get('/api/field-visits/metrics', (_req: Request, res: Response) => {
  res.json({
    totalVisits: 50,
    completedVisits: 35,
    todayVisits: 5,
    successRate: 70
  });
});

// =====================
// Global Error Handler
// =====================
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Global error handler:', err);
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ error: message });
});

// =====================
// Vite / Static Setup
// =====================
if (app.get("env") === "development") setupVite(app, app);
else serveStatic(app);

// =====================
// Server Listen
// =====================
const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  log(`✅ Server running at http://${HOST}:${PORT}`);
});
