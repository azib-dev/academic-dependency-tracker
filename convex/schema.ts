import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  courses: defineTable({
    code: v.string(),
    name: v.string(),
    color: v.string(), // Hex color, e.g. #3b82f6
  }),
  topics: defineTable({
    courseId: v.id("courses"),
    name: v.string(),
    description: v.optional(v.string()),
  }),
  readings: defineTable({
    courseId: v.id("courses"),
    topicId: v.optional(v.id("topics")),
    title: v.string(),
    type: v.string(), // "book", "paper", "article", "video", "lecture"
    url: v.optional(v.string()),
    citation: v.optional(v.string()),
    status: v.string(), // "unread", "reading", "completed"
  }),
  assignments: defineTable({
    courseId: v.id("courses"),
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.string(), // ISO date string YYYY-MM-DD
    status: v.string(), // "todo", "in_progress", "completed"
    priority: v.string(), // "low", "medium", "high"
    estimatedHours: v.number(),
    actualHours: v.number(),
    prerequisiteReadings: v.array(v.id("readings")),
    prerequisiteAssignments: v.array(v.id("assignments")),
  }),
  timeLogs: defineTable({
    assignmentId: v.id("assignments"),
    date: v.string(), // ISO date string YYYY-MM-DD
    hoursSpent: v.number(),
    notes: v.optional(v.string()),
  }),
});
