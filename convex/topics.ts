import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all topics
export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("topics").collect();
  },
});

// Create topic
export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    prerequisiteIds: v.array(v.string()),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("topics", {
      name: args.name,
      description: args.description,
      prerequisiteIds: args.prerequisiteIds,
      color: args.color,
    });
    return id;
  },
});

// Update topic
export const update = mutation({
  args: {
    id: v.id("topics"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    prerequisiteIds: v.optional(v.array(v.string())),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

// Delete topic and clean up references
export const remove = mutation({
  args: { id: v.id("topics") },
  handler: async (ctx, args) => {
    const topicIdString = args.id.toString();

    // 1. Remove from other topics' prerequisites
    const otherTopics = await ctx.db.query("topics").collect();
    for (const topic of otherTopics) {
      if (topic.prerequisiteIds.includes(topicIdString)) {
        await ctx.db.patch(topic._id, {
          prerequisiteIds: topic.prerequisiteIds.filter(id => id !== topicIdString),
        });
      }
    }

    // 2. Remove from assignments' topic list
    const assignments = await ctx.db.query("assignments").collect();
    for (const assignment of assignments) {
      if (assignment.topicIds.includes(topicIdString)) {
        await ctx.db.patch(assignment._id, {
          topicIds: assignment.topicIds.filter(id => id !== topicIdString),
        });
      }
    }

    // 3. Remove from readings' topicId field
    const readings = await ctx.db.query("readings").collect();
    for (const reading of readings) {
      if (reading.topicId === topicIdString) {
        await ctx.db.patch(reading._id, {
          topicId: undefined,
        });
      }
    }

    // 4. Delete the topic itself
    await ctx.db.delete(args.id);
  },
});
