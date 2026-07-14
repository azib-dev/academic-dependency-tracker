import { mutation } from "./_generated/server";

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if courses are already present
    const existingCourses = await ctx.db.query("courses").collect();
    if (existingCourses.length > 0) {
      return "Database already seeded";
    }

    // 1. Insert Courses
    const csId = await ctx.db.insert("courses", {
      code: "CS301",
      name: "Distributed Systems",
      color: "#ef4444", // Red
    });

    const mathId = await ctx.db.insert("courses", {
      code: "MATH250",
      name: "Linear Algebra",
      color: "#3b82f6", // Blue
    });

    const chemId = await ctx.db.insert("courses", {
      code: "CHEM201",
      name: "Organic Chemistry",
      color: "#8b5cf6", // Purple
    });

    const litId = await ctx.db.insert("courses", {
      code: "LIT102",
      name: "Modern Literature",
      color: "#f59e0b", // Yellow/Amber
    });

    // 2. Insert Topics
    const consensusTopic = await ctx.db.insert("topics", {
      courseId: csId,
      name: "Consensus & Paxos",
      description: "Understanding consensus in fault-tolerant distributed systems.",
    });

    const vectorSpaceTopic = await ctx.db.insert("topics", {
      courseId: mathId,
      name: "Vector Spaces & Subspaces",
      description: "Fundamental vector properties, basis, and dimensions.",
    });

    const carbonylTopic = await ctx.db.insert("topics", {
      courseId: chemId,
      name: "Carbonyl Chemistry",
      description: "Nucleophilic addition to carbonyl groups and synthesis pathways.",
    });

    const modernistTopic = await ctx.db.insert("topics", {
      courseId: litId,
      name: "Modernist Poetry",
      description: "Exploration of early 20th-century poetry and movements.",
    });

    // 3. Insert Readings
    const paxosReading = await ctx.db.insert("readings", {
      courseId: csId,
      topicId: consensusTopic,
      title: "Paxos Made Simple by Leslie Lamport",
      type: "paper",
      citation: "ACM SIGACT News, 2001",
      url: "https://lamport.azurewebsites.net/pubs/paxos-simple.pdf",
      status: "completed",
    });

    const raftReading = await ctx.db.insert("readings", {
      courseId: csId,
      topicId: consensusTopic,
      title: "In Search of an Understandable Consensus Algorithm (Raft Paper)",
      type: "paper",
      citation: "USENIX ATC, 2014",
      url: "https://raft.github.io/raft.pdf",
      status: "reading",
    });

    const mapReduceReading = await ctx.db.insert("readings", {
      courseId: csId,
      title: "MapReduce: Simplified Data Processing on Large Clusters",
      type: "paper",
      citation: "OSDI, 2004",
      url: "https://static.googleusercontent.com/media/research.google.com/en//archive/mapreduce-osdi04.pdf",
      status: "unread",
    });

    const basisReading = await ctx.db.insert("readings", {
      courseId: mathId,
      topicId: vectorSpaceTopic,
      title: "Linear Algebra and Its Applications - Chapter 4: Vector Spaces",
      type: "book",
      citation: "David C. Lay",
      status: "completed",
    });

    const carbonylReading = await ctx.db.insert("readings", {
      courseId: chemId,
      topicId: carbonylTopic,
      title: "Organic Chemistry - Chapter 19: Carboxylic Acids and Derivatives",
      type: "book",
      citation: "Clayden, Greeves, & Warren",
      status: "unread",
    });

    const EliotReading = await ctx.db.insert("readings", {
      courseId: litId,
      topicId: modernistTopic,
      title: "The Waste Land by T.S. Eliot",
      type: "article",
      citation: "The Criterion, 1922",
      url: "https://www.poetryfoundation.org/poems/47311/the-waste-land",
      status: "completed",
    });

    // 4. Insert Assignments
    // Assignment 1 (Completed): Vector Basis Proof (MATH250)
    const mathAssignment1 = await ctx.db.insert("assignments", {
      courseId: mathId,
      title: "Problem Set 3: Basis and Dimension",
      description: "Prove properties of linear independence and dimension in R^n subspaces.",
      dueDate: "2026-07-10",
      status: "completed",
      priority: "medium",
      estimatedHours: 5,
      actualHours: 6,
      prerequisiteReadings: [basisReading],
      prerequisiteAssignments: [],
    });

    // Add some time logs for MATH assignment
    await ctx.db.insert("timeLogs", {
      assignmentId: mathAssignment1,
      date: "2026-07-08",
      hoursSpent: 3,
      notes: "Completed problems 1-3. Need to review Basis definition.",
    });
    await ctx.db.insert("timeLogs", {
      assignmentId: mathAssignment1,
      date: "2026-07-09",
      hoursSpent: 3,
      notes: "Solved remaining proofs and typed up the solutions.",
    });

    // Assignment 2 (In Progress): Paxos Implementation (CS301)
    const csAssignment1 = await ctx.db.insert("assignments", {
      courseId: csId,
      title: "Lab 2: Implement Single-Decree Paxos",
      description: "Build a single-decree Paxos consensus node in Go/Java.",
      dueDate: "2026-07-20",
      status: "in_progress",
      priority: "high",
      estimatedHours: 12,
      actualHours: 4,
      prerequisiteReadings: [paxosReading],
      prerequisiteAssignments: [],
    });

    await ctx.db.insert("timeLogs", {
      assignmentId: csAssignment1,
      date: "2026-07-13",
      hoursSpent: 4,
      notes: "Set up the basic Node interfaces and message passing structures.",
    });

    // Assignment 3 (Todo - Blocked): Lab 3: Multi-Paxos Replicated Log (CS301)
    // This depends on Lab 2 (Paxos Implementation) and the Raft Paper reading!
    const csAssignment2 = await ctx.db.insert("assignments", {
      courseId: csId,
      title: "Lab 3: Multi-Paxos Replicated Log",
      description: "Extend single-decree Paxos to support a sequence of consensus decisions.",
      dueDate: "2026-07-30",
      status: "todo",
      priority: "high",
      estimatedHours: 15,
      actualHours: 0,
      prerequisiteReadings: [raftReading],
      prerequisiteAssignments: [csAssignment1],
    });

    // Assignment 4 (Todo - Unblocked): Eliot Essay (LIT102)
    // Depends on Waste Land Reading
    const litAssignment1 = await ctx.db.insert("assignments", {
      courseId: litId,
      title: "Critical Analysis: The Waste Land",
      description: "Write a 1500-word essay analyzing themes of decay and rebirth.",
      dueDate: "2026-07-22",
      status: "todo",
      priority: "medium",
      estimatedHours: 8,
      actualHours: 0,
      prerequisiteReadings: [EliotReading],
      prerequisiteAssignments: [],
    });

    // Assignment 5 (Todo - Blocked): Synthesis Lab: Grignard Reactions (CHEM201)
    // Depends on Carbonyl Reading
    const chemAssignment1 = await ctx.db.insert("assignments", {
      courseId: chemId,
      title: "Pre-Lab Report: Carbonyl Addition",
      description: "Outline synthesis steps and safety guidelines for the reaction.",
      dueDate: "2026-07-25",
      status: "todo",
      priority: "low",
      estimatedHours: 4,
      actualHours: 0,
      prerequisiteReadings: [carbonylReading],
      prerequisiteAssignments: [],
    });

    return "Database seeded successfully!";
  },
});
