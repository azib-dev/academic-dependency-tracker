import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("topics")
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("topics").collect();
  },
});

export const create = mutation({
  args: {
    courseId: v.id("courses"),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("topics", {
      courseId: args.courseId,
      name: args.name,
      description: args.description,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("topics") },
  handler: async (ctx, args) => {
    // Unset topicId from readings that belong to this topic
    const readings = await ctx.db
      .query("readings")
      .filter((q) => q.eq(q.field("topicId"), args.id))
      .collect();
    for (const reading of readings) {
      await ctx.db.patch(reading._id, { topicId: undefined });
    }
    await ctx.db.delete(args.id);
  },
});
