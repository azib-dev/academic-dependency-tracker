"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/Dialog";
import { Plus, X, Calendar, Clock, BookOpen, Layers } from "lucide-react";

// ==========================================
// 1. ADD COURSE MODAL
// ==========================================
interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddCourseModal({ isOpen, onClose }: AddCourseModalProps) {
  const createCourse = useMutation(api.courses.create);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");

  const colors = [
    "#ef4444", // Red
    "#f97316", // Orange
    "#f59e0b", // Amber/Yellow
    "#10b981", // Green
    "#06b6d4", // Cyan
    "#3b82f6", // Blue
    "#6366f1", // Indigo
    "#8b5cf6", // Purple
    "#ec4899", // Pink
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) return;
    try {
      await createCourse({ code, name, color });
      setCode("");
      setName("");
      setColor("#3b82f6");
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] border-slate-800 bg-slate-950 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-500" />
            Add New Course
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Create a university course to track your academic workload.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Course Code
            </label>
            <input
              type="text"
              placeholder="e.g. CS301"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Course Name
            </label>
            <input
              type="text"
              placeholder="e.g. Distributed Systems"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
              Course Accent Color
            </label>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    color === c
                      ? "border-white scale-110 shadow-lg shadow-white/10"
                      : "border-transparent hover:scale-105"
                  }`}
                />
              ))}
            </div>
          </div>
          <DialogFooter className="pt-4 border-t border-slate-900">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white transition text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition text-sm cursor-pointer"
            >
              Add Course
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// 2. ADD READING MODAL
// ==========================================
interface AddReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddReadingModal({ isOpen, onClose }: AddReadingModalProps) {
  const courses = useQuery(api.courses.list);
  const createReading = useMutation(api.readings.create);

  const [courseId, setCourseId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("paper");
  const [url, setUrl] = useState("");
  const [citation, setCitation] = useState("");
  const [status, setStatus] = useState("unread");

  useEffect(() => {
    if (courses && courses.length > 0 && !courseId) {
      setCourseId(courses[0]._id);
    }
  }, [courses, courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !title) return;
    try {
      await createReading({
        courseId: courseId as Id<"courses">,
        title,
        type,
        url: url || undefined,
        citation: citation || undefined,
        status,
      });
      setTitle("");
      setUrl("");
      setCitation("");
      setStatus("unread");
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] border-slate-800 bg-slate-950 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-500" />
            Add Reference Reading
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Log research papers, chapters, or textbook readings mapping to courses.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Course
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                required
              >
                {courses?.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Reading Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              >
                <option value="paper">Research Paper</option>
                <option value="book">Textbook/Book Chapter</option>
                <option value="article">Web Article</option>
                <option value="video">Lecture Video</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Title / Resource Name
            </label>
            <input
              type="text"
              placeholder="e.g. Paxos Made Simple"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Resource URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Citation / Author (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Leslie Lamport"
                value={citation}
                onChange={(e) => setCitation(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              >
                <option value="unread">Not Started (Unread)</option>
                <option value="reading">In Progress (Reading)</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-900 col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white transition text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition text-sm cursor-pointer"
            >
              Add Reading
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// 3. ADD ASSIGNMENT MODAL
// ==========================================
interface AddAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddAssignmentModal({ isOpen, onClose }: AddAssignmentModalProps) {
  const courses = useQuery(api.courses.list);
  const assignments = useQuery(api.assignments.listDetailed);
  const readings = useQuery(api.readings.listAll);
  const createAssignment = useMutation(api.assignments.create);

  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [estimatedHours, setEstimatedHours] = useState<number>(3);
  const [prereqReadings, setPrereqReadings] = useState<string[]>([]);
  const [prereqAssignments, setPrereqAssignments] = useState<string[]>([]);

  useEffect(() => {
    if (courses && courses.length > 0 && !courseId) {
      setCourseId(courses[0]._id);
    }
  }, [courses, courseId]);

  const toggleReading = (id: string) => {
    setPrereqReadings((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAssignment = (id: string) => {
    setPrereqAssignments((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !title || !dueDate) return;
    try {
      await createAssignment({
        courseId: courseId as Id<"courses">,
        title,
        description: description || undefined,
        dueDate,
        status: "todo",
        priority,
        estimatedHours,
        prerequisiteReadings: prereqReadings as Id<"readings">[],
        prerequisiteAssignments: prereqAssignments as Id<"assignments">[],
      });
      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("medium");
      setEstimatedHours(3);
      setPrereqReadings([]);
      setPrereqAssignments([]);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter readings and assignments to only show the ones for the selected course
  const filteredReadings = readings?.filter((r) => r.courseId === courseId) || [];
  const filteredAssignments = assignments?.filter((a) => a.courseId === courseId) || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto border-slate-800 bg-slate-950 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-500" />
            Create Assignment
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Log a new assignment and map out prerequisite reading materials or sub-tasks.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Course
              </label>
              <select
                value={courseId}
                onChange={(e) => {
                  setCourseId(e.target.value);
                  setPrereqReadings([]);
                  setPrereqAssignments([]);
                }}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                required
              >
                {courses?.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Assignment Title
            </label>
            <input
              type="text"
              placeholder="e.g. Lab 2: Implement Single-Decree Paxos"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Description (Optional)
            </label>
            <textarea
              placeholder="Provide assignment parameters, criteria, or sub-tasks..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[70px] rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Estimated Hours
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Dependency Mappings */}
          <div className="border-t border-slate-900 pt-3 mt-2 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Prerequisite Mappings (Academic Dependencies)
            </h4>

            {/* Readings Checklist */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Required Readings / References
              </label>
              {filteredReadings.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No readings logged for this course yet.</p>
              ) : (
                <div className="max-h-[100px] overflow-y-auto border border-slate-800 bg-slate-950/60 rounded-lg p-2 space-y-1.5 scrollbar-thin">
                  {filteredReadings.map((r) => (
                    <label
                      key={r._id}
                      className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={prereqReadings.includes(r._id)}
                        onChange={() => toggleReading(r._id)}
                        className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-950"
                      />
                      <span>
                        <span className="font-semibold text-emerald-400">[{r.type}]</span> {r.title}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Assignments Checklist */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Prerequisite Assignments (Must Complete First)
              </label>
              {filteredAssignments.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No other assignments in this course yet.</p>
              ) : (
                <div className="max-h-[100px] overflow-y-auto border border-slate-800 bg-slate-950/60 rounded-lg p-2 space-y-1.5 scrollbar-thin">
                  {filteredAssignments.map((a) => (
                    <label
                      key={a._id}
                      className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={prereqAssignments.includes(a._id)}
                        onChange={() => toggleAssignment(a._id)}
                        className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-950"
                      />
                      <span>{a.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-900 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white transition text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition text-sm cursor-pointer"
            >
              Log Assignment
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// 4. LOG TIME MODAL
// ==========================================
interface LogTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedAssignmentId?: string;
}

export function LogTimeModal({
  isOpen,
  onClose,
  preselectedAssignmentId,
}: LogTimeModalProps) {
  const assignments = useQuery(api.assignments.listDetailed);
  const addTimeLog = useMutation(api.assignments.addTimeLog);

  const [assignmentId, setAssignmentId] = useState("");
  const [date, setDate] = useState("");
  const [hoursSpent, setHoursSpent] = useState<number>(1);
  const [notes, setNotes] = useState("");

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
  }, [isOpen]);

  useEffect(() => {
    if (preselectedAssignmentId) {
      setAssignmentId(preselectedAssignmentId);
    } else if (assignments && assignments.length > 0 && !assignmentId) {
      // Find first incomplete assignment to default to
      const incomplete = assignments.find((a) => a.status !== "completed");
      setAssignmentId(incomplete ? incomplete._id : assignments[0]._id);
    }
  }, [assignments, preselectedAssignmentId, assignmentId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentId || !date || !hoursSpent) return;
    try {
      await addTimeLog({
        assignmentId: assignmentId as Id<"assignments">,
        date,
        hoursSpent,
        notes: notes || undefined,
      });
      setHoursSpent(1);
      setNotes("");
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const activeAssignment = assignments?.find((a) => a._id === assignmentId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] border-slate-800 bg-slate-950 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-500" />
            Log Study Session
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Record actual hours spent studying or working on an assignment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Assignment
            </label>
            {preselectedAssignmentId && activeAssignment ? (
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-300 font-medium">
                {activeAssignment.title}
              </div>
            ) : (
              <select
                value={assignmentId}
                onChange={(e) => setAssignmentId(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                required
              >
                {assignments?.map((a) => (
                  <option key={a._id} value={a._id}>
                    [{a.courseCode}] {a.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Hours Spent
              </label>
              <input
                type="number"
                min="0.25"
                step="0.25"
                value={hoursSpent}
                onChange={(e) => setHoursSpent(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Completed initial design, worked on Paxos proposer"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <DialogFooter className="pt-4 border-t border-slate-900 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white transition text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition text-sm cursor-pointer"
            >
              Log Session
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
