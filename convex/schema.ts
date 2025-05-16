import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  employees: defineTable({
    userId: v.id("users"),
    employeeId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: v.union(v.literal("employee"), v.literal("admin")),
  }).index("by_user_id", ["userId"]),

  sessions: defineTable({
    employeeId: v.id("employees"),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    startLocation: v.object({
      latitude: v.number(),
      longitude: v.number(),
      name: v.optional(v.string()),
    }),
    endLocation: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
      name: v.optional(v.string()),
    })),
    status: v.union(v.literal("active"), v.literal("completed")),
    duration: v.optional(v.number()),
  })
    .index("by_employee", ["employeeId"])
    .index("by_status", ["status"]),

  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("info"),
      v.literal("success"),
      v.literal("warning"),
      v.literal("error")
    ),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_read", ["userId", "read"]),

  notificationPreferences: defineTable({
    userId: v.id("users"),
    sessionStart: v.boolean(),
    sessionEnd: v.boolean(),
    weeklyReport: v.boolean(),
    sound: v.boolean(),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
