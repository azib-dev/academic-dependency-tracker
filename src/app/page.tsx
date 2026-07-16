"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
  FolderOpen,
  CheckSquare,
  Square,
  HelpCircle,
  AlertCircle,
  FileText
} from "lucide-react";
import {
  Topic,
  Reading,
  Assignment,
  isTopicCompleted,
  getUnmetPrerequisitesForTopic,
  getUnmetDependenciesForAssignment
} from "./utils";

// Theme presets for Topics
const TOPIC_COLORS = [
  { name: "Indigo Glow", value: "#6366f1", bg: "bg-indigo-500/10", border: "border-indigo-500/30", text: "text-indigo-400", glow: "shadow-indigo-500/20" },
  { name: "Emerald Mint", value: "#10b981", bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", glow: "shadow-emerald-500/20" },
  { name: "Amber Sun", value: "#f59e0b", bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", glow: "shadow-amber-500/20" },
  { name: "Rose Bloom", value: "#f43f5e", bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", glow: "shadow-rose-500/20" },
  { name: "Sky Cyan", value: "#0ea5e9", bg: "bg-sky-500/10", border: "border-sky-500/30", text: "text-sky-400", glow: "shadow-sky-500/20" },
  { name: "Violet Magic", value: "#8b5cf6", bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400", glow: "shadow-violet-500/20" },
];

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

  // Navigation and search states
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dependencyFilter, setDependencyFilter] = useState("all");

  // Modal open states
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  const [readingModalOpen, setReadingModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<Reading | null>(null);

  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [viewingNotesAssignment, setViewingNotesAssignment] = useState<Assignment | null>(null);

  // Form states
  // Assignment form fields
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentCourse, setAssignmentCourse] = useState("");
  const [assignmentDueDate, setAssignmentDueDate] = useState("");
  const [assignmentStatus, setAssignmentStatus] = useState("not_started");
  const [assignmentEstHours, setAssignmentEstHours] = useState(3);
  const [assignmentActHours, setAssignmentActHours] = useState(0);
  const [assignmentTopicIds, setAssignmentTopicIds] = useState<string[]>([]);
  const [assignmentReadingIds, setAssignmentReadingIds] = useState<string[]>([]);
  const [assignmentNotes, setAssignmentNotes] = useState("");

  // Topic form fields
  const [topicName, setTopicName] = useState("");
  const [topicDesc, setTopicDesc] = useState("");
  const [topicPrereqs, setTopicPrereqs] = useState<string[]>([]);
  const [topicColor, setTopicColor] = useState("#6366f1");

  // Reading form fields
  const [readingTitle, setReadingTitle] = useState("");
  const [readingAuthor, setReadingAuthor] = useState("");
  const [readingUrl, setReadingUrl] = useState("");
  const [readingStatus, setReadingStatus] = useState("to_read");
  const [readingTopicId, setReadingTopicId] = useState("");

  // Timer states
  const [timerAssignmentId, setTimerAssignmentId] = useState<string>("");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [manualLogHours, setManualLogHours] = useState(1);

  // SVG Dependency Tree Ref & States
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [topicCoords, setTopicCoords] = useState<Record<string, { x: number; y: number; w: number; h: number }>>({});
  const [hoveredTopicId, setHoveredTopicId] = useState<string | null>(null);
  const [activeConnections, setActiveConnections] = useState<Set<string>>(new Set());

  // Global Timer effect
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

  // Map active connections when hovering over a topic
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
  const updateCoords = () => {
    const container = mapContainerRef.current;
    if (!container || !topics) return;
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

  useEffect(() => {
    if (activeTab !== "topics" || !topics) return;

    updateCoords();
    const timer = setTimeout(updateCoords, 300);

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
  const topicLevels = useMemo(() => {
    if (!topics) return {};
    const levels: Record<string, number> = {};

    const getLevel = (topicId: string, path = new Set<string>()): number => {
      if (path.has(topicId)) return 0; // prevent circular reference crash
      if (levels[topicId] !== undefined) return levels[topicId];

      const topic = topics.find((t) => t._id === topicId);
      if (!topic || topic.prerequisiteIds.length === 0) {
        levels[topicId] = 0;
        return 0;
      }

      const nextPath = new Set(path);
      nextPath.add(topicId);

      const prereqLevels = topic.prerequisiteIds.map((pid) => getLevel(pid, nextPath));
      const maxLevel = 1 + Math.max(...prereqLevels);
      levels[topicId] = maxLevel;
      return maxLevel;
    };

    topics.forEach((t) => getLevel(t._id));
    return levels;
  }, [topics]);

  // Group topics by their level for visual columns
  const topicsByLevel = useMemo(() => {
    if (!topics) return [];
    const grouped: Record<number, Topic[]> = {};
    topics.forEach((t) => {
      const lvl = topicLevels[t._id] || 0;
      if (!grouped[lvl]) grouped[lvl] = [];
      grouped[lvl].push(t);
    });
    return Object.keys(grouped)
      .map(Number)
      .sort((a, b) => a - b)
      .map((lvl) => ({
        level: lvl,
        items: grouped[lvl],
      }));
  }, [topics, topicLevels]);

  // Timer helper
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Timer controls
  const startTimer = () => {
    if (!timerAssignmentId) return;
    setTimerRunning(true);
  };

  const pauseTimer = () => setTimerRunning(false);

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
    }
  };

  const handleManualLog = async () => {
    if (!timerAssignmentId || manualLogHours <= 0) return;
    try {
      await logAssignmentHours({
        id: timerAssignmentId as Id<"assignments">,
        additionalHours: Number(manualLogHours),
      });
      alert(`Logged ${manualLogHours} hour(s) successfully!`);
    } catch (err) {
      console.error(err);
    }
  };

  // Form prepopulation/creators
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
          notes: assignmentNotes || undefined,
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
          notes: assignmentNotes || undefined,
        });
      }
      setAssignmentModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const openEditTopic = (topic: Topic) => {
    setEditingTopic(topic);
    setTopicName(topic.name);
    setTopicDesc(topic.description);
    setTopicPrereqs(topic.prerequisiteIds);
    setTopicColor(topic.color || "#6366f1");
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
    }
  };

  const quickToggleReading = async (reading: Reading) => {
    const newStatus = reading.status === "completed" ? "to_read" : "completed";
    try {
      await updateReading({
        id: reading._id as Id<"readings">,
        status: newStatus,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const quickToggleAssignment = async (assignment: Assignment) => {
    const newStatus = assignment.status === "completed" ? "in_progress" : "completed";
    try {
      await updateAssignment({
        id: assignment._id as Id<"assignments">,
        status: newStatus,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Filter systems
  const filteredAssignments = useMemo(() => {
    if (!assignments) return [];
    return assignments.filter((a) => {
      const matchesSearch =
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.course.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;

      let matchesDependency = true;
      if (dependencyFilter === "blocked") {
        const deps = getUnmetDependenciesForAssignment(a, topics || [], assignments || [], readings || []);
        matchesDependency = deps.unmetPrereqTopics.length > 0 || deps.uncompletedReadings.length > 0;
      } else if (dependencyFilter === "ready") {
        const deps = getUnmetDependenciesForAssignment(a, topics || [], assignments || [], readings || []);
        matchesDependency = deps.unmetPrereqTopics.length === 0 && deps.uncompletedReadings.length === 0 && a.status !== "completed";
      }

      return matchesSearch && matchesStatus && matchesDependency;
    });
  }, [assignments, topics, readings, searchQuery, statusFilter, dependencyFilter]);

  const filteredReadings = useMemo(() => {
    if (!readings) return [];
    return readings.filter((r) => {
      const matchesSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.author && r.author.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [readings, searchQuery, statusFilter]);

  // Statistics Computations
  const stats = useMemo(() => {
    if (!assignments || !topics || !readings) {
      return {
        assignmentsTotal: 0,
        assignmentsCompleted: 0,
        assignmentsBlocked: 0,
        assignmentsReady: 0,
        topicsTotal: 0,
        topicsCompleted: 0,
        readingsTotal: 0,
        readingsCompleted: 0,
        totalEstHours: 0,
        totalActHours: 0,
        completionRate: 0,
        roadmapRate: 0,
      };
    }

    const assignmentsTotal = assignments.length;
    const assignmentsCompleted = assignments.filter((a) => a.status === "completed").length;
    
    let assignmentsBlocked = 0;
    let assignmentsReady = 0;
    assignments.forEach((a) => {
      if (a.status !== "completed") {
        const deps = getUnmetDependenciesForAssignment(a, topics, assignments, readings);
        if (deps.unmetPrereqTopics.length > 0 || deps.uncompletedReadings.length > 0) {
          assignmentsBlocked++;
        } else {
          assignmentsReady++;
        }
      }
    });

    const topicsTotal = topics.length;
    const topicsCompleted = topics.filter((t) => isTopicCompleted(t._id, topics, assignments, readings)).length;

    const readingsTotal = readings.length;
    const readingsCompleted = readings.filter((r) => r.status === "completed").length;

    const totalEstHours = assignments.reduce((acc, a) => acc + a.estimatedHours, 0);
    const totalActHours = assignments.reduce((acc, a) => acc + a.actualHours, 0);

    const completionRate = assignmentsTotal ? Math.round((assignmentsCompleted / assignmentsTotal) * 100) : 0;
    const roadmapRate = topicsTotal ? Math.round((topicsCompleted / topicsTotal) * 100) : 0;

    return {
      assignmentsTotal,
      assignmentsCompleted,
      assignmentsBlocked,
      assignmentsReady,
      topicsTotal,
      topicsCompleted,
      readingsTotal,
      readingsCompleted,
      totalEstHours,
      totalActHours,
      completionRate,
      roadmapRate,
    };
  }, [assignments, topics, readings]);

  // Urgent assignments (incomplete, ordered by due date)
  const urgentAssignments = useMemo(() => {
    if (!assignments) return [];
    return [...assignments]
      .filter((a) => a.status !== "completed")
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 4);
  }, [assignments]);

  // Pending readings
  const pendingReadings = useMemo(() => {
    if (!readings) return [];
    return readings.filter((r) => r.status !== "completed").slice(0, 4);
  }, [readings]);

  // Active timer assignment info
  const timerAssignment = useMemo(() => {
    if (!timerAssignmentId || !assignments) return null;
    return assignments.find((a) => a._id === timerAssignmentId);
  }, [timerAssignmentId, assignments]);

  // Render loading state if queries are loading
  const isLoading = assignments === undefined || topics === undefined || readings === undefined;

  return (
    <div className="flex-1 flex min-h-screen bg-[#030209] text-slate-100 font-sans selection:bg-indigo-600 selection:text-white relative overflow-hidden">
      
      {/* Background Neon Spotlights */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-950/20 blur-[160px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-950/20 blur-[150px] pointer-events-none z-0" />
      <div className="absolute top-[40%] right-[20%] w-[30%] h-[40%] rounded-full bg-pink-950/10 blur-[130px] pointer-events-none z-0" />

      {/* Sidebar Navigation */}
      <aside className="w-80 border-r border-white/[0.04] bg-[#07060f]/60 backdrop-blur-xl flex flex-col justify-between p-6 z-10 shrink-0 select-none">
        <div className="space-y-8">
          {/* Logo Brand Header */}
          <div className="flex items-center space-x-3 pb-3 border-b border-white/[0.04]">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-600/35 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
              <GraduationCap className="h-5.5 w-5.5 text-white" />
            </div>
            <div>
              <h1 className="text-md font-bold tracking-tight text-white glow-text-indigo">AcuTrack</h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Academic Planner</p>
            </div>
          </div>

          {/* Database Status Info */}
          <div className="flex items-center space-x-2.5 bg-white/[0.02] border border-white/[0.04] px-3.5 py-2.5 rounded-xl text-xs text-slate-400">
            <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-300">Convex DB Connected</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {[
              { id: "dashboard", label: "Dashboard Hub", icon: Layers },
              { id: "assignments", label: "Task Assignments", icon: CheckCircle2 },
              { id: "topics", label: "Roadmap Graph", icon: BookOpenCheck },
              { id: "readings", label: "Readings Database", icon: BookMarked },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSearchQuery("");
                    setStatusFilter("all");
                    setDependencyFilter("all");
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all relative group cursor-pointer ${
                    isActive
                      ? "text-white bg-indigo-500/10 border border-indigo-500/20 shadow-md shadow-indigo-500/5"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] border border-transparent"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-4.5 w-4.5 transition-colors ${isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className={`h-4 w-4 transition-transform duration-300 ${isActive ? "text-indigo-400 transform translate-x-0.5" : "text-transparent group-hover:text-slate-600"}`} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Global Sidebar Stopwatch Widget */}
        <div className="bg-slate-950/60 border border-white/[0.04] rounded-2xl p-4.5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
              <Timer className="h-3.5 w-3.5 text-indigo-400" />
              <span>Study Session</span>
            </h3>
            {timerRunning && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Target Assignment</label>
            <select
              value={timerAssignmentId}
              onChange={(e) => {
                setTimerAssignmentId(e.target.value);
                resetTimer();
              }}
              className="w-full bg-[#111019] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-200 outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="">-- Choose Assignment --</option>
              {assignments
                ?.filter((a) => a.status !== "completed")
                .map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.course} • {a.title}
                  </option>
                ))}
            </select>
          </div>

          {timerAssignmentId && (
            <div className="space-y-3.5 pt-1">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-mono font-bold tracking-wider text-white bg-white/[0.02] border border-white/[0.04] px-3.5 py-1.5 rounded-xl w-full text-center">
                  {formatTime(timerSeconds)}
                </div>
              </div>

              {/* Timer Controls Row */}
              <div className="grid grid-cols-3 gap-2">
                {timerRunning ? (
                  <button
                    onClick={pauseTimer}
                    className="bg-amber-500/10 text-amber-400 border border-amber-500/20 py-2 rounded-xl hover:bg-amber-500/20 transition-all cursor-pointer flex items-center justify-center"
                  >
                    <Pause className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={startTimer}
                    className="bg-indigo-600 text-white py-2 rounded-xl hover:bg-indigo-500 transition-all cursor-pointer flex items-center justify-center shadow-lg shadow-indigo-600/20"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={resetTimer}
                  className="bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 py-2 rounded-xl border border-white/[0.06] transition-all cursor-pointer flex items-center justify-center"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={handleSaveTimer}
                  disabled={timerSeconds === 0}
                  className="bg-emerald-600 disabled:opacity-30 disabled:hover:bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                  title="Save logged hours"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>

              {/* Manual Hour Logging Dropdown */}
              <div className="flex items-center space-x-2 pt-2 border-t border-white/[0.04]">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={manualLogHours}
                  onChange={(e) => setManualLogHours(Number(e.target.value))}
                  className="w-16 bg-[#111019] border border-white/[0.06] rounded-lg py-1 px-1.5 text-center text-xs text-white outline-none"
                />
                <button
                  onClick={handleManualLog}
                  className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 py-1.5 border border-white/[0.06] rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  Log Hours Manually
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 z-10 relative">
        
        {/* Header Action Bar */}
        <header className="h-20 border-b border-white/[0.04] bg-[#030209]/40 backdrop-blur-md px-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center">
              {activeTab === "dashboard" && "Dashboard Overview"}
              {activeTab === "assignments" && "Academic Tasks & Projects"}
              {activeTab === "topics" && "Knowledge roadmaps & nodes"}
              {activeTab === "readings" && "Prerequisite Material Library"}
            </h2>
            <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
            <p className="text-xs text-slate-400 font-medium">
              {activeTab === "dashboard" && "Curated visual analysis of your progress"}
              {activeTab === "assignments" && "Stay on top of dependencies and homework timelines"}
              {activeTab === "topics" && "Track sequential prerequisite requirements"}
              {activeTab === "readings" && "Complete papers, document links, and reference articles"}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick Actions based on tabs */}
            {activeTab === "assignments" && (
              <button
                onClick={openNewAssignment}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                <Plus className="h-4 w-4" />
                <span>Add Assignment</span>
              </button>
            )}
            {activeTab === "topics" && (
              <button
                onClick={openNewTopic}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                <Plus className="h-4 w-4" />
                <span>Create Topic Node</span>
              </button>
            )}
            {activeTab === "readings" && (
              <button
                onClick={openNewReading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                <Plus className="h-4 w-4" />
                <span>Log Reading Material</span>
              </button>
            )}
          </div>
        </header>

        {/* Dynamic content */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {isLoading ? (
            <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
              <div className="relative flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                <GraduationCap className="h-5 w-5 text-indigo-400 absolute animate-pulse" />
              </div>
              <p className="text-slate-400 text-sm font-semibold animate-pulse">Syncing Academic Database...</p>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
              
              {/* TAB 1: DASHBOARD */}
              {activeTab === "dashboard" && (
                <div className="space-y-8">
                  {/* KPI Cards Panel */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Completion rate assignment */}
                    <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border border-white/[0.04]">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assignment Completion</span>
                        <div className="flex items-baseline space-x-1.5">
                          <span className="text-2xl font-extrabold text-white">{stats.assignmentsCompleted}</span>
                          <span className="text-slate-500 text-xs">/ {stats.assignmentsTotal} done</span>
                        </div>
                        <p className="text-[10px] text-emerald-400 font-medium flex items-center space-x-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>{stats.completionRate}% completion rate</span>
                        </p>
                      </div>
                      {/* Custom circular progress gauge */}
                      <div className="relative h-14 w-14 shrink-0 flex items-center justify-center">
                        <svg className="transform -rotate-90" width="56" height="56">
                          <circle className="text-white/[0.03]" strokeWidth="4" stroke="currentColor" fill="transparent" r="24" cx="28" cy="28" />
                          <circle className="text-emerald-500 transition-all duration-700" strokeWidth="4" strokeDasharray={2 * Math.PI * 24} strokeDashoffset={2 * Math.PI * 24 - (stats.completionRate / 100) * (2 * Math.PI * 24)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="24" cx="28" cy="28" />
                        </svg>
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 absolute" />
                      </div>
                    </div>

                    {/* Topic roadmap rate */}
                    <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border border-white/[0.04]">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Topic Roadmap Progress</span>
                        <div className="flex items-baseline space-x-1.5">
                          <span className="text-2xl font-extrabold text-white">{stats.topicsCompleted}</span>
                          <span className="text-slate-500 text-xs">/ {stats.topicsTotal} complete</span>
                        </div>
                        <p className="text-[10px] text-indigo-400 font-medium flex items-center space-x-1">
                          <Sparkles className="h-3 w-3" />
                          <span>{stats.roadmapRate}% curriculum met</span>
                        </p>
                      </div>
                      <div className="relative h-14 w-14 shrink-0 flex items-center justify-center">
                        <svg className="transform -rotate-90" width="56" height="56">
                          <circle className="text-white/[0.03]" strokeWidth="4" stroke="currentColor" fill="transparent" r="24" cx="28" cy="28" />
                          <circle className="text-indigo-500 transition-all duration-700" strokeWidth="4" strokeDasharray={2 * Math.PI * 24} strokeDashoffset={2 * Math.PI * 24 - (stats.roadmapRate / 100) * (2 * Math.PI * 24)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="24" cx="28" cy="28" />
                        </svg>
                        <Layers className="h-4.5 w-4.5 text-indigo-400 absolute" />
                      </div>
                    </div>

                    {/* Study Hours Tracking */}
                    <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border border-white/[0.04]">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Academic Study Time</span>
                        <div className="flex items-baseline space-x-1.5">
                          <span className="text-2xl font-extrabold text-white">{stats.totalActHours.toFixed(1)}h</span>
                          <span className="text-slate-500 text-xs">/ {stats.totalEstHours.toFixed(1)}h est</span>
                        </div>
                        <p className="text-[10px] text-pink-400 font-medium">
                          {stats.totalActHours >= stats.totalEstHours ? "Met estimations" : `${(stats.totalEstHours - stats.totalActHours).toFixed(1)}h remaining estimate`}
                        </p>
                      </div>
                      <div className="relative h-14 w-14 shrink-0 flex items-center justify-center">
                        <svg className="transform -rotate-90" width="56" height="56">
                          <circle className="text-white/[0.03]" strokeWidth="4" stroke="currentColor" fill="transparent" r="24" cx="28" cy="28" />
                          <circle className="text-pink-500 transition-all duration-700" strokeWidth="4" strokeDasharray={2 * Math.PI * 24} strokeDashoffset={2 * Math.PI * 24 - (Math.min(stats.totalActHours, stats.totalEstHours) / (stats.totalEstHours || 1)) * (2 * Math.PI * 24)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="24" cx="28" cy="28" />
                        </svg>
                        <Clock className="h-4.5 w-4.5 text-pink-400 absolute" />
                      </div>
                    </div>

                    {/* Tasks Status Indicator */}
                    <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border border-white/[0.04]">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Unfinished Workloads</span>
                        <div className="flex items-baseline space-x-1.5">
                          <span className="text-2xl font-extrabold text-white">{stats.assignmentsTotal - stats.assignmentsCompleted}</span>
                          <span className="text-slate-500 text-xs">active tasks</span>
                        </div>
                        <div className="flex space-x-2">
                          <p className="text-[10px] text-red-400 font-bold flex items-center space-x-0.5">
                            <AlertTriangle className="h-3 w-3" />
                            <span>{stats.assignmentsBlocked} blocked</span>
                          </p>
                          <p className="text-[10px] text-indigo-400 font-bold">
                            {stats.assignmentsReady} ready
                          </p>
                        </div>
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-red-400" />
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Layout columns */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Urgent tasks details (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="glass-panel rounded-2xl border border-white/[0.04] p-6 space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Immediate Deadlines Checklist</h3>
                            <p className="text-xs text-slate-400 mt-1">Pending tasks ordered by closest due dates</p>
                          </div>
                        </div>

                        {urgentAssignments.length === 0 ? (
                          <div className="h-48 border border-dashed border-white/[0.06] rounded-xl flex flex-col items-center justify-center text-slate-500 space-y-2">
                            <CheckSquare className="h-8 w-8 text-emerald-500/60" />
                            <p className="text-xs font-semibold text-slate-400">All assignments completed successfully!</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {urgentAssignments.map((a) => {
                              const deps = getUnmetDependenciesForAssignment(a, topics || [], assignments || [], readings || []);
                              const isBlocked = deps.unmetPrereqTopics.length > 0 || deps.uncompletedReadings.length > 0;
                              return (
                                <div key={a._id} className="bg-slate-950/40 border border-white/[0.04] rounded-xl p-4.5 space-y-3.5 hover:border-white/[0.08] transition-colors relative overflow-hidden group">
                                  {isBlocked && <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />}
                                  {!isBlocked && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}

                                  <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/25 text-indigo-400">
                                          {a.course}
                                        </span>
                                        {isBlocked ? (
                                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/25 text-rose-400 flex items-center space-x-1 animate-pulse">
                                            <AlertTriangle className="h-3 w-3" />
                                            <span>Blocked</span>
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center space-x-1">
                                            <Check className="h-3 w-3" />
                                            <span>Ready to Start</span>
                                          </span>
                                        )}
                                      </div>
                                      <h4 className="text-sm font-bold text-white">{a.title}</h4>
                                    </div>

                                    {/* Action icons */}
                                    <div className="flex items-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => openEditAssignment(a)}
                                        className="p-1.5 hover:bg-white/[0.06] rounded text-slate-400 hover:text-white transition-all cursor-pointer"
                                        title="Edit details"
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => quickToggleAssignment(a)}
                                        className="p-1.5 hover:bg-white/[0.06] rounded text-slate-400 hover:text-emerald-400 transition-all cursor-pointer"
                                        title="Toggle completion"
                                      >
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Statistics study session progress */}
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs text-slate-400">
                                      <span className="flex items-center space-x-1">
                                        <Clock className="h-3 w-3 text-slate-500" />
                                        <span>Logged study time: <strong>{a.actualHours.toFixed(1)}h</strong> / {a.estimatedHours}h est</span>
                                      </span>
                                      <span className="font-semibold text-slate-300">{Math.round((a.actualHours / (a.estimatedHours || 1)) * 100)}%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min((a.actualHours / (a.estimatedHours || 1)) * 100, 100)}%` }}
                                      />
                                    </div>
                                  </div>

                                  {/* If Blocked, details about unmet prereqs */}
                                  {isBlocked && (
                                    <div className="bg-rose-500/[0.03] border border-rose-500/10 rounded-lg p-2.5 space-y-1">
                                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center space-x-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        <span>Unmet Prerequisites:</span>
                                      </span>
                                      <ul className="text-xs text-slate-400 list-disc list-inside pl-1 space-y-0.5">
                                        {deps.unmetPrereqTopics.map((t) => (
                                          <li key={t._id}>Topic: <strong className="text-slate-300">{t.name}</strong></li>
                                        ))}
                                        {deps.uncompletedReadings.map((r) => (
                                          <li key={r._id}>Reading: <strong className="text-slate-300">{r.title}</strong></li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                                    <span className="flex items-center space-x-1">
                                      <Calendar className="h-3.5 w-3.5 text-slate-600" />
                                      <span>Due: <strong>{a.dueDate}</strong></span>
                                    </span>
                                    {a.notes && (
                                      <button
                                        onClick={() => {
                                          setViewingNotesAssignment(a);
                                          setNotesModalOpen(true);
                                        }}
                                        className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-0.5 cursor-pointer font-bold"
                                      >
                                        <FileText className="h-3 w-3" />
                                        <span>View notes</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right column: Readings & Advice card */}
                    <div className="space-y-6">
                      {/* Active Readings list */}
                      <div className="glass-panel rounded-2xl border border-white/[0.04] p-6 space-y-6">
                        <div>
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Uncompleted Study Readings</h3>
                          <p className="text-xs text-slate-400 mt-1">Key chapters and references to read next</p>
                        </div>

                        {pendingReadings.length === 0 ? (
                          <div className="h-44 border border-dashed border-white/[0.06] rounded-xl flex flex-col items-center justify-center text-slate-500 space-y-2">
                            <BookOpenCheck className="h-8 w-8 text-indigo-500/60" />
                            <p className="text-xs font-semibold text-slate-400">All materials read!</p>
                          </div>
                        ) : (
                          <div className="space-y-3.5">
                            {pendingReadings.map((r) => {
                              const t = topics?.find((topic) => topic._id === r.topicId);
                              return (
                                <div key={r._id} className="flex items-start justify-between bg-slate-950/30 border border-white/[0.04] p-3.5 rounded-xl hover:border-white/[0.08] transition-colors group">
                                  <div className="space-y-1.5 flex-1 min-w-0 pr-2">
                                    <h4 className="text-xs font-bold text-slate-200 truncate" title={r.title}>{r.title}</h4>
                                    {r.author && <p className="text-[10px] text-slate-500">By {r.author}</p>}
                                    {t && (
                                      <span
                                        className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border"
                                        style={{ color: t.color, borderColor: `${t.color}35`, backgroundColor: `${t.color}08` }}
                                      >
                                        {t.name}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center space-x-1.5">
                                    {r.url && (
                                      <a
                                        href={r.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 hover:bg-white/[0.06] rounded text-slate-400 hover:text-white transition-colors"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                      </a>
                                    )}
                                    <button
                                      onClick={() => quickToggleReading(r)}
                                      className="p-1 hover:bg-white/[0.06] rounded text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                                      title="Mark completed"
                                    >
                                      <Square className="h-3.5 w-3.5 text-slate-500 hover:text-emerald-400" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Productivity/Advice Widget */}
                      <div className="bg-gradient-to-tr from-indigo-950/40 to-purple-950/20 border border-indigo-500/10 rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden">
                        <div className="absolute right-[-15px] bottom-[-15px] h-24 w-24 rounded-full bg-indigo-500/5 blur-lg pointer-events-none" />
                        <div className="flex items-center space-x-2">
                          <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Study Roadmap Tip</h4>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {stats.assignmentsBlocked > 0
                            ? `You have ${stats.assignmentsBlocked} blocked assignments. Complete their listed prerequisite topics or reading materials first to clear your roadmap!`
                            : "Excellent! You have no blocked assignments. Select a task to log study hours, or inspect your knowledge graph to expand topics."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ASSIGNMENTS TASK BOARD */}
              {activeTab === "assignments" && (
                <div className="space-y-6">
                  {/* Dynamic Filtering toolbar */}
                  <div className="glass-panel rounded-2xl border border-white/[0.04] p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
                      {/* Search Bar */}
                      <div className="relative w-full sm:w-72">
                        <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search course or assignment title..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-[#111019] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>

                      {/* Status select filter */}
                      <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <label className="text-[11px] font-bold text-slate-500 uppercase shrink-0">Status:</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="bg-[#111019] border border-white/[0.06] rounded-xl px-3 py-2 text-xs font-medium text-slate-300 outline-none focus:border-indigo-500"
                        >
                          <option value="all">All Statuses</option>
                          <option value="not_started">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>

                      {/* Blocked/Ready selector filter */}
                      <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <label className="text-[11px] font-bold text-slate-500 uppercase shrink-0">Prerequisites:</label>
                        <select
                          value={dependencyFilter}
                          onChange={(e) => setDependencyFilter(e.target.value)}
                          className="bg-[#111019] border border-white/[0.06] rounded-xl px-3 py-2 text-xs font-medium text-slate-300 outline-none focus:border-indigo-500"
                        >
                          <option value="all">All Items</option>
                          <option value="ready">Ready to Start (Unblocked)</option>
                          <option value="blocked">Blocked Tasks</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Cards Grid */}
                  {filteredAssignments.length === 0 ? (
                    <div className="h-64 border border-dashed border-white/[0.06] rounded-2xl flex flex-col items-center justify-center text-slate-500 space-y-3">
                      <FolderOpen className="h-10 w-10 text-indigo-500/40" />
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-300">No Assignments Found</p>
                        <p className="text-xs text-slate-500 mt-1">Try resetting search keywords or filter values</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredAssignments.map((a) => {
                        const deps = getUnmetDependenciesForAssignment(a, topics || [], assignments || [], readings || []);
                        const isBlocked = deps.unmetPrereqTopics.length > 0 || deps.uncompletedReadings.length > 0;
                        return (
                          <div
                            key={a._id}
                            className={`glass-panel rounded-2xl p-5 border border-white/[0.04] transition-all hover:translate-y-[-2px] relative overflow-hidden group flex flex-col justify-between h-[250px] ${
                              a.status === "completed"
                                ? "border-emerald-500/10 bg-emerald-950/[0.01]"
                                : isBlocked
                                ? "border-rose-500/10 bg-rose-950/[0.01]"
                                : "hover:border-indigo-500/20"
                            }`}
                          >
                            <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/25 text-indigo-400">
                                      {a.course}
                                    </span>
                                    {a.status === "completed" ? (
                                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                                        Completed
                                      </span>
                                    ) : isBlocked ? (
                                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/25 text-rose-400 flex items-center space-x-1 animate-pulse">
                                        <AlertTriangle className="h-3 w-3" />
                                        <span>Blocked</span>
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-amber-400">
                                        {a.status === "in_progress" ? "In Progress" : "Not Started"}
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1" title={a.title}>
                                    {a.title}
                                  </h4>
                                </div>

                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => openEditAssignment(a)}
                                    className="p-1.5 hover:bg-white/[0.06] rounded text-slate-400 hover:text-white transition-all cursor-pointer"
                                    title="Edit assignment details"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (confirm("Delete this assignment?")) {
                                        try {
                                          await deleteAssignment({ id: a._id as Id<"assignments"> });
                                        } catch (e) {
                                          console.error(e);
                                        }
                                      }
                                    }}
                                    className="p-1.5 hover:bg-white/[0.06] rounded text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                                    title="Delete assignment"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs text-slate-400">
                                  <span>Hours: <strong>{a.actualHours.toFixed(1)}h</strong> / {a.estimatedHours}h est</span>
                                  <span className="font-semibold text-slate-300">{Math.round((a.actualHours / (a.estimatedHours || 1)) * 100)}%</span>
                                </div>
                                <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min((a.actualHours / (a.estimatedHours || 1)) * 100, 100)}%` }}
                                  />
                                </div>
                              </div>

                              {/* Linked topics preview */}
                              {a.topics.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {a.topics.map((t) => (
                                    <span
                                      key={t._id}
                                      className="text-[9px] font-bold px-1.5 py-0.5 rounded border"
                                      style={{ color: t.color, borderColor: `${t.color}30`, backgroundColor: `${t.color}05` }}
                                    >
                                      {t.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-white/[0.04] pt-3 mt-3">
                              <span className="flex items-center space-x-1">
                                <Calendar className="h-3.5 w-3.5 text-slate-600" />
                                <span>Due: <strong>{a.dueDate}</strong></span>
                              </span>

                              <div className="flex space-x-3.5">
                                {a.notes && (
                                  <button
                                    onClick={() => {
                                      setViewingNotesAssignment(a);
                                      setNotesModalOpen(true);
                                    }}
                                    className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center space-x-0.5 cursor-pointer"
                                  >
                                    <FileText className="h-3 w-3" />
                                    <span>Notes</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    setTimerAssignmentId(a._id);
                                    setActiveTab("dashboard");
                                  }}
                                  className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center space-x-0.5 cursor-pointer"
                                >
                                  <Play className="h-3 w-3" />
                                  <span>Study</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ROADMAP GRAPH */}
              {activeTab === "topics" && (
                <div className="space-y-6">
                  {/* Info helper card */}
                  <div className="glass-panel rounded-2xl border border-white/[0.04] p-4 flex items-center space-x-3 text-xs text-slate-400">
                    <Info className="h-5 w-5 text-indigo-400 shrink-0" />
                    <span>
                      Hover over any course/subject node to visualize connected prerequisite pathways. Solid green lines indicate met requirements; glowing paths indicate dependencies; dashed lines represent locked dependencies.
                    </span>
                  </div>

                  {/* Interactive SVG tree container */}
                  <div
                    ref={mapContainerRef}
                    className="relative border border-white/[0.04] bg-[#07060f]/40 backdrop-blur-md rounded-2xl overflow-auto h-[600px] shadow-inner select-none"
                    style={{ contentVisibility: "auto" }}
                  >
                    
                    {/* SVG Connections overlay */}
                    <svg className="absolute inset-0 pointer-events-none w-[2000px] h-[2000px] z-0">
                      <defs>
                        <linearGradient id="line-active" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
                        </linearGradient>
                        <linearGradient id="line-completed" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
                        </linearGradient>
                        <linearGradient id="line-normal" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.05" />
                          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>

                      {topics &&
                        topics.map((t) =>
                          t.prerequisiteIds.map((pid) => {
                            const start = topicCoords[pid];
                            const end = topicCoords[t._id];
                            if (!start || !end) return null;

                            // Source node right middle edge
                            const x1 = start.x + start.w;
                            const y1 = start.y + start.h / 2;

                            // Target node left middle edge
                            const x2 = end.x;
                            const y2 = end.y + end.h / 2;

                            // Curve parameters
                            const dx = Math.abs(x2 - x1) * 0.45;
                            const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

                            const connectionId = `${pid}->${t._id}`;
                            const isLineActive = activeConnections.has(connectionId);
                            const isPrereqCompleted = isTopicCompleted(pid, topics || [], assignments || [], readings || []);
                            
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
                                    strokeLinecap="round"
                                  />
                                )}
                                <path
                                  d={path}
                                  fill="none"
                                  stroke={strokeColor}
                                  strokeWidth={strokeWidth}
                                  strokeDasharray={isDashed ? "5,5" : undefined}
                                  className={isLineActive ? "connector-line" : ""}
                                  strokeLinecap="round"
                                />
                              </g>
                            );
                          })
                        )}
                    </svg>

                    {/* Nodes level grid columns */}
                    <div className="absolute inset-0 p-12 flex space-x-24 z-10 w-max h-max min-h-full">
                      {topicsByLevel.length === 0 ? (
                        <div className="h-[400px] w-[800px] flex flex-col items-center justify-center text-slate-500 space-y-3">
                          <Activity className="h-10 w-10 text-indigo-500/40" />
                          <div className="text-center">
                            <p className="text-sm font-bold text-slate-300">No roadmap topics defined yet</p>
                            <p className="text-xs text-slate-500 mt-1">Create curriculum nodes to populate the dependencies map</p>
                          </div>
                        </div>
                      ) : (
                        topicsByLevel.map((lvlGroup) => (
                          <div key={lvlGroup.level} className="flex flex-col justify-around py-4 w-64 space-y-10 shrink-0">
                            
                            {/* Column header indicating level */}
                            <div className="text-center border-b border-white/[0.04] pb-2">
                              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                                {lvlGroup.level === 0 ? "Fundamentals" : `Prereq Level ${lvlGroup.level}`}
                              </span>
                            </div>

                            {/* Node items */}
                            <div className="flex flex-col space-y-6">
                              {lvlGroup.items.map((t) => {
                                const isCompleted = isTopicCompleted(t._id, topics || [], assignments || [], readings || []);
                                const unmetPrereqs = getUnmetPrerequisitesForTopic(t._id, topics || [], assignments || [], readings || []);
                                const isBlocked = unmetPrereqs.length > 0;
                                const isHovered = hoveredTopicId === t._id;
                                
                                return (
                                  <div
                                    key={t._id}
                                    id={`topic-node-${t._id}`}
                                    onMouseEnter={() => setHoveredTopicId(t._id)}
                                    onMouseLeave={() => setHoveredTopicId(null)}
                                    style={{ borderColor: t.color || "#6366f1" }}
                                    className={`bg-[#0d0c16]/90 border rounded-2xl p-4 transition-all duration-300 relative group flex flex-col justify-between ${
                                      isHovered
                                        ? "shadow-lg scale-[1.03]"
                                        : "shadow-md"
                                    }`}
                                  >
                                    {/* Active border glow */}
                                    <div
                                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                      style={{ boxShadow: `0 0 20px ${t.color || "#6366f1"}15` }}
                                    />

                                    <div className="space-y-2">
                                      <div className="flex items-start justify-between">
                                        <h4 className="text-xs font-bold text-white tracking-tight leading-snug truncate pr-2 w-44" title={t.name}>
                                          {t.name}
                                        </h4>

                                        <div className="flex space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                          <button
                                            onClick={() => openEditTopic(t)}
                                            className="p-1 hover:bg-white/[0.06] rounded text-slate-400 hover:text-white"
                                          >
                                            <Edit2 className="h-3 w-3" />
                                          </button>
                                          <button
                                            onClick={async () => {
                                              if (confirm("Are you sure you want to delete this topic? All links in assignments & readings will be cleaned up.")) {
                                                try {
                                                  await deleteTopic({ id: t._id as Id<"topics"> });
                                                } catch (e) {
                                                  console.error(e);
                                                }
                                              }
                                            }}
                                            className="p-1 hover:bg-white/[0.06] rounded text-slate-400 hover:text-rose-400"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </div>
                                      </div>

                                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed" title={t.description}>
                                        {t.description || "No topic description provided"}
                                      </p>
                                    </div>

                                    {/* Status details */}
                                    <div className="mt-3.5 pt-2.5 border-t border-white/[0.03] flex items-center justify-between text-[9px] text-slate-400">
                                      {isCompleted ? (
                                        <span className="text-emerald-400 font-bold flex items-center space-x-0.5">
                                          <Check className="h-3 w-3" />
                                          <span>Met</span>
                                        </span>
                                      ) : isBlocked ? (
                                        <span className="text-rose-400 font-bold flex items-center space-x-0.5" title={`Unmet prerequisites: ${unmetPrereqs.map(up => up.name).join(", ")}`}>
                                          <AlertTriangle className="h-3 w-3 animate-pulse" />
                                          <span>Locked</span>
                                        </span>
                                      ) : (
                                        <span className="text-indigo-400 font-bold flex items-center space-x-0.5">
                                          <Sparkles className="h-3 w-3" />
                                          <span>Available</span>
                                        </span>
                                      )}

                                      <span className="font-medium text-slate-500 uppercase tracking-widest">
                                        Lv {lvlGroup.level}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: READINGS DATABASE */}
              {activeTab === "readings" && (
                <div className="space-y-6">
                  {/* Search and Filters */}
                  <div className="glass-panel rounded-2xl border border-white/[0.04] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
                      <div className="relative w-full sm:w-72">
                        <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search readings title or author..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-[#111019] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>

                      <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <label className="text-[11px] font-bold text-slate-500 uppercase shrink-0">Reading Status:</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="bg-[#111019] border border-white/[0.06] rounded-xl px-3 py-2 text-xs font-medium text-slate-300 outline-none focus:border-indigo-500"
                        >
                          <option value="all">All Readings</option>
                          <option value="to_read">To Read</option>
                          <option value="reading">Currently Reading</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* List / Table */}
                  {filteredReadings.length === 0 ? (
                    <div className="h-64 border border-dashed border-white/[0.06] rounded-2xl flex flex-col items-center justify-center text-slate-500 space-y-3">
                      <BookOpen className="h-10 w-10 text-indigo-500/40" />
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-300">No readings found</p>
                        <p className="text-xs text-slate-500 mt-1">Add reading materials or change selection criteria</p>
                      </div>
                    </div>
                  ) : (
                    <div className="glass-panel rounded-2xl border border-white/[0.04] overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/[0.04] bg-[#07060f]/40 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <th className="py-4 px-6">Material details</th>
                            <th className="py-4 px-6">Associated topic</th>
                            <th className="py-4 px-6">Status</th>
                            <th className="py-4 px-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03] text-sm">
                          {filteredReadings.map((r) => {
                            const t = topics?.find((topic) => topic._id === r.topicId);
                            return (
                              <tr key={r._id} className="hover:bg-white/[0.01] transition-colors group">
                                <td className="py-4.5 px-6">
                                  <div className="space-y-1 max-w-md">
                                    <h4 className="font-bold text-white text-xs">{r.title}</h4>
                                    {r.author && <p className="text-[10px] text-slate-500">By {r.author}</p>}
                                  </div>
                                </td>
                                <td className="py-4.5 px-6">
                                  {t ? (
                                    <span
                                      className="inline-block text-[9px] font-bold px-2 py-0.5 rounded border"
                                      style={{ color: t.color, borderColor: `${t.color}35`, backgroundColor: `${t.color}05` }}
                                    >
                                      {t.name}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-600 font-semibold italic">Unmapped</span>
                                  )}
                                </td>
                                <td className="py-4.5 px-6">
                                  <select
                                    value={r.status}
                                    onChange={async (e) => {
                                      try {
                                        await updateReading({
                                          id: r._id as Id<"readings">,
                                          status: e.target.value,
                                        });
                                      } catch (err) {
                                        console.error(err);
                                      }
                                    }}
                                    className="bg-[#111019] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-300 outline-none focus:border-indigo-500 cursor-pointer"
                                  >
                                    <option value="to_read">To Read</option>
                                    <option value="reading">Currently Reading</option>
                                    <option value="completed">Completed</option>
                                  </select>
                                </td>
                                <td className="py-4.5 px-6 text-right">
                                  <div className="flex items-center justify-end space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {r.url && (
                                      <a
                                        href={r.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 hover:bg-white/[0.06] rounded text-slate-400 hover:text-white transition-colors"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </a>
                                    )}
                                    <button
                                      onClick={() => openEditReading(r)}
                                      className="p-1.5 hover:bg-white/[0.06] rounded text-slate-400 hover:text-white cursor-pointer"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (confirm("Delete reading from checklist?")) {
                                          try {
                                            await deleteReading({ id: r._id as Id<"readings"> });
                                          } catch (e) {
                                            console.error(e);
                                          }
                                        }
                                      }}
                                      className="p-1.5 hover:bg-white/[0.06] rounded text-slate-400 hover:text-rose-400 cursor-pointer"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>
      </main>

      {/* ======================================================== */}
      {/* DIALOG MODALS OVERLAYS */}
      {/* ======================================================== */}

      {/* 1. ASSIGNMENT MODAL */}
      <Dialog.Root open={assignmentModalOpen} onOpenChange={setAssignmentModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-[#000000a6] backdrop-blur-sm z-40 transition-all duration-300" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-xl bg-[#090812] border border-white/[0.06] rounded-2xl p-6 shadow-2xl z-50 overflow-y-auto max-h-[85vh] outline-none">
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-4 mb-5">
              <Dialog.Title className="text-md font-bold text-white flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-indigo-400" />
                <span>{editingAssignment ? "Edit Assignment Details" : "Log New Homework Assignment"}</span>
              </Dialog.Title>
              <Dialog.Close className="p-1.5 hover:bg-white/[0.06] rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </Dialog.Close>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-slate-400">Assignment Title *</label>
                  <input
                    type="text"
                    required
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                    className="w-full bg-[#111019] border border-white/[0.06] rounded-xl px-3 py-2.5 text-white outline-none focus:border-indigo-500"
                    placeholder="E.g., Problem Set 1"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-slate-400">Course Code *</label>
                  <input
                    type="text"
                    required
                    value={assignmentCourse}
                    onChange={(e) => setAssignmentCourse(e.target.value)}
                    className="w-full bg-[#111019] border border-white/[0.06] rounded-xl px-3 py-2.5 text-white outline-none focus:border-indigo-500"
                    placeholder="E.g., CS 101"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-slate-400">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={assignmentDueDate}
                    onChange={(e) => setAssignmentDueDate(e.target.value)}
                    className="w-full bg-[#111019] border border-white/[0.06] rounded-xl px-3 py-2.5 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-slate-400">Workload Status</label>
                  <select
                    value={assignmentStatus}
                    onChange={(e) => setAssignmentStatus(e.target.value)}
                    className="w-full bg-[#111019] border border-white/[0.06] rounded-xl px-3 py-2.5 text-slate-300 outline-none focus:border-indigo-500"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-slate-400">Estimated Study Hours</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={assignmentEstHours}
                    onChange={(e) => setAssignmentEstHours(Number(e.target.value))}
                    className="w-full bg-[#111019] border border-white/[0.06] rounded-xl px-3 py-2.5 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-slate-400">Actual Logged Hours</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={assignmentActHours}
                    onChange={(e) => setAssignmentActHours(Number(e.target.value))}
                    className="w-full bg-[#111019] border border-white/[0.06] rounded-xl px-3 py-2.5 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Topics Selection checklist */}
              <div className="space-y-2.5">
                <label className="text-[10px] uppercase text-slate-400">Linked Prerequisite Topics</label>
                <div className="bg-[#111019] border border-white/[0.06] rounded-xl p-3.5 max-h-32 overflow-y-auto grid grid-cols-2 gap-2">
                  {topics?.map((t) => {
                    const checked = assignmentTopicIds.includes(t._id);
                    return (
                      <label key={t._id} className="flex items-center space-x-2 cursor-pointer select-none text-[11px] text-slate-300">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setAssignmentTopicIds(assignmentTopicIds.filter(id => id !== t._id));
                            } else {
                              setAssignmentTopicIds([...assignmentTopicIds, t._id]);
                            }
                          }}
                          className="h-3.5 w-3.5 rounded border-white/[0.06] bg-[#111019] text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="truncate" title={t.name}>{t.name}</span>
                      </label>
                    );
                  })}
                  {(!topics || topics.length === 0) && (
                    <span className="text-[10px] text-slate-500 italic col-span-2">No topics available yet</span>
                  )}
                </div>
              </div>

              {/* Readings Selection checklist */}
              <div className="space-y-2.5">
                <label className="text-[10px] uppercase text-slate-400">Linked Readings Checklist</label>
                <div className="bg-[#111019] border border-white/[0.06] rounded-xl p-3.5 max-h-32 overflow-y-auto space-y-2">
                  {readings?.map((r) => {
                    const checked = assignmentReadingIds.includes(r._id);
                    return (
                      <label key={r._id} className="flex items-center space-x-2 cursor-pointer select-none text-[11px] text-slate-300">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setAssignmentReadingIds(assignmentReadingIds.filter(id => id !== r._id));
                            } else {
                              setAssignmentReadingIds([...assignmentReadingIds, r._id]);
                            }
                          }}
                          className="h-3.5 w-3.5 rounded border-white/[0.06] bg-[#111019] text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="truncate" title={r.title}>{r.title}</span>
                      </label>
                    );
                  })}
                  {(!readings || readings.length === 0) && (
                    <span className="text-[10px] text-slate-500 italic">No readings available yet</span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-slate-400">Study Notes / Guidelines</label>
                <textarea
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-[#111019] border border-white/[0.06] rounded-xl p-3 text-white outline-none focus:border-indigo-500 resize-none"
                  placeholder="Notes, instructions, details..."
                />
              </div>

              <div className="flex justify-end space-x-2.5 pt-3 border-t border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => setAssignmentModalOpen(false)}
                  className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/25 cursor-pointer"
                >
                  {editingAssignment ? "Save Changes" : "Save Log"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* 2. TOPIC NODE MODAL */}
      <Dialog.Root open={topicModalOpen} onOpenChange={setTopicModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-[#000000a6] backdrop-blur-sm z-40 transition-all duration-300" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-[#090812] border border-white/[0.06] rounded-2xl p-6 shadow-2xl z-50 outline-none">
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-4 mb-5">
              <Dialog.Title className="text-md font-bold text-white flex items-center space-x-2">
                <BookOpenCheck className="h-5 w-5 text-indigo-400" />
                <span>{editingTopic ? "Update Curriculum Node" : "Create New Knowledge Node"}</span>
              </Dialog.Title>
              <Dialog.Close className="p-1.5 hover:bg-white/[0.06] rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </Dialog.Close>
            </div>

            <form onSubmit={handleSaveTopic} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-slate-400">Node Name *</label>
                <input
                  type="text"
                  required
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  className="w-full bg-[#111019] border border-white/[0.06] rounded-xl px-3 py-2.5 text-white outline-none focus:border-indigo-500"
                  placeholder="E.g., Algorithms & Data Structures"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-slate-400">Description / Subject Focus</label>
                <textarea
                  value={topicDesc}
                  onChange={(e) => setTopicDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-[#111019] border border-white/[0.06] rounded-xl p-3 text-white outline-none focus:border-indigo-500 resize-none"
                  placeholder="Summarize course goals..."
                />
              </div>

              {/* Theme color selectors preset */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-slate-400">Node Theme Color</label>
                <div className="flex space-x-2.5">
                  {TOPIC_COLORS.map((col) => (
                    <button
                      key={col.value}
                      type="button"
                      onClick={() => setTopicColor(col.value)}
                      className={`h-7 w-7 rounded-full border transition-transform relative flex items-center justify-center cursor-pointer ${
                        topicColor === col.value ? "scale-110 border-white" : "border-transparent"
                      }`}
                      style={{ backgroundColor: col.value }}
                      title={col.name}
                    >
                      {topicColor === col.value && <Check className="h-3.5 w-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prerequisite Node selectors checklist */}
              <div className="space-y-2.5">
                <label className="text-[10px] uppercase text-slate-400">Roadmap Prerequisites (Requires completion of)</label>
                <div className="bg-[#111019] border border-white/[0.06] rounded-xl p-3.5 max-h-32 overflow-y-auto space-y-2">
                  {topics
                    ?.filter((t) => !editingTopic || t._id !== editingTopic._id)
                    .map((t) => {
                      const checked = topicPrereqs.includes(t._id);
                      return (
                        <label key={t._id} className="flex items-center space-x-2 cursor-pointer select-none text-[11px] text-slate-300">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (checked) {
                                setTopicPrereqs(topicPrereqs.filter(id => id !== t._id));
                              } else {
                                setTopicPrereqs([...topicPrereqs, t._id]);
                              }
                            }}
                            className="h-3.5 w-3.5 rounded border-white/[0.06] bg-[#111019] text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="truncate">{t.name}</span>
                        </label>
                      );
                    })}
                  {(!topics || topics.filter(t => !editingTopic || t._id !== editingTopic._id).length === 0) && (
                    <span className="text-[10px] text-slate-500 italic">No prerequisite nodes available yet</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2.5 pt-3 border-t border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => setTopicModalOpen(false)}
                  className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/25 cursor-pointer"
                >
                  {editingTopic ? "Update Node" : "Create Node"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* 3. READING MODAL */}
      <Dialog.Root open={readingModalOpen} onOpenChange={setReadingModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-[#000000a6] backdrop-blur-sm z-40 transition-all duration-300" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-[#090812] border border-white/[0.06] rounded-2xl p-6 shadow-2xl z-50 outline-none">
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-4 mb-5">
              <Dialog.Title className="text-md font-bold text-white flex items-center space-x-2">
                <BookMarked className="h-5 w-5 text-indigo-400" />
                <span>{editingReading ? "Edit Reading Record" : "Add New Reading Material"}</span>
              </Dialog.Title>
              <Dialog.Close className="p-1.5 hover:bg-white/[0.06] rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </Dialog.Close>
            </div>

            <form onSubmit={handleSaveReading} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-slate-400">Material Title / Chapter *</label>
                <input
                  type="text"
                  required
                  value={readingTitle}
                  onChange={(e) => setReadingTitle(e.target.value)}
                  className="w-full bg-[#111019] border border-white/[0.06] rounded-xl px-3 py-2.5 text-white outline-none focus:border-indigo-500"
                  placeholder="E.g., Introduction to Neural Networks"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-slate-400">Author / Publisher</label>
                  <input
                    type="text"
                    value={readingAuthor}
                    onChange={(e) => setReadingAuthor(e.target.value)}
                    className="w-full bg-[#111019] border border-white/[0.06] rounded-xl px-3 py-2.5 text-white outline-none focus:border-indigo-500"
                    placeholder="E.g., Bishop et al."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-slate-400">Reading Status</label>
                  <select
                    value={readingStatus}
                    onChange={(e) => setReadingStatus(e.target.value)}
                    className="w-full bg-[#111019] border border-white/[0.06] rounded-xl px-3 py-2.5 text-slate-300 outline-none focus:border-indigo-500"
                  >
                    <option value="to_read">To Read</option>
                    <option value="reading">Currently Reading</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-slate-400">PDF / Reference URL</label>
                <input
                  type="url"
                  value={readingUrl}
                  onChange={(e) => setReadingUrl(e.target.value)}
                  className="w-full bg-[#111019] border border-white/[0.06] rounded-xl px-3 py-2.5 text-white outline-none focus:border-indigo-500"
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-slate-400">Associated Roadmap Node</label>
                <select
                  value={readingTopicId}
                  onChange={(e) => setReadingTopicId(e.target.value)}
                  className="w-full bg-[#111019] border border-white/[0.06] rounded-xl px-3 py-2.5 text-slate-300 outline-none focus:border-indigo-500"
                >
                  <option value="">-- Unmapped --</option>
                  {topics?.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2.5 pt-3 border-t border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => setReadingModalOpen(false)}
                  className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/25 cursor-pointer"
                >
                  {editingReading ? "Save Reading" : "Add Material"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* 4. DETAILS / NOTES DISPLAY OVERLAY */}
      <Dialog.Root open={notesModalOpen} onOpenChange={setNotesModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-[#000000a6] backdrop-blur-sm z-40 transition-all duration-300" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-[#090812] border border-white/[0.06] rounded-2xl p-6 shadow-2xl z-50 outline-none">
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-4 mb-5">
              <Dialog.Title className="text-md font-bold text-white flex items-center space-x-2">
                <FileText className="h-5 w-5 text-indigo-400" />
                <span>Assignment Guidelines & Notes</span>
              </Dialog.Title>
              <Dialog.Close className="p-1.5 hover:bg-white/[0.06] rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Assignment Focus</span>
                <h4 className="text-sm font-bold text-white">{viewingNotesAssignment?.title} ({viewingNotesAssignment?.course})</h4>
              </div>

              <div className="bg-[#111019] border border-white/[0.06] rounded-xl p-4.5 min-h-32 text-xs font-medium text-slate-300 leading-relaxed overflow-y-auto max-h-60 whitespace-pre-wrap">
                {viewingNotesAssignment?.notes || "No study guidelines defined."}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setNotesModalOpen(false)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
}
