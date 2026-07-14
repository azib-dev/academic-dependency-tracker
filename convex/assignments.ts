import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all assignments
export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("assignments").collect();
  },
});

// Get all assignments with detailed joined topics and readings
export const getWithDetails = query({
  args: {},
  handler: async (ctx) => {
    const assignments = await ctx.db.query("assignments").collect();
    const result = [];

    for (const assignment of assignments) {
      const topics = [];
      for (const topicId of assignment.topicIds) {
        try {
          const t = await ctx.db.get(ctx.db.normalizeId("topics", topicId) || (topicId as any));
          if (t) topics.push(t);
        } catch (e) {
          // ignore invalid ids
        }
      }

      const readings = [];
      for (const readingId of assignment.readingIds) {
        try {
          const r = await ctx.db.get(ctx.db.normalizeId("readings", readingId) || (readingId as any));
          if (r) readings.push(r);
        } catch (e) {
          // ignore invalid ids
        }
      }

      result.push({
        ...assignment,
        topics,
        readings,
      });
    }

    return result;
  },
});

// Create assignment
export const create = mutation({
  args: {
    title: v.string(),
    course: v.string(),
    dueDate: v.string(),
    status: v.string(),
    estimatedHours: v.number(),
    actualHours: v.number(),
    topicIds: v.array(v.string()),
    readingIds: v.array(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("assignments", {
      title: args.title,
      course: args.course,
      dueDate: args.dueDate,
      status: args.status,
      estimatedHours: args.estimatedHours,
      actualHours: args.actualHours,
      topicIds: args.topicIds,
      readingIds: args.readingIds,
      notes: args.notes,
    });
    return id;
  },
});

// Update assignment
export const update = mutation({
  args: {
    id: v.id("assignments"),
    title: v.optional(v.string()),
    course: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    status: v.optional(v.string()),
    estimatedHours: v.optional(v.number()),
    actualHours: v.optional(v.number()),
    topicIds: v.optional(v.array(v.string())),
    readingIds: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

// Delete assignment
export const remove = mutation({
  args: { id: v.id("assignments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Log actual study session hours to assignment
export const logHours = mutation({
  args: {
    id: v.id("assignments"),
    additionalHours: v.number(),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.id);
    if (!assignment) throw new Error("Assignment not found");
    
    await ctx.db.patch(args.id, {
      actualHours: assignment.actualHours + args.additionalHours,
    });
  },
});
