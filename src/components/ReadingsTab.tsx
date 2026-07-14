"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  Plus,
  BookOpen,
  Bookmark,
  CheckCircle,
  FileText,
  Video,
  Globe,
  ExternalLink,
  Trash2,
  ListFilter,
  CheckCircle2,
} from "lucide-react";

interface ReadingsTabProps {
  onOpenAddReading: () => void;
}

export default function ReadingsTab({ onOpenAddReading }: ReadingsTabProps) {
  const readings = useQuery(api.readings.listAll);
  const courses = useQuery(api.courses.list);
  const deleteReading = useMutation(api.readings.remove);
  const updateReadingStatus = useMutation(api.readings.updateStatus);

  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  if (!readings || !courses) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  // 1. Filter Readings
  const filteredReadings = readings.filter((r) => {
    const courseMatch = filterCourse === "all" || r.courseId === filterCourse;
    const statusMatch = filterStatus === "all" || r.status === filterStatus;
    return courseMatch && statusMatch;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this reading? Any assignments relying on this reading as a prerequisite will have the dependency removed.")) {
      return;
    }
    try {
      await deleteReading({ id: id as Id<"readings"> });
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    let nextStatus = "unread";
    if (currentStatus === "unread") nextStatus = "reading";
    else if (currentStatus === "reading") nextStatus = "completed";
    else if (currentStatus === "completed") nextStatus = "unread";

    try {
      await updateReadingStatus({
        id: id as Id<"readings">,
        status: nextStatus,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const getReadingIcon = (type: string) => {
    switch (type) {
      case "book":
        return <BookOpen className="h-4 w-4 text-amber-400" />;
      case "video":
        return <Video className="h-4 w-4 text-rose-400" />;
      case "article":
        return <Globe className="h-4 w-4 text-sky-400" />;
      case "paper":
      default:
        return <FileText className="h-4 w-4 text-emerald-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-3xs font-extrabold text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
            Completed
          </span>
        );
      case "reading":
        return (
          <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-3xs font-extrabold text-indigo-400 border border-indigo-500/20 uppercase tracking-wider animate-pulse">
            Reading
          </span>
        );
      case "unread":
      default:
        return (
          <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-3xs font-extrabold text-slate-400 border border-slate-700 uppercase tracking-wider">
            Unread
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 2. Controls and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div className="flex flex-wrap gap-3">
          {/* Course filter select */}
          <div className="flex items-center gap-2">
            <ListFilter className="h-4 w-4 text-slate-500" />
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 font-semibold focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter select */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 font-semibold focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="unread">Unread</option>
            <option value="reading">Reading</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <button
          onClick={onOpenAddReading}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus className="h-4 w-4" /> Add Syllabus Reading
        </button>
      </div>

      {/* 3. Grid of Readings */}
      {filteredReadings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
          <BookOpen className="h-12 w-12 text-slate-700 mb-3" />
          <p className="text-sm font-semibold text-slate-400">No readings found matching this filter.</p>
          <p className="text-xs text-slate-500 mt-1">Try changing filters or add a new reading material above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReadings.map((r) => (
            <div
              key={r._id}
              className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/50 hover:bg-slate-950 p-5 shadow transition-all duration-200 flex flex-col justify-between hover:border-slate-700 group"
            >
              {/* Top Row: Course and Icons */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    style={{
                      backgroundColor: `${r.courseColor}15`,
                      color: r.courseColor,
                      borderColor: `${r.courseColor}25`,
                    }}
                    className="px-2 py-0.5 rounded text-3xs font-extrabold border uppercase tracking-wider"
                  >
                    {r.courseCode}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-slate-900 border border-slate-800">
                      {getReadingIcon(r.type)}
                    </span>
                    {r.url && (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-500 hover:text-indigo-400 transition cursor-pointer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(r._id)}
                      className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white leading-snug group-hover:text-indigo-400 transition">
                  {r.title}
                </h3>

                {r.citation && (
                  <p className="text-3xs text-slate-500 font-semibold">
                    Citation: {r.citation}
                  </p>
                )}
              </div>

              {/* Bottom Row: Actions */}
              <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-slate-900/60">
                <div className="flex items-center gap-1.5">
                  <span className="text-3xs text-slate-500 font-semibold uppercase tracking-wider">
                    Status:
                  </span>
                  {getStatusBadge(r.status)}
                </div>

                <button
                  onClick={() => handleToggleStatus(r._id, r.status)}
                  className={`px-3 py-1.5 rounded-lg text-2xs font-bold transition-all duration-200 cursor-pointer ${
                    r.status === "completed"
                      ? "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                      : r.status === "reading"
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/10 hover:bg-emerald-500"
                      : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 hover:bg-indigo-500"
                  }`}
                >
                  {r.status === "unread"
                    ? "Start Reading"
                    : r.status === "reading"
                    ? "Mark Completed"
                    : "Reset Status"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
