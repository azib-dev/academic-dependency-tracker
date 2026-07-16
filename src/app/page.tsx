"use client";

import { useState, useEffect, useRef } from "react";
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
  X,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Sliders,
  MapPin,
  Heart,
  FolderOpen
} from "lucide-react";
import {
  Topic,
  Reading,
  Assignment,
  isTopicCompleted,
  getUnmetPrerequisitesForTopic,
  getUnmetDependenciesForAssignment
} from "./utils";

// Progress Ring Component for Dashboard KPIs
function ProgressRing({
  percentage,
  colorClass,
  size = 72,
  strokeWidth = 6,
  icon: Icon,
  glowClass
}: {
  percentage: number;
  colorClass: string;
  size?: number;
  strokeWidth?: number;
  icon: any;
  glowClass?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background Circle */}
        <circle
          className="text-white/[0.04]"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress Circle */}
        <circle
          className={`${colorClass} transition-all duration-700 ease-out ${glowClass || ""}`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute flex items-center justify-center">
        <Icon className="h-5 w-5 text-slate-300" />
      </div>
    </div>
  );
}

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

  // Navigation and filters
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dependencyFilter, setDependencyFilter] = useState("all");

  // Modal states
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  const [readingModalOpen, setReadingModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<Reading | null>(null);

  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [viewingNotesAssignment, setViewingNotesAssignment] = useState<Assignment | null>(null);

  // Form states
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

  // Timer state (Persistent global state)
  const [timerAssignmentId, setTimerAssignmentId] = useState<string>("");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [manualLogHours, setManualLogHours] = useState(1);

  // SVG Dependency Tree Ref & States
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [topicCoords, setTopicCoords] = useState<Record<string, { x: number; y: number; w: number; h: number }>>({});
  const [hoveredTopicId, setHoveredTopicId] = useState<string | null>(null);
  const [activeConnections, setActiveConnections] = useState<Set<string>>(new Set());

  // Global Timer Tick Hook
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning]);

  // Handle active topic connections mapping
  useEffect(() => {
    if (!hoveredTopicId || !topics) {
      setActiveConnections(new Set());
      return;
    }

    const active = new Set<string>();

    const addPrereqs = (tid: string) => {
      const topic = topics.find((t) => t._id === tid);
      if (!topic) return;
      topic.prerequisiteIds.forEach((pid) => {
        active.add(`${pid}->${tid}`);
        addPrereqs(pid);
      });
    };

    const addDependents = (tid: string) => {
      topics.forEach((t) => {
        if (t.prerequisiteIds.includes(tid)) {
          active.add(`${tid}->${t._id}`);
          addDependents(t._id);
        }
      });
    };

    addPrereqs(hoveredTopicId);
    addDependents(hoveredTopicId);
    active.add(hoveredTopicId);

    setActiveConnections(active);
  }, [hoveredTopicId, topics]);

  // Recalculate Node Positions for SVG lines
  useEffect(() => {
    if (activeTab !== "topics" || !topics) return;

    const updateCoords = () => {
      const container = mapContainerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();

      const newCoords: Record<string, { x: number; y: number; w: number; h: number }> = {};
      topics.forEach((t) => {
        const el = document.getElementById(`topic-node-${t._id}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          newCoords[t._id] = {
            x: rect.left - containerRect.left + container.scrollLeft,
            y: rect.top - containerRect.top + container.scrollTop,
            w: rect.width,
            h: rect.height,
          };
        }
      });
      setTopicCoords(newCoords);
    };

    updateCoords();
    const timer = setTimeout(updateCoords, 250);

    window.addEventListener("resize", updateCoords);
    const container = mapContainerRef.current;
    if (container) {
      container.addEventListener("scroll", updateCoords);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateCoords);
      if (container) {
        container.removeEventListener("scroll", updateCoords);
      }
    };
  }, [activeTab, topics]);

  // Topological sorting to assign levels to topics
  const getTopicLevels = (allTopics: Topic[]): Record<string, number> => {
    const levels: Record<string, number> = {};
    const visited = new Set<string>();

    const getLevel = (topicId: string, path = new Set<string>()): number => {
      if (path.has(topicId)) return 0; // Prevent cyclic graph stack overflow
      if (levels[topicId] !== undefined) return levels[topicId];

      const topic = allTopics.find((t) => t._id === topicId);
      if (!topic || topic.prerequisiteIds.length === 0) {
        levels[topicId] = 0;
        return 0;
      }

      const nextPath = new Set(path);
      nextPath.add(topicId);

      const prereqLevels = topic.prerequisiteIds.map((pid) => getLevel(pid, nextPath));
      const level = 1 + Math.max(...prereqLevels);
      levels[topicId] = level;
      return level;
    };

    allTopics.forEach((t) => getLevel(t._id));
    return levels;
  };

  // Timer controls
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
    } catch (err) {
      console.error(err);
      alert("Failed to log timer session.");
    }
  };

  const handleManualLog = async () => {
    if (!timerAssignmentId || manualLogHours <= 0) return;
    try {
      await logAssignmentHours({
        id: timerAssignmentId as Id<"assignments">,
        additionalHours: manualLogHours,
      });
      alert(`Successfully logged ${manualLogHours} hour(s)!`);
    } catch (err) {
      console.error(err);
      alert("Failed to log hours.");
    }
  };

  // Pre-fill Forms
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

  // Helper formatting for timer stopwatch
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Filter lists
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

  // KPI calculations
  const totalEstHours = assignments?.reduce((acc, a) => acc + a.estimatedHours, 0) || 0;
  const totalActHours = assignments?.reduce((acc, a) => acc + a.actualHours, 0) || 0;
  const totalCompleted = assignments?.filter((a) => a.status === "completed").length || 0;
  const totalAssignmentsCount = assignments?.length || 0;
  const totalReadingsCount = readings?.length || 0;
  const completedReadingsCount = readings?.filter((r) => r.status === "completed").length || 0;

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
    <div className="flex-1 flex flex-col lg:flex-row w-full min-h-screen relative text-slate-100 antialiased bg-slate-950 font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* 1. SIDEBAR NAVIGATION - DESKTOP */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-white/[0.06] bg-slate-950/80 backdrop-blur-2xl p-6 sticky top-0 h-screen justify-between z-40">
        <div className="space-y-8">
          {/* App Brand */}
          <div className="flex items-center space-x-3.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <GraduationCap className="h-5.5 w-5.5 text-indigo-400" />
              </div>
            </div>
            <div>
              <span className="text-sm font-semibold tracking-wider uppercase text-slate-400 block leading-none">Aura Learn</span>
              <h1 className="text-lg font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">Dependency Map</h1>
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-300">Convex Engine</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full font-bold">Online</span>
          </div>

          {/* Nav List */}
          <nav className="space-y-1.5">
            {[
              { id: "dashboard", label: "Dashboard Overview", icon: Sparkles },
              { id: "assignments", label: "Academic Assignments", icon: BookMarked },
              { id: "topics", label: "Knowledge Roadmap", icon: Layers },
              { id: "readings", label: "Prerequisite Readings", icon: BookOpen },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "bg-indigo-600/10 text-indigo-300 border-l-2 border-indigo-500 shadow-md shadow-indigo-600/5"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] border-l-2 border-transparent"
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 transition-colors ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Global Study Session Logger Widget in Sidebar */}
        <div className="pt-4 border-t border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Study Session</span>
            {timerSeconds > 0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20 animate-pulse">
                Active
              </span>
            )}
          </div>

          <div className="space-y-3">
            <select
              value={timerAssignmentId}
              onChange={(e) => setTimerAssignmentId(e.target.value)}
              className="w-full bg-slate-900/60 border border-white/[0.06] text-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold cursor-pointer"
            >
              <option value="">-- Study Assignment --</option>
              {assignments
                ?.filter((a) => a.status !== "completed")
                .map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.course} • {a.title}
                  </option>
                ))}
            </select>

            {timerAssignmentId ? (
              <div className="bg-slate-900/40 border border-white/[0.04] p-3 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-mono font-bold tracking-wider text-white">
                    {formatTime(timerSeconds)}
                  </div>
                  <div className="flex space-x-1.5">
                    {timerRunning ? (
                      <button
                        onClick={pauseTimer}
                        className="bg-amber-500/10 text-amber-400 border border-amber-500/20 p-2 rounded-lg hover:bg-amber-500/20 transition-all cursor-pointer"
                      >
                        <Pause className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={startTimer}
                        className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-500 transition-all cursor-pointer"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={resetTimer}
                      className="bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 p-2 rounded-lg border border-white/[0.06] transition-all cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSaveTimer}
                  disabled={timerSeconds === 0}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded-lg transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Log Study Session</span>
                </button>
              </div>
            ) : (
              <div className="text-[10px] text-slate-500 italic text-center p-3 border border-dashed border-white/[0.06] rounded-xl">
                Select an assignment to start the timer
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 2. MOBILE TOP HEADER */}
      <header className="lg:hidden w-full border-b border-white/[0.06] bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 flex items-center justify-center shadow-lg">
            <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
              <GraduationCap className="h-4.5 w-4.5 text-indigo-400" />
            </div>
          </div>
          <h1 className="text-base font-bold text-white tracking-tight">Academic Tracker</h1>
        </div>
        <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full font-bold">
          Connected
        </span>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pb-24 lg:pb-8">
        
        {/* KPI DASHBOARD ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          
          {/* Card 1: Study Progress */}
          <div className="glass-panel glass-panel-hover rounded-2xl p-4.5 flex items-center justify-between space-x-4 relative overflow-hidden">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-400 block">Study Hours</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-black text-white glow-text-indigo">{totalActHours.toFixed(1)}</span>
                <span className="text-slate-500 text-[10px]">/ {totalEstHours.toFixed(1)}h</span>
              </div>
              <div className="flex items-center space-x-1 text-[10px] text-indigo-400 font-semibold mt-1">
                <TrendingUp className="h-3 w-3" />
                <span>{totalEstHours > 0 ? ((totalActHours / totalEstHours) * 100).toFixed(0) : 0}% Target</span>
              </div>
            </div>
            <ProgressRing
              percentage={totalEstHours > 0 ? (totalActHours / totalEstHours) * 100 : 0}
              colorClass="text-indigo-400"
              glowClass="drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
              icon={Clock}
            />
          </div>

          {/* Card 2: Assignments */}
          <div className="glass-panel glass-panel-hover rounded-2xl p-4.5 flex items-center justify-between space-x-4 relative overflow-hidden">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-400 block">Assignments</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-black text-white glow-text-emerald">{totalCompleted}</span>
                <span className="text-slate-500 text-[10px]">/ {totalAssignmentsCount} total</span>
              </div>
              <div className="flex items-center space-x-1 text-[10px] text-emerald-400 font-semibold mt-1">
                <Check className="h-3 w-3" />
                <span>{totalAssignmentsCount > 0 ? ((totalCompleted / totalAssignmentsCount) * 100).toFixed(0) : 0}% Done</span>
              </div>
            </div>
            <ProgressRing
              percentage={totalAssignmentsCount > 0 ? (totalCompleted / totalAssignmentsCount) * 100 : 0}
              colorClass="text-emerald-400"
              glowClass="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              icon={CheckCircle2}
            />
          </div>

          {/* Card 3: Readings Mastery */}
          <div className="glass-panel glass-panel-hover rounded-2xl p-4.5 flex items-center justify-between space-x-4 relative overflow-hidden">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-400 block">Readings Mastery</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-black text-white glow-text-indigo">{completedReadingsCount}</span>
                <span className="text-slate-500 text-[10px]">/ {totalReadingsCount} items</span>
              </div>
              <div className="flex items-center space-x-1 text-[10px] text-indigo-400 font-semibold mt-1">
                <BookOpenCheck className="h-3 w-3" />
                <span>{totalReadingsCount > 0 ? ((completedReadingsCount / totalReadingsCount) * 100).toFixed(0) : 0}% Read</span>
              </div>
            </div>
            <ProgressRing
              percentage={totalReadingsCount > 0 ? (completedReadingsCount / totalReadingsCount) * 100 : 0}
              colorClass="text-violet-400"
              glowClass="drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]"
              icon={BookOpen}
            />
          </div>

          {/* Card 4: Dependency Warnings */}
          <div className="glass-panel glass-panel-hover rounded-2xl p-4.5 flex items-center justify-between space-x-4 relative overflow-hidden">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-400 block">Prereq Blockers</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-black text-white glow-text-rose">{warningsList.length}</span>
                <span className="text-slate-500 text-[10px]">active blocks</span>
              </div>
              <div className={`flex items-center space-x-1 text-[10px] font-semibold mt-1 ${warningsList.length > 0 ? "text-rose-400 animate-pulse" : "text-emerald-400"}`}>
                <AlertTriangle className="h-3 w-3" />
                <span>{warningsList.length > 0 ? "Blockers active" : "Flow cleared"}</span>
              </div>
            </div>
            <ProgressRing
              percentage={warningsList.length > 0 ? Math.min(warningsList.length * 20, 100) : 0}
              colorClass="text-rose-400"
              glowClass="drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]"
              icon={AlertTriangle}
            />
          </div>
        </div>

        {/* 3. TABS CONTAINER - INTERACTION CONTROLLER */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          
          {/* Header Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-4 mb-6 gap-4">
            
            {/* Quick Title based on active view */}
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
                {activeTab === "dashboard" && <><span>Dashboard Overview</span><span className="text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded ml-2">Main Hub</span></>}
                {activeTab === "assignments" && <><span>Academic Assignments</span><span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded ml-2">Task Board</span></>}
                {activeTab === "topics" && <><span>Knowledge Roadmap</span><span className="text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded ml-2">Visual Map</span></>}
                {activeTab === "readings" && <><span>Prerequisite Readings</span><span className="text-xs bg-violet-500/10 border border-violet-500/20 text-violet-400 px-2 py-0.5 rounded ml-2">Database</span></>}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {activeTab === "dashboard" && "Log hours, review blocked studies, and check urgent submissions."}
                {activeTab === "assignments" && "Organize homework, track estimated study time, and verify dependencies."}
                {activeTab === "topics" && "Interactive graph showing prerequisite courses and topic learning sequence."}
                {activeTab === "readings" && "Material list, reference papers, and chapters associated with subject roadmaps."}
              </p>
            </div>

            {/* Quick Actions Buttons */}
            <div>
              {activeTab === "assignments" && (
                <button
                  onClick={openNewAssignment}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/15"
                >
                  <Plus className="h-4 w-4" />
                  <span>Log Assignment</span>
                </button>
              )}
              {activeTab === "topics" && (
                <button
                  onClick={openNewTopic}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/15"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Topic Node</span>
                </button>
              )}
              {activeTab === "readings" && (
                <button
                  onClick={openNewReading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/15"
                >
                  <Plus className="h-4 w-4" />
                  <span>Log Reading Material</span>
                </button>
              )}
            </div>
          </div>

          {/* TAB 1: DASHBOARD HUB */}
          <Tabs.Content value="dashboard" className="grid grid-cols-1 lg:grid-cols-3 gap-8 outline-none">
            
            {/* Left/Middle Column (Urgent list & Timer log fallback) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Desktop Widget Logger / Interactive Stopwatch */}
              <div className="glass-panel p-6 rounded-2xl relative overflow-hidden lg:hidden block">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Timer className="h-32 w-32 text-indigo-500" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400 mb-2 flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Study Session Stopwatch</span>
                  </h3>
                  <p className="text-xs text-slate-400 mb-6">Select a pending assignment and track study hours live or log manually.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Study Target</label>
                      <select
                        value={timerAssignmentId}
                        onChange={(e) => setTimerAssignmentId(e.target.value)}
                        className="w-full bg-slate-900 border border-white/[0.06] text-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">-- Select Target --</option>
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
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Quick Manual Log</label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          step="0.5"
                          min="0.1"
                          value={manualLogHours}
                          onChange={(e) => setManualLogHours(Number(e.target.value))}
                          disabled={!timerAssignmentId}
                          className="w-20 bg-slate-900 border border-white/[0.06] text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                        />
                        <button
                          onClick={handleManualLog}
                          disabled={!timerAssignmentId || manualLogHours <= 0}
                          className="flex-1 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-40"
                        >
                          Log Hours
                        </button>
                      </div>
                    </div>
                  </div>

                  {timerAssignmentId && (
                    <div className="bg-slate-900/60 border border-white/[0.04] p-4 rounded-xl flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-2xl font-mono font-bold tracking-wider text-white">
                          {formatTime(timerSeconds)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          ({Number(timerSeconds / 3600).toFixed(2)} hrs session)
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {timerRunning ? (
                          <button
                            onClick={pauseTimer}
                            className="bg-amber-600/10 text-amber-400 border border-amber-500/20 hover:bg-amber-600/20 p-2.5 rounded-lg transition-all cursor-pointer"
                          >
                            <Pause className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={startTimer}
                            className="bg-indigo-600 text-white p-2.5 rounded-lg hover:bg-indigo-500 transition-all cursor-pointer"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={resetTimer}
                          className="bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-slate-300 p-2.5 rounded-lg transition-all cursor-pointer"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleSaveTimer}
                          disabled={timerSeconds === 0}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Urgent Submissions */}
              <div className="glass-panel p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400">Urgent Assignments</h3>
                  <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full font-bold">Upcoming</span>
                </div>

                <div className="space-y-4">
                  {!assignments || assignments.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-white/[0.06] rounded-xl text-slate-500 text-xs">
                      No assignments found. Go to "Academic Assignments" to log your first target.
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
                        const isBlocked = unmetPrereqTopics.length > 0 || uncompletedReadings.length > 0;
                        const progress = a.estimatedHours > 0 ? (a.actualHours / a.estimatedHours) * 100 : 0;

                        return (
                          <div
                            key={a._id}
                            className="bg-white/[0.02] border border-white/[0.04] p-4.5 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between transition-all hover:bg-white/[0.04] hover:border-white/[0.08]"
                          >
                            <div className="space-y-2.5 mb-3 sm:mb-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-md">
                                  {a.course}
                                </span>
                                {isBlocked && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-md flex items-center space-x-1.5">
                                    <AlertTriangle className="h-3 w-3 shrink-0" />
                                    <span>Blocked</span>
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-semibold text-white">{a.title}</h4>
                              <div className="flex items-center space-x-4 text-[11px] text-slate-400">
                                <span className="flex items-center space-x-1">
                                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                  <span>Due: {a.dueDate}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                                  <span>{a.actualHours.toFixed(1)} / {a.estimatedHours}h study spent</span>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2.5">
                              <button
                                onClick={() => openEditAssignment(a)}
                                className="bg-slate-900 hover:bg-slate-800 border border-white/[0.06] text-slate-400 hover:text-white p-2.5 rounded-lg transition-colors cursor-pointer"
                                title="Edit details"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setTimerAssignmentId(a._id);
                                  startTimer();
                                }}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-lg transition-all shadow-md shadow-indigo-600/10 cursor-pointer flex items-center space-x-1.5"
                              >
                                <Play className="h-3.5 w-3.5" />
                                <span>Start Study</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>

            {/* Right Warning Column (Blocker Notifications Feed) */}
            <div className="space-y-6">
              <div className="glass-panel p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-rose-400 flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                    <span>Dependency Warnings</span>
                  </h3>
                  <span className="text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-black animate-pulse">
                    {warningsList.length} Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-6">
                  Prerequisites represent core academic foundations. Blockers indicate readings or prerequisite topics that are currently incomplete.
                </p>

                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                  {warningsList.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-emerald-500/20 bg-emerald-500/[0.02] rounded-xl flex flex-col items-center justify-center space-y-2">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-400">Flow Cleared!</span>
                      <span className="text-[10px] text-slate-500">All dependencies are satisfied.</span>
                    </div>
                  ) : (
                    warningsList.map(({ assignment, unmetTopics, unmetReadings }) => (
                      <div
                        key={assignment._id}
                        className="bg-slate-900/60 border border-white/[0.04] p-4.5 rounded-xl space-y-4"
                      >
                        <div>
                          <div className="text-[9px] uppercase tracking-wider text-rose-400 font-bold mb-0.5">
                            {assignment.course} • Action Required
                          </div>
                          <h4 className="text-xs font-bold text-white leading-tight">{assignment.title}</h4>
                        </div>

                        {unmetTopics.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-[10px] text-slate-400 font-bold flex items-center space-x-1.5">
                              <Layers className="h-3.5 w-3.5 text-indigo-400" />
                              <span>Required Topics:</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 pl-4">
                              {unmetTopics.map((t) => (
                                <button
                                  key={t._id}
                                  onClick={() => {
                                    setActiveTab("topics");
                                    setHoveredTopicId(t._id);
                                  }}
                                  className="text-[9px] px-2 py-0.5 rounded border transition-all hover:-translate-y-0.5 cursor-pointer"
                                  style={{
                                    borderColor: `${t.color}40`,
                                    backgroundColor: `${t.color}15`,
                                    color: t.color,
                                  }}
                                >
                                  {t.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {unmetReadings.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-[10px] text-slate-400 font-bold flex items-center space-x-1.5">
                              <BookOpen className="h-3.5 w-3.5 text-violet-400" />
                              <span>Incomplete Readings:</span>
                            </div>
                            <div className="space-y-1.5 pl-4">
                              {unmetReadings.map((r) => (
                                <div key={r._id} className="flex items-center justify-between text-[9px] text-slate-300 bg-white/[0.02] border border-white/[0.04] p-1.5 rounded">
                                  <span className="truncate max-w-[130px] font-semibold">{r.title}</span>
                                  <button
                                    onClick={() => {
                                      setActiveTab("readings");
                                    }}
                                    className="text-violet-400 hover:text-white transition-colors cursor-pointer flex items-center space-x-1 font-bold"
                                  >
                                    <span>Solve</span>
                                    <ChevronRight className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Tabs.Content>

          {/* TAB 2: ACADEMIC ASSIGNMENTS */}
          <Tabs.Content value="assignments" className="space-y-6 outline-none">
            
            {/* Search and filter toolbar */}
            <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search assignments by title or course..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-white/[0.06] text-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-white/[0.06] text-slate-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>

                <select
                  value={dependencyFilter}
                  onChange={(e) => setDependencyFilter(e.target.value)}
                  className="bg-slate-900 border border-white/[0.06] text-slate-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold cursor-pointer"
                >
                  <option value="all">All Dependencies</option>
                  <option value="met">Prereqs Satisfied</option>
                  <option value="unmet">Prereqs Blocked</option>
                </select>
              </div>
            </div>

            {/* Assignments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {!filteredAssignments || filteredAssignments.length === 0 ? (
                <div className="col-span-full text-center py-16 glass-panel rounded-2xl flex flex-col items-center justify-center space-y-3">
                  <FolderOpen className="h-10 w-10 text-slate-600" />
                  <span className="text-xs font-bold text-slate-500">No assignments found matching these settings</span>
                  <button onClick={openNewAssignment} className="text-indigo-400 text-xs font-bold hover:underline">Log one now</button>
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
                  const progress = a.estimatedHours > 0 ? (a.actualHours / a.estimatedHours) * 100 : 0;
                  const isOvertime = a.actualHours > a.estimatedHours;

                  return (
                    <div
                      key={a._id}
                      className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        {/* Course & Status Bar */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-900 border border-white/[0.08] text-slate-300 rounded">
                            {a.course}
                          </span>
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                              a.status === "completed"
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : a.status === "in_progress"
                                  ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                                  : "bg-slate-800 border-white/[0.04] text-slate-400"
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
                        <div>
                          <h4 className="text-base font-bold text-white tracking-tight leading-snug line-clamp-1">{a.title}</h4>
                        </div>

                        {/* Due Date & Hours spent progress */}
                        <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-3.5 w-3.5 text-slate-500" />
                            <span>Due: {a.dueDate}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-3.5 w-3.5 text-slate-500" />
                            <span>{a.actualHours.toFixed(1)} / {a.estimatedHours}h spent</span>
                          </div>
                        </div>

                        {/* Visual Progress Slider bar */}
                        <div className="space-y-1">
                          <Progress.Root
                            className="relative overflow-hidden bg-slate-900 rounded-full w-full h-2 border border-white/[0.04]"
                            value={progress}
                          >
                            <Progress.Indicator
                              className={`h-full transition-all duration-300 rounded-full ${
                                isOvertime ? "bg-amber-500" : "bg-indigo-500"
                              }`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </Progress.Root>
                          <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                            <span>{progress.toFixed(0)}% Target</span>
                            {isOvertime && <span className="text-amber-500">Overtime hours logged</span>}
                          </div>
                        </div>

                        {/* Topic covered tags */}
                        {a.topics && a.topics.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Target Topics</div>
                            <div className="flex flex-wrap gap-1">
                              {a.topics.map((t) => (
                                <span
                                  key={t._id}
                                  className="text-[9px] px-1.5 py-0.5 rounded border"
                                  style={{
                                    borderColor: `${t.color}30`,
                                    backgroundColor: `${t.color}10`,
                                    color: t.color,
                                  }}
                                >
                                  {t.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Inline blocked notification */}
                        {isBlocked && a.status !== "completed" && (
                          <div className="bg-rose-500/5 border border-rose-500/10 p-3 rounded-lg text-[10px] text-rose-400 space-y-1">
                            <div className="flex items-center space-x-1.5 font-bold">
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                              <span>Prerequisite Blockers:</span>
                            </div>
                            <ul className="list-disc list-inside pl-1 text-slate-400 text-[9.5px] space-y-0.5">
                              {unmetPrereqTopics.map((pt) => (
                                <li key={pt._id}>Topic "{pt.name}" is incomplete</li>
                              ))}
                              {uncompletedReadings.map((ur) => (
                                <li key={ur._id}>Pending reading: "{ur.title}"</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Card actions */}
                      <div className="border-t border-white/[0.06] pt-3.5 mt-5 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditAssignment(a)}
                            className="text-slate-400 hover:text-white p-2 hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer"
                            title="Edit Details"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete assignment "${a.title}"?`)) {
                                await deleteAssignment({ id: a._id as Id<"assignments"> });
                              }
                            }}
                            className="text-slate-500 hover:text-rose-400 p-2 hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer"
                            title="Delete Assignment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center space-x-2">
                          {a.notes && (
                            <button
                              onClick={() => {
                                setViewingNotesAssignment(a);
                                setNotesModalOpen(true);
                              }}
                              className="text-slate-400 hover:text-white p-2 hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer"
                              title="Guidelines / Study Notes"
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setTimerAssignmentId(a._id);
                              startTimer();
                              setActiveTab("dashboard");
                            }}
                            className="bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 border border-indigo-500/20 text-xs font-bold px-3 py-2 rounded-lg transition-all cursor-pointer"
                          >
                            Study Node
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Tabs.Content>

          {/* TAB 3: VISUAL ROADMAP TREE */}
          <Tabs.Content value="topics" className="space-y-6 outline-none flex-1 flex flex-col min-h-0">
            
            {/* Legend & Instructions */}
            <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center space-x-1.5">
                  <Layers className="h-4 w-4" />
                  <span>Roadmap Skill Tree</span>
                </span>
                <p className="text-xs text-slate-400">
                  Topics are sorted left-to-right based on prerequisite depth. Hover over a node to trace study paths recursively.
                </p>
              </div>

              {/* Legend map indicators */}
              <div className="flex flex-wrap gap-4 text-[10px] font-semibold text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span>Topic Completed</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="h-2.5 w-2.5 rounded bg-slate-800 border border-white/[0.1]" />
                  <span>Muted Line (Blocked Connection)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="h-2.5 w-2.5 rounded bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse" />
                  <span>Glowing Path (Prerequisite sequence)</span>
                </div>
              </div>
            </div>

            {/* Flow canvas wrapper */}
            <div
              id="dependency-map-container"
              ref={mapContainerRef}
              className="glass-panel rounded-2xl flex-1 relative overflow-x-auto overflow-y-hidden select-none min-h-[520px] p-8 flex space-x-24 items-start"
            >
              {/* Dynamic SVG connection lines overlay */}
              <svg className="absolute inset-0 pointer-events-none w-full h-full z-0 overflow-visible">
                <defs>
                  <linearGradient id="line-active" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#c084fc" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="line-completed" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0.4" />
                  </linearGradient>
                  <linearGradient id="line-normal" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06" />
                  </linearGradient>
                </defs>

                {topics &&
                  topics.map((t) =>
                    t.prerequisiteIds.map((pid) => {
                      const start = topicCoords[pid];
                      const end = topicCoords[t._id];
                      if (!start || !end) return null;

                      // Source right middle edge
                      const x1 = start.x + start.w;
                      const y1 = start.y + start.h / 2;

                      // Target left middle edge
                      const x2 = end.x;
                      const y2 = end.y + end.h / 2;

                      // Bezier curve calculations
                      const dx = Math.abs(x2 - x1) * 0.45;
                      const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

                      // Connection styling based on active hover states or completion
                      const connectionId = `${pid}->${t._id}`;
                      const isLineActive = activeConnections.has(connectionId);
                      const isPrereqCompleted = isTopicCompleted(pid, topics, assignments || [], readings || []);
                      
                      let strokeColor = "url(#line-normal)";
                      let strokeWidth = 1.5;
                      let isDashed = !isPrereqCompleted;

                      if (isLineActive) {
                        strokeColor = "url(#line-active)";
                        strokeWidth = 3;
                        isDashed = false;
                      } else if (isPrereqCompleted) {
                        strokeColor = "url(#line-completed)";
                        strokeWidth = 1.5;
                        isDashed = false;
                      }

                      return (
                        <g key={connectionId}>
                          {isLineActive && (
                            <path
                              d={path}
                              fill="none"
                              stroke="#818cf8"
                              strokeWidth={6}
                              strokeOpacity={0.15}
                              className="blur-sm"
                            />
                          )}
                          <path
                            d={path}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeDasharray={isDashed ? "4,4" : undefined}
                            className={`transition-all duration-300 ${isLineActive ? "connector-line" : ""}`}
                          />
                        </g>
                      );
                    })
                  )}
              </svg>

              {/* Dynamic level columns */}
              {(() => {
                const levels = getTopicLevels(topics || []);
                const columns: Record<number, Topic[]> = {};
                topics?.forEach((t) => {
                  const lvl = levels[t._id] || 0;
                  if (!columns[lvl]) columns[lvl] = [];
                  columns[lvl].push(t);
                });

                const maxLevel = Object.keys(columns).length > 0 ? Math.max(...Object.keys(columns).map(Number)) : 0;
                const columnElements = [];

                for (let lvl = 0; lvl <= maxLevel; lvl++) {
                  const columnTopics = columns[lvl] || [];
                  if (columnTopics.length === 0 && lvl > 0) continue;

                  // Name columns logically based on level depth
                  const levelName =
                    lvl === 0
                      ? "Foundations"
                      : lvl === 1
                        ? "Core Topics"
                        : lvl === 2
                          ? "Advanced Concepts"
                          : "Specialized Node";

                  columnElements.push(
                    <div key={lvl} className="flex flex-col space-y-6 w-72 shrink-0 z-10 relative">
                      <div className="border-b border-white/[0.06] pb-3 mb-2 flex items-center justify-between shrink-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          {levelName}
                        </span>
                        <span className="text-[9px] px-2 py-0.5 bg-slate-900 border border-white/[0.08] text-slate-400 rounded-full font-semibold">
                          Lvl {lvl}
                        </span>
                      </div>

                      <div className="flex flex-col space-y-4 overflow-y-auto max-h-[460px] pr-1 py-1">
                        {columnTopics.map((t) => {
                          const isCompleted = isTopicCompleted(t._id, topics, assignments || [], readings || []);
                          const isHighlighted = activeConnections.has(t._id);
                          const isHovered = hoveredTopicId === t._id;
                          const prereqCount = t.prerequisiteIds.length;

                          return (
                            <div
                              key={t._id}
                              id={`topic-node-${t._id}`}
                              onMouseEnter={() => setHoveredTopicId(t._id)}
                              onMouseLeave={() => setHoveredTopicId(null)}
                              className={`p-4.5 rounded-xl border relative transition-all duration-300 ${
                                isHovered
                                  ? "bg-slate-900 border-indigo-500/50 shadow-lg shadow-indigo-500/5 scale-[1.02]"
                                  : isHighlighted
                                    ? "bg-slate-900/60 border-indigo-600/30 scale-[1.01]"
                                    : "bg-slate-950/60 border-white/[0.04] hover:border-white/[0.08]"
                              }`}
                            >
                              {/* Completion indicator tab */}
                              <div
                                className="absolute top-0 left-0 w-1.5 h-full rounded-l-xl transition-all duration-300"
                                style={{
                                  backgroundColor: isCompleted ? "#10b981" : t.color,
                                  boxShadow: isHovered || isCompleted ? `0 0 10px ${isCompleted ? "#10b981" : t.color}50` : undefined
                                }}
                              />

                              <div className="pl-2 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span
                                    className="text-[10px] font-black uppercase tracking-widest"
                                    style={{ color: t.color }}
                                  >
                                    {t.name}
                                  </span>
                                  {isCompleted && (
                                    <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md font-bold flex items-center">
                                      <Check className="h-3 w-3 mr-0.5" />
                                      <span>Done</span>
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                                  {t.description || "No description provided."}
                                </p>

                                <div className="flex items-center justify-between text-[9px] text-slate-500 border-t border-white/[0.04] pt-2 mt-1.5 font-bold">
                                  <span>{prereqCount} Prerequisite{prereqCount !== 1 ? "s" : ""}</span>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => openEditTopic(t)}
                                      className="text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center space-x-0.5"
                                    >
                                      <Edit2 className="h-2.5 w-2.5" />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (confirm(`Are you sure you want to delete topic "${t.name}"? This removes all prerequisites.`)) {
                                          await deleteTopic({ id: t._id as Id<"topics"> });
                                        }
                                      }}
                                      className="text-slate-600 hover:text-rose-400 transition-colors cursor-pointer flex items-center space-x-0.5"
                                    >
                                      <Trash2 className="h-2.5 w-2.5" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                if (columnElements.length === 0) {
                  return (
                    <div className="w-full text-center py-20 flex flex-col items-center justify-center space-y-3">
                      <Layers className="h-10 w-10 text-slate-600" />
                      <span className="text-xs font-bold text-slate-500">No knowledge topics mapped yet</span>
                      <button onClick={openNewTopic} className="text-indigo-400 text-xs font-bold hover:underline">Create a node</button>
                    </div>
                  );
                }

                return columnElements;
              })()}
            </div>
          </Tabs.Content>

          {/* TAB 4: PREREQUISITE READINGS */}
          <Tabs.Content value="readings" className="space-y-4 outline-none">
            <div className="glass-panel p-6 rounded-2xl space-y-6">
              
              {/* Readings list table */}
              <div className="overflow-x-auto border border-white/[0.06] rounded-xl bg-slate-950/40">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/60 text-slate-400 font-semibold border-b border-white/[0.06]">
                    <tr>
                      <th className="p-4.5 font-bold uppercase tracking-wider text-[10px]">Reading / Reference Details</th>
                      <th className="p-4.5 font-bold uppercase tracking-wider text-[10px]">Associated Topic Node</th>
                      <th className="p-4.5 font-bold uppercase tracking-wider text-[10px]">Log Status</th>
                      <th className="p-4.5 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {!readings || readings.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-12 text-center text-slate-500 text-xs italic">
                          No reading references logged. Log textbook chapters or reference papers to map study sources.
                        </td>
                      </tr>
                    ) : (
                      readings.map((r) => {
                        const associatedTopic = topics?.find((top) => top._id === r.topicId);

                        return (
                          <tr key={r._id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="p-4.5">
                              <div className="font-semibold text-white flex items-center space-x-2.5">
                                <span>{r.title}</span>
                                {r.url && (
                                  <a
                                    href={r.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer inline-flex items-center"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                )}
                              </div>
                              {r.author && <div className="text-slate-500 mt-1 text-[11px]">Author: {r.author}</div>}
                            </td>
                            
                            <td className="p-4.5">
                              {associatedTopic ? (
                                <span
                                  className="text-[10px] px-2.5 py-0.5 rounded border font-semibold"
                                  style={{
                                    borderColor: `${associatedTopic.color}40`,
                                    backgroundColor: `${associatedTopic.color}15`,
                                    color: associatedTopic.color,
                                  }}
                                >
                                  {associatedTopic.name}
                                </span>
                              ) : (
                                <span className="text-slate-600 italic">Global reference</span>
                              )}
                            </td>

                            <td className="p-4.5">
                              <select
                                value={r.status}
                                onChange={async (e) => {
                                  await updateReading({
                                    id: r._id as Id<"readings">,
                                    status: e.target.value,
                                  });
                                }}
                                className={`text-[10px] font-bold border rounded-full px-3 py-1 focus:outline-none cursor-pointer transition-all ${
                                  r.status === "completed"
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                    : r.status === "reading"
                                      ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                                      : "bg-slate-800 border-white/[0.04] text-slate-400"
                                }`}
                              >
                                <option value="to_read">To Read</option>
                                <option value="reading">Reading</option>
                                <option value="completed">Completed</option>
                              </select>
                            </td>

                            <td className="p-4.5 text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  onClick={() => openEditReading(r)}
                                  className="text-slate-400 hover:text-white p-2 hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer"
                                  title="Edit reference"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm(`Are you sure you want to delete reading "${r.title}"?`)) {
                                      await deleteReading({ id: r._id as Id<"readings"> });
                                    }
                                  }}
                                  className="text-slate-500 hover:text-rose-400 p-2 hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer"
                                  title="Delete reading"
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

      {/* 4. PERSISTENT FLOATING STUDY TIMER - MOBILE WIDGET */}
      {timerAssignmentId && (
        <div className="lg:hidden fixed bottom-18 left-4 right-4 z-40 bg-slate-950/90 border border-white/[0.08] backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between animate-slide-in-bottom">
          <div className="space-y-0.5 min-w-0 flex-1 mr-4">
            <span className="text-[9px] uppercase font-bold text-indigo-400 block tracking-wider truncate">
              {assignments?.find((a) => a._id === timerAssignmentId)?.title || "Study Session"}
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono font-bold text-white">{formatTime(timerSeconds)}</span>
              {timerRunning && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />}
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {timerRunning ? (
              <button
                onClick={pauseTimer}
                className="bg-amber-600/10 text-amber-400 border border-amber-500/20 p-2 rounded-lg transition-all"
              >
                <Pause className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={startTimer}
                className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-500 transition-all"
              >
                <Play className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={handleSaveTimer}
              disabled={timerSeconds === 0}
              className="bg-emerald-600 text-white text-[10px] font-bold px-3 py-2 rounded-lg transition-all disabled:opacity-40"
            >
              Log
            </button>
            <button
              onClick={() => {
                resetTimer();
                setTimerAssignmentId("");
              }}
              className="bg-white/[0.04] text-slate-400 border border-white/[0.06] p-2 rounded-lg"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 5. MOBILE BOTTOM NAVIGATION TAB BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 border-t border-white/[0.06] backdrop-blur-md p-2 flex items-center justify-around">
        {[
          { id: "dashboard", label: "Overview", icon: Sparkles },
          { id: "assignments", label: "Tasks", icon: BookMarked },
          { id: "topics", label: "Roadmap", icon: Layers },
          { id: "readings", label: "Readings", icon: BookOpen },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
                isActive ? "text-indigo-400" : "text-slate-400"
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              <span className="text-[9.5px] font-semibold mt-1">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ========================================================================= */}
      {/* DIALOG 1: LOG / EDIT ACADEMIC ASSIGNMENT FORM */}
      {/* ========================================================================= */}
      <Dialog.Root open={assignmentModalOpen} onOpenChange={setAssignmentModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass-panel border border-white/[0.08] p-6 rounded-2xl w-[calc(100%-2rem)] max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 focus:outline-none max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5 border-b border-white/[0.06] pb-3.5">
              <Dialog.Title className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <BookMarked className="h-5 w-5 text-indigo-400" />
                <span>{editingAssignment ? "Edit Assignment Details" : "Log New Assignment"}</span>
              </Dialog.Title>
              <Dialog.Close className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/[0.04]">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Assignment Title</label>
                  <input
                    type="text"
                    required
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                    placeholder="e.g. Lab report 3"
                    className="w-full bg-slate-900 border border-white/[0.06] text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Course / Code</label>
                  <input
                    type="text"
                    required
                    value={assignmentCourse}
                    onChange={(e) => setAssignmentCourse(e.target.value)}
                    placeholder="e.g. CS 450"
                    className="w-full bg-slate-900 border border-white/[0.06] text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    required
                    value={assignmentDueDate}
                    onChange={(e) => setAssignmentDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-white/[0.06] text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Current Status</label>
                  <select
                    value={assignmentStatus}
                    onChange={(e) => setAssignmentStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-white/[0.06] text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold cursor-pointer"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Est. Study Hours</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.5"
                    value={assignmentEstHours}
                    onChange={(e) => setAssignmentEstHours(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-white/[0.06] text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Actual Hours Logged</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={assignmentActHours}
                    onChange={(e) => setAssignmentActHours(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-white/[0.06] text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              </div>

              {/* Multi-select Topics Covered */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Topics Covered</label>
                <div className="grid grid-cols-2 gap-2.5 max-h-24 overflow-y-auto p-3 bg-slate-950/60 border border-white/[0.06] rounded-xl">
                  {topics?.map((t) => (
                    <label key={t._id} className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
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
                        className="rounded border-white/[0.08] bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <span className="truncate font-semibold">{t.name}</span>
                    </label>
                  ))}
                  {(!topics || topics.length === 0) && (
                    <span className="text-[10px] text-slate-500 italic col-span-2">No topics logged. Create a topic first.</span>
                  )}
                </div>
              </div>

              {/* Multi-select Readings */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Prerequisite Readings</label>
                <div className="grid grid-cols-2 gap-2.5 max-h-24 overflow-y-auto p-3 bg-slate-950/60 border border-white/[0.06] rounded-xl">
                  {readings?.map((r) => (
                    <label key={r._id} className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
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
                        className="rounded border-white/[0.08] bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <span className="truncate font-semibold">{r.title}</span>
                    </label>
                  ))}
                  {(!readings || readings.length === 0) && (
                    <span className="text-[10px] text-slate-500 italic col-span-2">No readings logged. Create a reading first.</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Guidelines / Notes</label>
                <textarea
                  rows={2}
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  placeholder="Task guidelines, link to submission portals, or study instructions..."
                  className="w-full bg-slate-900 border border-white/[0.06] text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3.5 border-t border-white/[0.06] mt-4">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer border border-white/[0.06]"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/15"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ========================================================================= */}
      {/* DIALOG 2: CREATE / EDIT TOPIC NODE */}
      {/* ========================================================================= */}
      <Dialog.Root open={topicModalOpen} onOpenChange={setTopicModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass-panel border border-white/[0.08] p-6 rounded-2xl w-[calc(100%-2rem)] max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 focus:outline-none">
            <div className="flex items-center justify-between mb-5 border-b border-white/[0.06] pb-3.5">
              <Dialog.Title className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <Layers className="h-5 w-5 text-indigo-400" />
                <span>{editingTopic ? "Edit Topic Settings" : "Create Topic Node"}</span>
              </Dialog.Title>
              <Dialog.Close className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/[0.04]">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>

            <form onSubmit={handleSaveTopic} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Topic Name</label>
                <input
                  type="text"
                  required
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder="e.g. Calculus Foundations"
                  className="w-full bg-slate-900 border border-white/[0.06] text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Description / Learning Outline</label>
                <textarea
                  rows={2}
                  value={topicDesc}
                  onChange={(e) => setTopicDesc(e.target.value)}
                  placeholder="Summarize what concepts this topic maps..."
                  className="w-full bg-slate-900 border border-white/[0.06] text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                />
              </div>

              {/* Prerequisites select */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Prerequisite Nodes</label>
                <div className="grid grid-cols-2 gap-2.5 max-h-28 overflow-y-auto p-3 bg-slate-950/60 border border-white/[0.06] rounded-xl">
                  {topics
                    ?.filter((t) => !editingTopic || t._id !== editingTopic._id)
                    .map((t) => (
                      <label key={t._id} className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
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
                          className="rounded border-white/[0.08] bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span className="truncate font-semibold">{t.name}</span>
                      </label>
                    ))}
                  {(!topics || topics.length === 0) && (
                    <span className="text-[10px] text-slate-500 italic col-span-2">No other topics mapped.</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Accent Color Marker</label>
                <div className="flex items-center space-x-3.5 bg-slate-900/60 p-2.5 border border-white/[0.06] rounded-xl">
                  <input
                    type="color"
                    value={topicColor}
                    onChange={(e) => setTopicColor(e.target.value)}
                    className="h-9 w-12 bg-transparent border-0 cursor-pointer shrink-0 rounded"
                  />
                  <span className="text-xs text-slate-300 font-mono font-bold tracking-wider">{topicColor}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3.5 border-t border-white/[0.06] mt-4">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer border border-white/[0.06]"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/15"
                >
                  Save Topic Node
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ========================================================================= */}
      {/* DIALOG 3: LOG / EDIT PREREQUISITE READING */}
      {/* ========================================================================= */}
      <Dialog.Root open={readingModalOpen} onOpenChange={setReadingModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass-panel border border-white/[0.08] p-6 rounded-2xl w-[calc(100%-2rem)] max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 focus:outline-none">
            <div className="flex items-center justify-between mb-5 border-b border-white/[0.06] pb-3.5">
              <Dialog.Title className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-indigo-400" />
                <span>{editingReading ? "Edit Reference Details" : "Log Study Reading"}</span>
              </Dialog.Title>
              <Dialog.Close className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/[0.04]">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>

            <form onSubmit={handleSaveReading} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Material Title / Chapter Reference</label>
                <input
                  type="text"
                  required
                  value={readingTitle}
                  onChange={(e) => setReadingTitle(e.target.value)}
                  placeholder="e.g. Chapter 4: Derivative Rules"
                  className="w-full bg-slate-900 border border-white/[0.06] text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Author / Source (Optional)</label>
                  <input
                    type="text"
                    value={readingAuthor}
                    onChange={(e) => setReadingAuthor(e.target.value)}
                    placeholder="e.g. Larson et al."
                    className="w-full bg-slate-900 border border-white/[0.06] text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Reading Status</label>
                  <select
                    value={readingStatus}
                    onChange={(e) => setReadingStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-white/[0.06] text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold cursor-pointer"
                  >
                    <option value="to_read">To Read</option>
                    <option value="reading">Reading</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Document URL (Optional)</label>
                <input
                  type="url"
                  value={readingUrl}
                  onChange={(e) => setReadingUrl(e.target.value)}
                  placeholder="e.g. https://mit-ocw.edu/notes.pdf"
                  className="w-full bg-slate-900 border border-white/[0.06] text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Associated Topic Node</label>
                <select
                  value={readingTopicId}
                  onChange={(e) => setReadingTopicId(e.target.value)}
                  className="w-full bg-slate-900 border border-white/[0.06] text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold cursor-pointer"
                >
                  <option value="">-- No Specific Topic Node --</option>
                  {topics?.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3.5 border-t border-white/[0.06] mt-4">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer border border-white/[0.06]"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/15"
                >
                  Save Reading
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ========================================================================= */}
      {/* DIALOG 4: GUIDELINES / STUDY NOTES DRAWER */}
      {/* ========================================================================= */}
      <Dialog.Root open={notesModalOpen} onOpenChange={setNotesModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass-panel border border-white/[0.08] p-6 rounded-2xl w-[calc(100%-2rem)] max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 focus:outline-none">
            <div className="flex items-center justify-between mb-5 border-b border-white/[0.06] pb-3.5">
              <Dialog.Title className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <Info className="h-5 w-5 text-indigo-400" />
                <span>Assignment Guidelines</span>
              </Dialog.Title>
              <Dialog.Close className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/[0.04]">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-1.5">
                  {viewingNotesAssignment?.course} — {viewingNotesAssignment?.title}
                </h4>
                <div className="bg-slate-950 p-4.5 rounded-xl border border-white/[0.06] text-xs text-slate-300 font-semibold whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {viewingNotesAssignment?.notes || "No notes logged for this assignment."}
                </div>
              </div>
              <div className="flex justify-end pt-3 border-t border-white/[0.06]">
                <Dialog.Close asChild>
                  <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/10">
                    Dismiss Notes
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
