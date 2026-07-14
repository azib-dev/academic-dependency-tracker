export interface Topic {
  _id: string;
  _creationTime: number;
  name: string;
  description: string;
  prerequisiteIds: string[];
  color: string;
}

export interface Reading {
  _id: string;
  _creationTime: number;
  title: string;
  author?: string;
  url?: string;
  status: string; // "to_read" | "reading" | "completed"
  topicId?: string;
}

export interface Assignment {
  _id: string;
  _creationTime: number;
  title: string;
  course: string;
  dueDate: string;
  status: string; // "not_started" | "in_progress" | "completed"
  estimatedHours: number;
  actualHours: number;
  topicIds: string[];
  readingIds: string[];
  notes?: string;
}

// A topic is completed if all readings associated with it are completed
// AND all assignments associated with it are completed.
// If a topic has no readings and no assignments, we consider it completed
// if its prerequisites are completed.
export function isTopicCompleted(
  topicId: string,
  allTopics: Topic[],
  allAssignments: Assignment[],
  allReadings: Reading[],
  visited: Set<string> = new Set()
): boolean {
  if (visited.has(topicId)) return true; // prevent infinite loops
  visited.add(topicId);

  const topic = allTopics.find(t => t._id === topicId);
  if (!topic) return false;

  // 1. Check prerequisites first
  for (const prereqId of topic.prerequisiteIds) {
    if (!isTopicCompleted(prereqId, allTopics, allAssignments, allReadings, visited)) {
      return false;
    }
  }

  // 2. Check readings linked to this topic
  const topicReadings = allReadings.filter(r => r.topicId === topicId);
  const hasUncompletedReadings = topicReadings.some(r => r.status !== "completed");
  if (hasUncompletedReadings) return false;

  // 3. Check assignments linked to this topic
  const topicAssignments = allAssignments.filter(a => a.topicIds.includes(topicId));
  // Only check assignments that are NOT the one we might be currently evaluating.
  // Wait, if an assignment is completed, it's fine. If there are uncompleted assignments for this topic,
  // then the topic is not fully completed.
  const hasUncompletedAssignments = topicAssignments.some(a => a.status !== "completed");
  if (hasUncompletedAssignments) return false;

  // If there are no readings or assignments, and prerequisites are met, it's complete.
  return true;
}

// Find prerequisite topics that are not completed yet
export function getUnmetPrerequisitesForTopic(
  topicId: string,
  allTopics: Topic[],
  allAssignments: Assignment[],
  allReadings: Reading[]
): Topic[] {
  const topic = allTopics.find(t => t._id === topicId);
  if (!topic) return [];

  const unmet: Topic[] = [];
  for (const prereqId of topic.prerequisiteIds) {
    if (!isTopicCompleted(prereqId, allTopics, allAssignments, allReadings)) {
      const prereqTopic = allTopics.find(t => t._id === prereqId);
      if (prereqTopic) {
        unmet.push(prereqTopic);
      }
    }
  }
  return unmet;
}

export interface UnmetDependencies {
  unmetPrereqTopics: Topic[];
  uncompletedReadings: Reading[];
}

// Check an assignment for any unmet prerequisite topics or uncompleted readings
export function getUnmetDependenciesForAssignment(
  assignment: Assignment,
  allTopics: Topic[],
  allAssignments: Assignment[],
  allReadings: Reading[]
): UnmetDependencies {
  const unmetPrereqTopics: Topic[] = [];
  const uncompletedReadings: Reading[] = [];

  // Check the assignment's own linked readings
  for (const readingId of assignment.readingIds) {
    const reading = allReadings.find(r => r._id === readingId);
    if (reading && reading.status !== "completed") {
      uncompletedReadings.push(reading);
    }
  }

  // Check the assignment's target topics for unmet prerequisites
  for (const topicId of assignment.topicIds) {
    const unmetPrereqs = getUnmetPrerequisitesForTopic(topicId, allTopics, allAssignments, allReadings);
    for (const prereq of unmetPrereqs) {
      if (!unmetPrereqTopics.some(t => t._id === prereq._id)) {
        unmetPrereqTopics.push(prereq);
      }
    }

    // Also check if the topic itself has readings that are not completed (if they aren't already in readingIds)
    const topicReadings = allReadings.filter(r => r.topicId === topicId && r.status !== "completed");
    for (const tr of topicReadings) {
      if (!assignment.readingIds.includes(tr._id) && !uncompletedReadings.some(r => r._id === tr._id)) {
        uncompletedReadings.push(tr);
      }
    }
  }

  return {
    unmetPrereqTopics,
    uncompletedReadings,
  };
}
