import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";

export const createEmployee = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    employeeId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("employees")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
    if (existing) throw new Error("Employee already exists");

    await ctx.db.insert("employees", {
      userId,
      ...args,
      role: "employee",
    });
  },
});

export const getCurrentEmployee = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    const employee = await ctx.db
      .query("employees")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
    
    return employee;
  },
});

export const getActiveSession = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const employee = await ctx.db
      .query("employees")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
    if (!employee) return null;

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_employee", (q) => q.eq("employeeId", employee._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    return session;
  },
});

export const getTodayStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const employee = await ctx.db
      .query("employees")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
    if (!employee) return null;

    const today = new Date();
    const start = startOfDay(today).getTime();
    const end = endOfDay(today).getTime();

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_employee", (q) => q.eq("employeeId", employee._id))
      .filter((q) => 
        q.and(
          q.gte(q.field("startTime"), start),
          q.lte(q.field("startTime"), end)
        )
      )
      .collect();

    const totalDuration = sessions.reduce((acc, session) => {
      if (session.status === "completed") {
        return acc + (session.duration || 0);
      }
      if (session.status === "active") {
        return acc + (Date.now() - session.startTime);
      }
      return acc;
    }, 0);

    return {
      totalDuration,
      sessionsCount: sessions.length,
    };
  },
});

export const clockIn = mutation({
  args: {
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
      name: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const employee = await ctx.db
      .query("employees")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
    if (!employee) throw new Error("Employee not found");

    const activeSession = await ctx.db
      .query("sessions")
      .withIndex("by_employee", (q) => q.eq("employeeId", employee._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    if (activeSession) throw new Error("Already clocked in");

    await ctx.db.insert("sessions", {
      employeeId: employee._id,
      startTime: Date.now(),
      startLocation: args.location,
      status: "active",
    });
  },
});

export const clockOut = mutation({
  args: {
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
      name: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const employee = await ctx.db
      .query("employees")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
    if (!employee) throw new Error("Employee not found");

    const activeSession = await ctx.db
      .query("sessions")
      .withIndex("by_employee", (q) => q.eq("employeeId", employee._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    if (!activeSession) throw new Error("No active session");

    const endTime = Date.now();
    await ctx.db.patch(activeSession._id, {
      endTime,
      endLocation: args.location,
      status: "completed",
      duration: endTime - activeSession.startTime,
    });
  },
});

export const getSessionHistory = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const employee = await ctx.db
      .query("employees")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
    if (!employee) return [];

    let sessions = await ctx.db
      .query("sessions")
      .withIndex("by_employee", (q) => q.eq("employeeId", employee._id))
      .collect();

    if (args.startDate) {
      sessions = sessions.filter(s => s.startTime >= args.startDate!);
    }
    if (args.endDate) {
      sessions = sessions.filter(s => s.startTime <= args.endDate!);
    }

    return sessions;
  },
});

export const getAllEmployees = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const currentEmployee = await ctx.db
      .query("employees")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
    
    if (!currentEmployee || currentEmployee.role !== "admin") {
      throw new Error("Unauthorized");
    }

    return await ctx.db.query("employees").collect();
  },
});

export const getEmployeeDetails = query({
  args: {
    employeeId: v.id("employees"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const currentEmployee = await ctx.db
      .query("employees")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
    
    if (!currentEmployee || currentEmployee.role !== "admin") {
      throw new Error("Unauthorized");
    }

    return await ctx.db.get(args.employeeId);
  },
});

export const updateEmployee = mutation({
  args: {
    employeeId: v.id("employees"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    role: v.optional(v.union(v.literal("employee"), v.literal("admin"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentEmployee = await ctx.db
      .query("employees")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
    
    if (!currentEmployee || currentEmployee.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const updates: Record<string, any> = {};
    if (args.firstName) updates.firstName = args.firstName;
    if (args.lastName) updates.lastName = args.lastName;
    if (args.role) updates.role = args.role;

    await ctx.db.patch(args.employeeId, updates);
  },
});

export const deleteEmployee = mutation({
  args: {
    employeeId: v.id("employees"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentEmployee = await ctx.db
      .query("employees")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
    
    if (!currentEmployee || currentEmployee.role !== "admin") {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.employeeId);
  },
});

export const getEmployeeStats = query({
  args: {
    employeeId: v.id("employees"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const currentEmployee = await ctx.db
      .query("employees")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
    
    if (!currentEmployee || currentEmployee.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
      .filter((q) => 
        q.and(
          q.gte(q.field("startTime"), args.startDate),
          q.lte(q.field("startTime"), args.endDate)
        )
      )
      .collect();

    const totalDuration = sessions.reduce((acc, session) => {
      if (session.status === "completed") {
        return acc + (session.duration || 0);
      }
      if (session.status === "active") {
        return acc + (Date.now() - session.startTime);
      }
      return acc;
    }, 0);

    return {
      totalDuration,
      sessionsCount: sessions.length,
      sessions,
    };
  },
});

export const getEmployeeOverview = query({
  args: {
    employeeId: v.id("employees"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const currentEmployee = await ctx.db
      .query("employees")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
    
    if (!currentEmployee || currentEmployee.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const dayStart = startOfDay(today);
    const dayEnd = endOfDay(today);

    const [todaySessions, monthSessions] = await Promise.all([
      ctx.db
        .query("sessions")
        .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
        .filter((q) => 
          q.and(
            q.gte(q.field("startTime"), dayStart.getTime()),
            q.lte(q.field("startTime"), dayEnd.getTime())
          )
        )
        .collect(),
      ctx.db
        .query("sessions")
        .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
        .filter((q) => 
          q.and(
            q.gte(q.field("startTime"), monthStart.getTime()),
            q.lte(q.field("startTime"), monthEnd.getTime())
          )
        )
        .collect(),
    ]);

    const calculateDuration = (sessions: any[]) => sessions.reduce((acc, session) => {
      if (session.status === "completed") {
        return acc + (session.duration || 0);
      }
      if (session.status === "active") {
        return acc + (Date.now() - session.startTime);
      }
      return acc;
    }, 0);

    return {
      todayDuration: calculateDuration(todaySessions),
      monthDuration: calculateDuration(monthSessions),
      activeSession: todaySessions.find(s => s.status === "active"),
    };
  },
});
