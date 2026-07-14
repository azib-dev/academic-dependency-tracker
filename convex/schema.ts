import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  assignments: defineTable({
    title: v.string(),
    course: v.string(),
    dueDate: v.string(), // ISO string YYYY-MM-DD
    status: v.string(), // "not_started" | "in_progress" | "completed"
    estimatedHours: v.number(),
    actualHours: v.number(),
    topicIds: v.array(v.string()), // string IDs of topics
    readingIds: v.array(v.string()), // string IDs of readings
    notes: v.optional(v.string()),
  }),
  topics: defineTable({
    name: v.string(),
    description: v.string(),
    prerequisiteIds: v.array(v.string()), // string IDs of prerequisite topics
    color: v.string(), // CSS color representation or tailwind class name
  }),
  readings: defineTable({
    title: v.string(),
    author: v.optional(v.string()),
    url: v.optional(v.string()),
    status: v.string(), // "to_read" | "reading" | "completed"
    topicId: v.optional(v.string()), // associated topic ID if any
  }),
});
