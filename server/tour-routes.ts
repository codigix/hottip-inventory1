import type { Express, Request, Response } from "express";
import { db } from "./db";
import { tourTracking, users } from "../shared/schema";
import { eq, or } from "drizzle-orm";

export async function registerTourRoutes(app: Express) {
  // Get tour status for a specific user
  app.get("/api/tour-status/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Check if user exists
      const userExists = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userExists.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get or create tour tracking record
      let tourRecord = await db
        .select()
        .from(tourTracking)
        .where(eq(tourTracking.userId, userId))
        .limit(1);

      if (tourRecord.length === 0) {
        // Create new tour tracking record
        await db.insert(tourTracking).values({
          userId: userId,
          dashboardTourDone: false,
          notesTourDone: false,
          eventsTourDone: false,
          studentmartTourDone: false,
          chatroomTourDone: false,
        });

        tourRecord = await db
          .select()
          .from(tourTracking)
          .where(eq(tourTracking.userId, userId))
          .limit(1);
      }

      res.json({
        success: true,
        data: {
          userId: tourRecord[0].userId,
          dashboardTourDone: tourRecord[0].dashboardTourDone,
          notesTourDone: tourRecord[0].notesTourDone,
          eventsTourDone: tourRecord[0].eventsTourDone,
          studentmartTourDone: tourRecord[0].studentmartTourDone,
          chatroomTourDone: tourRecord[0].chatroomTourDone,
        },
      });
    } catch (error) {
      console.error("Error fetching tour status:", error);
      res.status(500).json({ error: "Failed to fetch tour status" });
    }
  });

  // Update tour status for a user
  app.post("/api/tour-status/update", async (req: Request, res: Response) => {
    try {
      const { userId, tourName, completed } = req.body;

      if (!userId || !tourName) {
        return res.status(400).json({ error: "User ID and tour name are required" });
      }

      // Validate tour name
      const validTours = [
        "dashboardTourDone",
        "notesTourDone",
        "eventsTourDone",
        "studentmartTourDone",
        "chatroomTourDone",
      ];

      if (!validTours.includes(tourName)) {
        return res.status(400).json({ error: "Invalid tour name" });
      }

      // Get or create tour tracking record
      let tourRecord = await db
        .select()
        .from(tourTracking)
        .where(eq(tourTracking.userId, userId))
        .limit(1);

      if (tourRecord.length === 0) {
        // Create new tour tracking record
        const newRecord: any = {
          userId: userId,
          dashboardTourDone: false,
          notesTourDone: false,
          eventsTourDone: false,
          studentmartTourDone: false,
          chatroomTourDone: false,
        };
        newRecord[tourName] = completed;

        await db.insert(tourTracking).values(newRecord);

        return res.json({
          success: true,
          message: `Tour status updated successfully`,
          data: { [tourName]: completed },
        });
      }

      // Update existing tour tracking record
      const updateData: any = {
        [tourName]: completed,
      };

      await db
        .update(tourTracking)
        .set(updateData)
        .where(eq(tourTracking.userId, userId));

      res.json({
        success: true,
        message: `${tourName} updated successfully`,
        data: { [tourName]: completed },
      });
    } catch (error) {
      console.error("Error updating tour status:", error);
      res.status(500).json({ error: "Failed to update tour status" });
    }
  });

  // Update multiple tour statuses at once
  app.post("/api/tour-status/bulk-update", async (req: Request, res: Response) => {
    try {
      const { userId, tours } = req.body;

      if (!userId || !tours || typeof tours !== "object") {
        return res.status(400).json({ error: "User ID and tours object are required" });
      }

      // Get or create tour tracking record
      let tourRecord = await db
        .select()
        .from(tourTracking)
        .where(eq(tourTracking.userId, userId))
        .limit(1);

      if (tourRecord.length === 0) {
        // Create new tour tracking record with provided tours
        const newRecord = {
          userId: userId,
          dashboardTourDone: tours.dashboardTourDone ?? false,
          notesTourDone: tours.notesTourDone ?? false,
          eventsTourDone: tours.eventsTourDone ?? false,
          studentmartTourDone: tours.studentmartTourDone ?? false,
          chatroomTourDone: tours.chatroomTourDone ?? false,
        };

        await db.insert(tourTracking).values(newRecord);

        return res.json({
          success: true,
          message: "Tour statuses created successfully",
          data: newRecord,
        });
      }

      // Update existing tour tracking record
      await db
        .update(tourTracking)
        .set(tours)
        .where(eq(tourTracking.userId, userId));

      res.json({
        success: true,
        message: "Tour statuses updated successfully",
        data: tours,
      });
    } catch (error) {
      console.error("Error bulk updating tour status:", error);
      res.status(500).json({ error: "Failed to bulk update tour status" });
    }
  });

  // Get all users' tour completion stats (for admin dashboard)
  app.get("/api/tour-stats", async (_req: Request, res: Response) => {
    try {
      const stats = await db.select().from(tourTracking);

      const summary = {
        totalUsers: stats.length,
        dashboardTourCompleted: stats.filter((s) => s.dashboardTourDone).length,
        notesTourCompleted: stats.filter((s) => s.notesTourDone).length,
        eventsTourCompleted: stats.filter((s) => s.eventsTourDone).length,
        studentmartTourCompleted: stats.filter((s) => s.studentmartTourDone).length,
        chatroomTourCompleted: stats.filter((s) => s.chatroomTourDone).length,
      };

      res.json({
        success: true,
        data: {
          summary,
          details: stats,
        },
      });
    } catch (error) {
      console.error("Error fetching tour stats:", error);
      res.status(500).json({ error: "Failed to fetch tour stats" });
    }
  });
}
