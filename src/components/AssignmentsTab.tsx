"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { formatHours, formatDate } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Play,
  RotateCcw,
  PlusCircle,
} from "lucide-react";

interface AssignmentsTabProps {
  onOpenAddAssignment: () => void;
  onOpenLogTime: (assignmentId?: string) => void;
}

export default function AssignmentsTab({
  onOpenAddAssignment,
  onOpenLogTime,
}: AssignmentsTabProps) {
  const assignments = useQuery(api.assignments.listDetailed);
  const timeLogs = useQuery(api.assignments.listAllTimeLogs);
  const deleteAssignment = useMutation(api.assignments.remove);
  const updateAssignment = useMutation(api.assignments.update);

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!assignments) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  // 1. Filtering
  const filteredAssignments = assignments.filter((a) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "todo") return a.status === "todo";
    if (filterStatus === "in_progress") return a.status === "in_progress";
    if (filterStatus === "completed") return a.status === "completed";
    if (filterStatus === "blocked") return a.status !== "completed" && a.isBlocked;
    if (filterStatus === "ready") return a.status !== "completed" && !a.isBlocked;
    return true;
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this assignment? All associated study time logs will be deleted.")) {
      return;
    }
    try {
      await deleteAssignment({ id: id as Id<"assignments"> });
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await updateAssignment({
        id: id as Id<"assignments">,
        status: newStatus,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      case "medium":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "low":
      default:
        return "text-sky-400 bg-sky-500/10 border-sky-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* 2. Controls and Filter Headers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "All Work" },
            { id: "todo", label: "To Do" },
            { id: "in_progress", label: "In Progress" },
            { id: "completed", label: "Completed" },
            { id: "ready", label: "Ready (Unblocked)" },
            { id: "blocked", label: "Blocked" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                filterStatus === tab.id
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/15"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={onOpenAddAssignment}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Add Assignment
        </button>
      </div>

      {/* 3. List of Assignments */}
      {filteredAssignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
          <HelpCircle className="h-12 w-12 text-slate-700 mb-3" />
          <p className="text-sm font-semibold text-slate-400">No assignments found matching this filter.</p>
          <p className="text-xs text-slate-500 mt-1">Try changing filters or add a new assignment above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAssignments.map((a) => {
            const isExpanded = expandedId === a._id;
            const hasPrereqs =
              a.prerequisiteReadings.length > 0 || a.prerequisiteAssignments.length > 0;
            const progress =
              a.estimatedHours > 0
                ? Math.min(Math.round((a.actualHours / a.estimatedHours) * 100), 100)
                : 0;

            const assignmentLogs = timeLogs?.filter((l) => l.assignmentId === a._id) || [];

            return (
              <div
                key={a._id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? "bg-slate-950 border-slate-700 shadow-xl"
                    : "bg-slate-950/50 hover:bg-slate-950 border-slate-800 hover:border-slate-700 shadow"
                }`}
              >
                {/* Collapsed Header Panel */}
                <div
                  onClick={() => toggleExpand(a._id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Course Badge */}
                      <span
                        style={{
                          backgroundColor: `${a.courseColor}15`,
                          color: a.courseColor,
                          borderColor: `${a.courseColor}25`,
                        }}
                        className="px-2 py-0.5 rounded text-2xs font-bold border"
                      >
                        {a.courseCode}
                      </span>

                      {/* Title */}
                      <h3 className="text-sm font-bold text-white leading-tight">
                        {a.title}
                      </h3>

                      {/* Status Badges */}
                      {a.status === "completed" ? (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.25 text-3xs font-extrabold text-emerald-400 uppercase tracking-wider border border-emerald-500/20">
                          Completed
                        </span>
                      ) : a.status === "in_progress" ? (
                        <span className="rounded-full bg-indigo-500/10 px-2 py-0.25 text-3xs font-extrabold text-indigo-400 uppercase tracking-wider border border-indigo-500/20">
                          In Progress
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-800 px-2 py-0.25 text-3xs font-extrabold text-slate-400 uppercase tracking-wider border border-slate-700">
                          To Do
                        </span>
                      )}

                      {/* Dependency Badge */}
                      {a.status !== "completed" && a.isBlocked && (
                        <span className="rounded-full bg-rose-500/10 px-2 py-0.25 text-3xs font-extrabold text-rose-400 uppercase tracking-wider border border-rose-500/20 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Blocked
                        </span>
                      )}
                      {a.status !== "completed" && !a.isBlocked && hasPrereqs && (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.25 text-3xs font-extrabold text-emerald-400 uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Unlocked
                        </span>
                      )}

                      {/* Priority */}
                      <span
                        className={`rounded-full px-2 py-0.25 text-3xs font-extrabold uppercase tracking-wider border ${getPriorityColor(
                          a.priority
                        )}`}
                      >
                        {a.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-2xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        Due: <span className="font-semibold text-slate-300">{formatDate(a.dueDate)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        Hours: <span className="font-semibold text-slate-300">{formatHours(a.actualHours)}</span> / {formatHours(a.estimatedHours)} est.
                      </span>
                      {hasPrereqs && (
                        <span className="flex items-center gap-1 text-indigo-400">
                          <LinkIcon className="h-3.5 w-3.5" />
                          Prereqs: {a.prerequisiteReadings.length} readings, {a.prerequisiteAssignments.length} assignments
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:self-center">
                    {/* Hour progress preview (ring/bar) */}
                    <div className="hidden sm:block text-right">
                      <div className="h-1.5 w-16 rounded-full bg-slate-900 overflow-hidden">
                        <div
                          style={{ width: `${progress}%` }}
                          className={`h-full rounded-full ${
                            a.status === "completed"
                              ? "bg-emerald-500"
                              : progress > 100
                              ? "bg-rose-500"
                              : "bg-indigo-500"
                          }`}
                        />
                      </div>
                      <span className="text-3xs text-slate-500 font-semibold">{progress}% time</span>
                    </div>

                    <button
                      onClick={(e) => handleDelete(a._id, e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 transition cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="border-t border-slate-900 bg-slate-950 p-6 space-y-6">
                    {/* Description */}
                    {a.description && (
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Assignment Description
                        </h4>
                        <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/40 p-4 rounded-xl border border-slate-900">
                          {a.description}
                        </p>
                      </div>
                    )}

                    {/* Dependencies Mapping Graph */}
                    {hasPrereqs && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Academic Dependencies Map
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Readings Prereqs */}
                          {a.prerequisiteReadings.length > 0 && (
                            <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-4 space-y-3">
                              <h5 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                <CheckCircle className="h-4 w-4" />
                                Prerequisite Readings
                              </h5>
                              <div className="space-y-2">
                                {a.prereqReadingsDetails.map((pr) => (
                                  <div
                                    key={pr.id}
                                    className="flex items-center justify-between text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-900"
                                  >
                                    <span className="font-medium text-slate-300 truncate max-w-[200px]">
                                      {pr.title}
                                    </span>
                                    {pr.status === "completed" ? (
                                      <span className="text-emerald-400 font-bold flex items-center gap-1 text-3xs uppercase">
                                        Done
                                      </span>
                                    ) : (
                                      <span className="text-amber-500 font-bold flex items-center gap-1 text-3xs uppercase animate-pulse">
                                        Reading Required
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Assignment Prereqs */}
                          {a.prerequisiteAssignments.length > 0 && (
                            <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-4 space-y-3">
                              <h5 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                                <CheckCircle className="h-4 w-4" />
                                Prerequisite Assignments
                              </h5>
                              <div className="space-y-2">
                                {a.prereqAssignmentsDetails.map((pa) => (
                                  <div
                                    key={pa.id}
                                    className="flex items-center justify-between text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-900"
                                  >
                                    <span className="font-medium text-slate-300 truncate max-w-[200px]">
                                      {pa.title}
                                    </span>
                                    {pa.status === "completed" ? (
                                      <span className="text-emerald-400 font-bold flex items-center gap-1 text-3xs uppercase">
                                        Completed
                                      </span>
                                    ) : (
                                      <span className="text-rose-400 font-bold flex items-center gap-1 text-3xs uppercase animate-pulse">
                                        Incomplete
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Time Tracking logs details */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Study Time History
                        </h4>
                        <button
                          onClick={() => onOpenLogTime(a._id)}
                          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                        >
                          <PlusCircle className="h-3.5 w-3.5" /> Log Study Session
                        </button>
                      </div>

                      {assignmentLogs.length === 0 ? (
                        <p className="text-xs text-slate-500 italic bg-slate-900/20 p-3 rounded-lg border border-slate-900">
                          No study sessions logged for this assignment yet. Click above to record study hours.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-[150px] overflow-y-auto border border-slate-900 rounded-xl bg-slate-900/20 p-3 scrollbar-thin">
                          {assignmentLogs.map((log) => (
                            <div
                              key={log._id}
                              className="flex items-start justify-between text-xs py-2 border-b border-slate-900/80 last:border-0"
                            >
                              <div className="space-y-0.5">
                                <span className="font-semibold text-slate-300">
                                  {formatDate(log.date)}
                                </span>
                                {log.notes && (
                                  <p className="text-slate-400 text-2xs">{log.notes}</p>
                                )}
                              </div>
                              <span className="font-bold text-indigo-400 whitespace-nowrap">
                                +{formatHours(log.hoursSpent)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-between items-center pt-4 border-t border-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-semibold">Change Status:</span>
                        {a.status === "todo" && (
                          <button
                            onClick={() => handleUpdateStatus(a._id, "in_progress")}
                            disabled={a.isBlocked}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white transition flex items-center gap-1 cursor-pointer ${
                              a.isBlocked
                                ? "bg-slate-900 text-slate-600 border border-slate-950 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-500"
                            }`}
                          >
                            <Play className="h-3 w-3" /> Start Work
                          </button>
                        )}
                        {a.status === "in_progress" && (
                          <button
                            onClick={() => handleUpdateStatus(a._id, "completed")}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle className="h-3 w-3" /> Complete
                          </button>
                        )}
                        {a.status === "completed" && (
                          <button
                            onClick={() => handleUpdateStatus(a._id, "todo")}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold border border-slate-800 text-xs transition flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="h-3 w-3" /> Reset to To Do
                          </button>
                        )}
                      </div>

                      {a.isBlocked && (
                        <p className="text-2xs text-rose-400 font-semibold flex items-center gap-1 select-none">
                          <AlertTriangle className="h-3.5 w-3.5" /> Prerequisites incomplete!
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
