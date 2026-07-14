"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { formatHours } from "@/lib/utils";
import {
  Plus,
  Trash2,
  BookOpen,
  Calendar,
  Layers,
  Clock,
  PlusCircle,
  Tag,
} from "lucide-react";

interface CoursesTabProps {
  onOpenAddCourse: () => void;
}

export default function CoursesTab({ onOpenAddCourse }: CoursesTabProps) {
  const courses = useQuery(api.courses.list);
  const topics = useQuery(api.topics.listAll);
  const assignments = useQuery(api.assignments.listDetailed);
  const readings = useQuery(api.readings.listAll);

  const createTopic = useMutation(api.topics.create);
  const deleteTopic = useMutation(api.topics.remove);
  const deleteCourse = useMutation(api.courses.remove);

  const [newTopicName, setNewTopicName] = useState<{ [courseId: string]: string }>({});
  const [newTopicDesc, setNewTopicDesc] = useState<{ [courseId: string]: string }>({});

  if (!courses || !topics || !assignments || !readings) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  const handleDeleteCourse = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this course? Doing so will delete all mapped topics, readings, assignments, and time logs. This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      await deleteCourse({ id: id as Id<"courses"> });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTopic = async (courseId: string, e: React.FormEvent) => {
    e.preventDefault();
    const name = newTopicName[courseId];
    const description = newTopicDesc[courseId];
    if (!name) return;

    try {
      await createTopic({
        courseId: courseId as Id<"courses">,
        name,
        description: description || undefined,
      });
      setNewTopicName((prev) => ({ ...prev, [courseId]: "" }));
      setNewTopicDesc((prev) => ({ ...prev, [courseId]: "" }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (!confirm("Are you sure you want to delete this topic?")) {
      return;
    }
    try {
      await deleteTopic({ id: id as Id<"topics"> });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 2. Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-500" />
            University Courses & Syllabus Mapping
          </h2>
          <p className="text-xs text-slate-400">
            Organize coursework into courses and map out prerequisite syllabus topics.
          </p>
        </div>

        <button
          onClick={onOpenAddCourse}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Add Course
        </button>
      </div>

      {/* 3. Courses Grid Layout */}
      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
          <Layers className="h-12 w-12 text-slate-700 mb-3" />
          <p className="text-sm font-semibold text-slate-400">No courses defined yet.</p>
          <p className="text-xs text-slate-500 mt-1">Add your first course using the button above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((c) => {
            const courseAssignments = assignments.filter((a) => a.courseId === c._id);
            const courseReadings = readings.filter((r) => r.courseId === c._id);
            const courseTopics = topics.filter((t) => t.courseId === c._id);

            const estHours = courseAssignments.reduce((acc, curr) => acc + curr.estimatedHours, 0);
            const actHours = courseAssignments.reduce((acc, curr) => acc + curr.actualHours, 0);

            const completedAssignments = courseAssignments.filter((a) => a.status === "completed").length;
            const completedReadings = courseReadings.filter((r) => r.status === "completed").length;

            return (
              <div
                key={c._id}
                className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 shadow-xl hover:border-slate-700 transition flex flex-col justify-between"
              >
                {/* Course Header */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span
                        style={{
                          backgroundColor: `${c.color}20`,
                          color: c.color,
                          borderColor: `${c.color}35`,
                        }}
                        className="px-2.5 py-0.5 rounded text-2xs font-extrabold border uppercase tracking-wider inline-block"
                      >
                        {c.code}
                      </span>
                      <h3 className="text-base font-bold text-white leading-tight">
                        {c.name}
                      </h3>
                    </div>

                    <button
                      onClick={() => handleDeleteCourse(c._id)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/5 transition cursor-pointer"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-900 text-center">
                    <div className="space-y-0.5">
                      <span className="text-2xs text-slate-500 font-semibold block">Assignments</span>
                      <span className="text-xs font-bold text-slate-200">
                        {completedAssignments}/{courseAssignments.length} done
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-2xs text-slate-500 font-semibold block">Readings</span>
                      <span className="text-xs font-bold text-slate-200">
                        {completedReadings}/{courseReadings.length} read
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-2xs text-slate-500 font-semibold block">Total Hours</span>
                      <span className="text-xs font-bold text-indigo-400">
                        {formatHours(actHours)} / {formatHours(estHours)} est
                      </span>
                    </div>
                  </div>

                  {/* Topics List */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5" /> Topics Mapped ({courseTopics.length})
                    </h4>

                    {courseTopics.length === 0 ? (
                      <p className="text-2xs text-slate-500 italic">No topics created. Add a topic below.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin">
                        {courseTopics.map((t) => (
                          <div
                            key={t._id}
                            className="flex items-center justify-between text-xs bg-slate-900/40 border border-slate-900 p-2 rounded-lg hover:border-slate-800 transition"
                          >
                            <div className="space-y-0.5 truncate max-w-[85%]">
                              <span className="font-semibold text-slate-300 block truncate">
                                {t.name}
                              </span>
                              {t.description && (
                                <p className="text-3xs text-slate-500 truncate leading-relaxed">
                                  {t.description}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteTopic(t._id)}
                              className="text-slate-600 hover:text-rose-400 hover:scale-105 active:scale-95 transition cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Add Topic Form inside Course Card */}
                <form
                  onSubmit={(e) => handleAddTopic(c._id, e)}
                  className="mt-5 pt-4 border-t border-slate-900 space-y-2"
                >
                  <span className="text-3xs font-bold text-indigo-400 uppercase tracking-wider block">
                    Add Topic Mapping
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Topic title (e.g. Grignard reagent)"
                      value={newTopicName[c._id] || ""}
                      onChange={(e) =>
                        setNewTopicName((prev) => ({ ...prev, [c._id]: e.target.value }))
                      }
                      className="flex-1 rounded-lg border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                      required
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Short description (optional)"
                    value={newTopicDesc[c._id] || ""}
                    onChange={(e) =>
                      setNewTopicDesc((prev) => ({ ...prev, [c._id]: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
