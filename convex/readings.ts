import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all readings
export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("readings").collect();
  },
});

// Create reading
export const create = mutation({
  args: {
    title: v.string(),
    author: v.optional(v.string()),
    url: v.optional(v.string()),
    status: v.string(),
    topicId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("readings", {
      title: args.title,
      author: args.author,
      url: args.url,
      status: args.status,
      topicId: args.topicId,
    });
    return id;
  },
});

// Update reading
export const update = mutation({
  args: {
    id: v.id("readings"),
    title: v.optional(v.string()),
    author: v.optional(v.string()),
    url: v.optional(v.string()),
    status: v.optional(v.string()),
    topicId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

// Delete reading and clean up references
export const remove = mutation({
  args: { id: v.id("readings") },
  handler: async (ctx, args) => {
    const readingIdString = args.id.toString();

    // Remove from assignments' reading list
    const assignments = await ctx.db.query("assignments").collect();
    for (const assignment of assignments) {
      if (assignment.readingIds.includes(readingIdString)) {
        await ctx.db.patch(assignment._id, {
          readingIds: assignment.readingIds.filter(id => id !== readingIdString),
        });
      }
    }

    // Delete the reading itself
    await ctx.db.delete(args.id);
  },
});
