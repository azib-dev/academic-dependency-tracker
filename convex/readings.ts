import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const readings = await ctx.db.query("readings").collect();
    const result = [];
    for (const r of readings) {
      const course = await ctx.db.get(r.courseId);
      const topic = r.topicId ? await ctx.db.get(r.topicId) : null;
      result.push({
        ...r,
        courseCode: course?.code || "UNKNOWN",
        courseName: course?.name || "Unknown Course",
        courseColor: course?.color || "#3b82f6",
        topicName: topic?.name || null,
      });
    }
    return result;
  },
});

export const create = mutation({
  args: {
    courseId: v.id("courses"),
    topicId: v.optional(v.id("topics")),
    title: v.string(),
    type: v.string(),
    url: v.optional(v.string()),
    citation: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("readings", {
      courseId: args.courseId,
      topicId: args.topicId,
      title: args.title,
      type: args.type,
      url: args.url,
      citation: args.citation,
      status: args.status,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("readings"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const remove = mutation({
  args: { id: v.id("readings") },
  handler: async (ctx, args) => {
    // Clean up assignments that have this reading as a prerequisite
    const assignments = await ctx.db.query("assignments").collect();
    for (const a of assignments) {
      if (a.prerequisiteReadings.includes(args.id)) {
        await ctx.db.patch(a._id, {
          prerequisiteReadings: a.prerequisiteReadings.filter((id) => id !== args.id),
        });
      }
    }
    await ctx.db.delete(args.id);
  },
});
