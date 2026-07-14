"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import * as Tabs from "@radix-ui/react-tabs";
import * as Dialog from "@radix-ui/react-dialog";
import * as Progress from "@radix-ui/react-progress";
import {
  BookOpen,
  GraduationCap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  Calendar,
  ChevronRight,
  BookMarked,
  Layers,
  Activity,
  Check,
  Search,
  BookOpenCheck,
  Timer,
  Info,
  X
} from "lucide-react";
import {
  Topic,
  Reading,
  Assignment,
  isTopicCompleted,
  getUnmetPrerequisitesForTopic,
  getUnmetDependenciesForAssignment
} from "./utils";

export default function Dashboard() {
  // Convex queries
  const assignments = useQuery(api.assignments.getWithDetails) as (Assignment & { topics: Topic[]; readings: Reading[] })[] | undefined;
  const topics = useQuery(api.topics.get) as Topic[] | undefined;
  const readings = useQuery(api.readings.get) as Reading[] | undefined;

  // Convex mutations
  const createAssignment = useMutation(api.assignments.create);
  const updateAssignment = useMutation(api.assignments.update);
  const deleteAssignment = useMutation(api.assignments.remove);
  const logAssignmentHours = useMutation(api.assignments.logHours);

  const createTopic = useMutation(api.topics.create);
  const updateTopic = useMutation(api.topics.update);
  const deleteTopic = useMutation(api.topics.remove);

  const createReading = useMutation(api.readings.create);
  const updateReading = useMutation(api.readings.update);
  const deleteReading = useMutation(api.readings.remove);

  // App states
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dependencyFilter, setDependencyFilter] = useState("all"); // "all" | "met" | "unmet"

  // Dialog States
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  const [readingModalOpen, setReadingModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<Reading | null>(null);

  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [viewingNotesAssignment, setViewingNotesAssignment] = useState<Assignment | null>(null);

  // Form States
  // Assignment Form
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentCourse, setAssignmentCourse] = useState("");
  const [assignmentDueDate, setAssignmentDueDate] = useState("");
  const [assignmentStatus, setAssignmentStatus] = useState("not_started");
  const [assignmentEstHours, setAssignmentEstHours] = useState(2);
  const [assignmentActHours, setAssignmentActHours] = useState(0);
  const [assignmentTopicIds, setAssignmentTopicIds] = useState<string[]>([]);
  const [assignmentReadingIds, setAssignmentReadingIds] = useState<string[]>([]);
  const [assignmentNotes, setAssignmentNotes] = useState("");

  // Topic Form
  const [topicName, setTopicName] = useState("");
  const [topicDesc, setTopicDesc] = useState("");
  const [topicPrereqs, setTopicPrereqs] = useState<string[]>([]);
  const [topicColor, setTopicColor] = useState("#6366f1");

  // Reading Form
  const [readingTitle, setReadingTitle] = useState("");
  const [readingAuthor, setReadingAuthor] = useState("");
  const [readingUrl, setReadingUrl] = useState("");
  const [readingStatus, setReadingStatus] = useState("to_read");
  const [readingTopicId, setReadingTopicId] = useState("");

  // Timer States
  const [timerAssignmentId, setTimerAssignmentId] = useState<string>("");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  // Effect for Timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning]);

  const startTimer = () => {
    if (!timerAssignmentId) return;
    setTimerRunning(true);
  };

  const pauseTimer = () => {
    setTimerRunning(false);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimerSeconds(0);
  };

  const handleSaveTimer = async () => {
    if (!timerAssignmentId || timerSeconds === 0) return;
    const hours = Number((timerSeconds / 3600).toFixed(2));
    try {
      await logAssignmentHours({
        id: timerAssignmentId as Id<"assignments">,
        additionalHours: hours,
      });
      setTimerSeconds(0);
      setTimerRunning(false);
      alert(`Logged ${hours} hours successfully!`);
    } catch (err) {
      console.error(err);
      alert("Failed to log timer session.");
    }
  };

  const [manualLogHours, setManualLogHours] = useState(1);
  const handleManualLog = async () => {
    if (!timerAssignmentId || manualLogHours <= 0) return;
    try {
      await logAssignmentHours({
        id: timerAssignmentId as Id<"assignments">,
        additionalHours: manualLogHours,
      });
      alert(`Logged ${manualLogHours} hours successfully!`);
    } catch (err) {
      console.error(err);
      alert("Failed to log hours.");
    }
  };

  // Pre-fill Forms for Edit
  const openEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setAssignmentTitle(assignment.title);
    setAssignmentCourse(assignment.course);
    setAssignmentDueDate(assignment.dueDate);
    setAssignmentStatus(assignment.status);
    setAssignmentEstHours(assignment.estimatedHours);
    setAssignmentActHours(assignment.actualHours);
    setAssignmentTopicIds(assignment.topicIds);
    setAssignmentReadingIds(assignment.readingIds);
    setAssignmentNotes(assignment.notes || "");
    setAssignmentModalOpen(true);
  };

  const openNewAssignment = () => {
    setEditingAssignment(null);
    setAssignmentTitle("");
    setAssignmentCourse("");
    setAssignmentDueDate(new Date().toISOString().split("T")[0]);
    setAssignmentStatus("not_started");
    setAssignmentEstHours(3);
    setAssignmentActHours(0);
    setAssignmentTopicIds([]);
    setAssignmentReadingIds([]);
    setAssignmentNotes("");
    setAssignmentModalOpen(true);
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentTitle || !assignmentCourse || !assignmentDueDate) return;

    try {
      if (editingAssignment) {
        await updateAssignment({
          id: editingAssignment._id as Id<"assignments">,
          title: assignmentTitle,
          course: assignmentCourse,
          dueDate: assignmentDueDate,
          status: assignmentStatus,
          estimatedHours: Number(assignmentEstHours),
          actualHours: Number(assignmentActHours),
          topicIds: assignmentTopicIds,
          readingIds: assignmentReadingIds,
          notes: assignmentNotes,
        });
      } else {
        await createAssignment({
          title: assignmentTitle,
          course: assignmentCourse,
          dueDate: assignmentDueDate,
          status: assignmentStatus,
          estimatedHours: Number(assignmentEstHours),
          actualHours: Number(assignmentActHours),
          topicIds: assignmentTopicIds,
          readingIds: assignmentReadingIds,
          notes: assignmentNotes,
        });
      }
      setAssignmentModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save assignment.");
    }
  };

  // Topic Form Management
  const openEditTopic = (topic: Topic) => {
    setEditingTopic(topic);
    setTopicName(topic.name);
    setTopicDesc(topic.description);
    setTopicPrereqs(topic.prerequisiteIds);
    setTopicColor(topic.color);
    setTopicModalOpen(true);
  };

  const openNewTopic = () => {
    setEditingTopic(null);
    setTopicName("");
    setTopicDesc("");
    setTopicPrereqs([]);
    setTopicColor("#6366f1");
    setTopicModalOpen(true);
  };

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName) return;

    try {
      if (editingTopic) {
        await updateTopic({
          id: editingTopic._id as Id<"topics">,
          name: topicName,
          description: topicDesc,
          prerequisiteIds: topicPrereqs,
          color: topicColor,
        });
      } else {
        await createTopic({
          name: topicName,
          description: topicDesc,
          prerequisiteIds: topicPrereqs,
          color: topicColor,
        });
      }
      setTopicModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save topic.");
    }
  };

  // Reading Form Management
  const openEditReading = (reading: Reading) => {
    setEditingReading(reading);
    setReadingTitle(reading.title);
    setReadingAuthor(reading.author || "");
    setReadingUrl(reading.url || "");
    setReadingStatus(reading.status);
    setReadingTopicId(reading.topicId || "");
    setReadingModalOpen(true);
  };

  const openNewReading = () => {
    setEditingReading(null);
    setReadingTitle("");
    setReadingAuthor("");
    setReadingUrl("");
    setReadingStatus("to_read");
    setReadingTopicId("");
    setReadingModalOpen(true);
  };

  const handleSaveReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!readingTitle) return;

    try {
      if (editingReading) {
        await updateReading({
          id: editingReading._id as Id<"readings">,
          title: readingTitle,
          author: readingAuthor || undefined,
          url: readingUrl || undefined,
          status: readingStatus,
          topicId: readingTopicId || undefined,
        });
      } else {
        await createReading({
          title: readingTitle,
          author: readingAuthor || undefined,
          url: readingUrl || undefined,
          status: readingStatus,
          topicId: readingTopicId || undefined,
        });
      }
      setReadingModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save reading.");
    }
  };

  // Fast Calculations
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Filter Logic
  const filteredAssignments = assignments?.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.course.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;

    let matchesDependency = true;
    if (dependencyFilter !== "all" && topics && readings) {
      const { unmetPrereqTopics, uncompletedReadings } = getUnmetDependenciesForAssignment(
        a,
        topics,
        assignments || [],
        readings
      );
      const hasUnmet = unmetPrereqTopics.length > 0 || uncompletedReadings.length > 0;
      matchesDependency = dependencyFilter === "unmet" ? hasUnmet : !hasUnmet;
    }

    return matchesSearch && matchesStatus && matchesDependency;
  });

  // Calculate Metrics
  const totalEstHours = assignments?.reduce((acc, a) => acc + a.estimatedHours, 0) || 0;
  const totalActHours = assignments?.reduce((acc, a) => acc + a.actualHours, 0) || 0;
  const totalCompleted = assignments?.filter((a) => a.status === "completed").length || 0;
  const totalAssignmentsCount = assignments?.length || 0;
  const totalReadingsCount = readings?.length || 0;
  const completedReadingsCount = readings?.filter((r) => r.status === "completed").length || 0;

  // Unmet Dependencies Warnings list for dashboard
  const warningsList = assignments
    ?.filter((a) => a.status !== "completed")
    .map((a) => {
      const { unmetPrereqTopics, uncompletedReadings } = getUnmetDependenciesForAssignment(
        a,
        topics || [],
        assignments || [],
        readings || []
      );
      return {
        assignment: a,
        unmetTopics: unmetPrereqTopics,
        unmetReadings: uncompletedReadings,
      };
    })
    .filter((w) => w.unmetTopics.length > 0 || w.unmetReadings.length > 0) || [];

  return (
    <div className="flex-1 flex flex-col w-full min-h-screen">
      {/* Header Banner */}
      <header className="border-b border-zinc-800 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600/20 text-indigo-400 p-2 rounded-xl border border-indigo-500/30">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">Academic Dependency Tracker</h1>
              <p className="text-xs text-zinc-400">Map prerequisites, log studies, track time.</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full flex items-center space-x-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
              <span>Convex Connected</span>
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col w-full">
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 text-sm font-medium mb-2">
              <span>Study Hours Progress</span>
              <Clock className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold tracking-tight text-white">{totalActHours.toFixed(1)}</span>
              <span className="text-zinc-500 text-xs">/ {totalEstHours.toFixed(1)} est. hours</span>
            </div>
            <div className="mt-4">
              <Progress.Root
                className="relative overflow-hidden bg-zinc-850 rounded-full w-full h-2.5 border border-zinc-800"
                value={totalEstHours > 0 ? (totalActHours / totalEstHours) * 100 : 0}
              >
                <Progress.Indicator
                  className="bg-indigo-600 h-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(totalEstHours > 0 ? (totalActHours / totalEstHours) * 100 : 0, 100)}%` }}
                />
              </Progress.Root>
              <div className="flex justify-between text-[10px] text-zinc-500 mt-1.5">
                <span>{(totalEstHours > 0 ? (totalActHours / totalEstHours) * 100 : 0).toFixed(0)}% Completed</span>
                <span>{totalActHours > totalEstHours ? "Overtime Logged" : "On Schedule"}</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 text-sm font-medium mb-2">
              <span>Completed Assignments</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold tracking-tight text-white">{totalCompleted}</span>
              <span className="text-zinc-500 text-xs">/ {totalAssignmentsCount} total</span>
            </div>
            <div className="mt-4">
              <Progress.Root
                className="relative overflow-hidden bg-zinc-850 rounded-full w-full h-2.5 border border-zinc-800"
                value={totalAssignmentsCount > 0 ? (totalCompleted / totalAssignmentsCount) * 100 : 0}
              >
                <Progress.Indicator
                  className="bg-emerald-500 h-full transition-all duration-500 ease-out"
                  style={{ width: `${totalAssignmentsCount > 0 ? (totalCompleted / totalAssignmentsCount) * 100 : 0}%` }}
                />
              </Progress.Root>
              <div className="flex justify-between text-[10px] text-zinc-500 mt-1.5">
                <span>{(totalAssignmentsCount > 0 ? (totalCompleted / totalAssignmentsCount) * 100 : 0).toFixed(0)}% Finished</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 text-sm font-medium mb-2">
              <span>Readings Mastery</span>
              <BookOpenCheck className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold tracking-tight text-white">{completedReadingsCount}</span>
              <span className="text-zinc-500 text-xs">/ {totalReadingsCount} items</span>
            </div>
            <div className="mt-4">
              <Progress.Root
                className="relative overflow-hidden bg-zinc-850 rounded-full w-full h-2.5 border border-zinc-800"
                value={totalReadingsCount > 0 ? (completedReadingsCount / totalReadingsCount) * 100 : 0}
              >
                <Progress.Indicator
                  className="bg-amber-500 h-full transition-all duration-500 ease-out"
                  style={{ width: `${totalReadingsCount > 0 ? (completedReadingsCount / totalReadingsCount) * 100 : 0}%` }}
                />
              </Progress.Root>
              <div className="flex justify-between text-[10px] text-zinc-500 mt-1.5">
                <span>{(totalReadingsCount > 0 ? (completedReadingsCount / totalReadingsCount) * 100 : 0).toFixed(0)}% Read</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 text-sm font-medium mb-2">
              <span>Dependency Warnings</span>
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold tracking-tight text-white">{warningsList.length}</span>
              <span className="text-zinc-500 text-xs">unresolved prerequisite blocks</span>
            </div>
            <div className="mt-4 text-[11px] text-rose-400/80 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg flex items-center space-x-2">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {warningsList.length > 0
                  ? `${warningsList.length} active warnings require action`
                  : "All dependencies are satisfied!"}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="border-b border-zinc-800 mb-6 flex justify-between items-center overflow-x-auto">
            <Tabs.List className="flex space-x-4">
              <Tabs.Trigger
                value="dashboard"
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors shrink-0 cursor-pointer ${
                  activeTab === "dashboard"
                    ? "border-indigo-500 text-white"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Dashboard Overview
              </Tabs.Trigger>
              <Tabs.Trigger
                value="assignments"
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors shrink-0 cursor-pointer ${
                  activeTab === "assignments"
                    ? "border-indigo-500 text-white"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Assignments List
              </Tabs.Trigger>
              <Tabs.Trigger
                value="topics"
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors shrink-0 cursor-pointer ${
                  activeTab === "topics"
                    ? "border-indigo-500 text-white"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Topics & Prerequisites Map
              </Tabs.Trigger>
              <Tabs.Trigger
                value="readings"
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors shrink-0 cursor-pointer ${
                  activeTab === "readings"
                    ? "border-indigo-500 text-white"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Prerequisite Readings
              </Tabs.Trigger>
            </Tabs.List>
            <div className="pb-2">
              {activeTab === "assignments" && (
                <button
                  onClick={openNewAssignment}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Log Assignment</span>
                </button>
              )}
              {activeTab === "topics" && (
                <button
                  onClick={openNewTopic}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Topic</span>
                </button>
              )}
              {activeTab === "readings" && (
                <button
                  onClick={openNewReading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Log Reading</span>
                </button>
              )}
            </div>
          </div>

          {/* TAB 1: DASHBOARD OVERVIEW */}
          <Tabs.Content value="dashboard" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Study Session Logger & Upcoming Tasks */}
            <div className="lg:col-span-2 space-y-6">
              {/* Study Timer Component */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Timer className="h-32 w-32 text-indigo-500" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-base font-semibold text-white mb-2 flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-indigo-400" />
                    <span>Study Session Timer</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mb-6">Select an assignment to log your active study minutes or manual hours.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Active Assignment</label>
                      <select
                        value={timerAssignmentId}
                        onChange={(e) => setTimerAssignmentId(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">-- Select an Assignment --</option>
                        {assignments
                          ?.filter((a) => a.status !== "completed")
                          .map((a) => (
                            <option key={a._id} value={a._id}>
                              {a.course} - {a.title}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Manual Hour Logger</label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          step="0.5"
                          min="0.1"
                          value={manualLogHours}
                          onChange={(e) => setManualLogHours(Number(e.target.value))}
                          disabled={!timerAssignmentId}
                          className="w-24 bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                        />
                        <button
                          onClick={handleManualLog}
                          disabled={!timerAssignmentId || manualLogHours <= 0}
                          className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-40 cursor-pointer"
                        >
                          Quick Log Hours
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Timer UI */}
                  {timerAssignmentId && (
                    <div className="bg-zinc-950/60 border border-zinc-850 p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl font-mono font-bold tracking-wider text-white">
                          {formatTime(timerSeconds)}
                        </div>
                        <div className="text-zinc-500 text-xs">
                          ({Number(timerSeconds / 3600).toFixed(2)} hours accumulated)
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {timerRunning ? (
                          <button
                            onClick={pauseTimer}
                            className="bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 p-2.5 rounded-lg border border-amber-500/30 transition-all cursor-pointer"
                          >
                            <Pause className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={startTimer}
                            className="bg-indigo-600 text-white hover:bg-indigo-500 p-2.5 rounded-lg transition-all cursor-pointer"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={resetTimer}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-2.5 rounded-lg border border-zinc-700 transition-all cursor-pointer"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleSaveTimer}
                          disabled={timerSeconds === 0}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all disabled:opacity-40 cursor-pointer"
                        >
                          Save Session
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming assignments */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-base font-semibold text-white mb-4">Urgent Assignments</h3>
                <div className="space-y-3">
                  {!assignments || assignments.length === 0 ? (
                    <div className="text-center py-6 text-zinc-500 text-sm">
                      No assignments logged. Head to the "Assignments List" tab to create one.
                    </div>
                  ) : (
                    assignments
                      ?.filter((a) => a.status !== "completed")
                      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                      .slice(0, 3)
                      .map((a) => {
                        const { unmetPrereqTopics, uncompletedReadings } = getUnmetDependenciesForAssignment(
                          a,
                          topics || [],
                          assignments || [],
                          readings || []
                        );
                        const hasBlocked = unmetPrereqTopics.length > 0 || uncompletedReadings.length > 0;

                        return (
                          <div
                            key={a._id}
                            className="bg-zinc-950/40 border border-zinc-800 hover:border-zinc-700 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between transition-all"
                          >
                            <div className="mb-2 sm:mb-0">
                              <div className="flex items-center space-x-2.5">
                                <span className="text-xs font-semibold px-2 py-0.5 bg-zinc-850 border border-zinc-800 text-zinc-300 rounded">
                                  {a.course}
                                </span>
                                {hasBlocked && (
                                  <span className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded flex items-center space-x-1">
                                    <AlertTriangle className="h-3 w-3 shrink-0" />
                                    <span>Prereqs Unresolved</span>
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-semibold text-white mt-1.5">{a.title}</h4>
                              <div className="flex items-center space-x-3 text-xs text-zinc-400 mt-1">
                                <span className="flex items-center space-x-1">
                                  <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                                  <span>Due: {a.dueDate}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Clock className="h-3.5 w-3.5 text-zinc-500" />
                                  <span>
                                    {a.actualHours.toFixed(1)} / {a.estimatedHours}h spent
                                  </span>
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => openEditAssignment(a)}
                                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-white p-2 rounded-lg text-zinc-400 transition-all cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setTimerAssignmentId(a._id);
                                  setActiveTab("dashboard");
                                }}
                                className="bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 border border-indigo-500/20 text-xs font-medium px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                              >
                                Study Now
                              </button>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>

            {/* Right: Prerequisite Warning Panel */}
            <div className="space-y-6">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-white flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-rose-400" />
                    <span>Prerequisite Blockers</span>
                  </h3>
                  <span className="text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-bold">
                    {warningsList.length} Warning{warningsList.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mb-4">
                  These assignments have target topics or readings with incomplete prerequisite dependencies. Complete them first to maintain academic flow!
                </p>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {warningsList.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
                      🎉 No prerequisite warning flags!
                    </div>
                  ) : (
                    warningsList.map(({ assignment, unmetTopics, unmetReadings }) => (
                      <div
                        key={assignment._id}
                        className="bg-zinc-950/60 border border-zinc-850 p-4.5 rounded-xl space-y-3"
                      >
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-rose-400 font-bold mb-0.5">
                            {assignment.course} Blocker
                          </div>
                          <h4 className="text-sm font-semibold text-white">{assignment.title}</h4>
                        </div>

                        {unmetTopics.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-[11px] text-zinc-400 font-medium flex items-center space-x-1">
                              <Layers className="h-3 w-3 text-amber-500" />
                              <span>Requires Topics:</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 pl-4">
                              {unmetTopics.map((t) => (
                                <span
                                  key={t._id}
                                  className="text-[10px] px-2 py-0.5 rounded border"
                                  style={{
                                    borderColor: `${t.color}40`,
                                    backgroundColor: `${t.color}15`,
                                    color: t.color,
                                  }}
                                >
                                  {t.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {unmetReadings.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-[11px] text-zinc-400 font-medium flex items-center space-x-1">
                              <BookOpen className="h-3 w-3 text-indigo-400" />
                              <span>Required Readings:</span>
                            </div>
                            <ul className="text-[10px] text-zinc-400 list-disc list-inside pl-4 space-y-0.5">
                              {unmetReadings.map((r) => (
                                <li key={r._id} className="truncate">
                                  {r.title} {r.author && `by ${r.author}`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Tabs.Content>

          {/* TAB 2: ASSIGNMENTS LIST */}
          <Tabs.Content value="assignments" className="space-y-4">
            {/* Search and Filters */}
            <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search assignments by title or course..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>

                <select
                  value={dependencyFilter}
                  onChange={(e) => setDependencyFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Dependencies</option>
                  <option value="met">Prereqs Met</option>
                  <option value="unmet">Prereqs Unresolved</option>
                </select>
              </div>
            </div>

            {/* Assignments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {!filteredAssignments || filteredAssignments.length === 0 ? (
                <div className="col-span-full text-center py-12 text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10">
                  No assignments found matching the active filters.
                </div>
              ) : (
                filteredAssignments.map((a) => {
                  const { unmetPrereqTopics, uncompletedReadings } = getUnmetDependenciesForAssignment(
                    a,
                    topics || [],
                    assignments || [],
                    readings || []
                  );
                  const isBlocked = unmetPrereqTopics.length > 0 || uncompletedReadings.length > 0;

                  return (
                    <div
                      key={a._id}
                      className="bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-5 flex flex-col justify-between transition-all"
                    >
                      <div>
                        {/* Course & Status Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-bold px-2.5 py-0.5 bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-md">
                            {a.course}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              a.status === "completed"
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : a.status === "in_progress"
                                  ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                                  : "bg-zinc-800/50 border-zinc-750 text-zinc-400"
                            }`}
                          >
                            {a.status === "completed"
                              ? "Completed"
                              : a.status === "in_progress"
                                ? "In Progress"
                                : "Not Started"}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-base font-bold text-white mb-2 line-clamp-1">{a.title}</h4>

                        {/* Due Date & Hours */}
                        <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400 mb-4">
                          <div className="flex items-center space-x-1.5">
                            <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                            <span>Due: {a.dueDate}</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <Clock className="h-3.5 w-3.5 text-zinc-500" />
                            <span>
                              {a.actualHours.toFixed(1)} / {a.estimatedHours}h spent
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <Progress.Root
                            className="relative overflow-hidden bg-zinc-950 rounded-full w-full h-1.5 border border-zinc-850"
                            value={a.estimatedHours > 0 ? (a.actualHours / a.estimatedHours) * 100 : 0}
                          >
                            <Progress.Indicator
                              className={`${
                                a.actualHours > a.estimatedHours ? "bg-rose-500" : "bg-indigo-500"
                              } h-full transition-all duration-300`}
                              style={{
                                width: `${Math.min(a.estimatedHours > 0 ? (a.actualHours / a.estimatedHours) * 100 : 0, 100)}%`,
                              }}
                            />
                          </Progress.Root>
                        </div>

                        {/* Topics */}
                        {a.topics && a.topics.length > 0 && (
                          <div className="mb-4">
                            <div className="text-[10px] text-zinc-500 font-medium mb-1">Topics Covered</div>
                            <div className="flex flex-wrap gap-1">
                              {a.topics.map((t) => (
                                <span
                                  key={t._id}
                                  className="text-[9px] px-1.5 py-0.5 rounded border"
                                  style={{
                                    borderColor: `${t.color}40`,
                                    backgroundColor: `${t.color}15`,
                                    color: t.color,
                                  }}
                                >
                                  {t.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Dependency warnings */}
                        {isBlocked && a.status !== "completed" && (
                          <div className="bg-rose-500/5 border border-rose-500/20 p-2.5 rounded-lg mb-4 text-[10.5px] text-rose-400 space-y-1">
                            <div className="flex items-center space-x-1 font-semibold">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              <span>Dependency Warning</span>
                            </div>
                            <ul className="list-disc list-inside pl-1 text-zinc-400 text-[10px] space-y-0.5">
                              {unmetPrereqTopics.map((pt) => (
                                <li key={pt._id}>Topic "{pt.name}" is locked</li>
                              ))}
                              {uncompletedReadings.map((ur) => (
                                <li key={ur._id}>Pending reading: "{ur.title}"</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Card actions */}
                      <div className="border-t border-zinc-800/80 pt-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditAssignment(a)}
                            className="text-zinc-400 hover:text-white p-1.5 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                            title="Edit Assignment"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete "${a.title}"?`)) {
                                await deleteAssignment({ id: a._id as Id<"assignments"> });
                              }
                            }}
                            className="text-zinc-500 hover:text-rose-400 p-1.5 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                            title="Delete Assignment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          {a.notes && (
                            <button
                              onClick={() => {
                                setViewingNotesAssignment(a);
                                setNotesModalOpen(true);
                              }}
                              className="text-zinc-400 hover:text-white p-1.5 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                              title="View Notes"
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setTimerAssignmentId(a._id);
                              setActiveTab("dashboard");
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Study
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Tabs.Content>

          {/* TAB 3: TOPICS MAP */}
          <Tabs.Content value="topics" className="space-y-6">
            <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl">
              <h3 className="text-base font-bold text-white mb-2 flex items-center space-x-2">
                <Layers className="h-5 w-5 text-indigo-400" />
                <span>Knowledge Dependency Tree</span>
              </h3>
              <p className="text-xs text-zinc-400 mb-6">
                Understand the progression of topics. Prerequisite connections outline what needs to be understood or read before starting higher-level topics.
              </p>

              {/* Topics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {!topics || topics.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-2xl">
                    No topics created yet. Create a topic to get started mapping dependencies.
                  </div>
                ) : (
                  topics.map((t) => {
                    const prereqs = t.prerequisiteIds.map((pid) => topics.find((top) => top._id === pid)).filter(Boolean) as Topic[];
                    const isCompleted = isTopicCompleted(t._id, topics, assignments || [], readings || []);

                    return (
                      <div
                        key={t._id}
                        className="bg-zinc-950/60 border border-zinc-850 hover:border-zinc-800 rounded-2xl p-5 flex flex-col justify-between transition-all"
                      >
                        <div>
                          {/* Heading */}
                          <div className="flex items-center justify-between mb-3">
                            <span
                              className="text-xs px-2.5 py-0.5 rounded-full font-bold border"
                              style={{
                                borderColor: `${t.color}40`,
                                backgroundColor: `${t.color}15`,
                                color: t.color,
                              }}
                            >
                              {t.name}
                            </span>
                            <span
                              className={`text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1 border ${
                                isCompleted
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                  : "bg-zinc-800/60 border-zinc-850 text-zinc-400"
                              }`}
                            >
                              {isCompleted && <Check className="h-2.5 w-2.5 mr-0.5" />}
                              <span>{isCompleted ? "Completed" : "In Progress"}</span>
                            </span>
                          </div>

                          <p className="text-xs text-zinc-300 mt-2 mb-4 leading-relaxed line-clamp-2">
                            {t.description || "No description provided."}
                          </p>

                          {/* Prerequisites List */}
                          {prereqs.length > 0 && (
                            <div className="space-y-1 mb-4">
                              <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                                Prerequisites:
                              </div>
                              <div className="flex flex-wrap gap-1 pl-1">
                                {prereqs.map((pr) => {
                                  const prCompleted = isTopicCompleted(pr._id, topics, assignments || [], readings || []);
                                  return (
                                    <span
                                      key={pr._id}
                                      className={`text-[9px] px-1.5 py-0.5 rounded border flex items-center space-x-1 ${
                                        prCompleted
                                          ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                                          : "border-zinc-800 bg-zinc-900/60 text-zinc-400"
                                      }`}
                                    >
                                      {prCompleted && <Check className="h-2.5 w-2.5 text-emerald-400 shrink-0" />}
                                      <span>{pr.name}</span>
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Topic Actions */}
                        <div className="border-t border-zinc-900 pt-3 flex items-center justify-between">
                          <button
                            onClick={() => openEditTopic(t)}
                            className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-900 rounded transition-colors text-xs flex items-center space-x-1 cursor-pointer"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete "${t.name}"? This will clean up all prerequisite references.`)) {
                                await deleteTopic({ id: t._id as Id<"topics"> });
                              }
                            }}
                            className="text-zinc-600 hover:text-rose-400 p-1 hover:bg-zinc-900 rounded transition-colors text-xs flex items-center space-x-1 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </Tabs.Content>

          {/* TAB 4: PREREQUISITE READINGS */}
          <Tabs.Content value="readings" className="space-y-4">
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-2 flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-indigo-400" />
                <span>Reference Material & Readings</span>
              </h3>
              <p className="text-xs text-zinc-400 mb-6">
                Keep track of textbook chapters, articles, papers, or video links mapped to university assignments and courses.
              </p>

              {/* Readings list table */}
              <div className="overflow-x-auto border border-zinc-800 rounded-xl bg-zinc-950/40">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-900 text-zinc-400 font-semibold border-b border-zinc-800">
                    <tr>
                      <th className="p-4">Reading / Material</th>
                      <th className="p-4">Topic Association</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {!readings || readings.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-zinc-500 text-xs">
                          No readings logged. Log textbook chapters or reference papers to track prerequisite content.
                        </td>
                      </tr>
                    ) : (
                      readings.map((r) => {
                        const associatedTopic = topics?.find((top) => top._id === r.topicId);

                        return (
                          <tr key={r._id} className="hover:bg-zinc-900/30 transition-colors">
                            <td className="p-4">
                              <div className="font-semibold text-white flex items-center space-x-2">
                                <span>{r.title}</span>
                                {r.url && (
                                  <a
                                    href={r.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5 inline" />
                                  </a>
                                )}
                              </div>
                              {r.author && <div className="text-zinc-500 mt-0.5">Author: {r.author}</div>}
                            </td>
                            <td className="p-4">
                              {associatedTopic ? (
                                <span
                                  className="text-[10px] px-2 py-0.5 rounded border"
                                  style={{
                                    borderColor: `${associatedTopic.color}45`,
                                    backgroundColor: `${associatedTopic.color}15`,
                                    color: associatedTopic.color,
                                  }}
                                >
                                  {associatedTopic.name}
                                </span>
                              ) : (
                                <span className="text-zinc-600 italic">None</span>
                              )}
                            </td>
                            <td className="p-4">
                              <select
                                value={r.status}
                                onChange={async (e) => {
                                  await updateReading({
                                    id: r._id as Id<"readings">,
                                    status: e.target.value,
                                  });
                                }}
                                className={`text-[10px] font-medium border rounded-full px-2.5 py-1 focus:outline-none cursor-pointer ${
                                  r.status === "completed"
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                    : r.status === "reading"
                                      ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                                      : "bg-zinc-800/80 border-zinc-700 text-zinc-400"
                                }`}
                              >
                                <option value="to_read">To Read</option>
                                <option value="reading">Reading</option>
                                <option value="completed">Completed</option>
                              </select>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => openEditReading(r)}
                                  className="text-zinc-400 hover:text-white p-1 hover:bg-zinc-800 rounded transition-all cursor-pointer"
                                  title="Edit Reading"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm(`Are you sure you want to delete reading "${r.title}"?`)) {
                                      await deleteReading({ id: r._id as Id<"readings"> });
                                    }
                                  }}
                                  className="text-zinc-500 hover:text-rose-400 p-1 hover:bg-zinc-800 rounded transition-all cursor-pointer"
                                  title="Delete Reading"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </main>

      {/* MODAL 1: ASSIGNMENT FORM */}
      <Dialog.Root open={assignmentModalOpen} onOpenChange={setAssignmentModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-full max-w-lg shadow-2xl z-50 focus:outline-none max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-bold text-white">
                {editingAssignment ? "Edit Assignment Details" : "Log New Assignment"}
              </Dialog.Title>
              <Dialog.Close className="text-zinc-400 hover:text-white transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Assignment Title</label>
                  <input
                    type="text"
                    required
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                    placeholder="e.g. Midterm Project"
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Course / Code</label>
                  <input
                    type="text"
                    required
                    value={assignmentCourse}
                    onChange={(e) => setAssignmentCourse(e.target.value)}
                    placeholder="e.g. CS 401"
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={assignmentDueDate}
                    onChange={(e) => setAssignmentDueDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Status</label>
                  <select
                    value={assignmentStatus}
                    onChange={(e) => setAssignmentStatus(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Est. Study Hours</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.5"
                    value={assignmentEstHours}
                    onChange={(e) => setAssignmentEstHours(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Actual Hours Spent</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={assignmentActHours}
                    onChange={(e) => setAssignmentActHours(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Multi-select Topics */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Topics Mapping</label>
                <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto p-2 bg-zinc-950 border border-zinc-850 rounded-lg">
                  {topics?.map((t) => (
                    <label key={t._id} className="flex items-center space-x-2 text-xs text-zinc-300">
                      <input
                        type="checkbox"
                        checked={assignmentTopicIds.includes(t._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssignmentTopicIds([...assignmentTopicIds, t._id]);
                          } else {
                            setAssignmentTopicIds(assignmentTopicIds.filter((id) => id !== t._id));
                          }
                        }}
                        className="rounded bg-zinc-900 border-zinc-850 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{t.name}</span>
                    </label>
                  ))}
                  {(!topics || topics.length === 0) && (
                    <span className="text-[10px] text-zinc-500 italic col-span-2">No topics created. Create one first!</span>
                  )}
                </div>
              </div>

              {/* Multi-select Readings */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Prerequisite Readings</label>
                <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto p-2 bg-zinc-950 border border-zinc-850 rounded-lg">
                  {readings?.map((r) => (
                    <label key={r._id} className="flex items-center space-x-2 text-xs text-zinc-300">
                      <input
                        type="checkbox"
                        checked={assignmentReadingIds.includes(r._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssignmentReadingIds([...assignmentReadingIds, r._id]);
                          } else {
                            setAssignmentReadingIds(assignmentReadingIds.filter((id) => id !== r._id));
                          }
                        }}
                        className="rounded bg-zinc-900 border-zinc-850 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="truncate">{r.title}</span>
                    </label>
                  ))}
                  {(!readings || readings.length === 0) && (
                    <span className="text-[10px] text-zinc-500 italic col-span-2">No readings logged. Log one first!</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Study Notes / Instructions</label>
                <textarea
                  rows={3}
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  placeholder="Task guidelines, textbook references, or study links..."
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* MODAL 2: TOPIC FORM */}
      <Dialog.Root open={topicModalOpen} onOpenChange={setTopicModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-full max-w-md shadow-2xl z-50 focus:outline-none">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-bold text-white">
                {editingTopic ? "Edit Topic Settings" : "Create Knowledge Topic"}
              </Dialog.Title>
              <Dialog.Close className="text-zinc-400 hover:text-white transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>

            <form onSubmit={handleSaveTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Topic Name</label>
                <input
                  type="text"
                  required
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder="e.g. Calculus foundations"
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Description / Summary</label>
                <textarea
                  rows={2}
                  value={topicDesc}
                  onChange={(e) => setTopicDesc(e.target.value)}
                  placeholder="What is covered under this topic?"
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Prerequisites Select */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Prerequisite Topics</label>
                <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto p-2 bg-zinc-950 border border-zinc-850 rounded-lg">
                  {topics
                    ?.filter((t) => !editingTopic || t._id !== editingTopic._id)
                    .map((t) => (
                      <label key={t._id} className="flex items-center space-x-2 text-xs text-zinc-300">
                        <input
                          type="checkbox"
                          checked={topicPrereqs.includes(t._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTopicPrereqs([...topicPrereqs, t._id]);
                            } else {
                              setTopicPrereqs(topicPrereqs.filter((id) => id !== t._id));
                            }
                          }}
                          className="rounded bg-zinc-900 border-zinc-850 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{t.name}</span>
                      </label>
                    ))}
                  {(!topics || topics.length === 0) && (
                    <span className="text-[10px] text-zinc-500 italic col-span-2">No other topics available.</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Color Accent</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={topicColor}
                    onChange={(e) => setTopicColor(e.target.value)}
                    className="h-10 w-12 bg-transparent border border-zinc-800 rounded cursor-pointer"
                  />
                  <span className="text-xs text-zinc-400 font-mono">{topicColor}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Save Topic
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* MODAL 3: READING FORM */}
      <Dialog.Root open={readingModalOpen} onOpenChange={setReadingModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-full max-w-md shadow-2xl z-50 focus:outline-none">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-bold text-white">
                {editingReading ? "Edit Reference Details" : "Log Study Reading"}
              </Dialog.Title>
              <Dialog.Close className="text-zinc-400 hover:text-white transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>

            <form onSubmit={handleSaveReading} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Title / Chapter Name</label>
                <input
                  type="text"
                  required
                  value={readingTitle}
                  onChange={(e) => setReadingTitle(e.target.value)}
                  placeholder="e.g. Chapter 4: Derivative rules"
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Author / Source (Optional)</label>
                  <input
                    type="text"
                    value={readingAuthor}
                    onChange={(e) => setReadingAuthor(e.target.value)}
                    placeholder="e.g. Larson et al."
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Reading Status</label>
                  <select
                    value={readingStatus}
                    onChange={(e) => setReadingStatus(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="to_read">To Read</option>
                    <option value="reading">Reading</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Document URL (Optional)</label>
                <input
                  type="url"
                  value={readingUrl}
                  onChange={(e) => setReadingUrl(e.target.value)}
                  placeholder="e.g. https://mit-ocw.edu/notes.pdf"
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Associated Topic</label>
                <select
                  value={readingTopicId}
                  onChange={(e) => setReadingTopicId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="">-- No Specific Topic --</option>
                  {topics?.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Save Reading
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* MODAL 4: DETAILS NOTES VIEW */}
      <Dialog.Root open={notesModalOpen} onOpenChange={setNotesModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-full max-w-md shadow-2xl z-50 focus:outline-none">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-bold text-white flex items-center space-x-2">
                <Info className="h-5 w-5 text-indigo-400" />
                <span>Assignment Guidelines</span>
              </Dialog.Title>
              <Dialog.Close className="text-zinc-400 hover:text-white transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-1">
                  {viewingNotesAssignment?.course} - {viewingNotesAssignment?.title}
                </h4>
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {viewingNotesAssignment?.notes || "No notes logged for this assignment."}
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Dialog.Close asChild>
                  <button className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-5 py-2 rounded-xl transition-colors cursor-pointer">
                    Dismiss
                  </button>
                </Dialog.Close>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
