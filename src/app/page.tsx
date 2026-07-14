"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import DashboardTab from "@/components/DashboardTab";
import AssignmentsTab from "@/components/AssignmentsTab";
import ReadingsTab from "@/components/ReadingsTab";
import CoursesTab from "@/components/CoursesTab";
import {
  AddCourseModal,
  AddReadingModal,
  AddAssignmentModal,
  LogTimeModal,
} from "@/components/Modals";
import { GraduationCap, LayoutDashboard, Calendar, BookOpen, Layers, Sparkles } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Modal states
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isAddReadingOpen, setIsAddReadingOpen] = useState(false);
  const [isAddAssignmentOpen, setIsAddAssignmentOpen] = useState(false);
  const [isLogTimeOpen, setIsLogTimeOpen] = useState(false);

  // Time log tracking state
  const [selectedAssignmentForTime, setSelectedAssignmentForTime] = useState<string | undefined>(undefined);

  const handleOpenLogTime = (assignmentId?: string) => {
    setSelectedAssignmentForTime(assignmentId);
    setIsLogTimeOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))]">
      {/* Navbar / Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent flex items-center gap-1.5">
                Academic Dependency Tracker
              </h1>
              <p className="text-3xs text-slate-400 font-medium">Syllabus Prerequisites & Study Estimations</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-2xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
              <Sparkles className="h-3.5 w-3.5" /> Local Server Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-center sm:justify-start">
            <TabsList>
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </TabsTrigger>
              <TabsTrigger value="assignments" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Assignments
              </TabsTrigger>
              <TabsTrigger value="readings" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Readings
              </TabsTrigger>
              <TabsTrigger value="courses" className="flex items-center gap-2">
                <Layers className="h-4 w-4" /> Courses & Mapping
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 1. Dashboard View */}
          <TabsContent value="dashboard">
            <DashboardTab
              onSetActiveTab={setActiveTab}
              onOpenLogTime={handleOpenLogTime}
            />
          </TabsContent>

          {/* 2. Assignments View */}
          <TabsContent value="assignments">
            <AssignmentsTab
              onOpenAddAssignment={() => setIsAddAssignmentOpen(true)}
              onOpenLogTime={handleOpenLogTime}
            />
          </TabsContent>

          {/* 3. Readings View */}
          <TabsContent value="readings">
            <ReadingsTab onOpenAddReading={() => setIsAddReadingOpen(true)} />
          </TabsContent>

          {/* 4. Courses & Syllabus Mapping View */}
          <TabsContent value="courses">
            <CoursesTab onOpenAddCourse={() => setIsAddCourseOpen(true)} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/40 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <p>© 2026 Academic Dependency Tracker. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-400 transition cursor-pointer">Terms</span>
            <span className="hover:text-slate-400 transition cursor-pointer">Privacy</span>
            <span className="hover:text-slate-400 transition cursor-pointer">Help</span>
          </div>
        </div>
      </footer>

      {/* Dialog Modals */}
      <AddCourseModal isOpen={isAddCourseOpen} onClose={() => setIsAddCourseOpen(false)} />
      <AddReadingModal isOpen={isAddReadingOpen} onClose={() => setIsAddReadingOpen(false)} />
      <AddAssignmentModal isOpen={isAddAssignmentOpen} onClose={() => setIsAddAssignmentOpen(false)} />
      <LogTimeModal
        isOpen={isLogTimeOpen}
        onClose={() => setIsLogTimeOpen(false)}
        preselectedAssignmentId={selectedAssignmentForTime}
      />
    </div>
  );
}

