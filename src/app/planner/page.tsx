"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarRange,
  Sparkles,
  CheckCircle,
  Plus,
  Trash2,
  ListTodo,
  Loader2,
  CalendarCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlannerTask {
  id: number;
  text: string;
  completed: boolean;
}

interface WeekPlan {
  id: number;
  week: string;
  focus: string;
  tasks: PlannerTask[];
}

export default function SmartStudyPlanner() {
  const [examDate, setExamDate] = useState("2026-11-15");
  const [targetGrade, setTargetGrade] = useState("A+");
  const [intensity, setIntensity] = useState("Moderate");
  const [topicsText, setTopicsText] = useState("");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [roadmap, setRoadmap] = useState<WeekPlan[]>([
    {
      id: 1,
      week: "Week 1",
      focus: "Foundational Theory & Core Syntax",
      tasks: [
        { id: 11, text: "Read Chapter 1 & 2 of Operating Systems coursebook", completed: true },
        { id: 12, text: "Revise process management states and IPC models", completed: false },
        { id: 13, text: "Draft summary diagrams for CPU schedulers", completed: false },
      ],
    },
    {
      id: 2,
      week: "Week 2",
      focus: "Algorithmic Problems & Practical Coding",
      tasks: [
        { id: 21, text: "Solve Producer-Consumer deadlock coding questions", completed: false },
        { id: 22, text: "Complete semaphore implementation in C++", completed: false },
        { id: 23, text: "Attend tutorial on Readers-Writers priority problem", completed: false },
      ],
    },
    {
      id: 3,
      week: "Week 3",
      focus: "Revision & Past Exam Papers",
      tasks: [
        { id: 31, text: "Attempt 2024 & 2025 Midterm past papers", completed: false },
        { id: 32, text: "Review incorrect answers with AI Tutor chat", completed: false },
      ],
    },
  ]);

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    setTimeout(() => {
      const parsedTopics = topicsText
        ? topicsText.split(",").map((t) => t.trim())
        : ["Core Concepts", "Advanced Proofs", "Practice Exercises"];

      const mockNewRoadmap: WeekPlan[] = [
        {
          id: Date.now(),
          week: "Week 1",
          focus: `Introduction & Setup of: ${parsedTopics[0] || "Primary Topics"}`,
          tasks: [
            { id: Math.random(), text: `Review syllabus files and slides for ${parsedTopics[0]}`, completed: false },
            { id: Math.random(), text: `Draft quick-reference notes using AI Notes Gen`, completed: false },
          ],
        },
        {
          id: Date.now() + 1,
          week: "Week 2",
          focus: `Deep Dive into: ${parsedTopics[1] || "Secondary Concepts"}`,
          tasks: [
            { id: Math.random(), text: `Implement mock formulas and equations`, completed: false },
            { id: Math.random(), text: `Schedule a 2-hour study block for mock tests`, completed: false },
          ],
        },
        {
          id: Date.now() + 2,
          week: "Week 3",
          focus: "Final Revision & Speed Quizzes",
          tasks: [
            { id: Math.random(), text: `Generate summary index cards`, completed: false },
            { id: Math.random(), text: `Complete full sample paper in under 2 hours`, completed: false },
          ],
        },
      ];

      setRoadmap(mockNewRoadmap);
      setIsGenerating(false);
    }, 1800);
  };

  const handleToggleTask = (weekId: number, taskId: number) => {
    setRoadmap(
      roadmap.map((week) => {
        if (week.id === weekId) {
          return {
            ...week,
            tasks: week.tasks.map((task) => {
              if (task.id === taskId) {
                return { ...task, completed: !task.completed };
              }
              return task;
            }),
          };
        }
        return week;
      })
    );
  };

  const handleAddTask = (weekId: number, taskText: string) => {
    if (!taskText.trim()) return;
    setRoadmap(
      roadmap.map((week) => {
        if (week.id === weekId) {
          return {
            ...week,
            tasks: [
              ...week.tasks,
              { id: Date.now(), text: taskText.trim(), completed: false },
            ],
          };
        }
        return week;
      })
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-10"
    >
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <CalendarRange className="w-6 h-6 text-indigo-500" />
          Smart Study Planner
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Generate an optimized timeline customized to your exam schedule and academic goals.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Generator Form */}
        <div className="space-y-6">
          <form onSubmit={handleCreatePlan} className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/40 pb-3">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Configure Schedule
            </h2>

            {/* Exam Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Target Exam Date</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full bg-muted/40 text-sm rounded-xl px-4 py-2.5 border border-border/40 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
                required
              />
            </div>

            {/* Target Grade */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Target Grade</label>
              <select
                value={targetGrade}
                onChange={(e) => setTargetGrade(e.target.value)}
                className="w-full bg-muted/40 text-sm rounded-xl px-4 py-2.5 border border-border/40 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
              >
                <option value="A+">A+ (Perfect Score)</option>
                <option value="A">A (Honors)</option>
                <option value="B">B (Above Average)</option>
                <option value="C">C (Pass)</option>
              </select>
            </div>

            {/* Intensity */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Study Intensity</label>
              <div className="grid grid-cols-3 gap-2">
                {["Casual", "Moderate", "Intensive"].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setIntensity(lvl)}
                    className={cn(
                      "py-2 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer",
                      intensity === lvl
                        ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
                        : "bg-background border-border/40 hover:border-border/80 text-muted-foreground"
                    )}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Topics list */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Topics to Cover</label>
              <textarea
                value={topicsText}
                onChange={(e) => setTopicsText(e.target.value)}
                placeholder="e.g. CPU Scheduling, Virtual Memory, IPC (comma separated)"
                rows={3}
                className="w-full bg-muted/40 text-sm rounded-xl px-4 py-2.5 border border-border/40 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none resize-none"
              />
            </div>

            {/* Generate Button */}
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-50 font-semibold text-sm rounded-xl transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Roadmap...
                </>
              ) : (
                <>
                  <CalendarCheck className="w-4 h-4" />
                  Generate Study Plan
                </>
              )}
            </button>
          </form>

          {/* Tips card */}
          <div className="p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              Academic Insights
            </h3>
            <p className="text-[11px] text-muted-foreground leading-normal">
              Based on your selection of <strong>{intensity}</strong> intensity, the planner allocates roughly{" "}
              {intensity === "Casual" ? "6 hours" : intensity === "Moderate" ? "12 hours" : "20 hours"} of weekly study time. Ensure you review the material daily!
            </p>
          </div>
        </div>

        {/* Right Side: Roadmap Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {isGenerating ? (
            <div className="p-12 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
              <div>
                <h3 className="text-sm font-bold text-foreground">Assembling Visual Roadmap</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Scheduling lectures, calculating intensity patterns...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {roadmap.map((week, weekIdx) => {
                const finishedCount = week.tasks.filter((t) => t.completed).length;
                const progress = week.tasks.length > 0 ? Math.round((finishedCount / week.tasks.length) * 100) : 0;

                return (
                  <div
                    key={week.id}
                    className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm space-y-4 hover:border-border/60 transition-all"
                  >
                    {/* Week Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">
                          {week.week}
                        </span>
                        <h3 className="text-sm font-bold text-foreground leading-snug">
                          {week.focus}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-muted-foreground">{progress}% Complete</span>
                        <div className="w-20 bg-muted dark:bg-muted/30 h-1.5 rounded-full overflow-hidden border border-border/10">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Tasks Checklist */}
                    <div className="space-y-2">
                      {week.tasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => handleToggleTask(week.id, task.id)}
                          className={cn(
                            "p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center gap-3",
                            task.completed
                              ? "bg-muted/20 border-border/20 opacity-60 text-muted-foreground"
                              : "bg-card border-border/40 hover:border-indigo-500/20 hover:bg-muted/10 text-foreground"
                          )}
                        >
                          <div
                            className={cn(
                              "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                              task.completed ? "bg-indigo-500 border-indigo-500 text-white" : "border-muted-foreground/30 bg-background"
                            )}
                          >
                            {task.completed && <CheckCircle className="w-3.5 h-3.5 fill-indigo-500 stroke-white" />}
                          </div>
                          <span className={cn(task.completed && "line-through")}>{task.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Add Inline Custom Task */}
                    <div className="pt-2">
                      <input
                        type="text"
                        placeholder="Add sub-task for this week + Press Enter"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleAddTask(week.id, e.currentTarget.value);
                            e.currentTarget.value = "";
                          }
                        }}
                        className="w-full bg-muted/30 hover:bg-muted/50 text-[11px] rounded-xl px-3.5 py-2 border border-border/30 focus:border-indigo-500/30 focus:ring-1 focus:ring-indigo-500/10 outline-none transition-all"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}
