import type { Express, Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string; username: string };
}

export function registerAccountsRoutes(app: Express, middleware: { requireAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void> }) {
  const { requireAuth } = middleware;

  // Accounts dashboards minimal stubs; extend with real queries later
  app.get('/api/accounts/dashboard', requireAuth, async (_req, res) => {
    res.json({
      totalReceivables: 0,
      totalPayables: 0,
      cashFlow: { inflow: 0, outflow: 0 },
    });
  });
}
