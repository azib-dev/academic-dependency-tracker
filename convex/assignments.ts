import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listDetailed = query({
  args: {},
  handler: async (ctx) => {
    const assignments = await ctx.db.query("assignments").collect();
    const courses = await ctx.db.query("courses").collect();
    const readings = await ctx.db.query("readings").collect();

    const coursesMap = new Map(courses.map((c) => [c._id, c]));
    const readingsMap = new Map(readings.map((r) => [r._id, r]));
    const assignmentsMap = new Map(assignments.map((a) => [a._id, a]));

    const result = [];
    for (const a of assignments) {
      const course = coursesMap.get(a.courseId);

      // Resolve prerequisite readings details
      const prereqReadingsResolved = a.prerequisiteReadings
        .map((rId) => {
          const r = readingsMap.get(rId);
          return r ? { id: r._id, title: r.title, status: r.status } : null;
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      // Resolve prerequisite assignments details
      const prereqAssignmentsResolved = a.prerequisiteAssignments
        .map((aId) => {
          const pa = assignmentsMap.get(aId);
          return pa ? { id: pa._id, title: pa.title, status: pa.status } : null;
        })
        .filter((pa): pa is NonNullable<typeof pa> => pa !== null);

      // Calculate if blocked
      // An assignment is blocked if:
      // - Any prerequisite reading is NOT "completed"
      // - Any prerequisite assignment is NOT "completed"
      const blockedByReadings = prereqReadingsResolved.filter((r) => r && r.status !== "completed");
      const blockedByAssignments = prereqAssignmentsResolved.filter((pa) => pa && pa.status !== "completed");
      const isBlocked = blockedByReadings.length > 0 || blockedByAssignments.length > 0;

      result.push({
        ...a,
        courseCode: course?.code || "UNKNOWN",
        courseName: course?.name || "Unknown Course",
        courseColor: course?.color || "#3b82f6",
        prereqReadingsDetails: prereqReadingsResolved,
        prereqAssignmentsDetails: prereqAssignmentsResolved,
        isBlocked,
        blockedByReadingsCount: blockedByReadings.length,
        blockedByAssignmentsCount: blockedByAssignments.length,
      });
    }

    return result;
  },
});

export const create = mutation({
  args: {
    courseId: v.id("courses"),
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.string(),
    status: v.string(),
    priority: v.string(),
    estimatedHours: v.number(),
    prerequisiteReadings: v.array(v.id("readings")),
    prerequisiteAssignments: v.array(v.id("assignments")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("assignments", {
      courseId: args.courseId,
      title: args.title,
      description: args.description,
      dueDate: args.dueDate,
      status: args.status,
      priority: args.priority,
      estimatedHours: args.estimatedHours,
      actualHours: 0,
      prerequisiteReadings: args.prerequisiteReadings,
      prerequisiteAssignments: args.prerequisiteAssignments,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("assignments"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    estimatedHours: v.optional(v.number()),
    actualHours: v.optional(v.number()),
    prerequisiteReadings: v.optional(v.array(v.id("readings"))),
    prerequisiteAssignments: v.optional(v.array(v.id("assignments"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("assignments") },
  handler: async (ctx, args) => {
    // Clean up dependencies referencing this assignment in other assignments
    const allAssignments = await ctx.db.query("assignments").collect();
    for (const a of allAssignments) {
      if (a.prerequisiteAssignments.includes(args.id)) {
        await ctx.db.patch(a._id, {
          prerequisiteAssignments: a.prerequisiteAssignments.filter((id) => id !== args.id),
        });
      }
    }

    // Clean up associated time logs
    const logs = await ctx.db
      .query("timeLogs")
      .filter((q) => q.eq(q.field("assignmentId"), args.id))
      .collect();
    for (const log of logs) {
      await ctx.db.delete(log._id);
    }

    await ctx.db.delete(args.id);
  },
});

export const addTimeLog = mutation({
  args: {
    assignmentId: v.id("assignments"),
    date: v.string(),
    hoursSpent: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Insert log
    await ctx.db.insert("timeLogs", {
      assignmentId: args.assignmentId,
      date: args.date,
      hoursSpent: args.hoursSpent,
      notes: args.notes,
    });

    // Increment actualHours on assignment
    const assignment = await ctx.db.get(args.assignmentId);
    if (assignment) {
      await ctx.db.patch(args.assignmentId, {
        actualHours: assignment.actualHours + args.hoursSpent,
      });
    }
  },
});

export const getTimeLogs = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("timeLogs")
      .filter((q) => q.eq(q.field("assignmentId"), args.assignmentId))
      .collect();
  },
});

export const listAllTimeLogs = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db.query("timeLogs").collect();
    const result = [];
    for (const l of logs) {
      const assignment = await ctx.db.get(l.assignmentId);
      const course = assignment ? await ctx.db.get(assignment.courseId) : null;
      result.push({
        ...l,
        assignmentTitle: assignment?.title || "Unknown Assignment",
        courseCode: course?.code || "UNKNOWN",
        courseColor: course?.color || "#3b82f6",
      });
    }
    // Sort by date desc
    return result.sort((a, b) => b.date.localeCompare(a.date));
  },
});
