"use client";

import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatHours } from "@/lib/utils";
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

interface DashboardTabProps {
  onSetActiveTab: (tab: string) => void;
  onOpenLogTime: (assignmentId?: string) => void;
}

export default function DashboardTab({
  onSetActiveTab,
  onOpenLogTime,
}: DashboardTabProps) {
  const assignments = useQuery(api.assignments.listDetailed);
  const readings = useQuery(api.readings.listAll);
  const courses = useQuery(api.courses.list);
  const updateAssignmentStatus = useMutation(api.assignments.update);

  if (!assignments || !readings || !courses) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  // 1. Calculations
  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter((a) => a.status === "completed").length;
  const inProgressAssignments = assignments.filter((a) => a.status === "in_progress").length;
  const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

  const totalEstimated = assignments.reduce((acc, curr) => acc + curr.estimatedHours, 0);
  const totalActual = assignments.reduce((acc, curr) => acc + curr.actualHours, 0);

  const blockedAssignments = assignments.filter(
    (a) => a.status !== "completed" && a.isBlocked
  );
  const readyAssignments = assignments.filter(
    (a) => a.status !== "completed" && !a.isBlocked
  );

  const totalReadings = readings.length;
  const completedReadings = readings.filter((r) => r.status === "completed").length;
  const readingsProgress = totalReadings > 0 ? Math.round((completedReadings / totalReadings) * 100) : 0;

  // Course-specific hours
  const courseHours = courses.map((c) => {
    const courseAssignments = assignments.filter((a) => a.courseId === c._id);
    const est = courseAssignments.reduce((acc, curr) => acc + curr.estimatedHours, 0);
    const act = courseAssignments.reduce((acc, curr) => acc + curr.actualHours, 0);
    return {
      ...c,
      estimated: est,
      actual: act,
    };
  });

  const handleStartAssignment = async (id: string) => {
    try {
      await updateAssignmentStatus({
        id: id as Id<"assignments">,
        status: "in_progress",
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 2. Stat Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stat 1: Study Progress */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-lg">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-indigo-500/10 blur-xl"></div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Assignment Progress</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <CheckCircle2 className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white">{completedAssignments}</span>
            <span className="text-sm text-slate-400">/ {totalAssignments} completed</span>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Completion Rate</span>
              <span>{completionRate}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-900">
              <div
                style={{ width: `${completionRate}%` }}
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
              />
            </div>
          </div>
        </div>

        {/* Stat 2: Hour Balance */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-lg">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-sky-500/10 blur-xl"></div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Time Tracking</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
              <Clock className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white">
              {formatHours(totalActual)}
            </span>
            <span className="text-sm text-slate-400">spent of {formatHours(totalEstimated)} est.</span>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Time Efficiency</span>
              <span>
                {totalEstimated > 0
                  ? `${Math.round((totalActual / totalEstimated) * 100)}% of est.`
                  : "0%"}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-900">
              <div
                style={{
                  width: `${Math.min(
                    totalEstimated > 0 ? (totalActual / totalEstimated) * 100 : 0,
                    100
                  )}%`,
                }}
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-500 transition-all duration-500"
              />
            </div>
          </div>
        </div>

        {/* Stat 3: Dependency Bottlenecks */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-lg">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-rose-500/10 blur-xl"></div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Blocked Assignments</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white">
              {blockedAssignments.length}
            </span>
            <span className="text-sm text-slate-400">locked by prerequisites</span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-slate-400">Requires prep reading/tasks</span>
            <button
              onClick={() => onSetActiveTab("assignments")}
              className="font-medium text-rose-400 hover:text-rose-300 transition flex items-center gap-1 cursor-pointer"
            >
              Resolve <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Stat 4: Syllabus Progress */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-lg">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-xl"></div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Syllabus Readings</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <BookOpen className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white">{completedReadings}</span>
            <span className="text-sm text-slate-400">/ {totalReadings} read</span>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Readings Coverage</span>
              <span>{readingsProgress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-900">
              <div
                style={{ width: `${readingsProgress}%` }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Layout Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left/Middle Column (2/3 width on large screens) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Actionable Next Steps (Ready to Study) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Play className="h-5 w-5 text-indigo-500" />
                  Ready to Start (Unblocked Assignments)
                </h3>
                <p className="text-xs text-slate-400">
                  Prerequisites are completed. These are ready for your immediate focus.
                </p>
              </div>
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-slate-800">
                {readyAssignments.length} ready
              </span>
            </div>

            {readyAssignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-slate-700 mb-2" />
                <p className="text-sm font-medium text-slate-400">All assignments caught up or blocked!</p>
                <p className="text-xs text-slate-500">Go to Readings to unlock more assignments.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-900">
                {readyAssignments.map((a) => (
                  <div
                    key={a._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-3 group transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          style={{
                            backgroundColor: `${a.courseColor}20`,
                            color: a.courseColor,
                            borderColor: `${a.courseColor}30`,
                          }}
                          className="px-2 py-0.5 rounded text-2xs font-bold border"
                        >
                          {a.courseCode}
                        </span>
                        <h4 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition">
                          {a.title}
                        </h4>
                        {a.priority === "high" && (
                          <span className="rounded-full bg-rose-500/10 px-2 py-0.25 text-3xs font-extrabold text-rose-400 uppercase tracking-wider border border-rose-500/20">
                            High Priority
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 max-w-md line-clamp-1">
                        {a.description || "No description provided."}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs font-medium text-slate-300">
                          Est: {formatHours(a.estimatedHours)}
                        </div>
                        <div className="text-2xs text-slate-500">
                          Spent: {formatHours(a.actualHours)}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {a.status === "todo" && (
                          <button
                            onClick={() => handleStartAssignment(a._id)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600/90 text-white font-semibold text-xs hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
                          >
                            Start Work
                          </button>
                        )}
                        {a.status === "in_progress" && (
                          <button
                            onClick={() => onOpenLogTime(a._id)}
                            className="px-3 py-1.5 rounded-lg bg-sky-600/90 text-white font-semibold text-xs hover:bg-sky-500 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer flex items-center gap-1"
                          >
                            <Clock className="h-3.5 w-3.5" /> Log Hours
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Time logs breakdown */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-900 pb-4 mb-4">
              <TrendingUp className="h-5 w-5 text-sky-500" />
              Hours Estimation vs. Actual Spent by Course
            </h3>
            <div className="space-y-4">
              {courseHours.map((ch) => {
                const totalCourseHours = ch.estimated + ch.actual;
                if (totalCourseHours === 0) return null;
                const estWidth = ch.estimated > 0 ? (ch.estimated / Math.max(ch.estimated, ch.actual)) * 100 : 0;
                const actWidth = ch.actual > 0 ? (ch.actual / Math.max(ch.estimated, ch.actual)) * 100 : 0;

                return (
                  <div key={ch._id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">
                        {ch.code} - {ch.name}
                      </span>
                      <span className="text-slate-400">
                        Est: <span className="text-white font-medium">{formatHours(ch.estimated)}</span> | Actual:{" "}
                        <span style={{ color: ch.color }} className="font-bold">
                          {formatHours(ch.actual)}
                        </span>
                      </span>
                    </div>
                    {/* Double progress bars */}
                    <div className="space-y-1">
                      {/* Estimated Bar */}
                      <div className="h-1.5 w-full rounded-full bg-slate-900/60 overflow-hidden">
                        <div
                          style={{ width: `${estWidth}%` }}
                          className="h-full rounded-full bg-slate-600/80 transition-all duration-500"
                        />
                      </div>
                      {/* Actual Bar */}
                      <div className="h-2.5 w-full rounded-full bg-slate-900/60 overflow-hidden">
                        <div
                          style={{
                            width: `${actWidth}%`,
                            backgroundColor: ch.color,
                          }}
                          className="h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.05)]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {courseHours.every((c) => c.estimated === 0 && c.actual === 0) && (
                <p className="text-sm text-slate-500 italic text-center py-4">
                  Log hours on your assignments to populate this graph.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          {/* Prerequisite Readings Queue */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-900 pb-4 mb-4">
              <BookOpen className="h-5 w-5 text-emerald-500" />
              Required Readings Queue
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Read these references to unlock dependent assignments that are currently blocked.
            </p>

            {/* Find uncompleted readings that are prerequisites for incomplete assignments */}
            {(() => {
              const pendingAssignments = assignments.filter((a) => a.status !== "completed");
              const neededReadingIds = new Set<string>();
              pendingAssignments.forEach((a) => {
                a.prerequisiteReadings.forEach((rId) => neededReadingIds.add(rId));
              });

              const neededReadings = readings.filter(
                (r) => r.status !== "completed" && neededReadingIds.has(r._id)
              );

              if (neededReadings.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500/20 mb-2" />
                    <p className="text-xs font-semibold text-slate-400">All required readings completed!</p>
                    <p className="text-2xs text-slate-500">No upcoming assignments are blocked by readings.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {neededReadings.map((r) => (
                    <div
                      key={r._id}
                      className="p-3 rounded-xl border border-slate-900 bg-slate-950/40 hover:border-slate-800 transition space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <span
                            style={{
                              backgroundColor: `${r.courseColor}20`,
                              color: r.courseColor,
                              borderColor: `${r.courseColor}30`,
                            }}
                            className="px-1.5 py-0.25 rounded text-3xs font-extrabold border uppercase tracking-wide inline-block"
                          >
                            {r.courseCode}
                          </span>
                          <h4 className="text-xs font-bold text-white leading-tight">
                            {r.title}
                          </h4>
                          {r.citation && (
                            <p className="text-3xs text-slate-500 font-medium">
                              {r.citation}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-2xs pt-1.5 border-t border-slate-900/60">
                        <span className="text-slate-500 font-medium capitalize">
                          Type: {r.type}
                        </span>
                        <button
                          onClick={() => onSetActiveTab("readings")}
                          className="text-indigo-400 font-semibold hover:text-indigo-300 flex items-center gap-0.5 cursor-pointer"
                        >
                          Study <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Time Logger Quick Stats */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 -mr-6 -mt-6 h-20 w-20 rounded-full bg-violet-500/10 blur-xl"></div>
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
              Study Efficiency Tip
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Your overall estimation ratio is{" "}
              <span className="text-white font-bold">
                {totalEstimated > 0 ? (totalActual / totalEstimated).toFixed(1) : "0.0"}x
              </span>
              . If this ratio is higher than 1.0, you are taking longer than estimated. Use this to calibrate estimates for upcoming work!
            </p>
            <button
              onClick={() => onOpenLogTime()}
              className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Clock className="h-3.5 w-3.5" />
              Log Study Hours
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
