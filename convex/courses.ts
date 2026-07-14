import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("courses").collect();
  },
});

export const create = mutation({
  args: {
    code: v.string(),
    name: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("code"), args.code))
      .first();
    if (existing) {
      return existing._id;
    }
    return await ctx.db.insert("courses", {
      code: args.code,
      name: args.name,
      color: args.color,
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("courses"),
  },
  handler: async (ctx, args) => {
    // Clean up dependent topics, readings, assignments
    const topics = await ctx.db
      .query("topics")
      .filter((q) => q.eq(q.field("courseId"), args.id))
      .collect();
    for (const topic of topics) {
      await ctx.db.delete(topic._id);
    }

    const readings = await ctx.db
      .query("readings")
      .filter((q) => q.eq(q.field("courseId"), args.id))
      .collect();
    for (const reading of readings) {
      await ctx.db.delete(reading._id);
    }

    const assignments = await ctx.db
      .query("assignments")
      .filter((q) => q.eq(q.field("courseId"), args.id))
      .collect();
    for (const assignment of assignments) {
      await ctx.db.delete(assignment._id);
    }

    await ctx.db.delete(args.id);
  },
});
